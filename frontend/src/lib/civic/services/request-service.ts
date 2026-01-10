/**
 * CIVIC SUITE: Request Service
 * 
 * Manages citizen service requests and case creation.
 * 
 * @module lib/civic/services/request-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { CivicRequestStatus, Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'

// Helper to convert Record to Prisma Json type
type JsonInput = Prisma.InputJsonValue | undefined

// ============================================================================
// REQUEST MANAGEMENT
// ============================================================================

/**
 * Generate unique request number
 */
export async function generateRequestNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.civic_request.count({ where: { tenantId } })
  const number = String(count + 1).padStart(5, '0')
  return `REQ-${year}-${number}`
}

/**
 * Generate tracking code for public status checks
 */
export function generateTrackingCode(): string {
  return randomBytes(6).toString('hex').toUpperCase()
}

/**
 * Create a new service request
 */
export async function createRequest(data: {
  tenantId: string
  citizenId?: string
  organizationId?: string
  applicantName: string
  applicantPhone?: string
  applicantEmail?: string
  serviceId: string
  serviceName: string
  subject?: string
  description?: string
  location?: Record<string, unknown>
  submittedDocuments?: string[]
}) {
  const requestNumber = await generateRequestNumber(data.tenantId)
  const trackingCode = generateTrackingCode()
  
  return prisma.civic_request.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      requestNumber,
      trackingCode,
      citizenId: data.citizenId,
      organizationId: data.organizationId,
      applicantName: data.applicantName,
      applicantPhone: data.applicantPhone,
      applicantEmail: data.applicantEmail,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      subject: data.subject,
      description: data.description,
      location: data.location as JsonInput,
      submittedDocuments: data.submittedDocuments as JsonInput,
      status: 'DRAFT',
    }),
  })
}

/**
 * Get request by ID
 */
export async function getRequest(tenantId: string, id: string) {
  return prisma.civic_request.findFirst({
    where: { tenantId, id },
    include: {
      citizen: true,
      organization: true,
      service: true,
      cases: {
        include: {
          assignments: { include: { staff: true } },
        },
      },
      billingFacts: true,
    },
  })
}

/**
 * Get request by request number
 */
export async function getRequestByNumber(tenantId: string, requestNumber: string) {
  return prisma.civic_request.findFirst({
    where: { tenantId, requestNumber },
    include: {
      service: true,
      cases: true,
    },
  })
}

/**
 * Get request by tracking code (for public status)
 */
export async function getRequestByTrackingCode(trackingCode: string) {
  return prisma.civic_request.findFirst({
    where: { trackingCode },
    select: {
      requestNumber: true,
      serviceName: true,
      applicantName: true,
      status: true,
      submittedAt: true,
      acknowledgedAt: true,
      outcomeDate: true,
      outcomeNote: true,
      validUntil: true,
      isPaid: true,
    },
  })
}

/**
 * Submit request (change from DRAFT to SUBMITTED)
 */
export async function submitRequest(tenantId: string, id: string) {
  return prisma.civic_request.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })
}

/**
 * Acknowledge request
 */
export async function acknowledgeRequest(tenantId: string, id: string) {
  return prisma.civic_request.update({
    where: { id },
    data: {
      status: 'UNDER_REVIEW',
      acknowledgedAt: new Date(),
    },
  })
}

/**
 * Update request status
 */
export async function updateRequestStatus(
  tenantId: string,
  id: string,
  status: CivicRequestStatus,
  outcomeNote?: string
) {
  const data: Record<string, unknown> = { status }
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    data.outcomeDate = new Date()
    if (outcomeNote) data.outcomeNote = outcomeNote
  }

  return prisma.civic_request.update({
    where: { id },
    data,
  })
}

/**
 * Mark request as paid
 */
export async function markRequestPaid(
  tenantId: string,
  id: string,
  paymentRef: string,
  totalAmount: number
) {
  return prisma.civic_request.update({
    where: { id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      paymentRef,
      totalAmount,
    },
  })
}

/**
 * Set request validity/expiry
 */
export async function setRequestValidity(
  tenantId: string,
  id: string,
  validUntil: Date,
  certificateId?: string
) {
  return prisma.civic_request.update({
    where: { id },
    data: {
      validUntil,
      certificateId,
    },
  })
}

/**
 * List requests with filters
 */
export async function listRequests(
  tenantId: string,
  options?: {
    citizenId?: string
    organizationId?: string
    serviceId?: string
    status?: CivicRequestStatus
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }
) {
  const {
    citizenId,
    organizationId,
    serviceId,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = options || {}
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId }
  if (citizenId) where.citizenId = citizenId
  if (organizationId) where.organizationId = organizationId
  if (serviceId) where.serviceId = serviceId
  if (status) where.status = status
  
  if (dateFrom || dateTo) {
    where.submittedAt = {}
    if (dateFrom) (where.submittedAt as Record<string, Date>).gte = dateFrom
    if (dateTo) (where.submittedAt as Record<string, Date>).lte = dateTo
  }

  const [requests, total] = await Promise.all([
    prisma.civic_request.findMany({
      where,
      skip,
      take: limit,
      include: {
        service: true,
        citizen: { select: { firstName: true, lastName: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.civic_request.count({ where }),
  ])

  return { requests, total, page, limit, totalPages: Math.ceil(total / limit) }
}

/**
 * Get requests pending action
 */
export async function getPendingRequests(tenantId: string) {
  return prisma.civic_request.findMany({
    where: {
      tenantId,
      status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS', 'PENDING_INSPECTION'] },
    },
    include: {
      service: true,
      cases: { select: { id: true, status: true } },
    },
    orderBy: { submittedAt: 'asc' },
  })
}

/**
 * Get requests awaiting payment
 */
export async function getRequestsAwaitingPayment(tenantId: string) {
  return prisma.civic_request.findMany({
    where: {
      tenantId,
      status: 'PENDING_PAYMENT',
      isPaid: false,
    },
    orderBy: { submittedAt: 'asc' },
  })
}

/**
 * Get expiring permits/certificates
 */
export async function getExpiringRequests(tenantId: string, daysAhead: number = 30) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + daysAhead)
  
  return prisma.civic_request.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      validUntil: {
        lte: expiryDate,
        gte: new Date(),
      },
    },
    include: {
      service: true,
      citizen: { select: { firstName: true, lastName: true, phone: true } },
    },
    orderBy: { validUntil: 'asc' },
  })
}
