/**
 * Tenant Context Middleware
 * 
 * This middleware sets up the tenant context for each request,
 * enabling the tenant isolation enforcement in Prisma.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext, TenantContext } from './tenant-isolation'
import { getCurrentSession } from './auth'

/**
 * Wrapper to execute API route handlers with tenant context
 */
export async function withTenantContextHandler<T>(
  request: NextRequest,
  handler: () => Promise<T>
): Promise<T> {
  const session = await getCurrentSession()
  
  // Determine tenant context from session and request
  const context: TenantContext = {
    tenantId: null,
    userId: session?.user?.id || null,
    isSuperAdmin: session?.user?.globalRole === 'SUPER_ADMIN',
    bypassIsolation: false
  }
  
  // Try to get tenantId from various sources
  const url = new URL(request.url)
  
  // From URL path (e.g., /api/tenants/[slug]/...)
  const pathMatch = url.pathname.match(/\/api\/tenants\/([^/]+)/)
  if (pathMatch) {
    // This is a tenant-specific route, tenantId will be resolved by the handler
    // We'll set context.tenantId after resolving the slug
  }
  
  // From query param
  const tenantSlug = url.searchParams.get('tenant')
  if (tenantSlug) {
    // Will be resolved to tenantId by the handler
  }
  
  // From session's active tenant
  if (session?.user?.memberships?.length) {
    // Use first active membership if no specific tenant requested
    const activeMembership = session.user.memberships[0]
    if (activeMembership?.tenantId) {
      context.tenantId = activeMembership.tenantId
    }
  }
  
  return withTenantContext(context, handler)
}

/**
 * Create a handler that ensures tenant isolation
 */
export function createTenantIsolatedHandler(
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const session = await getCurrentSession()
    
    const context: TenantContext = {
      tenantId: null,
      userId: session?.user?.id || null,
      isSuperAdmin: session?.user?.globalRole === 'SUPER_ADMIN',
      bypassIsolation: false
    }
    
    return withTenantContext(context, () => handler(request, context))
  }
}

/**
 * Set tenant ID in the current context
 * Call this after resolving tenant from slug/domain
 */
export function setTenantIdInContext(tenantId: string): void {
  const current = getCurrentTenantContext()
  if (current) {
    // Note: This modifies the existing context object
    (current as any).tenantId = tenantId
  }
}

import { getCurrentTenantContext } from './tenant-isolation'
