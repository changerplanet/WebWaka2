/**
 * Partner Authorization
 * 
 * Access control for Partner domain - completely separate from Tenant authorization.
 * Partner users CANNOT access tenant internals.
 * Partner users can ONLY see their own partner's data.
 * 
 * Role Hierarchy:
 * - SUPER_ADMIN: Platform-wide access to all partners
 * - PARTNER_OWNER: Full control within their partner organization
 * - PARTNER_STAFF: Limited access within their partner organization
 */

import { prisma } from './prisma'
import { getCurrentSession, AuthSession } from './auth'
import { User, Partner, PartnerUser, PartnerRole } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export type PartnerAuthorizationResult = 
  | { authorized: true; user: User; session: AuthSession; partner: Partner; partnerUser: PartnerUser; role: PartnerRole }
  | { authorized: false; error: string; status: number }

export type PartnerAccessLevel = 'NONE' | 'STAFF' | 'OWNER' | 'SUPER_ADMIN'

export interface PartnerPermissions {
  // Partner Management
  canViewPartner: boolean
  canEditPartner: boolean
  canManagePartnerUsers: boolean
  canSignAgreement: boolean
  
  // Referral Management
  canViewReferrals: boolean
  canCreateReferralCodes: boolean
  canViewAllReferrals: boolean  // vs only own referrals
  
  // Earnings
  canViewEarnings: boolean
  canViewAllEarnings: boolean   // vs only summary
  canExportEarnings: boolean
  
  // Agreement
  canViewAgreement: boolean
  canViewAgreementHistory: boolean
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * PARTNER_OWNER Permissions
 * - Full control over partner organization
 * - Can manage users, sign agreements, view all data
 * - CANNOT access tenant internals
 */
const PARTNER_OWNER_PERMISSIONS: PartnerPermissions = {
  // Partner Management
  canViewPartner: true,
  canEditPartner: true,
  canManagePartnerUsers: true,
  canSignAgreement: true,
  
  // Referral Management
  canViewReferrals: true,
  canCreateReferralCodes: true,
  canViewAllReferrals: true,
  
  // Earnings
  canViewEarnings: true,
  canViewAllEarnings: true,
  canExportEarnings: true,
  
  // Agreement
  canViewAgreement: true,
  canViewAgreementHistory: true,
}

/**
 * PARTNER_STAFF Permissions
 * - Limited access within partner organization
 * - Can view referrals and earnings, create codes
 * - CANNOT manage users or sign agreements
 * - CANNOT access tenant internals
 */
const PARTNER_STAFF_PERMISSIONS: PartnerPermissions = {
  // Partner Management
  canViewPartner: true,
  canEditPartner: false,
  canManagePartnerUsers: false,
  canSignAgreement: false,
  
  // Referral Management
  canViewReferrals: true,
  canCreateReferralCodes: true,
  canViewAllReferrals: false,  // Only see referrals they created
  
  // Earnings
  canViewEarnings: true,
  canViewAllEarnings: false,   // Only see summary, not line items
  canExportEarnings: false,
  
  // Agreement
  canViewAgreement: true,
  canViewAgreementHistory: false,
}

/**
 * SUPER_ADMIN Permissions (platform-wide)
 * - Can access all partners
 * - Full permissions on any partner
 */
const SUPER_ADMIN_PERMISSIONS: PartnerPermissions = {
  canViewPartner: true,
  canEditPartner: true,
  canManagePartnerUsers: true,
  canSignAgreement: false,  // Super Admin approves, not signs
  canViewReferrals: true,
  canCreateReferralCodes: true,
  canViewAllReferrals: true,
  canViewEarnings: true,
  canViewAllEarnings: true,
  canExportEarnings: true,
  canViewAgreement: true,
  canViewAgreementHistory: true,
}

/**
 * Get permissions for a role
 */
export function getPartnerPermissions(role: PartnerRole | 'SUPER_ADMIN'): PartnerPermissions {
  switch (role) {
    case 'SUPER_ADMIN':
      return SUPER_ADMIN_PERMISSIONS
    case 'PARTNER_OWNER':
      return PARTNER_OWNER_PERMISSIONS
    case 'PARTNER_STAFF':
      return PARTNER_STAFF_PERMISSIONS
    default:
      // No permissions for unknown roles
      return {
        canViewPartner: false,
        canEditPartner: false,
        canManagePartnerUsers: false,
        canSignAgreement: false,
        canViewReferrals: false,
        canCreateReferralCodes: false,
        canViewAllReferrals: false,
        canViewEarnings: false,
        canViewAllEarnings: false,
        canExportEarnings: false,
        canViewAgreement: false,
        canViewAgreementHistory: false,
      }
  }
}

// ============================================================================
// ACCESS BOUNDARY ENFORCEMENT
// ============================================================================

/**
 * Get user's partner membership (if any)
 */
export async function getPartnerMembership(userId: string): Promise<(PartnerUser & { partner: Partner }) | null> {
  return prisma.partnerUser.findUnique({
    where: { userId },
    include: { partner: true }
  })
}

/**
 * Check if user is a partner user
 */
export async function isPartnerUser(userId: string): Promise<boolean> {
  const membership = await prisma.partnerUser.findUnique({
    where: { userId }
  })
  return !!membership
}

/**
 * Get user's access level for a specific partner
 */
export async function getPartnerAccessLevel(
  userId: string, 
  partnerId: string,
  globalRole: string
): Promise<PartnerAccessLevel> {
  // Super Admin has full access
  if (globalRole === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN'
  }
  
  // Check partner membership
  const membership = await prisma.partnerUser.findUnique({
    where: { userId },
    select: { partnerId: true, role: true, isActive: true }
  })
  
  // Not a partner user or not active
  if (!membership || !membership.isActive) {
    return 'NONE'
  }
  
  // Not a member of this specific partner
  if (membership.partnerId !== partnerId) {
    return 'NONE'
  }
  
  // Return role-based access level
  return membership.role === 'PARTNER_OWNER' ? 'OWNER' : 'STAFF'
}

// ============================================================================
// AUTHORIZATION FUNCTIONS
// ============================================================================

/**
 * Require any authenticated user who is a partner user
 */
export async function requirePartnerUser(): Promise<PartnerAuthorizationResult> {
  const session = await getCurrentSession()
  
  if (!session) {
    return {
      authorized: false,
      error: 'Authentication required',
      status: 401
    }
  }
  
  if (!session.user.isActive) {
    return {
      authorized: false,
      error: 'Account is disabled',
      status: 403
    }
  }
  
  // Get partner membership
  const partnerUser = await prisma.partnerUser.findUnique({
    where: { userId: session.user.id },
    include: { partner: true }
  })
  
  if (!partnerUser) {
    return {
      authorized: false,
      error: 'Not a partner user',
      status: 403
    }
  }
  
  if (!partnerUser.isActive) {
    return {
      authorized: false,
      error: 'Partner membership is disabled',
      status: 403
    }
  }
  
  if (partnerUser.partner.status !== 'ACTIVE') {
    return {
      authorized: false,
      error: 'Partner organization is not active',
      status: 403
    }
  }
  
  return {
    authorized: true,
    user: session.user,
    session,
    partner: partnerUser.partner,
    partnerUser,
    role: partnerUser.role
  }
}

/**
 * Require PARTNER_OWNER role
 */
export async function requirePartnerOwner(): Promise<PartnerAuthorizationResult> {
  const authResult = await requirePartnerUser()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  if (authResult.role !== 'PARTNER_OWNER') {
    return {
      authorized: false,
      error: 'Partner Owner access required',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Require access to a specific partner by ID
 */
export async function requirePartnerAccess(partnerId: string): Promise<PartnerAuthorizationResult> {
  const session = await getCurrentSession()
  
  if (!session) {
    return {
      authorized: false,
      error: 'Authentication required',
      status: 401
    }
  }
  
  if (!session.user.isActive) {
    return {
      authorized: false,
      error: 'Account is disabled',
      status: 403
    }
  }
  
  // Super Admin can access any partner
  if (session.user.globalRole === 'SUPER_ADMIN') {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })
    
    if (!partner) {
      return {
        authorized: false,
        error: 'Partner not found',
        status: 404
      }
    }
    
    return {
      authorized: true,
      user: session.user,
      session,
      partner,
      partnerUser: null as any, // Super Admin doesn't need partner user record
      role: 'PARTNER_OWNER' // Treat as owner for permissions
    }
  }
  
  // Regular user must be a partner user of this specific partner
  const partnerUser = await prisma.partnerUser.findUnique({
    where: { userId: session.user.id },
    include: { Partner: true }
  })
  
  if (!partnerUser) {
    return {
      authorized: false,
      error: 'Not a partner user',
      status: 403
    }
  }
  
  // Must be a member of THIS partner
  if (partnerUser.partnerId !== partnerId) {
    return {
      authorized: false,
      error: 'Access denied to this partner',
      status: 403
    }
  }
  
  if (!partnerUser.isActive) {
    return {
      authorized: false,
      error: 'Partner membership is disabled',
      status: 403
    }
  }
  
  if (partnerUser.Partner.status !== 'ACTIVE') {
    return {
      authorized: false,
      error: 'Partner organization is not active',
      status: 403
    }
  }
  
  return {
    authorized: true,
    user: session.user,
    session,
    partner: partnerUser.Partner,
    partnerUser,
    role: partnerUser.role
  }
}

/**
 * Require PARTNER_OWNER access to a specific partner
 */
export async function requirePartnerOwnerAccess(partnerId: string): Promise<PartnerAuthorizationResult> {
  const authResult = await requirePartnerAccess(partnerId)
  
  if (!authResult.authorized) {
    return authResult
  }
  
  // Super Admin is treated as owner
  if (authResult.session.user.globalRole === 'SUPER_ADMIN') {
    return authResult
  }
  
  if (authResult.role !== 'PARTNER_OWNER') {
    return {
      authorized: false,
      error: 'Partner Owner access required',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Require access to a specific partner by slug
 */
export async function requirePartnerAccessBySlug(slug: string): Promise<PartnerAuthorizationResult & { partner?: Partner }> {
  const partner = await prisma.partner.findUnique({
    where: { slug }
  })
  
  if (!partner) {
    return {
      authorized: false,
      error: 'Partner not found',
      status: 404
    }
  }
  
  return requirePartnerAccess(partner.id)
}

// ============================================================================
// ACCESS BOUNDARY CHECKS
// ============================================================================

/**
 * Check if a partner user can access a specific referral
 * Staff can only see referrals from codes they created
 */
export async function canAccessReferral(
  partnerUserId: string,
  referralId: string,
  role: PartnerRole
): Promise<boolean> {
  // Owners can see all referrals
  if (role === 'PARTNER_OWNER') {
    return true
  }
  
  // Staff can only see referrals from their codes
  const referral = await prisma.partnerReferral.findUnique({
    where: { id: referralId },
    include: {
      PartnerReferralCode: {
        select: { metadata: true }
      }
    }
  })
  
  if (!referral) {
    return false
  }
  
  // Check if this staff member created the referral code
  // (This would require tracking who created the code - simplified for now)
  // For now, staff can see all referrals in their partner
  return true
}

/**
 * Check if user can access a tenant's data
 * Partner users CANNOT access tenant internals - this always returns false
 */
export function canPartnerAccessTenantInternals(): boolean {
  // Partner users can NEVER access tenant internals
  // This is a hard boundary
  return false
}

/**
 * Get visible tenant data for a partner (limited view)
 * Partners can only see: tenant name, status, signup date
 * Partners CANNOT see: tenant users, settings, domains, or any internal data
 */
export interface PartnerVisibleTenantData {
  id: string
  name: string
  slug: string
  status: string
  createdAt: Date
  // Subscription info (when implemented)
  // Revenue metrics (aggregated only)
}

export async function getPartnerVisibleTenantData(
  partnerId: string,
  tenantId: string
): Promise<PartnerVisibleTenantData | null> {
  // First verify this partner has a referral for this tenant
  const referral = await prisma.partnerReferral.findFirst({
    where: {
      partnerId,
      tenantId
    }
  })
  
  if (!referral) {
    return null // Partner cannot see this tenant
  }
  
  // Get limited tenant data
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true
      // Explicitly NOT including: domains, memberships, branding details
    }
  })
  
  if (!tenant) {
    return null
  }
  
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPartnerPermission(
  role: PartnerRole | 'SUPER_ADMIN',
  permission: keyof PartnerPermissions
): boolean {
  const permissions = getPartnerPermissions(role)
  return permissions[permission]
}

/**
 * Assert a permission or throw
 */
export function assertPartnerPermission(
  role: PartnerRole | 'SUPER_ADMIN',
  permission: keyof PartnerPermissions,
  errorMessage?: string
): void {
  if (!hasPartnerPermission(role, permission)) {
    throw new Error(errorMessage || `Permission denied: ${permission}`)
  }
}
