/**
 * MODULE 5: HR & PAYROLL
 * Entitlements Service - Feature gating and plan enforcement
 * 
 * PHASE 8: Entitlements
 * 
 * Examples:
 * - hr_enabled
 * - max_employees
 * - payroll_enabled
 * - attendance_enabled
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface HrEntitlements {
  hr_enabled: boolean
  attendance_enabled: boolean
  leave_enabled: boolean
  payroll_enabled: boolean
  max_employees: number
  max_payroll_runs_per_month: number
  overtime_tracking_enabled: boolean
  multi_location_enabled: boolean
  api_access_enabled: boolean
}

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
}

export interface HrUsage {
  employees: number
  activeEmployees: number
  payrollRunsThisMonth: number
  attendanceRecordsThisMonth: number
  leaveRequestsThisMonth: number
}

// Default entitlements by plan tier
const PLAN_ENTITLEMENTS: Record<string, HrEntitlements> = {
  FREE: {
    hr_enabled: false,
    attendance_enabled: false,
    leave_enabled: false,
    payroll_enabled: false,
    max_employees: 0,
    max_payroll_runs_per_month: 0,
    overtime_tracking_enabled: false,
    multi_location_enabled: false,
    api_access_enabled: false,
  },
  STARTER: {
    hr_enabled: true,
    attendance_enabled: true,
    leave_enabled: true,
    payroll_enabled: true,
    max_employees: 10,
    max_payroll_runs_per_month: 2,
    overtime_tracking_enabled: false,
    multi_location_enabled: false,
    api_access_enabled: false,
  },
  PROFESSIONAL: {
    hr_enabled: true,
    attendance_enabled: true,
    leave_enabled: true,
    payroll_enabled: true,
    max_employees: 50,
    max_payroll_runs_per_month: 5,
    overtime_tracking_enabled: true,
    multi_location_enabled: true,
    api_access_enabled: true,
  },
  ENTERPRISE: {
    hr_enabled: true,
    attendance_enabled: true,
    leave_enabled: true,
    payroll_enabled: true,
    max_employees: -1, // Unlimited
    max_payroll_runs_per_month: -1, // Unlimited
    overtime_tracking_enabled: true,
    multi_location_enabled: true,
    api_access_enabled: true,
  },
}

// ============================================================================
// ENTITLEMENTS SERVICE
// ============================================================================

export class HrEntitlementsService {
  /**
   * Get entitlements for a tenant
   */
  static async getEntitlements(tenantId: string): Promise<HrEntitlements> {
    // Get tenant's subscription
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: { select: { slug: true } },
          },
        },
      },
    })

    if (!tenant) {
      return PLAN_ENTITLEMENTS.FREE
    }

    // Map plan slug to entitlement key
    const planSlug = tenant.subscription?.plan?.slug || 'free'
    const planKey = planSlug.toUpperCase().replace(/-/g, '_')
    return PLAN_ENTITLEMENTS[planKey] || PLAN_ENTITLEMENTS.FREE
  }

  /**
   * Get current usage
   */
  static async getUsage(tenantId: string): Promise<HrUsage> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      employees,
      activeEmployees,
      payrollRuns,
      attendanceRecords,
      leaveRequests,
    ] = await Promise.all([
      prisma.hrEmployeeProfile.count({ where: { tenantId } }),
      prisma.hrEmployeeProfile.count({ where: { tenantId, terminationDate: null } }),
      prisma.hrPayrollPeriod.count({
        where: { tenantId, calculatedAt: { gte: startOfMonth } },
      }),
      prisma.hrAttendanceRecord.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.hrLeaveRequest.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
    ])

    return {
      employees,
      activeEmployees,
      payrollRunsThisMonth: payrollRuns,
      attendanceRecordsThisMonth: attendanceRecords,
      leaveRequestsThisMonth: leaveRequests,
    }
  }

  /**
   * Check if a specific action is allowed
   */
  static async checkEntitlement(
    tenantId: string,
    action: keyof HrEntitlements | 'create_employee' | 'run_payroll'
  ): Promise<EntitlementCheckResult> {
    const entitlements = await this.getEntitlements(tenantId)
    const usage = await this.getUsage(tenantId)

    // First check if HR is enabled at all
    if (!entitlements.hr_enabled) {
      return {
        allowed: false,
        reason: 'HR module is not enabled for this plan',
      }
    }

    switch (action) {
      case 'hr_enabled':
        return { allowed: entitlements.hr_enabled }

      case 'attendance_enabled':
        return {
          allowed: entitlements.attendance_enabled,
          reason: !entitlements.attendance_enabled
            ? 'Attendance tracking is not enabled for this plan'
            : undefined,
        }

      case 'leave_enabled':
        return {
          allowed: entitlements.leave_enabled,
          reason: !entitlements.leave_enabled
            ? 'Leave management is not enabled for this plan'
            : undefined,
        }

      case 'payroll_enabled':
        return {
          allowed: entitlements.payroll_enabled,
          reason: !entitlements.payroll_enabled
            ? 'Payroll is not enabled for this plan'
            : undefined,
        }

      case 'create_employee':
        if (entitlements.max_employees === -1) {
          return { allowed: true }
        }
        return {
          allowed: usage.employees < entitlements.max_employees,
          reason: usage.employees >= entitlements.max_employees
            ? `Maximum employees (${entitlements.max_employees}) reached`
            : undefined,
          current: usage.employees,
          limit: entitlements.max_employees,
        }

      case 'run_payroll':
        if (!entitlements.payroll_enabled) {
          return {
            allowed: false,
            reason: 'Payroll is not enabled for this plan',
          }
        }
        if (entitlements.max_payroll_runs_per_month === -1) {
          return { allowed: true }
        }
        return {
          allowed: usage.payrollRunsThisMonth < entitlements.max_payroll_runs_per_month,
          reason: usage.payrollRunsThisMonth >= entitlements.max_payroll_runs_per_month
            ? `Monthly payroll run limit (${entitlements.max_payroll_runs_per_month}) reached`
            : undefined,
          current: usage.payrollRunsThisMonth,
          limit: entitlements.max_payroll_runs_per_month,
        }

      case 'overtime_tracking_enabled':
        return {
          allowed: entitlements.overtime_tracking_enabled,
          reason: !entitlements.overtime_tracking_enabled
            ? 'Overtime tracking is not available on this plan'
            : undefined,
        }

      case 'multi_location_enabled':
        return {
          allowed: entitlements.multi_location_enabled,
          reason: !entitlements.multi_location_enabled
            ? 'Multi-location support is not available on this plan'
            : undefined,
        }

      case 'api_access_enabled':
        return {
          allowed: entitlements.api_access_enabled,
          reason: !entitlements.api_access_enabled
            ? 'API access is not available on this plan'
            : undefined,
        }

      default:
        const value = entitlements[action as keyof HrEntitlements]
        if (typeof value === 'boolean') {
          return { allowed: value }
        }
        return { allowed: true }
    }
  }

  /**
   * Get entitlements summary for dashboard
   */
  static async getEntitlementsSummary(tenantId: string) {
    const [entitlements, usage] = await Promise.all([
      this.getEntitlements(tenantId),
      this.getUsage(tenantId),
    ])

    return {
      enabled: entitlements.hr_enabled,
      usage,
      limits: {
        employees: {
          current: usage.employees,
          max: entitlements.max_employees,
          unlimited: entitlements.max_employees === -1,
        },
        payrollRuns: {
          current: usage.payrollRunsThisMonth,
          max: entitlements.max_payroll_runs_per_month,
          unlimited: entitlements.max_payroll_runs_per_month === -1,
        },
      },
      features: {
        attendance: entitlements.attendance_enabled,
        leave: entitlements.leave_enabled,
        payroll: entitlements.payroll_enabled,
        overtimeTracking: entitlements.overtime_tracking_enabled,
        multiLocation: entitlements.multi_location_enabled,
        apiAccess: entitlements.api_access_enabled,
      },
    }
  }

  /**
   * Enforce entitlement (throws if not allowed)
   */
  static async enforceEntitlement(
    tenantId: string,
    action: keyof HrEntitlements | 'create_employee' | 'run_payroll'
  ): Promise<void> {
    const check = await this.checkEntitlement(tenantId, action)
    if (!check.allowed) {
      throw new Error(check.reason || `Action '${action}' is not allowed`)
    }
  }
}
