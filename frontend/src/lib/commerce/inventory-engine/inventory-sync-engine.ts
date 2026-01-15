/**
 * INVENTORY SYNC ENGINE
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Event-driven, cross-channel inventory synchronization engine.
 * Processes stock events from POS, SVM, MVM, and ParkHub channels.
 * 
 * CONSTRAINTS:
 * - NO automation or cron jobs
 * - NO background workers
 * - User-triggered operations only
 * - Demo-safe operation maintained
 */

import { prisma } from '@/lib/prisma';
import { ChannelType, InventoryMode, Prisma, StockMovementReason } from '@prisma/client';
import { ConflictClassifier, StockContext } from './conflict-classifier';
import {
  ChannelSource,
  ChannelStockSnapshot,
  ConflictDetails,
  EventProcessingResult,
  InventoryAuditEntry,
  OfflineEventReplayResult,
  ParkHubCapacityView,
  StockEvent,
  StockEventType,
  UnifiedStockView,
  ChannelAdapter,
} from './types';
import {
  POSChannelAdapter,
  SVMChannelAdapter,
  MVMChannelAdapter,
  ParkHubChannelAdapter,
} from './channel-adapters';

export class InventorySyncEngine {
  private adapters: Map<ChannelSource, ChannelAdapter>;

  constructor(private tenantId: string) {
    this.adapters = new Map<ChannelSource, ChannelAdapter>([
      ['POS', new POSChannelAdapter(tenantId) as ChannelAdapter],
      ['SVM', new SVMChannelAdapter(tenantId) as ChannelAdapter],
      ['MVM', new MVMChannelAdapter(tenantId) as ChannelAdapter],
      ['PARKHUB', new ParkHubChannelAdapter(tenantId) as ChannelAdapter],
    ]);
  }

  private getAdapter(channel: ChannelSource): ChannelAdapter | undefined {
    return this.adapters.get(channel);
  }

  async processEvent(event: StockEvent): Promise<EventProcessingResult> {
    if (event.tenantId !== this.tenantId) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: 'Tenant mismatch - access denied',
      };
    }

    const adapter = this.getAdapter(event.channel);
    if (!adapter) {
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: `No adapter found for channel: ${event.channel}`,
      };
    }

    try {
      const result = await adapter.processEvent(event);
      return result;
    } catch (error) {
      console.error('[InventorySyncEngine] Error processing event:', error);
      return {
        success: false,
        eventId: event.id,
        processed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processBatch(events: StockEvent[]): Promise<EventProcessingResult[]> {
    const results: EventProcessingResult[] = [];
    
    events.sort((a, b) => {
      const timeA = a.clientTimestamp || a.serverTimestamp || new Date();
      const timeB = b.clientTimestamp || b.serverTimestamp || new Date();
      return timeA.getTime() - timeB.getTime();
    });

    for (const event of events) {
      const result = await this.processEvent(event);
      results.push(result);
    }

    return results;
  }

  async getUnifiedStockView(productId: string): Promise<UnifiedStockView | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: true,
      },
    });

    if (!product) return null;

    const totalOnHand = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

    const byChannel: ChannelStockSnapshot[] = product.ProductChannelConfig.map(config => {
      let channelEffectiveAvailable = totalAvailable;
      if (config.inventoryMode === 'ALLOCATED' && config.allocatedQuantity !== null) {
        channelEffectiveAvailable = Math.min(config.allocatedQuantity, totalAvailable);
      } else if (config.inventoryMode === 'UNLIMITED') {
        channelEffectiveAvailable = 999999;
      }

      return {
        channel: config.channel as ChannelSource,
        productId,
        variantId: null,
        inventoryMode: config.inventoryMode,
        totalAvailable,
        channelAllocated: config.allocatedQuantity,
        channelEffectiveAvailable,
        reserved: 0,
        pending: 0,
        isActive: config.status === 'ACTIVE',
        lastUpdated: config.updatedAt,
      };
    });

    const lastEvent = await prisma.inv_stock_movements.findFirst({
      where: { tenantId: this.tenantId, productId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const pendingOfflineCount = await prisma.pos_offline_sale.count({
      where: {
        tenantId: this.tenantId,
        syncStatus: { in: ['PENDING', 'SYNCING', 'CONFLICT'] },
      },
    });

    const hasConflicts = await prisma.pos_offline_sale.count({
      where: {
        tenantId: this.tenantId,
        syncStatus: 'CONFLICT',
        hasConflict: true,
      },
    }) > 0;

    return {
      productId,
      productName: product.name,
      sku: product.sku,
      totalOnHand,
      totalReserved,
      totalAvailable,
      byChannel,
      lastEventAt: lastEvent?.createdAt || null,
      hasConflicts,
      pendingOfflineEvents: pendingOfflineCount,
    };
  }

  async getMultiProductUnifiedView(
    options?: {
      productIds?: string[];
      channel?: ChannelSource;
      lowStockOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ products: UnifiedStockView[]; total: number }> {
    const { productIds, channel, lowStockOnly, limit = 50, offset = 0 } = options || {};

    const whereClause: Prisma.ProductWhereInput = {
      tenantId: this.tenantId,
      status: 'ACTIVE',
      trackInventory: true,
    };

    if (productIds?.length) {
      whereClause.id = { in: productIds };
    }

    if (channel && channel !== 'PARKHUB') {
      whereClause.ProductChannelConfig = {
        some: {
          channel: channel as ChannelType,
          status: 'ACTIVE',
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          InventoryLevel: true,
          ProductChannelConfig: true,
        },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const views: UnifiedStockView[] = [];

    for (const product of products) {
      const totalOnHand = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
      const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
      const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

      const reorderPoint = product.InventoryLevel.find(inv => inv.reorderPoint)?.reorderPoint;
      const isLowStock = reorderPoint !== null && reorderPoint !== undefined && totalAvailable <= reorderPoint;

      if (lowStockOnly && !isLowStock) continue;

      const byChannel: ChannelStockSnapshot[] = product.ProductChannelConfig.map(config => {
        let channelEffectiveAvailable = totalAvailable;
        if (config.inventoryMode === 'ALLOCATED' && config.allocatedQuantity !== null) {
          channelEffectiveAvailable = Math.min(config.allocatedQuantity, totalAvailable);
        } else if (config.inventoryMode === 'UNLIMITED') {
          channelEffectiveAvailable = 999999;
        }

        return {
          channel: config.channel as ChannelSource,
          productId: product.id,
          variantId: null,
          inventoryMode: config.inventoryMode,
          totalAvailable,
          channelAllocated: config.allocatedQuantity,
          channelEffectiveAvailable,
          reserved: 0,
          pending: 0,
          isActive: config.status === 'ACTIVE',
          lastUpdated: config.updatedAt,
        };
      });

      views.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        totalOnHand,
        totalReserved,
        totalAvailable,
        byChannel,
        lastEventAt: null,
        hasConflicts: false,
        pendingOfflineEvents: 0,
      });
    }

    return { products: views, total: lowStockOnly ? views.length : total };
  }

  async getParkHubCapacityView(tripId: string): Promise<ParkHubCapacityView | null> {
    const trip = await prisma.park_trip.findFirst({
      where: { id: tripId, tenantId: this.tenantId },
    });

    if (!trip) return null;

    const route = await prisma.park_route.findFirst({
      where: { id: trip.routeId, tenantId: this.tenantId },
    });

    const lastBooking = await prisma.park_ticket.findFirst({
      where: { tripId, tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      tripId: trip.id,
      routeName: route?.name || 'Unknown Route',
      origin: route?.origin || '',
      destination: route?.destination || '',
      scheduledDeparture: trip.scheduledDeparture,
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      availableSeats: trip.availableSeats,
      reservedSeats: 0,
      departureMode: trip.departureMode,
      status: trip.status,
      lastBookingAt: lastBooking?.createdAt || null,
    };
  }

  async replayOfflineEvents(locationId?: string): Promise<OfflineEventReplayResult> {
    const offlineSales = await prisma.pos_offline_sale.findMany({
      where: {
        tenantId: this.tenantId,
        ...(locationId && { locationId }),
        syncStatus: 'PENDING',
      },
      orderBy: { clientTimestamp: 'asc' },
    });

    const result: OfflineEventReplayResult = {
      total: offlineSales.length,
      replayed: 0,
      succeeded: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    };

    for (const offlineSale of offlineSales) {
      result.replayed++;
      
      try {
        const saleData = offlineSale.saleData as Record<string, unknown>;
        const items = (saleData.items as Array<Record<string, unknown>>) || [];

        for (const item of items) {
          const event: StockEvent = {
            id: `offline_${offlineSale.id}_${item.productId}`,
            tenantId: this.tenantId,
            channel: 'POS',
            eventType: 'SALE',
            productId: item.productId as string,
            variantId: (item.variantId as string) || null,
            locationId: offlineSale.locationId,
            quantity: -(item.quantity as number),
            unitPrice: item.unitPrice as number,
            referenceType: 'pos_offline_sale',
            referenceId: offlineSale.id,
            performedById: saleData.staffId as string,
            performedByName: saleData.staffName as string,
            clientTimestamp: offlineSale.clientTimestamp,
            serverTimestamp: new Date(),
            isOffline: true,
            offlineEventId: offlineSale.clientSaleId,
          };

          const eventResult = await this.processEvent(event);

          if (!eventResult.success) {
            if (eventResult.conflict) {
              result.conflicts++;
            } else {
              result.failed++;
              result.errors.push({ eventId: event.id, error: eventResult.message });
            }
          }
        }

        await prisma.pos_offline_sale.update({
          where: { id: offlineSale.id },
          data: {
            syncStatus: result.conflicts > 0 ? 'CONFLICT' : 'SYNCED',
            syncedAt: new Date(),
          },
        });

        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          eventId: offlineSale.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  private async getStockContext(event: StockEvent): Promise<(StockContext & { currentStock: number }) | null> {
    const product = await prisma.product.findFirst({
      where: { id: event.productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: {
          where: { channel: event.channel as ChannelType },
        },
      },
    });

    if (!product) return null;

    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);

    const channelConfig = product.ProductChannelConfig[0];
    const inventoryMode = channelConfig?.inventoryMode || 'SHARED';
    const allocatedQuantity = channelConfig?.allocatedQuantity;
    const channelStatus = (channelConfig?.status || 'INACTIVE') as 'ACTIVE' | 'PAUSED' | 'INACTIVE';

    return {
      currentStock: totalAvailable,
      availableQuantity: totalAvailable,
      reservedQuantity: totalReserved,
      currentPrice: Number(product.price),
      inventoryMode,
      allocatedQuantity,
      channelStatus,
      productStatus: product.status as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED',
      productName: product.name,
    };
  }

  private async applyStockChange(event: StockEvent, conflict: ConflictDetails): Promise<number> {
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
    const newQuantityOnHand = Math.max(0, inventoryLevel.quantityOnHand + quantityChange);
    const newQuantityAvailable = Math.max(0, inventoryLevel.quantityAvailable + quantityChange);

    await prisma.inventoryLevel.update({
      where: { id: inventoryLevel.id },
      data: {
        quantityOnHand: newQuantityOnHand,
        quantityAvailable: newQuantityAvailable,
      },
    });

    await prisma.inv_stock_movements.create({
      data: {
        id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tenantId: this.tenantId,
        productId: event.productId,
        variantId: event.variantId,
        locationId: event.locationId || inventoryLevel.locationId,
        reason: this.mapEventTypeToReason(event.eventType, quantityChange),
        quantity: quantityChange,
        quantityBefore: inventoryLevel.quantityAvailable,
        referenceType: event.referenceType,
        referenceId: event.referenceId,
        performedBy: event.performedById,
        performedByName: event.performedByName,
        isOfflineCreated: event.isOffline,
        notes: conflict.type !== 'NONE' ? `Processed with ${conflict.severity} conflict: ${conflict.type}` : null,
        createdAt: new Date(),
      },
    });

    return newQuantityAvailable;
  }

  private async createAuditEntry(
    event: StockEvent,
    quantityBefore: number,
    quantityAfter: number,
    conflict: ConflictDetails
  ): Promise<string> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    return auditId;
  }

  private mapEventTypeToReason(eventType: StockEventType, quantity: number): StockMovementReason {
    const mapping: Record<StockEventType, StockMovementReason> = {
      SALE: 'SALE',
      SALE_REVERSAL: 'RETURN_FROM_CUSTOMER',
      RESERVATION: quantity > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE',
      RESERVATION_RELEASE: 'ADJUSTMENT_POSITIVE',
      ADJUSTMENT: quantity > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE',
      TRANSFER: 'TRANSFER_OUT',
      RECEIPT: 'PURCHASE_ORDER',
      RETURN: 'RETURN_FROM_CUSTOMER',
      PARKHUB_BOOKING: 'SALE',
      PARKHUB_CANCELLATION: 'RETURN_FROM_CUSTOMER',
    };
    return mapping[eventType] || (quantity > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE');
  }
}

export function createInventorySyncEngine(tenantId: string): InventorySyncEngine {
  return new InventorySyncEngine(tenantId);
}
