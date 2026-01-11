/**
 * MODULE 5: HR & PAYROLL
 * Employee Service - Employee profile management
 * 
 * OWNERSHIP: This module owns extended HR profiles for staff.
 * DOES NOT OWN: Staff/User (Core owns - referenced by staffId only).
 */

import { prisma } from '@/lib/prisma'
import { HrEmploymentType, HrPayFrequency, HrPaymentMethod, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateEmployeeProfileInput {
  staffId: string
  employmentType?: HrEmploymentType
  jobTitle?: string
  department?: string
  grade?: string
  baseSalary?: number
  hourlyRate?: number
  dailyRate?: number
  payFrequency?: HrPayFrequency
  paymentMethod?: HrPaymentMethod
  currency?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  mobileMoneyProvider?: string
  mobileMoneyNumber?: string
  hireDate?: Date
  confirmationDate?: Date
  primaryLocationId?: string
  supervisorStaffId?: string
  annualLeaveEntitlement?: number
  sickLeaveEntitlement?: number
  casualLeaveEntitlement?: number
  taxIdNumber?: string
  pensionNumber?: string
  nhfNumber?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  metadata?: object
}

export interface UpdateEmployeeProfileInput extends Partial<CreateEmployeeProfileInput> {
  terminationDate?: Date
  terminationReason?: string
}

// ============================================================================
// EMPLOYEE SERVICE
// ============================================================================

export class EmployeeService {
  /**
   * Create employee profile (links to existing Core Staff)
   * NOTE: Does NOT create staff - staff must exist in Core
   */
  static async createEmployeeProfile(tenantId: string, input: CreateEmployeeProfileInput) {
    // Verify staff exists in Core
    const staff = await prisma.staffMember.findFirst({
      where: { id: input.staffId, tenantId },
    })

    if (!staff) {
      throw new Error('Staff not found in Core. Create staff first.')
    }

    // Check if profile already exists
    const existing = await prisma.hr_employee_profiles.findUnique({
      where: { staffId: input.staffId },
    })

    if (existing) {
      throw new Error('Employee profile already exists for this staff')
    }

    const profile = await prisma.hr_employee_profiles.create({
      data: withPrismaDefaults({
        tenantId,
        staffId: input.staffId,
        employmentType: input.employmentType || 'FULL_TIME',
        jobTitle: input.jobTitle,
        department: input.department,
        grade: input.grade,
        baseSalary: input.baseSalary,
        hourlyRate: input.hourlyRate,
        dailyRate: input.dailyRate,
        payFrequency: input.payFrequency || 'MONTHLY',
        paymentMethod: input.paymentMethod || 'CASH',
        currency: input.currency || 'NGN',
        bankName: input.bankName,
        bankAccountNumber: input.bankAccountNumber,
        bankAccountName: input.bankAccountName,
        mobileMoneyProvider: input.mobileMoneyProvider,
        mobileMoneyNumber: input.mobileMoneyNumber,
        hireDate: input.hireDate,
        confirmationDate: input.confirmationDate,
        primaryLocationId: input.primaryLocationId,
        supervisorStaffId: input.supervisorStaffId,
        annualLeaveEntitlement: input.annualLeaveEntitlement ?? 15,
        sickLeaveEntitlement: input.sickLeaveEntitlement ?? 10,
        casualLeaveEntitlement: input.casualLeaveEntitlement ?? 5,
        taxIdNumber: input.taxIdNumber,
        pensionNumber: input.pensionNumber,
        nhfNumber: input.nhfNumber,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        emergencyContactRelation: input.emergencyContactRelation,
        metadata: input.metadata as Prisma.InputJsonValue,
      }),
    })

    // Initialize leave balances for current year
    const currentYear = new Date().getFullYear()
    await this.initializeLeaveBalances(profile.id, tenantId, currentYear, {
      annual: input.annualLeaveEntitlement ?? 15,
      sick: input.sickLeaveEntitlement ?? 10,
      casual: input.casualLeaveEntitlement ?? 5,
    })

    return profile
  }

  /**
   * Initialize leave balances for an employee
   */
  static async initializeLeaveBalances(
    employeeProfileId: string,
    tenantId: string,
    year: number,
    entitlements: { annual: number; sick: number; casual: number }
  ) {
    const leaveTypes = [
      { type: 'ANNUAL' as const, entitlement: entitlements.annual },
      { type: 'SICK' as const, entitlement: entitlements.sick },
      { type: 'CASUAL' as const, entitlement: entitlements.casual },
    ]

    for (const { type, entitlement } of leaveTypes) {
      await prisma.hr_leave_balances.upsert({
        where: {
          employeeProfileId_year_leaveType: {
            employeeProfileId,
            year,
            leaveType: type,
          },
        },
        create: {
          tenantId,
          employeeProfileId,
          year,
          leaveType: type,
          entitlement,
          available: entitlement,
        },
        update: {
          entitlement,
          available: entitlement,
        },
      })
    }
  }

  /**
   * Get all employee profiles for a tenant
   */
  static async getEmployeeProfiles(
    tenantId: string,
    options: {
      employmentType?: HrEmploymentType
      department?: string
      active?: boolean
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.HrEmployeeProfileWhereInput = { tenantId }

    if (options.employmentType) where.employmentType = options.employmentType
    if (options.department) where.department = options.department
    if (options.active !== undefined) {
      where.terminationDate = options.active ? null : { not: null }
    }
    if (options.search) {
      where.OR = [
        { jobTitle: { contains: options.search, mode: 'insensitive' } },
        { department: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const [profiles, total] = await Promise.all([
      prisma.hr_employee_profiles.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.hr_employee_profiles.count({ where }),
    ])

    // Get staff info for each profile
    const staffIds = profiles.map(p => p.staffId)
    const staffRecords = await prisma.staffMember.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    })
    const staffMap = new Map(staffRecords.map(s => [s.id, { ...s, fullName: `${s.firstName} ${s.lastName}` }]))

    const enrichedProfiles = profiles.map(p => ({
      ...p,
      staff: staffMap.get(p.staffId) || null,
    }))

    return { profiles: enrichedProfiles, total }
  }

  /**
   * Get employee profile by ID
   */
  static async getEmployeeProfileById(tenantId: string, profileId: string) {
    const profile = await prisma.hr_employee_profiles.findFirst({
      where: { id: profileId, tenantId },
      include: {
        hr_employee_contracts: { orderBy: { startDate: 'desc' }, take: 5 },
        leaveBalances: { where: { year: new Date().getFullYear() } },
        _count: {
          select: {
            attendanceRecords: true,
            leaveRequests: true,
            hr_payslips: true,
          },
        },
      },
    })

    if (!profile) return null

    // Get staff info
    const staffRecord = await prisma.staffMember.findUnique({
      where: { id: profile.staffId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    })
    const staff = staffRecord ? { ...staffRecord, fullName: `${staffRecord.firstName} ${staffRecord.lastName}` } : null

    return { ...profile, staff }
  }

  /**
   * Get employee profile by staff ID
   */
  static async getEmployeeProfileByStaffId(tenantId: string, staffId: string) {
    return prisma.hr_employee_profiles.findFirst({
      where: { staffId, tenantId },
    })
  }

  /**
   * Update employee profile
   */
  static async updateEmployeeProfile(
    tenantId: string,
    profileId: string,
    input: UpdateEmployeeProfileInput
  ) {
    return prisma.hr_employee_profiles.update({
      where: { id: profileId },
      data: {
        ...(input.employmentType && { employmentType: input.employmentType }),
        ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.grade !== undefined && { grade: input.grade }),
        ...(input.baseSalary !== undefined && { baseSalary: input.baseSalary }),
        ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
        ...(input.dailyRate !== undefined && { dailyRate: input.dailyRate }),
        ...(input.payFrequency && { payFrequency: input.payFrequency }),
        ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
        ...(input.currency && { currency: input.currency }),
        ...(input.bankName !== undefined && { bankName: input.bankName }),
        ...(input.bankAccountNumber !== undefined && { bankAccountNumber: input.bankAccountNumber }),
        ...(input.bankAccountName !== undefined && { bankAccountName: input.bankAccountName }),
        ...(input.mobileMoneyProvider !== undefined && { mobileMoneyProvider: input.mobileMoneyProvider }),
        ...(input.mobileMoneyNumber !== undefined && { mobileMoneyNumber: input.mobileMoneyNumber }),
        ...(input.hireDate !== undefined && { hireDate: input.hireDate }),
        ...(input.confirmationDate !== undefined && { confirmationDate: input.confirmationDate }),
        ...(input.terminationDate !== undefined && { terminationDate: input.terminationDate }),
        ...(input.terminationReason !== undefined && { terminationReason: input.terminationReason }),
        ...(input.primaryLocationId !== undefined && { primaryLocationId: input.primaryLocationId }),
        ...(input.supervisorStaffId !== undefined && { supervisorStaffId: input.supervisorStaffId }),
        ...(input.annualLeaveEntitlement !== undefined && { annualLeaveEntitlement: input.annualLeaveEntitlement }),
        ...(input.sickLeaveEntitlement !== undefined && { sickLeaveEntitlement: input.sickLeaveEntitlement }),
        ...(input.casualLeaveEntitlement !== undefined && { casualLeaveEntitlement: input.casualLeaveEntitlement }),
        ...(input.taxIdNumber !== undefined && { taxIdNumber: input.taxIdNumber }),
        ...(input.pensionNumber !== undefined && { pensionNumber: input.pensionNumber }),
        ...(input.nhfNumber !== undefined && { nhfNumber: input.nhfNumber }),
        ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName }),
        ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone }),
        ...(input.emergencyContactRelation !== undefined && { emergencyContactRelation: input.emergencyContactRelation }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })
  }

  /**
   * Terminate employee
   */
  static async terminateEmployee(
    tenantId: string,
    profileId: string,
    terminationDate: Date,
    reason: string
  ) {
    return prisma.hr_employee_profiles.update({
      where: { id: profileId },
      data: {
        terminationDate,
        terminationReason: reason,
      },
    })
  }

  /**
   * Get employee statistics
   */
  static async getStatistics(tenantId: string) {
    const [
      total,
      byType,
      byDepartment,
      terminated,
    ] = await Promise.all([
      prisma.hr_employee_profiles.count({ where: { tenantId } }),
      prisma.hr_employee_profiles.groupBy({
        by: ['employmentType'],
        where: { tenantId, terminationDate: null },
        _count: true,
      }),
      prisma.hr_employee_profiles.groupBy({
        by: ['department'],
        where: { tenantId, terminationDate: null },
        _count: true,
      }),
      prisma.hr_employee_profiles.count({
        where: { tenantId, terminationDate: { not: null } },
      }),
    ])

    return {
      total,
      active: total - terminated,
      terminated,
      byEmploymentType: Object.fromEntries(byType.map(t => [t.employmentType, t._count])),
      byDepartment: Object.fromEntries(byDepartment.filter(d => d.department).map(d => [d.department, d._count])),
    }
  }
}
