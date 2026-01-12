/**
 * HEALTH SUITE: Appointment Service
 * 
 * Appointment scheduling and walk-in management.
 * 
 * @module lib/health/appointment-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { HealthAppointmentStatus, HealthAppointmentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAppointmentInput {
  patientId: string
  providerId?: string
  facilityId?: string
  appointmentDate: Date
  appointmentTime?: string
  duration?: number
  type?: HealthAppointmentType
  isWalkIn?: boolean
  reason?: string
  notes?: string
}

export interface AppointmentFilters {
  patientId?: string
  providerId?: string
  facilityId?: string
  status?: HealthAppointmentStatus
  type?: HealthAppointmentType
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// APPOINTMENT CRUD
// ============================================================================

/**
 * Create an appointment
 */
export async function createAppointment(
  tenantId: string,
  input: CreateAppointmentInput,
  platformInstanceId?: string
) {
  const appointment = await prisma.health_appointment.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      patientId: input.patientId,
      providerId: input.providerId,
      facilityId: input.facilityId,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      duration: input.duration || 30,
      type: input.type || 'CONSULTATION',
      isWalkIn: input.isWalkIn || false,
      status: input.isWalkIn ? 'CHECKED_IN' : 'SCHEDULED',
      reason: input.reason,
      notes: input.notes,
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      facility: { select: { id: true, name: true } },
    },
  })
  
  return { success: true, appointment }
}

/**
 * Get appointment by ID
 */
export async function getAppointment(tenantId: string, appointmentId: string) {
  return prisma.health_appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true, specialty: true } },
      facility: { select: { id: true, name: true } },
      visit: true,
    },
  })
}

/**
 * List appointments
 */
export async function listAppointments(tenantId: string, filters: AppointmentFilters = {}) {
  const { patientId, providerId, facilityId, status, type, dateFrom, dateTo, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (patientId) where.patientId = patientId
  if (providerId) where.providerId = providerId
  if (facilityId) where.facilityId = facilityId
  if (status) where.status = status
  if (type) where.type = type
  
  if (dateFrom || dateTo) {
    where.appointmentDate = {}
    if (dateFrom) (where.appointmentDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.appointmentDate as Record<string, Date>).lte = dateTo
  }
  
  const [appointments, total] = await Promise.all([
    prisma.health_appointment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        facility: { select: { id: true, name: true } },
      },
    }),
    prisma.health_appointment.count({ where }),
  ])
  
  return { appointments, total, page, limit }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  tenantId: string,
  appointmentId: string,
  status: HealthAppointmentStatus,
  userId?: string,
  reason?: string
) {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  }
  
  // Track specific status changes
  if (status === 'CONFIRMED') {
    updateData.confirmedAt = new Date()
    updateData.confirmedBy = userId
  } else if (status === 'CHECKED_IN') {
    updateData.checkedInAt = new Date()
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date()
    updateData.cancelledBy = userId
    updateData.cancellationReason = reason
  }
  
  const appointment = await prisma.health_appointment.update({
    where: { id: appointmentId, tenantId },
    data: updateData,
  })
  
  return { success: true, appointment }
}

/**
 * Reschedule appointment
 */
export async function rescheduleAppointment(
  tenantId: string,
  appointmentId: string,
  newDate: Date,
  newTime?: string
) {
  const appointment = await prisma.health_appointment.update({
    where: { id: appointmentId, tenantId },
    data: {
      appointmentDate: newDate,
      appointmentTime: newTime,
      status: 'RESCHEDULED',
      updatedAt: new Date(),
    },
  })
  
  return { success: true, appointment }
}

// ============================================================================
// TODAY'S SCHEDULE
// ============================================================================

/**
 * Get today's appointments for a provider
 */
export async function getTodaySchedule(tenantId: string, providerId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return prisma.health_appointment.findMany({
    where: {
      tenantId,
      providerId,
      appointmentDate: { gte: today, lt: tomorrow },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
    },
    orderBy: { appointmentTime: 'asc' },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
    },
  })
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Record<string, unknown> = { tenantId }
  
  if (dateFrom || dateTo) {
    where.appointmentDate = {}
    if (dateFrom) (where.appointmentDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.appointmentDate as Record<string, Date>).lte = dateTo
  }
  
  const [total, completed, cancelled, noShow] = await Promise.all([
    prisma.health_appointment.count({ where }),
    prisma.health_appointment.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.health_appointment.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.health_appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
  ])
  
  return { total, completed, cancelled, noShow }
}
