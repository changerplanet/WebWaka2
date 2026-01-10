/**
 * CIVIC SUITE: Billing Fact Service
 * 
 * Emits fee and penalty facts for Commerce to bill.
 * NEVER creates invoices, calculates VAT, or records payments.
 * 
 * Commerce Boundary:
 * Civic [Fee Facts] → Commerce [Billing] → Payments → Accounting
 * 
 * @module lib/civic/services/billing-fact-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicBillingFactType, CivicBillingFactStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// BILLING FACT EMISSION
// ============================================================================

/**
 * Create a billing fact (emit to Commerce)
 * 
 * NOTE: This only creates a fact record. Commerce is responsible for:
 * - Creating the invoice
 * - Calculating VAT (if applicable)
 * - Recording the payment
 * - Posting to accounting
 */
export async function createBillingFact(data: {
  tenantId: string
  requestId?: string
  citizenId?: string
  factType: CivicBillingFactType
  description: string
  quantity?: number
  unitAmount: number
  serviceDate?: Date
  servicedById?: string
  servicedByName?: string
  dueDate?: Date
  referenceType?: string
  referenceId?: string
}) {
  const quantity = data.quantity || 1
  const amount = quantity * data.unitAmount

  return prisma.civic_billing_fact.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      requestId: data.requestId,
      citizenId: data.citizenId,
      factType: data.factType,
      description: data.description,
      quantity,
      unitAmount: new Decimal(data.unitAmount),
      amount: new Decimal(amount),
      serviceDate: data.serviceDate || new Date(),
      servicedById: data.servicedById,
      servicedByName: data.servicedByName,
      dueDate: data.dueDate,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      status: 'PENDING',
    }),
  })
}

/**
 * Create service fee fact from a request
 */
export async function createServiceFeeFact(
  tenantId: string,
  requestId: string,
  citizenId: string | undefined,
  description: string,
  amount: number,
  servicedByName?: string
) {
  return createBillingFact({
    tenantId,
    requestId,
    citizenId,
    factType: 'SERVICE_FEE',
    description,
    unitAmount: amount,
    servicedByName,
    referenceType: 'REQUEST',
    referenceId: requestId,
  })
}

/**
 * Create inspection fee fact
 */
export async function createInspectionFeeFact(
  tenantId: string,
  requestId: string,
  citizenId: string | undefined,
  inspectionId: string,
  amount: number,
  servicedByName?: string
) {
  return createBillingFact({
    tenantId,
    requestId,
    citizenId,
    factType: 'INSPECTION_FEE',
    description: 'Inspection Fee',
    unitAmount: amount,
    servicedByName,
    referenceType: 'INSPECTION',
    referenceId: inspectionId,
  })
}

/**
 * Create penalty fact
 */
export async function createPenaltyFact(
  tenantId: string,
  citizenId: string,
  description: string,
  amount: number,
  dueDate?: Date,
  referenceType?: string,
  referenceId?: string
) {
  return createBillingFact({
    tenantId,
    citizenId,
    factType: 'PENALTY',
    description,
    unitAmount: amount,
    dueDate,
    referenceType,
    referenceId,
  })
}

/**
 * Create late fee fact
 */
export async function createLateFeeFact(
  tenantId: string,
  requestId: string,
  citizenId: string | undefined,
  amount: number,
  originalDueDate: Date
) {
  return createBillingFact({
    tenantId,
    requestId,
    citizenId,
    factType: 'LATE_FEE',
    description: `Late Fee (Original Due: ${originalDueDate.toLocaleDateString()})`,
    unitAmount: amount,
    referenceType: 'REQUEST',
    referenceId: requestId,
  })
}

/**
 * Get billing fact by ID
 */
export async function getBillingFact(tenantId: string, id: string) {
  return prisma.civic_billing_fact.findFirst({
    where: { tenantId, id },
    include: {
      request: true,
      citizen: true,
    },
  })
}

/**
 * Mark fact as billed (called by Commerce when invoice is created)
 */
export async function markAsBilled(
  tenantId: string,
  id: string,
  billingInvoiceId: string
) {
  return prisma.civic_billing_fact.update({
    where: { id },
    data: {
      status: 'BILLED',
      billingInvoiceId,
      billedAt: new Date(),
    },
  })
}

/**
 * Mark multiple facts as billed
 */
export async function markMultipleAsBilled(
  tenantId: string,
  factIds: string[],
  billingInvoiceId: string
) {
  return prisma.civic_billing_fact.updateMany({
    where: {
      tenantId,
      id: { in: factIds },
    },
    data: {
      status: 'BILLED',
      billingInvoiceId,
      billedAt: new Date(),
    },
  })
}

/**
 * Waive a billing fact
 */
export async function waiveBillingFact(
  tenantId: string,
  id: string,
  waivedBy: string,
  waiverReason: string
) {
  return prisma.civic_billing_fact.update({
    where: { id },
    data: {
      status: 'WAIVED',
      waivedAt: new Date(),
      waivedBy,
      waiverReason,
    },
  })
}

/**
 * Cancel a billing fact
 */
export async function cancelBillingFact(tenantId: string, id: string) {
  return prisma.civic_billing_fact.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}

/**
 * List billing facts with filters
 */
export async function listBillingFacts(
  tenantId: string,
  options?: {
    requestId?: string
    citizenId?: string
    factType?: CivicBillingFactType
    status?: CivicBillingFactStatus
    dateFrom?: Date
    dateTo?: Date
    pending?: boolean
    page?: number
    limit?: number
  }
) {
  const {
    requestId,
    citizenId,
    factType,
    status,
    dateFrom,
    dateTo,
    pending,
    page = 1,
    limit = 50,
  } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (requestId) where.requestId = requestId
  if (citizenId) where.citizenId = citizenId
  if (factType) where.factType = factType
  if (status) where.status = status
  if (pending) where.status = 'PENDING'
  
  if (dateFrom || dateTo) {
    where.serviceDate = {}
    if (dateFrom) (where.serviceDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.serviceDate as Record<string, Date>).lte = dateTo
  }

  const [facts, total] = await Promise.all([
    prisma.civic_billing_fact.findMany({
      where,
      skip,
      take: limit,
      include: {
        request: { select: { requestNumber: true, serviceName: true } },
        citizen: { select: { firstName: true, lastName: true } },
      },
      orderBy: { serviceDate: 'desc' },
    }),
    prisma.civic_billing_fact.count({ where }),
  ])

  return { facts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get pending billing facts (for Commerce to bill)
 */
export async function getPendingBillingFacts(
  tenantId: string,
  citizenId?: string,
  requestId?: string
) {
  const where: Record<string, unknown> = { tenantId, status: 'PENDING' }
  if (citizenId) where.citizenId = citizenId
  if (requestId) where.requestId = requestId

  return prisma.civic_billing_fact.findMany({
    where,
    include: {
      request: { select: { requestNumber: true, serviceName: true } },
    },
    orderBy: { serviceDate: 'asc' },
  })
}

/**
 * Get citizen billing summary
 */
export async function getCitizenBillingSummary(tenantId: string, citizenId: string) {
  const facts = await prisma.civic_billing_fact.findMany({
    where: { tenantId, citizenId },
    select: { amount: true, status: true },
  })

  let totalPending = 0
  let totalBilled = 0
  let totalWaived = 0

  for (const fact of facts) {
    const amount = Number(fact.amount)
    switch (fact.status) {
      case 'PENDING':
        totalPending += amount
        break
      case 'BILLED':
        totalBilled += amount
        break
      case 'WAIVED':
        totalWaived += amount
        break
    }
  }

  return {
    totalPending,
    totalBilled,
    totalWaived,
    grandTotal: totalPending + totalBilled,
  }
}

/**
 * Get request billing summary
 */
export async function getRequestBillingSummary(tenantId: string, requestId: string) {
  const facts = await prisma.civic_billing_fact.findMany({
    where: { tenantId, requestId },
  })

  const byType: Record<string, number> = {}
  let totalPending = 0
  let totalBilled = 0

  for (const fact of facts) {
    const amount = Number(fact.amount)
    
    if (!byType[fact.factType]) byType[fact.factType] = 0
    byType[fact.factType] += amount

    if (fact.status === 'PENDING') totalPending += amount
    if (fact.status === 'BILLED') totalBilled += amount
  }

  return {
    facts,
    byType,
    totalPending,
    totalBilled,
    grandTotal: totalPending + totalBilled,
  }
}

/**
 * Generate fees for a request based on service definition
 */
export async function generateRequestFees(
  tenantId: string,
  requestId: string,
  citizenId: string | undefined,
  service: {
    baseFee?: number | null
    processingFee?: number | null
    inspectionFee?: number | null
  }
) {
  const facts = []

  if (service.baseFee && Number(service.baseFee) > 0) {
    facts.push(
      await createBillingFact({
        tenantId,
        requestId,
        citizenId,
        factType: 'SERVICE_FEE',
        description: 'Service Fee',
        unitAmount: Number(service.baseFee),
        referenceType: 'REQUEST',
        referenceId: requestId,
      })
    )
  }

  if (service.processingFee && Number(service.processingFee) > 0) {
    facts.push(
      await createBillingFact({
        tenantId,
        requestId,
        citizenId,
        factType: 'PROCESSING_FEE',
        description: 'Processing Fee',
        unitAmount: Number(service.processingFee),
        referenceType: 'REQUEST',
        referenceId: requestId,
      })
    )
  }

  if (service.inspectionFee && Number(service.inspectionFee) > 0) {
    facts.push(
      await createBillingFact({
        tenantId,
        requestId,
        citizenId,
        factType: 'INSPECTION_FEE',
        description: 'Inspection Fee',
        unitAmount: Number(service.inspectionFee),
        referenceType: 'REQUEST',
        referenceId: requestId,
      })
    )
  }

  return facts
}
