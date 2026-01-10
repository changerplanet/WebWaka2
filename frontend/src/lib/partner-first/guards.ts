/**
 * PHASE 4A: Partner-First Guards
 * 
 * Policy enforcement to ensure Partners are the ONLY operators of client platforms.
 * WebWaka never sells directly to end users.
 * 
 * GUARDS:
 * 1. Tenant creation requires partner context
 * 2. All tenants must have immutable partnerId
 * 3. Public signup cannot create tenants
 * 
 * EXCEPTIONS:
 * - SUPER_ADMIN can create tenants ONLY via WebWaka internal partner
 */

import { prisma } from '../prisma'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * WebWaka's internal partner account slug
 * Used for demos, pilots, and government projects
 */
export const WEBWAKA_INTERNAL_PARTNER_SLUG = 'webwaka-digital-services'

/**
 * Phase 4A policy constants
 */
export const PHASE_4A_POLICY = {
  // All tenants must be created by a partner
  PARTNER_ONLY_TENANT_CREATION: true,
  
  // Partner ID is immutable after tenant creation
  IMMUTABLE_PARTNER_ATTRIBUTION: true,
  
  // Public signup cannot create tenants
  PUBLIC_SIGNUP_BLOCKED: true,
  
  // WebWaka internal partner is a normal partner
  WEBWAKA_PARTNER_NO_PRIVILEGES: true,
} as const

// ============================================================================
// TYPES
// ============================================================================

export type TenantCreatorType = 'PARTNER' | 'PUBLIC_SIGNUP' | 'SUPER_ADMIN'

export interface TenantCreationContext {
  creatorType: TenantCreatorType
  partnerId?: string
  userId: string
  userGlobalRole: string
}

export interface GuardResult {
  allowed: boolean
  error?: string
  errorCode?: string
  partnerId?: string
}

// ============================================================================
// GUARD: PARTNER-ONLY TENANT CREATION
// ============================================================================

/**
 * Enforce that only Partners can create tenants.
 * 
 * RULES:
 * - PARTNER: Must provide valid partnerId
 * - PUBLIC_SIGNUP: BLOCKED (must go through partner)
 * - SUPER_ADMIN: Only allowed via WebWaka internal partner
 */
export async function guardPartnerOnlyTenantCreation(
  context: TenantCreationContext
): Promise<GuardResult> {
  // PUBLIC_SIGNUP is never allowed
  if (context.creatorType === 'PUBLIC_SIGNUP') {
    return {
      allowed: false,
      error: 'Tenant creation requires a partner. Please contact a WebWaka partner to get started.',
      errorCode: 'TENANT_CREATION_REQUIRES_PARTNER',
    }
  }
  
  // PARTNER must provide valid partnerId
  if (context.creatorType === 'PARTNER') {
    if (!context.partnerId) {
      return {
        allowed: false,
        error: 'Partner ID is required for tenant creation',
        errorCode: 'PARTNER_ID_REQUIRED',
      }
    }
    
    // Verify partner exists and is active
    const partner = await prisma.partner.findUnique({
      where: { id: context.partnerId },
      select: { id: true, status: true, name: true }
    })
    
    if (!partner) {
      return {
        allowed: false,
        error: 'Partner not found',
        errorCode: 'PARTNER_NOT_FOUND',
      }
    }
    
    if (partner.status !== 'ACTIVE') {
      return {
        allowed: false,
        error: 'Partner must be active to create tenants',
        errorCode: 'PARTNER_NOT_ACTIVE',
      }
    }
    
    return {
      allowed: true,
      partnerId: partner.id,
    }
  }
  
  // SUPER_ADMIN must use WebWaka internal partner
  if (context.creatorType === 'SUPER_ADMIN') {
    // Get or create WebWaka internal partner
    const webwakaPartner = await getOrCreateWebWakaPartner()
    
    if (!webwakaPartner) {
      return {
        allowed: false,
        error: 'WebWaka internal partner not configured',
        errorCode: 'WEBWAKA_PARTNER_MISSING',
      }
    }
    
    return {
      allowed: true,
      partnerId: webwakaPartner.id,
    }
  }
  
  // Default deny
  return {
    allowed: false,
    error: 'Invalid tenant creation context',
    errorCode: 'INVALID_CONTEXT',
  }
}

// ============================================================================
// GUARD: IMMUTABLE PARTNER ATTRIBUTION
// ============================================================================

/**
 * Prevent changing a tenant's partner attribution after creation.
 * 
 * EXCEPTIONS:
 * - SUPER_ADMIN can reassign ONLY with audit log (rare, emergency only)
 */
export async function guardImmutablePartnerAttribution(
  tenantId: string,
  newPartnerId: string,
  requestorGlobalRole: string
): Promise<GuardResult> {
  // Get tenant's current partner
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { 
      id: true, 
      partnerReferral: {
        select: { partnerId: true }
      }
    }
  })
  
  if (!tenant) {
    return {
      allowed: false,
      error: 'Tenant not found',
      errorCode: 'TENANT_NOT_FOUND',
    }
  }
  
  const currentPartnerId = tenant.partnerReferral?.partnerId
  
  // If no partner assigned, allow assignment
  if (!currentPartnerId) {
    return { allowed: true, partnerId: newPartnerId }
  }
  
  // If same partner, allow (no change)
  if (currentPartnerId === newPartnerId) {
    return { allowed: true, partnerId: currentPartnerId }
  }
  
  // Different partner - only SUPER_ADMIN with audit
  if (requestorGlobalRole !== 'SUPER_ADMIN') {
    return {
      allowed: false,
      error: 'Partner attribution cannot be changed after tenant creation',
      errorCode: 'PARTNER_ATTRIBUTION_IMMUTABLE',
    }
  }
  
  // SUPER_ADMIN can reassign but will be audit logged
  console.warn(`[PHASE_4A_AUDIT] SUPER_ADMIN reassigning tenant ${tenantId} from partner ${currentPartnerId} to ${newPartnerId}`)
  
  return {
    allowed: true,
    partnerId: newPartnerId,
  }
}

// ============================================================================
// GUARD: PUBLIC SIGNUP FLOW
// ============================================================================

/**
 * Guard for public signup flow.
 * Phase 4A: Public signup CANNOT create tenants.
 * 
 * OPTIONS FOR USERS:
 * 1. Go through a partner (get referral link)
 * 2. Become a partner themselves
 * 3. Contact WebWaka for enterprise deals (handled by WebWaka partner)
 */
export function guardPublicSignup(): GuardResult {
  if (PHASE_4A_POLICY.PUBLIC_SIGNUP_BLOCKED) {
    return {
      allowed: false,
      error: 'To get started with WebWaka, please contact a certified partner or apply to become a partner.',
      errorCode: 'PUBLIC_SIGNUP_REQUIRES_PARTNER',
    }
  }
  
  return { allowed: true }
}

/**
 * Check if a signup session has valid partner context
 */
export async function validateSignupPartnerContext(
  referralCode?: string,
  partnerId?: string
): Promise<GuardResult> {
  // Must have either referral code or partner ID
  if (!referralCode && !partnerId) {
    return {
      allowed: false,
      error: 'Partner referral required. Please use a partner referral link to sign up.',
      errorCode: 'PARTNER_REFERRAL_REQUIRED',
    }
  }
  
  // Validate referral code
  if (referralCode) {
    const code = await prisma.partnerReferralCode.findUnique({
      where: { code: referralCode },
      include: {
        Partner: {
          select: { id: true, status: true }
        }
      }
    })
    
    if (!code || !code.isActive) {
      return {
        allowed: false,
        error: 'Invalid or inactive referral code',
        errorCode: 'INVALID_REFERRAL_CODE',
      }
    }
    
    if (code.partner.status !== 'ACTIVE') {
      return {
        allowed: false,
        error: 'Partner is not active',
        errorCode: 'PARTNER_NOT_ACTIVE',
      }
    }
    
    return {
      allowed: true,
      partnerId: code.partnerId,
    }
  }
  
  // Validate partner ID directly
  if (partnerId) {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true, status: true }
    })
    
    if (!partner || partner.status !== 'ACTIVE') {
      return {
        allowed: false,
        error: 'Invalid or inactive partner',
        errorCode: 'INVALID_PARTNER',
      }
    }
    
    return {
      allowed: true,
      partnerId: partner.id,
    }
  }
  
  return {
    allowed: false,
    error: 'Partner context required',
    errorCode: 'PARTNER_CONTEXT_REQUIRED',
  }
}

// ============================================================================
// WEBWAKA INTERNAL PARTNER
// ============================================================================

/**
 * Get or create the WebWaka internal partner account.
 * 
 * This partner is used for:
 * - Demos and pilots
 * - Government projects
 * - Direct enterprise deals
 * 
 * It has NO special privileges - it's a normal partner.
 */
export async function getOrCreateWebWakaPartner(): Promise<{ id: string; name: string } | null> {
  // Try to find existing
  let partner = await prisma.partner.findUnique({
    where: { slug: WEBWAKA_INTERNAL_PARTNER_SLUG },
    select: { id: true, name: true }
  })
  
  if (partner) {
    return partner
  }
  
  // Create if doesn't exist
  try {
    partner = await prisma.partner.create({
      data: {
        name: 'WebWaka Digital Services',
        slug: WEBWAKA_INTERNAL_PARTNER_SLUG,
        status: 'ACTIVE',
        email: 'partners@webwaka.com',
        metadata: {
          isInternalPartner: true,
          description: 'WebWaka internal partner for demos, pilots, and government projects',
          createdBy: 'PHASE_4A_MIGRATION',
        }
      },
      select: { id: true, name: true }
    })
    
    console.log(`[PHASE_4A] Created WebWaka internal partner: ${partner.id}`)
    return partner
  } catch (error) {
    console.error('[PHASE_4A] Failed to create WebWaka internal partner:', error)
    return null
  }
}

/**
 * Check if a partner is the WebWaka internal partner
 */
export async function isWebWakaInternalPartner(partnerId: string): Promise<boolean> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { slug: true }
  })
  
  return partner?.slug === WEBWAKA_INTERNAL_PARTNER_SLUG
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine tenant creator type from context
 */
export function determineTenantCreatorType(
  userGlobalRole: string,
  isPartnerUser: boolean,
  hasPartnerContext: boolean
): TenantCreatorType {
  if (userGlobalRole === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN'
  }
  
  if (isPartnerUser && hasPartnerContext) {
    return 'PARTNER'
  }
  
  return 'PUBLIC_SIGNUP'
}

/**
 * Get user-friendly message for partner requirement
 */
export function getPartnerRequirementMessage(): {
  title: string
  message: string
  options: { label: string; href: string }[]
} {
  return {
    title: 'Partner Required',
    message: 'WebWaka works through certified partners who provide setup, training, and support. Choose an option below to get started.',
    options: [
      {
        label: 'Find a Partner',
        href: '/partners/directory',
      },
      {
        label: 'Become a Partner',
        href: '/partners/apply',
      },
      {
        label: 'Contact WebWaka',
        href: '/contact',
      },
    ],
  }
}
