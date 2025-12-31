import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'
import { AuditAction } from '@prisma/client'

interface AuditLogParams {
  action: AuditAction
  actorId: string
  actorEmail: string
  tenantId?: string | null
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        action: params.action,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        tenantId: params.tenantId || null,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null
      }
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(options: {
  tenantId?: string
  actorId?: string
  action?: AuditAction
  targetType?: string
  targetId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}
  
  if (options.tenantId) where.tenantId = options.tenantId
  if (options.actorId) where.actorId = options.actorId
  if (options.action) where.action = options.action
  if (options.targetType) where.targetType = options.targetType
  if (options.targetId) where.targetId = options.targetId
  
  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])
  
  return { logs, total }
}
