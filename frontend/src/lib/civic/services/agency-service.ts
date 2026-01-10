/**
 * CIVIC SUITE: Agency Service
 * 
 * Manages government agency structure including departments, units, and staff.
 * 
 * @module lib/civic/services/agency-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicStaffRole, Prisma } from '@prisma/client'

// Helper to convert Record to Prisma Json type
type JsonInput = Prisma.InputJsonValue | undefined

// ============================================================================
// AGENCY MANAGEMENT
// ============================================================================

/**
 * Create a new agency
 */
export async function createAgency(data: {
  tenantId: string
  code: string
  name: string
  description?: string
  jurisdiction?: string
  parentAgencyId?: string
  phone?: string
  email?: string
  address?: Record<string, unknown>
  website?: string
  headName?: string
  headTitle?: string
}) {
  return prisma.civic_agency.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      jurisdiction: data.jurisdiction,
      parentAgencyId: data.parentAgencyId,
      phone: data.phone,
      email: data.email,
      address: data.address as JsonInput,
      website: data.website,
      headName: data.headName,
      headTitle: data.headTitle,
      isActive: true,
    }),
  })
}

/**
 * Get agency by ID
 */
export async function getAgency(tenantId: string, id: string) {
  return prisma.civic_agency.findFirst({
    where: { tenantId, id },
    include: {
      departments: {
        where: { isActive: true },
        include: {
          units: { where: { isActive: true } },
        },
      },
      _count: {
        select: { services: true, staff: true },
      },
    },
  })
}

/**
 * Get agency by code
 */
export async function getAgencyByCode(tenantId: string, code: string) {
  return prisma.civic_agency.findFirst({
    where: { tenantId, code },
  })
}

/**
 * Update agency
 */
export async function updateAgency(
  tenantId: string,
  id: string,
  data: {
    code?: string
    name?: string
    description?: string
    jurisdiction?: string
    phone?: string
    email?: string
    address?: Record<string, unknown>
    website?: string
    headName?: string
    headTitle?: string
  }
) {
  return prisma.civic_agency.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      jurisdiction: data.jurisdiction,
      phone: data.phone,
      email: data.email,
      address: data.address as JsonInput,
      website: data.website,
      headName: data.headName,
      headTitle: data.headTitle,
    },
  })
}

/**
 * List agencies
 */
export async function listAgencies(
  tenantId: string,
  options?: {
    jurisdiction?: string
    isActive?: boolean
  }
) {
  const { jurisdiction, isActive = true } = options || {}
  
  const where: Record<string, unknown> = { tenantId, isActive }
  if (jurisdiction) where.jurisdiction = jurisdiction

  return prisma.civic_agency.findMany({
    where,
    include: {
      _count: { select: { departments: true, services: true, staff: true } },
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// DEPARTMENT MANAGEMENT
// ============================================================================

/**
 * Create department
 */
export async function createDepartment(data: {
  tenantId: string
  agencyId: string
  code: string
  name: string
  description?: string
  headName?: string
  headTitle?: string
}) {
  return prisma.civic_department.create({
    data: withPrismaDefaults({
      ...data,
      isActive: true,
    }),
  })
}

/**
 * Get department by ID
 */
export async function getDepartment(tenantId: string, id: string) {
  return prisma.civic_department.findFirst({
    where: { tenantId, id },
    include: {
      agency: true,
      units: { where: { isActive: true } },
      _count: { select: { staff: true } },
    },
  })
}

/**
 * Update department
 */
export async function updateDepartment(
  tenantId: string,
  id: string,
  data: {
    code?: string
    name?: string
    description?: string
    headName?: string
    headTitle?: string
  }
) {
  return prisma.civic_department.update({
    where: { id },
    data,
  })
}

/**
 * List departments for agency
 */
export async function listDepartments(tenantId: string, agencyId: string) {
  return prisma.civic_department.findMany({
    where: { tenantId, agencyId, isActive: true },
    include: {
      _count: { select: { units: true, staff: true } },
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// UNIT MANAGEMENT
// ============================================================================

/**
 * Create unit
 */
export async function createUnit(data: {
  tenantId: string
  departmentId: string
  code: string
  name: string
  description?: string
}) {
  return prisma.civic_unit.create({
    data: withPrismaDefaults({
      ...data,
      isActive: true,
    }),
  })
}

/**
 * Get unit by ID
 */
export async function getUnit(tenantId: string, id: string) {
  return prisma.civic_unit.findFirst({
    where: { tenantId, id },
    include: {
      department: { include: { agency: true } },
      _count: { select: { staff: true } },
    },
  })
}

/**
 * List units for department
 */
export async function listUnits(tenantId: string, departmentId: string) {
  return prisma.civic_unit.findMany({
    where: { tenantId, departmentId, isActive: true },
    include: {
      _count: { select: { staff: true } },
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

/**
 * Generate staff number
 */
export async function generateStaffNumber(tenantId: string): Promise<string> {
  const count = await prisma.civic_staff.count({ where: { tenantId } })
  const number = String(count + 1).padStart(4, '0')
  return `STAFF-${number}`
}

/**
 * Create staff member
 */
export async function createStaff(data: {
  tenantId: string
  agencyId?: string
  departmentId?: string
  unitId?: string
  userId?: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  email?: string
  role: CivicStaffRole
  designation?: string
  hireDate?: Date
}) {
  const staffNumber = await generateStaffNumber(data.tenantId)
  
  return prisma.civic_staff.create({
    data: withPrismaDefaults({
      ...data,
      staffNumber,
      isActive: true,
    }),
  })
}

/**
 * Get staff by ID
 */
export async function getStaff(tenantId: string, id: string) {
  return prisma.civic_staff.findFirst({
    where: { tenantId, id },
    include: {
      agency: true,
      department: true,
      unit: true,
    },
  })
}

/**
 * Get staff by staff number
 */
export async function getStaffByNumber(tenantId: string, staffNumber: string) {
  return prisma.civic_staff.findFirst({
    where: { tenantId, staffNumber },
  })
}

/**
 * Update staff
 */
export async function updateStaff(
  tenantId: string,
  id: string,
  data: {
    agencyId?: string
    departmentId?: string
    unitId?: string
    firstName?: string
    lastName?: string
    middleName?: string
    phone?: string
    email?: string
    role?: CivicStaffRole
    designation?: string
    hireDate?: Date
  }
) {
  return prisma.civic_staff.update({
    where: { id },
    data,
  })
}

/**
 * Deactivate staff
 */
export async function deactivateStaff(tenantId: string, id: string) {
  return prisma.civic_staff.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * List staff with filters
 */
export async function listStaff(
  tenantId: string,
  options?: {
    agencyId?: string
    departmentId?: string
    unitId?: string
    role?: CivicStaffRole
    isActive?: boolean
    page?: number
    limit?: number
  }
) {
  const {
    agencyId,
    departmentId,
    unitId,
    role,
    isActive = true,
    page = 1,
    limit = 20,
  } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId, isActive }
  if (agencyId) where.agencyId = agencyId
  if (departmentId) where.departmentId = departmentId
  if (unitId) where.unitId = unitId
  if (role) where.role = role

  const [staff, total] = await Promise.all([
    prisma.civic_staff.findMany({
      where,
      skip,
      take: limit,
      include: {
        agency: true,
        department: true,
        unit: true,
      },
      orderBy: { lastName: 'asc' },
    }),
    prisma.civic_staff.count({ where }),
  ])

  return { staff, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get staff by role
 */
export async function getStaffByRole(
  tenantId: string,
  agencyId: string,
  role: CivicStaffRole
) {
  return prisma.civic_staff.findMany({
    where: { tenantId, agencyId, role, isActive: true },
    orderBy: { lastName: 'asc' },
  })
}
