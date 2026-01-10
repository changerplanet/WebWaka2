/**
 * CIVIC SUITE: Inspection Service
 * 
 * Manages field inspections and approval decisions.
 * Implements append-only patterns for findings and approvals.
 * 
 * @module lib/civic/services/inspection-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import {
  CivicInspectionStatus,
  CivicInspectionResult,
  CivicApprovalDecision,
  Prisma,
} from '@prisma/client'

// Helper to convert Record to Prisma Json type
type JsonInput = Prisma.InputJsonValue | undefined

// ============================================================================
// INSPECTION MANAGEMENT
// ============================================================================

/**
 * Generate unique inspection number
 */
export async function generateInspectionNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_inspection.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `INSP-${year}-${number}`
}

/**
 * Schedule an inspection
 */
export async function scheduleInspection(data: {
  tenantId: string
  caseId: string
  scheduledDate: Date
  scheduledTime?: string
  location?: Record<string, unknown>
  inspectorId?: string
  inspectorName?: string
}) {
  const inspectionNumber = await generateInspectionNumber(data.tenantId)
  
  return prisma.civic_inspection.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      caseId: data.caseId,
      inspectionNumber,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      location: data.location as JsonInput,
      inspectorId: data.inspectorId,
      inspectorName: data.inspectorName,
      status: 'SCHEDULED',
    }),
  })
}

/**
 * Get inspection by ID
 */
export async function getInspection(tenantId: string, id: string) {
  return prisma.civic_inspection.findFirst({
    where: { tenantId, id },
    include: {
      case: {
        include: {
          request: true,
        },
      },
      inspector: true,
      findings: { orderBy: { createdAt: 'asc' } },
    },
  })
}

/**
 * Get inspection by inspection number
 */
export async function getInspectionByNumber(tenantId: string, inspectionNumber: string) {
  return prisma.civic_inspection.findFirst({
    where: { tenantId, inspectionNumber },
  })
}

/**
 * Start inspection
 */
export async function startInspection(tenantId: string, id: string) {
  return prisma.civic_inspection.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  })
}

/**
 * Complete inspection with result
 */
export async function completeInspection(
  tenantId: string,
  id: string,
  result: CivicInspectionResult,
  resultNote?: string
) {
  return prisma.civic_inspection.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      result,
      resultNote,
    },
  })
}

/**
 * Reschedule inspection
 */
export async function rescheduleInspection(
  tenantId: string,
  id: string,
  newScheduledDate: Date,
  newScheduledTime?: string,
  rescheduleNote?: string
) {
  const current = await prisma.civic_inspection.findFirst({
    where: { tenantId, id },
    select: { scheduledDate: true },
  })

  return prisma.civic_inspection.update({
    where: { id },
    data: {
      status: 'RESCHEDULED',
      scheduledDate: newScheduledDate,
      scheduledTime: newScheduledTime,
      rescheduledFrom: current?.scheduledDate,
      rescheduleNote,
    },
  })
}

/**
 * Cancel inspection
 */
export async function cancelInspection(tenantId: string, id: string) {
  return prisma.civic_inspection.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}

/**
 * Add inspection finding (APPEND-ONLY)
 */
export async function addInspectionFinding(data: {
  tenantId: string
  inspectionId: string
  category: string
  description: string
  severity?: string
  photoUrls?: string[]
  notes?: string
  recordedById?: string
  recordedByName: string
}) {
  return prisma.civic_inspection_finding.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      inspectionId: data.inspectionId,
      category: data.category,
      description: data.description,
      severity: data.severity,
      photoUrls: data.photoUrls,
      notes: data.notes,
      recordedById: data.recordedById,
      recordedByName: data.recordedByName,
    }),
  })
}

/**
 * Get inspection findings
 */
export async function getInspectionFindings(tenantId: string, inspectionId: string) {
  return prisma.civic_inspection_finding.findMany({
    where: { tenantId, inspectionId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * List inspections with filters
 */
export async function listInspections(
  tenantId: string,
  options?: {
    inspectorId?: string
    status?: CivicInspectionStatus
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }
) {
  const { inspectorId, status, dateFrom, dateTo, page = 1, limit = 20 } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (inspectorId) where.inspectorId = inspectorId
  if (status) where.status = status
  
  if (dateFrom || dateTo) {
    where.scheduledDate = {}
    if (dateFrom) (where.scheduledDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.scheduledDate as Record<string, Date>).lte = dateTo
  }

  const [inspections, total] = await Promise.all([
    prisma.civic_inspection.findMany({
      where,
      skip,
      take: limit,
      include: {
        case: {
          select: {
            caseNumber: true,
            request: { select: { serviceName: true, applicantName: true } },
          },
        },
        inspector: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.civic_inspection.count({ where }),
  ])

  return { inspections, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get today's inspections for an inspector
 */
export async function getTodayInspections(tenantId: string, inspectorId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const where: Record<string, unknown> = {
    tenantId,
    scheduledDate: { gte: today, lt: tomorrow },
    status: { in: ['SCHEDULED', 'RESCHEDULED'] },
  }
  if (inspectorId) where.inspectorId = inspectorId

  return prisma.civic_inspection.findMany({
    where,
    include: {
      case: {
        select: {
          caseNumber: true,
          request: { select: { serviceName: true, applicantName: true } },
        },
      },
    },
    orderBy: { scheduledTime: 'asc' },
  })
}

// ============================================================================
// APPROVAL MANAGEMENT (APPEND-ONLY)
// ============================================================================

/**
 * Generate unique approval number
 */
export async function generateApprovalNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_approval.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `APR-${year}-${number}`
}

/**
 * Record approval decision (APPEND-ONLY)
 */
export async function recordApproval(data: {
  tenantId: string
  caseId: string
  decision: CivicApprovalDecision
  approverId?: string
  approverName: string
  approverRole?: string
  rationale?: string
  conditions?: string
  referenceNote?: string
}) {
  const approvalNumber = await generateApprovalNumber(data.tenantId)
  
  return prisma.civic_approval.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      caseId: data.caseId,
      approvalNumber,
      decision: data.decision,
      decisionDate: new Date(),
      approverId: data.approverId,
      approverName: data.approverName,
      approverRole: data.approverRole,
      rationale: data.rationale,
      conditions: data.conditions,
      referenceNote: data.referenceNote,
    }),
  })
}

/**
 * Get approval by ID
 */
export async function getApproval(tenantId: string, id: string) {
  return prisma.civic_approval.findFirst({
    where: { tenantId, id },
    include: {
      case: {
        include: {
          request: true,
        },
      },
      approver: true,
    },
  })
}

/**
 * Get approvals for a case
 */
export async function getCaseApprovals(tenantId: string, caseId: string) {
  return prisma.civic_approval.findMany({
    where: { tenantId, caseId },
    orderBy: { decisionDate: 'desc' },
  })
}

/**
 * List approvals with filters
 */
export async function listApprovals(
  tenantId: string,
  options?: {
    decision?: CivicApprovalDecision
    approverId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }
) {
  const { decision, approverId, dateFrom, dateTo, page = 1, limit = 20 } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (decision) where.decision = decision
  if (approverId) where.approverId = approverId
  
  if (dateFrom || dateTo) {
    where.decisionDate = {}
    if (dateFrom) (where.decisionDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.decisionDate as Record<string, Date>).lte = dateTo
  }

  const [approvals, total] = await Promise.all([
    prisma.civic_approval.findMany({
      where,
      skip,
      take: limit,
      include: {
        case: {
          select: {
            caseNumber: true,
            request: { select: { serviceName: true, applicantName: true } },
          },
        },
      },
      orderBy: { decisionDate: 'desc' },
    }),
    prisma.civic_approval.count({ where }),
  ])

  return { approvals, total, page, limit, totalPages: Math.ceil(total / limit) }
}
