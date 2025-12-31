import { getCurrentSession, AuthSession } from './auth'
import { prisma } from './prisma'
import { User, TenantRole } from '@prisma/client'

export type AuthorizationResult = 
  | { authorized: true; user: User; session: AuthSession }
  | { authorized: false; error: string; status: number }

export type TenantAuthorizationResult = 
  | { authorized: true; user: User; session: AuthSession; role: TenantRole; tenantId: string }
  | { authorized: false; error: string; status: number }

/**
 * Require any authenticated user
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
      error: 'Account is disabled',
      status: 403
    }
  }
  
  return {
    authorized: true,
    user: session.user,
    session
  }
}

/**
 * Require Super Admin role
 */
export async function requireSuperAdmin(): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  if (authResult.user.globalRole !== 'SUPER_ADMIN') {
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
export async function requireTenantAdmin(tenantId: string): Promise<TenantAuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  // Super admins can access any tenant as admin
  if (authResult.user.globalRole === 'SUPER_ADMIN') {
    return {
      ...authResult,
      role: 'TENANT_ADMIN',
      tenantId
    }
  }
  
  // Check tenant membership
  const membership = authResult.session.user.memberships.find(
    m => m.tenantId === tenantId && m.isActive
  )
  
  if (!membership) {
    return {
      authorized: false,
      error: 'Not a member of this tenant',
      status: 403
    }
  }
  
  if (membership.role !== 'TENANT_ADMIN') {
    return {
      authorized: false,
      error: 'Tenant Admin access required',
      status: 403
    }
  }
  
  return {
    ...authResult,
    role: membership.role,
    tenantId
  }
}

/**
 * Require membership in a tenant (any role)
 */
export async function requireTenantMember(tenantId: string): Promise<TenantAuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.authorized) {
    return authResult
  }
  
  // Super admins can access any tenant
  if (authResult.user.globalRole === 'SUPER_ADMIN') {
    return {
      ...authResult,
      role: 'TENANT_ADMIN',
      tenantId
    }
  }
  
  // Check tenant membership
  const membership = authResult.session.user.memberships.find(
    m => m.tenantId === tenantId && m.isActive
  )
  
  if (!membership) {
    return {
      authorized: false,
      error: 'Not a member of this tenant',
      status: 403
    }
  }
  
  return {
    ...authResult,
    role: membership.role,
    tenantId
  }
}

/**
 * Get tenant from slug and authorize
 */
export async function requireTenantAdminBySlug(slug: string): Promise<TenantAuthorizationResult & { tenant?: any }> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { domains: true }
  })
  
  if (!tenant) {
    return {
      authorized: false,
      error: 'Tenant not found',
      status: 404
    }
  }
  
  const authResult = await requireTenantAdmin(tenant.id)
  
  if (!authResult.authorized) {
    return authResult
  }
  
  return {
    ...authResult,
    tenant
  }
}

/**
 * Get tenant from slug and authorize as member
 */
export async function requireTenantMemberBySlug(slug: string): Promise<TenantAuthorizationResult & { tenant?: any }> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { domains: true }
  })
  
  if (!tenant) {
    return {
      authorized: false,
      error: 'Tenant not found',
      status: 404
    }
  }
  
  const authResult = await requireTenantMember(tenant.id)
  
  if (!authResult.authorized) {
    return authResult
  }
  
  return {
    ...authResult,
    tenant
  }
}
