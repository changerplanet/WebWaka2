/**
 * HOSPITALITY SUITE: Staff & Shift Service
 * 
 * Manages operational staff and shift scheduling.
 * 
 * @module lib/hospitality/services/staff-shift-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityStaffRole, HospitalityShiftType, HospitalityShiftStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStaffInput {
  tenantId: string
  venueId: string
  userId?: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  email?: string
  role: HospitalityStaffRole
  department?: string
  designation?: string
  employeeId?: string
  hireDate?: Date
}

export interface CreateShiftInput {
  tenantId: string
  staffId: string
  shiftType: HospitalityShiftType
  shiftDate: Date
  scheduledStart: Date
  scheduledEnd: Date
  station?: string
  notes?: string
}

export interface StaffSearchOptions {
  venueId?: string
  role?: HospitalityStaffRole
  department?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ShiftSearchOptions {
  staffId?: string
  venueId?: string
  shiftType?: HospitalityShiftType
  status?: HospitalityShiftStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// STAFF OPERATIONS
// ============================================================================

export async function createStaff(input: CreateStaffInput) {
  return prisma.hospitality_staff.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      phone: input.phone,
      email: input.email,
      role: input.role,
      department: input.department,
      designation: input.designation,
      employeeId: input.employeeId,
      hireDate: input.hireDate,
      isActive: true
    }),
    include: { venue: true }
  })
}

export async function getStaff(tenantId: string, staffId: string) {
  return prisma.hospitality_staff.findFirst({
    where: { id: staffId, tenantId },
    include: {
      venue: true,
      shifts: {
        where: { shiftDate: { gte: new Date() } },
        orderBy: { shiftDate: 'asc' },
        take: 5
      }
    }
  })
}

export async function listStaff(tenantId: string, options?: StaffSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.venueId && { venueId: options.venueId }),
    ...(options?.role && { role: options.role }),
    ...(options?.department && { department: options.department }),
    isActive: options?.isActive ?? true
  }

  const [staff, total] = await Promise.all([
    prisma.hospitality_staff.findMany({
      where,
      include: { venue: true },
      skip,
      take: limit,
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }]
    }),
    prisma.hospitality_staff.count({ where })
  ])

  return { staff, total, page, limit }
}

export async function updateStaff(tenantId: string, staffId: string, data: Partial<CreateStaffInput>) {
  return prisma.hospitality_staff.update({
    where: { id: staffId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      phone: data.phone,
      email: data.email,
      role: data.role,
      department: data.department,
      designation: data.designation,
      employeeId: data.employeeId,
      hireDate: data.hireDate,
      updatedAt: new Date()
    }
  })
}

export async function deactivateStaff(tenantId: string, staffId: string) {
  return prisma.hospitality_staff.update({
    where: { id: staffId },
    data: { isActive: false, updatedAt: new Date() }
  })
}

export async function getStaffByRole(tenantId: string, venueId: string, role: HospitalityStaffRole) {
  return prisma.hospitality_staff.findMany({
    where: { tenantId, venueId, role, isActive: true },
    orderBy: { lastName: 'asc' }
  })
}

// ============================================================================
// SHIFT OPERATIONS
// ============================================================================

export async function createShift(input: CreateShiftInput) {
  return prisma.hospitality_shift.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      staffId: input.staffId,
      shiftType: input.shiftType,
      shiftDate: input.shiftDate,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      station: input.station,
      notes: input.notes,
      status: 'SCHEDULED'
    }),
    include: { staff: true }
  })
}

export async function getShift(tenantId: string, shiftId: string) {
  return prisma.hospitality_shift.findFirst({
    where: { id: shiftId, tenantId },
    include: { staff: { include: { venue: true } } }
  })
}

export async function listShifts(tenantId: string, options?: ShiftSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.staffId && { staffId: options.staffId }),
    ...(options?.venueId && { staff: { venueId: options.venueId } }),
    ...(options?.shiftType && { shiftType: options.shiftType }),
    ...(options?.status && { status: options.status }),
    ...(options?.dateFrom && options?.dateTo && {
      shiftDate: { gte: options.dateFrom, lte: options.dateTo }
    })
  }

  const [shifts, total] = await Promise.all([
    prisma.hospitality_shift.findMany({
      where,
      include: { staff: true },
      skip,
      take: limit,
      orderBy: [{ shiftDate: 'asc' }, { scheduledStart: 'asc' }]
    }),
    prisma.hospitality_shift.count({ where })
  ])

  return { shifts, total, page, limit }
}

export async function updateShift(tenantId: string, shiftId: string, data: Partial<CreateShiftInput>) {
  return prisma.hospitality_shift.update({
    where: { id: shiftId },
    data: {
      shiftType: data.shiftType,
      shiftDate: data.shiftDate,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      station: data.station,
      notes: data.notes,
      updatedAt: new Date()
    }
  })
}

// ============================================================================
// SHIFT STATUS TRANSITIONS
// ============================================================================

export async function startShift(tenantId: string, shiftId: string) {
  return prisma.hospitality_shift.update({
    where: { id: shiftId },
    data: { status: 'ACTIVE', actualStart: new Date(), updatedAt: new Date() },
    include: { staff: true }
  })
}

export async function endShift(tenantId: string, shiftId: string) {
  return prisma.hospitality_shift.update({
    where: { id: shiftId },
    data: { status: 'COMPLETED', actualEnd: new Date(), updatedAt: new Date() },
    include: { staff: true }
  })
}

export async function cancelShift(tenantId: string, shiftId: string) {
  return prisma.hospitality_shift.update({
    where: { id: shiftId },
    data: { status: 'CANCELLED', updatedAt: new Date() }
  })
}

export async function markNoShowShift(tenantId: string, shiftId: string) {
  return prisma.hospitality_shift.update({
    where: { id: shiftId },
    data: { status: 'NO_SHOW', updatedAt: new Date() }
  })
}

// ============================================================================
// SCHEDULE VIEWS
// ============================================================================

export async function getTodayShifts(tenantId: string, venueId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.hospitality_shift.findMany({
    where: {
      tenantId,
      staff: { venueId },
      shiftDate: { gte: today, lt: tomorrow }
    },
    include: { staff: true },
    orderBy: { scheduledStart: 'asc' }
  })
}

export async function getActiveStaff(tenantId: string, venueId: string) {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.hospitality_shift.findMany({
    where: {
      tenantId,
      staff: { venueId },
      shiftDate: { gte: today, lt: tomorrow },
      status: 'ACTIVE'
    },
    include: { staff: true },
    orderBy: { actualStart: 'asc' }
  })
}

export async function getWeekSchedule(tenantId: string, venueId: string, weekStart: Date) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const shifts = await prisma.hospitality_shift.findMany({
    where: {
      tenantId,
      staff: { venueId },
      shiftDate: { gte: weekStart, lt: weekEnd }
    },
    include: { staff: true },
    orderBy: [{ shiftDate: 'asc' }, { scheduledStart: 'asc' }]
  })

  // Group by date
  const schedule: Record<string, typeof shifts> = {}
  for (const shift of shifts) {
    const dateKey = shift.shiftDate.toISOString().split('T')[0]
    if (!schedule[dateKey]) schedule[dateKey] = []
    schedule[dateKey].push(shift)
  }

  return schedule
}

// ============================================================================
// STAFF AVAILABILITY
// ============================================================================

export async function getAvailableStaff(
  tenantId: string, 
  venueId: string, 
  date: Date, 
  startTime: Date, 
  endTime: Date,
  role?: HospitalityStaffRole
) {
  // Get all staff
  const allStaff = await prisma.hospitality_staff.findMany({
    where: {
      tenantId,
      venueId,
      ...(role && { role }),
      isActive: true
    }
  })

  // Get scheduled shifts for the date
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const scheduledShifts = await prisma.hospitality_shift.findMany({
    where: {
      tenantId,
      staff: { venueId },
      shiftDate: { gte: dayStart, lte: dayEnd },
      status: { in: ['SCHEDULED', 'ACTIVE'] }
    },
    select: { staffId: true, scheduledStart: true, scheduledEnd: true }
  })

  // Filter staff with no overlapping shifts
  const availableStaff = allStaff.filter(staff => {
    const staffShifts = scheduledShifts.filter((s: any) => s.staffId === staff.id)
    
    for (const shift of staffShifts) {
      // Check for overlap
      if (startTime < shift.scheduledEnd && endTime > shift.scheduledStart) {
        return false
      }
    }
    
    return true
  })

  return availableStaff
}
