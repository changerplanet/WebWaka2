/**
 * CONFLICT CLASSIFIER
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Severity-based conflict classification for inventory events.
 * Determines conflict type and suggested resolution based on business rules.
 * 
 * CONFLICT SEVERITY LEVELS:
 * - NONE: No conflict, proceed normally
 * - MILD: Minor issue, can auto-resolve or accept with warning
 * - SEVERE: Significant issue, requires attention but can proceed
 * - CRITICAL: Blocking issue, requires manual resolution
 */

import { ChannelType, InventoryMode } from '@prisma/client';
import {
  ChannelSource,
  ConflictDetails,
  ConflictSeverity,
  ConflictType,
  StockEvent,
} from './types';

export interface StockContext {
  availableQuantity: number;
  reservedQuantity: number;
  currentPrice?: number;
  inventoryMode: InventoryMode;
  allocatedQuantity?: number | null;
  channelStatus: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  productStatus: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
  productName?: string;
}

export class ConflictClassifier {
  private static readonly MILD_OVERSELL_THRESHOLD = 2;
  private static readonly SEVERE_OVERSELL_THRESHOLD = 10;
  private static readonly MINOR_PRICE_VARIANCE_PERCENT = 5;
  private static readonly MAJOR_PRICE_VARIANCE_PERCENT = 15;

  static classify(
    event: StockEvent,
    context: StockContext
  ): ConflictDetails {
    if (context.productStatus !== 'ACTIVE') {
      return this.createConflict(
        'PRODUCT_UNAVAILABLE',
        'CRITICAL',
        event,
        context,
        `Product is ${context.productStatus.toLowerCase()}`
      );
    }

    if (context.channelStatus === 'INACTIVE') {
      return this.createConflict(
        'CHANNEL_DISABLED',
        'CRITICAL',
        event,
        context,
        `Channel ${event.channel} is disabled for this product`
      );
    }

    if (context.channelStatus === 'PAUSED') {
      return this.createConflict(
        'CHANNEL_DISABLED',
        'SEVERE',
        event,
        context,
        `Channel ${event.channel} is paused, new orders not accepted`
      );
    }

    if (this.isSaleEvent(event.eventType)) {
      const stockConflict = this.checkStockConflict(event, context);
      if (stockConflict.type !== 'NONE') {
        return stockConflict;
      }

      if (event.unitPrice !== undefined && context.currentPrice !== undefined) {
        const priceConflict = this.checkPriceConflict(event, context);
        if (priceConflict.type !== 'NONE') {
          return priceConflict;
        }
      }
    }

    return this.createNoConflict(event, context);
  }

  private static isSaleEvent(eventType: string): boolean {
    return ['SALE', 'PARKHUB_BOOKING'].includes(eventType);
  }

  private static checkStockConflict(
    event: StockEvent,
    context: StockContext
  ): ConflictDetails {
    const requestedQty = Math.abs(event.quantity);
    let effectiveAvailable = context.availableQuantity;

    if (context.inventoryMode === 'ALLOCATED' && context.allocatedQuantity != null) {
      effectiveAvailable = Math.min(context.allocatedQuantity, context.availableQuantity);
    }

    if (context.inventoryMode === 'UNLIMITED') {
      return this.createNoConflict(event, context);
    }

    if (requestedQty > effectiveAvailable) {
      const shortage = requestedQty - effectiveAvailable;

      if (shortage <= this.MILD_OVERSELL_THRESHOLD) {
        return this.createConflict(
          'OVERSELL_MILD',
          'MILD',
          event,
          context,
          `Minor oversell of ${shortage} unit(s) - can be fulfilled with slight delay`,
          'ACCEPT',
          shortage,
          undefined
        );
      }

      if (shortage <= this.SEVERE_OVERSELL_THRESHOLD) {
        return this.createConflict(
          'OVERSELL_SEVERE',
          'SEVERE',
          event,
          context,
          `Oversell of ${shortage} unit(s) - requires attention`,
          'PARTIAL',
          shortage,
          undefined
        );
      }

      return this.createConflict(
        'OVERSELL_SEVERE',
        'CRITICAL',
        event,
        context,
        `Critical oversell of ${shortage} unit(s) - insufficient stock`,
        'MANUAL_REVIEW',
        shortage,
        undefined
      );
    }

    if (context.inventoryMode === 'ALLOCATED' && context.allocatedQuantity != null) {
      if (requestedQty > context.allocatedQuantity) {
        return this.createConflict(
          'ALLOCATION_EXCEEDED',
          'SEVERE',
          event,
          context,
          `Requested ${requestedQty} exceeds channel allocation of ${context.allocatedQuantity}`,
          'PARTIAL',
          requestedQty - context.allocatedQuantity,
          undefined
        );
      }
    }

    return this.createNoConflict(event, context);
  }

  private static checkPriceConflict(
    event: StockEvent,
    context: StockContext
  ): ConflictDetails {
    if (event.unitPrice === undefined || context.currentPrice === undefined) {
      return this.createNoConflict(event, context);
    }

    const priceDiff = Math.abs(event.unitPrice - context.currentPrice);
    const percentDiff = (priceDiff / context.currentPrice) * 100;

    if (percentDiff <= this.MINOR_PRICE_VARIANCE_PERCENT) {
      return this.createNoConflict(event, context);
    }

    if (percentDiff <= this.MAJOR_PRICE_VARIANCE_PERCENT) {
      return this.createConflict(
        'PRICE_MISMATCH_MINOR',
        'MILD',
        event,
        context,
        `Price variance of ${percentDiff.toFixed(1)}% - within acceptable range`,
        'ACCEPT',
        undefined,
        percentDiff
      );
    }

    return this.createConflict(
      'PRICE_MISMATCH_MAJOR',
      'SEVERE',
      event,
      context,
      `Significant price variance of ${percentDiff.toFixed(1)}% detected`,
      'MANUAL_REVIEW',
      undefined,
      percentDiff
    );
  }

  private static createConflict(
    type: ConflictType,
    severity: ConflictSeverity,
    event: StockEvent,
    context: StockContext,
    message: string,
    suggestedResolution?: 'ACCEPT' | 'REJECT' | 'PARTIAL' | 'MANUAL_REVIEW',
    shortage?: number,
    priceVariance?: number
  ): ConflictDetails {
    return {
      type,
      severity,
      productId: event.productId,
      productName: context.productName,
      channel: event.channel,
      requestedQuantity: Math.abs(event.quantity),
      availableQuantity: context.availableQuantity,
      shortage,
      priceVariance,
      message,
      suggestedResolution,
      metadata: {
        eventId: event.id,
        eventType: event.eventType,
        referenceId: event.referenceId,
        isOffline: event.isOffline,
      },
    };
  }

  private static createNoConflict(
    event: StockEvent,
    context: StockContext
  ): ConflictDetails {
    return {
      type: 'NONE',
      severity: 'NONE',
      productId: event.productId,
      productName: context.productName,
      channel: event.channel,
      requestedQuantity: Math.abs(event.quantity),
      availableQuantity: context.availableQuantity,
      message: 'No conflict detected',
    };
  }

  static getSeverityPriority(severity: ConflictSeverity): number {
    const priorities: Record<ConflictSeverity, number> = {
      NONE: 0,
      MILD: 1,
      SEVERE: 2,
      CRITICAL: 3,
    };
    return priorities[severity];
  }

  static shouldBlock(conflict: ConflictDetails): boolean {
    return conflict.severity === 'CRITICAL';
  }

  static requiresManualResolution(conflict: ConflictDetails): boolean {
    return conflict.severity === 'SEVERE' || conflict.severity === 'CRITICAL';
  }
}
