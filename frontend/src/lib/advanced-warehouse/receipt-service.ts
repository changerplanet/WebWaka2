/**
 * ADVANCED WAREHOUSE SUITE — Receipt Service
 * Phase 7C.3, S3 Core Services
 * 
 * Manages goods receipt (GRN) process including ASN,
 * receiving, inspection, and variance handling.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma';
import type { wh_receipt, wh_receipt_item, wh_ReceiptStatus } from '@prisma/client';
import type {
  TenantContext,
  CreateReceiptInput,
  CreateReceiptItemInput,
  ReceiveItemInput,
  UpdateReceiptInput,
  ReceiptFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// =============================================================================
// RECEIPT NUMBER GENERATOR
// =============================================================================

async function generateReceiptNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.wh_receipt.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
      },
    },
  });

  return `GRN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

// =============================================================================
// RECEIPT SERVICE
// =============================================================================

export class ReceiptService {
  /**
   * Create a new goods receipt (ASN or manual)
   */
  static async create(
    ctx: TenantContext,
    input: CreateReceiptInput,
    items: CreateReceiptItemInput[]
  ): Promise<wh_receipt> {
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

    const receiptNumber = await generateReceiptNumber(ctx.tenantId);

    // Calculate totals
    const totalExpectedLines = items.length;
    const totalExpectedQty = items.reduce((sum: any, item: any) => sum + item.expectedQuantity, 0);

    const receipt = await prisma.wh_receipt.create({
      data: withPrismaDefaults({
        tenantId: ctx.tenantId,
        platformInstanceId: ctx.platformInstanceId,
        warehouseId: input.warehouseId,
        receiptNumber,
        referenceType: input.referenceType || 'MANUAL',
        referenceId: input.referenceId,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        supplierRef: input.supplierRef,
        expectedDate: input.expectedDate,
        status: input.expectedDate ? 'EXPECTED' : 'RECEIVING',
        requiresInspection: input.requiresInspection ?? false,
        totalExpectedLines,
        totalExpectedQty,
        notes: input.notes,
        createdBy: ctx.userId,
        items: {
          create: items.map((item: any) => ({
            tenantId: ctx.tenantId,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            expectedQuantity: item.expectedQuantity,
            unitOfMeasure: item.unitOfMeasure || 'UNIT',
            unitsPerCase: item.unitsPerCase || 1,
            unitCost: item.unitCost,
            totalCost: item.unitCost ? item.unitCost * item.expectedQuantity : null,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
          })),
        },
      }),
      include: {
        inv_audit_items: true,
      },
    });

    return receipt;
  }

  /**
   * Get receipt by ID
   */
  static async getById(
    ctx: TenantContext,
    receiptId: string
  ): Promise<wh_receipt | null> {
    return prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
      include: {
        inv_audit_items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get receipt by number
   */
  static async getByNumber(
    ctx: TenantContext,
    receiptNumber: string
  ): Promise<wh_receipt | null> {
    return prisma.wh_receipt.findFirst({
      where: {
        tenantId: ctx.tenantId,
        receiptNumber,
      },
      include: {
        inv_audit_items: true,
      },
    });
  }

  /**
   * List receipts with filters
   */
  static async list(
    ctx: TenantContext,
    filters?: ReceiptFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<wh_receipt>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.referenceType) {
      where.referenceType = filters.referenceType;
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
      prisma.wh_receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          inv_audit_items: {
            select: { id: true, productName: true, expectedQuantity: true, receivedQuantity: true },
          },
        },
      }),
      prisma.wh_receipt.count({ where }),
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
   * Update receipt
   */
  static async update(
    ctx: TenantContext,
    receiptId: string,
    input: UpdateReceiptInput
  ): Promise<wh_receipt> {
    const existing = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new Error('Receipt not found');
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new Error('Cannot update completed or cancelled receipt');
    }

    return prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Start receiving process
   */
  static async startReceiving(
    ctx: TenantContext,
    receiptId: string,
    receivedById: string,
    receivedByName: string,
    receivingBay?: string
  ): Promise<wh_receipt> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status !== 'EXPECTED') {
      throw new Error('Receipt is not in EXPECTED status');
    }

    return prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        status: 'RECEIVING',
        receivedDate: new Date(),
        receivedById,
        receivedByName,
        receivingBay,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Receive an item
   */
  static async receiveItem(
    ctx: TenantContext,
    receiptId: string,
    input: ReceiveItemInput
  ): Promise<wh_receipt_item> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status !== 'RECEIVING' && receipt.status !== 'EXPECTED') {
      throw new Error('Receipt is not open for receiving');
    }

    const item = await prisma.wh_receipt_item.findFirst({
      where: {
        id: input.receiptItemId,
        receiptId,
      },
    });

    if (!item) {
      throw new Error('Receipt item not found');
    }

    const varianceQuantity = input.receivedQuantity - item.expectedQuantity;

    const updatedItem = await prisma.wh_receipt_item.update({
      where: { id: input.receiptItemId },
      data: {
        receivedQuantity: input.receivedQuantity,
        damagedQuantity: input.damagedQuantity || 0,
        varianceQuantity,
        varianceReason: input.varianceReason,
        batchNumber: input.batchNumber || item.batchNumber,
        expiryDate: input.expiryDate || item.expiryDate,
        isComplete: true,
        updatedAt: new Date(),
      },
    });

    // Update receipt totals
    const allItems = await prisma.wh_receipt_item.findMany({
      where: { receiptId },
    });

    const receivedLines = allItems.filter((i: any) => i.isComplete).length;
    const totalReceivedQty = allItems.reduce((sum: any, i: any) => sum + i.receivedQuantity, 0);

    // Update receipt status if receiving started
    await prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        status: receipt.status === 'EXPECTED' ? 'RECEIVING' : receipt.status,
        totalReceivedLines: receivedLines,
        totalReceivedQty,
        receivedDate: receipt.receivedDate || new Date(),
        updatedAt: new Date(),
      },
    });

    return updatedItem;
  }

  /**
   * Complete receiving
   */
  static async completeReceiving(
    ctx: TenantContext,
    receiptId: string
  ): Promise<wh_receipt> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
      include: {
        inv_audit_items: true,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status !== 'RECEIVING') {
      throw new Error('Receipt is not in RECEIVING status');
    }

    // Check if inspection is required
    if (receipt.requiresInspection) {
      return prisma.wh_receipt.update({
        where: { id: receiptId },
        data: {
          status: 'INSPECTING',
          updatedAt: new Date(),
        },
      });
    }

    // Mark all items as complete if not already
    await prisma.wh_receipt_item.updateMany({
      where: {
        receiptId,
        isComplete: false,
      },
      data: {
        isComplete: true,
      },
    });

    // Check if all received or partial
    const hasVariance = receipt.items.some((i: any) => i.varianceQuantity !== 0);
    const status: wh_ReceiptStatus = hasVariance ? 'PARTIAL' : 'COMPLETED';

    return prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Complete inspection
   */
  static async completeInspection(
    ctx: TenantContext,
    receiptId: string,
    inspectedById: string,
    inspectedByName: string,
    passed: boolean,
    notes?: string
  ): Promise<wh_receipt> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status !== 'INSPECTING') {
      throw new Error('Receipt is not in INSPECTING status');
    }

    return prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        status: passed ? 'COMPLETED' : 'PARTIAL',
        inspectionStatus: passed ? 'PASSED' : 'FAILED',
        inspectedById,
        inspectedByName,
        inspectionDate: new Date(),
        inspectionNotes: notes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cancel receipt
   */
  static async cancel(
    ctx: TenantContext,
    receiptId: string,
    reason?: string
  ): Promise<wh_receipt> {
    const receipt = await prisma.wh_receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: ctx.tenantId,
      },
    });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed receipt');
    }

    return prisma.wh_receipt.update({
      where: { id: receiptId },
      data: {
        status: 'CANCELLED',
        internalNotes: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get pending receipts for warehouse
   */
  static async getPending(
    ctx: TenantContext,
    warehouseId: string
  ): Promise<wh_receipt[]> {
    return prisma.wh_receipt.findMany({
      where: {
        tenantId: ctx.tenantId,
        warehouseId,
        status: { in: ['EXPECTED', 'RECEIVING', 'INSPECTING'] },
      },
      orderBy: { expectedDate: 'asc' },
      include: {
        inv_audit_items: {
          select: { id: true, productName: true, expectedQuantity: true, receivedQuantity: true },
        },
      },
    });
  }

  /**
   * Get items not yet put away
   */
  static async getItemsPendingPutaway(
    ctx: TenantContext,
    receiptId: string
  ): Promise<wh_receipt_item[]> {
    return prisma.wh_receipt_item.findMany({
      where: {
        receiptId,
        tenantId: ctx.tenantId,
        isComplete: true,
        isPutaway: false,
      },
    });
  }

  /**
   * Mark item as put away
   */
  static async markItemPutaway(
    ctx: TenantContext,
    receiptItemId: string
  ): Promise<wh_receipt_item> {
    const item = await prisma.wh_receipt_item.findFirst({
      where: {
        id: receiptItemId,
        tenantId: ctx.tenantId,
      },
    });

    if (!item) {
      throw new Error('Receipt item not found');
    }

    return prisma.wh_receipt_item.update({
      where: { id: receiptItemId },
      data: {
        isPutaway: true,
        updatedAt: new Date(),
      },
    });
  }
}
