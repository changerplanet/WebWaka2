/**
 * HEALTH SUITE: Billing Fact Service
 * 
 * CRITICAL: Commerce Reuse Boundary
 * 
 * Health emits BILLING FACTS only.
 * Health NEVER:
 * - Calculates totals
 * - Applies VAT (healthcare is VAT-exempt)
 * - Creates invoices
 * - Records payments
 * - Touches accounting journals
 * 
 * Canonical flow:
 * Health [Billing Facts] → Commerce Billing → Payments → Accounting
 * 
 * @module lib/health/billing-fact-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthBillingFactType, HealthBillingFactStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBillingFactInput {
  patientId: string
  visitId?: string
  encounterId?: string
  factType: HealthBillingFactType
  description: string
  code?: string
  amount: number // NGN - Unit amount only
  quantity?: number
  providerId?: string
  providerName?: string
  serviceDate?: Date
}

export interface BillingFactFilters {
  patientId?: string
  visitId?: string
  encounterId?: string
  factType?: HealthBillingFactType
  status?: HealthBillingFactStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// BILLING FACT MANAGEMENT
// ============================================================================

/**
 * Create a billing fact (EMITS to Commerce)
 * 
 * IMPORTANT: This ONLY records the fact that a service was rendered.
 * Commerce Billing Suite will convert this to an invoice.
 */
export async function createBillingFact(
  tenantId: string,
  input: CreateBillingFactInput,
  platformInstanceId?: string
) {
  const billingFact = await prisma.health_billing_fact.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      patientId: input.patientId,
      visitId: input.visitId,
      encounterId: input.encounterId,
      factType: input.factType,
      description: input.description,
      code: input.code,
      amount: new Prisma.Decimal(input.amount),
      quantity: input.quantity || 1,
      providerId: input.providerId,
      providerName: input.providerName,
      serviceDate: input.serviceDate || new Date(),
      status: 'PENDING',
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
    },
  })
  
  return { success: true, billingFact }
}

/**
 * Get billing fact by ID
 */
export async function getBillingFact(tenantId: string, billingFactId: string) {
  return prisma.health_billing_fact.findFirst({
    where: { id: billingFactId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      visit: { select: { id: true, visitNumber: true, visitDate: true } },
      encounter: { select: { id: true, encounterDate: true } },
    },
  })
}

/**
 * List billing facts
 */
export async function listBillingFacts(tenantId: string, filters: BillingFactFilters = {}) {
  const { patientId, visitId, encounterId, factType, status, dateFrom, dateTo, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  if (patientId) where.patientId = patientId
  if (visitId) where.visitId = visitId
  if (encounterId) where.encounterId = encounterId
  if (factType) where.factType = factType
  if (status) where.status = status
  
  if (dateFrom || dateTo) {
    where.serviceDate = {}
    if (dateFrom) (where.serviceDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.serviceDate as Record<string, Date>).lte = dateTo
  }
  
  const [billingFacts, total] = await Promise.all([
    prisma.health_billing_fact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { serviceDate: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      },
    }),
    prisma.health_billing_fact.count({ where }),
  ])
  
  return { billingFacts, total, page, limit }
}

/**
 * Get pending billing facts (not yet sent to Commerce)
 */
export async function getPendingBillingFacts(tenantId: string) {
  return prisma.health_billing_fact.findMany({
    where: {
      tenantId,
      status: 'PENDING',
    },
    orderBy: { serviceDate: 'asc' },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      visit: { select: { id: true, visitNumber: true } },
    },
  })
}

/**
 * Get billing facts for a visit (for patient checkout)
 */
export async function getVisitBillingFacts(tenantId: string, visitId: string) {
  return prisma.health_billing_fact.findMany({
    where: { tenantId, visitId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get billing facts for a patient
 */
export async function getPatientBillingFacts(
  tenantId: string,
  patientId: string,
  options: { status?: HealthBillingFactStatus; page?: number; limit?: number } = {}
) {
  const { status, page = 1, limit = 20 } = options
  
  const where: Record<string, unknown> = { tenantId, patientId }
  if (status) where.status = status
  
  const [billingFacts, total] = await Promise.all([
    prisma.health_billing_fact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { serviceDate: 'desc' },
    }),
    prisma.health_billing_fact.count({ where }),
  ])
  
  return { billingFacts, total, page, limit }
}

// ============================================================================
// COMMERCE INTEGRATION CALLBACKS
// ============================================================================

/**
 * Mark billing fact as billed (called by Commerce Billing)
 * 
 * NOTE: Health does NOT create the invoice.
 * Commerce Billing creates the invoice and calls back with the reference.
 */
export async function markAsBilled(
  tenantId: string,
  billingFactId: string,
  billingInvoiceId: string
) {
  const billingFact = await prisma.health_billing_fact.update({
    where: { id: billingFactId, tenantId },
    data: {
      status: 'BILLED',
      billingInvoiceId,
      billedAt: new Date(),
    },
  })
  
  return { success: true, billingFact }
}

/**
 * Waive a billing fact (provider/admin decision)
 */
export async function waiveBillingFact(
  tenantId: string,
  billingFactId: string,
  waivedBy: string,
  reason: string
) {
  const billingFact = await prisma.health_billing_fact.update({
    where: { id: billingFactId, tenantId },
    data: {
      status: 'WAIVED',
      waivedAt: new Date(),
      waivedBy,
      waiverReason: reason,
    },
  })
  
  return { success: true, billingFact }
}

/**
 * Cancel a billing fact
 */
export async function cancelBillingFact(
  tenantId: string,
  billingFactId: string
) {
  const billingFact = await prisma.health_billing_fact.update({
    where: { id: billingFactId, tenantId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })
  
  return { success: true, billingFact }
}

// ============================================================================
// AUTO-GENERATION HELPERS
// ============================================================================

/**
 * Auto-create consultation fee fact
 */
export async function createConsultationFeeFact(
  tenantId: string,
  patientId: string,
  encounterId: string,
  visitId: string,
  providerId: string,
  providerName: string,
  amount?: number // If not provided, use default from config
) {
  // Get default fee from config if not provided
  let feeAmount = amount
  if (!feeAmount) {
    const config = await prisma.health_config.findUnique({
      where: { tenantId },
    })
    feeAmount = config?.defaultConsultationFee?.toNumber() || 5000
  }
  
  return createBillingFact(tenantId, {
    patientId,
    visitId,
    encounterId,
    factType: 'CONSULTATION',
    description: 'General Consultation',
    amount: feeAmount,
    providerId,
    providerName,
  })
}

/**
 * Auto-create lab test fee fact
 */
export async function createLabTestFeeFact(
  tenantId: string,
  patientId: string,
  encounterId: string,
  visitId: string | undefined,
  testName: string,
  amount: number
) {
  return createBillingFact(tenantId, {
    patientId,
    visitId,
    encounterId,
    factType: 'LAB_TEST',
    description: testName,
    amount,
  })
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get billing fact statistics
 * NOTE: Health only tracks facts, not revenue. Commerce tracks revenue.
 */
export async function getBillingFactStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: Record<string, unknown> = { tenantId }
  
  if (dateFrom || dateTo) {
    where.serviceDate = {}
    if (dateFrom) (where.serviceDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.serviceDate as Record<string, Date>).lte = dateTo
  }
  
  const [
    totalFacts,
    pendingFacts,
    billedFacts,
    waivedFacts,
    // Group by type
    consultations,
    procedures,
    labTests,
  ] = await Promise.all([
    prisma.health_billing_fact.count({ where }),
    prisma.health_billing_fact.count({ where: { ...where, status: 'PENDING' } }),
    prisma.health_billing_fact.count({ where: { ...where, status: 'BILLED' } }),
    prisma.health_billing_fact.count({ where: { ...where, status: 'WAIVED' } }),
    prisma.health_billing_fact.count({ where: { ...where, factType: 'CONSULTATION' } }),
    prisma.health_billing_fact.count({ where: { ...where, factType: 'PROCEDURE' } }),
    prisma.health_billing_fact.count({ where: { ...where, factType: 'LAB_TEST' } }),
  ])
  
  return {
    totalFacts,
    pendingFacts,
    billedFacts,
    waivedFacts,
    byType: {
      consultations,
      procedures,
      labTests,
    },
  }
}
