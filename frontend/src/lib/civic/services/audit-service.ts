/**
 * CIVIC SUITE: Audit Service
 * 
 * Manages audit logging and transparency views.
 * All audit logs are append-only for regulatory compliance.
 * 
 * @module lib/civic/services/audit-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Helper to convert Record to Prisma Json type
type JsonInput = Prisma.InputJsonValue | undefined

// ============================================================================
// AUDIT LOGGING (APPEND-ONLY)
// ============================================================================

/**
 * Log an audit event
 */
export async function logAuditEvent(data: {
  tenantId: string
  action: string
  entityType: string
  entityId: string
  actorId?: string
  actorName: string
  actorRole?: string
  actorIp?: string
  description?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  metadata?: Record<string, unknown>
}) {
  return prisma.civic_audit_log.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      actorId: data.actorId,
      actorName: data.actorName,
      actorRole: data.actorRole,
      actorIp: data.actorIp,
      description: data.description,
      changes: data.changes as JsonInput,
      metadata: data.metadata as JsonInput,
    }),
  })
}

/**
 * Log request action
 */
export async function logRequestAction(
  tenantId: string,
  requestId: string,
  action: string,
  actorId: string | undefined,
  actorName: string,
  description?: string,
  changes?: Record<string, { old: unknown; new: unknown }>
) {
  return logAuditEvent({
    tenantId,
    action,
    entityType: 'REQUEST',
    entityId: requestId,
    actorId,
    actorName,
    description,
    changes,
  })
}

/**
 * Log case action
 */
export async function logCaseAction(
  tenantId: string,
  caseId: string,
  action: string,
  actorId: string | undefined,
  actorName: string,
  description?: string,
  changes?: Record<string, { old: unknown; new: unknown }>
) {
  return logAuditEvent({
    tenantId,
    action,
    entityType: 'CASE',
    entityId: caseId,
    actorId,
    actorName,
    description,
    changes,
  })
}

/**
 * Log inspection action
 */
export async function logInspectionAction(
  tenantId: string,
  inspectionId: string,
  action: string,
  actorId: string | undefined,
  actorName: string,
  description?: string
) {
  return logAuditEvent({
    tenantId,
    action,
    entityType: 'INSPECTION',
    entityId: inspectionId,
    actorId,
    actorName,
    description,
  })
}

/**
 * Log approval action
 */
export async function logApprovalAction(
  tenantId: string,
  approvalId: string,
  action: string,
  actorId: string | undefined,
  actorName: string,
  description?: string
) {
  return logAuditEvent({
    tenantId,
    action,
    entityType: 'APPROVAL',
    entityId: approvalId,
    actorId,
    actorName,
    description,
  })
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(
  tenantId: string,
  options?: {
    action?: string
    entityType?: string
    entityId?: string
    actorId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }
) {
  const {
    action,
    entityType,
    entityId,
    actorId,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (actorId) where.actorId = actorId
  
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo
  }

  const [logs, total] = await Promise.all([
    prisma.civic_audit_log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.civic_audit_log.count({ where }),
  ])

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get entity audit trail
 */
export async function getEntityAuditTrail(
  tenantId: string,
  entityType: string,
  entityId: string
) {
  return prisma.civic_audit_log.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get actor activity
 */
export async function getActorActivity(
  tenantId: string,
  actorId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const where: Record<string, unknown> = { tenantId, actorId }
  
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo
  }

  return prisma.civic_audit_log.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

// ============================================================================
// TRANSPARENCY / PUBLIC STATUS
// ============================================================================

/**
 * Create or update public status for a request
 */
export async function upsertPublicStatus(
  tenantId: string,
  trackingCode: string,
  requestId: string,
  data: {
    serviceName: string
    submittedDate: Date
    currentStatus: string
    lastUpdateDate: Date
    progressStage: number
    progressNote?: string
    estimatedCompletionDate?: Date
  }
) {
  return prisma.civic_public_status.upsert({
    where: { trackingCode },
    create: withPrismaDefaults({
      tenantId,
      trackingCode,
      requestId,
      ...data,
    }),
    update: {
      currentStatus: data.currentStatus,
      lastUpdateDate: data.lastUpdateDate,
      progressStage: data.progressStage,
      progressNote: data.progressNote,
      estimatedCompletionDate: data.estimatedCompletionDate,
    },
  })
}

/**
 * Get public status by tracking code
 */
export async function getPublicStatus(trackingCode: string) {
  return prisma.civic_public_status.findFirst({
    where: { trackingCode },
  })
}

/**
 * Get transparency statistics
 */
export async function getTransparencyStats(tenantId: string) {
  const [requests, cases, inspections, approvals] = await Promise.all([
    prisma.civic_request.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
    prisma.civic_case.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
    prisma.civic_inspection.groupBy({
      by: ['result'],
      where: { tenantId, status: 'COMPLETED' },
      _count: true,
    }),
    prisma.civic_approval.groupBy({
      by: ['decision'],
      where: { tenantId },
      _count: true,
    }),
  ])

  // Calculate averages
  const completedCases = await prisma.civic_case.findMany({
    where: { tenantId, status: 'CLOSED' },
    select: { createdAt: true, closedAt: true },
  })

  let totalDays = 0
  let countWithDates = 0
  for (const c of completedCases) {
    if (c.closedAt) {
      const days = Math.ceil(
        (c.closedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      totalDays += days
      countWithDates++
    }
  }
  const avgProcessingDays = countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0

  return {
    requests: requests.reduce((acc: any, r: any) => ({ ...acc, [r.status]: r._count }), {}),
    cases: cases.reduce((acc: any, c: any) => ({ ...acc, [c.status]: c._count }), {}),
    inspections: inspections.reduce((acc: any, i: any) => ({ ...acc, [i.result || 'UNKNOWN']: i._count }), {}),
    approvals: approvals.reduce((acc: any, a: any) => ({ ...acc, [a.decision]: a._count }), {}),
    avgProcessingDays,
    totalCompleted: countWithDates,
  }
}

/**
 * Get service performance metrics
 */
export async function getServicePerformanceMetrics(tenantId: string) {
  const services = await prisma.civic_service.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      slaBusinessDays: true,
      _count: { select: { requests: true } },
    },
  })

  const metrics = []

  for (const service of services) {
    const requests = await prisma.civic_request.findMany({
      where: { tenantId, serviceId: service.id },
      select: { status: true, submittedAt: true, outcomeDate: true },
    })

    const total = requests.length
    const approved = requests.filter((r: any) => r.status === 'APPROVED').length
    const rejected = requests.filter((r: any) => r.status === 'REJECTED').length
    const pending = requests.filter((r: any) => !['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length

    // Calculate avg days to completion
    let totalDays = 0
    let completedCount = 0
    for (const r of requests) {
      if (r.outcomeDate && r.submittedAt) {
        const days = Math.ceil(
          (r.outcomeDate.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        totalDays += days
        completedCount++
      }
    }
    const avgDays = completedCount > 0 ? Math.round(totalDays / completedCount) : null

    metrics.push({
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      slaBusinessDays: service.slaBusinessDays,
      totalRequests: total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? Math.round((approved / (approved + rejected || 1)) * 100) : 0,
      avgProcessingDays: avgDays,
      slaMet: avgDays !== null && avgDays <= service.slaBusinessDays,
    })
  }

  return metrics
}

/**
 * Export audit data for FOI request
 */
export async function exportForFOI(
  tenantId: string,
  options: {
    entityType?: string
    dateFrom: Date
    dateTo: Date
    redactPII?: boolean
  }
) {
  const { entityType, dateFrom, dateTo, redactPII = true } = options

  const where: Record<string, unknown> = {
    tenantId,
    createdAt: { gte: dateFrom, lte: dateTo },
  }
  if (entityType) where.entityType = entityType

  const logs = await prisma.civic_audit_log.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  // Optionally redact PII
  if (redactPII) {
    return logs.map(log => ({
      ...log,
      actorId: '[REDACTED]',
      actorIp: '[REDACTED]',
      // Keep actorName for accountability but could be role-based
    }))
  }

  return logs
}
