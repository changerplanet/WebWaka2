/**
 * CHANNEL ADAPTERS
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Channel-specific adapters for POS, SVM, MVM, and ParkHub.
 * Each adapter handles channel-specific stock operations.
 * 
 * CONSTRAINTS:
 * - NO automation or cron jobs
 * - NO background workers
 * - User-triggered operations only
 */

import { prisma } from '@/lib/prisma';
import { ChannelType, InventoryMode } from '@prisma/client';
import {
  ChannelAdapter,
  ChannelSource,
  ChannelStockSnapshot,
  EventProcessingResult,
  StockEvent,
} from './types';
import { ConflictClassifier } from './conflict-classifier';

abstract class BaseChannelAdapter implements ChannelAdapter {
  constructor(
    protected tenantId: string,
    public channel: ChannelSource
  ) {}

  abstract processEvent(event: StockEvent): Promise<EventProcessingResult>;

  async getCurrentStock(productId: string, variantId?: string | null): Promise<number> {
    const inventoryLevels = await prisma.inventoryLevel.findMany({
      where: {
        tenantId: this.tenantId,
        productId,
        ...(variantId && { variantId }),
      },
    });

    return inventoryLevels.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
  }

  async reserveStock(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    const inventoryLevel = await prisma.inventoryLevel.findFirst({
      where: {
        tenantId: this.tenantId,
        productId,
      },
    });

    if (!inventoryLevel || inventoryLevel.quantityAvailable < quantity) {
      return false;
    }

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityReserved: { increment: quantity },
        quantityAvailable: { decrement: quantity },
      },
    });

    return true;
  }

  async releaseReservation(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    const inventoryLevel = await prisma.inventoryLevel.findFirst({
      where: {
        tenantId: this.tenantId,
        productId,
      },
    });

    if (!inventoryLevel) {
      return false;
    }

    const releaseQty = Math.min(quantity, inventoryLevel.quantityReserved);

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityReserved: { decrement: releaseQty },
        quantityAvailable: { increment: releaseQty },
      },
    });

    return true;
  }

  async getChannelSnapshot(productId: string): Promise<ChannelStockSnapshot | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: {
          where: { channel: this.channel as ChannelType },
        },
      },
    });

    if (!product) return null;

    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);

    const config = product.ProductChannelConfig[0];
    const inventoryMode = config?.inventoryMode || 'SHARED';

    let channelEffectiveAvailable = totalAvailable;
    if (inventoryMode === 'ALLOCATED' && config?.allocatedQuantity) {
      channelEffectiveAvailable = Math.min(config.allocatedQuantity, totalAvailable);
    } else if (inventoryMode === 'UNLIMITED') {
      channelEffectiveAvailable = 999999;
    }

    return {
      channel: this.channel,
      productId,
      variantId: null,
      inventoryMode,
      totalAvailable,
      channelAllocated: config?.allocatedQuantity || null,
      channelEffectiveAvailable,
      reserved: totalReserved,
      pending: 0,
      isActive: config?.status === 'ACTIVE',
      lastUpdated: config?.updatedAt || new Date(),
    };
  }
}

export class POSChannelAdapter extends BaseChannelAdapter {
  constructor(tenantId: string) {
    super(tenantId, 'POS');
  }

  async processEvent(event: StockEvent): Promise<EventProcessingResult> {
    try {
      const context = await this.getStockContext(event.productId);
      if (!context) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          message: 'Product not found',
        };
      }

      const conflict = ConflictClassifier.classify(event, context);

      if (ConflictClassifier.shouldBlock(conflict)) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          conflict,
          stockBefore: context.currentStock,
          stockAfter: context.currentStock,
          message: conflict.message,
        };
      }

      const stockBefore = context.currentStock;
      const { stockAfter, auditLogId } = await this.applyStockChange(event, stockBefore);

      return {
        success: true,
        eventId: event.id,
        processed: true,
        conflict: conflict.type !== 'NONE' ? conflict : undefined,
        stockBefore,
        stockAfter,
        message: 'POS event processed successfully',
        auditLogId,
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getStockContext(productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: { where: { channel: 'POS' } },
      },
    });

    if (!product) return null;

    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
    const config = product.ProductChannelConfig[0];

    return {
      currentStock: totalAvailable,
      availableQuantity: totalAvailable,
      reservedQuantity: totalReserved,
      currentPrice: Number(product.price),
      inventoryMode: (config?.inventoryMode || 'SHARED') as InventoryMode,
      allocatedQuantity: config?.allocatedQuantity,
      channelStatus: (config?.status || 'INACTIVE') as 'ACTIVE' | 'PAUSED' | 'INACTIVE',
      productStatus: product.status as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED',
      productName: product.name,
    };
  }

  private async applyStockChange(event: StockEvent, stockBefore: number): Promise<{ stockAfter: number; auditLogId: string }> {
    const inventoryLevel = await prisma.inventoryLevel.findFirst({
      where: {
        tenantId: this.tenantId,
        productId: event.productId,
        ...(event.locationId && { locationId: event.locationId }),
      },
    });

    if (!inventoryLevel) {
      throw new Error('Inventory level not found');
    }

    const quantityChange = event.quantity;
    const newQuantityAvailable = Math.max(0, inventoryLevel.quantityAvailable + quantityChange);

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityOnHand: Math.max(0, inventoryLevel.quantityOnHand + quantityChange),
        quantityAvailable: newQuantityAvailable,
      },
    });

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.inv_stock_movements.create({
      data: {
        id: movementId,
        tenantId: this.tenantId,
        productId: event.productId,
        variantId: event.variantId,
        locationId: event.locationId || inventoryLevel.locationId,
        reason: event.eventType === 'SALE' ? 'SALE' : (quantityChange > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE'),
        quantity: quantityChange,
        quantityBefore: stockBefore,
        referenceType: event.referenceType,
        referenceId: event.referenceId,
        performedBy: event.performedById,
        performedByName: event.performedByName,
        isOfflineCreated: event.isOffline,
        notes: event.isOffline ? `Offline POS event synced: ${event.offlineEventId}` : null,
        createdAt: new Date(),
      },
    });

    return { stockAfter: newQuantityAvailable, auditLogId: movementId };
  }
}

export class SVMChannelAdapter extends BaseChannelAdapter {
  constructor(tenantId: string) {
    super(tenantId, 'SVM');
  }

  async processEvent(event: StockEvent): Promise<EventProcessingResult> {
    try {
      const context = await this.getStockContext(event.productId);
      if (!context) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          message: 'Product not found',
        };
      }

      const conflict = ConflictClassifier.classify(event, context);

      if (ConflictClassifier.shouldBlock(conflict)) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          conflict,
          stockBefore: context.currentStock,
          stockAfter: context.currentStock,
          message: conflict.message,
        };
      }

      const stockBefore = context.currentStock;
      const { stockAfter, auditLogId } = await this.applyStockChange(event, stockBefore);

      return {
        success: true,
        eventId: event.id,
        processed: true,
        conflict: conflict.type !== 'NONE' ? conflict : undefined,
        stockBefore,
        stockAfter,
        message: 'SVM event processed successfully',
        auditLogId,
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getStockContext(productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: { where: { channel: 'SVM' } },
      },
    });

    if (!product) return null;

    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
    const config = product.ProductChannelConfig[0];

    return {
      currentStock: totalAvailable,
      availableQuantity: totalAvailable,
      reservedQuantity: totalReserved,
      currentPrice: Number(product.price),
      inventoryMode: (config?.inventoryMode || 'SHARED') as InventoryMode,
      allocatedQuantity: config?.allocatedQuantity,
      channelStatus: (config?.status || 'INACTIVE') as 'ACTIVE' | 'PAUSED' | 'INACTIVE',
      productStatus: product.status as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED',
      productName: product.name,
    };
  }

  private async applyStockChange(event: StockEvent, stockBefore: number): Promise<{ stockAfter: number; auditLogId: string }> {
    const inventoryLevel = await prisma.inventoryLevel.findFirst({
      where: {
        tenantId: this.tenantId,
        productId: event.productId,
      },
    });

    if (!inventoryLevel) {
      throw new Error('Inventory level not found');
    }

    const quantityChange = event.quantity;
    const newQuantityAvailable = Math.max(0, inventoryLevel.quantityAvailable + quantityChange);

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityOnHand: Math.max(0, inventoryLevel.quantityOnHand + quantityChange),
        quantityAvailable: newQuantityAvailable,
      },
    });

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.inv_stock_movements.create({
      data: {
        id: movementId,
        tenantId: this.tenantId,
        productId: event.productId,
        variantId: event.variantId,
        locationId: inventoryLevel.locationId,
        reason: event.eventType === 'SALE' ? 'SALE' : (quantityChange > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE'),
        quantity: quantityChange,
        quantityBefore: stockBefore,
        referenceType: event.referenceType,
        referenceId: event.referenceId,
        performedBy: event.performedById,
        performedByName: event.performedByName,
        isOfflineCreated: event.isOffline,
        notes: `SVM channel event: ${event.eventType}`,
        createdAt: new Date(),
      },
    });

    return { stockAfter: newQuantityAvailable, auditLogId: movementId };
  }
}

export class MVMChannelAdapter extends BaseChannelAdapter {
  constructor(tenantId: string) {
    super(tenantId, 'MVM');
  }

  async processEvent(event: StockEvent): Promise<EventProcessingResult> {
    try {
      const context = await this.getStockContext(event.productId);
      if (!context) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          message: 'Product not found',
        };
      }

      const conflict = ConflictClassifier.classify(event, context);

      if (ConflictClassifier.shouldBlock(conflict)) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          conflict,
          stockBefore: context.currentStock,
          stockAfter: context.currentStock,
          message: conflict.message,
        };
      }

      const stockBefore = context.currentStock;
      const { stockAfter, auditLogId } = await this.applyStockChange(event, stockBefore);

      return {
        success: true,
        eventId: event.id,
        processed: true,
        conflict: conflict.type !== 'NONE' ? conflict : undefined,
        stockBefore,
        stockAfter,
        message: 'MVM event processed successfully',
        auditLogId,
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getStockContext(productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: { where: { channel: 'MVM' } },
      },
    });

    if (!product) return null;

    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
    const config = product.ProductChannelConfig[0];

    return {
      currentStock: totalAvailable,
      availableQuantity: totalAvailable,
      reservedQuantity: totalReserved,
      currentPrice: Number(product.price),
      inventoryMode: (config?.inventoryMode || 'SHARED') as InventoryMode,
      allocatedQuantity: config?.allocatedQuantity,
      channelStatus: (config?.status || 'INACTIVE') as 'ACTIVE' | 'PAUSED' | 'INACTIVE',
      productStatus: product.status as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED',
      productName: product.name,
    };
  }

  private async applyStockChange(event: StockEvent, stockBefore: number): Promise<{ stockAfter: number; auditLogId: string }> {
    const inventoryLevel = await prisma.inventoryLevel.findFirst({
      where: {
        tenantId: this.tenantId,
        productId: event.productId,
      },
    });

    if (!inventoryLevel) {
      throw new Error('Inventory level not found');
    }

    const quantityChange = event.quantity;
    const newQuantityAvailable = Math.max(0, inventoryLevel.quantityAvailable + quantityChange);

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityOnHand: Math.max(0, inventoryLevel.quantityOnHand + quantityChange),
        quantityAvailable: newQuantityAvailable,
      },
    });

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await prisma.inv_stock_movements.create({
      data: {
        id: movementId,
        tenantId: this.tenantId,
        productId: event.productId,
        variantId: event.variantId,
        locationId: inventoryLevel.locationId,
        reason: event.eventType === 'SALE' ? 'SALE' : (quantityChange > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE'),
        quantity: quantityChange,
        quantityBefore: stockBefore,
        referenceType: event.referenceType,
        referenceId: event.referenceId,
        performedBy: event.performedById,
        performedByName: event.performedByName,
        isOfflineCreated: event.isOffline,
        notes: `MVM marketplace event: ${event.eventType}`,
        createdAt: new Date(),
      },
    });

    return { stockAfter: newQuantityAvailable, auditLogId: movementId };
  }
}

export class ParkHubChannelAdapter extends BaseChannelAdapter {
  constructor(tenantId: string) {
    super(tenantId, 'PARKHUB');
  }

  async processEvent(event: StockEvent): Promise<EventProcessingResult> {
    if (event.eventType !== 'PARKHUB_BOOKING' && event.eventType !== 'PARKHUB_CANCELLATION') {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: 'Invalid event type for ParkHub channel',
      };
    }

    try {
      const tripId = event.referenceId;
      const trip = await prisma.park_trip.findFirst({
        where: { id: tripId, tenantId: this.tenantId },
      });

      if (!trip) {
        return {
          success: false,
          eventId: event.id,
          processed: false,
          message: 'Trip not found',
        };
      }

      const seatsRequested = Math.abs(event.quantity);

      if (event.eventType === 'PARKHUB_BOOKING') {
        if (trip.availableSeats < seatsRequested) {
          return {
            success: false,
            eventId: event.id,
            processed: false,
            conflict: {
              type: 'CAPACITY_EXCEEDED',
              severity: 'CRITICAL',
              productId: tripId,
              productName: `Trip ${tripId}`,
              channel: 'PARKHUB',
              requestedQuantity: seatsRequested,
              availableQuantity: trip.availableSeats,
              shortage: seatsRequested - trip.availableSeats,
              message: `Cannot book ${seatsRequested} seat(s) - only ${trip.availableSeats} available`,
            },
            stockBefore: trip.availableSeats,
            stockAfter: trip.availableSeats,
            message: 'Insufficient seat capacity',
          };
        }

        await prisma.park_trip.update({
          where: { id: tripId },
          data: {
            bookedSeats: { increment: seatsRequested },
            availableSeats: { decrement: seatsRequested },
          },
        });

        return {
          success: true,
          eventId: event.id,
          processed: true,
          stockBefore: trip.availableSeats,
          stockAfter: trip.availableSeats - seatsRequested,
          message: `Booked ${seatsRequested} seat(s) successfully`,
        };
      }

      if (event.eventType === 'PARKHUB_CANCELLATION') {
        const seatsToRelease = Math.min(seatsRequested, trip.bookedSeats);

        await prisma.park_trip.update({
          where: { id: tripId },
          data: {
            bookedSeats: { decrement: seatsToRelease },
            availableSeats: { increment: seatsToRelease },
          },
        });

        return {
          success: true,
          eventId: event.id,
          processed: true,
          stockBefore: trip.availableSeats,
          stockAfter: trip.availableSeats + seatsToRelease,
          message: `Released ${seatsToRelease} seat(s) successfully`,
        };
      }

      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: 'Unknown event type',
      };
    } catch (error) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCurrentStock(tripId: string): Promise<number> {
    const trip = await prisma.park_trip.findFirst({
      where: { id: tripId, tenantId: this.tenantId },
    });

    return trip?.availableSeats || 0;
  }

  async reserveStock(tripId: string, quantity: number, referenceId: string): Promise<boolean> {
    const trip = await prisma.park_trip.findFirst({
      where: { id: tripId, tenantId: this.tenantId },
    });

    if (!trip || trip.availableSeats < quantity) {
      return false;
    }

    await prisma.park_trip.update({
      where: { id: tripId },
      data: {
        bookedSeats: { increment: quantity },
        availableSeats: { decrement: quantity },
      },
    });

    return true;
  }

  async releaseReservation(tripId: string, quantity: number, referenceId: string): Promise<boolean> {
    const trip = await prisma.park_trip.findFirst({
      where: { id: tripId, tenantId: this.tenantId },
    });

    if (!trip) return false;

    const seatsToRelease = Math.min(quantity, trip.bookedSeats);

    await prisma.park_trip.update({
      where: { id: tripId },
      data: {
        bookedSeats: { decrement: seatsToRelease },
        availableSeats: { increment: seatsToRelease },
      },
    });

    return true;
  }

  async getChannelSnapshot(tripId: string): Promise<ChannelStockSnapshot | null> {
    const trip = await prisma.park_trip.findFirst({
      where: { id: tripId, tenantId: this.tenantId },
    });

    if (!trip) return null;

    return {
      channel: 'PARKHUB',
      productId: tripId,
      variantId: null,
      inventoryMode: 'SHARED',
      totalAvailable: trip.totalSeats,
      channelAllocated: null,
      channelEffectiveAvailable: trip.availableSeats,
      reserved: 0,
      pending: 0,
      isActive: trip.status === 'SCHEDULED' || trip.status === 'BOARDING',
      lastUpdated: trip.updatedAt,
    };
  }
}

export function createChannelAdapter(tenantId: string, channel: ChannelSource): ChannelAdapter {
  switch (channel) {
    case 'POS':
      return new POSChannelAdapter(tenantId);
    case 'SVM':
      return new SVMChannelAdapter(tenantId);
    case 'MVM':
      return new MVMChannelAdapter(tenantId);
    case 'PARKHUB':
      return new ParkHubChannelAdapter(tenantId);
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}
