/**
 * SITES & FUNNELS: Permission Guards
 * 
 * Strict access control enforcement:
 * - Only Partners create sites
 * - Clients may edit if allowed
 * - End users are visitors only
 * - Super Admin is read-only (except impersonation)
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export type SitesFunnelsRole = 
  | 'PARTNER_OWNER'      // Full access to all sites/funnels
  | 'PARTNER_ADMIN'      // Can manage sites/funnels
  | 'PARTNER_EDITOR'     // Can edit content only
  | 'CLIENT_ADMIN'       // Can edit if partner allows
  | 'CLIENT_EDITOR'      // Can edit content if partner allows
  | 'SUPER_ADMIN'        // Read-only (audit/support)
  | 'VISITOR';           // View published only

// Permission actions
export type SitesFunnelsAction = 
  | 'create_site'
  | 'read_site'
  | 'update_site'
  | 'delete_site'
  | 'publish_site'
  | 'create_funnel'
  | 'read_funnel'
  | 'update_funnel'
  | 'delete_funnel'
  | 'activate_funnel'
  | 'edit_content'
  | 'view_analytics'
  | 'manage_domains'
  | 'manage_templates'
  | 'use_ai_content';

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

const PERMISSION_MATRIX: Record<SitesFunnelsRole, SitesFunnelsAction[]> = {
  PARTNER_OWNER: [
    'create_site', 'read_site', 'update_site', 'delete_site', 'publish_site',
    'create_funnel', 'read_funnel', 'update_funnel', 'delete_funnel', 'activate_funnel',
    'edit_content', 'view_analytics', 'manage_domains', 'manage_templates', 'use_ai_content',
  ],
  PARTNER_ADMIN: [
    'create_site', 'read_site', 'update_site', 'publish_site',
    'create_funnel', 'read_funnel', 'update_funnel', 'activate_funnel',
    'edit_content', 'view_analytics', 'manage_domains', 'use_ai_content',
  ],
  PARTNER_EDITOR: [
    'read_site', 'update_site',
    'read_funnel', 'update_funnel',
    'edit_content', 'use_ai_content',
  ],
  CLIENT_ADMIN: [
    'read_site', 'update_site',
    'read_funnel', 'update_funnel',
    'edit_content', 'view_analytics',
  ],
  CLIENT_EDITOR: [
    'read_site',
    'read_funnel',
    'edit_content',
  ],
  SUPER_ADMIN: [
    'read_site',
    'read_funnel',
    'view_analytics',
  ],
  VISITOR: [],
};

// ============================================================================
// ROLE RESOLUTION
// ============================================================================

/**
 * Get user's role for Sites & Funnels
 */
export async function getUserSitesFunnelsRole(
  userId: string,
  tenantId: string
): Promise<SitesFunnelsRole> {
  // Check if super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.globalRole === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  // Get tenant with partner info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      partnerReferral: true,
    },
  });

  if (!tenant) {
    return 'VISITOR';
  }

  const partnerId = tenant.partnerReferral?.partnerId;

  // Check if user is a partner user
  if (partnerId) {
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId,
        partnerId,
        isActive: true,
      },
    });

    if (partnerUser) {
      switch (partnerUser.role) {
        case 'PARTNER_OWNER':
          return 'PARTNER_OWNER';
        case 'PARTNER_ADMIN':
          return 'PARTNER_ADMIN';
        case 'PARTNER_SALES':
        case 'PARTNER_SUPPORT':
        case 'PARTNER_STAFF':
          return 'PARTNER_EDITOR';
        default:
          return 'PARTNER_EDITOR';
      }
    }
  }

  // Check if user is a tenant member
  const membership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      tenantId,
      isActive: true,
    },
  });

  if (membership) {
    if (membership.role === 'TENANT_ADMIN') {
      return 'CLIENT_ADMIN';
    }
    return 'CLIENT_EDITOR';
  }

  return 'VISITOR';
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user has permission for an action
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  action: SitesFunnelsAction
): Promise<boolean> {
  const role = await getUserSitesFunnelsRole(userId, tenantId);
  const allowedActions = PERMISSION_MATRIX[role];
  return allowedActions.includes(action);
}

/**
 * Require permission (throws if denied)
 */
export async function requirePermission(
  userId: string,
  tenantId: string,
  action: SitesFunnelsAction
): Promise<{
  authorized: boolean;
  error?: string;
  status?: number;
  role?: SitesFunnelsRole;
}> {
  const role = await getUserSitesFunnelsRole(userId, tenantId);
  const allowedActions = PERMISSION_MATRIX[role];
  
  if (!allowedActions.includes(action)) {
    return {
      authorized: false,
      error: `Permission denied: ${action} requires elevated privileges`,
      status: 403,
      role,
    };
  }

  return { authorized: true, role };
}

/**
 * Check if user can access a specific site
 */
export async function canAccessSite(
  userId: string,
  siteId: string
): Promise<{
  canAccess: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  role: SitesFunnelsRole;
}> {
  const site = await prisma.sf_sites.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    return {
      canAccess: false,
      canEdit: false,
      canPublish: false,
      canDelete: false,
      role: 'VISITOR',
    };
  }

  const role = await getUserSitesFunnelsRole(userId, site.tenantId);
  const permissions = PERMISSION_MATRIX[role];

  return {
    canAccess: permissions.includes('read_site'),
    canEdit: permissions.includes('update_site'),
    canPublish: permissions.includes('publish_site'),
    canDelete: permissions.includes('delete_site'),
    role,
  };
}

/**
 * Check if user can access a specific funnel
 */
export async function canAccessFunnel(
  userId: string,
  funnelId: string
): Promise<{
  canAccess: boolean;
  canEdit: boolean;
  canActivate: boolean;
  canDelete: boolean;
  role: SitesFunnelsRole;
}> {
  const funnel = await prisma.sf_funnels.findUnique({
    where: { id: funnelId },
  });

  if (!funnel) {
    return {
      canAccess: false,
      canEdit: false,
      canActivate: false,
      canDelete: false,
      role: 'VISITOR',
    };
  }

  const role = await getUserSitesFunnelsRole(userId, funnel.tenantId);
  const permissions = PERMISSION_MATRIX[role];

  return {
    canAccess: permissions.includes('read_funnel'),
    canEdit: permissions.includes('update_funnel'),
    canActivate: permissions.includes('activate_funnel'),
    canDelete: permissions.includes('delete_funnel'),
    role,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log sites/funnels action for audit
 */
export async function logSitesFunnelsAction(
  action: string,
  data: {
    userId: string;
    tenantId: string;
    siteId?: string;
    funnelId?: string;
    pageId?: string;
    details?: any;
  }
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true },
    });

    await prisma.auditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        action: `SITES_FUNNELS_${action.toUpperCase()}`,
        actorId: data.userId,
        actorEmail: user?.email || 'unknown',
        targetType: data.siteId ? 'Site' : data.funnelId ? 'Funnel' : 'Page',
        targetId: data.siteId || data.funnelId || data.pageId || '',
        tenantId: data.tenantId,
        metadata: data.details || {},
        ipAddress: null,
        userAgent: null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
