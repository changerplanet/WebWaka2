/**
 * MODULE 1: Inventory & Warehouse Management
 * Event Emitter - Publishes events for Core to consume
 * 
 * CRITICAL: This module does NOT mutate Core inventory directly.
 * All inventory changes are communicated via events.
 * Core is responsible for applying changes to InventoryLevel.
 */

import { prisma } from '../prisma';
import { InventoryEvent, InventoryEventType } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT QUEUE (In-memory for now, can be replaced with Redis/SQS)
// ============================================================================

type EventHandler = (event: InventoryEvent) => Promise<void>;
const eventHandlers: Map<InventoryEventType, EventHandler[]> = new Map();

/**
 * Register an event handler
 */
export function registerEventHandler(
  eventType: InventoryEventType,
  handler: EventHandler
): void {
  const handlers = eventHandlers.get(eventType) || [];
  handlers.push(handler);
  eventHandlers.set(eventType, handlers);
}

/**
 * Emit an inventory event
 * Events are processed asynchronously and idempotently
 */
export async function emitInventoryEvent(
  event: Omit<InventoryEvent, 'id' | 'timestamp'>
): Promise<string> {
  const eventId = uuidv4();
  const fullEvent: InventoryEvent = {
    ...event,
    id: eventId,
    timestamp: new Date(),
  };

  // Log event for debugging
  console.log(`[Inventory Event] ${event.type}:`, {
    eventId,
    tenantId: event.tenantId,
    payload: event.payload,
  });

  // Process handlers (in production, this would be a message queue)
  const handlers = eventHandlers.get(event.type as InventoryEventType) || [];
  
  for (const handler of handlers) {
    try {
      await handler(fullEvent);
    } catch (error) {
      console.error(`[Inventory Event] Handler error for ${event.type}:`, error);
      // In production, would retry or dead-letter
    }
  }

  return eventId;
}

// ============================================================================
// CORE EVENT HANDLERS
// These handlers apply inventory changes to Core InventoryLevel
// ============================================================================

/**
 * Handle STOCK_TRANSFER_SHIPPED - Decrease inventory at source
 */
registerEventHandler('STOCK_TRANSFER_SHIPPED', async (event) => {
  const { inventoryDeltas } = event.payload as {
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number;
      reason: string;
    }>;
  };

  for (const delta of inventoryDeltas) {
    // Find or create inventory level
    const existing = await prisma.inventoryLevel.findFirst({
      where: {
        productId: delta.productId,
        variantId: delta.variantId || null,
        locationId: delta.locationId,
      },
    });

    if (existing) {
      // Update inventory - decrease for shipped items
      await prisma.inventoryLevel.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: { increment: delta.delta }, // delta is negative
          quantityAvailable: { increment: delta.delta },
          updatedAt: new Date(),
        },
      });
    }

    console.log(`[Core] Applied inventory delta:`, {
      productId: delta.productId,
      locationId: delta.locationId,
      delta: delta.delta,
      reason: delta.reason,
    });
  }
});

/**
 * Handle STOCK_TRANSFER_RECEIVED - Increase inventory at destination
 */
registerEventHandler('STOCK_TRANSFER_RECEIVED', async (event) => {
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
    // Find existing inventory level
    const existing = await prisma.inventoryLevel.findFirst({
      where: {
        productId: delta.productId,
        variantId: delta.variantId || null,
        locationId: delta.locationId,
      },
    });

    if (existing) {
      // Update inventory - increase for received items
      await prisma.inventoryLevel.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: { increment: delta.delta }, // delta is positive
          quantityAvailable: { increment: delta.delta },
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new inventory level at destination
      // Need to get tenantId from the event
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

    console.log(`[Core] Applied inventory delta:`, {
      productId: delta.productId,
      locationId: delta.locationId,
      delta: delta.delta,
      reason: delta.reason,
    });
  }
});

/**
 * Handle INVENTORY_ADJUSTMENT_APPROVED - Apply audit corrections
 */
registerEventHandler('INVENTORY_ADJUSTMENT_APPROVED', async (event) => {
  const { inventoryDeltas } = event.payload as {
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number;
      reason: string;
    }>;
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
          lastCountedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`[Core] Applied audit adjustment:`, {
      productId: delta.productId,
      locationId: delta.locationId,
      delta: delta.delta,
    });
  }
});

// ============================================================================
// OFFLINE EVENT QUEUE
// For events created while offline, to be synced later
// ============================================================================

export interface OfflineEvent {
  offlineId: string;
  event: Omit<InventoryEvent, 'id' | 'timestamp'>;
  createdAt: Date;
  syncedAt?: Date;
  syncError?: string;
}

const offlineQueue: Map<string, OfflineEvent> = new Map();

/**
 * Queue an event for later sync (used by offline clients)
 */
export function queueOfflineEvent(
  offlineId: string,
  event: Omit<InventoryEvent, 'id' | 'timestamp'>
): void {
  offlineQueue.set(offlineId, {
    offlineId,
    event,
    createdAt: new Date(),
  });
}

/**
 * Process offline events when coming back online
 */
export async function syncOfflineEvents(tenantId: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const results = { synced: 0, failed: 0, errors: [] as string[] };

  for (const [offlineId, offlineEvent] of offlineQueue) {
    if (offlineEvent.event.tenantId !== tenantId) continue;
    if (offlineEvent.syncedAt) continue;

    try {
      await emitInventoryEvent({
        ...offlineEvent.event,
        metadata: {
          ...offlineEvent.event.metadata,
          isOffline: true,
          offlineId,
        },
      });
      
      offlineEvent.syncedAt = new Date();
      results.synced++;
    } catch (error) {
      offlineEvent.syncError = error instanceof Error ? error.message : 'Unknown error';
      results.failed++;
      results.errors.push(`${offlineId}: ${offlineEvent.syncError}`);
    }
  }

  return results;
}

/**
 * Get pending offline events for a tenant
 */
export function getPendingOfflineEvents(tenantId: string): OfflineEvent[] {
  return Array.from(offlineQueue.values())
    .filter(e => e.event.tenantId === tenantId && !e.syncedAt);
}
