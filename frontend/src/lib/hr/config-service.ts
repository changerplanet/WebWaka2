/**
 * MODULE 5: HR & PAYROLL
 * Configuration Service - Tenant HR configuration
 */

import { prisma } from '@/lib/prisma'
import { HrPayFrequency, HrPaymentMethod, Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface InitializeHrInput {
  hrEnabled?: boolean
  attendanceEnabled?: boolean
  leaveEnabled?: boolean
  payrollEnabled?: boolean
  defaultPayFrequency?: HrPayFrequency
  defaultPaymentMethod?: HrPaymentMethod
  defaultCurrency?: string
  defaultWorkHoursPerDay?: number
  defaultWorkDaysPerWeek?: number
  overtimeMultiplier?: number
  allowManualAttendance?: boolean
  allowSelfClockIn?: boolean
  requireLocationForClockIn?: boolean
  lateThresholdMinutes?: number
  earlyLeaveThresholdMinutes?: number
  defaultAnnualLeave?: number
  defaultSickLeave?: number
  defaultCasualLeave?: number
  leaveCarryForwardLimit?: number
  requireLeaveApproval?: boolean
  requirePayrollApproval?: boolean
  payeTaxEnabled?: boolean
  pensionEnabled?: boolean
  pensionEmployeeRate?: number
  pensionEmployerRate?: number
  nhfEnabled?: boolean
  nhfRate?: number
  operatingHours?: object
  metadata?: object
}

export interface UpdateHrConfigInput extends Partial<InitializeHrInput> {}

// ============================================================================
// CONFIGURATION SERVICE
// ============================================================================

export class HrConfigurationService {
  /**
   * Initialize HR for a tenant
   */
  static async initialize(tenantId: string, input: InitializeHrInput = {}) {
    // Check if already initialized
    const existing = await prisma.hr_configurations.findUnique({
      where: { tenantId },
    })

    if (existing) {
      throw new Error('HR already initialized for this tenant')
    }

    return prisma.hr_configurations.create({
      data: {
        tenantId,
        hrEnabled: input.hrEnabled ?? true,
        attendanceEnabled: input.attendanceEnabled ?? true,
        leaveEnabled: input.leaveEnabled ?? true,
        payrollEnabled: input.payrollEnabled ?? true,
        defaultPayFrequency: input.defaultPayFrequency || 'MONTHLY',
        defaultPaymentMethod: input.defaultPaymentMethod || 'CASH',
        defaultCurrency: input.defaultCurrency || 'NGN',
        defaultWorkHoursPerDay: input.defaultWorkHoursPerDay || 8,
        defaultWorkDaysPerWeek: input.defaultWorkDaysPerWeek || 5,
        overtimeMultiplier: input.overtimeMultiplier || 1.5,
        allowManualAttendance: input.allowManualAttendance ?? true,
        allowSelfClockIn: input.allowSelfClockIn ?? true,
        requireLocationForClockIn: input.requireLocationForClockIn ?? false,
        lateThresholdMinutes: input.lateThresholdMinutes || 15,
        earlyLeaveThresholdMinutes: input.earlyLeaveThresholdMinutes || 15,
        defaultAnnualLeave: input.defaultAnnualLeave || 15,
        defaultSickLeave: input.defaultSickLeave || 10,
        defaultCasualLeave: input.defaultCasualLeave || 5,
        leaveCarryForwardLimit: input.leaveCarryForwardLimit || 5,
        requireLeaveApproval: input.requireLeaveApproval ?? true,
        requirePayrollApproval: input.requirePayrollApproval ?? true,
        payeTaxEnabled: input.payeTaxEnabled ?? true,
        pensionEnabled: input.pensionEnabled ?? true,
        pensionEmployeeRate: input.pensionEmployeeRate || 8,
        pensionEmployerRate: input.pensionEmployerRate || 10,
        nhfEnabled: input.nhfEnabled ?? false,
        nhfRate: input.nhfRate || 2.5,
        operatingHours: input.operatingHours as Prisma.InputJsonValue,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Get HR configuration
   */
  static async getConfiguration(tenantId: string) {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
    })

    return {
      initialized: !!config,
      config,
    }
  }

  /**
   * Update HR configuration
   */
  static async updateConfiguration(tenantId: string, input: UpdateHrConfigInput) {
    return prisma.hr_configurations.update({
      where: { tenantId },
      data: {
        ...(input.hrEnabled !== undefined && { hrEnabled: input.hrEnabled }),
        ...(input.attendanceEnabled !== undefined && { attendanceEnabled: input.attendanceEnabled }),
        ...(input.leaveEnabled !== undefined && { leaveEnabled: input.leaveEnabled }),
        ...(input.payrollEnabled !== undefined && { payrollEnabled: input.payrollEnabled }),
        ...(input.defaultPayFrequency && { defaultPayFrequency: input.defaultPayFrequency }),
        ...(input.defaultPaymentMethod && { defaultPaymentMethod: input.defaultPaymentMethod }),
        ...(input.defaultCurrency && { defaultCurrency: input.defaultCurrency }),
        ...(input.defaultWorkHoursPerDay !== undefined && { defaultWorkHoursPerDay: input.defaultWorkHoursPerDay }),
        ...(input.defaultWorkDaysPerWeek !== undefined && { defaultWorkDaysPerWeek: input.defaultWorkDaysPerWeek }),
        ...(input.overtimeMultiplier !== undefined && { overtimeMultiplier: input.overtimeMultiplier }),
        ...(input.allowManualAttendance !== undefined && { allowManualAttendance: input.allowManualAttendance }),
        ...(input.allowSelfClockIn !== undefined && { allowSelfClockIn: input.allowSelfClockIn }),
        ...(input.requireLocationForClockIn !== undefined && { requireLocationForClockIn: input.requireLocationForClockIn }),
        ...(input.lateThresholdMinutes !== undefined && { lateThresholdMinutes: input.lateThresholdMinutes }),
        ...(input.earlyLeaveThresholdMinutes !== undefined && { earlyLeaveThresholdMinutes: input.earlyLeaveThresholdMinutes }),
        ...(input.defaultAnnualLeave !== undefined && { defaultAnnualLeave: input.defaultAnnualLeave }),
        ...(input.defaultSickLeave !== undefined && { defaultSickLeave: input.defaultSickLeave }),
        ...(input.defaultCasualLeave !== undefined && { defaultCasualLeave: input.defaultCasualLeave }),
        ...(input.leaveCarryForwardLimit !== undefined && { leaveCarryForwardLimit: input.leaveCarryForwardLimit }),
        ...(input.requireLeaveApproval !== undefined && { requireLeaveApproval: input.requireLeaveApproval }),
        ...(input.requirePayrollApproval !== undefined && { requirePayrollApproval: input.requirePayrollApproval }),
        ...(input.payeTaxEnabled !== undefined && { payeTaxEnabled: input.payeTaxEnabled }),
        ...(input.pensionEnabled !== undefined && { pensionEnabled: input.pensionEnabled }),
        ...(input.pensionEmployeeRate !== undefined && { pensionEmployeeRate: input.pensionEmployeeRate }),
        ...(input.pensionEmployerRate !== undefined && { pensionEmployerRate: input.pensionEmployerRate }),
        ...(input.nhfEnabled !== undefined && { nhfEnabled: input.nhfEnabled }),
        ...(input.nhfRate !== undefined && { nhfRate: input.nhfRate }),
        ...(input.operatingHours !== undefined && { operatingHours: input.operatingHours as Prisma.InputJsonValue }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })
  }

  /**
   * Check if HR is initialized and enabled
   */
  static async isEnabled(tenantId: string): Promise<boolean> {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
      select: { hrEnabled: true },
    })

    return config?.hrEnabled ?? false
  }

  /**
   * Get work schedule settings
   */
  static async getWorkSettings(tenantId: string) {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
      select: {
        defaultWorkHoursPerDay: true,
        defaultWorkDaysPerWeek: true,
        overtimeMultiplier: true,
        operatingHours: true,
      },
    })

    return config || {
      defaultWorkHoursPerDay: 8,
      defaultWorkDaysPerWeek: 5,
      overtimeMultiplier: 1.5,
      operatingHours: null,
    }
  }

  /**
   * Get leave settings
   */
  static async getLeaveSettings(tenantId: string) {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
      select: {
        defaultAnnualLeave: true,
        defaultSickLeave: true,
        defaultCasualLeave: true,
        leaveCarryForwardLimit: true,
        requireLeaveApproval: true,
      },
    })

    return config || {
      defaultAnnualLeave: 15,
      defaultSickLeave: 10,
      defaultCasualLeave: 5,
      leaveCarryForwardLimit: 5,
      requireLeaveApproval: true,
    }
  }

  /**
   * Get payroll/tax settings
   */
  static async getPayrollSettings(tenantId: string) {
    const config = await prisma.hr_configurations.findUnique({
      where: { tenantId },
      select: {
        defaultPayFrequency: true,
        defaultPaymentMethod: true,
        defaultCurrency: true,
        payeTaxEnabled: true,
        pensionEnabled: true,
        pensionEmployeeRate: true,
        pensionEmployerRate: true,
        nhfEnabled: true,
        nhfRate: true,
        requirePayrollApproval: true,
      },
    })

    return config || {
      defaultPayFrequency: 'MONTHLY',
      defaultPaymentMethod: 'CASH',
      defaultCurrency: 'NGN',
      payeTaxEnabled: true,
      pensionEnabled: true,
      pensionEmployeeRate: 8,
      pensionEmployerRate: 10,
      nhfEnabled: false,
      nhfRate: 2.5,
      requirePayrollApproval: true,
    }
  }
}
