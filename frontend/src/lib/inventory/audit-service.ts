/**
 * MODULE 1: Inventory & Warehouse Management
 * Inventory Audit Service - Stock count workflows with variance detection
 * 
 * CRITICAL: Adjustments emit events for Core to apply.
 * This service does NOT mutate Core InventoryLevel directly.
 * Full audit trail is maintained for compliance.
 */

import { prisma } from '../prisma';
import { emitInventoryEvent } from './event-emitter';
import { canAuditTransitionTo } from './types';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAuditRequest {
  warehouseId: string;
  auditType?: 'FULL' | 'CYCLE' | 'SPOT' | 'ANNUAL';
  scheduledDate?: Date;
  categoryIds?: string[];
  productIds?: string[];
  binLocations?: string[];
  notes?: string;
  requiresApproval?: boolean;
  varianceThresholdPct?: number;
  varianceThresholdValue?: number;
}

export interface AuditCountInput {
  productId: string;
  variantId?: string;
  binLocation?: string;
  countedQuantity: number;
  batchNumber?: string;
  notes?: string;
}

export interface AuditResponse {
  id: string;
  tenantId: string;
  auditNumber: string;
  warehouseId: string;
  warehouseName: string;
  auditType: string;
  status: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  totalItemsCounted: number;
  itemsWithVariance: number;
  totalVarianceValue?: number;
  variancePercentage?: number;
  currency: string;
  createdByName?: string;
  supervisorName?: string;
  approvedByName?: string;
  notes?: string;
  items: AuditItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditItemResponse {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  binLocation?: string;
  expectedQuantity: number;
  countedQuantity?: number;
  varianceQuantity?: number;
  varianceValue?: number;
  varianceReason?: string;
  countedByName?: string;
  countedAt?: Date;
  recountRequired: boolean;
  adjustmentApproved: boolean;
}

// ============================================================================
// AUDIT NUMBER GENERATOR
// ============================================================================

async function generateAuditNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.inventoryAudit.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `AUD-${year}${month}-${sequence}`;
}

// ============================================================================
// INVENTORY AUDIT SERVICE
// ============================================================================

export class InventoryAuditService {
  /**
   * Create a new inventory audit
   */
  static async create(
    tenantId: string,
    data: CreateAuditRequest,
    userId?: string,
    userName?: string
  ): Promise<AuditResponse> {
    // Validate warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, tenantId, isActive: true },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found or inactive');
    }

    const auditNumber = await generateAuditNumber(tenantId);

    // Get inventory levels to audit
    const inventoryWhere: Record<string, unknown> = {
      tenantId,
      locationId: warehouse.locationId,
    };

    if (data.productIds?.length) {
      inventoryWhere.productId = { in: data.productIds };
    }

    if (data.categoryIds?.length) {
      const products = await prisma.product.findMany({
        where: { tenantId, categoryId: { in: data.categoryIds } },
        select: { id: true },
      });
      inventoryWhere.productId = { in: products.map(p => p.id) };
    }

    const inventoryLevels = await prisma.inventoryLevel.findMany({
      where: inventoryWhere,
      include: {
        product: true,
        variant: true,
      },
    });

    if (inventoryLevels.length === 0) {
      throw new Error('No inventory items found to audit');
    }

    // Filter by bin locations if specified
    let filteredLevels = inventoryLevels;
    if (data.binLocations?.length) {
      filteredLevels = inventoryLevels.filter(
        inv => data.binLocations!.includes(inv.binLocation || '')
      );
    }

    // Create audit with items
    const audit = await prisma.inventoryAudit.create({
      data: {
        tenantId,
        auditNumber,
        warehouseId: data.warehouseId,
        auditType: data.auditType || 'FULL',
        status: 'DRAFT',
        scheduledDate: data.scheduledDate,
        categoryIds: data.categoryIds || [],
        productIds: data.productIds || [],
        binLocations: data.binLocations || [],
        notes: data.notes,
        requiresApproval: data.requiresApproval ?? true,
        varianceThresholdPct: data.varianceThresholdPct,
        varianceThresholdValue: data.varianceThresholdValue,
        createdById: userId,
        createdByName: userName,
        items: {
          create: filteredLevels.map(inv => ({
            productId: inv.productId,
            variantId: inv.variantId,
            productName: inv.product.name,
            variantName: inv.variant?.name,
            sku: inv.variant?.sku || inv.product.sku,
            binLocation: inv.binLocation,
            expectedQuantity: inv.quantityOnHand,
            unitCost: inv.variant?.costPrice || inv.product.costPrice,
          })),
        },
      },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(audit);
  }

  /**
   * Start an audit (transition from DRAFT to IN_PROGRESS)
   */
  static async start(
    tenantId: string,
    auditId: string,
    supervisorId?: string,
    supervisorName?: string
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (!canAuditTransitionTo(audit.status, 'IN_PROGRESS')) {
      throw new Error(`Cannot start audit from status '${audit.status}'`);
    }

    const updated = await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        supervisorId,
        supervisorName,
      },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    // Emit event
    await emitInventoryEvent({
      type: 'INVENTORY_AUDIT_STARTED',
      tenantId,
      payload: {
        auditId: audit.id,
        auditNumber: audit.auditNumber,
        warehouseId: audit.warehouseId,
        itemCount: audit.items.length,
      },
      metadata: { userId: supervisorId, userName: supervisorName },
    });

    return this.toResponse(updated);
  }

  /**
   * Record a count for an audit item
   */
  static async recordCount(
    tenantId: string,
    auditId: string,
    counts: AuditCountInput[],
    userId: string,
    userName: string
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (audit.status !== 'IN_PROGRESS') {
      throw new Error('Audit must be in progress to record counts');
    }

    for (const count of counts) {
      // Find the audit item
      const item = audit.items.find(
        i =>
          i.productId === count.productId &&
          (i.variantId || null) === (count.variantId || null) &&
          (i.binLocation || null) === (count.binLocation || null)
      );

      if (!item) {
        throw new Error(
          `Audit item not found for product ${count.productId}${count.binLocation ? ` at ${count.binLocation}` : ''}`
        );
      }

      // Calculate variance
      const variance = count.countedQuantity - item.expectedQuantity;
      const varianceValue = item.unitCost
        ? variance * Number(item.unitCost)
        : null;

      await prisma.inventoryAuditItem.update({
        where: { id: item.id },
        data: {
          countedQuantity: count.countedQuantity,
          varianceQuantity: variance,
          varianceValue,
          varianceReason: variance !== 0 ? (count.notes || 'UNCATEGORIZED') : null,
          countedById: userId,
          countedByName: userName,
          countedAt: new Date(),
          batchNumber: count.batchNumber,
          notes: count.notes,
          recountRequired: false,
        },
      });
    }

    // Refresh and return
    const updated = await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(updated!);
  }

  /**
   * Request a recount for specific items
   */
  static async requestRecount(
    tenantId: string,
    auditId: string,
    itemIds: string[],
    reason: string
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (audit.status !== 'IN_PROGRESS' && audit.status !== 'PENDING_REVIEW') {
      throw new Error('Audit must be in progress or pending review to request recount');
    }

    await prisma.inventoryAuditItem.updateMany({
      where: {
        id: { in: itemIds },
        auditId,
      },
      data: {
        recountRequired: true,
        notes: reason,
        recountedAt: null,
      },
    });

    // If in PENDING_REVIEW, move back to IN_PROGRESS
    if (audit.status === 'PENDING_REVIEW') {
      await prisma.inventoryAudit.update({
        where: { id: auditId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    const updated = await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(updated!);
  }

  /**
   * Submit audit for review (transition to PENDING_REVIEW)
   */
  static async submitForReview(
    tenantId: string,
    auditId: string
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (!canAuditTransitionTo(audit.status, 'PENDING_REVIEW')) {
      throw new Error(`Cannot submit audit from status '${audit.status}'`);
    }

    // Check all items are counted
    const uncountedItems = audit.items.filter(i => i.countedQuantity === null);
    if (uncountedItems.length > 0) {
      throw new Error(
        `${uncountedItems.length} items have not been counted yet`
      );
    }

    // Check no recounts pending
    const recountRequired = audit.items.filter(i => i.recountRequired);
    if (recountRequired.length > 0) {
      throw new Error(
        `${recountRequired.length} items require recount before submitting`
      );
    }

    // Calculate summary statistics
    const itemsWithVariance = audit.items.filter(
      i => i.varianceQuantity !== null && i.varianceQuantity !== 0
    );
    const totalVarianceValue = itemsWithVariance.reduce(
      (sum, i) => sum + Math.abs(Number(i.varianceValue || 0)),
      0
    );
    const totalExpectedValue = audit.items.reduce(
      (sum, i) => sum + i.expectedQuantity * Number(i.unitCost || 0),
      0
    );
    const variancePercentage =
      totalExpectedValue > 0
        ? (totalVarianceValue / totalExpectedValue) * 100
        : 0;

    const updated = await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'PENDING_REVIEW',
        completedAt: new Date(),
        totalItemsCounted: audit.items.length,
        itemsWithVariance: itemsWithVariance.length,
        totalVarianceValue,
        variancePercentage,
      },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(updated);
  }

  /**
   * Approve audit and apply adjustments
   */
  static async approve(
    tenantId: string,
    auditId: string,
    userId: string,
    userName: string,
    approveItems?: string[] // Optional: specific items to approve (null = all)
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (!canAuditTransitionTo(audit.status, 'APPROVED')) {
      throw new Error(`Cannot approve audit from status '${audit.status}'`);
    }

    // Get items to approve
    const itemsToApprove = approveItems
      ? audit.items.filter(i => approveItems.includes(i.id))
      : audit.items.filter(i => i.varianceQuantity !== null && i.varianceQuantity !== 0);

    // Mark items as approved
    await prisma.inventoryAuditItem.updateMany({
      where: {
        id: { in: itemsToApprove.map(i => i.id) },
      },
      data: {
        adjustmentApproved: true,
        adjustmentApprovedById: userId,
        adjustmentApprovedAt: new Date(),
      },
    });

    // Update audit status
    const updated = await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        approvedByName: userName,
      },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    // Build adjustment deltas for Core
    const inventoryDeltas = itemsToApprove
      .filter(i => i.varianceQuantity !== null && i.varianceQuantity !== 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        locationId: updated.warehouse.locationId,
        delta: i.varianceQuantity!,
        reason: 'AUDIT_CORRECTION' as const,
      }));

    // Emit adjustment event for Core to process
    if (inventoryDeltas.length > 0) {
      const eventId = await emitInventoryEvent({
        type: 'INVENTORY_ADJUSTMENT_APPROVED',
        tenantId,
        payload: {
          auditId: audit.id,
          approvedById: userId,
          approvedByName: userName,
          inventoryDeltas,
        },
        metadata: { userId, userName },
      });

      // Update audit with event ID
      await prisma.inventoryAudit.update({
        where: { id: auditId },
        data: {
          adjustmentEventId: eventId,
          status: 'ADJUSTMENTS_PENDING',
        },
      });

      // Record stock movements for audit trail
      for (const item of itemsToApprove.filter(i => i.varianceQuantity)) {
        await prisma.wh_stock_movement.create({
          data: {
            tenantId,
            productId: item.productId,
            variantId: item.variantId,
            locationId: updated.warehouse.locationId,
            reason: item.varianceQuantity! > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE',
            quantity: item.varianceQuantity!,
            quantityBefore: item.expectedQuantity,
            referenceType: 'AUDIT',
            referenceId: auditId,
            batchNumber: item.batchNumber,
            eventId,
            eventEmittedAt: new Date(),
            eventProcessed: true,
            performedBy: userId,
            performedByName: userName,
          },
        });
      }
    }

    // Emit completion event
    await emitInventoryEvent({
      type: 'INVENTORY_AUDIT_COMPLETED',
      tenantId,
      payload: {
        auditId: audit.id,
        auditNumber: audit.auditNumber,
        warehouseId: audit.warehouseId,
        itemsCounted: audit.items.length,
        itemsWithVariance: itemsToApprove.length,
        totalVarianceValue: Number(audit.totalVarianceValue || 0),
        adjustmentsApplied: inventoryDeltas.length,
      },
      metadata: { userId, userName },
    });

    // Mark as completed
    await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: { status: 'COMPLETED' },
    });

    // Refresh and return
    const final = await prisma.inventoryAudit.findUnique({
      where: { id: auditId },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(final!);
  }

  /**
   * Cancel an audit
   */
  static async cancel(
    tenantId: string,
    auditId: string,
    reason: string
  ): Promise<AuditResponse> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    if (!canAuditTransitionTo(audit.status, 'CANCELLED')) {
      throw new Error(`Cannot cancel audit from status '${audit.status}'`);
    }

    const updated = await prisma.inventoryAudit.update({
      where: { id: auditId },
      data: {
        status: 'CANCELLED',
        internalNotes: `Cancelled: ${reason}`,
      },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return this.toResponse(updated);
  }

  /**
   * List audits with filters
   */
  static async list(
    tenantId: string,
    options?: {
      status?: string | string[];
      warehouseId?: string;
      auditType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ audits: AuditResponse[]; total: number }> {
    const where: Record<string, unknown> = { tenantId };

    if (options?.status) {
      where.status = Array.isArray(options.status)
        ? { in: options.status }
        : options.status;
    }
    if (options?.warehouseId) {
      where.warehouseId = options.warehouseId;
    }
    if (options?.auditType) {
      where.auditType = options.auditType;
    }

    const [audits, total] = await Promise.all([
      prisma.inventoryAudit.findMany({
        where,
        include: {
          items: true,
          wh_warehouses: true,
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.inventoryAudit.count({ where }),
    ]);

    return {
      audits: audits.map(a => this.toResponse(a)),
      total,
    };
  }

  /**
   * Get a single audit by ID
   */
  static async getById(
    tenantId: string,
    auditId: string
  ): Promise<AuditResponse | null> {
    const audit = await prisma.inventoryAudit.findFirst({
      where: { id: auditId, tenantId },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    return audit ? this.toResponse(audit) : null;
  }

  /**
   * Get variance summary for an audit
   */
  static async getVarianceSummary(
    tenantId: string,
    auditId: string
  ): Promise<{
    totalItems: number;
    itemsCounted: number;
    itemsWithVariance: number;
    itemsWithPositiveVariance: number;
    itemsWithNegativeVariance: number;
    totalPositiveVariance: number;
    totalNegativeVariance: number;
    netVariance: number;
    totalVarianceValue: number;
    byReason: Record<string, { count: number; value: number }>;
  }> {
    const audit = await this.getAuditOrThrow(tenantId, auditId);

    const counted = audit.items.filter(i => i.countedQuantity !== null);
    const withVariance = counted.filter(
      i => i.varianceQuantity !== null && i.varianceQuantity !== 0
    );
    const positive = withVariance.filter(i => i.varianceQuantity! > 0);
    const negative = withVariance.filter(i => i.varianceQuantity! < 0);

    const byReason: Record<string, { count: number; value: number }> = {};
    for (const item of withVariance) {
      const reason = item.varianceReason || 'UNCATEGORIZED';
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, value: 0 };
      }
      byReason[reason].count++;
      byReason[reason].value += Math.abs(Number(item.varianceValue || 0));
    }

    return {
      totalItems: audit.items.length,
      itemsCounted: counted.length,
      itemsWithVariance: withVariance.length,
      itemsWithPositiveVariance: positive.length,
      itemsWithNegativeVariance: negative.length,
      totalPositiveVariance: positive.reduce(
        (sum, i) => sum + i.varianceQuantity!,
        0
      ),
      totalNegativeVariance: Math.abs(
        negative.reduce((sum, i) => sum + i.varianceQuantity!, 0)
      ),
      netVariance: withVariance.reduce(
        (sum, i) => sum + i.varianceQuantity!,
        0
      ),
      totalVarianceValue: withVariance.reduce(
        (sum, i) => sum + Math.abs(Number(i.varianceValue || 0)),
        0
      ),
      byReason,
    };
  }

  /**
   * Get audit history for a product
   */
  static async getProductAuditHistory(
    tenantId: string,
    productId: string,
    variantId?: string,
    limit: number = 10
  ): Promise<Array<{
    auditId: string;
    auditNumber: string;
    auditDate: Date;
    expectedQuantity: number;
    countedQuantity: number;
    variance: number;
    varianceReason?: string;
    warehouseName: string;
  }>> {
    const items = await prisma.inventoryAuditItem.findMany({
      where: {
        productId,
        variantId: variantId || null,
        audit: {
          tenantId,
          status: 'COMPLETED',
        },
        countedQuantity: { not: null },
      },
      include: {
        inv_audits: {
          include: { wh_warehouses: true },
        },
      },
      orderBy: { audit: { completedAt: 'desc' } },
      take: limit,
    });

    return items.map(item => ({
      auditId: item.auditId,
      auditNumber: item.audit.auditNumber,
      auditDate: item.audit.completedAt!,
      expectedQuantity: item.expectedQuantity,
      countedQuantity: item.countedQuantity!,
      variance: item.varianceQuantity || 0,
      varianceReason: item.varianceReason || undefined,
      warehouseName: item.audit.warehouse.name,
    }));
  }

  /**
   * Get audit or throw
   */
  private static async getAuditOrThrow(tenantId: string, auditId: string) {
    const audit = await prisma.inventoryAudit.findFirst({
      where: { id: auditId, tenantId },
      include: {
        items: true,
        wh_warehouses: true,
      },
    });

    if (!audit) {
      throw new Error('Audit not found');
    }

    return audit;
  }

  /**
   * Convert to API response
   */
  private static toResponse(audit: {
    id: string;
    tenantId: string;
    auditNumber: string;
    warehouseId: string;
    auditType: string;
    status: string;
    scheduledDate: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    approvedAt: Date | null;
    totalItemsCounted: number;
    itemsWithVariance: number;
    totalVarianceValue: Decimal | null;
    variancePercentage: Decimal | null;
    currency: string;
    createdByName: string | null;
    supervisorName: string | null;
    approvedByName: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    warehouse: { name: string };
    items: Array<{
      id: string;
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string | null;
      binLocation: string | null;
      expectedQuantity: number;
      countedQuantity: number | null;
      varianceQuantity: number | null;
      varianceValue: Decimal | null;
      varianceReason: string | null;
      countedByName: string | null;
      countedAt: Date | null;
      recountRequired: boolean;
      adjustmentApproved: boolean;
    }>;
  }): AuditResponse {
    return {
      id: audit.id,
      tenantId: audit.tenantId,
      auditNumber: audit.auditNumber,
      warehouseId: audit.warehouseId,
      warehouseName: audit.warehouse.name,
      auditType: audit.auditType,
      status: audit.status,
      scheduledDate: audit.scheduledDate || undefined,
      startedAt: audit.startedAt || undefined,
      completedAt: audit.completedAt || undefined,
      approvedAt: audit.approvedAt || undefined,
      totalItemsCounted: audit.totalItemsCounted,
      itemsWithVariance: audit.itemsWithVariance,
      totalVarianceValue: audit.totalVarianceValue
        ? Number(audit.totalVarianceValue)
        : undefined,
      variancePercentage: audit.variancePercentage
        ? Number(audit.variancePercentage)
        : undefined,
      currency: audit.currency,
      createdByName: audit.createdByName || undefined,
      supervisorName: audit.supervisorName || undefined,
      approvedByName: audit.approvedByName || undefined,
      notes: audit.notes || undefined,
      items: audit.items.map(i => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId || undefined,
        productName: i.productName,
        variantName: i.variantName || undefined,
        sku: i.sku || undefined,
        binLocation: i.binLocation || undefined,
        expectedQuantity: i.expectedQuantity,
        countedQuantity: i.countedQuantity ?? undefined,
        varianceQuantity: i.varianceQuantity ?? undefined,
        varianceValue: i.varianceValue ? Number(i.varianceValue) : undefined,
        varianceReason: i.varianceReason || undefined,
        countedByName: i.countedByName || undefined,
        countedAt: i.countedAt || undefined,
        recountRequired: i.recountRequired,
        adjustmentApproved: i.adjustmentApproved,
      })),
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    };
  }
}
