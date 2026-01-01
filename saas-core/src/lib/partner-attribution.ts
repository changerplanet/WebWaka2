/**
 * Partner Attribution Service
 * 
 * Handles Partner-to-Tenant attribution with strict immutability rules.
 * 
 * ATTRIBUTION RULES:
 * 1. A tenant can have AT MOST one attribution (partner referral)
 * 2. Attribution is IMMUTABLE once created
 * 3. Attribution becomes LOCKED after first successful billing
 * 4. Locked attributions can NEVER be modified or deleted
 * 5. No retroactive reassignment is allowed
 * 
 * ATTRIBUTION METHODS:
 * - PARTNER_CREATED: Partner directly created the tenant
 * - REFERRAL_LINK: Tenant signed up via referral code/link
 * - MANUAL_ASSIGNMENT: Super Admin assignment (rare, fully audited)
 * 
 * ATTRIBUTION WINDOW:
 * - null (default): Lifetime attribution - partner earns forever
 * - N days: Time-bound - partner earns only within window
 */

import { prisma } from './prisma'
import { AttributionMethod, PartnerReferral, Tenant, Partner } from '@prisma/client'
import { getCurrentSession } from './auth'

// ============================================================================
// TYPES
// ============================================================================

export interface AttributionResult {
  success: boolean
  referral?: PartnerReferral
  error?: string
  code?: 'ALREADY_ATTRIBUTED' | 'PARTNER_INACTIVE' | 'INVALID_CODE' | 'LOCKED' | 'NOT_FOUND' | 'UNAUTHORIZED'
}

export interface AttributionInput {
  tenantId: string
  partnerId: string
  method: AttributionMethod
  referralCodeId?: string | null
  referralSource?: string | null
  landingPage?: string | null
  attributionWindowDays?: number | null  // null = lifetime
  metadata?: Record<string, any> | null
}

export interface AttributionValidation {
  valid: boolean
  error?: string
  code?: string
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a tenant already has attribution
 */
export async function hasExistingAttribution(tenantId: string): Promise<boolean> {
  const existing = await prisma.partnerReferral.findUnique({
    where: { tenantId }
  })
  return !!existing
}

/**
 * Check if an attribution is locked (immutable)
 */
export async function isAttributionLocked(tenantId: string): Promise<boolean> {
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { attributionLocked: true }
  })
  return referral?.attributionLocked ?? false
}

/**
 * Validate attribution can be created
 */
export async function validateAttribution(input: AttributionInput): Promise<AttributionValidation> {
  // 1. Check tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true, status: true }
  })
  
  if (!tenant) {
    return { valid: false, error: 'Tenant not found', code: 'NOT_FOUND' }
  }
  
  // 2. Check tenant doesn't already have attribution
  const existingAttribution = await hasExistingAttribution(input.tenantId)
  if (existingAttribution) {
    return { 
      valid: false, 
      error: 'Tenant already has attribution. Attribution is immutable.', 
      code: 'ALREADY_ATTRIBUTED' 
    }
  }
  
  // 3. Check partner exists and is active
  const partner = await prisma.partner.findUnique({
    where: { id: input.partnerId },
    select: { id: true, status: true }
  })
  
  if (!partner) {
    return { valid: false, error: 'Partner not found', code: 'NOT_FOUND' }
  }
  
  if (partner.status !== 'ACTIVE') {
    return { 
      valid: false, 
      error: 'Partner is not active. Only active partners can receive attribution.', 
      code: 'PARTNER_INACTIVE' 
    }
  }
  
  // 4. Validate referral code if provided
  if (input.referralCodeId) {
    const code = await prisma.partnerReferralCode.findUnique({
      where: { id: input.referralCodeId },
      select: { 
        partnerId: true, 
        isActive: true, 
        usageLimit: true, 
        usageCount: true,
        expiresAt: true 
      }
    })
    
    if (!code) {
      return { valid: false, error: 'Referral code not found', code: 'INVALID_CODE' }
    }
    
    if (code.partnerId !== input.partnerId) {
      return { valid: false, error: 'Referral code does not belong to this partner', code: 'INVALID_CODE' }
    }
    
    if (!code.isActive) {
      return { valid: false, error: 'Referral code is inactive', code: 'INVALID_CODE' }
    }
    
    if (code.usageLimit && code.usageCount >= code.usageLimit) {
      return { valid: false, error: 'Referral code has reached usage limit', code: 'INVALID_CODE' }
    }
    
    if (code.expiresAt && code.expiresAt < new Date()) {
      return { valid: false, error: 'Referral code has expired', code: 'INVALID_CODE' }
    }
  }
  
  return { valid: true }
}

// ============================================================================
// ATTRIBUTION CREATION
// ============================================================================

/**
 * Create attribution link between Partner and Tenant
 * 
 * This is the primary function for establishing attribution.
 * Attribution is IMMUTABLE once created.
 */
export async function createAttribution(input: AttributionInput): Promise<AttributionResult> {
  const session = await getCurrentSession()
  
  // Validate attribution
  const validation = await validateAttribution(input)
  if (!validation.valid) {
    return { 
      success: false, 
      error: validation.error, 
      code: validation.code as AttributionResult['code']
    }
  }
  
  // Calculate attribution expiry if window is set
  let attributionExpiresAt: Date | null = null
  if (input.attributionWindowDays) {
    attributionExpiresAt = new Date()
    attributionExpiresAt.setDate(attributionExpiresAt.getDate() + input.attributionWindowDays)
  }
  
  // Create attribution in transaction
  const referral = await prisma.$transaction(async (tx) => {
    // Create the attribution record
    const newReferral = await tx.partnerReferral.create({
      data: {
        partnerId: input.partnerId,
        tenantId: input.tenantId,
        referralCodeId: input.referralCodeId,
        attributionMethod: input.method,
        attributionWindowDays: input.attributionWindowDays,
        attributionExpiresAt,
        referralSource: input.referralSource,
        landingPage: input.landingPage,
        metadata: input.metadata ?? undefined,
        createdByUserId: session?.user?.id,
        attributionLocked: false // Will be locked after first billing
      }
    })
    
    // Increment referral code usage if used
    if (input.referralCodeId) {
      await tx.partnerReferralCode.update({
        where: { id: input.referralCodeId },
        data: { usageCount: { increment: 1 } }
      })
    }
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'ATTRIBUTION_CREATED',
        actorId: session?.user?.id || 'system',
        actorEmail: session?.user?.email || 'system@saascore.internal',
        tenantId: input.tenantId,
        targetType: 'PartnerReferral',
        targetId: newReferral.id,
        metadata: {
          partnerId: input.partnerId,
          method: input.method,
          referralCodeId: input.referralCodeId,
          attributionWindowDays: input.attributionWindowDays,
          isLifetime: !input.attributionWindowDays
        }
      }
    })
    
    return newReferral
  })
  
  return { success: true, referral }
}

/**
 * Create attribution via referral code
 * 
 * Used when a tenant signs up using a referral code/link
 */
export async function createAttributionByCode(
  tenantId: string,
  code: string,
  options?: {
    referralSource?: string
    landingPage?: string
    metadata?: Record<string, any>
  }
): Promise<AttributionResult> {
  // Look up the code
  const referralCode = await prisma.partnerReferralCode.findUnique({
    where: { code },
    select: { 
      id: true, 
      partnerId: true,
      partner: {
        select: {
          agreements: {
            where: { status: 'ACTIVE' },
            select: { commissionType: true }
          }
        }
      }
    }
  })
  
  if (!referralCode) {
    return { success: false, error: 'Invalid referral code', code: 'INVALID_CODE' }
  }
  
  return createAttribution({
    tenantId,
    partnerId: referralCode.partnerId,
    method: 'REFERRAL_LINK',
    referralCodeId: referralCode.id,
    referralSource: options?.referralSource,
    landingPage: options?.landingPage,
    metadata: options?.metadata
  })
}

// ============================================================================
// ATTRIBUTION LOCKING
// ============================================================================

/**
 * Lock attribution after first successful billing
 * 
 * Once locked, the attribution can NEVER be modified or deleted.
 * This should be called by the billing system after first payment.
 */
export async function lockAttribution(tenantId: string): Promise<AttributionResult> {
  const session = await getCurrentSession()
  
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId }
  })
  
  if (!referral) {
    return { success: false, error: 'Attribution not found', code: 'NOT_FOUND' }
  }
  
  if (referral.attributionLocked) {
    // Already locked - this is fine, just return success
    return { success: true, referral }
  }
  
  const updatedReferral = await prisma.$transaction(async (tx) => {
    const updated = await tx.partnerReferral.update({
      where: { tenantId },
      data: {
        attributionLocked: true,
        lockedAt: new Date()
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'ATTRIBUTION_LOCKED',
        actorId: session?.user?.id || 'billing-system',
        actorEmail: session?.user?.email || 'billing@saascore.internal',
        tenantId,
        targetType: 'PartnerReferral',
        targetId: updated.id,
        metadata: {
          partnerId: updated.partnerId,
          lockedAt: updated.lockedAt
        }
      }
    })
    
    return updated
  })
  
  return { success: true, referral: updatedReferral }
}

// ============================================================================
// ATTRIBUTION QUERIES
// ============================================================================

/**
 * Get attribution for a tenant
 */
export async function getAttributionForTenant(tenantId: string): Promise<PartnerReferral | null> {
  return prisma.partnerReferral.findUnique({
    where: { tenantId },
    include: {
      partner: {
        select: { id: true, name: true, slug: true, status: true }
      },
      referralCode: {
        select: { id: true, code: true, campaignName: true }
      }
    }
  })
}

/**
 * Get all attributions for a partner
 */
export async function getAttributionsForPartner(
  partnerId: string,
  options?: {
    includeExpired?: boolean
    limit?: number
    offset?: number
  }
): Promise<{ referrals: PartnerReferral[]; total: number }> {
  const where: any = { partnerId }
  
  // Filter out expired attributions by default
  if (!options?.includeExpired) {
    where.OR = [
      { attributionExpiresAt: null },  // Lifetime
      { attributionExpiresAt: { gte: new Date() } }  // Not expired
    ]
  }
  
  const [referrals, total] = await Promise.all([
    prisma.partnerReferral.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, status: true, createdAt: true }
        }
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { referredAt: 'desc' }
    }),
    prisma.partnerReferral.count({ where })
  ])
  
  return { referrals, total }
}

/**
 * Check if attribution is still valid for earnings
 */
export async function isAttributionValidForEarnings(tenantId: string): Promise<boolean> {
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { 
      attributionExpiresAt: true,
      partner: { select: { status: true } }
    }
  })
  
  if (!referral) return false
  
  // Partner must be active
  if (referral.partner.status !== 'ACTIVE') return false
  
  // Check if within attribution window
  if (referral.attributionExpiresAt && referral.attributionExpiresAt < new Date()) {
    return false
  }
  
  return true
}

// ============================================================================
// PROTECTION FUNCTIONS
// ============================================================================

/**
 * Prevent modification of locked attribution
 * 
 * Call this before any operation that might modify attribution
 */
export async function assertAttributionModifiable(tenantId: string): Promise<void> {
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { attributionLocked: true, lockedAt: true }
  })
  
  if (referral?.attributionLocked) {
    // Log the attempted modification
    const session = await getCurrentSession()
    await prisma.auditLog.create({
      data: {
        action: 'ATTRIBUTION_LOCK_ATTEMPTED',
        actorId: session?.user?.id || 'unknown',
        actorEmail: session?.user?.email || 'unknown',
        tenantId,
        targetType: 'PartnerReferral',
        metadata: {
          attemptedAction: 'modify',
          lockedAt: referral.lockedAt,
          blockedAt: new Date()
        }
      }
    })
    
    throw new AttributionLockedError(
      `Attribution for tenant ${tenantId} is locked and cannot be modified. ` +
      `It was locked at ${referral.lockedAt?.toISOString()}.`
    )
  }
}

/**
 * Prevent reassignment of attribution
 * 
 * Even unlocked attributions cannot be reassigned to a different partner
 */
export async function assertNoReassignment(tenantId: string, newPartnerId: string): Promise<void> {
  const existingReferral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { partnerId: true }
  })
  
  if (existingReferral && existingReferral.partnerId !== newPartnerId) {
    // Log the attempted reassignment
    const session = await getCurrentSession()
    await prisma.auditLog.create({
      data: {
        action: 'ATTRIBUTION_REASSIGN_BLOCKED',
        actorId: session?.user?.id || 'unknown',
        actorEmail: session?.user?.email || 'unknown',
        tenantId,
        targetType: 'PartnerReferral',
        metadata: {
          existingPartnerId: existingReferral.partnerId,
          attemptedNewPartnerId: newPartnerId,
          blockedAt: new Date()
        }
      }
    })
    
    throw new AttributionReassignmentError(
      `Tenant ${tenantId} is already attributed to partner ${existingReferral.partnerId}. ` +
      `Reassignment to partner ${newPartnerId} is not allowed.`
    )
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export class AttributionLockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttributionLockedError'
  }
}

export class AttributionReassignmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttributionReassignmentError'
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ATTRIBUTION_RULES = {
  // Attribution is immutable once created
  IMMUTABLE: true,
  
  // Attribution locks after first billing
  LOCKS_AFTER_BILLING: true,
  
  // No retroactive reassignment allowed
  NO_REASSIGNMENT: true,
  
  // Default attribution window (null = lifetime)
  DEFAULT_WINDOW_DAYS: null as number | null,
  
  // Supported attribution methods
  METHODS: ['PARTNER_CREATED', 'REFERRAL_LINK', 'MANUAL_ASSIGNMENT'] as const
} as const
