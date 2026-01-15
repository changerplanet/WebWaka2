/**
 * Authorization Helper Library
 * 
 * Provides role-based access control utilities for the WebWaka platform.
 * This module defines role hierarchies and helper functions to check user
 * permissions across Partner, Tenant, and Platform levels.
 */

import { prisma } from '@/lib/prisma'
import type { GlobalRole, PartnerRole, TenantRole } from '@prisma/client'

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * GlobalRole - Platform-wide roles
 * SUPER_ADMIN: Full platform access, can manage all partners and tenants
 * USER: Default role for authenticated users
 */
export const GLOBAL_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN' as GlobalRole,
  USER: 'USER' as GlobalRole,
} as const

/**
 * PartnerRole - Roles within a Partner organization
 * Partners are resellers/agencies that manage multiple tenants
 */
export const PARTNER_ROLES = {
  PARTNER_OWNER: 'PARTNER_OWNER' as PartnerRole,
  PARTNER_ADMIN: 'PARTNER_ADMIN' as PartnerRole,
  PARTNER_SALES: 'PARTNER_SALES' as PartnerRole,
  PARTNER_SUPPORT: 'PARTNER_SUPPORT' as PartnerRole,
  PARTNER_STAFF: 'PARTNER_STAFF' as PartnerRole,
} as const

/**
 * TenantRole - Roles within a Tenant organization
 * Tenants are the end-customer businesses using the platform
 */
export const TENANT_ROLES = {
  TENANT_ADMIN: 'TENANT_ADMIN' as TenantRole,
  TENANT_USER: 'TENANT_USER' as TenantRole,
} as const

/**
 * All Partner roles as an array for easy checking
 */
export const ALL_PARTNER_ROLES: PartnerRole[] = Object.values(PARTNER_ROLES)

/**
 * All Tenant roles as an array for easy checking
 */
export const ALL_TENANT_ROLES: TenantRole[] = Object.values(TENANT_ROLES)

// ============================================================================
// ROLE CHECKING UTILITIES
// ============================================================================

/**
 * Check if a user has the SUPER_ADMIN global role
 * SUPER_ADMIN has full platform access to all routes and data
 */
export function isSuperAdmin(globalRole: string | GlobalRole | null | undefined): boolean {
  return globalRole === GLOBAL_ROLES.SUPER_ADMIN
}

/**
 * Check if a role is a valid Partner role
 * Used to verify if a user can access partner-specific features
 */
export function isPartnerRole(role: string | null | undefined): role is PartnerRole {
  if (!role) return false
  return ALL_PARTNER_ROLES.includes(role as PartnerRole)
}

/**
 * Check if a role is a valid Tenant role
 * Used to verify if a user can access tenant-specific features
 */
export function isTenantRole(role: string | null | undefined): role is TenantRole {
  if (!role) return false
  return ALL_TENANT_ROLES.includes(role as TenantRole)
}

/**
 * Check if user has Partner Owner or Admin role (management capabilities)
 */
export function isPartnerManager(role: string | null | undefined): boolean {
  return role === PARTNER_ROLES.PARTNER_OWNER || role === PARTNER_ROLES.PARTNER_ADMIN
}

/**
 * Check if user has Tenant Admin role
 */
export function isTenantAdmin(role: string | null | undefined): boolean {
  return role === TENANT_ROLES.TENANT_ADMIN
}

// ============================================================================
// DATABASE LOOKUP FUNCTIONS
// ============================================================================

/**
 * User's Partner membership info
 */
export interface PartnerUserInfo {
  partnerUserId: string
  partnerId: string
  role: PartnerRole
  isActive: boolean
  partnerName: string
  partnerSlug: string
}

/**
 * User's Tenant membership info
 */
export interface TenantMembershipInfo {
  membershipId: string
  tenantId: string
  role: TenantRole
  isActive: boolean
  tenantName: string
  tenantSlug: string
}

/**
 * Get user's Partner role from PartnerUser table
 * Returns null if user is not a Partner member
 * 
 * @param userId - The user's ID to look up
 * @returns PartnerUserInfo if user is a Partner member, null otherwise
 */
export async function getPartnerUserInfo(userId: string): Promise<PartnerUserInfo | null> {
  const partnerUser = await prisma.partnerUser.findUnique({
    where: { userId },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    }
  })

  if (!partnerUser || !partnerUser.isActive) {
    return null
  }

  return {
    partnerUserId: partnerUser.id,
    partnerId: partnerUser.partnerId,
    role: partnerUser.role,
    isActive: partnerUser.isActive,
    partnerName: partnerUser.partner.name,
    partnerSlug: partnerUser.partner.slug,
  }
}

/**
 * Get all of user's Tenant memberships from TenantMembership table
 * Returns an empty array if user has no tenant memberships
 * 
 * @param userId - The user's ID to look up
 * @returns Array of TenantMembershipInfo for all user's active memberships
 */
export async function getUserTenantMemberships(userId: string): Promise<TenantMembershipInfo[]> {
  const memberships = await prisma.tenantMembership.findMany({
    where: { 
      userId,
      isActive: true 
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    }
  })

  return memberships.map(m => ({
    membershipId: m.id,
    tenantId: m.tenantId,
    role: m.role,
    isActive: m.isActive,
    tenantName: m.tenant.name,
    tenantSlug: m.tenant.slug,
  }))
}

/**
 * Get user's role for a specific tenant
 * Returns null if user doesn't have membership in that tenant
 * 
 * @param userId - The user's ID
 * @param tenantId - The tenant ID to check
 * @returns TenantRole if user is a member, null otherwise
 */
export async function getUserTenantRole(userId: string, tenantId: string): Promise<TenantRole | null> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: { userId, tenantId }
    }
  })

  if (!membership || !membership.isActive) {
    return null
  }

  return membership.role
}

// ============================================================================
// AUTHORIZATION CHECK FUNCTIONS
// ============================================================================

/**
 * Authorization result type
 */
export interface AuthorizationResult {
  authorized: boolean
  reason?: string
}

/**
 * Check if user can access Partner Portal
 * Only users with an active Partner role can access
 * 
 * @param userId - The user's ID
 * @param globalRole - User's global role (SUPER_ADMIN bypasses check)
 * @returns AuthorizationResult indicating if access is allowed
 */
export async function canAccessPartnerPortal(
  userId: string, 
  globalRole: string | null | undefined
): Promise<AuthorizationResult> {
  // SUPER_ADMIN can access everything
  if (isSuperAdmin(globalRole)) {
    return { authorized: true }
  }

  // Check if user has a Partner role
  const partnerInfo = await getPartnerUserInfo(userId)
  
  if (!partnerInfo) {
    return { 
      authorized: false, 
      reason: 'User is not a member of any Partner organization' 
    }
  }

  return { authorized: true }
}

/**
 * Check if user can access Admin portal
 * Only SUPER_ADMIN can access
 * 
 * @param globalRole - User's global role
 * @returns AuthorizationResult indicating if access is allowed
 */
export function canAccessAdminPortal(globalRole: string | null | undefined): AuthorizationResult {
  if (isSuperAdmin(globalRole)) {
    return { authorized: true }
  }

  return { 
    authorized: false, 
    reason: 'Admin access requires SUPER_ADMIN role' 
  }
}

/**
 * Get tenants that a user can access based on their role
 * - SUPER_ADMIN: All tenants
 * - Partner user: Tenants referred by their partner
 * - Regular user: Only tenants they have membership in
 * 
 * @param userId - The user's ID
 * @param globalRole - User's global role
 * @returns Array of tenant IDs the user can access
 */
export async function getAccessibleTenantIds(
  userId: string,
  globalRole: string | null | undefined
): Promise<{ tenantIds: string[] | 'all'; reason: string }> {
  // SUPER_ADMIN can access all tenants
  if (isSuperAdmin(globalRole)) {
    return { tenantIds: 'all', reason: 'SUPER_ADMIN has access to all tenants' }
  }

  // Check if user is a Partner - they can access tenants referred by their partner
  const partnerInfo = await getPartnerUserInfo(userId)
  if (partnerInfo) {
    // Get all tenants referred by this partner
    const partnerReferrals = await prisma.partnerReferral.findMany({
      where: { partnerId: partnerInfo.partnerId },
      select: { tenantId: true }
    })
    
    const partnerTenantIds = partnerReferrals.map(r => r.tenantId)
    
    // Also get user's direct tenant memberships
    const memberships = await getUserTenantMemberships(userId)
    const membershipTenantIds = memberships.map(m => m.tenantId)
    
    // Combine and deduplicate
    const allTenantIds = [...new Set([...partnerTenantIds, ...membershipTenantIds])]
    
    return { 
      tenantIds: allTenantIds, 
      reason: `Partner user with access to ${allTenantIds.length} tenants` 
    }
  }

  // Regular user - only their own tenant memberships
  const memberships = await getUserTenantMemberships(userId)
  const tenantIds = memberships.map(m => m.tenantId)
  
  return { 
    tenantIds, 
    reason: `User has membership in ${tenantIds.length} tenant(s)` 
  }
}

// ============================================================================
// API ROUTE PROTECTION HELPERS
// ============================================================================

import { NextResponse } from 'next/server'
import { getSessionFromRequest, type ApiSession } from '@/lib/auth'

/**
 * Protected Admin API result type
 */
export type AdminApiAuthResult = 
  | { authorized: true; session: ApiSession }
  | { authorized: false; response: NextResponse }

/**
 * Protect an admin API route - requires SUPER_ADMIN role
 * Use this at the start of any /api/admin/** route handler
 * 
 * @param request - The incoming request
 * @returns AdminApiAuthResult with session if authorized, or error response if not
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await requireSuperAdmin(request)
 *   if (!auth.authorized) return auth.response
 *   // auth.session contains the authenticated SUPER_ADMIN session
 * }
 */
export async function requireSuperAdmin(request: Request): Promise<AdminApiAuthResult> {
  const session = await getSessionFromRequest(request)
  
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
  }
  
  if (!isSuperAdmin(session.user.globalRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Admin access requires SUPER_ADMIN role' },
        { status: 403 }
      )
    }
  }
  
  return { authorized: true, session }
}

/**
 * Protected Tenant API result type
 */
export type TenantApiAuthResult = 
  | { authorized: true; session: ApiSession; tenantRole: TenantRole }
  | { authorized: false; response: NextResponse }

/**
 * Protect an API route that requires specific tenant roles
 * Use this at the start of routes that require tenant-level authorization
 * 
 * @param userId - The user's ID
 * @param tenantId - The tenant ID to check access for
 * @param allowedRoles - Array of allowed tenant roles (or partner roles that map to access)
 * @returns TenantApiAuthResult with tenant role if authorized, or error response if not
 * 
 * @example
 * const authCheck = await requireTenantRole(session.user.id, tenantId, ['PARTNER_ADMIN', 'PARTNER_EDITOR'])
 * if (!authCheck.authorized) return authCheck.response
 */
export async function requireTenantRole(
  userId: string,
  tenantId: string,
  allowedRoles: (TenantRole | PartnerRole | string)[]
): Promise<{ authorized: true; tenantRole?: TenantRole | null } | { authorized: false; response: NextResponse }> {
  // Check if user has a tenant membership with allowed role
  const tenantRole = await getUserTenantRole(userId, tenantId)
  
  if (tenantRole && allowedRoles.includes(tenantRole)) {
    return { authorized: true, tenantRole }
  }
  
  // Check if user has a partner role that allows access
  const partnerInfo = await getPartnerUserInfo(userId)
  
  if (partnerInfo && allowedRoles.includes(partnerInfo.role)) {
    return { authorized: true, tenantRole: null }
  }
  
  // Check if user is a SUPER_ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true }
  })
  
  if (user && isSuperAdmin(user.globalRole)) {
    return { authorized: true, tenantRole: null }
  }
  
  return {
    authorized: false,
    response: NextResponse.json(
      { success: false, error: 'Insufficient permissions for this operation' },
      { status: 403 }
    )
  }
}
