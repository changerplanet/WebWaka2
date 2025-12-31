/**
 * Tenant Isolation Enforcement
 * 
 * This module provides strict tenant data isolation at the database level.
 * All queries to tenant-scoped models MUST include a tenantId filter.
 * 
 * Features:
 * - Prisma middleware to intercept and validate queries
 * - Request-scoped context validation
 * - SUPER_ADMIN bypass with explicit flag
 * - Violation logging and hard failure
 */

import { Prisma } from '@prisma/client'

// Models that require tenant isolation
export const TENANT_SCOPED_MODELS = [
  'TenantMembership',
  'TenantDomain', 
  'AuditLog',
  // Add future tenant-scoped models here
] as const

// Actions that read data
const READ_ACTIONS = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy']

// Actions that write data  
const WRITE_ACTIONS = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']

export interface TenantContext {
  tenantId: string | null
  userId: string | null
  isSuperAdmin: boolean
  bypassIsolation?: boolean
}

/**
 * Global context holder - used for synchronous context passing
 * This is safe in Node.js single-threaded model within a request
 */
class ContextHolder {
  private stack: TenantContext[] = []
  
  push(ctx: TenantContext): void {
    this.stack.push(ctx)
  }
  
  pop(): TenantContext | undefined {
    return this.stack.pop()
  }
  
  current(): TenantContext | undefined {
    return this.stack[this.stack.length - 1]
  }
  
  clear(): void {
    this.stack = []
  }
}

export const contextHolder = new ContextHolder()

/**
 * Violation logger
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
 * Check if WHERE clause has tenantId filter matching expected value
 */
function hasTenantIdFilter(where: any, expectedTenantId: string): boolean {
  if (!where) return false
  
  if (where.tenantId === expectedTenantId) return true
  
  if (Array.isArray(where.AND)) {
    return where.AND.some((clause: any) => hasTenantIdFilter(clause, expectedTenantId))
  }
  
  if (where.tenantId?.equals === expectedTenantId) return true
  
  return false
}

/**
 * Validate that a query has proper tenant isolation
 */
function validateTenantIsolation(
  model: string,
  action: string,
  args: any
): void {
  // Skip validation for global models
  if (!isTenantScopedModel(model)) {
    return
  }
  
  const context = contextHolder.current()
  
  // Allow explicit bypass
  if (context?.bypassIsolation === true) {
    if (!context.isSuperAdmin) {
      const reason = 'Bypass isolation attempted without SUPER_ADMIN role'
      logViolation({ model, action, context, query: args, reason })
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
  
  // For write operations
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
    
    if (['update', 'updateMany', 'delete', 'deleteMany'].includes(action)) {
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
 * Create Prisma middleware for tenant isolation
 */
export function createTenantIsolationMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action, args } = params
    
    if (!model) {
      return next(params)
    }
    
    validateTenantIsolation(model, action, args)
    
    return next(params)
  }
}

/**
 * Execute a function with tenant context
 */
export async function withIsolatedContext<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  contextHolder.push(context)
  try {
    return await fn()
  } finally {
    contextHolder.pop()
  }
}

/**
 * Execute a synchronous function with tenant context
 */
export function withIsolatedContextSync<T>(
  context: TenantContext,
  fn: () => T
): T {
  contextHolder.push(context)
  try {
    return fn()
  } finally {
    contextHolder.pop()
  }
}
