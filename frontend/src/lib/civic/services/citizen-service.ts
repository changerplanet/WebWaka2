/**
 * CIVIC SUITE: Citizen Service
 * 
 * Manages citizen and organization profiles for government service delivery.
 * Identity references only - NOT a National ID replacement.
 * 
 * @module lib/civic/services/citizen-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicDocumentType, CivicDocumentStatus, Prisma } from '@prisma/client'

// Helper to convert Record to Prisma Json type
type JsonInput = Prisma.InputJsonValue | undefined

// ============================================================================
// CITIZEN MANAGEMENT
// ============================================================================

/**
 * Generate unique citizen number
 */
export async function generateCitizenNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_citizen.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `CIT-${year}-${number}`
}

/**
 * Create a new citizen profile
 */
export async function createCitizen(data: {
  tenantId: string
  firstName: string
  lastName: string
  middleName?: string
  title?: string
  phone?: string
  email?: string
  address?: Record<string, unknown>
  nationalIdRef?: string
  voterIdRef?: string
  dateOfBirth?: Date
  gender?: string
  occupation?: string
  notes?: string
}) {
  const citizenNumber = await generateCitizenNumber(data.tenantId)
  
  return prisma.civic_citizen.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      title: data.title,
      phone: data.phone,
      email: data.email,
      address: data.address as JsonInput,
      nationalIdRef: data.nationalIdRef,
      voterIdRef: data.voterIdRef,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      occupation: data.occupation,
      notes: data.notes,
      citizenNumber,
      isActive: true,
      isVerified: false,
    }),
  })
}

/**
 * Get citizen by ID
 */
export async function getCitizen(tenantId: string, id: string) {
  return prisma.civic_citizen.findFirst({
    where: { tenantId, id },
    include: {
      documents: true,
      _count: { select: { requests: true } },
    },
  })
}

/**
 * Get citizen by citizen number
 */
export async function getCitizenByNumber(tenantId: string, citizenNumber: string) {
  return prisma.civic_citizen.findFirst({
    where: { tenantId, citizenNumber },
    include: {
      documents: true,
      _count: { select: { requests: true } },
    },
  })
}

/**
 * Get citizen by phone
 */
export async function getCitizenByPhone(tenantId: string, phone: string) {
  return prisma.civic_citizen.findFirst({
    where: { tenantId, phone },
  })
}

/**
 * Update citizen profile
 */
export async function updateCitizen(
  tenantId: string,
  id: string,
  data: {
    firstName?: string
    lastName?: string
    middleName?: string
    title?: string
    phone?: string
    email?: string
    address?: Record<string, unknown>
    nationalIdRef?: string
    voterIdRef?: string
    dateOfBirth?: Date
    gender?: string
    occupation?: string
    notes?: string
  }
) {
  return prisma.civic_citizen.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      title: data.title,
      phone: data.phone,
      email: data.email,
      address: data.address as JsonInput,
      nationalIdRef: data.nationalIdRef,
      voterIdRef: data.voterIdRef,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      occupation: data.occupation,
      notes: data.notes,
    },
  })
}

/**
 * Verify citizen profile
 */
export async function verifyCitizen(
  tenantId: string,
  id: string,
  verifiedBy: string
) {
  return prisma.civic_citizen.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    },
  })
}

/**
 * List citizens with filters
 */
export async function listCitizens(
  tenantId: string,
  options?: {
    search?: string
    isVerified?: boolean
    page?: number
    limit?: number
  }
) {
  const { search, isVerified, page = 1, limit = 20 } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId, isActive: true }
  
  if (isVerified !== undefined) {
    where.isVerified = isVerified
  }
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { citizenNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [citizens, total] = await Promise.all([
    prisma.civic_citizen.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.civic_citizen.count({ where }),
  ])

  return { citizens, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ============================================================================
// ORGANIZATION MANAGEMENT
// ============================================================================

/**
 * Generate unique organization number
 */
export async function generateOrgNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_organization.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `ORG-${year}-${number}`
}

/**
 * Create a new organization profile
 */
export async function createOrganization(data: {
  tenantId: string
  name: string
  tradeName?: string
  registrationType?: string
  rcNumber?: string
  taxId?: string
  phone?: string
  email?: string
  website?: string
  address?: Record<string, unknown>
  contactPerson?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  notes?: string
}) {
  const orgNumber = await generateOrgNumber(data.tenantId)
  
  return prisma.civic_organization.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      name: data.name,
      tradeName: data.tradeName,
      registrationType: data.registrationType,
      rcNumber: data.rcNumber,
      taxId: data.taxId,
      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address as JsonInput,
      contactPerson: data.contactPerson,
      contactPersonPhone: data.contactPersonPhone,
      contactPersonEmail: data.contactPersonEmail,
      notes: data.notes,
      orgNumber,
      isActive: true,
      isVerified: false,
    }),
  })
}

/**
 * Get organization by ID
 */
export async function getOrganization(tenantId: string, id: string) {
  return prisma.civic_organization.findFirst({
    where: { tenantId, id },
    include: {
      documents: true,
      _count: { select: { requests: true } },
    },
  })
}

/**
 * Get organization by org number
 */
export async function getOrganizationByNumber(tenantId: string, orgNumber: string) {
  return prisma.civic_organization.findFirst({
    where: { tenantId, orgNumber },
  })
}

/**
 * Update organization
 */
export async function updateOrganization(
  tenantId: string,
  id: string,
  data: {
    name?: string
    tradeName?: string
    registrationType?: string
    rcNumber?: string
    taxId?: string
    phone?: string
    email?: string
    website?: string
    address?: Record<string, unknown>
    contactPerson?: string
    contactPersonPhone?: string
    contactPersonEmail?: string
    notes?: string
  }
) {
  return prisma.civic_organization.update({
    where: { id },
    data: {
      name: data.name,
      tradeName: data.tradeName,
      registrationType: data.registrationType,
      rcNumber: data.rcNumber,
      taxId: data.taxId,
      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address as JsonInput,
      contactPerson: data.contactPerson,
      contactPersonPhone: data.contactPersonPhone,
      contactPersonEmail: data.contactPersonEmail,
      notes: data.notes,
    },
  })
}

/**
 * Verify organization
 */
export async function verifyOrganization(
  tenantId: string,
  id: string,
  verifiedBy: string
) {
  return prisma.civic_organization.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    },
  })
}

/**
 * List organizations
 */
export async function listOrganizations(
  tenantId: string,
  options?: {
    search?: string
    isVerified?: boolean
    page?: number
    limit?: number
  }
) {
  const { search, isVerified, page = 1, limit = 20 } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId, isActive: true }
  
  if (isVerified !== undefined) {
    where.isVerified = isVerified
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tradeName: { contains: search, mode: 'insensitive' } },
      { rcNumber: { contains: search } },
      { orgNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [organizations, total] = await Promise.all([
    prisma.civic_organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.civic_organization.count({ where }),
  ])

  return { organizations, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * Upload document for citizen or organization
 */
export async function uploadDocument(data: {
  tenantId: string
  citizenId?: string
  organizationId?: string
  documentType: CivicDocumentType
  documentName: string
  description?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  expiryDate?: Date
}) {
  return prisma.civic_citizen_document.create({
    data: withPrismaDefaults({
      ...data,
      status: 'PENDING',
    }),
  })
}

/**
 * Verify document
 */
export async function verifyDocument(
  tenantId: string,
  id: string,
  verifiedBy: string,
  status: CivicDocumentStatus,
  verifierNote?: string
) {
  return prisma.civic_citizen_document.update({
    where: { id },
    data: {
      status,
      verifiedAt: new Date(),
      verifiedBy,
      verifierNote,
    },
  })
}

/**
 * Get documents for citizen
 */
export async function getCitizenDocuments(tenantId: string, citizenId: string) {
  return prisma.civic_citizen_document.findMany({
    where: { tenantId, citizenId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get documents for organization
 */
export async function getOrganizationDocuments(tenantId: string, organizationId: string) {
  return prisma.civic_citizen_document.findMany({
    where: { tenantId, organizationId },
    orderBy: { createdAt: 'desc' },
  })
}
