/**
 * HEALTH SUITE: Visit Service
 * 
 * Patient visit lifecycle management.
 * Supports both scheduled appointments and walk-ins.
 * 
 * @module lib/health/visit-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthVisitStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreateVisitInput {
  patientId: string
  appointmentId?: string // Optional - null for walk-ins
  providerId?: string
  facilityId?: string
  chiefComplaint?: string
  isWalkIn?: boolean
}

export interface VisitFilters {
  patientId?: string
  providerId?: string
  facilityId?: string
  status?: HealthVisitStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// VISIT CRUD
// ============================================================================

/**
 * Create a visit (from appointment or walk-in)
 */
export async function createVisit(
  tenantId: string,
  input: CreateVisitInput,
  platformInstanceId?: string
) {
  // Generate visit number
  const visitNumber = await generateVisitNumber(tenantId)
  
  const visit = await prisma.health_visit.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      visitNumber,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      providerId: input.providerId,
      facilityId: input.facilityId,
      chiefComplaint: input.chiefComplaint,
      isWalkIn: input.isWalkIn || !input.appointmentId,
      status: 'REGISTERED',
      registeredAt: new Date(),
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      facility: { select: { id: true, name: true } },
    },
  })
  
  // Update appointment status if linked
  if (input.appointmentId) {
    await prisma.health_appointment.update({
      where: { id: input.appointmentId },
      data: { status: 'IN_PROGRESS' },
    })
  }
  
  return { success: true, visit, visitNumber }
}

/**
 * Get visit by ID
 */
export async function getVisit(tenantId: string, visitId: string) {
  return prisma.health_visit.findFirst({
    where: { id: visitId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true, allergies: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true, specialty: true } },
      facility: { select: { id: true, name: true } },
      appointment: true,
      encounters: {
        orderBy: { createdAt: 'desc' },
        include: {
          notes: true,
          diagnoses: true,
          prescriptions: true,
          labOrders: { include: { results: true } },
        },
      },
      billingFacts: true,
    },
  })
}

/**
 * Get visit by visit number
 */
export async function getVisitByNumber(tenantId: string, visitNumber: string) {
  return prisma.health_visit.findFirst({
    where: { visitNumber, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      encounters: true,
    },
  })
}

/**
 * List visits
 */
export async function listVisits(tenantId: string, filters: VisitFilters = {}) {
  const { patientId, providerId, facilityId, status, dateFrom, dateTo, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (patientId) where.patientId = patientId
  if (providerId) where.providerId = providerId
  if (facilityId) where.facilityId = facilityId
  if (status) where.status = status
  
  if (dateFrom || dateTo) {
    where.visitDate = {}
    if (dateFrom) (where.visitDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.visitDate as Record<string, Date>).lte = dateTo
  }
  
  const [visits, total] = await Promise.all([
    prisma.health_visit.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        facility: { select: { id: true, name: true } },
      },
    }),
    prisma.health_visit.count({ where }),
  ])
  
  return { visits, total, page, limit }
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  tenantId: string,
  visitId: string,
  status: HealthVisitStatus
) {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  }
  
  // Track timing
  if (status === 'IN_CONSULTATION') {
    updateData.consultStartAt = new Date()
  } else if (status === 'COMPLETED' || status === 'DISCHARGED') {
    updateData.consultEndAt = new Date()
    updateData.dischargedAt = new Date()
  }
  
  const visit = await prisma.health_visit.update({
    where: { id: visitId, tenantId },
    data: updateData,
  })
  
  // Update linked appointment
  if (visit.appointmentId && (status === 'COMPLETED' || status === 'DISCHARGED')) {
    await prisma.health_appointment.update({
      where: { id: visit.appointmentId },
      data: { status: 'COMPLETED' },
    })
  }
  
  return { success: true, visit }
}

/**
 * Assign provider to visit
 */
export async function assignProvider(
  tenantId: string,
  visitId: string,
  providerId: string
) {
  const visit = await prisma.health_visit.update({
    where: { id: visitId, tenantId },
    data: {
      providerId,
      updatedAt: new Date(),
    },
  })
  
  return { success: true, visit }
}

// ============================================================================
// WAITING QUEUE
// ============================================================================

/**
 * Get waiting queue for a facility
 */
export async function getWaitingQueue(tenantId: string, facilityId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const where: Record<string, unknown> = {
    tenantId,
    visitDate: { gte: today },
    status: { in: ['REGISTERED', 'WAITING', 'IN_LAB'] },
  }
  if (facilityId) where.facilityId = facilityId
  
  return prisma.health_visit.findMany({
    where,
    orderBy: { registeredAt: 'asc' },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
}

/**
 * Get visit statistics
 */
export async function getVisitStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Record<string, unknown> = { tenantId }
  
  if (dateFrom || dateTo) {
    where.visitDate = {}
    if (dateFrom) (where.visitDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.visitDate as Record<string, Date>).lte = dateTo
  }
  
  const [total, completed, walkIns] = await Promise.all([
    prisma.health_visit.count({ where }),
    prisma.health_visit.count({ where: { ...where, status: { in: ['COMPLETED', 'DISCHARGED'] } } }),
    prisma.health_visit.count({ where: { ...where, isWalkIn: true } }),
  ])
  
  return { total, completed, walkIns }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique visit number
 */
async function generateVisitNumber(tenantId: string): Promise<string> {
  let config = await prisma.health_config.findUnique({
    where: { tenantId },
  })
  
  if (!config) {
    config = await prisma.health_config.create({
      data: withPrismaDefaults({ tenantId }),
    })
  }
  
  const prefix = config.visitNumberPrefix || 'VST'
  const seq = config.visitNumberNextSeq || 1
  
  await prisma.health_config.update({
    where: { tenantId },
    data: { visitNumberNextSeq: seq + 1 },
  })
  
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`
}
