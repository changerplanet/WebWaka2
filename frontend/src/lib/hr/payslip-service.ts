/**
 * MODULE 5: HR & PAYROLL
 * Payslip Service - Payslip generation (IMMUTABLE records)
 * 
 * PHASE 5: Payslips & Payroll Records
 * 
 * NOTE: Payslips are READ-ONLY after generation. No updates allowed.
 */

import { prisma } from '@/lib/prisma'
import { HrPaymentMethod, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratePayslipsInput {
  periodId: string
  calculationIds?: string[]  // If empty, generate for all calculations in period
}

// ============================================================================
// PAYSLIP SERVICE
// ============================================================================

export class PayslipService {
  /**
   * Generate payslips for a payroll period
   */
  static async generatePayslips(tenantId: string, input: GeneratePayslipsInput, generatedBy: string) {
    const period = await prisma.hr_payroll_periods.findFirst({
      where: { id: input.periodId, tenantId },
    })

    if (!period) throw new Error('Payroll period not found')
    if (!['FINALIZED', 'PAID'].includes(period.status)) {
      throw new Error('Payroll must be finalized before generating payslips')
    }

    // Get calculations to generate payslips for
    const calculationsWhere: Prisma.hr_payroll_calculationsWhereInput = {
      tenantId,
      payrollPeriodId: input.periodId,
      status: { in: ['APPROVED', 'FINALIZED'] },
    }

    if (input.calculationIds?.length) {
      calculationsWhere.id = { in: input.calculationIds }
    }

    const calculations = await prisma.hr_payroll_calculations.findMany({
      where: calculationsWhere,
      include: {
        hr_employee_profiles: true,
      },
    })

    if (calculations.length === 0) {
      throw new Error('No approved/finalized calculations found')
    }

    // Get staff info
    const staffIds = calculations.map(c => c.hr_employee_profiles.staffId)
    const staffRecords = await prisma.staffMember.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const staffMap = new Map(staffRecords.map(s => [s.id, `${s.firstName} ${s.lastName}`]))

    const payslips = []

    for (const calc of calculations) {
      // Check if payslip already exists
      const existing = await prisma.hr_payslips.findFirst({
        where: {
          payrollPeriodId: input.periodId,
          employeeProfileId: calc.hr_employee_profiles.id,
        },
      })

      if (existing) {
        payslips.push(existing)
        continue
      }

      const profile = calc.hr_employee_profiles

      // Generate unique payslip number
      const payslipNumber = await this.generatePayslipNumber(tenantId, period.periodStart)

      // Mask bank account for security
      const maskedAccount = profile.bankAccountNumber
        ? `****${profile.bankAccountNumber.slice(-4)}`
        : null

      const payslip = await prisma.hr_payslips.create({
        data: withPrismaDefaults({
          tenantId,
          payrollPeriodId: input.periodId,
          employeeProfileId: calc.hr_employee_profiles.id,
          payslipNumber,
          
          // Employee snapshot
          employeeName: staffMap.get(calc.hr_employee_profiles.staffId) || 'Unknown',
          employeeId: profile.staffId,
          department: profile.department,
          jobTitle: profile.jobTitle,
          bankName: profile.bankName,
          bankAccountNumber: maskedAccount,
          
          // Period info
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          payDate: period.payDate,
          
          // Earnings
          basePay: calc.basePay,
          overtimePay: calc.overtimePay,
          allowances: calc.allowances,
          bonuses: calc.bonuses,
          otherEarnings: calc.otherEarnings,
          grossPay: calc.grossPay,
          
          // Deductions
          taxDeduction: calc.taxDeduction,
          pensionDeduction: calc.pensionDeduction,
          nhfDeduction: calc.nhfDeduction,
          loanDeduction: calc.loanDeduction,
          advanceDeduction: calc.advanceDeduction,
          otherDeductions: calc.otherDeductions,
          totalDeductions: calc.totalDeductions,
          
          // Net pay
          netPay: calc.netPay,
          currency: profile.currency,
          
          // Detailed breakdown
          earningsDetails: calc.earningsBreakdown as Prisma.InputJsonValue,
          deductionsDetails: calc.deductionsBreakdown as Prisma.InputJsonValue,
          
          // Attendance
          daysWorked: calc.daysWorked,
          daysAbsent: calc.daysAbsent,
          daysLeave: calc.daysLeave,
          overtimeHours: calc.overtimeHours,
          
          // Payment info
          paymentMethod: profile.paymentMethod,
          paymentStatus: 'PENDING',
          
          // Immutable
          isFinalized: true,
          generatedBy,
        }),
      })

      payslips.push(payslip)
    }

    return payslips
  }

  /**
   * Generate unique payslip number
   */
  private static async generatePayslipNumber(tenantId: string, periodStart: Date): Promise<string> {
    const year = periodStart.getFullYear()
    const month = String(periodStart.getMonth() + 1).padStart(2, '0')

    // Count existing payslips for this month
    const count = await prisma.hr_payslips.count({
      where: {
        tenantId,
        periodStart: {
          gte: new Date(year, periodStart.getMonth(), 1),
          lt: new Date(year, periodStart.getMonth() + 1, 1),
        },
      },
    })

    const sequence = String(count + 1).padStart(4, '0')
    return `PS-${year}${month}-${sequence}`
  }

  /**
   * Get payslips for a period
   */
  static async getPayslipsByPeriod(tenantId: string, periodId: string) {
    return prisma.hr_payslips.findMany({
      where: { tenantId, payrollPeriodId: periodId },
      orderBy: { employeeName: 'asc' },
    })
  }

  /**
   * Get payslips for an employee
   */
  static async getPayslipsByEmployee(
    tenantId: string,
    employeeProfileId: string,
    options: {
      year?: number
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.hr_payslipsWhereInput = { tenantId, employeeProfileId }

    if (options.year) {
      where.periodStart = {
        gte: new Date(options.year, 0, 1),
        lt: new Date(options.year + 1, 0, 1),
      }
    }

    const [payslips, total] = await Promise.all([
      prisma.hr_payslips.findMany({
        where,
        orderBy: { periodStart: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.hr_payslips.count({ where }),
    ])

    return { payslips, total }
  }

  /**
   * Get payslip by ID
   */
  static async getPayslipById(tenantId: string, payslipId: string) {
    return prisma.hr_payslips.findFirst({
      where: { id: payslipId, tenantId },
    })
  }

  /**
   * Get payslip by number
   */
  static async getPayslipByNumber(tenantId: string, payslipNumber: string) {
    return prisma.hr_payslips.findFirst({
      where: { payslipNumber, tenantId },
    })
  }

  /**
   * Mark payslip payment status
   * NOTE: This only updates payment STATUS, does NOT execute payment
   */
  static async updatePaymentStatus(
    tenantId: string,
    payslipId: string,
    status: 'PENDING' | 'PAID' | 'HELD',
    options: {
      paymentReference?: string
      paidBy?: string
    } = {}
  ) {
    const payslip = await prisma.hr_payslips.findFirst({
      where: { id: payslipId, tenantId },
    })

    if (!payslip) throw new Error('Payslip not found')

    // Only update payment status fields, not the payslip data itself
    return prisma.hr_payslips.update({
      where: { id: payslipId },
      data: {
        paymentStatus: status,
        ...(status === 'PAID' && {
          paidAt: new Date(),
          paidBy: options.paidBy,
          paymentReference: options.paymentReference,
        }),
      },
    })
  }

  /**
   * Mark payslip as delivered/viewed
   */
  static async markAsDelivered(
    tenantId: string,
    payslipId: string,
    method: 'EMAIL' | 'PRINT' | 'PORTAL'
  ) {
    return prisma.hr_payslips.update({
      where: { id: payslipId },
      data: {
        deliveredAt: new Date(),
        deliveredMethod: method,
      },
    })
  }

  /**
   * Mark payslip as viewed by employee
   */
  static async markAsViewed(tenantId: string, payslipId: string) {
    const payslip = await prisma.hr_payslips.findFirst({
      where: { id: payslipId, tenantId },
    })

    if (!payslip) throw new Error('Payslip not found')
    if (payslip.viewedAt) return payslip // Already viewed

    return prisma.hr_payslips.update({
      where: { id: payslipId },
      data: { viewedAt: new Date() },
    })
  }

  /**
   * Get payroll summary statistics
   */
  static async getPayrollStatistics(
    tenantId: string,
    options: { year?: number; periodId?: string } = {}
  ) {
    const where: Prisma.hr_payslipsWhereInput = { tenantId }

    if (options.year) {
      where.periodStart = {
        gte: new Date(options.year, 0, 1),
        lt: new Date(options.year + 1, 0, 1),
      }
    }
    if (options.periodId) {
      where.payrollPeriodId = options.periodId
    }

    const [totals, byStatus, count] = await Promise.all([
      prisma.hr_payslips.aggregate({
        where,
        _sum: {
          grossPay: true,
          totalDeductions: true,
          netPay: true,
        },
      }),
      prisma.hr_payslips.groupBy({
        by: ['paymentStatus'],
        where,
        _count: true,
        _sum: { netPay: true },
      }),
      prisma.hr_payslips.count({ where }),
    ])

    const statusCounts: Record<string, { count: number; amount: number }> = {}
    byStatus.forEach(s => {
      statusCounts[s.paymentStatus] = {
        count: s._count,
        amount: Number(s._sum.netPay) || 0,
      }
    })

    return {
      totalPayslips: count,
      totalGrossPay: Number(totals._sum.grossPay) || 0,
      totalDeductions: Number(totals._sum.totalDeductions) || 0,
      totalNetPay: Number(totals._sum.netPay) || 0,
      byPaymentStatus: statusCounts,
    }
  }
}
