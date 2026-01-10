/**
 * HEALTH SUITE: Prescription Service
 * 
 * Prescription facts management.
 * Health records prescription FACTS only.
 * Fulfillment/dispensing is external (pharmacy).
 * 
 * @module lib/health/prescription-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthPrescriptionStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePrescriptionInput {
  patientId: string
  encounterId: string
  prescriberId: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  quantity?: number
  route?: string
  instructions?: string
  expiresAt?: Date
}

export interface PrescriptionFilters {
  patientId?: string
  prescriberId?: string
  encounterId?: string
  status?: HealthPrescriptionStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// PRESCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create a prescription
 */
export async function createPrescription(
  tenantId: string,
  input: CreatePrescriptionInput,
  platformInstanceId?: string
) {
  // Default expiry: 30 days
  const expiresAt = input.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  const prescription = await prisma.health_prescription.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      patientId: input.patientId,
      encounterId: input.encounterId,
      prescriberId: input.prescriberId,
      medication: input.medication,
      dosage: input.dosage,
      frequency: input.frequency,
      duration: input.duration,
      quantity: input.quantity,
      route: input.route,
      instructions: input.instructions,
      status: 'ACTIVE',
      expiresAt,
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
  
  return { success: true, prescription }
}

/**
 * Get prescription by ID
 */
export async function getPrescription(tenantId: string, prescriptionId: string) {
  return prisma.health_prescription.findFirst({
    where: { id: prescriptionId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
      prescriber: { select: { id: true, firstName: true, lastName: true, title: true, licenseNumber: true } },
      encounter: { select: { id: true, encounterDate: true } },
    },
  })
}

/**
 * List prescriptions
 */
export async function listPrescriptions(tenantId: string, filters: PrescriptionFilters = {}) {
  const { patientId, prescriberId, encounterId, status, dateFrom, dateTo, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (patientId) where.patientId = patientId
  if (prescriberId) where.prescriberId = prescriberId
  if (encounterId) where.encounterId = encounterId
  if (status) where.status = status
  
  if (dateFrom || dateTo) {
    where.prescribedAt = {}
    if (dateFrom) (where.prescribedAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.prescribedAt as Record<string, Date>).lte = dateTo
  }
  
  const [prescriptions, total] = await Promise.all([
    prisma.health_prescription.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { prescribedAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    }),
    prisma.health_prescription.count({ where }),
  ])
  
  return { prescriptions, total, page, limit }
}

/**
 * Get patient's active prescriptions
 */
export async function getActivePrescriptions(tenantId: string, patientId: string) {
  return prisma.health_prescription.findMany({
    where: {
      tenantId,
      patientId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    orderBy: { prescribedAt: 'desc' },
    include: {
      prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
}

/**
 * Record dispensing (called by pharmacy/external system)
 * NOTE: Health does not handle fulfillment - this is a callback
 */
export async function recordDispensing(
  tenantId: string,
  prescriptionId: string,
  dispensedBy: string,
  dispensingNote?: string,
  partial?: boolean
) {
  const prescription = await prisma.health_prescription.update({
    where: { id: prescriptionId, tenantId },
    data: {
      status: partial ? 'PARTIALLY_DISPENSED' : 'DISPENSED',
      dispensedAt: new Date(),
      dispensedBy,
      dispensingNote,
    },
  })
  
  return { success: true, prescription }
}

/**
 * Cancel a prescription
 */
export async function cancelPrescription(
  tenantId: string,
  prescriptionId: string
) {
  const prescription = await prisma.health_prescription.update({
    where: { id: prescriptionId, tenantId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })
  
  return { success: true, prescription }
}

/**
 * Get prescription statistics
 */
export async function getPrescriptionStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Record<string, unknown> = { tenantId }
  
  if (dateFrom || dateTo) {
    where.prescribedAt = {}
    if (dateFrom) (where.prescribedAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.prescribedAt as Record<string, Date>).lte = dateTo
  }
  
  const [total, active, dispensed, expired] = await Promise.all([
    prisma.health_prescription.count({ where }),
    prisma.health_prescription.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.health_prescription.count({ where: { ...where, status: { in: ['DISPENSED', 'PARTIALLY_DISPENSED'] } } }),
    prisma.health_prescription.count({ where: { ...where, status: 'EXPIRED' } }),
  ])
  
  return { total, active, dispensed, expired }
}
