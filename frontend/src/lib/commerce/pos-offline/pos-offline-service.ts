/**
 * POS OFFLINE SYNC SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * Server-side handling of offline POS sales sync, conflict detection,
 * and resolution workflows.
 */

import { prisma } from '@/lib/prisma';
import { PosSyncStatus, PosConflictType, Prisma } from '@prisma/client';

export interface OfflineSaleData {
  clientSaleId: string;
  clientTimestamp: string;
  items: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId: string;
  staffName: string;
  roundingAmount?: number;
  roundingMode?: string;
}

export interface SyncResult {
  success: boolean;
  syncedSaleId?: string;
  hasConflict: boolean;
  conflictType?: PosConflictType;
  conflictDetails?: Record<string, unknown>;
  message: string;
}

export class PosOfflineService {
  /**
   * Queue an offline sale for sync
   */
  static async queueOfflineSale(
    tenantId: string,
    locationId: string,
    saleData: OfflineSaleData
  ) {
    return prisma.pos_offline_sale.create({
      data: {
        tenantId,
        locationId,
        clientSaleId: saleData.clientSaleId,
        clientTimestamp: new Date(saleData.clientTimestamp),
        saleData: saleData as unknown as Prisma.InputJsonValue,
        syncStatus: 'PENDING',
        syncAttempts: 0,
      }
    });
  }

  /**
   * Get pending sales for sync
   */
  static async getPendingSales(tenantId: string, locationId?: string) {
    return prisma.pos_offline_sale.findMany({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        syncStatus: { in: ['PENDING', 'CONFLICT'] }
      },
      orderBy: { clientTimestamp: 'asc' }
    });
  }

  /**
   * Attempt to sync an offline sale
   */
  static async syncOfflineSale(offlineSaleId: string): Promise<SyncResult> {
    const offlineSale = await prisma.pos_offline_sale.findUnique({
      where: { id: offlineSaleId }
    });

    if (!offlineSale) {
      return {
        success: false,
        hasConflict: false,
        message: 'Offline sale not found'
      };
    }

    const saleData = offlineSale.saleData as unknown as OfflineSaleData;

    await prisma.pos_offline_sale.update({
      where: { id: offlineSaleId },
      data: {
        syncStatus: 'SYNCING',
        syncAttempts: { increment: 1 },
        lastSyncAttempt: new Date()
      }
    });

    try {
      const conflicts = await this.detectConflicts(
        offlineSale.tenantId,
        saleData
      );

      if (conflicts.hasConflict) {
        await prisma.pos_offline_sale.update({
          where: { id: offlineSaleId },
          data: {
            syncStatus: 'CONFLICT',
            hasConflict: true,
            conflictType: conflicts.conflictType,
            conflictDetails: conflicts.details as Prisma.InputJsonValue
          }
        });

        return {
          success: false,
          hasConflict: true,
          conflictType: conflicts.conflictType,
          conflictDetails: conflicts.details,
          message: `Conflict detected: ${conflicts.conflictType}`
        };
      }

      const sale = await this.createSaleFromOffline(
        offlineSale.tenantId,
        offlineSale.locationId,
        saleData
      );

      await prisma.pos_offline_sale.update({
        where: { id: offlineSaleId },
        data: {
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
          syncedSaleId: sale.id,
          hasConflict: false
        }
      });

      return {
        success: true,
        syncedSaleId: sale.id,
        hasConflict: false,
        message: 'Sale synced successfully'
      };

    } catch (error) {
      await prisma.pos_offline_sale.update({
        where: { id: offlineSaleId },
        data: {
          syncStatus: 'PENDING'
        }
      });

      return {
        success: false,
        hasConflict: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Detect conflicts in offline sale
   */
  private static async detectConflicts(
    tenantId: string,
    saleData: OfflineSaleData
  ): Promise<{
    hasConflict: boolean;
    conflictType?: PosConflictType;
    details?: Record<string, unknown>;
  }> {
    for (const item of saleData.items) {
      const inventory = await prisma.inventoryLevel.findFirst({
        where: {
          tenantId,
          productId: item.productId,
          variantId: item.variantId || undefined
        },
        select: { quantityAvailable: true }
      });

      if (inventory && inventory.quantityAvailable < item.quantity) {
        const shortage = item.quantity - inventory.quantityAvailable;
        
        if (shortage > 2) {
          return {
            hasConflict: true,
            conflictType: 'OVERSELL',
            details: {
              productId: item.productId,
              requestedQty: item.quantity,
              availableQty: inventory.quantityAvailable,
              shortage
            }
          };
        }
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { price: true, status: true }
      });

      if (!product || product.status !== 'ACTIVE') {
        return {
          hasConflict: true,
          conflictType: 'PRODUCT_UNAVAILABLE',
          details: {
            productId: item.productId,
            status: product?.status || 'NOT_FOUND'
          }
        };
      }

      const currentPrice = Number(product.price);
      const salePriceDiff = Math.abs(currentPrice - item.unitPrice);
      const percentDiff = (salePriceDiff / currentPrice) * 100;

      if (percentDiff > 10) {
        return {
          hasConflict: true,
          conflictType: 'PRICE_MISMATCH',
          details: {
            productId: item.productId,
            salePrice: item.unitPrice,
            currentPrice,
            percentDiff: percentDiff.toFixed(2)
          }
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Create actual POS sale from offline data
   */
  private static async createSaleFromOffline(
    tenantId: string,
    locationId: string,
    saleData: OfflineSaleData
  ) {
    const saleNumber = await this.generateSaleNumber(tenantId);

    return prisma.pos_sale.create({
      data: {
        tenantId,
        locationId,
        saleNumber,
        staffId: saleData.staffId,
        staffName: saleData.staffName,
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        subtotal: saleData.subtotal,
        discountTotal: saleData.discount,
        taxTotal: saleData.tax,
        grandTotal: saleData.total,
        currency: 'NGN',
        paymentMethod: saleData.paymentMethod,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        saleSource: 'OFFLINE_SYNC',
        pos_sale_item: {
          create: saleData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            lineTotal: item.quantity * item.unitPrice - (item.discount || 0)
          }))
        }
      }
    });
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    offlineSaleId: string,
    resolution: 'ACCEPT' | 'REJECT' | 'ADJUST',
    resolvedById: string,
    adjustments?: OfflineSaleData
  ): Promise<SyncResult> {
    const offlineSale = await prisma.pos_offline_sale.findUnique({
      where: { id: offlineSaleId }
    });

    if (!offlineSale || !offlineSale.hasConflict) {
      return {
        success: false,
        hasConflict: false,
        message: 'No conflict to resolve'
      };
    }

    if (resolution === 'REJECT') {
      await prisma.pos_offline_sale.update({
        where: { id: offlineSaleId },
        data: {
          syncStatus: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedById,
          resolutionAction: 'REJECT'
        }
      });

      return {
        success: true,
        hasConflict: false,
        message: 'Sale rejected and discarded'
      };
    }

    if (resolution === 'ACCEPT' || resolution === 'ADJUST') {
      const saleData = adjustments || offlineSale.saleData as unknown as OfflineSaleData;
      
      const sale = await this.createSaleFromOffline(
        offlineSale.tenantId,
        offlineSale.locationId,
        saleData
      );

      await prisma.pos_offline_sale.update({
        where: { id: offlineSaleId },
        data: {
          syncStatus: 'RESOLVED',
          syncedAt: new Date(),
          syncedSaleId: sale.id,
          resolvedAt: new Date(),
          resolvedById,
          resolutionAction: resolution
        }
      });

      return {
        success: true,
        syncedSaleId: sale.id,
        hasConflict: false,
        message: `Sale ${resolution === 'ADJUST' ? 'adjusted and ' : ''}synced`
      };
    }

    return {
      success: false,
      hasConflict: true,
      message: 'Invalid resolution action'
    };
  }

  /**
   * Get conflicts for review
   */
  static async getConflicts(tenantId: string, locationId?: string) {
    return prisma.pos_offline_sale.findMany({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        hasConflict: true,
        syncStatus: 'CONFLICT'
      },
      orderBy: { clientTimestamp: 'asc' }
    });
  }

  private static async generateSaleNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.pos_sale.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    return `SALE-${today}-${String(count + 1).padStart(5, '0')}`;
  }
}
