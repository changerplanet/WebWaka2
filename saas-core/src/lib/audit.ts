import { prisma } from './prisma'
import { AuditAction } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { headers } from 'next/headers'

interface AuditLogInput {
  action: AuditAction
  actorId: string
  actorEmail: string
  tenantId?: string | null
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        action: input.action,
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        tenantId: input.tenantId || null,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        metadata: input.metadata || null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break operations
  }
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(options: {
  tenantId?: string
  actorId?: string
  action?: AuditAction
  targetType?: string
  limit?: number
  offset?: number
}) {
  const { tenantId, actorId, action, targetType, limit = 50, offset = 0 } = options
  
  const where: any = {}
  if (tenantId) where.tenantId = tenantId
  if (actorId) where.actorId = actorId
  if (action) where.action = action
  if (targetType) where.targetType = targetType
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.auditLog.count({ where })
  ])
  
  return { logs, total }
}
