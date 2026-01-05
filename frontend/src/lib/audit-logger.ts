/**
 * Audit Logger
 * Comprehensive audit logging for security and compliance
 */

import { prisma } from './prisma'

// Audit event types
export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'AUTH_TOKEN_REFRESH'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'WALLET_CREATE'
  | 'WALLET_CREDIT'
  | 'WALLET_DEBIT'
  | 'WALLET_TRANSFER'
  | 'WALLET_HOLD'
  | 'WALLET_STATUS_CHANGE'
  | 'ORDER_CREATE'
  | 'ORDER_STATUS_CHANGE'
  | 'ORDER_CANCEL'
  | 'CART_CREATE'
  | 'CART_UPDATE'
  | 'CART_CHECKOUT'
  | 'PAYOUT_CREATE'
  | 'PAYOUT_PROCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SECURITY_VIOLATION'
  | 'CONFIG_CHANGE'
  | 'DATA_EXPORT'
  | 'DATA_ACCESS'

// Audit severity levels
export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

// Audit log entry interface
export interface AuditLogEntry {
  eventType: AuditEventType
  severity: AuditSeverity
  tenantId: string
  userId?: string
  resourceType?: string
  resourceId?: string
  action: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  requestId?: string
  timestamp?: Date
}

// In-memory buffer for batch writes (use proper queue in production)
const auditBuffer: AuditLogEntry[] = []
const BUFFER_FLUSH_SIZE = 100
const BUFFER_FLUSH_INTERVAL = 5000 // 5 seconds

let flushInterval: NodeJS.Timeout | null = null

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date()
  }

  // Add to buffer
  auditBuffer.push(logEntry)

  // Console log for immediate visibility (in production, use structured logging)
  const logLevel = entry.severity === 'CRITICAL' || entry.severity === 'ERROR' 
    ? 'error' 
    : entry.severity === 'WARNING' 
      ? 'warn' 
      : 'log'
  
  console[logLevel](`[AUDIT] ${entry.eventType}`, {
    tenant: entry.tenantId,
    user: entry.userId,
    resource: entry.resourceType ? `${entry.resourceType}:${entry.resourceId}` : undefined,
    action: entry.action,
    severity: entry.severity
  })

  // Flush if buffer is full
  if (auditBuffer.length >= BUFFER_FLUSH_SIZE) {
    await flushAuditBuffer()
  }

  // Start flush interval if not running
  if (!flushInterval) {
    flushInterval = setInterval(flushAuditBuffer, BUFFER_FLUSH_INTERVAL)
  }
}

/**
 * Flush audit buffer to database
 */
async function flushAuditBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return

  const entries = auditBuffer.splice(0, auditBuffer.length)
  
  try {
    // In a real system, you'd write to an AuditLog table
    // For now, we'll just log them
    // await prisma.auditLog.createMany({ data: entries })
    
    // Console summary
    console.log(`[AUDIT] Flushed ${entries.length} audit entries`)
  } catch (error) {
    console.error('[AUDIT] Failed to flush audit buffer:', error)
    // Re-add entries to buffer on failure
    auditBuffer.unshift(...entries)
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  eventType: 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_FAILED' | 'AUTH_TOKEN_REFRESH',
  tenantId: string,
  userId: string | undefined,
  success: boolean,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): void {
  logAudit({
    eventType,
    severity: success ? 'INFO' : 'WARNING',
    tenantId,
    userId,
    action: eventType.replace('AUTH_', '').toLowerCase(),
    details: { success, ...details },
    ipAddress,
    userAgent
  })
}

/**
 * Log wallet operation
 */
export function logWalletOperation(
  operation: 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'HOLD' | 'STATUS_CHANGE',
  tenantId: string,
  walletId: string,
  amount?: number,
  details?: Record<string, unknown>,
  userId?: string
): void {
  logAudit({
    eventType: `WALLET_${operation}` as AuditEventType,
    severity: 'INFO',
    tenantId,
    userId,
    resourceType: 'wallet',
    resourceId: walletId,
    action: operation.toLowerCase(),
    details: { amount, ...details }
  })
}

/**
 * Log order event
 */
export function logOrderEvent(
  eventType: 'ORDER_CREATE' | 'ORDER_STATUS_CHANGE' | 'ORDER_CANCEL',
  tenantId: string,
  orderId: string,
  details?: Record<string, unknown>,
  userId?: string
): void {
  logAudit({
    eventType,
    severity: 'INFO',
    tenantId,
    userId,
    resourceType: 'order',
    resourceId: orderId,
    action: eventType.replace('ORDER_', '').toLowerCase(),
    details
  })
}

/**
 * Log security violation
 */
export function logSecurityViolation(
  tenantId: string,
  violation: string,
  details: Record<string, unknown>,
  ipAddress?: string,
  userId?: string
): void {
  logAudit({
    eventType: 'SECURITY_VIOLATION',
    severity: 'CRITICAL',
    tenantId,
    userId,
    action: violation,
    details,
    ipAddress
  })
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  tenantId: string,
  endpoint: string,
  ipAddress: string,
  userId?: string
): void {
  logAudit({
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: 'WARNING',
    tenantId,
    userId,
    action: 'rate_limit_exceeded',
    details: { endpoint },
    ipAddress
  })
}

/**
 * Get audit statistics
 */
export function getAuditStats(): {
  bufferSize: number
  pendingFlush: number
} {
  return {
    bufferSize: BUFFER_FLUSH_SIZE,
    pendingFlush: auditBuffer.length
  }
}

/**
 * Force flush (for graceful shutdown)
 */
export async function forceFlush(): Promise<void> {
  if (flushInterval) {
    clearInterval(flushInterval)
    flushInterval = null
  }
  await flushAuditBuffer()
}
