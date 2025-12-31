/**
 * Tenant Isolation Enforcement v2
 * 
 * This module provides strict tenant data isolation at the database level.
 * Uses request-scoped context via headers for Next.js compatibility.
 * 
 * Features:
 * - Prisma middleware to intercept and validate queries
 * - Automatic tenantId validation for scoped queries
 * - SUPER_ADMIN bypass with explicit flag
 * - Violation logging and hard failure
 */

import { Prisma, PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

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
  bypassIsolation?: boolean
}

/**
 * Request-scoped context storage
 * Uses a Map keyed by request ID from headers
 */
const requestContextMap = new Map<string, TenantContext>()

/**
 * Set context for a request
 */
export function setRequestContext(requestId: string, context: TenantContext): void {
  requestContextMap.set(requestId, context)
  // Auto-cleanup after 30 seconds
  setTimeout(() => requestContextMap.delete(requestId), 30000)
}

/**
 * Get context for current request
 */
export function getRequestContext(requestId: string): TenantContext | undefined {
  return requestContextMap.get(requestId)
}

/**
 * Clear context for a request  
 */
export function clearRequestContext(requestId: string): void {
  requestContextMap.delete(requestId)
}

// Current request ID for middleware (set per-request)
let currentRequestId: string | null = null

export function setCurrentRequestId(id: string | null): void {
  currentRequestId = id
}

export function getCurrentRequestId(): string | null {
  return currentRequestId
}

/**
 * Violation logger
 */
interface ViolationLog {
  timestamp: Date
  model: string
  action: string
  requestId: string | null
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
  args: any,
  context: TenantContext | undefined,
  requestId: string | null
): void {
  // Skip validation for global models
  if (!isTenantScopedModel(model)) {
    return
  }
  
  // Allow explicit bypass (for migrations, admin tools, etc.)
  if (context?.bypassIsolation === true) {
    if (!context.isSuperAdmin) {
      const reason = 'Bypass isolation attempted without SUPER_ADMIN role'
      logViolation({ model, action, requestId, context, query: args, reason })
      throw new TenantIsolationError(reason, model, action, context)
    }
    console.warn(`[TENANT ISOLATION] Bypass allowed for SUPER_ADMIN on ${model}.${action}`)
    return
  }
  
  // SUPER_ADMIN can access all data
  if (context?.isSuperAdmin) {
    return
  }
  
  // No context = violation
  if (!context) {
    const reason = 'No tenant context provided for tenant-scoped query'
    logViolation({ model, action, requestId, context, query: args, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // No tenantId in context = violation
  if (!context.tenantId) {
    const reason = 'No tenantId in context for tenant-scoped query'
    logViolation({ model, action, requestId, context, query: args, reason })
    throw new TenantIsolationError(reason, model, action, context)
  }
  
  // For read operations, ensure WHERE clause has tenantId
  if (READ_ACTIONS.includes(action)) {
    const where = args?.where
    if (!where || !hasTenantIdFilter(where, context.tenantId)) {
      const reason = `Read query on ${model} missing tenantId filter`
      logViolation({ model, action, requestId, context, query: args, reason })
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
          logViolation({ model, action, requestId, context, query: args, reason })
          throw new TenantIsolationError(reason, model, action, context)
        }
      }
    }
    
    if (['update', 'updateMany', 'delete', 'deleteMany'].includes(action)) {
      const where = args?.where
      if (!where || !hasTenantIdFilter(where, context.tenantId)) {
        const reason = `${action} on ${model} missing tenantId filter`
        logViolation({ model, action, requestId, context, query: args, reason })
        throw new TenantIsolationError(reason, model, action, context)
      }
    }
    
    if (action === 'upsert') {
      const where = args?.where
      const create = args?.create
      
      if (!where || !hasTenantIdFilter(where, context.tenantId)) {
        const reason = `Upsert on ${model} missing tenantId filter in WHERE`
        logViolation({ model, action, requestId, context, query: args, reason })
        throw new TenantIsolationError(reason, model, action, context)
      }
      
      if (create && create.tenantId !== context.tenantId) {
        const reason = `Upsert on ${model} has mismatched tenantId in CREATE`
        logViolation({ model, action, requestId, context, query: args, reason })
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
    
    const requestId = getCurrentRequestId()
    const context = requestId ? getRequestContext(requestId) : undefined
    
    // Validate tenant isolation
    validateTenantIsolation(model, action, args, context, requestId)
    
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
  const requestId = `isolated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    setRequestContext(requestId, context)
    setCurrentRequestId(requestId)
    return await fn()
  } finally {
    clearRequestContext(requestId)
    setCurrentRequestId(null)
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
