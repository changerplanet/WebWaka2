/**
 * CONFLICT RESOLUTION SERVICE
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Manual resolution workflows for inventory conflicts.
 * User-triggered only - NO automation.
 * 
 * RESOLUTION ACTIONS:
 * - ACCEPT: Accept the event as-is despite conflict
 * - REJECT: Reject the event and discard
 * - PARTIAL: Partial fulfillment (reduced quantity)
 * - ADJUST: Adjust inventory to match actual counts
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ConflictDetails,
  ConflictSeverity,
  ConflictType,
  StockEvent,
  EventProcessingResult,
} from './types';
import { InventorySyncEngine } from './inventory-sync-engine';

export type ResolutionAction = 'ACCEPT' | 'REJECT' | 'PARTIAL' | 'ADJUST';

export interface ConflictRecord {
  id: string;
  tenantId: string;
  eventId: string;
  offlineSaleId?: string;
  channel: string;
  eventType: string;
  productId: string;
  productName: string;
  conflictType: ConflictType;
  conflictSeverity: ConflictSeverity;
  requestedQuantity: number;
  availableQuantity: number;
  shortage?: number;
  priceVariance?: number;
  message: string;
  suggestedResolution?: ResolutionAction;
  status: 'PENDING' | 'RESOLVED' | 'EXPIRED';
  resolutionAction?: ResolutionAction;
  resolutionNotes?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ResolutionRequest {
  conflictId?: string;
  offlineSaleId?: string;
  action: ResolutionAction;
  adjustedQuantity?: number;
  notes?: string;
  resolvedById: string;
  resolvedByName: string;
}

export interface ResolutionResult {
  success: boolean;
  message: string;
  conflictId?: string;
  eventResult?: EventProcessingResult;
  stockAdjusted?: boolean;
  newStockLevel?: number;
}

export class ConflictResolutionService {
  private engine: InventorySyncEngine;

  constructor(private tenantId: string) {
    this.engine = new InventorySyncEngine(tenantId);
  }

  async getPendingConflicts(
    options?: {
      channel?: string;
      severityFilter?: ConflictSeverity;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ conflicts: ConflictRecord[]; total: number }> {
    const { channel, severityFilter, limit = 50, offset = 0 } = options || {};

    const offlineSales = await prisma.pos_offline_sale.findMany({
      where: {
        tenantId: this.tenantId,
        hasConflict: true,
        syncStatus: 'CONFLICT',
      },
      orderBy: { clientTimestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const conflicts: ConflictRecord[] = [];

    for (const sale of offlineSales) {
      const saleData = sale.saleData as Record<string, unknown>;
      const conflictDetails = sale.conflictDetails as Record<string, unknown>;

      const conflict: ConflictRecord = {
        id: `conflict_${sale.id}`,
        tenantId: sale.tenantId,
        eventId: sale.clientSaleId,
        offlineSaleId: sale.id,
        channel: 'POS',
        eventType: 'SALE',
        productId: (conflictDetails?.productId as string) || '',
        productName: (conflictDetails?.productName as string) || 'Unknown',
        conflictType: this.mapConflictType(sale.conflictType || ''),
        conflictSeverity: this.getSeverityFromType(sale.conflictType || ''),
        requestedQuantity: (conflictDetails?.requestedQty as number) || 0,
        availableQuantity: (conflictDetails?.availableQty as number) || 0,
        shortage: (conflictDetails?.shortage as number) || 0,
        priceVariance: (conflictDetails?.percentDiff as number) || undefined,
        message: this.getConflictMessage(sale.conflictType || '', conflictDetails),
        suggestedResolution: this.getSuggestedResolution(sale.conflictType || ''),
        status: 'PENDING',
        createdAt: sale.clientTimestamp,
        metadata: {
          staffId: saleData.staffId,
          staffName: saleData.staffName,
          locationId: sale.locationId,
        },
      };

      if (severityFilter && conflict.conflictSeverity !== severityFilter) {
        continue;
      }

      conflicts.push(conflict);
    }

    const total = await prisma.pos_offline_sale.count({
      where: {
        tenantId: this.tenantId,
        hasConflict: true,
        syncStatus: 'CONFLICT',
      },
    });

    return { conflicts, total };
  }

  async resolveConflict(request: ResolutionRequest): Promise<ResolutionResult> {
    if (!request.offlineSaleId) {
      return { success: false, message: 'offlineSaleId is required' };
    }

    const offlineSale = await prisma.pos_offline_sale.findFirst({
      where: {
        id: request.offlineSaleId,
        tenantId: this.tenantId,
        hasConflict: true,
        syncStatus: 'CONFLICT',
      },
    });

    if (!offlineSale) {
      return { success: false, message: 'Conflict not found or already resolved' };
    }

    const saleData = offlineSale.saleData as Record<string, unknown>;
    const conflictDetails = offlineSale.conflictDetails as Record<string, unknown>;

    switch (request.action) {
      case 'REJECT': {
        await prisma.pos_offline_sale.update({
          where: { id: request.offlineSaleId },
          data: {
            syncStatus: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: request.resolvedById,
            resolutionAction: 'REJECT',
          },
        });

        return {
          success: true,
          message: 'Conflict rejected - sale discarded',
          conflictId: `conflict_${offlineSale.id}`,
        };
      }

      case 'ACCEPT': {
        const items = (saleData.items as Array<Record<string, unknown>>) || [];

        for (const item of items) {
          const event: StockEvent = {
            id: `resolved_${offlineSale.id}_${item.productId}`,
            tenantId: this.tenantId,
            channel: 'POS',
            eventType: 'SALE',
            productId: item.productId as string,
            variantId: (item.variantId as string) || null,
            locationId: offlineSale.locationId,
            quantity: -(item.quantity as number),
            unitPrice: item.unitPrice as number,
            referenceType: 'pos_offline_sale_resolved',
            referenceId: offlineSale.id,
            performedById: request.resolvedById,
            performedByName: request.resolvedByName,
            clientTimestamp: offlineSale.clientTimestamp,
            serverTimestamp: new Date(),
            isOffline: true,
            offlineEventId: offlineSale.clientSaleId,
          };

          await this.engine.processEvent(event);
        }

        await prisma.pos_offline_sale.update({
          where: { id: request.offlineSaleId },
          data: {
            syncStatus: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: request.resolvedById,
            resolutionAction: 'ACCEPT',
          },
        });

        return {
          success: true,
          message: 'Conflict accepted - sale processed',
          conflictId: `conflict_${offlineSale.id}`,
        };
      }

      case 'PARTIAL': {
        if (request.adjustedQuantity === undefined) {
          return { success: false, message: 'adjustedQuantity is required for PARTIAL resolution' };
        }

        const productId = conflictDetails?.productId as string;
        const originalItems = (saleData.items as Array<Record<string, unknown>>) || [];

        const adjustedItems = originalItems.map(item => {
          if (item.productId === productId) {
            return {
              ...item,
              quantity: request.adjustedQuantity,
              lineTotal: (item.unitPrice as number) * request.adjustedQuantity!,
            };
          }
          return item;
        });

        for (const item of adjustedItems) {
          const event: StockEvent = {
            id: `partial_${offlineSale.id}_${item.productId}`,
            tenantId: this.tenantId,
            channel: 'POS',
            eventType: 'SALE',
            productId: item.productId as string,
            variantId: (item.variantId as string) || null,
            locationId: offlineSale.locationId,
            quantity: -(item.quantity as number),
            unitPrice: item.unitPrice as number,
            referenceType: 'pos_offline_sale_partial',
            referenceId: offlineSale.id,
            performedById: request.resolvedById,
            performedByName: request.resolvedByName,
            clientTimestamp: offlineSale.clientTimestamp,
            serverTimestamp: new Date(),
            isOffline: true,
            offlineEventId: offlineSale.clientSaleId,
          };

          await this.engine.processEvent(event);
        }

        await prisma.pos_offline_sale.update({
          where: { id: request.offlineSaleId },
          data: {
            syncStatus: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: request.resolvedById,
            resolutionAction: 'ADJUST',
            saleData: {
              ...saleData,
              items: adjustedItems,
              originalItems,
              adjustmentNotes: request.notes,
            } as Prisma.InputJsonValue,
          },
        });

        return {
          success: true,
          message: `Conflict resolved with partial fulfillment (${request.adjustedQuantity} units)`,
          conflictId: `conflict_${offlineSale.id}`,
        };
      }

      case 'ADJUST': {
        const productId = conflictDetails?.productId as string;
        const actualStock = conflictDetails?.availableQty as number;

        const inventoryLevel = await prisma.inventoryLevel.findFirst({
          where: {
            tenantId: this.tenantId,
            productId,
          },
        });

        if (inventoryLevel) {
          await prisma.inventoryLevel.update({
            where: { id: inventoryLevel.id },
            data: {
              quantityOnHand: actualStock,
              quantityAvailable: Math.max(0, actualStock - inventoryLevel.quantityReserved),
            },
          });

          await prisma.inv_stock_movements.create({
            data: {
              id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              tenantId: this.tenantId,
              productId,
              locationId: inventoryLevel.locationId,
              reason: 'AUDIT_CORRECTION',
              quantity: actualStock - inventoryLevel.quantityOnHand,
              quantityBefore: inventoryLevel.quantityOnHand,
              referenceType: 'conflict_resolution',
              referenceId: offlineSale.id,
              performedBy: request.resolvedById,
              performedByName: request.resolvedByName,
              notes: request.notes || 'Inventory adjusted during conflict resolution',
              isOfflineCreated: false,
              createdAt: new Date(),
            },
          });
        }

        await prisma.pos_offline_sale.update({
          where: { id: request.offlineSaleId },
          data: {
            syncStatus: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedById: request.resolvedById,
            resolutionAction: 'ADJUST',
          },
        });

        return {
          success: true,
          message: 'Inventory adjusted to match actual count',
          conflictId: `conflict_${offlineSale.id}`,
          stockAdjusted: true,
          newStockLevel: actualStock,
        };
      }

      default:
        return { success: false, message: 'Invalid resolution action' };
    }
  }

  async getConflictStats(): Promise<{
    totalPending: number;
    bySeverity: Record<ConflictSeverity, number>;
    byType: Record<string, number>;
    oldestPendingAt: Date | null;
  }> {
    const conflicts = await prisma.pos_offline_sale.findMany({
      where: {
        tenantId: this.tenantId,
        hasConflict: true,
        syncStatus: 'CONFLICT',
      },
      select: {
        conflictType: true,
        clientTimestamp: true,
      },
    });

    const bySeverity: Record<ConflictSeverity, number> = {
      NONE: 0,
      MILD: 0,
      SEVERE: 0,
      CRITICAL: 0,
    };

    const byType: Record<string, number> = {};

    let oldestPendingAt: Date | null = null;

    for (const conflict of conflicts) {
      const type = conflict.conflictType || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;

      const severity = this.getSeverityFromType(type);
      bySeverity[severity]++;

      if (!oldestPendingAt || conflict.clientTimestamp < oldestPendingAt) {
        oldestPendingAt = conflict.clientTimestamp;
      }
    }

    return {
      totalPending: conflicts.length,
      bySeverity,
      byType,
      oldestPendingAt,
    };
  }

  private mapConflictType(type: string): ConflictType {
    const mapping: Record<string, ConflictType> = {
      OVERSELL: 'OVERSELL_SEVERE',
      PRICE_MISMATCH: 'PRICE_MISMATCH_MAJOR',
      PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
    };
    return mapping[type] || 'NONE';
  }

  private getSeverityFromType(type: string): ConflictSeverity {
    const mapping: Record<string, ConflictSeverity> = {
      OVERSELL: 'SEVERE',
      PRICE_MISMATCH: 'MILD',
      PRODUCT_UNAVAILABLE: 'CRITICAL',
    };
    return mapping[type] || 'NONE';
  }

  private getConflictMessage(type: string, details: Record<string, unknown>): string {
    switch (type) {
      case 'OVERSELL':
        return `Oversell: requested ${details.requestedQty} but only ${details.availableQty} available`;
      case 'PRICE_MISMATCH':
        return `Price mismatch: sale price differs by ${details.percentDiff}%`;
      case 'PRODUCT_UNAVAILABLE':
        return `Product unavailable: status is ${details.status}`;
      default:
        return 'Unknown conflict';
    }
  }

  private getSuggestedResolution(type: string): ResolutionAction | undefined {
    const mapping: Record<string, ResolutionAction> = {
      OVERSELL: 'PARTIAL',
      PRICE_MISMATCH: 'ACCEPT',
      PRODUCT_UNAVAILABLE: 'REJECT',
    };
    return mapping[type];
  }
}

export function createConflictResolutionService(tenantId: string): ConflictResolutionService {
  return new ConflictResolutionService(tenantId);
}
