/**
 * SaaS Core Module
 * 
 * A reusable, production-grade multi-tenant SaaS foundation.
 * 
 * Features:
 * - Multi-tenant architecture with strict data isolation
 * - Magic link authentication
 * - White-label branding per tenant
 * - PWA with offline-first capabilities
 * - Role-based access control (RBAC)
 * - Domain management with DNS verification
 * - Audit logging
 * 
 * @version 1.0.0
 */

// Core database and isolation
export { prisma } from '@/lib/prisma'
export {
  validateTenantAccess,
  createTenantContext,
  withTenantFilter,
  withTenantData,
  TenantIsolationError,
  isTenantScopedModel,
  getViolationLogs,
  clearViolationLogs,
  TENANT_SCOPED_MODELS,
  type TenantContext,
  type TenantScopedModel
} from '@/lib/tenant-isolation'

// Authentication
export {
  getCurrentSession,
  createMagicLink,
  verifyMagicLink,
  getSessionByToken,
  setSessionCookie,
  logout,
  switchTenant,
  isSuperAdmin,
  isTenantAdmin,
  generateToken,
  type SessionUser,
  type AuthSession
} from '@/lib/auth'

// Authorization
export {
  requireAuth,
  requireSuperAdmin,
  requireTenantAdmin,
  requireTenantMember,
  requireTenantAdminBySlug,
  requireTenantMemberBySlug,
  type AuthorizationResult,
  type TenantAuthorizationResult
} from '@/lib/authorization'

// Tenant Resolution
export {
  resolveTenant,
  getTenantBySlug,
  getTenantFromSlug,
  getTenantFromDomain,
  resolveTenantBySlug,
  resolveTenantFromHost,
  resolveTenantFromQuery,
  isPublicRoute,
  isSuperAdminRoute,
  type TenantWithDomains as ResolvedTenant
} from '@/lib/tenant-resolver'

// Branding
export {
  getTenantBranding,
  generateBrandingCSS,
  generateManifest as getBrandingManifest,
  type TenantBranding
} from '@/lib/branding'

// Domain Management
export {
  getVerificationInfo,
  verifyDomain,
  verifyAndUpdateDomain,
  isDomainAvailable,
  type VerificationMethod,
  type DomainVerificationInfo
} from '@/lib/domains'

// Audit Logging
export {
  createAuditLog,
  getAuditLogs
} from '@/lib/audit'

// Version info
export const SAAS_CORE_VERSION = '1.0.0'
export const SAAS_CORE_RELEASE_DATE = '2025-12-31'
