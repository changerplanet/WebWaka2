/**
 * ADVANCED WAREHOUSE SUITE — Zone Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages warehouse zones (Receiving, Storage, Picking, Shipping, etc.)
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_zone, wh_ZoneType } from '@prisma/client';
import type {
  TenantContext,
  CreateZoneInput,
  UpdateZoneInput,
  ZoneFilters,
  ZoneSummary,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// ZONE NUMBER GENERATOR
// =============================================================================

async function generateZoneCode(
  tenantId: string,
  warehouseId: string,
  zoneType: wh_ZoneType
): Promise<string> {
  const prefix = zoneType.substring(0, 3).toUpperCase();
  
  const count = await prisma.wh_zone.count({
    where: { tenantId, warehouseId },
  });

  return `${prefix}-${String(count + 1).padStart(2, '0')}`;
}

// =============================================================================
// ZONE SERVICE
// =============================================================================

export class ZoneService {
  /**
   * Create a new warehouse zone
   */
  static async create(
    ctx: TenantContext,
    input: CreateZoneInput
  ): Promise<wh_zone> {
    // Validate warehouse exists
    const warehouse = await prisma.inv_warehouses.findFirst({
      where: {
        id: input.warehouseId,
        tenantId: ctx.tenantId,
        isActive: true,
      },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found or inactive');
    }

    // Check for duplicate code
    const existing = await prisma.wh_zone.findFirst({
      where: {
        tenantId: ctx.tenantId,
        warehouseId: input.warehouseId,
        code: input.code,
      },
    });

    if (existing) {
      throw new Error(`Zone code '${input.code}' already exists in this warehouse`);
    }

    const zone = await prisma.wh_zone.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        code: input.code,
        name: input.name,
        description: input.description,
        zoneType: input.zoneType || 'STORAGE',
        totalCapacity: input.totalCapacity,
        capacityUnit: input.capacityUnit,
        defaultForProductTypes: input.defaultForProductTypes || [],
        allowMixedProducts: input.allowMixedProducts ?? true,
        requiresInspection: input.requiresInspection ?? false,
        createdBy: ctx.userId,
      }),
    });

    return zone;
  }

  /**
   * Get zone by ID
   */
  static async getById(
    ctx: TenantContext,
    zoneId: string
  ): Promise<wh_zone | null> {
    return prisma.wh_zone.findFirst({
      where: {
        id: zoneId,
        tenantId: ctx.tenantId,
      },
      include: {
        bins: {
          where: { isActive: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  /**
   * List zones with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: ZoneFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_zone>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.zoneType) {
      where.zoneType = filters.zoneType;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [data, total] = await Promise.all([
      prisma.wh_zone.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { warehouseId: 'asc' },
          { zoneType: 'asc' },
          { code: 'asc' },
        ],
        include: {
          bins: {
            select: { id: true, isEmpty: true, isActive: true, isBlocked: true },
          },
        },
      }),
      prisma.wh_zone.count({ where }),
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
   * Update zone
   */
  static async update(
    ctx: TenantContext,
    zoneId: string,
    input: UpdateZoneInput
  ): Promise<wh_zone> {
    const existing = await prisma.wh_zone.findFirst({
      where: {
        id: zoneId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Zone not found');
    }

    return prisma.wh_zone.update({
      where: { id: zoneId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete zone (soft delete by setting isActive = false)
   */
  static async delete(
    ctx: TenantContext,
    zoneId: string
  ): Promise<wh_zone> {
    const existing = await prisma.wh_zone.findFirst({
      where: {
        id: zoneId,
        tenantId: ctx.tenantId,
      },
      include: {
        bins: {
          where: { isActive: true, isEmpty: false },
        },
      },
    });

    if (!existing) {
      throw new Error('Zone not found');
    }

    if (existing.bins.length > 0) {
      throw new Error('Cannot delete zone with occupied bins');
    }

    return prisma.wh_zone.update({
      where: { id: zoneId },
      data: { isActive: false },
    });
  }

  /**
   * Get zone summary with bin statistics
   */
  static async getZoneSummary(
    ctx: TenantContext,
    zoneId: string
  ): Promise<ZoneSummary | null> {
    const zone = await prisma.wh_zone.findFirst({
      where: {
        id: zoneId,
        tenantId: ctx.tenantId,
      },
      include: {
        bins: {
          where: { isActive: true },
        },
      },
    });

    if (!zone) return null;

    const bins = zone.bins;
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.zoneType,
      totalBins: bins.length,
      occupiedBins: bins.filter((b: any) => !b.isEmpty).length,
      emptyBins: bins.filter((b: any) => b.isEmpty).length,
      blockedBins: bins.filter((b: any) => b.isBlocked).length,
    };
  }

  /**
   * List zones by warehouse with summaries
   */
  static async listByWarehouse(
    ctx: TenantContext,
    warehouseId: string
  ): Promise<ZoneSummary[]> {
    const zones = await prisma.wh_zone.findMany({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        isActive: true,
      },
      include: {
        bins: {
          where: { isActive: true },
        },
      },
      orderBy: { zoneType: 'asc' },
    });

    return zones.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.zoneType,
      totalBins: zone.bins.length,
      occupiedBins: zone.bins.filter((b: any) => !b.isEmpty).length,
      emptyBins: zone.bins.filter((b: any) => b.isEmpty).length,
      blockedBins: zone.bins.filter((b: any) => b.isBlocked).length,
    }));
  }

  /**
   * Suggest zone for product based on category
   */
  static async suggestZoneForProduct(
    ctx: TenantContext,
    warehouseId: string,
    productCategory?: string
  ): Promise<wh_zone | null> {
    // First try to find zone matching product category
    if (productCategory) {
      const matchingZone = await prisma.wh_zone.findFirst({
        where: {
          tenantId: ctx.tenantId,
          warehouseId,
          isActive: true,
          defaultForProductTypes: { has: productCategory },
        },
      });

      if (matchingZone) return matchingZone;
    }

    // Fall back to any STORAGE zone
    return prisma.wh_zone.findFirst({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        isActive: true,
        zoneType: 'STORAGE',
      },
    });
  }
}
