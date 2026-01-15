/**
 * INVENTORY SYNC SERVICE
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * Cross-channel stock visibility and reconciliation.
 * NO automation, NO background jobs.
 */

import { prisma } from '@/lib/prisma';
import { ChannelType } from '@prisma/client';
import {
  ProductStockView,
  ChannelStockLevel,
  LocationStockLevel,
  StockMovementSummary,
  TimeFilter,
  ReconciliationSummary,
  StockReconciliationRecord,
  OfflineStockEvent,
  InventorySyncStatus,
} from './types';

export class InventorySyncService {
  constructor(private tenantId: string) {}

  async getProductStockView(productId: string): Promise<ProductStockView | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
      include: {
        InventoryLevel: {
          include: {
            Location: true,
          },
        },
        ProductChannelConfig: true,
      },
    });

    if (!product) return null;

    const totalOnHand = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
    const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
    const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const totalIncoming = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityIncoming, 0);

    const reorderPoint = product.InventoryLevel.find(inv => inv.reorderPoint)?.reorderPoint || null;
    const reorderQuantity = product.InventoryLevel.find(inv => inv.reorderQuantity)?.reorderQuantity || null;
    const isLowStock = reorderPoint !== null && totalAvailable <= reorderPoint;

    const channelBreakdown: ChannelStockLevel[] = product.ProductChannelConfig.map(config => {
      let effectiveAvailable = totalAvailable;
      if (config.inventoryMode === 'ALLOCATED' && config.allocatedQuantity !== null) {
        effectiveAvailable = Math.min(config.allocatedQuantity, totalAvailable);
      }
      return {
        channel: config.channel,
        inventoryMode: config.inventoryMode as 'SHARED' | 'ALLOCATED',
        allocatedQuantity: config.allocatedQuantity,
        effectiveAvailable,
        isActive: config.status === 'ACTIVE',
      };
    });

    const locationBreakdown: LocationStockLevel[] = product.InventoryLevel.map(inv => ({
      locationId: inv.locationId,
      locationName: inv.Location.name,
      quantityOnHand: inv.quantityOnHand,
      quantityReserved: inv.quantityReserved,
      quantityAvailable: inv.quantityAvailable,
      quantityIncoming: inv.quantityIncoming,
      lastCountedAt: inv.lastCountedAt,
    }));

    const lastMovement = await this.getLastMovement(productId);

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      totalOnHand,
      totalReserved,
      totalAvailable,
      totalIncoming,
      reorderPoint,
      reorderQuantity,
      isLowStock,
      channelBreakdown,
      locationBreakdown,
      lastMovement,
    };
  }

  async getMultiProductStockViews(
    options?: {
      productIds?: string[];
      categoryId?: string;
      channelFilter?: ChannelType;
      lowStockOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ products: ProductStockView[]; total: number }> {
    const { productIds, categoryId, channelFilter, lowStockOnly, limit = 50, offset = 0 } = options || {};

    const whereClause: any = {
      tenantId: this.tenantId,
      status: 'ACTIVE',
      trackInventory: true,
    };

    if (productIds?.length) {
      whereClause.id = { in: productIds };
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (channelFilter) {
      whereClause.ProductChannelConfig = {
        some: {
          channel: channelFilter,
          status: 'ACTIVE',
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          InventoryLevel: {
            include: { Location: true },
          },
          ProductChannelConfig: true,
        },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const stockViews: ProductStockView[] = [];

    for (const product of products) {
      const totalOnHand = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
      const totalReserved = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityReserved, 0);
      const totalAvailable = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
      const totalIncoming = product.InventoryLevel.reduce((sum, inv) => sum + inv.quantityIncoming, 0);

      const reorderPoint = product.InventoryLevel.find(inv => inv.reorderPoint)?.reorderPoint || null;
      const reorderQuantity = product.InventoryLevel.find(inv => inv.reorderQuantity)?.reorderQuantity || null;
      const isLowStock = reorderPoint !== null && totalAvailable <= reorderPoint;

      if (lowStockOnly && !isLowStock) continue;

      const channelBreakdown: ChannelStockLevel[] = product.ProductChannelConfig.map(config => {
        let effectiveAvailable = totalAvailable;
        if (config.inventoryMode === 'ALLOCATED' && config.allocatedQuantity !== null) {
          effectiveAvailable = Math.min(config.allocatedQuantity, totalAvailable);
        }
        return {
          channel: config.channel,
          inventoryMode: config.inventoryMode as 'SHARED' | 'ALLOCATED',
          allocatedQuantity: config.allocatedQuantity,
          effectiveAvailable,
          isActive: config.status === 'ACTIVE',
        };
      });

      const locationBreakdown: LocationStockLevel[] = product.InventoryLevel.map(inv => ({
        locationId: inv.locationId,
        locationName: inv.Location.name,
        quantityOnHand: inv.quantityOnHand,
        quantityReserved: inv.quantityReserved,
        quantityAvailable: inv.quantityAvailable,
        quantityIncoming: inv.quantityIncoming,
        lastCountedAt: inv.lastCountedAt,
      }));

      stockViews.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        totalOnHand,
        totalReserved,
        totalAvailable,
        totalIncoming,
        reorderPoint,
        reorderQuantity,
        isLowStock,
        channelBreakdown,
        locationBreakdown,
        lastMovement: null,
      });
    }

    return { products: stockViews, total: lowStockOnly ? stockViews.length : total };
  }

  async getChannelStockSummary(channel: ChannelType): Promise<{
    channel: ChannelType;
    totalProducts: number;
    activeProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const configs = await prisma.productChannelConfig.findMany({
      where: {
        tenantId: this.tenantId,
        channel,
      },
      include: {
        Product: {
          include: {
            InventoryLevel: true,
          },
        },
      },
    });

    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const activeProducts = configs.filter(c => c.status === 'ACTIVE').length;

    for (const config of configs) {
      if (config.status !== 'ACTIVE') continue;

      const productStock = config.Product.InventoryLevel.reduce(
        (sum, inv) => sum + inv.quantityAvailable,
        0
      );

      let effectiveStock = productStock;
      if (config.inventoryMode === 'ALLOCATED' && config.allocatedQuantity !== null) {
        effectiveStock = Math.min(config.allocatedQuantity, productStock);
      }

      totalStock += effectiveStock;

      if (effectiveStock === 0) {
        outOfStockCount++;
      } else {
        const reorderPoint = config.Product.InventoryLevel.find(inv => inv.reorderPoint)?.reorderPoint;
        if (reorderPoint && effectiveStock <= reorderPoint) {
          lowStockCount++;
        }
      }
    }

    return {
      channel,
      totalProducts: configs.length,
      activeProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
    };
  }

  async getStockMovementHistory(
    productId: string,
    filter?: TimeFilter,
    options?: { limit?: number; offset?: number }
  ): Promise<{ movements: StockMovementSummary[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const dateFilter = this.getDateFilter(filter);

    const [movements, total] = await Promise.all([
      prisma.inv_stock_movements.findMany({
        where: {
          tenantId: this.tenantId,
          productId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inv_stock_movements.count({
        where: {
          tenantId: this.tenantId,
          productId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
      }),
    ]);

    const summaries: StockMovementSummary[] = movements.map(m => ({
      id: m.id,
      reason: m.reason,
      quantity: m.quantity,
      channel: this.extractChannelFromReference(m.referenceType),
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      performedBy: m.performedBy,
      performedByName: m.performedByName,
      createdAt: m.createdAt,
      isOfflineCreated: m.isOfflineCreated,
    }));

    return { movements: summaries, total };
  }

  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    const offlineSalesWithConflicts = await prisma.pos_offline_sale.findMany({
      where: {
        tenantId: this.tenantId,
        hasConflict: true,
        syncStatus: 'CONFLICT',
      },
    });

    const pendingCount = offlineSalesWithConflicts.filter(s => 
      s.conflictType === 'OVERSELL'
    ).length;

    let totalDiscrepancyValue = 0;
    let shortageCount = 0;
    let surplusCount = 0;

    for (const sale of offlineSalesWithConflicts) {
      const details = sale.conflictDetails as any;
      if (details?.shortage) {
        shortageCount++;
        totalDiscrepancyValue += (details.shortage * (details.unitPrice || 0));
      }
    }

    const lastSync = await prisma.pos_offline_sale.findFirst({
      where: {
        tenantId: this.tenantId,
        syncStatus: 'SYNCED',
      },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });

    return {
      tenantId: this.tenantId,
      pendingCount,
      totalDiscrepancyValue,
      shortageCount,
      surplusCount,
      offlineSyncIssues: offlineSalesWithConflicts.length,
      lastReconciliation: lastSync?.syncedAt || null,
    };
  }

  async getOfflineStockEvents(locationId?: string): Promise<OfflineStockEvent[]> {
    const offlineSales = await prisma.pos_offline_sale.findMany({
      where: {
        tenantId: this.tenantId,
        ...(locationId && { locationId }),
        syncStatus: { in: ['PENDING', 'CONFLICT', 'SYNCING'] },
      },
      orderBy: { clientTimestamp: 'desc' },
      take: 100,
    });

    const locations = await prisma.location.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, name: true },
    });

    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    const events: OfflineStockEvent[] = offlineSales.map(sale => {
      const saleData = sale.saleData as any;
      const items = (saleData?.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.productName || 'Unknown',
        quantitySold: item.quantity || 0,
        stockBefore: null,
        stockAfter: null,
        hasConflict: sale.conflictType === 'OVERSELL' && 
          (sale.conflictDetails as any)?.productId === item.productId,
      }));

      return {
        offlineSaleId: sale.id,
        clientSaleId: sale.clientSaleId,
        locationId: sale.locationId,
        locationName: locationMap.get(sale.locationId) || 'Unknown',
        clientTimestamp: sale.clientTimestamp,
        syncedAt: sale.syncedAt,
        items,
        hasStockConflict: sale.hasConflict && sale.conflictType === 'OVERSELL',
        conflictType: sale.conflictType,
      };
    });

    return events;
  }

  async getLocationSyncStatus(): Promise<InventorySyncStatus[]> {
    const locations = await prisma.location.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, name: true },
    });

    const statuses: InventorySyncStatus[] = [];

    for (const location of locations) {
      const lastSync = await prisma.pos_offline_sale.findFirst({
        where: {
          tenantId: this.tenantId,
          locationId: location.id,
          syncStatus: 'SYNCED',
        },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      });

      const pending = await prisma.pos_offline_sale.count({
        where: {
          tenantId: this.tenantId,
          locationId: location.id,
          syncStatus: { in: ['PENDING', 'SYNCING'] },
        },
      });

      const conflicts = await prisma.pos_offline_sale.count({
        where: {
          tenantId: this.tenantId,
          locationId: location.id,
          syncStatus: 'CONFLICT',
        },
      });

      const totalSales = await prisma.pos_sale.count({
        where: {
          tenantId: this.tenantId,
          locationId: location.id,
        },
      });

      const successfulSyncs = await prisma.pos_offline_sale.count({
        where: {
          tenantId: this.tenantId,
          locationId: location.id,
          syncStatus: { in: ['SYNCED', 'RESOLVED'] },
        },
      });

      const accuracy = totalSales > 0 
        ? Math.round((successfulSyncs / (successfulSyncs + conflicts)) * 100) || 100
        : 100;

      statuses.push({
        locationId: location.id,
        locationName: location.name,
        lastOnlineSync: lastSync?.syncedAt || null,
        pendingOfflineSales: pending,
        conflictCount: conflicts,
        stockAccuracy: accuracy,
      });
    }

    return statuses;
  }

  private async getLastMovement(productId: string): Promise<StockMovementSummary | null> {
    const movement = await prisma.inv_stock_movements.findFirst({
      where: {
        tenantId: this.tenantId,
        productId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!movement) return null;

    return {
      id: movement.id,
      reason: movement.reason,
      quantity: movement.quantity,
      channel: this.extractChannelFromReference(movement.referenceType),
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      performedBy: movement.performedBy,
      performedByName: movement.performedByName,
      createdAt: movement.createdAt,
      isOfflineCreated: movement.isOfflineCreated,
    };
  }

  private extractChannelFromReference(referenceType: string | null): ChannelType | null {
    if (!referenceType) return null;
    if (referenceType.includes('POS') || referenceType === 'pos_sale') return 'POS';
    if (referenceType.includes('SVM') || referenceType === 'svm_order') return 'SVM';
    if (referenceType.includes('MVM') || referenceType === 'mvm_order') return 'MVM';
    return null;
  }

  private getDateFilter(filter?: TimeFilter): { gte?: Date; lte?: Date } | undefined {
    if (!filter) return undefined;

    const now = new Date();
    switch (filter.period) {
      case 'today':
        return { gte: new Date(now.setHours(0, 0, 0, 0)) };
      case '7d':
        return { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      case '30d':
        return { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      case '90d':
        return { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
      case 'custom':
        return {
          ...(filter.startDate && { gte: filter.startDate }),
          ...(filter.endDate && { lte: filter.endDate }),
        };
      default:
        return undefined;
    }
  }
}

export function createInventorySyncService(tenantId: string): InventorySyncService {
  return new InventorySyncService(tenantId);
}
