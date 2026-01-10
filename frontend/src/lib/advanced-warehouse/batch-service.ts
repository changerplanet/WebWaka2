/**
 * ADVANCED WAREHOUSE SUITE — Batch Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages batch/lot tracking with expiry dates.
 * Supports FIFO/FEFO allocation and batch recalls.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_batch } from '@prisma/client';
import type {
  TenantContext,
  CreateBatchInput,
  UpdateBatchInput,
  BatchFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// BATCH SERVICE
// =============================================================================

export class BatchService {
  /**
   * Create a new batch
   */
  static async create(
    ctx: TenantContext,
    input: CreateBatchInput
  ): Promise<wh_batch> {
    // Check for duplicate batch number for same product
    const existing = await prisma.wh_batch.findFirst({
      where: {
        tenantId: ctx.tenantId,
        productId: input.productId,
        batchNumber: input.batchNumber,
      },
    });

    if (existing) {
      throw new Error(`Batch '${input.batchNumber}' already exists for this product`);
    }

    return prisma.wh_batch.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        productId: input.productId,
        variantId: input.variantId,
        batchNumber: input.batchNumber,
        lotNumber: input.lotNumber,
        serialNumber: input.serialNumber,
        manufacturingDate: input.manufacturingDate,
        expiryDate: input.expiryDate,
        supplierId: input.supplierId,
        supplierBatchRef: input.supplierBatchRef,
        purchaseOrderId: input.purchaseOrderId,
        initialQuantity: input.initialQuantity,
        currentQuantity: input.initialQuantity,
        reservedQuantity: 0,
        qualityStatus: input.qualityStatus || 'APPROVED',
        inspectionNotes: input.inspectionNotes,
        createdBy: ctx.userId,
      }),
    });
  }

  /**
   * Get batch by ID
   */
  static async getById(
    ctx: TenantContext,
    batchId: string
  ): Promise<wh_batch | null> {
    return prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });
  }

  /**
   * Get batch by number and product
   */
  static async getByNumber(
    ctx: TenantContext,
    productId: string,
    batchNumber: string
  ): Promise<wh_batch | null> {
    return prisma.wh_batch.findFirst({
      where: {
        tenantId: ctx.tenantId,
        productId,
        batchNumber,
      },
    });
  }

  /**
   * List batches with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: BatchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_batch>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.variantId) {
      where.variantId = filters.variantId;
    }
    if (filters?.qualityStatus) {
      where.qualityStatus = filters.qualityStatus;
    }
    if (filters?.isRecalled !== undefined) {
      where.isRecalled = filters.isRecalled;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.isExpired) {
      where.expiryDate = { lt: new Date() };
    }
    if (filters?.isExpiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = {
        gte: new Date(),
        lte: thirtyDaysFromNow,
      };
    }

    const [data, total] = await Promise.all([
      prisma.wh_batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { expiryDate: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      prisma.wh_batch.count({ where }),
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
   * Update batch
   */
  static async update(
    ctx: TenantContext,
    batchId: string,
    input: UpdateBatchInput
  ): Promise<wh_batch> {
    const existing = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Batch not found');
    }

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        ...input,
        recallDate: input.isRecalled ? new Date() : existing.recallDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Adjust batch quantity
   */
  static async adjustQuantity(
    ctx: TenantContext,
    batchId: string,
    quantityChange: number,
    reason?: string
  ): Promise<wh_batch> {
    const batch = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const newQuantity = batch.currentQuantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error('Insufficient batch quantity');
    }

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        currentQuantity: newQuantity,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Reserve batch quantity
   */
  static async reserveQuantity(
    ctx: TenantContext,
    batchId: string,
    quantity: number
  ): Promise<wh_batch> {
    const batch = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const availableQuantity = batch.currentQuantity - batch.reservedQuantity;
    if (quantity > availableQuantity) {
      throw new Error(`Insufficient available quantity. Available: ${availableQuantity}`);
    }

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        reservedQuantity: batch.reservedQuantity + quantity,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Release reserved quantity
   */
  static async releaseReservation(
    ctx: TenantContext,
    batchId: string,
    quantity: number
  ): Promise<wh_batch> {
    const batch = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const newReserved = Math.max(0, batch.reservedQuantity - quantity);

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        reservedQuantity: newReserved,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Recall a batch
   */
  static async recall(
    ctx: TenantContext,
    batchId: string,
    reason: string
  ): Promise<wh_batch> {
    const batch = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        isRecalled: true,
        recallReason: reason,
        recallDate: new Date(),
        qualityStatus: 'QUARANTINE',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Find batches for FIFO allocation (First In First Out)
   */
  static async findForFIFO(
    ctx: TenantContext,
    productId: string,
    requiredQuantity: number,
    variantId?: string
  ): Promise<wh_batch[]> {
    const where: any = {
      tenantId: ctx.tenantId,
      productId,
      isActive: true,
      isRecalled: false,
      qualityStatus: 'APPROVED',
      currentQuantity: { gt: 0 },
    };

    if (variantId) {
      where.variantId = variantId;
    }

    // Order by received date (oldest first)
    return prisma.wh_batch.findMany({
      where,
      orderBy: { receivedDate: 'asc' },
    });
  }

  /**
   * Find batches for FEFO allocation (First Expiry First Out)
   */
  static async findForFEFO(
    ctx: TenantContext,
    productId: string,
    requiredQuantity: number,
    variantId?: string
  ): Promise<wh_batch[]> {
    const where: any = {
      tenantId: ctx.tenantId,
      productId,
      isActive: true,
      isRecalled: false,
      qualityStatus: 'APPROVED',
      currentQuantity: { gt: 0 },
      expiryDate: { gte: new Date() }, // Not expired
    };

    if (variantId) {
      where.variantId = variantId;
    }

    // Order by expiry date (earliest first)
    return prisma.wh_batch.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Get expiring batches (within specified days)
   */
  static async getExpiring(
    ctx: TenantContext,
    daysAhead: number = 30
  ): Promise<wh_batch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.wh_batch.findMany({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
        isRecalled: false,
        currentQuantity: { gt: 0 },
        expiryDate: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Get expired batches
   */
  static async getExpired(
    ctx: TenantContext
  ): Promise<wh_batch[]> {
    return prisma.wh_batch.findMany({
      where: {
        tenantId: ctx.tenantId,
        isActive: true,
        currentQuantity: { gt: 0 },
        expiryDate: { lt: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Get batch movement history
   */
  static async getMovementHistory(
    ctx: TenantContext,
    batchId: string
  ): Promise<any[]> {
    return prisma.wh_stock_movement.findMany({
      where: {
        tenantId: ctx.tenantId,
        batchId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update quality status
   */
  static async updateQualityStatus(
    ctx: TenantContext,
    batchId: string,
    status: string,
    notes?: string
  ): Promise<wh_batch> {
    const batch = await prisma.wh_batch.findFirst({
      where: {
        id: batchId,
        tenantId: ctx.tenantId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return prisma.wh_batch.update({
      where: { id: batchId },
      data: {
        qualityStatus: status,
        inspectionNotes: notes || batch.inspectionNotes,
        updatedAt: new Date(),
      },
    });
  }
}
