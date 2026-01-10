/**
 * CIVIC SUITE: Service Catalogue Service
 * 
 * Manages government service definitions, requirements, fees, and SLAs.
 * 
 * @module lib/civic/services/service-catalogue-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicServiceCategory } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// SERVICE MANAGEMENT
// ============================================================================

/**
 * Create a new service definition
 */
export async function createService(data: {
  tenantId: string
  agencyId: string
  code: string
  name: string
  description?: string
  category?: CivicServiceCategory
  eligibility?: string
  processFlow?: string
  requiredDocuments?: string[]
  baseFee?: number
  processingFee?: number
  inspectionFee?: number
  vatApplicable?: boolean
  slaBusinessDays?: number
  validityDays?: number
  renewalRequired?: boolean
  renewalNoticeDays?: number
}) {
  return prisma.civic_service.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      agencyId: data.agencyId,
      code: data.code,
      name: data.name,
      description: data.description,
      category: data.category || 'OTHER',
      eligibility: data.eligibility,
      processFlow: data.processFlow,
      requiredDocuments: data.requiredDocuments,
      baseFee: data.baseFee ? new Decimal(data.baseFee) : null,
      processingFee: data.processingFee ? new Decimal(data.processingFee) : null,
      inspectionFee: data.inspectionFee ? new Decimal(data.inspectionFee) : null,
      vatApplicable: data.vatApplicable ?? false,
      slaBusinessDays: data.slaBusinessDays ?? 14,
      validityDays: data.validityDays,
      renewalRequired: data.renewalRequired ?? false,
      renewalNoticeDays: data.renewalNoticeDays,
      isActive: true,
    }),
  })
}

/**
 * Get service by ID
 */
export async function getService(tenantId: string, id: string) {
  return prisma.civic_service.findFirst({
    where: { tenantId, id },
    include: {
      agency: true,
      _count: { select: { requests: true } },
    },
  })
}

/**
 * Get service by code
 */
export async function getServiceByCode(tenantId: string, agencyId: string, code: string) {
  return prisma.civic_service.findFirst({
    where: { tenantId, agencyId, code },
  })
}

/**
 * Update service
 */
export async function updateService(
  tenantId: string,
  id: string,
  data: {
    code?: string
    name?: string
    description?: string
    category?: CivicServiceCategory
    eligibility?: string
    processFlow?: string
    requiredDocuments?: string[]
    baseFee?: number
    processingFee?: number
    inspectionFee?: number
    vatApplicable?: boolean
    slaBusinessDays?: number
    validityDays?: number
    renewalRequired?: boolean
    renewalNoticeDays?: number
    isActive?: boolean
  }
) {
  const updateData: Record<string, unknown> = { ...data }
  
  if (data.baseFee !== undefined) {
    updateData.baseFee = data.baseFee ? new Decimal(data.baseFee) : null
  }
  if (data.processingFee !== undefined) {
    updateData.processingFee = data.processingFee ? new Decimal(data.processingFee) : null
  }
  if (data.inspectionFee !== undefined) {
    updateData.inspectionFee = data.inspectionFee ? new Decimal(data.inspectionFee) : null
  }

  return prisma.civic_service.update({
    where: { id },
    data: updateData,
  })
}

/**
 * List services for agency
 */
export async function listServices(
  tenantId: string,
  options?: {
    agencyId?: string
    category?: CivicServiceCategory
    isActive?: boolean
    search?: string
  }
) {
  const { agencyId, category, isActive = true, search } = options || {}
  
  const where: Record<string, unknown> = { tenantId, isActive }
  if (agencyId) where.agencyId = agencyId
  if (category) where.category = category
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  return prisma.civic_service.findMany({
    where,
    include: {
      agency: true,
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * List services by category
 */
export async function listServicesByCategory(
  tenantId: string,
  category: CivicServiceCategory
) {
  return prisma.civic_service.findMany({
    where: { tenantId, category, isActive: true },
    include: { agency: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get public service catalogue (for citizen-facing views)
 */
export async function getPublicServiceCatalogue(tenantId: string) {
  const services = await prisma.civic_service.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      leg_template_categories: true,
      eligibility: true,
      requiredDocuments: true,
      baseFee: true,
      processingFee: true,
      inspectionFee: true,
      slaBusinessDays: true,
      agency: {
        select: { name: true, code: true },
      },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  // Group by category
  const grouped: Record<string, typeof services> = {}
  for (const service of services) {
    const cat = service.category || 'OTHER'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(service)
  }

  return grouped
}

/**
 * Calculate total fees for a service
 */
export function calculateServiceFees(service: {
  baseFee?: Decimal | null
  processingFee?: Decimal | null
  inspectionFee?: Decimal | null
}): {
  baseFee: number
  processingFee: number
  inspectionFee: number
  totalFee: number
} {
  const baseFee = service.baseFee ? Number(service.baseFee) : 0
  const processingFee = service.processingFee ? Number(service.processingFee) : 0
  const inspectionFee = service.inspectionFee ? Number(service.inspectionFee) : 0
  
  return {
    baseFee,
    processingFee,
    inspectionFee,
    totalFee: baseFee + processingFee + inspectionFee,
  }
}

/**
 * Get services expiring soon (for renewal tracking)
 */
export async function getServicesRequiringRenewal(tenantId: string) {
  return prisma.civic_service.findMany({
    where: {
      tenantId,
      renewalRequired: true,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      validityDays: true,
      renewalNoticeDays: true,
    },
  })
}
