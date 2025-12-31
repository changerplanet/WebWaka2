/**
 * Tenant Isolation Enforcement
 * 
 * This module provides strict tenant data isolation at the database level.
 * Instead of Prisma middleware (which has async context issues), this uses
 * application-level validation before queries are executed.
 * 
 * Features:
 * - Pre-query validation functions
 * - SUPER_ADMIN bypass with explicit flag
 * - Violation logging and hard failure
 * - Safe query builders that enforce tenant scoping
 */

// Models that require tenant isolation
export const TENANT_SCOPED_MODELS = [
  'TenantMembership',
  'TenantDomain', 
  'AuditLog',
  // Add future tenant-scoped models here
] as const

export type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number]

export interface TenantContext {
  tenantId: string | null
  userId: string | null
  isSuperAdmin: boolean
  bypassIsolation?: boolean
}

/**
 * Violation logger
 */
interface ViolationLog {
  timestamp: Date
  model: string
  action: string
  context: TenantContext | null
  query: any
  reason: string
}

const violations: ViolationLog[] = []
const MAX_VIOLATION_LOGS = 1000

export function logViolation(violation: Omit<ViolationLog, 'timestamp'>): void {
  const log: ViolationLog = {
    ...violation,
    timestamp: new Date()
  }
  
  violations.push(log)
  
  if (violations.length > MAX_VIOLATION_LOGS) {
    violations.shift()
  }
  
  console.error('[TENANT ISOLATION VIOLATION]', JSON.stringify(log, null, 2))
}

export function getViolationLogs(): ViolationLog[] {
  return [...violations]
}

export function clearViolationLogs(): void {
  violations.length = 0
}

/**
 * Tenant Isolation Error
 */
export class TenantIsolationError extends Error {
  constructor(
    message: string,
    public model: string,
    public action: string,
    public context: TenantContext | null
  ) {
    super(message)
    this.name = 'TenantIsolationError'
  }
}

/**
 * Check if a model is tenant-scoped
 */
export function isTenantScopedModel(model: string): model is TenantScopedModel {
  return TENANT_SCOPED_MODELS.includes(model as any)
}

/**
 * Validate tenant context before executing a query
 * This should be called before any tenant-scoped database operation
 */
export function validateTenantAccess(
  model: string,
  action: string,
  context: TenantContext | null,
  queryTenantId?: string | null
): void {
  // Skip validation for global models
  if (!isTenantScopedModel(model)) {
    return
  }
  
  // Allow explicit bypass (for migrations, admin tools, etc.)
  if (context?.bypassIsolation === true) {
    if (!context.isSuperAdmin) {
      const reason = 'Bypass isolation attempted without SUPER_ADMIN role'
      logViolation({ model, action, context, query: { queryTenantId }, reason })
      throw new TenantIsolationError(reason, model, action, context)
    }
    return
  }
  
  // SUPER_ADMIN can access all data
  if (context?.isSuperAdmin) {
    return
  }
  
  // No context = violation
  if (!context) {
    const reason = 'No tenant context provided for tenant-scoped query'
    logViolation({ model, action, context, query: { queryTenantId }, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // No tenantId in context = violation
  if (!context.tenantId) {
    const reason = 'No tenantId in context for tenant-scoped query'
    logViolation({ model, action, context, query: { queryTenantId }, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // If query specifies a tenantId, it must match context
  if (queryTenantId && queryTenantId !== context.tenantId) {
    const reason = `Cross-tenant access attempt: query tenantId (${queryTenantId}) != context tenantId (${context.tenantId})`
    logViolation({ model, action, context, query: { queryTenantId }, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
}

/**
 * Create a tenant context from user session
 */
export function createTenantContext(
  tenantId: string | null,
  userId: string | null,
  isSuperAdmin: boolean,
  bypassIsolation: boolean = false
): TenantContext {
  return {
    tenantId,
    userId,
    isSuperAdmin,
    bypassIsolation
  }
}

/**
 * Ensure a WHERE clause includes the correct tenantId
 */
export function withTenantFilter<T extends Record<string, any>>(
  where: T,
  tenantId: string
): T & { tenantId: string } {
  return {
    ...where,
    tenantId
  }
}

/**
 * Ensure data being created includes the correct tenantId
 */
export function withTenantData<T extends Record<string, any>>(
  data: T,
  tenantId: string
): T & { tenantId: string } {
  return {
    ...data,
    tenantId
  }
}
