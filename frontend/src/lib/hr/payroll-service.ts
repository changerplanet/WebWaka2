/**
 * MODULE 5: HR & PAYROLL
 * Payroll Service - Payroll calculation engine
 * 
 * PHASE 4 & 5: Payroll Calculation & Payslips
 * 
 * IMPORTANT: This module does NOT execute payments.
 * All calculations are ADVISORY only.
 */

import { prisma } from '@/lib/prisma'
import { HrPayFrequency, HrPayrollPeriodStatus, HrPayrollCalculationStatus, HrPaymentMethod, Prisma } from '@prisma/client'
import { AttendanceService } from './attendance-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePayrollPeriodInput {
  name: string
  payFrequency: HrPayFrequency
  periodStart: Date
  periodEnd: Date
  payDate: Date
  notes?: string
  metadata?: object
}

export interface PayrollCalculationResult {
  employeeProfileId: string
  basePay: number
  overtimePay: number
  allowances: number
  bonuses: number
  otherEarnings: number
  grossPay: number
  taxDeduction: number
  pensionDeduction: number
  nhfDeduction: number
  loanDeduction: number
  advanceDeduction: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  daysWorked: number
  daysAbsent: number
  daysLeave: number
  overtimeHours: number
  lateCount: number
  earningsBreakdown: object
  deductionsBreakdown: object
}

// Nigeria PAYE Tax brackets (2024)
const PAYE_BRACKETS = [
  { min: 0, max: 300000, rate: 0.07 },
  { min: 300000, max: 600000, rate: 0.11 },
  { min: 600000, max: 1100000, rate: 0.15 },
  { min: 1100000, max: 1600000, rate: 0.19 },
  { min: 1600000, max: 3200000, rate: 0.21 },
  { min: 3200000, max: Infinity, rate: 0.24 },
]

// ============================================================================
// PAYROLL SERVICE
// ============================================================================

export class PayrollService {
  /**
   * Create a payroll period
   */
  static async createPayrollPeriod(tenantId: string, input: CreatePayrollPeriodInput) {
    // Check for overlapping period
    const existing = await prisma.hr_payroll_periods.findFirst({
      where: {
        tenantId,
        payFrequency: input.payFrequency,
        OR: [
          {
            periodStart: { lte: input.periodEnd },
            periodEnd: { gte: input.periodStart },
          },
        ],
      },
    })

    if (existing) {
      throw new Error('A payroll period already exists for this date range')
    }

    return prisma.hr_payroll_periods.create({
      data: withPrismaDefaults({
        tenantId,
        name: input.name,
        payFrequency: input.payFrequency,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        payDate: input.payDate,
        status: 'DRAFT',
        notes: input.notes,
        metadata: input.metadata as Prisma.InputJsonValue,
      }),
    })
  }

  /**
   * Get payroll periods
   */
  static async getPayrollPeriods(
    tenantId: string,
    options: {
      status?: HrPayrollPeriodStatus
      payFrequency?: HrPayFrequency
      year?: number
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.hr_payroll_periodsWhereInput = { tenantId }

    if (options.status) where.status = options.status
    if (options.payFrequency) where.payFrequency = options.payFrequency
    if (options.year) {
      const yearStart = new Date(options.year, 0, 1)
      const yearEnd = new Date(options.year, 11, 31)
      where.periodStart = { gte: yearStart, lte: yearEnd }
    }

    const [periods, total] = await Promise.all([
      prisma.hr_payroll_periods.findMany({
        where,
        include: {
          _count: { select: { hr_payroll_calculations: true, hr_payslips: true } },
        },
        orderBy: { periodStart: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.hr_payroll_periods.count({ where }),
    ])

    return { periods, total }
  }

  /**
   * Get payroll period by ID
   */
  static async getPayrollPeriodById(tenantId: string, periodId: string) {
    return prisma.hr_payroll_periods.findFirst({
      where: { id: periodId, tenantId },
      include: {
        hr_payroll_calculations: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { hr_payslips: true } },
      },
    })
  }

  /**
   * Open payroll period for processing
   */
  static async openPayrollPeriod(tenantId: string, periodId: string) {
    const period = await prisma.hr_payroll_periods.findFirst({
      where: { id: periodId, tenantId },
    })

    if (!period) throw new Error('Payroll period not found')
    if (period.status !== 'DRAFT') {
      throw new Error('Only DRAFT periods can be opened')
    }

    return prisma.hr_payroll_periods.update({
      where: { id: periodId },
      data: { status: 'OPEN' },
    })
  }

  /**
   * Calculate payroll for all employees in a period
   */
  static async calculatePayroll(tenantId: string, periodId: string, calculatedBy: string) {
    const period = await prisma.hr_payroll_periods.findFirst({
      where: { id: periodId, tenantId },
    })

    if (!period) throw new Error('Payroll period not found')
    if (!['OPEN', 'PROCESSING'].includes(period.status)) {
      throw new Error('Payroll period must be OPEN or PROCESSING to calculate')
    }

    // Update status to processing
    await prisma.hr_payroll_periods.update({
      where: { id: periodId },
      data: { status: 'PROCESSING' },
    })

    try {
      // Get all active employees with matching pay frequency
      const employees = await prisma.hr_employee_profiles.findMany({
        where: {
          tenantId,
          terminationDate: null,
          payFrequency: period.payFrequency,
        },
      })

      // Get HR config for calculations
      const config = await prisma.hr_configurations.findUnique({
        where: { tenantId },
      })

      let totalGross = 0
      let totalDeductions = 0
      let totalNet = 0
      const results = []

      for (const employee of employees) {
        const calculation = await this.calculateEmployeePayroll(
          tenantId,
          periodId,
          employee,
          period,
          config
        )
        
        totalGross += calculation.grossPay
        totalDeductions += calculation.totalDeductions
        totalNet += calculation.netPay
        results.push(calculation)
      }

      // Update period summary
      await prisma.hr_payroll_periods.update({
        where: { id: periodId },
        data: {
          status: 'FINALIZED',
          calculatedAt: new Date(),
          calculatedBy,
          employeeCount: employees.length,
          totalGrossPay: totalGross,
          totalDeductions,
          totalNetPay: totalNet,
        },
      })

      return {
        periodId,
        employeeCount: employees.length,
        totalGrossPay: totalGross,
        totalDeductions,
        totalNetPay: totalNet,
        calculations: results,
      }
    } catch (error) {
      // Revert to OPEN on error
      await prisma.hr_payroll_periods.update({
        where: { id: periodId },
        data: { status: 'OPEN' },
      })
      throw error
    }
  }

  /**
   * Calculate payroll for a single employee
   */
  private static async calculateEmployeePayroll(
    tenantId: string,
    periodId: string,
    employee: {
      id: string
      baseSalary: Prisma.Decimal | null
      hourlyRate: Prisma.Decimal | null
      dailyRate: Prisma.Decimal | null
      payFrequency: HrPayFrequency
      pensionNumber: string | null
      nhfNumber: string | null
    },
    period: { periodStart: Date; periodEnd: Date; payFrequency: HrPayFrequency },
    config: {
      overtimeMultiplier: Prisma.Decimal
      payeTaxEnabled: boolean
      pensionEnabled: boolean
      pensionEmployeeRate: Prisma.Decimal
      nhfEnabled: boolean
      nhfRate: Prisma.Decimal
    } | null
  ): Promise<PayrollCalculationResult> {
    // Get attendance summary
    const attendance = await AttendanceService.getAttendanceSummary(
      tenantId,
      employee.id,
      period.periodStart,
      period.periodEnd
    )

    // Calculate base pay based on pay type
    let basePay = 0
    const earningsBreakdown: Record<string, number> = {}

    if (employee.baseSalary) {
      basePay = Number(employee.baseSalary)
      earningsBreakdown['Basic Salary'] = basePay
    } else if (employee.hourlyRate) {
      const hoursWorked = attendance.totalWorkedMinutes / 60
      basePay = hoursWorked * Number(employee.hourlyRate)
      earningsBreakdown['Hourly Wages'] = basePay
    } else if (employee.dailyRate) {
      basePay = attendance.daysPresent * Number(employee.dailyRate)
      earningsBreakdown['Daily Wages'] = basePay
    }

    // Calculate overtime pay
    const overtimeMultiplier = Number(config?.overtimeMultiplier || 1.5)
    const overtimeHours = attendance.totalOvertimeMinutes / 60
    let overtimePay = 0
    
    if (overtimeHours > 0) {
      const hourlyRate = employee.hourlyRate 
        ? Number(employee.hourlyRate)
        : (basePay / 160) // Assume 160 hours per month
      overtimePay = overtimeHours * hourlyRate * overtimeMultiplier
      earningsBreakdown['Overtime'] = overtimePay
    }

    // TODO: Get allowances and bonuses from employee profile/contracts
    const allowances = 0
    const bonuses = 0
    const otherEarnings = 0

    // Calculate gross pay
    const grossPay = basePay + overtimePay + allowances + bonuses + otherEarnings

    // Calculate deductions
    const deductionsBreakdown: Record<string, number> = {}

    // PAYE Tax (Nigeria)
    let taxDeduction = 0
    if (config?.payeTaxEnabled) {
      const annualGross = grossPay * 12
      taxDeduction = this.calculatePAYE(annualGross) / 12
      deductionsBreakdown['PAYE Tax'] = taxDeduction
    }

    // Pension
    let pensionDeduction = 0
    if (config?.pensionEnabled && employee.pensionNumber) {
      const pensionRate = Number(config.pensionEmployeeRate) / 100
      pensionDeduction = grossPay * pensionRate
      deductionsBreakdown['Pension (Employee)'] = pensionDeduction
    }

    // NHF
    let nhfDeduction = 0
    if (config?.nhfEnabled && employee.nhfNumber) {
      const nhfRate = Number(config.nhfRate) / 100
      nhfDeduction = grossPay * nhfRate
      deductionsBreakdown['NHF'] = nhfDeduction
    }

    // TODO: Get loan and advance deductions
    const loanDeduction = 0
    const advanceDeduction = 0
    const otherDeductions = 0

    const totalDeductions = taxDeduction + pensionDeduction + nhfDeduction + loanDeduction + advanceDeduction + otherDeductions
    const netPay = grossPay - totalDeductions

    // Create or update calculation record
    await prisma.hr_payroll_calculations.upsert({
      where: {
        payrollPeriodId_employeeProfileId: {
          payrollPeriodId: periodId,
          employeeProfileId: employee.id,
        },
      },
      create: {
        tenantId,
        payrollPeriodId: periodId,
        employeeProfileId: employee.id,
        status: 'CALCULATED',
        basePay,
        overtimePay,
        allowances,
        bonuses,
        otherEarnings,
        grossPay,
        taxDeduction,
        pensionDeduction,
        nhfDeduction,
        loanDeduction,
        advanceDeduction,
        otherDeductions,
        totalDeductions,
        netPay,
        daysWorked: Math.round(attendance.daysPresent),
        daysAbsent: attendance.daysAbsent,
        daysLeave: attendance.daysOnLeave,
        overtimeHours,
        lateCount: attendance.daysLate,
        earningsBreakdown: earningsBreakdown as Prisma.InputJsonValue,
        deductionsBreakdown: deductionsBreakdown as Prisma.InputJsonValue,
      },
      update: {
        status: 'CALCULATED',
        basePay,
        overtimePay,
        allowances,
        bonuses,
        otherEarnings,
        grossPay,
        taxDeduction,
        pensionDeduction,
        nhfDeduction,
        loanDeduction,
        advanceDeduction,
        otherDeductions,
        totalDeductions,
        netPay,
        daysWorked: Math.round(attendance.daysPresent),
        daysAbsent: attendance.daysAbsent,
        daysLeave: attendance.daysOnLeave,
        overtimeHours,
        lateCount: attendance.daysLate,
        earningsBreakdown: earningsBreakdown as Prisma.InputJsonValue,
        deductionsBreakdown: deductionsBreakdown as Prisma.InputJsonValue,
      },
    })

    return {
      employeeProfileId: employee.id,
      basePay,
      overtimePay,
      allowances,
      bonuses,
      otherEarnings,
      grossPay,
      taxDeduction,
      pensionDeduction,
      nhfDeduction,
      loanDeduction,
      advanceDeduction,
      otherDeductions,
      totalDeductions,
      netPay,
      daysWorked: Math.round(attendance.daysPresent),
      daysAbsent: attendance.daysAbsent,
      daysLeave: attendance.daysOnLeave,
      overtimeHours,
      lateCount: attendance.daysLate,
      earningsBreakdown,
      deductionsBreakdown,
    }
  }

  /**
   * Calculate Nigeria PAYE tax
   */
  private static calculatePAYE(annualIncome: number): number {
    // Nigeria Consolidated Relief Allowance
    const CRA = Math.max(200000, annualIncome * 0.01) + (annualIncome * 0.2)
    const taxableIncome = Math.max(0, annualIncome - CRA)

    let tax = 0
    let remaining = taxableIncome

    for (const bracket of PAYE_BRACKETS) {
      if (remaining <= 0) break
      
      const bracketSize = bracket.max - bracket.min
      const taxableInBracket = Math.min(remaining, bracketSize)
      tax += taxableInBracket * bracket.rate
      remaining -= taxableInBracket
    }

    return Math.round(tax * 100) / 100
  }

  /**
   * Approve a payroll calculation
   */
  static async approveCalculation(tenantId: string, calculationId: string, approvedBy: string) {
    return prisma.hr_payroll_calculations.update({
      where: { id: calculationId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    })
  }

  /**
   * Finalize payroll period (locks calculations)
   */
  static async finalizePayrollPeriod(tenantId: string, periodId: string, finalizedBy: string) {
    const period = await prisma.hr_payroll_periods.findFirst({
      where: { id: periodId, tenantId },
    })

    if (!period) throw new Error('Payroll period not found')
    if (period.status !== 'FINALIZED') {
      throw new Error('Payroll must be calculated before finalizing')
    }

    // Update all calculations to FINALIZED
    await prisma.hr_payroll_calculations.updateMany({
      where: { payrollPeriodId: periodId },
      data: { status: 'FINALIZED' },
    })

    return prisma.hr_payroll_periods.update({
      where: { id: periodId },
      data: {
        finalizedAt: new Date(),
        finalizedBy,
      },
    })
  }

  /**
   * Mark payroll period as paid (external payment tracking)
   */
  static async markPeriodAsPaid(tenantId: string, periodId: string, paidBy: string) {
    const period = await prisma.hr_payroll_periods.findFirst({
      where: { id: periodId, tenantId },
    })

    if (!period) throw new Error('Payroll period not found')
    if (period.status !== 'FINALIZED') {
      throw new Error('Payroll must be finalized before marking as paid')
    }

    return prisma.hr_payroll_periods.update({
      where: { id: periodId },
      data: {
        status: 'PAID',
        paidMarkedAt: new Date(),
        paidMarkedBy: paidBy,
      },
    })
  }

  /**
   * Close payroll period (archive)
   */
  static async closePayrollPeriod(tenantId: string, periodId: string) {
    return prisma.hr_payroll_periods.update({
      where: { id: periodId },
      data: { status: 'CLOSED' },
    })
  }

  /**
   * Get payroll calculations for a period
   */
  static async getPayrollCalculations(tenantId: string, periodId: string) {
    const calculations = await prisma.hr_payroll_calculations.findMany({
      where: { tenantId, payrollPeriodId: periodId },
      orderBy: { createdAt: 'desc' },
    })

    // Get employee info
    const profileIds = calculations.map(c => c.employeeProfileId)
    const profiles = await prisma.hr_employee_profiles.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, staffId: true, department: true, jobTitle: true },
    })
    const profileMap = new Map(profiles.map(p => [p.id, p]))

    // Get staff names
    const staffIds = profiles.map(p => p.staffId)
    const staffRecords = await prisma.staffMember.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const staffMap = new Map(staffRecords.map(s => [s.id, `${s.firstName} ${s.lastName}`]))

    return calculations.map(c => {
      const profile = profileMap.get(c.employeeProfileId)
      const staff = profile ? staffMap.get(profile.staffId) : null
      return {
        ...c,
        employeeName: staff || 'Unknown',
        department: profile?.department,
        jobTitle: profile?.jobTitle,
      }
    })
  }
}
