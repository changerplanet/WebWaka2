/**
 * HEALTH SUITE: Lab Order Service
 * 
 * Lab/diagnostic order and result management.
 * Health records orders and results as FACTS.
 * Lab processing is external.
 * 
 * @module lib/health/lab-order-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthLabOrderStatus, HealthLabOrderUrgency, HealthResultInterpretation } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLabOrderInput {
  patientId: string
  encounterId: string
  orderedById: string
  testName: string
  testCode?: string
  testType?: string
  urgency?: HealthLabOrderUrgency
  clinicalInfo?: string
}

export interface RecordResultInput {
  labOrderId: string
  parameterName: string
  resultValue: string
  unit?: string
  referenceRange?: string
  interpretation?: HealthResultInterpretation
  comment?: string
  resultedBy?: string
  resultedByName?: string
}

export interface LabOrderFilters {
  patientId?: string
  orderedById?: string
  encounterId?: string
  status?: HealthLabOrderStatus
  urgency?: HealthLabOrderUrgency
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// LAB ORDER MANAGEMENT
// ============================================================================

/**
 * Create a lab order
 */
export async function createLabOrder(
  tenantId: string,
  input: CreateLabOrderInput,
  platformInstanceId?: string
) {
  const labOrder = await prisma.health_lab_order.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      orderedById: input.orderedById,
      testName: input.testName,
      testCode: input.testCode,
      testType: input.testType,
      urgency: input.urgency || 'ROUTINE',
      clinicalInfo: input.clinicalInfo,
      status: 'ORDERED',
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
  
  return { success: true, labOrder }
}

/**
 * Get lab order by ID
 */
export async function getLabOrder(tenantId: string, labOrderId: string) {
  return prisma.health_lab_order.findFirst({
    where: { id: labOrderId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
      orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
      encounter: { select: { id: true, encounterDate: true } },
      results: { orderBy: { createdAt: 'asc' } },
    },
  })
}

/**
 * List lab orders
 */
export async function listLabOrders(tenantId: string, filters: LabOrderFilters = {}) {
  const { patientId, orderedById, encounterId, status, urgency, dateFrom, dateTo, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (patientId) where.patientId = patientId
  if (orderedById) where.orderedById = orderedById
  if (encounterId) where.encounterId = encounterId
  if (status) where.status = status
  if (urgency) where.urgency = urgency
  
  if (dateFrom || dateTo) {
    where.orderedAt = {}
    if (dateFrom) (where.orderedAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.orderedAt as Record<string, Date>).lte = dateTo
  }
  
  const [labOrders, total] = await Promise.all([
    prisma.health_lab_order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ urgency: 'desc' }, { orderedAt: 'desc' }],
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
        results: true,
      },
    }),
    prisma.health_lab_order.count({ where }),
  ])
  
  return { labOrders, total, page, limit }
}

/**
 * Get pending lab orders (for lab queue)
 */
export async function getPendingLabOrders(tenantId: string) {
  return prisma.health_lab_order.findMany({
    where: {
      tenantId,
      status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] },
    },
    orderBy: [
      { urgency: 'desc' }, // STAT first
      { orderedAt: 'asc' },
    ],
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
      orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
}

/**
 * Update lab order status
 */
export async function updateLabOrderStatus(
  tenantId: string,
  labOrderId: string,
  status: HealthLabOrderStatus
) {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  }
  
  if (status === 'SAMPLE_COLLECTED') {
    updateData.sampleCollectedAt = new Date()
  } else if (status === 'COMPLETED') {
    updateData.processedAt = new Date()
  }
  
  const labOrder = await prisma.health_lab_order.update({
    where: { id: labOrderId, tenantId },
    data: updateData,
  })
  
  return { success: true, labOrder }
}

/**
 * Cancel a lab order
 */
export async function cancelLabOrder(
  tenantId: string,
  labOrderId: string
) {
  const labOrder = await prisma.health_lab_order.update({
    where: { id: labOrderId, tenantId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })
  
  return { success: true, labOrder }
}

// ============================================================================
// LAB RESULTS (APPEND-ONLY, IMMUTABLE)
// ============================================================================

/**
 * Record a lab result (IMMUTABLE after creation)
 */
export async function recordLabResult(
  tenantId: string,
  input: RecordResultInput,
  platformInstanceId?: string
) {
  // Results are IMMUTABLE - they cannot be edited or deleted
  const result = await prisma.health_lab_result.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      labOrderId: input.labOrderId,
      parameterName: input.parameterName,
      resultValue: input.resultValue,
      unit: input.unit,
      referenceRange: input.referenceRange,
      interpretation: input.interpretation || 'NORMAL',
      comment: input.comment,
      resultedBy: input.resultedBy,
      resultedByName: input.resultedByName,
    }),
  })
  
  return { success: true, result }
}

/**
 * Verify a lab result
 */
export async function verifyLabResult(
  tenantId: string,
  resultId: string,
  verifiedBy: string,
  verifiedByName: string
) {
  const result = await prisma.health_lab_result.update({
    where: { id: resultId, tenantId },
    data: {
      verifiedAt: new Date(),
      verifiedBy,
      verifiedByName,
    },
  })
  
  return { success: true, result }
}

/**
 * Get lab results for an order
 */
export async function getLabOrderResults(tenantId: string, labOrderId: string) {
  return prisma.health_lab_result.findMany({
    where: { tenantId, labOrderId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get patient lab history
 */
export async function getPatientLabHistory(
  tenantId: string,
  patientId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options
  
  const [labOrders, total] = await Promise.all([
    prisma.health_lab_order.findMany({
      where: { tenantId, patientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { orderedAt: 'desc' },
      include: {
        orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
        results: true,
      },
    }),
    prisma.health_lab_order.count({ where: { tenantId, patientId } }),
  ])
  
  return { labOrders, total, page, limit }
}

/**
 * Get lab order statistics
 */
export async function getLabOrderStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Record<string, unknown> = { tenantId }
  
  if (dateFrom || dateTo) {
    where.orderedAt = {}
    if (dateFrom) (where.orderedAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.orderedAt as Record<string, Date>).lte = dateTo
  }
  
  const [total, pending, completed, critical] = await Promise.all([
    prisma.health_lab_order.count({ where }),
    prisma.health_lab_order.count({ where: { ...where, status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] } } }),
    prisma.health_lab_order.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.health_lab_result.count({
      where: {
        tenantId,
        interpretation: 'CRITICAL',
        ...(where.orderedAt ? { createdAt: where.orderedAt as { gte?: Date; lte?: Date } } : {}),
      },
    }),
  ])
  
  return { total, pending, completed, critical }
}
