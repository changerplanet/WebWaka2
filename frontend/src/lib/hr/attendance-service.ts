/**
 * MODULE 5: HR & PAYROLL
 * Attendance Service - Clock-in/out and attendance tracking
 * 
 * PHASE 2: Attendance & Shift Management
 */

import { prisma } from '@/lib/prisma'
import { HrAttendanceStatus, HrClockMethod, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface ClockInInput {
  employeeProfileId: string
  method?: HrClockMethod
  locationId?: string
  latitude?: number
  longitude?: number
  notes?: string
  offlineId?: string
  recordedAt?: Date
}

export interface ClockOutInput {
  employeeProfileId: string
  method?: HrClockMethod
  locationId?: string
  latitude?: number
  longitude?: number
  notes?: string
  offlineId?: string
  recordedAt?: Date
}

export interface ManualAttendanceInput {
  employeeProfileId: string
  date: Date
  clockIn?: Date
  clockOut?: Date
  breakStart?: Date
  breakEnd?: Date
  status?: HrAttendanceStatus
  notes?: string
  adminNotes?: string
  requiresApproval?: boolean
  offlineId?: string
}

export interface AttendanceSummary {
  employeeProfileId: string
  periodStart: Date
  periodEnd: Date
  totalDays: number
  daysPresent: number
  daysAbsent: number
  daysLate: number
  daysOnLeave: number
  totalWorkedMinutes: number
  totalOvertimeMinutes: number
  avgWorkHoursPerDay: number
}

// ============================================================================
// ATTENDANCE SERVICE
// ============================================================================

export class AttendanceService {
  /**
   * Clock in an employee
   */
  static async clockIn(tenantId: string, input: ClockInInput, createdBy?: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check for existing record today
    let record = await prisma.hr_attendance_records.findUnique({
      where: {
        employeeProfileId_date: {
          employeeProfileId: input.employeeProfileId,
          date: today,
        },
      },
    })

    const now = input.recordedAt || new Date()

    if (record) {
      // Update existing record
      if (record.clockIn) {
        throw new Error('Already clocked in today')
      }
      
      record = await prisma.hr_attendance_records.update({
        where: { id: record.id },
        data: {
          clockIn: now,
          clockInMethod: input.method || 'SELF_SERVICE',
          clockInLocationId: input.locationId,
          clockInLatitude: input.latitude,
          clockInLongitude: input.longitude,
          status: 'PRESENT',
          notes: input.notes,
          updatedBy: createdBy,
        },
      })
    } else {
      // Create new record
      record = await prisma.hr_attendance_records.create({
        data: withPrismaDefaults({
          tenantId,
          employeeProfileId: input.employeeProfileId,
          date: today,
          clockIn: now,
          clockInMethod: input.method || 'SELF_SERVICE',
          clockInLocationId: input.locationId,
          clockInLatitude: input.latitude,
          clockInLongitude: input.longitude,
          status: 'PRESENT',
          notes: input.notes,
          offlineId: input.offlineId,
          recordedAt: now,
          syncedAt: input.offlineId ? new Date() : null,
          createdBy,
        }),
      })
    }

    // Calculate late minutes
    await this.calculateLateMinutes(record.id, tenantId)

    return record
  }

  /**
   * Clock out an employee
   */
  static async clockOut(tenantId: string, input: ClockOutInput, updatedBy?: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const record = await prisma.hr_attendance_records.findUnique({
      where: {
        employeeProfileId_date: {
          employeeProfileId: input.employeeProfileId,
          date: today,
        },
      },
    })

    if (!record) {
      throw new Error('No clock-in record found for today')
    }

    if (record.clockOut) {
      throw new Error('Already clocked out today')
    }

    const now = input.recordedAt || new Date()

    const updated = await prisma.hr_attendance_records.update({
      where: { id: record.id },
      data: {
        clockOut: now,
        clockOutMethod: input.method || 'SELF_SERVICE',
        clockOutLocationId: input.locationId,
        clockOutLatitude: input.latitude,
        clockOutLongitude: input.longitude,
        notes: input.notes ? `${record.notes || ''}\n${input.notes}`.trim() : record.notes,
        updatedBy,
      },
    })

    // Calculate worked minutes and overtime
    await this.calculateWorkedMinutes(updated.id, tenantId)

    return updated
  }

  /**
   * Create manual attendance entry
   */
  static async createManualAttendance(tenantId: string, input: ManualAttendanceInput, createdBy?: string) {
    const date = new Date(input.date)
    date.setHours(0, 0, 0, 0)

    // Check for duplicate
    if (input.offlineId) {
      const existing = await prisma.hr_attendance_records.findFirst({
        where: { offlineId: input.offlineId },
      })
      if (existing) return existing
    }

    const record = await prisma.hr_attendance_records.upsert({
      where: {
        employeeProfileId_date: {
          employeeProfileId: input.employeeProfileId,
          date,
        },
      },
      create: withPrismaDefaults({
        tenantId,
        employeeProfileId: input.employeeProfileId,
        date,
        clockIn: input.clockIn,
        clockOut: input.clockOut,
        breakStart: input.breakStart,
        breakEnd: input.breakEnd,
        status: input.status || 'PRESENT',
        clockInMethod: 'MANUAL',
        clockOutMethod: input.clockOut ? 'MANUAL' : null,
        notes: input.notes,
        adminNotes: input.adminNotes,
        requiresApproval: input.requiresApproval ?? false,
        createdBy,
      }),
      update: {
        clockIn: input.clockIn,
        clockOut: input.clockOut,
        breakStart: input.breakStart,
        breakEnd: input.breakEnd,
        status: input.status,
        notes: input.notes,
        adminNotes: input.adminNotes,
        updatedBy: createdBy,
      },
    })

    // Calculate minutes if both clock in and out are set
    if (record.clockIn && record.clockOut) {
      await this.calculateWorkedMinutes(record.id, tenantId)
    }

    return record
  }

  /**
   * Calculate late minutes based on schedule
   */
  private static async calculateLateMinutes(recordId: string, tenantId: string) {
    const record = await prisma.hr_attendance_records.findUnique({
      where: { id: recordId },
      include: { hr_employee_profiles: true },
    })

    if (!record?.clockIn) return

    // Get HR config for late threshold
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
    })

    const lateThreshold = config?.lateThresholdMinutes || 15

    // Get schedule for this employee
    const schedule = await prisma.hr_work_schedules.findFirst({
      where: {
        tenantId,
        employeeProfileId: record.employeeProfileId,
        isActive: true,
        effectiveFrom: { lte: record.date },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: record.date } },
        ],
      },
    })

    if (!schedule?.weeklySchedule) return

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[record.date.getDay()]
    const daySchedule = (schedule.weeklySchedule as Record<string, { start?: string }>)[dayName]

    if (!daySchedule?.start) return

    // Parse scheduled start time
    const [hours, minutes] = daySchedule.start.split(':').map(Number)
    const scheduledStart = new Date(record.date)
    scheduledStart.setHours(hours, minutes, 0, 0)

    // Calculate late minutes
    const clockInTime = new Date(record.clockIn)
    const lateMinutes = Math.max(0, Math.floor((clockInTime.getTime() - scheduledStart.getTime()) / 60000) - lateThreshold)

    // Update record
    await prisma.hr_attendance_records.update({
      where: { id: recordId },
      data: {
        lateMinutes,
        status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
        scheduledMinutes: schedule.hoursPerDay * 60,
      },
    })
  }

  /**
   * Calculate worked minutes and overtime
   */
  private static async calculateWorkedMinutes(recordId: string, tenantId: string) {
    const record = await prisma.hr_attendance_records.findUnique({
      where: { id: recordId },
    })

    if (!record?.clockIn || !record?.clockOut) return

    const clockIn = new Date(record.clockIn)
    const clockOut = new Date(record.clockOut)

    // Calculate total worked minutes
    let workedMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)

    // Subtract break time if recorded
    let breakMinutes = 0
    if (record.breakStart && record.breakEnd) {
      breakMinutes = Math.floor(
        (new Date(record.breakEnd).getTime() - new Date(record.breakStart).getTime()) / 60000
      )
      workedMinutes -= breakMinutes
    }

    // Get schedule for overtime calculation
    const schedule = await prisma.hr_work_schedules.findFirst({
      where: {
        tenantId,
        employeeProfileId: record.employeeProfileId,
        isActive: true,
      },
    })

    const scheduledMinutes = (schedule?.hoursPerDay || 8) * 60
    const overtimeThreshold = schedule?.overtimeThresholdDaily || scheduledMinutes
    const overtimeMinutes = Math.max(0, workedMinutes - overtimeThreshold)

    // Calculate early leave
    const config = await prisma.hr_configurations.findUnique({ where: { tenantId } })
    const earlyLeaveThreshold = config?.earlyLeaveThresholdMinutes || 15

    // Get scheduled end time
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[record.date.getDay()]
    const daySchedule = schedule?.weeklySchedule 
      ? (schedule.weeklySchedule as Record<string, { end?: string }>)[dayName]
      : null

    let earlyLeaveMinutes = 0
    if (daySchedule?.end) {
      const [hours, minutes] = daySchedule.end.split(':').map(Number)
      const scheduledEnd = new Date(record.date)
      scheduledEnd.setHours(hours, minutes, 0, 0)
      
      earlyLeaveMinutes = Math.max(0, 
        Math.floor((scheduledEnd.getTime() - clockOut.getTime()) / 60000) - earlyLeaveThreshold
      )
    }

    // Update record
    await prisma.hr_attendance_records.update({
      where: { id: recordId },
      data: {
        workedMinutes,
        breakMinutes,
        overtimeMinutes,
        earlyLeaveMinutes,
        scheduledMinutes,
      },
    })
  }

  /**
   * Get attendance records for an employee
   */
  static async getAttendanceRecords(
    tenantId: string,
    options: {
      employeeProfileId?: string
      dateFrom?: Date
      dateTo?: Date
      status?: HrAttendanceStatus
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.hr_attendance_recordsWhereInput = { tenantId }

    if (options.employeeProfileId) where.employeeProfileId = options.employeeProfileId
    if (options.status) where.status = options.status
    if (options.dateFrom || options.dateTo) {
      where.date = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      }
    }

    const [records, total] = await Promise.all([
      prisma.hr_attendance_records.findMany({
        where,
        orderBy: { date: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.hr_attendance_records.count({ where }),
    ])

    return { records, total }
  }

  /**
   * Get attendance summary for an employee
   */
  static async getAttendanceSummary(
    tenantId: string,
    employeeProfileId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AttendanceSummary> {
    const records = await prisma.hr_attendance_records.findMany({
      where: {
        tenantId,
        employeeProfileId,
        date: { gte: periodStart, lte: periodEnd },
      },
    })

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    let daysPresent = 0
    let daysAbsent = 0
    let daysLate = 0
    let daysOnLeave = 0
    let totalWorkedMinutes = 0
    let totalOvertimeMinutes = 0

    for (const record of records) {
      switch (record.status) {
        case 'PRESENT':
          daysPresent++
          break
        case 'LATE':
          daysPresent++
          daysLate++
          break
        case 'ABSENT':
          daysAbsent++
          break
        case 'LEAVE':
          daysOnLeave++
          break
        case 'HALF_DAY':
          daysPresent += 0.5
          break
      }
      
      totalWorkedMinutes += record.workedMinutes || 0
      totalOvertimeMinutes += record.overtimeMinutes || 0
    }

    const avgWorkHoursPerDay = daysPresent > 0 
      ? Math.round((totalWorkedMinutes / daysPresent / 60) * 100) / 100
      : 0

    return {
      employeeProfileId,
      periodStart,
      periodEnd,
      totalDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysOnLeave,
      totalWorkedMinutes,
      totalOvertimeMinutes,
      avgWorkHoursPerDay,
    }
  }

  /**
   * Approve manual attendance entry
   */
  static async approveAttendance(tenantId: string, recordId: string, approvedBy: string) {
    return prisma.hr_attendance_records.update({
      where: { id: recordId },
      data: {
        requiresApproval: false,
        approvedBy,
        approvedAt: new Date(),
      },
    })
  }

  /**
   * Reject manual attendance entry
   */
  static async rejectAttendance(tenantId: string, recordId: string, rejectedBy: string, reason: string) {
    return prisma.hr_attendance_records.update({
      where: { id: recordId },
      data: {
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    })
  }

  /**
   * Mark day as leave
   */
  static async markAsLeave(
    tenantId: string,
    employeeProfileId: string,
    date: Date,
    leaveRequestId: string
  ) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    return prisma.hr_attendance_records.upsert({
      where: {
        employeeProfileId_date: { employeeProfileId, date: d },
      },
      create: {
        tenantId,
        employeeProfileId,
        date: d,
        status: 'LEAVE',
        leaveRequestId,
      },
      update: {
        status: 'LEAVE',
        leaveRequestId,
      },
    })
  }

  /**
   * Get today's attendance status for all employees
   */
  static async getTodayAttendanceOverview(tenantId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalEmployees, attendance] = await Promise.all([
      prisma.hr_employee_profiles.count({
        where: { tenantId, terminationDate: null },
      }),
      prisma.hr_attendance_records.groupBy({
        by: ['status'],
        where: { tenantId, date: today },
        _count: true,
      }),
    ])

    const statusCounts: Record<string, number> = {}
    attendance.forEach(a => { statusCounts[a.status] = a._count })

    const present = (statusCounts['PRESENT'] || 0) + (statusCounts['LATE'] || 0)
    const absent = statusCounts['ABSENT'] || 0
    const onLeave = statusCounts['LEAVE'] || 0
    const notMarked = totalEmployees - present - absent - onLeave

    return {
      date: today,
      totalEmployees,
      present,
      absent,
      onLeave,
      late: statusCounts['LATE'] || 0,
      notMarked,
      attendanceRate: totalEmployees > 0 
        ? Math.round((present / totalEmployees) * 100 * 100) / 100
        : 0,
    }
  }
}
