/**
 * ADVANCED WAREHOUSE SUITE — Bin Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages bin/slot locations within warehouse zones.
 * Supports FIFO/FEFO suggestions and capacity tracking.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_bin, wh_BinType } from '@prisma/client';
import type {
  TenantContext,
  CreateBinInput,
  UpdateBinInput,
  BinFilters,
  BinContentItem,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// BIN SERVICE
// =============================================================================

export class BinService {
  /**
   * Create a new bin
   */
  static async create(
    ctx: TenantContext,
    input: CreateBinInput
  ): Promise<wh_bin> {
    // Validate zone exists
    const zone = await prisma.wh_zone.findFirst({
      where: {
        id: input.zoneId,
        tenantId: ctx.tenantId,
        warehouseId: input.warehouseId,
        isActive: true,
      },
    });

    if (!zone) {
      throw new Error('Zone not found or inactive');
    }

    // Check for duplicate code
    const existing = await prisma.wh_bin.findFirst({
      where: {
        tenantId: ctx.tenantId,
        warehouseId: input.warehouseId,
        code: input.code,
      },
    });

    if (existing) {
      throw new Error(`Bin code '${input.code}' already exists in this warehouse`);
    }

    const bin = await prisma.wh_bin.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        zoneId: input.zoneId,
        code: input.code,
        aisle: input.aisle,
        rack: input.rack,
        level: input.level,
        position: input.position,
        binType: input.binType || 'SHELF',
        maxWeight: input.maxWeight,
        maxVolume: input.maxVolume,
        maxUnits: input.maxUnits,
        restrictedToProductId: input.restrictedToProductId,
        restrictedToCategory: input.restrictedToCategory,
        allowMixedBatches: input.allowMixedBatches ?? false,
        isEmpty: true,
        currentUnits: 0,
      }),
    });

    // Update zone capacity
    await prisma.wh_zone.update({
      where: { id: input.zoneId },
      data: {
        totalCapacity: { increment: 1 },
      },
    });

    return bin;
  }

  /**
   * Create multiple bins at once (bulk creation)
   */
  static async createBulk(
    ctx: TenantContext,
    warehouseId: string,
    zoneId: string,
    bins: Array<Omit<CreateBinInput, 'warehouseId' | 'zoneId'>>
  ): Promise<{ created: number; errors: string[] }> {
    const zone = await prisma.wh_zone.findFirst({
      where: {
        id: zoneId,
        tenantId: ctx.tenantId,
        warehouseId,
        isActive: true,
      },
    });

    if (!zone) {
      throw new Error('Zone not found or inactive');
    }

    const errors: string[] = [];
    let created = 0;

    for (const binInput of bins) {
      try {
        await this.create(ctx, {
          ...binInput,
          warehouseId,
          zoneId,
        });
        created++;
      } catch (error: any) {
        errors.push(`${binInput.code}: ${error.message}`);
      }
    }

    return { created, errors };
  }

  /**
   * Get bin by ID
   */
  static async getById(
    ctx: TenantContext,
    binId: string
  ): Promise<wh_bin | null> {
    return prisma.wh_bin.findFirst({
      where: {
        id: binId,
        tenantId: ctx.tenantId,
      },
      include: {
        zone: true,
      },
    });
  }

  /**
   * Get bin by code
   */
  static async getByCode(
    ctx: TenantContext,
    warehouseId: string,
    code: string
  ): Promise<wh_bin | null> {
    return prisma.wh_bin.findFirst({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        code,
      },
      include: {
        zone: true,
      },
    });
  }

  /**
   * List bins with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: BinFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_bin>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.zoneId) {
      where.zoneId = filters.zoneId;
    }
    if (filters?.binType) {
      where.binType = filters.binType;
    }
    if (filters?.isEmpty !== undefined) {
      where.isEmpty = filters.isEmpty;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.isBlocked !== undefined) {
      where.isBlocked = filters.isBlocked;
    }

    const [data, total] = await Promise.all([
      prisma.wh_bin.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { zoneId: 'asc' },
          { aisle: 'asc' },
          { rack: 'asc' },
          { level: 'asc' },
          { position: 'asc' },
        ],
        include: {
          zone: {
            select: { id: true, name: true, zoneType: true },
          },
        },
      }),
      prisma.wh_bin.count({ where }),
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
   * Update bin
   */
  static async update(
    ctx: TenantContext,
    binId: string,
    input: UpdateBinInput
  ): Promise<wh_bin> {
    const existing = await prisma.wh_bin.findFirst({
      where: {
        id: binId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Bin not found');
    }

    return prisma.wh_bin.update({
      where: { id: binId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Block/unblock bin
   */
  static async setBlocked(
    ctx: TenantContext,
    binId: string,
    isBlocked: boolean,
    reason?: string
  ): Promise<wh_bin> {
    const existing = await prisma.wh_bin.findFirst({
      where: {
        id: binId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Bin not found');
    }

    return prisma.wh_bin.update({
      where: { id: binId },
      data: {
        isBlocked,
        blockReason: isBlocked ? reason : null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete bin (soft delete)
   */
  static async delete(
    ctx: TenantContext,
    binId: string
  ): Promise<wh_bin> {
    const existing = await prisma.wh_bin.findFirst({
      where: {
        id: binId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Bin not found');
    }

    if (!existing.isEmpty) {
      throw new Error('Cannot delete bin with stock');
    }

    // Update zone capacity
    await prisma.wh_zone.update({
      where: { id: existing.zoneId },
      data: {
        totalCapacity: { decrement: 1 },
      },
    });

    return prisma.wh_bin.update({
      where: { id: binId },
      data: { isActive: false },
    });
  }

  /**
   * Suggest bin for putaway based on product and zone rules
   */
  static async suggestBinForPutaway(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    productCategory?: string,
    preferredZoneId?: string
  ): Promise<wh_bin | null> {
    const where: any = {
      tenantId: ctx.tenantId,
      warehouseId,
      isActive: true,
      isBlocked: false,
      isEmpty: true,
    };

    // If product-specific bin restriction
    const restrictedBin = await prisma.wh_bin.findFirst({
      where: {
        ...where,
        restrictedToProductId: productId,
      },
    });

    if (restrictedBin) return restrictedBin;

    // If category-specific bin restriction
    if (productCategory) {
      const categoryBin = await prisma.wh_bin.findFirst({
        where: {
          ...where,
          restrictedToCategory: productCategory,
        },
      });

      if (categoryBin) return categoryBin;
    }

    // If preferred zone specified
    if (preferredZoneId) {
      const zoneBin = await prisma.wh_bin.findFirst({
        where: {
          ...where,
          zoneId: preferredZoneId,
        },
      });

      if (zoneBin) return zoneBin;
    }

    // Fall back to any empty storage bin
    return prisma.wh_bin.findFirst({
      where: {
        ...where,
        zone: {
          zoneType: 'STORAGE',
          isActive: true,
        },
      },
      include: {
        zone: true,
      },
    });
  }

  /**
   * Find bins containing specific product (for FIFO/FEFO picking)
   */
  static async findBinsWithProduct(
    ctx: TenantContext,
    warehouseId: string,
    productId: string,
    options?: {
      fifo?: boolean; // First In First Out (by receipt date)
      fefo?: boolean; // First Expiry First Out
    }
  ): Promise<Array<wh_bin & { contents: BinContentItem[] }>> {
    // This would query stock movements to find bin contents
    // For now, return bins associated with product movements
    const movements = await prisma.wh_stock_movement.findMany({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        productId,
        toBinId: { not: null },
        quantity: { gt: 0 },
      },
      orderBy: options?.fefo
        ? { expiryDate: 'asc' }
        : options?.fifo
        ? { createdAt: 'asc' }
        : { createdAt: 'desc' },
      include: {
        fromBin: true,
      },
    });

    // Group by bin and aggregate
    const binMap = new Map<string, BinContentItem[]>();
    
    for (const mov of movements) {
      if (mov.toBinId) {
        const existing = binMap.get(mov.toBinId) || [];
        existing.push({
          productId: mov.productId,
          productName: mov.productName,
          variantId: mov.variantId || undefined,
          sku: mov.sku || undefined,
          batchId: mov.batchId || undefined,
          batchNumber: mov.batchNumber || undefined,
          expiryDate: mov.expiryDate || undefined,
          quantity: mov.quantity,
        });
        binMap.set(mov.toBinId, existing);
      }
    }

    const binIds = Array.from(binMap.keys());
    const bins = await prisma.wh_bin.findMany({
      where: {
        id: { in: binIds },
        tenantId: ctx.tenantId,
        isActive: true,
        isBlocked: false,
      },
    });

    return bins.map(bin => ({
      ...bin,
      contents: binMap.get(bin.id) || [],
    }));
  }

  /**
   * Update bin occupancy
   */
  static async updateOccupancy(
    ctx: TenantContext,
    binId: string,
    unitsChange: number,
    weightChange?: number
  ): Promise<wh_bin> {
    const bin = await prisma.wh_bin.findFirst({
      where: {
        id: binId,
        tenantId: ctx.tenantId,
      },
    });

    if (!bin) {
      throw new Error('Bin not found');
    }

    const newUnits = bin.currentUnits + unitsChange;
    const newWeight = bin.currentWeight
      ? Number(bin.currentWeight) + (weightChange || 0)
      : weightChange;

    return prisma.wh_bin.update({
      where: { id: binId },
      data: {
        currentUnits: Math.max(0, newUnits),
        currentWeight: newWeight ? newWeight : null,
        isEmpty: newUnits <= 0,
        updatedAt: new Date(),
      },
    });
  }
}
