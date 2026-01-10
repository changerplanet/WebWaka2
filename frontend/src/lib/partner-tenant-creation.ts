/**
 * Partner Tenant Creation Service
 * 
 * Handles Partner-assisted tenant onboarding flow.
 * 
 * FLOW:
 * 1. Partner creates tenant in PENDING_ACTIVATION state
 * 2. Partner selects requested modules (POS, SVM, MVM)
 * 3. Attribution is created immediately (PARTNER_CREATED method)
 * 4. Tenant receives invitation to complete signup
 * 5. Tenant completes signup and payment
 * 6. SaaS Core activates tenant and provisions modules
 * 
 * CONSTRAINTS:
 * - Partner CANNOT bypass subscription rules
 * - Partner CANNOT activate modules without payment
 * - Tenant becomes first-class owner after signup
 * - Attribution is immutable from creation
 */

import { prisma } from './prisma'
import { TenantStatus, Tenant, PartnerReferral } from '@prisma/client'
import { getCurrentSession } from './auth'
import { requirePartnerOwner, requirePartnerAccess } from './partner-authorization'
import { createAttribution } from './partner-attribution'

// ============================================================================
// TYPES
// ============================================================================

export interface PartnerTenantCreateInput {
  // Tenant info
  name: string
  slug: string
  
  // Contact for invitation
  contactEmail: string
  contactName?: string
  
  // Requested modules
  requestedModules: ('POS' | 'SVM' | 'MVM')[]
  
  // Optional branding presets
  branding?: {
    appName?: string
    primaryColor?: string
    secondaryColor?: string
  }
  
  // Attribution window (null = lifetime)
  attributionWindowDays?: number | null
  
  // Additional metadata
  metadata?: Record<string, any>
}

export interface PartnerTenantCreateResult {
  success: boolean
  tenant?: Tenant
  referral?: PartnerReferral
  invitationUrl?: string
  error?: string
  code?: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'SLUG_EXISTS' | 'PARTNER_INACTIVE' | 'MODULE_INVALID'
}

export interface TenantActivationInput {
  tenantId: string
  userId: string  // The user who completed signup
  
  // Modules to actually activate (subset of requested)
  activatedModules: string[]
  
  // Payment reference (from subscription system)
  paymentReference?: string
}

export interface TenantActivationResult {
  success: boolean
  tenant?: Tenant
  error?: string
  code?: 'NOT_FOUND' | 'ALREADY_ACTIVE' | 'INVALID_STATUS' | 'PAYMENT_REQUIRED'
}

// ============================================================================
// AVAILABLE MODULES
// ============================================================================

export const AVAILABLE_MODULES = ['POS', 'SVM', 'MVM'] as const
export type ModuleType = typeof AVAILABLE_MODULES[number]

function validateModules(modules: string[]): boolean {
  return modules.every(m => AVAILABLE_MODULES.includes(m as ModuleType))
}

// ============================================================================
// PARTNER TENANT CREATION
// ============================================================================

/**
 * Partner creates a tenant in PENDING_ACTIVATION state
 * 
 * The tenant will need to complete signup and payment before activation.
 */
export async function createTenantByPartner(
  partnerId: string,
  input: PartnerTenantCreateInput
): Promise<PartnerTenantCreateResult> {
  // 1. Verify partner access (must be PARTNER_OWNER)
  const authResult = await requirePartnerOwner()
  if (!authResult.authorized) {
    return { 
      success: false, 
      error: authResult.error, 
      code: 'UNAUTHORIZED' 
    }
  }
  
  // Verify the partner ID matches the authenticated partner
  if (authResult.partner.id !== partnerId) {
    return {
      success: false,
      error: 'Cannot create tenant for a different partner',
      code: 'UNAUTHORIZED'
    }
  }
  
  // 2. Validate partner is active
  if (authResult.partner.status !== 'ACTIVE') {
    return {
      success: false,
      error: 'Partner must be active to create tenants',
      code: 'PARTNER_INACTIVE'
    }
  }
  
  // 3. Validate input
  if (!input.name || !input.slug || !input.contactEmail) {
    return {
      success: false,
      error: 'Name, slug, and contact email are required',
      code: 'INVALID_INPUT'
    }
  }
  
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(input.slug)) {
    return {
      success: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      code: 'INVALID_INPUT'
    }
  }
  
  // 4. Validate modules
  if (input.requestedModules.length === 0) {
    return {
      success: false,
      error: 'At least one module must be selected',
      code: 'INVALID_INPUT'
    }
  }
  
  if (!validateModules(input.requestedModules)) {
    return {
      success: false,
      error: `Invalid modules. Available: ${AVAILABLE_MODULES.join(', ')}`,
      code: 'MODULE_INVALID'
    }
  }
  
  // 5. Check slug availability
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: input.slug }
  })
  
  if (existingTenant) {
    return {
      success: false,
      error: 'A tenant with this slug already exists',
      code: 'SLUG_EXISTS'
    }
  }
  
  // 6. Create tenant and attribution in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create tenant in PENDING_ACTIVATION state
    const tenant = await tx.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        status: 'PENDING_ACTIVATION',
        requestedModules: input.requestedModules,
        activatedModules: [], // Empty until payment
        appName: input.branding?.appName || input.name,
        primaryColor: input.branding?.primaryColor || '#6366f1',
        secondaryColor: input.branding?.secondaryColor || '#8b5cf6'
      } as any
    })
    
    // Create subdomain for the tenant
    await tx.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        domain: input.slug,
        type: 'SUBDOMAIN',
        status: 'VERIFIED', // Subdomain is auto-verified
        isPrimary: true
      } as any
    })
    
    // Create attribution
    const referral = await tx.partnerReferral.create({
      data: {
        partnerId,
        tenantId: tenant.id,
        attributionMethod: 'PARTNER_CREATED',
        attributionWindowDays: input.attributionWindowDays,
        attributionExpiresAt: input.attributionWindowDays 
          ? new Date(Date.now() + input.attributionWindowDays * 24 * 60 * 60 * 1000)
          : null,
        referralSource: 'partner-portal',
        createdByUserId: authResult.user.id,
        metadata: {
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          requestedModules: input.requestedModules,
          partnerMetadata: input.metadata
        }
      } as any
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PARTNER_TENANT_CREATED',
        actorId: authResult.user.id,
        actorEmail: authResult.user.email || 'unknown',
        tenantId: tenant.id,
        targetType: 'Tenant',
        targetId: tenant.id,
        metadata: {
          partnerId,
          partnerName: authResult.partner.name,
          tenantSlug: tenant.slug,
          requestedModules: input.requestedModules,
          contactEmail: input.contactEmail,
          attributionWindowDays: input.attributionWindowDays
        }
      } as any
    })
    
    return { tenant, referral }
  })
  
  // Generate invitation URL (tenant will use this to complete signup)
  const invitationUrl = generateInvitationUrl(result.tenant.slug, input.contactEmail)
  
  return {
    success: true,
    tenant: result.tenant,
    referral: result.referral,
    invitationUrl
  }
}

/**
 * Generate invitation URL for tenant to complete signup
 */
function generateInvitationUrl(slug: string, email: string): string {
  // In production, this would include a secure token
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const encodedEmail = encodeURIComponent(email)
  return `${baseUrl}/signup/complete?tenant=${slug}&email=${encodedEmail}`
}

// ============================================================================
// TENANT ACTIVATION
// ============================================================================

/**
 * Activate a pending tenant after payment
 * 
 * Called by the subscription system after successful payment.
 * This is where modules actually get provisioned.
 */
export async function activateTenant(
  input: TenantActivationInput
): Promise<TenantActivationResult> {
  // 1. Get the tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    include: {
      partnerReferral: true
    }
  })
  
  if (!tenant) {
    return { success: false, error: 'Tenant not found', code: 'NOT_FOUND' }
  }
  
  // 2. Verify tenant is in PENDING_ACTIVATION state
  if (tenant.status === 'ACTIVE') {
    return { success: false, error: 'Tenant is already active', code: 'ALREADY_ACTIVE' }
  }
  
  if (tenant.status !== 'PENDING_ACTIVATION') {
    return { 
      success: false, 
      error: `Cannot activate tenant in ${tenant.status} status`, 
      code: 'INVALID_STATUS' 
    }
  }
  
  // 3. Validate activated modules are subset of requested
  const invalidModules = input.activatedModules.filter(
    m => !tenant.requestedModules.includes(m)
  )
  if (invalidModules.length > 0) {
    return {
      success: false,
      error: `Modules not in original request: ${invalidModules.join(', ')}`,
      code: 'INVALID_STATUS'
    }
  }
  
  // 4. Activate tenant in transaction
  const activatedTenant = await prisma.$transaction(async (tx) => {
    // Update tenant status and modules
    const updated = await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        status: 'ACTIVE',
        activatedModules: input.activatedModules,
        activatedAt: new Date()
      }
    })
    
    // Create tenant admin membership for the user
    await tx.tenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: input.userId,
          tenantId: input.tenantId
        }
      },
      create: {
        userId: input.userId,
        tenantId: input.tenantId,
        role: 'TENANT_ADMIN',
        isActive: true
      },
      update: {
        role: 'TENANT_ADMIN',
        isActive: true
      }
    })
    
    // Lock attribution (first successful billing)
    if (tenant.partnerReferral) {
      await tx.partnerReferral.update({
        where: { tenantId: input.tenantId },
        data: {
          attributionLocked: true,
          lockedAt: new Date()
        }
      })
      
      // Audit attribution lock
      await tx.auditLog.create({
        data: {
          action: 'ATTRIBUTION_LOCKED',
          actorId: 'subscription-system',
          actorEmail: 'billing@webwaka.internal',
          tenantId: input.tenantId,
          targetType: 'PartnerReferral',
          targetId: tenant.partnerReferral.id,
          metadata: {
            partnerId: tenant.partnerReferral.partnerId,
            reason: 'first_payment',
            paymentReference: input.paymentReference
          }
        }
      })
    }
    
    // Audit tenant activation
    await tx.auditLog.create({
      data: {
        action: 'PARTNER_TENANT_ACTIVATED',
        actorId: input.userId,
        actorEmail: 'system',
        tenantId: input.tenantId,
        targetType: 'Tenant',
        targetId: input.tenantId,
        metadata: {
          activatedModules: input.activatedModules,
          requestedModules: tenant.requestedModules,
          paymentReference: input.paymentReference,
          partnerId: tenant.partnerReferral?.partnerId
        }
      }
    })
    
    return updated
  })
  
  return { success: true, tenant: activatedTenant }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get pending tenants created by a partner
 */
export async function getPendingTenantsByPartner(
  partnerId: string
): Promise<Tenant[]> {
  // Verify partner access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return []
  }
  
  const referrals = await prisma.partnerReferral.findMany({
    where: {
      partnerId,
      attributionMethod: 'PARTNER_CREATED',
      tenant: {
        status: 'PENDING_ACTIVATION'
      }
    },
    include: {
      Tenant: true
    }
  })
  
  return referrals.map(r => r.tenant)
}

/**
 * Get all tenants created by a partner (any status)
 */
export async function getTenantsByPartner(
  partnerId: string,
  options?: {
    status?: TenantStatus[]
    limit?: number
    offset?: number
  }
): Promise<{ tenants: Tenant[]; total: number }> {
  // Verify partner access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return { tenants: [], total: 0 }
  }
  
  const where: any = {
    partnerId,
    attributionMethod: 'PARTNER_CREATED'
  }
  
  if (options?.status) {
    where.tenant = { status: { in: options.status } }
  }
  
  const [referrals, total] = await Promise.all([
    prisma.partnerReferral.findMany({
      where,
      include: {
        Tenant: true
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.partnerReferral.count({ where })
  ])
  
  return {
    tenants: referrals.map(r => r.tenant),
    total
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PARTNER_TENANT_CONSTRAINTS = {
  // Partner cannot bypass subscription rules
  REQUIRES_PAYMENT: true,
  
  // Partner cannot activate modules directly
  CANNOT_ACTIVATE_MODULES: true,
  
  // Tenant owns their data after creation
  TENANT_OWNS_DATA: true,
  
  // Attribution is set at creation time
  IMMEDIATE_ATTRIBUTION: true,
  
  // Status flow: PENDING_ACTIVATION -> (payment) -> ACTIVE
  STATUS_FLOW: ['PENDING_ACTIVATION', 'ACTIVE'] as const
} as const
