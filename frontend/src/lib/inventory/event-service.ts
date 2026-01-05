/**
 * MODULE 1: Inventory & Warehouse Management
 * Event Service - Enhanced event emission with proper schemas
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BaseInventoryEvent,
  InventoryEventType,
  INVENTORY_EVENT_TYPES,
  IDEMPOTENCY_RULES,
  validateEvent,
  isEventProcessed,
  markEventProcessed,
  EVENT_HANDLERS,
} from './event-registry';

// ============================================================================
// EVENT BUS (In-memory - replace with Kafka/SQS in production)
// ============================================================================

type EventHandler = (event: BaseInventoryEvent) => Promise<void>;
const eventSubscribers: Map<InventoryEventType | '*', EventHandler[]> = new Map();

/**
 * Subscribe to events
 */
export function subscribeToEvent(
  eventType: InventoryEventType | '*',
  handler: EventHandler
): () => void {
  const handlers = eventSubscribers.get(eventType) || [];
  handlers.push(handler);
  eventSubscribers.set(eventType, handlers);

  // Return unsubscribe function
  return () => {
    const current = eventSubscribers.get(eventType) || [];
    eventSubscribers.set(
      eventType,
      current.filter(h => h !== handler)
    );
  };
}

/**
 * Publish an event
 */
export async function publishEvent(event: BaseInventoryEvent): Promise<void> {
  // Validate event
  const validation = validateEvent(event);
  if (!validation.valid) {
    console.error('[Event Service] Invalid event:', validation.errors);
    throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
  }

  // Check idempotency
  if (isEventProcessed(event.idempotencyKey)) {
    console.log('[Event Service] Event already processed:', event.idempotencyKey);
    return;
  }

  // Log event
  console.log(`[Event Service] Publishing ${event.eventType}:`, {
    eventId: event.eventId,
    tenantId: event.tenantId,
    idempotencyKey: event.idempotencyKey,
  });

  // Get handlers
  const specificHandlers = eventSubscribers.get(event.eventType as InventoryEventType) || [];
  const wildcardHandlers = eventSubscribers.get('*') || [];
  const allHandlers = [...specificHandlers, ...wildcardHandlers];

  // Execute handlers
  for (const handler of allHandlers) {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[Event Service] Handler error for ${event.eventType}:`, error);
      // In production, would retry or dead-letter
    }
  }

  // Mark as processed
  markEventProcessed(event.idempotencyKey);
}

// ============================================================================
// EVENT FACTORY
// ============================================================================

export class InventoryEventFactory {
  /**
   * Create base event structure
   */
  private static createBase(
    eventType: InventoryEventType,
    tenantId: string,
    idempotencyKey: string,
    payload: Record<string, unknown>,
    options?: {
      actor?: { userId: string; userName?: string; type?: 'USER' | 'SYSTEM' | 'SCHEDULER' };
      correlationId?: string;
      causationId?: string;
      isOffline?: boolean;
      offlineId?: string;
    }
  ): BaseInventoryEvent {
    return {
      eventId: uuidv4(),
      eventType,
      tenantId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      idempotencyKey,
      source: {
        module: 'inventory-warehouse-management',
        service: 'inventory-service',
        action: eventType.split('.').pop() || 'unknown',
      },
      actor: options?.actor ? {
        userId: options.actor.userId,
        userName: options.actor.userName,
        type: options.actor.type || 'USER',
      } : undefined,
      correlationId: options?.correlationId,
      causationId: options?.causationId,
      payload,
      metadata: {
        isOffline: options?.isOffline,
        offlineId: options?.offlineId,
        environment: process.env.NODE_ENV,
      },
    };
  }

  /**
   * Stock Transfer Requested
   */
  static stockTransferRequested(
    tenantId: string,
    transfer: {
      id: string;
      transferNumber: string;
      fromWarehouse: { id: string; name: string; locationId: string };
      toWarehouse: { id: string; name: string; locationId: string };
      items: Array<{
        productId: string;
        variantId?: string;
        sku?: string;
        productName: string;
        quantityRequested: number;
      }>;
      priority: string;
      reason?: string;
    },
    actor?: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    const totalQuantity = transfer.items.reduce((sum, i) => sum + i.quantityRequested, 0);

    return this.createBase(
      INVENTORY_EVENT_TYPES.STOCK_TRANSFER_REQUESTED,
      tenantId,
      IDEMPOTENCY_RULES.TRANSFER(transfer.id, 'requested'),
      {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromWarehouse: transfer.fromWarehouse,
        toWarehouse: transfer.toWarehouse,
        items: transfer.items,
        priority: transfer.priority,
        reason: transfer.reason,
        totalItems: transfer.items.length,
        totalQuantity,
      },
      { actor: actor ? { ...actor, type: 'USER' } : undefined }
    );
  }

  /**
   * Stock Transfer Shipped
   */
  static stockTransferShipped(
    tenantId: string,
    transfer: {
      id: string;
      transferNumber: string;
      fromWarehouse: { id: string; locationId: string };
      items: Array<{
        productId: string;
        variantId?: string;
        quantityShipped: number;
      }>;
      shippingDetails?: { method?: string; trackingNumber?: string; carrier?: string };
    },
    actor?: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    // Build inventory deltas
    const inventoryDeltas = transfer.items
      .filter(i => i.quantityShipped > 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        locationId: transfer.fromWarehouse.locationId,
        delta: -i.quantityShipped, // Negative for outbound
        reason: 'TRANSFER_OUT' as const,
      }));

    return this.createBase(
      INVENTORY_EVENT_TYPES.STOCK_TRANSFER_SHIPPED,
      tenantId,
      IDEMPOTENCY_RULES.TRANSFER(transfer.id, 'shipped'),
      {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromWarehouse: transfer.fromWarehouse,
        shippedAt: new Date().toISOString(),
        shippingDetails: transfer.shippingDetails,
        items: transfer.items,
        inventoryDeltas,
      },
      { actor: actor ? { ...actor, type: 'USER' } : undefined }
    );
  }

  /**
   * Stock Transfer Received
   */
  static stockTransferReceived(
    tenantId: string,
    transfer: {
      id: string;
      transferNumber: string;
      toWarehouse: { id: string; locationId: string };
      items: Array<{
        productId: string;
        variantId?: string;
        quantityShipped: number;
        quantityReceived: number;
        varianceReason?: string;
      }>;
    },
    actor: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    // Build inventory deltas
    const inventoryDeltas = transfer.items
      .filter(i => i.quantityReceived > 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        locationId: transfer.toWarehouse.locationId,
        delta: i.quantityReceived, // Positive for inbound
        reason: 'TRANSFER_IN' as const,
      }));

    return this.createBase(
      INVENTORY_EVENT_TYPES.STOCK_TRANSFER_RECEIVED,
      tenantId,
      IDEMPOTENCY_RULES.TRANSFER(transfer.id, 'received'),
      {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        toWarehouse: transfer.toWarehouse,
        receivedAt: new Date().toISOString(),
        receivedBy: actor,
        items: transfer.items.map(i => ({
          ...i,
          variance: i.quantityReceived - i.quantityShipped,
        })),
        inventoryDeltas,
      },
      { actor: { ...actor, type: 'USER' } }
    );
  }

  /**
   * Inventory Adjustment Approved
   */
  static inventoryAdjustmentApproved(
    tenantId: string,
    adjustment: {
      auditId?: string;
      adjustmentId?: string;
      locationId: string;
      items: Array<{
        productId: string;
        variantId?: string;
        variance: number;
      }>;
    },
    actor: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    const inventoryDeltas = adjustment.items
      .filter(i => i.variance !== 0)
      .map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        locationId: adjustment.locationId,
        delta: i.variance,
        reason: adjustment.auditId ? 'AUDIT_CORRECTION' as const : 'MANUAL_ADJUSTMENT' as const,
      }));

    return this.createBase(
      INVENTORY_EVENT_TYPES.INVENTORY_ADJUSTMENT_APPROVED,
      tenantId,
      IDEMPOTENCY_RULES.ADJUSTMENT(
        adjustment.auditId || adjustment.adjustmentId || uuidv4(),
        adjustment.auditId ? 'audit' : 'manual'
      ),
      {
        auditId: adjustment.auditId,
        adjustmentId: adjustment.adjustmentId,
        approvedBy: actor,
        approvedAt: new Date().toISOString(),
        inventoryDeltas,
      },
      { actor: { ...actor, type: 'USER' } }
    );
  }

  /**
   * Inventory Audit Started
   */
  static inventoryAuditStarted(
    tenantId: string,
    audit: {
      id: string;
      auditNumber: string;
      auditType: string;
      warehouse: { id: string; name: string; locationId: string };
      totalItems: number;
    },
    supervisor?: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    return this.createBase(
      INVENTORY_EVENT_TYPES.INVENTORY_AUDIT_STARTED,
      tenantId,
      IDEMPOTENCY_RULES.AUDIT(audit.id, 'started'),
      {
        auditId: audit.id,
        auditNumber: audit.auditNumber,
        auditType: audit.auditType,
        warehouse: audit.warehouse,
        totalItems: audit.totalItems,
        supervisor,
        startedAt: new Date().toISOString(),
      },
      { actor: supervisor ? { ...supervisor, type: 'USER' } : undefined }
    );
  }

  /**
   * Inventory Audit Completed
   */
  static inventoryAuditCompleted(
    tenantId: string,
    audit: {
      id: string;
      auditNumber: string;
      warehouse: { id: string; name: string };
      summary: {
        totalItemsCounted: number;
        itemsWithVariance: number;
        itemsWithPositiveVariance: number;
        itemsWithNegativeVariance: number;
        totalVarianceValue: number;
        variancePercentage: number;
        currency: string;
      };
      adjustmentsApplied: number;
    },
    approver?: { userId: string; userName?: string }
  ): BaseInventoryEvent {
    return this.createBase(
      INVENTORY_EVENT_TYPES.INVENTORY_AUDIT_COMPLETED,
      tenantId,
      IDEMPOTENCY_RULES.AUDIT(audit.id, 'completed'),
      {
        auditId: audit.id,
        auditNumber: audit.auditNumber,
        warehouse: audit.warehouse,
        completedAt: new Date().toISOString(),
        summary: audit.summary,
        adjustmentsApplied: audit.adjustmentsApplied,
        approvedBy: approver,
      },
      { actor: approver ? { ...approver, type: 'USER' } : undefined }
    );
  }

  /**
   * Reorder Suggested
   */
  static reorderSuggested(
    tenantId: string,
    suggestion: {
      id: string;
      product: { id: string; variantId?: string; name: string; sku?: string };
      location: { id: string; name: string };
      stockStatus: {
        currentQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
        reorderPoint?: number;
      };
      suggestedQuantity: number;
      estimatedCost?: number;
      currency: string;
      urgency: string;
      reason: string;
      ruleId?: string;
      ruleName?: string;
      supplier?: { id: string; name: string };
      expiresAt: Date;
    }
  ): BaseInventoryEvent {
    return this.createBase(
      INVENTORY_EVENT_TYPES.REORDER_SUGGESTED,
      tenantId,
      IDEMPOTENCY_RULES.REORDER_SUGGESTION(
        suggestion.ruleId || 'manual',
        suggestion.product.id,
        suggestion.location.id
      ),
      {
        suggestionId: suggestion.id,
        product: suggestion.product,
        location: suggestion.location,
        stockStatus: suggestion.stockStatus,
        suggestion: {
          quantity: suggestion.suggestedQuantity,
          estimatedCost: suggestion.estimatedCost,
          currency: suggestion.currency,
          urgency: suggestion.urgency,
        },
        supplier: suggestion.supplier,
        reason: suggestion.reason,
        ruleId: suggestion.ruleId,
        ruleName: suggestion.ruleName,
        expiresAt: suggestion.expiresAt.toISOString(),
      },
      { actor: { userId: 'system', type: 'SYSTEM' } }
    );
  }

  /**
   * Low Stock Alert
   */
  static lowStockAlert(
    tenantId: string,
    alerts: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      sku?: string;
      locationId: string;
      locationName: string;
      currentQuantity: number;
      reorderPoint: number;
      urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    }>
  ): BaseInventoryEvent {
    const summary = {
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.urgency === 'CRITICAL').length,
      high: alerts.filter(a => a.urgency === 'HIGH').length,
      normal: alerts.filter(a => a.urgency === 'NORMAL').length,
      low: alerts.filter(a => a.urgency === 'LOW').length,
    };

    // Use first alert for idempotency (batch alerts)
    const firstAlert = alerts[0];
    const idempotencyKey = firstAlert
      ? IDEMPOTENCY_RULES.LOW_STOCK_ALERT(firstAlert.productId, firstAlert.locationId)
      : `low_stock_batch:${new Date().toISOString().split('T')[0]}`;

    return this.createBase(
      INVENTORY_EVENT_TYPES.LOW_STOCK_ALERT,
      tenantId,
      idempotencyKey,
      { alerts, summary },
      { actor: { userId: 'system', type: 'SYSTEM' } }
    );
  }

  /**
   * Stock Movement Recorded
   */
  static stockMovementRecorded(
    tenantId: string,
    movement: {
      id: string;
      product: { id: string; variantId?: string; name: string; sku?: string };
      location: { id: string; name: string };
      quantity: number;
      quantityBefore: number;
      reason: string;
      referenceType?: string;
      referenceId?: string;
      batch?: { batchNumber?: string; lotNumber?: string; expiryDate?: string };
    },
    actor?: { userId: string; userName?: string },
    offlineId?: string
  ): BaseInventoryEvent {
    return this.createBase(
      INVENTORY_EVENT_TYPES.STOCK_MOVEMENT_RECORDED,
      tenantId,
      IDEMPOTENCY_RULES.MOVEMENT(offlineId),
      {
        movementId: movement.id,
        product: movement.product,
        location: movement.location,
        movement: {
          quantity: movement.quantity,
          quantityBefore: movement.quantityBefore,
          quantityAfter: movement.quantityBefore + movement.quantity,
          reason: movement.reason,
          referenceType: movement.referenceType,
          referenceId: movement.referenceId,
        },
        batch: movement.batch,
      },
      {
        actor: actor ? { ...actor, type: 'USER' } : undefined,
        isOffline: !!offlineId,
        offlineId,
      }
    );
  }
}

// ============================================================================
// CORE EVENT HANDLERS (Apply inventory changes)
// ============================================================================

import { prisma } from '../prisma';

// Register Core inventory handlers
subscribeToEvent(INVENTORY_EVENT_TYPES.STOCK_TRANSFER_SHIPPED, async (event) => {
  const { inventoryDeltas } = event.payload as { inventoryDeltas: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    delta: number;
    reason: string;
  }> };

  for (const delta of inventoryDeltas) {
    const existing = await prisma.inventoryLevel.findFirst({
      where: {
        productId: delta.productId,
        variantId: delta.variantId || null,
        locationId: delta.locationId,
      },
    });

    if (existing) {
      await prisma.inventoryLevel.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: { increment: delta.delta },
          quantityAvailable: { increment: delta.delta },
        },
      });
      console.log(`[Core] Applied delta: ${delta.delta} to ${delta.productId} at ${delta.locationId}`);
    }
  }
});

subscribeToEvent(INVENTORY_EVENT_TYPES.STOCK_TRANSFER_RECEIVED, async (event) => {
  const { inventoryDeltas, tenantId } = event.payload as {
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number;
      reason: string;
    }>;
    tenantId?: string;
  };

  for (const delta of inventoryDeltas) {
    const existing = await prisma.inventoryLevel.findFirst({
      where: {
        productId: delta.productId,
        variantId: delta.variantId || null,
        locationId: delta.locationId,
      },
    });

    if (existing) {
      await prisma.inventoryLevel.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: { increment: delta.delta },
          quantityAvailable: { increment: delta.delta },
        },
      });
    } else {
      // Create new inventory level at destination
      const product = await prisma.product.findUnique({
        where: { id: delta.productId },
        select: { tenantId: true },
      });

      if (product) {
        await prisma.inventoryLevel.create({
          data: {
            tenantId: product.tenantId,
            productId: delta.productId,
            variantId: delta.variantId || null,
            locationId: delta.locationId,
            quantityOnHand: delta.delta,
            quantityAvailable: delta.delta,
            quantityReserved: 0,
            quantityIncoming: 0,
          },
        });
      }
    }
    console.log(`[Core] Applied delta: ${delta.delta} to ${delta.productId} at ${delta.locationId}`);
  }
});

subscribeToEvent(INVENTORY_EVENT_TYPES.INVENTORY_ADJUSTMENT_APPROVED, async (event) => {
  const { inventoryDeltas } = event.payload as { inventoryDeltas: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    delta: number;
    reason: string;
  }> };

  for (const delta of inventoryDeltas) {
    const existing = await prisma.inventoryLevel.findFirst({
      where: {
        productId: delta.productId,
        variantId: delta.variantId || null,
        locationId: delta.locationId,
      },
    });

    if (existing) {
      await prisma.inventoryLevel.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: { increment: delta.delta },
          quantityAvailable: { increment: delta.delta },
          lastCountedAt: new Date(),
        },
      });
      console.log(`[Core] Applied adjustment: ${delta.delta} to ${delta.productId}`);
    }
  }
});

// Wildcard handler for audit logging
subscribeToEvent('*', async (event) => {
  console.log(`[Audit Log] ${event.eventType}:`, {
    eventId: event.eventId,
    tenantId: event.tenantId,
    actor: event.actor,
    timestamp: event.timestamp,
  });
});
