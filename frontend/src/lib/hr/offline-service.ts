/**
 * MODULE 5: HR & PAYROLL
 * Offline Service - Offline support and sync
 * 
 * PHASE 6: Offline Behavior
 * 
 * Rules:
 * - Attendance can be recorded offline
 * - Leave requests can be created offline
 * - Payroll calculation requires online confirmation
 * - Sync must be idempotent
 */

import { prisma } from '@/lib/prisma'
import { AttendanceService, ManualAttendanceInput } from './attendance-service'
import { LeaveService, CreateLeaveRequestInput } from './leave-service'

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineHrPackage {
  lastUpdated: string
  employees: OfflineEmployee[]
  schedules: OfflineSchedule[]
  leaveBalances: OfflineLeaveBalance[]
  config: OfflineHrConfig | null
}

export interface OfflineEmployee {
  id: string
  staffId: string
  staffName: string
  department: string | null
  jobTitle: string | null
  employmentType: string
}

export interface OfflineSchedule {
  id: string
  employeeProfileId: string | null
  name: string
  weeklySchedule: object
}

export interface OfflineLeaveBalance {
  employeeProfileId: string
  year: number
  leaveType: string
  available: number
}

export interface OfflineHrConfig {
  allowManualAttendance: boolean
  allowSelfClockIn: boolean
  lateThresholdMinutes: number
}

export interface OfflineSyncRequest {
  lastSyncAt?: string
  attendanceRecords?: Array<ManualAttendanceInput & { offlineId: string }>
  leaveRequests?: Array<CreateLeaveRequestInput & { offlineId: string }>
  clockIns?: Array<{
    employeeProfileId: string
    timestamp: string
    offlineId: string
    latitude?: number
    longitude?: number
  }>
  clockOuts?: Array<{
    employeeProfileId: string
    timestamp: string
    offlineId: string
    latitude?: number
    longitude?: number
  }>
}

export interface OfflineSyncResponse {
  success: boolean
  attendance: Array<{ offlineId: string; success: boolean; error?: string }>
  leave: Array<{ offlineId: string; success: boolean; id?: string; error?: string }>
  clockIns: Array<{ offlineId: string; success: boolean; error?: string }>
  clockOuts: Array<{ offlineId: string; success: boolean; error?: string }>
  changes?: OfflineDataChanges
}

export interface OfflineDataChanges {
  newLeaveRequests: Array<{ id: string; status: string }>
  approvedLeave: string[]
  rejectedLeave: string[]
}

// ============================================================================
// OFFLINE SERVICE
// ============================================================================

export class OfflineHrService {
  /**
   * Get offline data package
   */
  static async getOfflinePackage(tenantId: string, employeeProfileId?: string): Promise<OfflineHrPackage> {
    const [employees, schedules, leaveBalances, config] = await Promise.all([
      // Get employees
      prisma.hr_employee_profiles.findMany({
        where: { 
          tenantId, 
          terminationDate: null,
          ...(employeeProfileId && { id: employeeProfileId }),
        },
        select: {
          id: true,
          staffId: true,
          department: true,
          jobTitle: true,
          employmentType: true,
        },
        take: 500,
      }),

      // Get schedules
      prisma.hr_work_schedules.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          employeeProfileId: true,
          name: true,
          weeklySchedule: true,
        },
      }),

      // Get leave balances
      prisma.hr_leave_balances.findMany({
        where: { 
          tenantId, 
          year: new Date().getFullYear(),
          ...(employeeProfileId && { employeeProfileId }),
        },
        select: {
          employeeProfileId: true,
          year: true,
          leaveType: true,
          available: true,
        },
      }),

      // Get config
      prisma.hr_configurations.findUnique({
        where: { tenantId },
        select: {
          allowManualAttendance: true,
          allowSelfClockIn: true,
          lateThresholdMinutes: true,
        },
      }),
    ])

    // Get staff names
    const staffIds = employees.map(e => e.staffId)
    const staffRecords = await prisma.staffMember.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const staffMap = new Map(staffRecords.map(s => [s.id, `${s.firstName} ${s.lastName}`]))

    return {
      lastUpdated: new Date().toISOString(),
      employees: employees.map(e => ({
        id: e.id,
        staffId: e.staffId,
        staffName: staffMap.get(e.staffId) || 'Unknown',
        department: e.department,
        jobTitle: e.jobTitle,
        employmentType: e.employmentType,
      })),
      schedules: schedules.map(s => ({
        id: s.id,
        employeeProfileId: s.employeeProfileId,
        name: s.name,
        weeklySchedule: s.weeklySchedule as object,
      })),
      leaveBalances: leaveBalances.map(b => ({
        employeeProfileId: b.employeeProfileId,
        year: b.year,
        leaveType: b.leaveType,
        available: b.available,
      })),
      config,
    }
  }

  /**
   * Sync offline changes
   */
  static async syncOfflineChanges(
    tenantId: string,
    request: OfflineSyncRequest
  ): Promise<OfflineSyncResponse> {
    const response: OfflineSyncResponse = {
      success: true,
      attendance: [],
      leave: [],
      clockIns: [],
      clockOuts: [],
    }

    // Process clock-ins
    if (request.clockIns?.length) {
      for (const clockIn of request.clockIns) {
        try {
          // Check for duplicate
          const existing = await prisma.hr_attendance_records.findFirst({
            where: { offlineId: clockIn.offlineId },
          })
          
          if (existing) {
            response.clockIns.push({ offlineId: clockIn.offlineId, success: true })
            continue
          }

          await AttendanceService.clockIn(tenantId, {
            employeeProfileId: clockIn.employeeProfileId,
            method: 'SELF_SERVICE',
            latitude: clockIn.latitude,
            longitude: clockIn.longitude,
            offlineId: clockIn.offlineId,
            recordedAt: new Date(clockIn.timestamp),
          })
          response.clockIns.push({ offlineId: clockIn.offlineId, success: true })
        } catch (error) {
          response.clockIns.push({
            offlineId: clockIn.offlineId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          response.success = false
        }
      }
    }

    // Process clock-outs
    if (request.clockOuts?.length) {
      for (const clockOut of request.clockOuts) {
        try {
          await AttendanceService.clockOut(tenantId, {
            employeeProfileId: clockOut.employeeProfileId,
            method: 'SELF_SERVICE',
            latitude: clockOut.latitude,
            longitude: clockOut.longitude,
            offlineId: clockOut.offlineId,
            recordedAt: new Date(clockOut.timestamp),
          })
          response.clockOuts.push({ offlineId: clockOut.offlineId, success: true })
        } catch (error) {
          response.clockOuts.push({
            offlineId: clockOut.offlineId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          response.success = false
        }
      }
    }

    // Process manual attendance records
    if (request.attendanceRecords?.length) {
      for (const record of request.attendanceRecords) {
        try {
          await AttendanceService.createManualAttendance(tenantId, record)
          response.attendance.push({ offlineId: record.offlineId, success: true })
        } catch (error) {
          response.attendance.push({
            offlineId: record.offlineId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          response.success = false
        }
      }
    }

    // Process leave requests
    if (request.leaveRequests?.length) {
      for (const leave of request.leaveRequests) {
        try {
          const created = await LeaveService.createLeaveRequest(tenantId, {
            ...leave,
            offlineId: leave.offlineId,
          })
          response.leave.push({ offlineId: leave.offlineId, success: true, id: created.id })
        } catch (error) {
          response.leave.push({
            offlineId: leave.offlineId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          response.success = false
        }
      }
    }

    // Get changes since last sync
    if (request.lastSyncAt) {
      response.changes = await this.getChangesSince(tenantId, new Date(request.lastSyncAt))
    }

    return response
  }

  /**
   * Get changes since last sync
   */
  private static async getChangesSince(
    tenantId: string,
    lastSyncAt: Date
  ): Promise<OfflineDataChanges> {
    const [newLeave, statusChanges] = await Promise.all([
      // New leave requests
      prisma.hr_leave_requests.findMany({
        where: {
          tenantId,
          createdAt: { gt: lastSyncAt },
        },
        select: { id: true, status: true },
      }),

      // Leave status changes
      prisma.hr_leave_requests.findMany({
        where: {
          tenantId,
          updatedAt: { gt: lastSyncAt },
          createdAt: { lte: lastSyncAt },
        },
        select: { id: true, status: true },
      }),
    ])

    const approvedLeave = statusChanges.filter(l => l.status === 'APPROVED').map(l => l.id)
    const rejectedLeave = statusChanges.filter(l => l.status === 'REJECTED').map(l => l.id)

    return {
      newLeaveRequests: newLeave,
      approvedLeave,
      rejectedLeave,
    }
  }

  /**
   * Validate offline data integrity
   */
  static async validateOfflineData(
    tenantId: string,
    data: { attendanceIds: string[]; leaveIds: string[] }
  ): Promise<{
    validAttendance: string[]
    invalidAttendance: string[]
    validLeave: string[]
    invalidLeave: string[]
  }> {
    const [attendanceRecords, leaveRecords] = await Promise.all([
      prisma.hr_attendance_records.findMany({
        where: { tenantId, offlineId: { in: data.attendanceIds } },
        select: { offlineId: true },
      }),
      prisma.hr_leave_requests.findMany({
        where: { tenantId, offlineId: { in: data.leaveIds } },
        select: { offlineId: true },
      }),
    ])

    const syncedAttendance = new Set(attendanceRecords.map(r => r.offlineId).filter(Boolean))
    const syncedLeave = new Set(leaveRecords.map(r => r.offlineId).filter(Boolean))

    return {
      validAttendance: data.attendanceIds.filter(id => syncedAttendance.has(id)),
      invalidAttendance: data.attendanceIds.filter(id => !syncedAttendance.has(id)),
      validLeave: data.leaveIds.filter(id => syncedLeave.has(id)),
      invalidLeave: data.leaveIds.filter(id => !syncedLeave.has(id)),
    }
  }
}
