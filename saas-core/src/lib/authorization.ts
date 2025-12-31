import { User, GlobalRole, TenantRole, TenantMembership, Tenant } from '@prisma/client'
import { prisma } from './prisma'
import { getCurrentSession, AuthSession } from './auth'

export type UserWithMemberships = User & {
  memberships: (TenantMembership & {
    tenant: Tenant
  })[]
}

/**
 * Check if user is a Super Admin
 */
export function isSuperAdmin(user: User | UserWithMemberships): boolean {
  return user.globalRole === 'SUPER_ADMIN'
}

/**
 * Check if user is a Tenant Admin for a specific tenant
 */
export function isTenantAdmin(
  user: UserWithMemberships,
  tenantId: string
): boolean {
  const membership = user.memberships.find(m => m.tenantId === tenantId)
  return membership?.role === 'TENANT_ADMIN' && membership.isActive
}

/**
 * Check if user is a member of a specific tenant
 */
export function isTenantMember(
  user: UserWithMemberships,
  tenantId: string
): boolean {
  const membership = user.memberships.find(m => m.tenantId === tenantId)
  return !!membership && membership.isActive
}

/**
 * Get user's role in a specific tenant
 */
export function getTenantRole(
  user: UserWithMemberships,
  tenantId: string
): TenantRole | null {
  const membership = user.memberships.find(m => m.tenantId === tenantId && m.isActive)
  return membership?.role || null
}

/**
 * Authorization result type
 */
export type AuthorizationResult = 
  | { authorized: true; user: UserWithMemberships; session: AuthSession }
  | { authorized: false; error: string; status: number }

/**
 * Require authentication (any logged-in user)
 */
export async function requireAuth(): Promise<AuthorizationResult> {
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
      error: 'Account is deactivated',
      status: 403
    }
  }
  
  return {
    authorized: true,
    user: session.user as UserWithMemberships,
    session
  }
}

/**
 * Require Super Admin role
 * Used for /admin routes
 */
export async function requireSuperAdmin(): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  if (!isSuperAdmin(authResult.user)) {
    return {
      authorized: false,
      error: 'Super Admin access required',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Require Tenant Admin role for a specific tenant
 */
export async function requireTenantAdmin(tenantId: string): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  // Super Admin can access any tenant
  if (isSuperAdmin(authResult.user)) {
    return authResult
  }
  
  // Check tenant admin role
  if (!isTenantAdmin(authResult.user, tenantId)) {
    return {
      authorized: false,
      error: 'Tenant Admin access required',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Require membership in a specific tenant
 */
export async function requireTenantMember(tenantId: string): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  // Super Admin can access any tenant
  if (isSuperAdmin(authResult.user)) {
    return authResult
  }
  
  // Check tenant membership
  if (!isTenantMember(authResult.user, tenantId)) {
    return {
      authorized: false,
      error: 'Tenant membership required',
      status: 403
    }
  }
  
  return authResult
}

/**
 * Check if current user can access a tenant
 * Super Admins can access any tenant
 * Regular users need membership
 */
export async function canAccessTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: true }
  })
  
  if (!user) return false
  
  // Super Admin can access any tenant
  if (user.globalRole === 'SUPER_ADMIN') return true
  
  // Check membership
  return user.memberships.some(
    m => m.tenantId === tenantId && m.isActive
  )
}
