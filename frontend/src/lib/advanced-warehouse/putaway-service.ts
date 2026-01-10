/**
 * ADVANCED WAREHOUSE SUITE — Putaway Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages putaway tasks for placing received goods into bins.
 * Includes bin suggestion and task assignment.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_putaway_task, wh_PutawayStatus } from '@prisma/client';
import type {
  TenantContext,
  CreatePutawayTaskInput,
  AssignPutawayInput,
  CompletePutawayInput,
  PutawayFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// TASK NUMBER GENERATOR
// =============================================================================

async function generateTaskNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.wh_putaway_task.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
      },
    },
  });

  return `PUT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =============================================================================
// PUTAWAY SERVICE
// =============================================================================

export class PutawayService {
  /**
   * Create a putaway task
   */
  static async create(
    ctx: TenantContext,
    input: CreatePutawayTaskInput
  ): Promise<wh_putaway_task> {
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

    const taskNumber = await generateTaskNumber(ctx.tenantId);

    return prisma.wh_putaway_task.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        taskNumber,
        receiptId: input.receiptId,
        receiptItemId: input.receiptItemId,
        transferId: input.transferId,
        productId: input.productId,
        variantId: input.variantId,
        productName: input.productName,
        sku: input.sku,
        batchId: input.batchId,
        quantity: input.quantity,
        suggestedZoneId: input.suggestedZoneId,
        suggestedBinId: input.suggestedBinId,
        status: 'PENDING',
        priority: input.priority || 'NORMAL',
        notes: input.notes,
        createdBy: ctx.userId,
      }),
    });
  }

  /**
   * Create putaway tasks from receipt items
   */
  static async createFromReceipt(
    ctx: TenantContext,
    receiptId: string
  ): Promise<wh_putaway_task[]> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
      include: {
        items: {
          where: {
            isComplete: true,
            isPutaway: false,
            receivedQuantity: { gt: 0 },
          },
        },
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    const tasks: wh_putaway_task[] = [];

    for (const item of receipt.items) {
      // Suggest a bin for this product
      const suggestedBin = await prisma.wh_bin.findFirst({
        where: {
          tenantId: ctx.tenantId,
          warehouseId: receipt.warehouseId,
          isActive: true,
          isBlocked: false,
          isEmpty: true,
        },
        include: {
          zone: true,
        },
      });

      const task = await this.create(ctx, {
        warehouseId: receipt.warehouseId,
        receiptId: receipt.id,
        receiptItemId: item.id,
        productId: item.productId,
        variantId: item.variantId || undefined,
        productName: item.productName,
        sku: item.sku || undefined,
        batchId: item.batchId || undefined,
        quantity: item.receivedQuantity,
        suggestedZoneId: suggestedBin?.zoneId,
        suggestedBinId: suggestedBin?.id,
        priority: 'NORMAL',
      });

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Get task by ID
   */
  static async getById(
    ctx: TenantContext,
    taskId: string
  ): Promise<wh_putaway_task | null> {
    return prisma.wh_putaway_task.findFirst({
      where: {
        id: taskId,
        tenantId: ctx.tenantId,
      },
      include: {
        suggestedZone: true,
        suggestedBin: true,
        receiptItem: true,
      },
    });
  }

  /**
   * List putaway tasks with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: PutawayFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_putaway_task>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.receiptId) {
      where.receiptId = filters.receiptId;
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

    const [data, total] = await Promise.all([
      prisma.wh_putaway_task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          suggestedZone: { select: { id: true, name: true, zoneType: true } },
          suggestedBin: { select: { id: true, code: true } },
        },
      }),
      prisma.wh_putaway_task.count({ where }),
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
   * Assign task to operator
   */
  static async assign(
    ctx: TenantContext,
    taskId: string,
    input: AssignPutawayInput
  ): Promise<wh_putaway_task> {
    const task = await prisma.wh_putaway_task.findFirst({
      where: {
        id: taskId,
        tenantId: ctx.tenantId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'PENDING') {
      throw new Error('Task is not in PENDING status');
    }

    return prisma.wh_putaway_task.update({
      where: { id: taskId },
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
   * Start task (operator begins work)
   */
  static async start(
    ctx: TenantContext,
    taskId: string
  ): Promise<wh_putaway_task> {
    const task = await prisma.wh_putaway_task.findFirst({
      where: {
        id: taskId,
        tenantId: ctx.tenantId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'PENDING' && task.status !== 'ASSIGNED') {
      throw new Error('Task cannot be started');
    }

    return prisma.wh_putaway_task.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Complete putaway task
   */
  static async complete(
    ctx: TenantContext,
    taskId: string,
    input: CompletePutawayInput
  ): Promise<wh_putaway_task> {
    const task = await prisma.wh_putaway_task.findFirst({
      where: {
        id: taskId,
        tenantId: ctx.tenantId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new Error('Task is already completed or cancelled');
    }

    // Validate the bin exists and is available
    const bin = await prisma.wh_bin.findFirst({
      where: {
        id: input.actualBinId,
        tenantId: ctx.tenantId,
        isActive: true,
        isBlocked: false,
      },
    });

    if (!bin) {
      throw new Error('Target bin not found or unavailable');
    }

    // Update task
    const updatedTask = await prisma.wh_putaway_task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        actualZoneId: input.actualZoneId,
        actualBinId: input.actualBinId,
        quantityPutaway: input.quantityPutaway,
        completedAt: new Date(),
        completedById: input.completedById,
        completedByName: input.completedByName,
        notes: input.notes,
        updatedAt: new Date(),
      },
    });

    // Update bin occupancy
    await prisma.wh_bin.update({
      where: { id: input.actualBinId },
      data: {
        currentUnits: { increment: input.quantityPutaway },
        isEmpty: false,
        updatedAt: new Date(),
      },
    });

    // Mark receipt item as put away
    if (task.receiptItemId) {
      await prisma.wh_receipt_item.update({
        where: { id: task.receiptItemId },
        data: {
          isPutaway: true,
          updatedAt: new Date(),
        },
      });
    }

    return updatedTask;
  }

  /**
   * Cancel task
   */
  static async cancel(
    ctx: TenantContext,
    taskId: string,
    reason?: string
  ): Promise<wh_putaway_task> {
    const task = await prisma.wh_putaway_task.findFirst({
      where: {
        id: taskId,
        tenantId: ctx.tenantId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed task');
    }

    return prisma.wh_putaway_task.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
        notes: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get pending tasks for operator
   */
  static async getMyTasks(
    ctx: TenantContext,
    operatorId: string
  ): Promise<wh_putaway_task[]> {
    return prisma.wh_putaway_task.findMany({
      where: {
        tenantId: ctx.tenantId,
        assignedToId: operatorId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      orderBy: [
        { priority: 'desc' },
        { assignedAt: 'asc' },
      ],
      include: {
        suggestedZone: { select: { id: true, name: true, zoneType: true } },
        suggestedBin: { select: { id: true, code: true } },
      },
    });
  }

  /**
   * Get unassigned tasks for warehouse
   */
  static async getUnassigned(
    ctx: TenantContext,
    warehouseId: string
  ): Promise<wh_putaway_task[]> {
    return prisma.wh_putaway_task.findMany({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        status: 'PENDING',
        assignedToId: null,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Bulk assign tasks
   */
  static async bulkAssign(
    ctx: TenantContext,
    taskIds: string[],
    assignedToId: string,
    assignedToName: string
  ): Promise<number> {
    const result = await prisma.wh_putaway_task.updateMany({
      where: {
        id: { in: taskIds },
        tenantId: ctx.tenantId,
        status: 'PENDING',
      },
      data: {
        status: 'ASSIGNED',
        assignedToId,
        assignedToName,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get task statistics for warehouse
   */
  static async getStats(
    ctx: TenantContext,
    warehouseId: string
  ): Promise<{
    pending: number;
    assigned: number;
    inProgress: number;
    completedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, assigned, inProgress, completedToday] = await Promise.all([
      prisma.wh_putaway_task.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'PENDING' },
      }),
      prisma.wh_putaway_task.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'ASSIGNED' },
      }),
      prisma.wh_putaway_task.count({
        where: { tenantId: ctx.tenantId, warehouseId, status: 'IN_PROGRESS' },
      }),
      prisma.wh_putaway_task.count({
        where: {
          tenantId: ctx.tenantId,
          warehouseId,
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
    ]);

    return { pending, assigned, inProgress, completedToday };
  }
}
