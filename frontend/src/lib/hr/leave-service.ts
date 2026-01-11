/**
 * MODULE 5: HR & PAYROLL
 * Leave Service - Leave management and approvals
 * 
 * PHASE 3: Leave Management
 */

import { prisma } from '@/lib/prisma'
import { HrLeaveType, HrLeaveStatus, Prisma } from '@prisma/client'
import { AttendanceService } from './attendance-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLeaveRequestInput {
  employeeProfileId: string
  leaveType: HrLeaveType
  startDate: Date
  endDate: Date
  halfDay?: boolean
  halfDayType?: 'AM' | 'PM'
  reason?: string
  attachmentUrl?: string
  approverStaffId?: string
  reliefStaffId?: string
  handoverNotes?: string
  offlineId?: string
}

export interface LeaveBalanceAdjustment {
  employeeProfileId: string
  year: number
  leaveType: HrLeaveType
  adjustment: number
  reason: string
}

// ============================================================================
// LEAVE SERVICE
// ============================================================================

export class LeaveService {
  /**
   * Create a leave request
   */
  static async createLeaveRequest(tenantId: string, input: CreateLeaveRequestInput) {
    // Check for duplicate offline submission
    if (input.offlineId) {
      const existing = await prisma.hr_leave_requests.findFirst({
        where: { offlineId: input.offlineId },
      })
      if (existing) return existing
    }

    // Calculate total days
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    if (endDate < startDate) {
      throw new Error('End date cannot be before start date')
    }

    let totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (input.halfDay) {
      totalDays = 0.5
    }

    // Check leave balance
    const year = startDate.getFullYear()
    const balance = await prisma.hr_leave_balances.findUnique({
      where: {
        employeeProfileId_year_leaveType: {
          employeeProfileId: input.employeeProfileId,
          year,
          leaveType: input.leaveType,
        },
      },
    })

    // Check if sufficient balance (skip for unpaid leave)
    if (input.leaveType !== 'UNPAID' && (!balance || balance.available < totalDays)) {
      throw new Error(`Insufficient ${input.leaveType.toLowerCase()} leave balance. Available: ${balance?.available || 0} days`)
    }

    // Get HR config for approval requirements
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
    })

    const requiresApproval = config?.requireLeaveApproval ?? true
    const initialStatus = requiresApproval ? 'PENDING' : 'APPROVED'

    // Create leave request
    const leaveRequest = await prisma.hr_leave_requests.create({
      data: withPrismaDefaults({
        tenantId,
        employeeProfileId: input.employeeProfileId,
        leaveType: input.leaveType,
        status: initialStatus,
        startDate,
        endDate,
        totalDays,
        halfDay: input.halfDay || false,
        halfDayType: input.halfDayType,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl,
        approverStaffId: input.approverStaffId,
        reliefStaffId: input.reliefStaffId,
        handoverNotes: input.handoverNotes,
        offlineId: input.offlineId,
        syncedAt: input.offlineId ? new Date() : null,
      }),
    })

    // Update pending balance
    if (balance && input.leaveType !== 'UNPAID') {
      await prisma.hr_leave_balances.update({
        where: { id: balance.id },
        data: {
          pending: { increment: totalDays },
          available: { decrement: totalDays },
        },
      })
    }

    // If auto-approved, mark attendance days as leave
    if (initialStatus === 'APPROVED') {
      await this.markLeaveDaysInAttendance(tenantId, leaveRequest)
      await this.updateBalanceOnApproval(leaveRequest)
    }

    return leaveRequest
  }

  /**
   * Approve leave request
   */
  static async approveLeaveRequest(tenantId: string, requestId: string, approvedBy: string) {
    const request = await prisma.hr_leave_requests.findFirst({
      where: { id: requestId, tenantId },
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot approve leave request in ${request.status} status`)
    }

    const updated = await prisma.hr_leave_requests.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    })

    // Mark attendance days as leave
    await this.markLeaveDaysInAttendance(tenantId, updated)
    
    // Update balance (move from pending to used)
    await this.updateBalanceOnApproval(updated)

    return updated
  }

  /**
   * Reject leave request
   */
  static async rejectLeaveRequest(
    tenantId: string,
    requestId: string,
    rejectedBy: string,
    reason: string
  ) {
    const request = await prisma.hr_leave_requests.findFirst({
      where: { id: requestId, tenantId },
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot reject leave request in ${request.status} status`)
    }

    const updated = await prisma.hr_leave_requests.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    })

    // Restore pending balance
    if (request.leaveType !== 'UNPAID') {
      const year = request.startDate.getFullYear()
      await prisma.hr_leave_balances.update({
        where: {
          employeeProfileId_year_leaveType: {
            employeeProfileId: request.employeeProfileId,
            year,
            leaveType: request.leaveType,
          },
        },
        data: {
          pending: { decrement: request.totalDays },
          available: { increment: request.totalDays },
        },
      })
    }

    return updated
  }

  /**
   * Cancel leave request
   */
  static async cancelLeaveRequest(
    tenantId: string,
    requestId: string,
    cancelledBy: string,
    reason: string
  ) {
    const request = await prisma.hr_leave_requests.findFirst({
      where: { id: requestId, tenantId },
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      throw new Error(`Cannot cancel leave request in ${request.status} status`)
    }

    const wasPending = request.status === 'PENDING'
    const wasApproved = request.status === 'APPROVED'

    const updated = await prisma.hr_leave_requests.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    })

    // Restore balance
    if (request.leaveType !== 'UNPAID') {
      const year = request.startDate.getFullYear()
      await prisma.hr_leave_balances.update({
        where: {
          employeeProfileId_year_leaveType: {
            employeeProfileId: request.employeeProfileId,
            year,
            leaveType: request.leaveType,
          },
        },
        data: {
          ...(wasPending && {
            pending: { decrement: request.totalDays },
            available: { increment: request.totalDays },
          }),
          ...(wasApproved && {
            used: { decrement: request.totalDays },
            available: { increment: request.totalDays },
          }),
        },
      })
    }

    // Remove attendance records for cancelled approved leave
    if (wasApproved) {
      await this.removeLeaveFromAttendance(tenantId, request)
    }

    return updated
  }

  /**
   * Mark leave days in attendance
   */
  private static async markLeaveDaysInAttendance(
    tenantId: string,
    request: { id: string; employeeProfileId: string; startDate: Date; endDate: Date; halfDay: boolean }
  ) {
    const start = new Date(request.startDate)
    const end = new Date(request.endDate)

    const dates: Date[] = []
    const current = new Date(start)
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    for (const date of dates) {
      await AttendanceService.markAsLeave(tenantId, request.employeeProfileId, date, request.id)
    }
  }

  /**
   * Remove leave from attendance (when cancelled)
   */
  private static async removeLeaveFromAttendance(
    tenantId: string,
    request: { id: string; startDate: Date; endDate: Date }
  ) {
    await prisma.hr_attendance_records.updateMany({
      where: {
        tenantId,
        leaveRequestId: request.id,
      },
      data: {
        status: 'ABSENT',
        leaveRequestId: null,
      },
    })
  }

  /**
   * Update balance when leave is approved
   */
  private static async updateBalanceOnApproval(
    request: { employeeProfileId: string; startDate: Date; totalDays: number; leaveType: HrLeaveType }
  ) {
    if (request.leaveType === 'UNPAID') return

    const year = request.startDate.getFullYear()
    await prisma.hr_leave_balances.update({
      where: {
        employeeProfileId_year_leaveType: {
          employeeProfileId: request.employeeProfileId,
          year,
          leaveType: request.leaveType,
        },
      },
      data: {
        pending: { decrement: request.totalDays },
        used: { increment: request.totalDays },
      },
    })
  }

  /**
   * Get leave requests
   */
  static async getLeaveRequests(
    tenantId: string,
    options: {
      employeeProfileId?: string
      status?: HrLeaveStatus
      leaveType?: HrLeaveType
      dateFrom?: Date
      dateTo?: Date
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.hr_leave_requestsWhereInput = { tenantId }

    if (options.employeeProfileId) where.employeeProfileId = options.employeeProfileId
    if (options.status) where.status = options.status
    if (options.leaveType) where.leaveType = options.leaveType
    if (options.dateFrom || options.dateTo) {
      where.startDate = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      }
    }

    const [requests, total] = await Promise.all([
      prisma.hr_leave_requests.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.hr_leave_requests.count({ where }),
    ])

    return { requests, total }
  }

  /**
   * Get leave request by ID
   */
  static async getLeaveRequestById(tenantId: string, requestId: string) {
    return prisma.hr_leave_requests.findFirst({
      where: { id: requestId, tenantId },
    })
  }

  /**
   * Get leave balances for an employee
   */
  static async getLeaveBalances(tenantId: string, employeeProfileId: string, year?: number) {
    const currentYear = year || new Date().getFullYear()

    return prisma.hr_leave_balances.findMany({
      where: {
        tenantId,
        employeeProfileId,
        year: currentYear,
      },
    })
  }

  /**
   * Adjust leave balance
   */
  static async adjustLeaveBalance(tenantId: string, input: LeaveBalanceAdjustment) {
    return prisma.hr_leave_balances.upsert({
      where: {
        employeeProfileId_year_leaveType: {
          employeeProfileId: input.employeeProfileId,
          year: input.year,
          leaveType: input.leaveType,
        },
      },
      create: withPrismaDefaults({
        tenantId,
        employeeProfileId: input.employeeProfileId,
        year: input.year,
        leaveType: input.leaveType,
        adjustments: input.adjustment,
        available: input.adjustment,
        notes: input.reason,
      }),
      update: {
        adjustments: { increment: input.adjustment },
        available: { increment: input.adjustment },
        notes: input.reason,
      },
    })
  }

  /**
   * Carry forward leave balances to new year
   */
  static async carryForwardBalances(tenantId: string, fromYear: number, toYear: number) {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
    })

    const carryForwardLimit = config?.leaveCarryForwardLimit || 5

    // Get all annual leave balances from previous year
    const balances = await prisma.hr_leave_balances.findMany({
      where: {
        tenantId,
        year: fromYear,
        leaveType: 'ANNUAL',
      },
    })

    const results = []
    for (const balance of balances) {
      const carryForward = Math.min(balance.available, carryForwardLimit)
      
      if (carryForward > 0) {
        // Get employee profile for default entitlement
        const profile = await prisma.hr_employee_profiles.findUnique({
          where: { id: balance.employeeProfileId },
        })

        const newBalance = await prisma.hr_leave_balances.upsert({
          where: {
            employeeProfileId_year_leaveType: {
              employeeProfileId: balance.employeeProfileId,
              year: toYear,
              leaveType: 'ANNUAL',
            },
          },
          create: withPrismaDefaults({
            tenantId,
            employeeProfileId: balance.employeeProfileId,
            year: toYear,
            leaveType: 'ANNUAL',
            entitlement: profile?.annualLeaveEntitlement || 15,
            carriedForward: carryForward,
            available: (profile?.annualLeaveEntitlement || 15) + carryForward,
          }),
          update: {
            carriedForward: carryForward,
            available: { increment: carryForward },
          },
        })

        results.push({
          employeeProfileId: balance.employeeProfileId,
          carriedForward: carryForward,
          newBalance,
        })
      }
    }

    return results
  }

  /**
   * Get leave calendar for a period
   */
  static async getLeaveCalendar(tenantId: string, startDate: Date, endDate: Date) {
    const requests = await prisma.hr_leave_requests.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }] },
        ],
      },
      include: {
        hr_employee_profiles: {
          select: { id: true, staffId: true, jobTitle: true, department: true },
        },
      },
    })

    // Get staff info
    const staffIds = requests.map(r => r.employeeProfile.staffId)
    const staffRecords = await prisma.staffMember.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const staffMap = new Map(staffRecords.map(s => [s.id, `${s.firstName} ${s.lastName}`]))

    return requests.map(r => ({
      ...r,
      employeeName: staffMap.get(r.employeeProfile.staffId) || 'Unknown',
    }))
  }
}
