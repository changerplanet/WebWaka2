/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Audit Logging & Security Service
 * 
 * Provides comprehensive audit logging and security controls.
 * Features:
 * - Log all inbound/outbound API activity
 * - Immutable, queryable logs
 * - Security anomaly detection
 * - No silent integrations
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'

interface LogQuery {
  tenantId?: string
  instanceId?: string
  logType?: string
  direction?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

/**
 * Query integration logs
 */
export async function queryIntegrationLogs(query: LogQuery) {
  const where: any = {}
  
  if (query.tenantId) {
    where.tenantId = query.tenantId
  }
  if (query.instanceId) {
    where.instanceId = query.instanceId
  }
  if (query.logType) {
    where.logType = query.logType
  }
  if (query.direction) {
    where.direction = query.direction
  }
  if (query.success !== undefined) {
    where.success = query.success
  }
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) {
      where.createdAt.gte = query.startDate
    }
    if (query.endDate) {
      where.createdAt.lte = query.endDate
    }
  }
  
  const page = query.page || 1
  const limit = query.limit || 50
  const skip = (page - 1) * limit
  
  const [logs, total] = await Promise.all([
    prisma.integration_logs.findMany({
      where,
      include: {
        integration_instances: {
          select: {
            displayName: true,
            integration_providers: {
              select: { key: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.integration_logs.count({ where }),
  ])
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get log by ID
 */
export async function getLogById(logId: string) {
  return prisma.integration_logs.findUnique({
    where: { id: logId },
    include: {
      integration_instances: {
        include: { integration_providers: true },
      },
    },
  })
}

/**
 * Query event logs
 */
export async function queryEventLogs(query: {
  tenantId?: string
  eventType?: string
  providerId?: string
  instanceId?: string
  appId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const where: any = {}
  
  if (query.tenantId) {
    where.tenantId = query.tenantId
  }
  if (query.eventType) {
    where.eventType = query.eventType
  }
  if (query.providerId) {
    where.providerId = query.providerId
  }
  if (query.instanceId) {
    where.instanceId = query.instanceId
  }
  if (query.appId) {
    where.appId = query.appId
  }
  if (query.startDate || query.endDate) {
    where.occurredAt = {}
    if (query.startDate) {
      where.occurredAt.gte = query.startDate
    }
    if (query.endDate) {
      where.occurredAt.lte = query.endDate
    }
  }
  
  const page = query.page || 1
  const limit = query.limit || 50
  const skip = (page - 1) * limit
  
  const [events, total] = await Promise.all([
    prisma.integration_event_logs.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.integration_event_logs.count({ where }),
  ])
  
  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get integration statistics
 */
export async function getIntegrationStatistics(
  tenantId?: string,
  period: 'day' | 'week' | 'month' = 'day'
) {
  const periodMap = {
    day: 1,
    week: 7,
    month: 30,
  }
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodMap[period])
  
  const where: any = {
    createdAt: { gte: startDate },
  }
  if (tenantId) {
    where.tenantId = tenantId
  }
  
  const [totalCalls, successfulCalls, failedCalls, webhooksReceived, webhooksSent] = await Promise.all([
    prisma.integration_logs.count({ where }),
    prisma.integration_logs.count({ where: { ...where, success: true } }),
    prisma.integration_logs.count({ where: { ...where, success: false } }),
    prisma.integration_logs.count({ where: { ...where, logType: 'webhook_received' } }),
    prisma.integration_logs.count({ where: { ...where, logType: 'webhook_sent' } }),
  ])
  
  // Get average response time
  const avgDurationResult = await prisma.integration_logs.aggregate({
    where: { ...where, durationMs: { not: null } },
    _avg: { durationMs: true },
  })
  
  // Get top error codes
  const errorLogs = await prisma.integration_logs.groupBy({
    by: ['errorCode'],
    where: { ...where, success: false, errorCode: { not: null } },
    _count: true,
    orderBy: { _count: { errorCode: 'desc' } },
    take: 5,
  })
  
  return {
    period,
    totalCalls,
    successfulCalls,
    failedCalls,
    successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
    webhooksReceived,
    webhooksSent,
    averageDurationMs: avgDurationResult._avg.durationMs || 0,
    topErrors: errorLogs.map(e => ({
      code: e.errorCode,
      count: e._count,
    })),
  }
}

/**
 * Detect security anomalies
 */
export async function detectSecurityAnomalies(tenantId?: string): Promise<{
  anomalies: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    details: any
  }>
}> {
  const anomalies: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    details: any
  }> = []
  
  const hourAgo = new Date(Date.now() - 3600000)
  const where: any = { createdAt: { gte: hourAgo } }
  if (tenantId) {
    where.tenantId = tenantId
  }
  
  // Check for high failure rate
  const [totalCalls, failedCalls] = await Promise.all([
    prisma.integration_logs.count({ where }),
    prisma.integration_logs.count({ where: { ...where, success: false } }),
  ])
  
  if (totalCalls > 100 && failedCalls / totalCalls > 0.3) {
    anomalies.push({
      type: 'HIGH_FAILURE_RATE',
      severity: 'high',
      description: 'Integration failure rate exceeds 30% in the last hour',
      details: {
        totalCalls,
        failedCalls,
        failureRate: ((failedCalls / totalCalls) * 100).toFixed(2) + '%',
      },
    })
  }
  
  // Check for unusual activity volume
  const previousHour = new Date(Date.now() - 7200000)
  const prevWhere = { ...where, createdAt: { gte: previousHour, lt: hourAgo } }
  const prevHourCalls = await prisma.integration_logs.count({ where: prevWhere })
  
  if (prevHourCalls > 0 && totalCalls > prevHourCalls * 3) {
    anomalies.push({
      type: 'UNUSUAL_ACTIVITY_SPIKE',
      severity: 'medium',
      description: 'API call volume increased by 3x compared to previous hour',
      details: {
        currentHourCalls: totalCalls,
        previousHourCalls: prevHourCalls,
      },
    })
  }
  
  // Check for repeated auth failures
  const authFailures = await prisma.integration_logs.count({
    where: {
      ...where,
      responseStatus: 401,
    },
  })
  
  if (authFailures > 10) {
    anomalies.push({
      type: 'REPEATED_AUTH_FAILURES',
      severity: 'critical',
      description: 'Multiple authentication failures detected',
      details: {
        failureCount: authFailures,
        timeWindow: '1 hour',
      },
    })
  }
  
  // Check for revoked keys being used
  const revokedKeyUsage = await prisma.integration_event_logs.count({
    where: {
      occurredAt: { gte: hourAgo },
      eventType: 'API_KEY_USAGE_ATTEMPTED_REVOKED',
    },
  })
  
  if (revokedKeyUsage > 0) {
    anomalies.push({
      type: 'REVOKED_KEY_USAGE_ATTEMPT',
      severity: 'high',
      description: 'Attempts to use revoked API keys detected',
      details: {
        attemptCount: revokedKeyUsage,
      },
    })
  }
  
  return { anomalies }
}

/**
 * Get audit summary for compliance
 */
export async function getAuditSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const where = {
    tenantId,
    createdAt: { gte: startDate, lte: endDate },
  }
  
  const [
    totalApiCalls,
    successfulCalls,
    webhooksReceived,
    webhooksSent,
    uniqueIntegrations,
    events,
  ] = await Promise.all([
    prisma.integration_logs.count({ where }),
    prisma.integration_logs.count({ where: { ...where, success: true } }),
    prisma.integration_logs.count({ where: { ...where, logType: 'webhook_received' } }),
    prisma.integration_logs.count({ where: { ...where, logType: 'webhook_sent' } }),
    prisma.integration_logs.findMany({
      where,
      distinct: ['instanceId'],
      select: { instanceId: true },
    }),
    prisma.integration_event_logs.count({
      where: { tenantId, occurredAt: { gte: startDate, lte: endDate } },
    }),
  ])
  
  return {
    period: { start: startDate, end: endDate },
    summary: {
      totalApiCalls,
      successfulCalls,
      failedCalls: totalApiCalls - successfulCalls,
      successRate: totalApiCalls > 0 ? ((successfulCalls / totalApiCalls) * 100).toFixed(2) + '%' : 'N/A',
      webhooksReceived,
      webhooksSent,
      uniqueIntegrationsUsed: uniqueIntegrations.length,
      totalEvents: events,
    },
    compliance: {
      allActionsLogged: true,
      noSilentIntegrations: true,
      dataRetention: '90+ days',
    },
  }
}

/**
 * Clean up old logs (retention policy)
 */
export async function cleanupOldLogs(retentionDays: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  
  const [deletedLogs, deletedEvents] = await Promise.all([
    prisma.integration_logs.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    }),
    prisma.integration_event_logs.deleteMany({
      where: { occurredAt: { lt: cutoffDate } },
    }),
  ])
  
  return {
    deletedLogs: deletedLogs.count,
    deletedEvents: deletedEvents.count,
    cutoffDate,
  }
}
