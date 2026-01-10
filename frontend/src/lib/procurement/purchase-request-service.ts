/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Request Service - PR creation and approval workflow
 * 
 * PHASE 2: Purchase Requests & Approvals
 * 
 * Features:
 * - Manual purchase requests
 * - Request approval workflow
 * - Budget-aware approvals (advisory only)
 * 
 * Nigeria-first:
 * - Informal approval processes
 * - Simple approval chains
 */

import { prisma } from '@/lib/prisma'
import { ProcPurchaseRequestStatus, ProcPriority, Prisma } from '@prisma/client'
import { ProcConfigurationService } from './config-service'
import { ProcEventService } from './event-service'

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseRequestInput {
  priority?: ProcPriority
  requestedBy: string
  department?: string
  locationId?: string
  preferredSupplierId?: string
  title: string
  description?: string
  justification?: string
  estimatedTotal?: number
  budgetCode?: string
  neededByDate?: Date
  notes?: string
  items: PurchaseRequestItemInput[]
  offlineId?: string
}

export interface PurchaseRequestItemInput {
  productId: string
  productSku?: string
  productName: string
  quantity: number
  unit?: string
  estimatedUnitPrice?: number
  specifications?: string
  notes?: string
}

export interface PurchaseRequestFilters {
  status?: ProcPurchaseRequestStatus[]
  priority?: ProcPriority[]
  requestedBy?: string
  preferredSupplierId?: string
  fromDate?: Date
  toDate?: Date
  search?: string
}

export interface PurchaseRequestListOptions {
  filters?: PurchaseRequestFilters
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'neededByDate' | 'estimatedTotal'
  orderDir?: 'asc' | 'desc'
}

// ============================================================================
// SERVICE
// ============================================================================

export class PurchaseRequestService {
  /**
   * Create a new purchase request
   */
  static async createPurchaseRequest(
    tenantId: string,
    input: PurchaseRequestInput
  ) {
    // Check for duplicate offline ID
    if (input.offlineId) {
      const existing = await prisma.proc_purchase_requests.findUnique({
        where: { tenantId_offlineId: { tenantId, offlineId: input.offlineId } },
      })
      if (existing) {
        return existing
      }
    }

    // Get next PR number
    const requestNumber = await ProcConfigurationService.getNextPRNumber(tenantId)

    // Calculate estimated total if not provided
    let estimatedTotal = input.estimatedTotal
    if (!estimatedTotal && input.items.length > 0) {
      estimatedTotal = input.items.reduce((sum, item) => {
        return sum + (item.estimatedUnitPrice || 0) * item.quantity
      }, 0)
    }

    // Create PR with items
    const pr = await prisma.proc_purchase_requests.create({
      data: {
        tenantId,
        requestNumber,
        status: 'DRAFT',
        priority: input.priority || 'NORMAL',
        requestedBy: input.requestedBy,
        department: input.department,
        locationId: input.locationId,
        preferredSupplierId: input.preferredSupplierId,
        title: input.title,
        description: input.description,
        justification: input.justification,
        estimatedTotal,
        budgetCode: input.budgetCode,
        neededByDate: input.neededByDate,
        notes: input.notes,
        offlineId: input.offlineId,
        items: {
          create: input.items.map((item, index) => ({
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit || 'UNIT',
            estimatedUnitPrice: item.estimatedUnitPrice,
            estimatedTotal: item.estimatedUnitPrice ? item.estimatedUnitPrice * item.quantity : null,
            specifications: item.specifications,
            notes: item.notes,
            lineNumber: index + 1,
          })),
        },
      },
      include: { items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_REQUEST_CREATED',
      entityType: 'PURCHASE_REQUEST',
      entityId: pr.id,
      actorId: input.requestedBy,
      data: { requestNumber: pr.requestNumber, title: pr.title },
    })

    return pr
  }

  /**
   * List purchase requests with filters
   */
  static async listPurchaseRequests(
    tenantId: string,
    options: PurchaseRequestListOptions = {}
  ) {
    const { filters = {}, page = 1, limit = 20, orderBy = 'createdAt', orderDir = 'desc' } = options

    const where: Prisma.ProcPurchaseRequestWhereInput = {
      tenantId,
      ...(filters.status && { status: { in: filters.status } }),
      ...(filters.priority && { priority: { in: filters.priority } }),
      ...(filters.requestedBy && { requestedBy: filters.requestedBy }),
      ...(filters.preferredSupplierId && { preferredSupplierId: filters.preferredSupplierId }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      ...(filters.search && {
        OR: [
          { requestNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { title: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [requests, total] = await Promise.all([
      prisma.proc_purchase_requests.findMany({
        where,
        include: { items: { orderBy: { lineNumber: 'asc' } } },
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proc_purchase_requests.count({ where }),
    ])

    return {
      requests: requests.map(r => this.formatPurchaseRequest(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get purchase request by ID
   */
  static async getPurchaseRequestById(tenantId: string, id: string) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
      include: { items: { orderBy: { lineNumber: 'asc' } } },
    })

    return pr ? this.formatPurchaseRequest(pr) : null
  }

  /**
   * Submit purchase request for approval
   */
  static async submitPurchaseRequest(tenantId: string, id: string, submittedBy: string) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
    })

    if (!pr) throw new Error('Purchase request not found')
    if (pr.status !== 'DRAFT') throw new Error('Only draft requests can be submitted')

    // Check if auto-approve based on threshold
    const config = await ProcConfigurationService.getConfig(tenantId)
    let newStatus: ProcPurchaseRequestStatus = 'SUBMITTED'
    let approvedBy: string | null = null
    let approvedAt: Date | null = null

    if (config && !config.requireApprovalForPR) {
      newStatus = 'APPROVED'
      approvedBy = 'SYSTEM'
      approvedAt = new Date()
    } else if (
      config?.approvalThresholdAmount &&
      pr.estimatedTotal &&
      Number(pr.estimatedTotal) <= config.approvalThresholdAmount
    ) {
      newStatus = 'APPROVED'
      approvedBy = 'SYSTEM'
      approvedAt = new Date()
    }

    const updated = await prisma.proc_purchase_requests.update({
      where: { id },
      data: {
        status: newStatus,
        ...(approvedBy && { approvedBy, approvedAt }),
      },
      include: { items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: newStatus === 'APPROVED' ? 'PURCHASE_REQUEST_APPROVED' : 'PURCHASE_REQUEST_SUBMITTED',
      entityType: 'PURCHASE_REQUEST',
      entityId: id,
      actorId: submittedBy,
      data: { requestNumber: pr.requestNumber, autoApproved: approvedBy === 'SYSTEM' },
    })

    return this.formatPurchaseRequest(updated)
  }

  /**
   * Approve purchase request
   */
  static async approvePurchaseRequest(
    tenantId: string,
    id: string,
    approvedBy: string,
    notes?: string
  ) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
    })

    if (!pr) throw new Error('Purchase request not found')
    if (pr.status !== 'SUBMITTED') throw new Error('Only submitted requests can be approved')

    const updated = await prisma.proc_purchase_requests.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        ...(notes && { notes: pr.notes ? `${pr.notes}\n\nApproval Notes: ${notes}` : `Approval Notes: ${notes}` }),
      },
      include: { items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_REQUEST_APPROVED',
      entityType: 'PURCHASE_REQUEST',
      entityId: id,
      actorId: approvedBy,
      data: { requestNumber: pr.requestNumber },
    })

    return this.formatPurchaseRequest(updated)
  }

  /**
   * Reject purchase request
   */
  static async rejectPurchaseRequest(
    tenantId: string,
    id: string,
    rejectedBy: string,
    reason: string
  ) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
    })

    if (!pr) throw new Error('Purchase request not found')
    if (pr.status !== 'SUBMITTED') throw new Error('Only submitted requests can be rejected')

    const updated = await prisma.proc_purchase_requests.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: { items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_REQUEST_REJECTED',
      entityType: 'PURCHASE_REQUEST',
      entityId: id,
      actorId: rejectedBy,
      data: { requestNumber: pr.requestNumber, reason },
    })

    return this.formatPurchaseRequest(updated)
  }

  /**
   * Cancel purchase request
   */
  static async cancelPurchaseRequest(tenantId: string, id: string, cancelledBy: string) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
    })

    if (!pr) throw new Error('Purchase request not found')
    if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(pr.status)) {
      throw new Error('Request cannot be cancelled in current status')
    }

    const updated = await prisma.proc_purchase_requests.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_REQUEST_CANCELLED',
      entityType: 'PURCHASE_REQUEST',
      entityId: id,
      actorId: cancelledBy,
      data: { requestNumber: pr.requestNumber },
    })

    return this.formatPurchaseRequest(updated)
  }

  /**
   * Update purchase request (only drafts)
   */
  static async updatePurchaseRequest(
    tenantId: string,
    id: string,
    input: Partial<PurchaseRequestInput>
  ) {
    const pr = await prisma.proc_purchase_requests.findFirst({
      where: { id, tenantId },
    })

    if (!pr) throw new Error('Purchase request not found')
    if (pr.status !== 'DRAFT') throw new Error('Only draft requests can be updated')

    // If items are provided, delete and recreate
    if (input.items) {
      await prisma.proc_purchase_request_items.deleteMany({
        where: { purchaseRequestId: id },
      })
    }

    const updated = await prisma.proc_purchase_requests.update({
      where: { id },
      data: {
        ...(input.priority && { priority: input.priority }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.locationId !== undefined && { locationId: input.locationId }),
        ...(input.preferredSupplierId !== undefined && { preferredSupplierId: input.preferredSupplierId }),
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.justification !== undefined && { justification: input.justification }),
        ...(input.estimatedTotal !== undefined && { estimatedTotal: input.estimatedTotal }),
        ...(input.budgetCode !== undefined && { budgetCode: input.budgetCode }),
        ...(input.neededByDate !== undefined && { neededByDate: input.neededByDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.items && {
          items: {
            create: input.items.map((item, index) => ({
              productId: item.productId,
              productSku: item.productSku,
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit || 'UNIT',
              estimatedUnitPrice: item.estimatedUnitPrice,
              estimatedTotal: item.estimatedUnitPrice ? item.estimatedUnitPrice * item.quantity : null,
              specifications: item.specifications,
              notes: item.notes,
              lineNumber: index + 1,
            })),
          },
        }),
      },
      include: { items: { orderBy: { lineNumber: 'asc' } } },
    })

    return this.formatPurchaseRequest(updated)
  }

  /**
   * Get PR statistics
   */
  static async getStatistics(tenantId: string) {
    const [statusCounts, priorityCounts, totalValue] = await Promise.all([
      prisma.proc_purchase_requests.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.proc_purchase_requests.groupBy({
        by: ['priority'],
        where: { tenantId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } },
        _count: true,
      }),
      prisma.proc_purchase_requests.aggregate({
        where: { tenantId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } },
        _sum: { estimatedTotal: true },
      }),
    ])

    return {
      byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
      byPriority: Object.fromEntries(priorityCounts.map(p => [p.priority, p._count])),
      totalPendingValue: totalValue._sum.estimatedTotal?.toNumber() || 0,
    }
  }

  /**
   * Format purchase request for output
   */
  private static formatPurchaseRequest(pr: {
    id: string
    tenantId: string
    requestNumber: string
    status: ProcPurchaseRequestStatus
    priority: ProcPriority
    requestedBy: string
    requestedAt: Date
    department: string | null
    locationId: string | null
    preferredSupplierId: string | null
    title: string
    description: string | null
    justification: string | null
    estimatedTotal: { toNumber(): number } | null
    budgetCode: string | null
    neededByDate: Date | null
    approvedBy: string | null
    approvedAt: Date | null
    rejectedBy: string | null
    rejectedAt: Date | null
    rejectionReason: string | null
    convertedToPOId: string | null
    convertedAt: Date | null
    offlineId: string | null
    notes: string | null
    metadata: unknown
    createdAt: Date
    updatedAt: Date
    items?: Array<{
      id: string
      productId: string
      productSku: string | null
      productName: string
      quantity: { toNumber(): number }
      unit: string
      estimatedUnitPrice: { toNumber(): number } | null
      estimatedTotal: { toNumber(): number } | null
      specifications: string | null
      notes: string | null
      lineNumber: number
    }>
  }) {
    return {
      id: pr.id,
      tenantId: pr.tenantId,
      requestNumber: pr.requestNumber,
      status: pr.status,
      priority: pr.priority,
      requestedBy: pr.requestedBy,
      requestedAt: pr.requestedAt,
      department: pr.department,
      locationId: pr.locationId,
      preferredSupplierId: pr.preferredSupplierId,
      title: pr.title,
      description: pr.description,
      justification: pr.justification,
      estimatedTotal: pr.estimatedTotal?.toNumber() ?? null,
      budgetCode: pr.budgetCode,
      neededByDate: pr.neededByDate,
      approvedBy: pr.approvedBy,
      approvedAt: pr.approvedAt,
      rejectedBy: pr.rejectedBy,
      rejectedAt: pr.rejectedAt,
      rejectionReason: pr.rejectionReason,
      convertedToPOId: pr.convertedToPOId,
      convertedAt: pr.convertedAt,
      offlineId: pr.offlineId,
      notes: pr.notes,
      metadata: pr.metadata,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      items: pr.items?.map(item => ({
        id: item.id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        estimatedUnitPrice: item.estimatedUnitPrice?.toNumber() ?? null,
        estimatedTotal: item.estimatedTotal?.toNumber() ?? null,
        specifications: item.specifications,
        notes: item.notes,
        lineNumber: item.lineNumber,
      })),
    }
  }
}
