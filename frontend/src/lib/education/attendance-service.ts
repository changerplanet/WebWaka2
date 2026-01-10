/**
 * Education Suite - Attendance Service
 * 
 * Manages daily attendance with backfill support for offline tolerance.
 * Nigeria-first: Supports network resilience for rural schools.
 * 
 * @module lib/education/attendance-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import {
  EduAttendance,
  EduAttendanceStatus,
  MarkAttendanceInput,
} from './types'

// ============================================================================
// ATTENDANCE ENTITY OPERATIONS
// ============================================================================

/**
 * Create an attendance record entity (in-memory)
 */
export function createAttendanceEntity(
  input: MarkAttendanceInput
): Omit<EduAttendance, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date()
  
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    termId: input.termId,
    attendanceDate: input.attendanceDate,
    status: input.status,
    arrivalTime: input.arrivalTime,
    notes: input.notes,
    excuseReason: input.excuseReason,
    markedById: input.markedById,
    markedAt: now,
    isBackfilled: input.isBackfilled ?? false,
    backfilledAt: input.isBackfilled ? now : undefined,
  }
}

// ============================================================================
// BULK ATTENDANCE OPERATIONS
// ============================================================================

/**
 * Create bulk attendance records for a class
 * Used when teacher marks attendance for entire class at once
 */
export function createBulkAttendanceEntities(
  tenantId: string,
  classId: string,
  termId: string,
  attendanceDate: Date,
  studentAttendances: Array<{ studentId: string; status: EduAttendanceStatus; notes?: string }>,
  markedById?: string,
  isBackfilled?: boolean
): Array<Omit<EduAttendance, 'id' | 'createdAt' | 'updatedAt'>> {
  const now = new Date()

  return studentAttendances.map(({ studentId, status, notes }) => ({
    tenantId,
    studentId,
    classId,
    termId,
    attendanceDate,
    status,
    notes,
    markedById,
    markedAt: now,
    isBackfilled: isBackfilled ?? false,
    backfilledAt: isBackfilled ? now : undefined,
  }))
}

// ============================================================================
// ATTENDANCE STATISTICS
// ============================================================================

interface AttendanceStats {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendancePercentage: number
}

/**
 * Calculate attendance statistics for a student
 */
export function calculateAttendanceStats(
  attendances: EduAttendance[]
): AttendanceStats {
  const totalDays = attendances.length
  
  if (totalDays === 0) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      attendancePercentage: 0,
    }
  }

  const presentDays = attendances.filter(
    (a: any) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length
  const absentDays = attendances.filter((a: any) => a.status === 'ABSENT').length
  const lateDays = attendances.filter((a: any) => a.status === 'LATE').length
  const excusedDays = attendances.filter((a: any) => a.status === 'EXCUSED').length

  // Attendance percentage: Present + Late days / Total school days
  const attendancePercentage = Math.round((presentDays / totalDays) * 100)

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    attendancePercentage,
  }
}

/**
 * Calculate daily attendance summary for a class
 */
export function calculateDailyClassSummary(
  attendances: EduAttendance[],
  date: Date
): {
  date: Date
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
} {
  const dateAttendances = attendances.filter(
    (a: any) => a.attendanceDate.toDateString() === date.toDateString()
  )

  return {
    date,
    totalStudents: dateAttendances.length,
    present: dateAttendances.filter((a: any) => a.status === 'PRESENT').length,
    absent: dateAttendances.filter((a: any) => a.status === 'ABSENT').length,
    late: dateAttendances.filter((a: any) => a.status === 'LATE').length,
    excused: dateAttendances.filter((a: any) => a.status === 'EXCUSED').length,
  }
}

// ============================================================================
// ABSENCE ALERTS
// ============================================================================

interface AbsenceAlert {
  studentId: string
  studentName: string
  consecutiveAbsences: number
  termAbsenceCount: number
  attendancePercentage: number
  alertLevel: 'WARNING' | 'CRITICAL'
}

/**
 * Check if student needs absence alert
 * Configurable thresholds
 */
export function checkAbsenceAlert(
  stats: AttendanceStats,
  thresholds: {
    warningAbsenceCount?: number
    criticalAbsenceCount?: number
    warningPercentage?: number
    criticalPercentage?: number
  } = {}
): { needsAlert: boolean; alertLevel?: 'WARNING' | 'CRITICAL' } {
  const {
    warningAbsenceCount = 3,
    criticalAbsenceCount = 5,
    warningPercentage = 80,
    criticalPercentage = 70,
  } = thresholds

  // Critical: Too many absences or very low attendance
  if (
    stats.absentDays >= criticalAbsenceCount ||
    stats.attendancePercentage < criticalPercentage
  ) {
    return { needsAlert: true, alertLevel: 'CRITICAL' }
  }

  // Warning: Moderate absences or declining attendance
  if (
    stats.absentDays >= warningAbsenceCount ||
    stats.attendancePercentage < warningPercentage
  ) {
    return { needsAlert: true, alertLevel: 'WARNING' }
  }

  return { needsAlert: false }
}

// ============================================================================
// BACKFILL SUPPORT (Offline Tolerance)
// ============================================================================

/**
 * Validate backfill date
 * Backfills should not be in the future and should be within term dates
 */
export function validateBackfillDate(
  backfillDate: Date,
  termStartDate: Date,
  termEndDate: Date
): { valid: boolean; error?: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const backfill = new Date(backfillDate)
  backfill.setHours(0, 0, 0, 0)

  if (backfill > today) {
    return { valid: false, error: 'Cannot backfill attendance for future dates' }
  }

  if (backfill < termStartDate) {
    return { valid: false, error: 'Backfill date is before term start date' }
  }

  if (backfill > termEndDate) {
    return { valid: false, error: 'Backfill date is after term end date' }
  }

  return { valid: true }
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Get all weekdays (Mon-Fri) in a date range
 * Used to calculate expected school days
 */
export function getWeekdaysInRange(startDate: Date, endDate: Date): Date[] {
  const weekdays: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // Monday = 1, Friday = 5
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return weekdays
}

/**
 * Check if a date is a weekday
 */
export function isWeekday(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek >= 1 && dayOfWeek <= 5
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateAttendanceInput(
  input: MarkAttendanceInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.tenantId) errors.push('tenantId is required')
  if (!input.studentId) errors.push('studentId is required')
  if (!input.classId) errors.push('classId is required')
  if (!input.termId) errors.push('termId is required')
  if (!input.attendanceDate) errors.push('attendanceDate is required')
  if (!input.status) errors.push('status is required')

  // If EXCUSED, reason should be provided
  if (input.status === 'EXCUSED' && !input.excuseReason?.trim()) {
    errors.push('excuseReason is required when status is EXCUSED')
  }

  return { valid: errors.length === 0, errors }
}
