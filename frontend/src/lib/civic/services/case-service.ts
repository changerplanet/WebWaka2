/**
 * CIVIC SUITE: Case Service
 * 
 * Manages internal case workflow including assignments, notes, and status tracking.
 * Implements append-only patterns for audit compliance.
 * 
 * @module lib/civic/services/case-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicCaseStatus, CivicCasePriority } from '@prisma/client'

// ============================================================================
// CASE MANAGEMENT
// ============================================================================

/**
 * Generate unique case number
 */
export async function generateCaseNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_case.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `CASE-${year}-${number}`
}

/**
 * Create a case for a request
 */
export async function createCase(data: {
  tenantId: string
  requestId: string
  priority?: CivicCasePriority
  slaDeadline?: Date
}) {
  const caseNumber = await generateCaseNumber(data.tenantId)
  
  const civicCase = await prisma.civic_case.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      requestId: data.requestId,
      caseNumber,
      status: 'OPEN',
      priority: data.priority || 'NORMAL',
      slaDeadline: data.slaDeadline,
    }),
  })

  // Record initial status
  await recordStatusChange(
    data.tenantId,
    civicCase.id,
    null,
    'OPEN',
    'Case created',
    'System',
    'System'
  )

  return civicCase
}

/**
 * Get case by ID
 */
export async function getCase(tenantId: string, id: string) {
  return prisma.civic_case.findFirst({
    where: { tenantId, id },
    include: {
      request: {
        include: {
          service: true,
          citizen: true,
          organization: true,
        },
      },
      assignments: {
        where: { isActive: true },
        include: { staff: true },
      },
      notes: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      inspections: true,
      approvals: true,
    },
  })
}

/**
 * Get case by case number
 */
export async function getCaseByNumber(tenantId: string, caseNumber: string) {
  return prisma.civic_case.findFirst({
    where: { tenantId, caseNumber },
    include: {
      request: true,
      assignments: { where: { isActive: true }, include: { staff: true } },
    },
  })
}

/**
 * Update case status with audit trail
 */
export async function updateCaseStatus(
  tenantId: string,
  id: string,
  status: CivicCaseStatus,
  reason: string,
  changedById: string | undefined,
  changedByName: string
) {
  // Get current status
  const current = await prisma.civic_case.findFirst({
    where: { tenantId, id },
    select: { status: true },
  })
  
  if (!current) throw new Error('Case not found')

  // Update case
  const data: Record<string, unknown> = { status }
  
  if (status === 'RESOLVED') data.resolvedAt = new Date()
  if (status === 'CLOSED') data.closedAt = new Date()

  const updated = await prisma.civic_case.update({
    where: { id },
    data,
  })

  // Record status change (append-only)
  await recordStatusChange(
    tenantId,
    id,
    current.status,
    status,
    reason,
    changedById,
    changedByName
  )

  return updated
}

/**
 * Record status change (APPEND-ONLY)
 */
async function recordStatusChange(
  tenantId: string,
  caseId: string,
  fromStatus: CivicCaseStatus | null,
  toStatus: CivicCaseStatus,
  reason: string | undefined,
  changedById: string | undefined,
  changedByName: string
) {
  return prisma.civic_case_status_change.create({
    data: withPrismaDefaults({
      tenantId,
      caseId,
      fromStatus,
      toStatus,
      reason,
      changedById,
      changedByName,
    }),
  })
}

/**
 * Assign case to staff
 */
export async function assignCase(
  tenantId: string,
  caseId: string,
  staffId: string,
  assignedBy: string | undefined,
  assignerNote?: string
) {
  // Deactivate previous assignments
  await prisma.civic_case_assignment.updateMany({
    where: { tenantId, caseId, isActive: true },
    data: { isActive: false, completedAt: new Date() },
  })

  // Create new assignment
  const assignment = await prisma.civic_case_assignment.create({
    data: withPrismaDefaults({
      tenantId,
      caseId,
      staffId,
      assignedBy,
      assignerNote,
      isActive: true,
    }),
  })

  // Update case
  await prisma.civic_case.update({
    where: { id: caseId },
    data: {
      currentAssigneeId: staffId,
      status: 'ASSIGNED',
    },
  })

  return assignment
}

/**
 * Add case note (APPEND-ONLY)
 */
export async function addCaseNote(
  tenantId: string,
  caseId: string,
  content: string,
  authorId: string | undefined,
  authorName: string,
  noteType: string = 'INTERNAL',
  isInternal: boolean = true
) {
  return prisma.civic_case_note.create({
    data: withPrismaDefaults({
      tenantId,
      caseId,
      noteType,
      content,
      isInternal,
      authorId,
      authorName,
    }),
  })
}

/**
 * Get case notes
 */
export async function getCaseNotes(tenantId: string, caseId: string, includeInternal: boolean = true) {
  const where: Record<string, unknown> = { tenantId, caseId }
  if (!includeInternal) where.isInternal = false

  return prisma.civic_case_note.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Escalate case
 */
export async function escalateCase(
  tenantId: string,
  id: string,
  escalatedBy: string,
  escalationNote: string
) {
  return prisma.civic_case.update({
    where: { id },
    data: {
      isEscalated: true,
      escalatedAt: new Date(),
      escalatedBy,
      escalationNote,
      status: 'ESCALATED',
    },
  })
}

/**
 * List cases with filters
 */
export async function listCases(
  tenantId: string,
  options?: {
    status?: CivicCaseStatus
    priority?: CivicCasePriority
    assigneeId?: string
    isEscalated?: boolean
    slaBreached?: boolean
    page?: number
    limit?: number
  }
) {
  const {
    status,
    priority,
    assigneeId,
    isEscalated,
    slaBreached,
    page = 1,
    limit = 20,
  } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (assigneeId) where.currentAssigneeId = assigneeId
  if (isEscalated !== undefined) where.isEscalated = isEscalated
  if (slaBreached !== undefined) where.slaBreached = slaBreached

  const [cases, total] = await Promise.all([
    prisma.civic_case.findMany({
      where,
      skip,
      take: limit,
      include: {
        request: {
          select: {
            requestNumber: true,
            serviceName: true,
            applicantName: true,
          },
        },
        assignments: {
          where: { isActive: true },
          include: { staff: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.civic_case.count({ where }),
  ])

  return { cases, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get my assigned cases
 */
export async function getMyAssignedCases(tenantId: string, staffId: string) {
  return prisma.civic_case.findMany({
    where: {
      tenantId,
      currentAssigneeId: staffId,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
    },
    include: {
      request: {
        select: {
          requestNumber: true,
          serviceName: true,
          applicantName: true,
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { slaDeadline: 'asc' }],
  })
}

/**
 * Get cases with SLA breached or at risk
 */
export async function getCasesAtRisk(tenantId: string, hoursAhead: number = 24) {
  const riskDate = new Date()
  riskDate.setHours(riskDate.getHours() + hoursAhead)
  
  return prisma.civic_case.findMany({
    where: {
      tenantId,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      OR: [
        { slaBreached: true },
        {
          slaDeadline: {
            lte: riskDate,
          },
        },
      ],
    },
    include: {
      request: {
        select: { requestNumber: true, serviceName: true, applicantName: true },
      },
    },
    orderBy: { slaDeadline: 'asc' },
  })
}

/**
 * Check and mark SLA breaches
 */
export async function checkSlaBreaches(tenantId: string) {
  const now = new Date()
  
  return prisma.civic_case.updateMany({
    where: {
      tenantId,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      slaBreached: false,
      slaDeadline: { lt: now },
    },
    data: { slaBreached: true },
  })
}

/**
 * Get case audit trail
 */
export async function getCaseAuditTrail(tenantId: string, caseId: string) {
  const [statusChanges, notes, assignments] = await Promise.all([
    prisma.civic_case_status_change.findMany({
      where: { tenantId, caseId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.civic_case_note.findMany({
      where: { tenantId, caseId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.civic_case_assignment.findMany({
      where: { tenantId, caseId },
      include: { staff: { select: { firstName: true, lastName: true } } },
      orderBy: { assignedAt: 'asc' },
    }),
  ])

  // Combine and sort chronologically
  const trail = [
    ...statusChanges.map((s: any) => ({ type: 'STATUS_CHANGE' as const, ...s })),
    ...notes.map((n: any) => ({ type: 'NOTE' as const, ...n })),
    ...assignments.map((a: any) => {
      // Use assignedAt as the timestamp for sorting, exclude original createdAt
      const { createdAt: _createdAt, assignedAt, ...rest } = a
      return { type: 'ASSIGNMENT' as const, createdAt: assignedAt, ...rest }
    }),
  ].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return trail
}
