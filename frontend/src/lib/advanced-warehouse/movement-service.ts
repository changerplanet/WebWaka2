/**
 * ADVANCED WAREHOUSE SUITE — Stock Movement Service
 * Phase 7C.3, S3 Core Services
 * 
 * Records and tracks all stock movements for audit trail.
 * Comprehensive movement log for traceability and reporting.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_stock_movement, wh_MovementType } from '@prisma/client';
import type {
  TenantContext,
  RecordMovementInput,
  MovementFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// MOVEMENT NUMBER GENERATOR
// =============================================================================

async function generateMovementNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  
  const count = await prisma.wh_stock_movement.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-${day}`),
      },
    },
  });

  return `MOV-${year}${month}${day}-${String(count + 1).padStart(6, '0')}`;
}

// =============================================================================
// MOVEMENT SERVICE
// =============================================================================

export class MovementService {
  /**
   * Record a stock movement
   */
  static async record(
    ctx: TenantContext,
    input: RecordMovementInput
  ): Promise<wh_stock_movement> {
    const movementNumber = await generateMovementNumber(ctx.tenantId);

    // Calculate total cost if unit cost provided
    const totalCost = input.unitCost 
      ? input.unitCost * Math.abs(input.quantity)
      : undefined;

    return prisma.wh_stock_movement.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        movementNumber,
        movementType: input.movementType,
        productId: input.productId,
        variantId: input.variantId,
        productName: input.productName,
        sku: input.sku,
        batchId: input.batchId,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        quantity: input.quantity,
        beforeQuantity: input.beforeQuantity,
        afterQuantity: input.afterQuantity,
        fromZoneId: input.fromZoneId,
        fromBinId: input.fromBinId,
        fromBinCode: input.fromBinCode,
        toZoneId: input.toZoneId,
        toBinId: input.toBinId,
        toBinCode: input.toBinCode,
        unitCost: input.unitCost,
        totalCost,
        currency: 'NGN',
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        referenceNumber: input.referenceNumber,
        reasonCode: input.reasonCode,
        reasonDescription: input.reasonDescription,
        performedById: input.performedById || ctx.userId,
        performedByName: input.performedByName || ctx.userName,
        performedAt: new Date(),
        notes: input.notes,
      }),
    });
  }

  /**
   * Record receipt movement
   */
  static async recordReceipt(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    toBinId: string,
    toBinCode: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      expiryDate?: Date;
      unitCost?: number;
      receiptId?: string;
      receiptNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'RECEIPT',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      expiryDate: options?.expiryDate,
      quantity: Math.abs(quantity), // Always positive for receipt
      toBinId,
      toBinCode,
      unitCost: options?.unitCost,
      referenceType: 'RECEIPT',
      referenceId: options?.receiptId,
      referenceNumber: options?.receiptNumber,
    });
  }

  /**
   * Record putaway movement
   */
  static async recordPutaway(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    toBinId: string,
    toBinCode: string,
    toZoneId: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      putawayTaskId?: string;
      putawayTaskNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'PUTAWAY',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: Math.abs(quantity),
      toZoneId,
      toBinId,
      toBinCode,
      referenceType: 'PUTAWAY',
      referenceId: options?.putawayTaskId,
      referenceNumber: options?.putawayTaskNumber,
    });
  }

  /**
   * Record pick movement
   */
  static async recordPick(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    fromBinId: string,
    fromBinCode: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      pickListId?: string;
      pickListNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'PICK',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: -Math.abs(quantity), // Negative for pick (stock leaves)
      fromBinId,
      fromBinCode,
      referenceType: 'PICK_LIST',
      referenceId: options?.pickListId,
      referenceNumber: options?.pickListNumber,
    });
  }

  /**
   * Record relocation (bin to bin within warehouse)
   */
  static async recordRelocation(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    fromBinId: string,
    fromBinCode: string,
    toBinId: string,
    toBinCode: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      reason?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'RELOCATION',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: Math.abs(quantity),
      fromBinId,
      fromBinCode,
      toBinId,
      toBinCode,
      reasonDescription: options?.reason,
    });
  }

  /**
   * Record adjustment
   */
  static async recordAdjustment(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number, // Positive = increase, Negative = decrease
    binId: string,
    binCode: string,
    reasonCode: string,
    reasonDescription?: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      beforeQuantity?: number;
      afterQuantity?: number;
      auditId?: string;
      auditNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'ADJUSTMENT',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity,
      beforeQuantity: options?.beforeQuantity,
      afterQuantity: options?.afterQuantity,
      fromBinId: quantity < 0 ? binId : undefined,
      fromBinCode: quantity < 0 ? binCode : undefined,
      toBinId: quantity > 0 ? binId : undefined,
      toBinCode: quantity > 0 ? binCode : undefined,
      reasonCode,
      reasonDescription,
      referenceType: 'AUDIT',
      referenceId: options?.auditId,
      referenceNumber: options?.auditNumber,
    });
  }

  /**
   * Record scrap/damage write-off
   */
  static async recordScrap(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    fromBinId: string,
    fromBinCode: string,
    reasonCode: string,
    reasonDescription?: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
      unitCost?: number;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'SCRAP',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: -Math.abs(quantity), // Always negative
      fromBinId,
      fromBinCode,
      unitCost: options?.unitCost,
      reasonCode,
      reasonDescription,
    });
  }

  /**
   * Record transfer out
   */
  static async recordTransferOut(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    fromBinId: string,
    fromBinCode: string,
    transferId: string,
    transferNumber: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'TRANSFER_OUT',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: -Math.abs(quantity),
      fromBinId,
      fromBinCode,
      referenceType: 'TRANSFER',
      referenceId: transferId,
      referenceNumber: transferNumber,
    });
  }

  /**
   * Record transfer in
   */
  static async recordTransferIn(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productName: string,
    quantity: number,
    toBinId: string,
    toBinCode: string,
    transferId: string,
    transferNumber: string,
    options?: {
      variantId?: string;
      sku?: string;
      batchId?: string;
      batchNumber?: string;
    }
  ): Promise<wh_stock_movement> {
    return this.record(ctx, {
      warehouseId,
      movementType: 'TRANSFER_IN',
      productId,
      productName,
      variantId: options?.variantId,
      sku: options?.sku,
      batchId: options?.batchId,
      batchNumber: options?.batchNumber,
      quantity: Math.abs(quantity),
      toBinId,
      toBinCode,
      referenceType: 'TRANSFER',
      referenceId: transferId,
      referenceNumber: transferNumber,
    });
  }

  /**
   * Get movement by ID
   */
  static async getById(
    ctx: TenantContext,
    movementId: string
  ): Promise<wh_stock_movement | null> {
    return prisma.wh_stock_movement.findFirst({
      where: {
        id: movementId,
        tenantId: ctx.tenantId,
      },
    });
  }

  /**
   * List movements with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: MovementFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_stock_movement>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.batchId) {
      where.batchId = filters.batchId;
    }
    if (filters?.movementType) {
      where.movementType = filters.movementType;
    }
    if (filters?.fromBinId) {
      where.fromBinId = filters.fromBinId;
    }
    if (filters?.toBinId) {
      where.toBinId = filters.toBinId;
    }
    if (filters?.referenceType) {
      where.referenceType = filters.referenceType;
    }
    if (filters?.referenceId) {
      where.referenceId = filters.referenceId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.wh_stock_movement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wh_stock_movement.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product movement history
   */
  static async getProductHistory(
    ctx: TenantContext,
    productId: string,
    options?: {
      warehouseId?: string;
      limit?: number;
    }
  ): Promise<wh_stock_movement[]> {
    const where: any = {
      tenantId: ctx.tenantId,
      productId,
    };

    if (options?.warehouseId) {
      where.warehouseId = options.warehouseId;
    }

    return prisma.wh_stock_movement.findMany({
      where,
      take: options?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get bin movement history
   */
  static async getBinHistory(
    ctx: TenantContext,
    binId: string,
    options?: {
      limit?: number;
    }
  ): Promise<wh_stock_movement[]> {
    return prisma.wh_stock_movement.findMany({
      where: {
        tenantId: ctx.tenantId,
        OR: [
          { fromBinId: binId },
          { toBinId: binId },
        ],
      },
      take: options?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get batch movement history
   */
  static async getBatchHistory(
    ctx: TenantContext,
    batchId: string
  ): Promise<wh_stock_movement[]> {
    return prisma.wh_stock_movement.findMany({
      where: {
        tenantId: ctx.tenantId,
        batchId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get movement summary for warehouse
   */
  static async getWarehouseSummary(
    ctx: TenantContext,
    warehouseId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    receipts: number;
    putaways: number;
    picks: number;
    adjustments: number;
    scraps: number;
    transfersIn: number;
    transfersOut: number;
    relocations: number;
  }> {
    const where: any = {
      tenantId: ctx.tenantId,
      warehouseId,
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const movements = await prisma.wh_stock_movement.groupBy({
      by: ['movementType'],
      where,
      _count: true,
    });

    const counts = movements.reduce((acc: any, m) => {
      acc[m.movementType] = m._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      receipts: counts.RECEIPT || 0,
      putaways: counts.PUTAWAY || 0,
      picks: counts.PICK || 0,
      adjustments: counts.ADJUSTMENT || 0,
      scraps: counts.SCRAP || 0,
      transfersIn: counts.TRANSFER_IN || 0,
      transfersOut: counts.TRANSFER_OUT || 0,
      relocations: counts.RELOCATION || 0,
    };
  }

  /**
   * Verify movement (supervisor confirmation)
   */
  static async verify(
    ctx: TenantContext,
    movementId: string,
    verifiedById: string,
    verifiedByName: string
  ): Promise<wh_stock_movement> {
    const movement = await prisma.wh_stock_movement.findFirst({
      where: {
        id: movementId,
        tenantId: ctx.tenantId,
      },
    });

    if (!movement) {
      throw new Error('Movement not found');
    }

    return prisma.wh_stock_movement.update({
      where: { id: movementId },
      data: {
        verifiedById,
        verifiedByName,
        verifiedAt: new Date(),
      },
    });
  }
}
