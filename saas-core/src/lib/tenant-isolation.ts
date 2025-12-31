/**
 * Tenant Isolation Enforcement
 * 
 * This module provides strict tenant data isolation at the database level.
 * All queries to tenant-scoped models MUST include a tenantId filter.
 * 
 * Features:
 * - Prisma middleware to intercept and validate queries
 * - Automatic tenantId injection for scoped queries
 * - SUPER_ADMIN bypass with explicit flag
 * - Violation logging and hard failure
 */

import { Prisma, PrismaClient } from '@prisma/client'

// Models that require tenant isolation
const TENANT_SCOPED_MODELS = [
  'TenantMembership',
  'TenantDomain',
  'AuditLog',
  // Add future tenant-scoped models here:
  // 'Project', 'Task', 'Document', 'Invoice', etc.
] as const

// Models that are global (no tenant scope)
const GLOBAL_MODELS = [
  'User',
  'Tenant',
  'Session',
  'MagicLink',
] as const

// Actions that read data
const READ_ACTIONS = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy']

// Actions that write data
const WRITE_ACTIONS = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']

export interface TenantContext {
  tenantId: string | null
  userId: string | null
  isSuperAdmin: boolean
  bypassIsolation?: boolean // Explicit flag to bypass isolation (dangerous!)
}

// AsyncLocalStorage for tenant context propagation
import { AsyncLocalStorage } from 'async_hooks'
export const tenantContextStorage = new AsyncLocalStorage<TenantContext>()

/**
 * Get current tenant context from AsyncLocalStorage
 */
export function getCurrentTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore()
}

/**
 * Run a function within a tenant context
 */
export function withTenantContext<T>(context: TenantContext, fn: () => T): T {
  return tenantContextStorage.run(context, fn)
}

/**
 * Violation logger - logs attempted isolation breaches
 */
interface ViolationLog {
  timestamp: Date
  model: string
  action: string
  context: TenantContext | undefined
  query: any
  reason: string
}

const violations: ViolationLog[] = []
const MAX_VIOLATION_LOGS = 1000

export function logViolation(violation: Omit<ViolationLog, 'timestamp'>) {
  const log: ViolationLog = {
    ...violation,
    timestamp: new Date()
  }
  
  violations.push(log)
  
  // Keep only last N violations
  if (violations.length > MAX_VIOLATION_LOGS) {
    violations.shift()
  }
  
  // Also log to console/error tracking
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
    public context: TenantContext | undefined
  ) {
    super(message)
    this.name = 'TenantIsolationError'
  }
}

/**
 * Check if a model is tenant-scoped
 */
export function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.includes(model as any)
}

/**
 * Validate that a query has proper tenant isolation
 */
function validateTenantIsolation(
  model: string,
  action: string,
  args: any,
  context: TenantContext | undefined
): void {
  // Skip validation for global models
  if (!isTenantScopedModel(model)) {
    return
  }
  
  // Allow explicit bypass (for migrations, admin tools, etc.)
  if (context?.bypassIsolation === true) {
    if (!context.isSuperAdmin) {
      const reason = 'Bypass isolation attempted without SUPER_ADMIN role'
      logViolation({ model, action, context, query: args, reason })
      throw new TenantIsolationError(reason, model, action, context)
    }
    console.warn(`[TENANT ISOLATION] Bypass allowed for SUPER_ADMIN on ${model}.${action}`)
    return
  }
  
  // SUPER_ADMIN can access all data (without bypass flag, they still need tenantId in WHERE)
  // But they can query across tenants
  if (context?.isSuperAdmin) {
    // Super admins can query without tenantId for listing/management
    return
  }
  
  // No context = violation
  if (!context) {
    const reason = 'No tenant context provided for tenant-scoped query'
    logViolation({ model, action, context, query: args, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // No tenantId in context = violation
  if (!context.tenantId) {
    const reason = 'No tenantId in context for tenant-scoped query'
    logViolation({ model, action, context, query: args, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // For read operations, ensure WHERE clause has tenantId
  if (READ_ACTIONS.includes(action)) {
    const where = args?.where
    if (!where || !hasTenantIdFilter(where, context.tenantId)) {
      const reason = `Read query on ${model} missing tenantId filter`
      logViolation({ model, action, context, query: args, reason })
      throw new TenantIsolationError(reason, model, action, context)
    }
  }
  
  // For write operations, ensure data has correct tenantId
  if (WRITE_ACTIONS.includes(action)) {
    if (action === 'create' || action === 'createMany') {
      const data = action === 'createMany' ? args?.data : [args?.data]
      for (const item of data || []) {
        if (item && item.tenantId !== context.tenantId) {
          const reason = `Create on ${model} has mismatched tenantId`
          logViolation({ model, action, context, query: args, reason })
          throw new TenantIsolationError(reason, model, action, context)
        }
      }
    }
    
    if (action === 'update' || action === 'updateMany' || action === 'delete' || action === 'deleteMany') {
      const where = args?.where
      if (!where || !hasTenantIdFilter(where, context.tenantId)) {
        const reason = `${action} on ${model} missing tenantId filter`
        logViolation({ model, action, context, query: args, reason })
        throw new TenantIsolationError(reason, model, action, context)
      }
    }
    
    if (action === 'upsert') {
      const where = args?.where
      const create = args?.create
      const update = args?.update
      
      if (!where || !hasTenantIdFilter(where, context.tenantId)) {
        const reason = `Upsert on ${model} missing tenantId filter in WHERE`
        logViolation({ model, action, context, query: args, reason })
        throw new TenantIsolationError(reason, model, action, context)
      }
      
      if (create && create.tenantId !== context.tenantId) {
        const reason = `Upsert on ${model} has mismatched tenantId in CREATE`
        logViolation({ model, action, context, query: args, reason })
        throw new TenantIsolationError(reason, model, action, context)
      }
    }
  }
}

/**
 * Check if WHERE clause has tenantId filter matching expected value
 */
function hasTenantIdFilter(where: any, expectedTenantId: string): boolean {
  if (!where) return false
  
  // Direct tenantId match
  if (where.tenantId === expectedTenantId) return true
  
  // Nested in AND
  if (Array.isArray(where.AND)) {
    return where.AND.some((clause: any) => hasTenantIdFilter(clause, expectedTenantId))
  }
  
  // Object-style tenantId with equals
  if (where.tenantId?.equals === expectedTenantId) return true
  
  return false
}

/**
 * Create Prisma middleware for tenant isolation
 */
export function createTenantIsolationMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action, args } = params
    
    if (!model) {
      return next(params)
    }
    
    const context = getCurrentTenantContext()
    
    // Validate tenant isolation
    validateTenantIsolation(model, action, args, context)
    
    return next(params)
  }
}

/**
 * Create a tenant-scoped Prisma client that automatically injects tenantId
 */
export function createTenantScopedClient(
  prisma: PrismaClient,
  tenantId: string
): PrismaClient {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (model && isTenantScopedModel(model)) {
          // Auto-inject tenantId for tenant-scoped models
          if (READ_ACTIONS.includes(operation)) {
            args.where = {
              ...args.where,
              tenantId
            }
          }
          
          if (operation === 'create') {
            args.data = {
              ...args.data,
              tenantId
            }
          }
          
          if (operation === 'createMany') {
            args.data = args.data.map((item: any) => ({
              ...item,
              tenantId
            }))
          }
          
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = {
              ...args.where,
              tenantId
            }
          }
        }
        
        return query(args)
      }
    }
  }) as PrismaClient
}
