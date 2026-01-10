/**
 * ADVANCED WAREHOUSE SUITE — Pick List Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages pick lists for order fulfillment and transfers.
 * Supports FIFO/FEFO allocation, batch picking, and short-pick handling.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_pick_list, wh_pick_list_item, wh_PickStatus } from '@prisma/client';
import type {
  TenantContext,
  CreatePickListInput,
  CreatePickListItemInput,
  AssignPickListInput,
  PickItemInput,
  CompletePackingInput,
  DispatchPickListInput,
  PickListFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// PICK NUMBER GENERATOR
// =============================================================================

async function generatePickNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.wh_pick_list.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
      },
    },
  });

  return `PICK-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =============================================================================
// PICK LIST SERVICE
// =============================================================================

export class PickListService {
  /**
   * Create a new pick list
   */
  static async create(
    ctx: TenantContext,
    input: CreatePickListInput,
    items: CreatePickListItemInput[]
  ): Promise<wh_pick_list> {
    // Validate warehouse
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

    const pickNumber = await generatePickNumber(ctx.tenantId);

    const pickList = await prisma.wh_pick_list.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        pickNumber,
        pickType: input.pickType || 'ORDER',
        sourceType: input.sourceType || 'ORDER',
        sourceId: input.sourceId,
        status: 'PENDING',
        priority: input.priority || 'NORMAL',
        totalLines: items.length,
        notes: input.notes,
        createdBy: ctx.userId,
        items: {
          create: items.map((item: any) => ({
            tenantId: ctx.tenantId,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            requestedQuantity: item.requestedQuantity,
            suggestedBinId: item.suggestedBinId,
            suggestedBinCode: item.suggestedBinCode,
            suggestedBatchId: item.suggestedBatchId,
            suggestedBatchNumber: item.suggestedBatchNumber,
          })),
        },
      }),
      include: {
        items: true,
      },
    });

    return pickList;
  }

  /**
   * Get pick list by ID
   */
  static async getById(
    ctx: TenantContext,
    pickListId: string
  ): Promise<wh_pick_list | null> {
    return prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            suggestedBin: { select: { id: true, code: true, zoneId: true } },
          },
        },
      },
    });
  }

  /**
   * Get pick list by number
   */
  static async getByNumber(
    ctx: TenantContext,
    pickNumber: string
  ): Promise<wh_pick_list | null> {
    return prisma.wh_pick_list.findFirst({
      where: {
        tenantId: ctx.tenantId,
        pickNumber,
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * List pick lists with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: PickListFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_pick_list>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.sourceType) {
      where.sourceType = filters.sourceType;
    }
    if (filters?.sourceId) {
      where.sourceId = filters.sourceId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId;
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
      prisma.wh_pick_list.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          items: {
            select: { id: true, productName: true, requestedQuantity: true, pickedQuantity: true, isPicked: true },
          },
        },
      }),
      prisma.wh_pick_list.count({ where }),
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
   * Assign pick list to picker
   */
  static async assign(
    ctx: TenantContext,
    pickListId: string,
    input: AssignPickListInput
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PENDING') {
      throw new Error('Pick list is not in PENDING status');
    }

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status: 'ASSIGNED',
        assignedToId: input.assignedToId,
        assignedToName: input.assignedToName,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Start picking
   */
  static async startPicking(
    ctx: TenantContext,
    pickListId: string
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PENDING' && pickList.status !== 'ASSIGNED') {
      throw new Error('Pick list cannot be started');
    }

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status: 'PICKING',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pick an item
   */
  static async pickItem(
    ctx: TenantContext,
    pickListId: string,
    input: PickItemInput
  ): Promise<wh_pick_list_item> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PICKING' && pickList.status !== 'ASSIGNED') {
      throw new Error('Pick list is not open for picking');
    }

    const item = await prisma.wh_pick_list_item.findFirst({
      where: {
        id: input.pickListItemId,
        pickListId,
      },
    });

    if (!item) {
      throw new Error('Pick list item not found');
    }

    const isShort = Boolean(input.shortQuantity && input.shortQuantity > 0);

    const updatedItem = await prisma.wh_pick_list_item.update({
      where: { id: input.pickListItemId },
      data: {
        pickedQuantity: input.pickedQuantity,
        shortQuantity: input.shortQuantity || 0,
        shortReason: input.shortReason,
        actualBinId: input.actualBinId,
        actualBinCode: input.actualBinCode,
        actualBatchId: input.actualBatchId,
        actualBatchNumber: input.actualBatchNumber,
        isPicked: true,
        isShort,
        pickedById: input.pickedById,
        pickedByName: input.pickedByName,
        pickedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update pick list status if picking just started
    if (pickList.status === 'ASSIGNED') {
      await prisma.wh_pick_list.update({
        where: { id: pickListId },
        data: {
          status: 'PICKING',
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Update pick list totals
    const allItems = await prisma.wh_pick_list_item.findMany({
      where: { pickListId },
    });

    const pickedLines = allItems.filter((i: any) => i.isPicked).length;
    const shortLines = allItems.filter((i: any) => i.isShort).length;

    await prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        pickedLines,
        shortLines,
        updatedAt: new Date(),
      },
    });

    // Update bin occupancy (reduce)
    if (input.actualBinId && input.pickedQuantity > 0) {
      await prisma.wh_bin.update({
        where: { id: input.actualBinId },
        data: {
          currentUnits: { decrement: input.pickedQuantity },
          updatedAt: new Date(),
        },
      });

      // Check if bin is now empty
      const bin = await prisma.wh_bin.findUnique({
        where: { id: input.actualBinId },
      });

      if (bin && bin.currentUnits <= 0) {
        await prisma.wh_bin.update({
          where: { id: input.actualBinId },
          data: { isEmpty: true },
        });
      }
    }

    return updatedItem;
  }

  /**
   * Complete picking
   */
  static async completePicking(
    ctx: TenantContext,
    pickListId: string
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PICKING') {
      throw new Error('Pick list is not in PICKING status');
    }

    // Check if there are any short picks
    const hasShorts = pickList.items.some((i: any) => i.isShort);
    const status: wh_PickStatus = hasShorts ? 'SHORT' : 'PICKED';

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Complete packing
   */
  static async completePacking(
    ctx: TenantContext,
    pickListId: string,
    input: CompletePackingInput
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PICKED' && pickList.status !== 'SHORT') {
      throw new Error('Pick list is not ready for packing');
    }

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status: 'PACKED',
        packageCount: input.packageCount,
        totalWeight: input.totalWeight,
        packingNotes: input.packingNotes,
        packedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dispatch pick list
   */
  static async dispatch(
    ctx: TenantContext,
    pickListId: string,
    input: DispatchPickListInput
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status !== 'PACKED') {
      throw new Error('Pick list is not ready for dispatch');
    }

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status: 'DISPATCHED',
        dispatchManifestId: input.dispatchManifestId,
        waybillNumber: input.waybillNumber,
        carrierName: input.carrierName,
        dispatchedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cancel pick list
   */
  static async cancel(
    ctx: TenantContext,
    pickListId: string,
    reason?: string
  ): Promise<wh_pick_list> {
    const pickList = await prisma.wh_pick_list.findFirst({
      where: {
        id: pickListId,
        tenantId: ctx.tenantId,
      },
    });

    if (!pickList) {
      throw new Error('Pick list not found');
    }

    if (pickList.status === 'DISPATCHED') {
      throw new Error('Cannot cancel dispatched pick list');
    }

    return prisma.wh_pick_list.update({
      where: { id: pickListId },
      data: {
        status: 'CANCELLED',
        internalNotes: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get my assigned pick lists
   */
  static async getMyPickLists(
    ctx: TenantContext,
    pickerId: string
  ): Promise<wh_pick_list[]> {
    return prisma.wh_pick_list.findMany({
      where: {
        tenantId: ctx.tenantId,
        assignedToId: pickerId,
        status: { in: ['ASSIGNED', 'PICKING'] },
      },
      orderBy: [
        { priority: 'desc' },
        { assignedAt: 'asc' },
      ],
      include: {
        items: {
          select: { id: true, productName: true, requestedQuantity: true, isPicked: true },
        },
      },
    });
  }

  /**
   * Get pick list statistics
   */
  static async getStats(
    ctx: TenantContext,
    warehouseId: string
  ): Promise<{
    pending: number;
    assigned: number;
    picking: number;
    picked: number;
    packed: number;
    dispatchedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, assigned, picking, picked, packed, dispatchedToday] = await Promise.all([
      prisma.wh_pick_list.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'PENDING' },
      }),
      prisma.wh_pick_list.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'ASSIGNED' },
      }),
      prisma.wh_pick_list.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'PICKING' },
      }),
      prisma.wh_pick_list.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: { in: ['PICKED', 'SHORT'] } },
      }),
      prisma.wh_pick_list.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'PACKED' },
      }),
      prisma.wh_pick_list.count({
        where: {
          tenantId: ctx.tenantId,
          warehouseId,
          status: 'DISPATCHED',
          dispatchedAt: { gte: today },
        },
      }),
    ]);

    return { pending, assigned, picking, picked, packed, dispatchedToday };
  }
}
