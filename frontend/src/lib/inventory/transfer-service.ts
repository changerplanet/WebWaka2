/**
 * MODULE 1: Inventory & Warehouse Management
 * Stock Transfer Service - Handles warehouse-to-warehouse transfers
 * 
 * CRITICAL: Transfers emit events; Core applies inventory changes.
 * This service does NOT mutate Core InventoryLevel directly.
 */

import { prisma } from '../prisma';
import { emitInventoryEvent } from './event-emitter';
import {
  CreateStockTransferRequest,
  ShipTransferRequest,
  ReceiveTransferRequest,
  StockTransferResponse,
  StockTransferItemResponse,
  canTransitionTo,
} from './types';

// ============================================================================
// TRANSFER NUMBER GENERATOR
// ============================================================================

async function generateTransferNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Count existing transfers this month
  const count = await prisma.inv_stock_transfers.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(`${year}-${month}-01`),
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `TRF-${year}${month}-${sequence}`;
}

// ============================================================================
// STOCK TRANSFER SERVICE
// ============================================================================

export class StockTransferService {
  /**
   * Create a new stock transfer (DRAFT status)
   */
  static async create(
    tenantId: string,
    data: CreateStockTransferRequest,
    userId?: string,
    userName?: string
  ): Promise<StockTransferResponse> {
    // Validate warehouses
    const [fromWarehouse, toWarehouse] = await Promise.all([
      prisma.inv_warehouses.findFirst({
        where: { id: data.fromWarehouseId, tenantId, isActive: true },
      }),
      prisma.inv_warehouses.findFirst({
        where: { id: data.toWarehouseId, tenantId, isActive: true },
      }),
    ]);

    if (!fromWarehouse) {
      throw new Error('Source warehouse not found or inactive');
    }
    if (!toWarehouse) {
      throw new Error('Destination warehouse not found or inactive');
    }
    if (!fromWarehouse.acceptsTransfersOut) {
      throw new Error('Source warehouse does not allow outbound transfers');
    }
    if (!toWarehouse.acceptsTransfersIn) {
      throw new Error('Destination warehouse does not allow inbound transfers');
    }
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new Error('Cannot transfer to the same warehouse');
    }

    // Validate products exist and get their names
    const productIds = data.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      include: { ProductVariant: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all products exist
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (item.variantId) {
        const productAny = product as any;
        const variant = productAny.ProductVariant.find((v: any) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found for product ${item.productId}`);
        }
      }
    }

    const transferNumber = await generateTransferNumber(tenantId);

    // Create transfer with items
    const transfer = await prisma.inv_stock_transfers.create({
      data: {
        tenantId,
        transferNumber,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        status: 'DRAFT',
        priority: data.priority || 'NORMAL',
        reason: data.reason,
        expectedArrival: data.expectedArrival,
        notes: data.notes,
        requestedById: userId,
        requestedByName: userName,
        inv_stock_transfer_items: {
          create: data.items.map(item => {
            const product = productMap.get(item.productId)!;
            const productAny = product as any;
            const variant = item.variantId
              ? productAny.ProductVariant.find((v: any) => v.id === item.variantId)
              : null;

            return {
              productId: item.productId,
              variantId: item.variantId,
              productName: product.name,
              variantName: variant?.name,
              sku: variant?.sku || product.sku,
              quantityRequested: item.quantityRequested,
              batchNumber: item.batchNumber,
              lotNumber: item.lotNumber,
              fromBinLocation: item.fromBinLocation,
              toBinLocation: item.toBinLocation,
            };
          }),
        },
      } as any,
      include: {
        inv_stock_transfer_items: true,
      },
    });

    // Get warehouse names separately
    const [fromWh, toWh] = await Promise.all([
      prisma.inv_warehouses.findUnique({ where: { id: transfer.fromWarehouseId } }),
      prisma.inv_warehouses.findUnique({ where: { id: transfer.toWarehouseId } }),
    ]);

    return this.toResponse(transfer, fromWh, toWh);
  }

  /**
   * Submit transfer for approval
   */
  static async submitForApproval(
    tenantId: string,
    transferId: string,
    userId?: string,
    userName?: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'PENDING_APPROVAL')) {
      throw new Error(`Cannot submit transfer from status '${transfer.status}'`);
    }

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: 'PENDING_APPROVAL',
        requestedById: userId || transfer.requestedById,
        requestedByName: userName || transfer.requestedByName,
      },
      include: {
        inv_stock_transfer_items: true,
      },
    });

    // Get warehouse info
    const [fromWh, toWh] = await Promise.all([
      prisma.inv_warehouses.findUnique({ where: { id: updated.fromWarehouseId } }),
      prisma.inv_warehouses.findUnique({ where: { id: updated.toWarehouseId } }),
    ]);

    // Emit event
    await emitInventoryEvent({
      type: 'STOCK_TRANSFER_REQUESTED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromWarehouseId: transfer.fromWarehouseId,
        fromLocationId: fromWh?.locationId,
        toWarehouseId: transfer.toWarehouseId,
        toLocationId: toWh?.locationId,
        items: (updated as any).inv_stock_transfer_items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          sku: i.sku || undefined,
          quantityRequested: i.quantityRequested,
          batchNumber: i.batchNumber || undefined,
        })),
        priority: updated.priority,
        reason: updated.reason || undefined,
      },
      metadata: { userId, userName },
    });

    return this.toResponse(updated, fromWh, toWh);
  }

  /**
   * Approve a transfer
   */
  static async approve(
    tenantId: string,
    transferId: string,
    userId: string,
    userName: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'APPROVED')) {
      throw new Error(`Cannot approve transfer from status '${transfer.status}'`);
    }

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        approvedById: userId,
        approvedByName: userName,
      },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // Emit event
    await emitInventoryEvent({
      type: 'STOCK_TRANSFER_APPROVED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        approvedById: userId,
        approvedByName: userName,
        items: updated.inv_stock_transfer_items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantityApproved: i.quantityRequested,
        })),
      },
      metadata: { userId, userName },
    });

    return this.toResponse(updated);
  }

  /**
   * Reject a transfer
   */
  static async reject(
    tenantId: string,
    transferId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'REJECTED')) {
      throw new Error(`Cannot reject transfer from status '${transfer.status}'`);
    }

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: 'REJECTED',
        rejectedById: userId,
        rejectedByName: userName,
        rejectionReason: reason,
      },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // Emit event
    await emitInventoryEvent({
      type: 'STOCK_TRANSFER_REJECTED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        rejectedById: userId,
        rejectedByName: userName,
        reason,
      },
      metadata: { userId, userName },
    });

    return this.toResponse(updated);
  }

  /**
   * Ship items (marks items as shipped, emits event to decrease source inventory)
   */
  static async ship(
    tenantId: string,
    transferId: string,
    data: ShipTransferRequest,
    userId: string,
    userName: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'IN_TRANSIT')) {
      throw new Error(`Cannot ship transfer from status '${transfer.status}'`);
    }

    // Update item quantities
    for (const shipItem of data.items) {
      const item = transfer.inv_stock_transfer_items.find(
        i => i.productId === shipItem.productId && 
             (i.variantId || null) === (shipItem.variantId || null)
      );

      if (!item) {
        throw new Error(`Item ${shipItem.productId} not found in transfer`);
      }

      if (shipItem.quantityShipped > item.quantityRequested) {
        throw new Error(
          `Cannot ship more than requested for ${item.productName}`
        );
      }

      await prisma.inv_stock_transfer_items.update({
        where: { id: item.id },
        data: { quantityShipped: shipItem.quantityShipped },
      });
    }

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: 'IN_TRANSIT',
        shippedDate: new Date(),
        shippingMethod: data.shippingMethod,
        trackingNumber: data.trackingNumber,
        carrierName: data.carrierName,
        shippingCost: data.shippingCost,
      },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // Build inventory deltas for source location (DECREASE)
    const inventoryDeltas = updated.inv_stock_transfer_items
      .filter(i => i.quantityShipped > 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        locationId: updated.fromWarehouse.locationId,
        delta: -i.quantityShipped, // Negative = decrease
        reason: 'TRANSFER_OUT' as const,
      }));

    // Emit event - Core will apply inventory decrease
    const eventId = await emitInventoryEvent({
      type: 'STOCK_TRANSFER_SHIPPED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromWarehouseId: transfer.fromWarehouseId,
        fromLocationId: updated.fromWarehouse.locationId,
        items: updated.inv_stock_transfer_items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantityShipped: i.quantityShipped,
          batchNumber: i.batchNumber || undefined,
        })),
        inventoryDeltas,
      },
      metadata: { userId, userName },
    });

    // Update event tracking
    await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        eventId,
        eventEmittedAt: new Date(),
      },
    });

    // Record stock movements for audit trail
    for (const item of updated.inv_stock_transfer_items.filter(i => i.quantityShipped > 0)) {
      await prisma.wh_stock_movement.create({
        data: {
          tenantId,
          productId: item.productId,
          variantId: item.variantId,
          locationId: updated.fromWarehouse.locationId,
          reason: 'TRANSFER_OUT',
          quantity: -item.quantityShipped,
          quantityBefore: 0, // Would be populated from actual inventory lookup
          referenceType: 'TRANSFER',
          referenceId: transferId,
          batchNumber: item.batchNumber,
          lotNumber: item.lotNumber,
          eventId,
          eventEmittedAt: new Date(),
          eventProcessed: true,
          performedBy: userId,
          performedByName: userName,
        },
      });
    }

    return this.toResponse(updated);
  }

  /**
   * Receive items (marks items as received, emits event to increase destination inventory)
   */
  static async receive(
    tenantId: string,
    transferId: string,
    data: ReceiveTransferRequest,
    userId: string,
    userName: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'COMPLETED') && 
        !canTransitionTo(transfer.status, 'PARTIALLY_RECEIVED')) {
      throw new Error(`Cannot receive transfer from status '${transfer.status}'`);
    }

    // Update item quantities and variances
    for (const receiveItem of data.items) {
      const item = transfer.inv_stock_transfer_items.find(
        i => i.productId === receiveItem.productId && 
             (i.variantId || null) === (receiveItem.variantId || null)
      );

      if (!item) {
        throw new Error(`Item ${receiveItem.productId} not found in transfer`);
      }

      const variance = receiveItem.quantityReceived - item.quantityShipped;

      await prisma.inv_stock_transfer_items.update({
        where: { id: item.id },
        data: {
          quantityReceived: receiveItem.quantityReceived,
          varianceQuantity: variance !== 0 ? variance : null,
          varianceReason: variance !== 0 ? receiveItem.varianceReason : null,
          toBinLocation: receiveItem.toBinLocation,
        },
      });
    }

    // Determine final status
    const updatedItems = await prisma.inv_stock_transfer_items.findMany({
      where: { transferId },
    });

    const allReceived = updatedItems.every(i => i.quantityReceived >= i.quantityShipped);
    const someReceived = updatedItems.some(i => i.quantityReceived > 0);

    let newStatus = transfer.status;
    if (allReceived) {
      newStatus = 'COMPLETED';
    } else if (someReceived) {
      newStatus = 'PARTIALLY_RECEIVED';
    }

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : undefined,
        receivedById: userId,
        receivedByName: userName,
        receivingNotes: data.receivingNotes,
      },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // Build inventory deltas for destination location (INCREASE)
    const inventoryDeltas = updated.inv_stock_transfer_items
      .filter(i => i.quantityReceived > 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        locationId: updated.toWarehouse.locationId,
        delta: i.quantityReceived, // Positive = increase
        reason: 'TRANSFER_IN' as const,
      }));

    // Emit event - Core will apply inventory increase
    const eventId = await emitInventoryEvent({
      type: 'STOCK_TRANSFER_RECEIVED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        toWarehouseId: transfer.toWarehouseId,
        toLocationId: updated.toWarehouse.locationId,
        items: updated.inv_stock_transfer_items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantityReceived: i.quantityReceived,
          varianceQuantity: i.varianceQuantity || undefined,
          varianceReason: i.varianceReason || undefined,
        })),
        inventoryDeltas,
      },
      metadata: { userId, userName },
    });

    // Record stock movements for audit trail
    for (const item of updated.inv_stock_transfer_items.filter(i => i.quantityReceived > 0)) {
      await prisma.wh_stock_movement.create({
        data: {
          tenantId,
          productId: item.productId,
          variantId: item.variantId,
          locationId: updated.toWarehouse.locationId,
          reason: 'TRANSFER_IN',
          quantity: item.quantityReceived,
          quantityBefore: 0, // Would be populated from actual inventory lookup
          referenceType: 'TRANSFER',
          referenceId: transferId,
          batchNumber: item.batchNumber,
          lotNumber: item.lotNumber,
          eventId,
          eventEmittedAt: new Date(),
          eventProcessed: true,
          performedBy: userId,
          performedByName: userName,
        },
      });
    }

    return this.toResponse(updated);
  }

  /**
   * Cancel a transfer
   */
  static async cancel(
    tenantId: string,
    transferId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<StockTransferResponse> {
    const transfer = await this.getTransferOrThrow(tenantId, transferId);

    if (!canTransitionTo(transfer.status, 'CANCELLED')) {
      throw new Error(`Cannot cancel transfer from status '${transfer.status}'`);
    }

    // If already shipped, we need to reverse the inventory
    const needsReversal = transfer.status === 'IN_TRANSIT';

    const updated = await prisma.inv_stock_transfers.update({
      where: { id: transferId },
      data: {
        status: 'CANCELLED',
        notes: `${transfer.notes || ''}\n\nCancelled by ${userName}: ${reason}`.trim(),
      },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // Emit cancellation event
    await emitInventoryEvent({
      type: 'STOCK_TRANSFER_CANCELLED',
      tenantId,
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        cancelledById: userId,
        cancelledByName: userName,
        reason,
        needsReversal,
        // If shipped, need to restore source inventory
        inventoryDeltas: needsReversal
          ? updated.inv_stock_transfer_items.map(i => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              locationId: updated.fromWarehouse.locationId,
              delta: i.quantityShipped, // Positive = restore
              reason: 'TRANSFER_CANCELLED' as const,
            }))
          : [],
      },
      metadata: { userId, userName },
    });

    return this.toResponse(updated);
  }

  /**
   * List transfers with filters
   */
  static async list(
    tenantId: string,
    options?: {
      status?: string | string[];
      fromWarehouseId?: string;
      toWarehouseId?: string;
      priority?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transfers: StockTransferResponse[]; total: number }> {
    const where: Record<string, unknown> = { tenantId };

    if (options?.status) {
      where.status = Array.isArray(options.status)
        ? { in: options.status }
        : options.status;
    }
    if (options?.fromWarehouseId) {
      where.fromWarehouseId = options.fromWarehouseId;
    }
    if (options?.toWarehouseId) {
      where.toWarehouseId = options.toWarehouseId;
    }
    if (options?.priority) {
      where.priority = options.priority;
    }
    if (options?.search) {
      where.OR = [
        { transferNumber: { contains: options.search, mode: 'insensitive' } },
        { reason: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [transfers, total] = await Promise.all([
      prisma.inv_stock_transfers.findMany({
        where,
        include: {
          inv_stock_transfer_items: true,
          fromWarehouse: true,
          toWarehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.inv_stock_transfers.count({ where }),
    ]);

    return {
      transfers: transfers.map(t => this.toResponse(t)),
      total,
    };
  }

  /**
   * Get a single transfer by ID
   */
  static async getById(
    tenantId: string,
    transferId: string
  ): Promise<StockTransferResponse | null> {
    const transfer = await prisma.inv_stock_transfers.findFirst({
      where: { id: transferId, tenantId },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    return transfer ? this.toResponse(transfer) : null;
  }

  /**
   * Get transfer or throw
   */
  private static async getTransferOrThrow(
    tenantId: string,
    transferId: string
  ) {
    const transfer = await prisma.inv_stock_transfers.findFirst({
      where: { id: transferId, tenantId },
      include: {
        inv_stock_transfer_items: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return transfer;
  }

  /**
   * Convert to API response
   */
  private static toResponse(transfer: {
    id: string;
    tenantId: string;
    transferNumber: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    status: string;
    priority: string;
    reason: string | null;
    requestedDate: Date;
    approvedDate: Date | null;
    shippedDate: Date | null;
    expectedArrival: Date | null;
    receivedDate: Date | null;
    requestedByName: string | null;
    approvedByName: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string | null;
      quantityRequested: number;
      quantityShipped: number;
      quantityReceived: number;
      varianceQuantity: number | null;
      varianceReason: string | null;
      batchNumber: string | null;
      lotNumber: string | null;
      expiryDate: Date | null;
    }>;
    fromWarehouse: {
      id: string;
      tenantId: string;
      locationId: string;
      name: string;
      code: string;
    };
    toWarehouse: {
      id: string;
      tenantId: string;
      locationId: string;
      name: string;
      code: string;
    };
  }): StockTransferResponse {
    const items: StockTransferItemResponse[] = transfer.inv_stock_transfer_items.map(i => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId || undefined,
      productName: i.productName,
      variantName: i.variantName || undefined,
      sku: i.sku || undefined,
      quantityRequested: i.quantityRequested,
      quantityShipped: i.quantityShipped,
      quantityReceived: i.quantityReceived,
      varianceQuantity: i.varianceQuantity || undefined,
      varianceReason: i.varianceReason || undefined,
      batchNumber: i.batchNumber || undefined,
      lotNumber: i.lotNumber || undefined,
      expiryDate: i.expiryDate || undefined,
    }));

    return {
      id: transfer.id,
      tenantId: transfer.tenantId,
      transferNumber: transfer.transferNumber,
      fromWarehouse: {
        id: transfer.fromWarehouse.id,
        tenantId: transfer.fromWarehouse.tenantId,
        locationId: transfer.fromWarehouse.locationId,
        name: transfer.fromWarehouse.name,
        code: transfer.fromWarehouse.code,
        description: undefined,
        warehouseType: 'GENERAL',
        fulfillmentPriority: 0,
        isActive: true,
        acceptsTransfersIn: true,
        acceptsTransfersOut: true,
        isDefaultForReceiving: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      toWarehouse: {
        id: transfer.toWarehouse.id,
        tenantId: transfer.toWarehouse.tenantId,
        locationId: transfer.toWarehouse.locationId,
        name: transfer.toWarehouse.name,
        code: transfer.toWarehouse.code,
        description: undefined,
        warehouseType: 'GENERAL',
        fulfillmentPriority: 0,
        isActive: true,
        acceptsTransfersIn: true,
        acceptsTransfersOut: true,
        isDefaultForReceiving: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      status: transfer.status,
      priority: transfer.priority,
      reason: transfer.reason || undefined,
      requestedDate: transfer.requestedDate,
      approvedDate: transfer.approvedDate || undefined,
      shippedDate: transfer.shippedDate || undefined,
      expectedArrival: transfer.expectedArrival || undefined,
      receivedDate: transfer.receivedDate || undefined,
      requestedByName: transfer.requestedByName || undefined,
      approvedByName: transfer.approvedByName || undefined,
      items,
      itemCount: items.length,
      totalQuantityRequested: items.reduce((sum, i) => sum + i.quantityRequested, 0),
      totalQuantityShipped: items.reduce((sum, i) => sum + i.quantityShipped, 0),
      totalQuantityReceived: items.reduce((sum, i) => sum + i.quantityReceived, 0),
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}
