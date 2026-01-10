/**
 * HEALTH SUITE: Facility Service
 * 
 * Clinic, Hospital, and Diagnostic Center management.
 * 
 * @module lib/health/facility-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthFacilityType } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreateFacilityInput {
  name: string
  code?: string
  type: HealthFacilityType
  description?: string
  phone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    lga?: string
    country?: string
  }
  location?: {
    lat: number
    lng: number
  }
  operatingHours?: Record<string, { open: string; close: string }>
}

export interface UpdateFacilityInput {
  name?: string
  description?: string
  phone?: string
  email?: string
  address?: Prisma.InputJsonValue
  location?: Prisma.InputJsonValue
  operatingHours?: Prisma.InputJsonValue
  isActive?: boolean
}

// ============================================================================
// FACILITY CRUD
// ============================================================================

/**
 * Create a facility
 */
export async function createFacility(
  tenantId: string,
  input: CreateFacilityInput,
  platformInstanceId?: string
) {
  const facility = await prisma.health_facility.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address || undefined,
      location: input.location || undefined,
      operatingHours: input.operatingHours || undefined,
      isActive: true,
    }),
  })
  
  return { success: true, facility }
}

/**
 * Get facility by ID
 */
export async function getFacility(tenantId: string, facilityId: string) {
  return prisma.health_facility.findFirst({
    where: { id: facilityId, tenantId },
    include: {
      providers: true,
      _count: {
        select: {
          appointments: true,
          visits: true,
          encounters: true,
        },
      },
    },
  })
}

/**
 * List facilities
 */
export async function listFacilities(
  tenantId: string,
  filters: { type?: HealthFacilityType; isActive?: boolean; page?: number; limit?: number } = {}
) {
  const { type, isActive, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (type) where.type = type
  if (isActive !== undefined) where.isActive = isActive
  
  const [facilities, total] = await Promise.all([
    prisma.health_facility.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.health_facility.count({ where }),
  ])
  
  return { facilities, total, page, limit }
}

/**
 * Update facility
 */
export async function updateFacility(
  tenantId: string,
  facilityId: string,
  input: UpdateFacilityInput
) {
  const facility = await prisma.health_facility.update({
    where: { id: facilityId, tenantId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  })
  
  return { success: true, facility }
}

// ============================================================================
// PROVIDER SERVICE
// ============================================================================

import { HealthProviderRole } from '@prisma/client'

export interface CreateProviderInput {
  firstName: string
  lastName: string
  title?: string
  role: HealthProviderRole
  specialty?: string
  licenseNumber?: string
  qualifications?: string
  phone?: string
  email?: string
  facilityId?: string
}

/**
 * Create a provider (Doctor, Nurse, etc.)
 */
export async function createProvider(
  tenantId: string,
  input: CreateProviderInput,
  platformInstanceId?: string
) {
  const provider = await prisma.health_provider.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      firstName: input.firstName,
      lastName: input.lastName,
      title: input.title,
      role: input.role,
      specialty: input.specialty,
      licenseNumber: input.licenseNumber,
      qualifications: input.qualifications,
      phone: input.phone,
      email: input.email,
      facilityId: input.facilityId,
      isActive: true,
    }),
  })
  
  return { success: true, provider }
}

/**
 * Get provider by ID
 */
export async function getProvider(tenantId: string, providerId: string) {
  return prisma.health_provider.findFirst({
    where: { id: providerId, tenantId },
    include: {
      facility: true,
    },
  })
}

/**
 * List providers
 */
export async function listProviders(
  tenantId: string,
  filters: { role?: HealthProviderRole; facilityId?: string; specialty?: string; isActive?: boolean; page?: number; limit?: number } = {}
) {
  const { role, facilityId, specialty, isActive, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (role) where.role = role
  if (facilityId) where.facilityId = facilityId
  if (specialty) where.specialty = specialty
  if (isActive !== undefined) where.isActive = isActive
  
  const [providers, total] = await Promise.all([
    prisma.health_provider.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { lastName: 'asc' },
      include: { facility: true },
    }),
    prisma.health_provider.count({ where }),
  ])
  
  return { providers, total, page, limit }
}

/**
 * Update provider
 */
export async function updateProvider(
  tenantId: string,
  providerId: string,
  input: Partial<CreateProviderInput> & { isActive?: boolean }
) {
  const provider = await prisma.health_provider.update({
    where: { id: providerId, tenantId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  })
  
  return { success: true, provider }
}
