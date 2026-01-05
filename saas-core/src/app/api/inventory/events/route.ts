/**
 * MODULE 1: Inventory & Warehouse Management
 * Events API - Event types and documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  INVENTORY_EVENT_TYPES,
  IDEMPOTENCY_RULES,
  EVENT_HANDLERS,
} from '@/lib/inventory/event-registry';

// GET /api/inventory/events - Get event types and documentation
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      eventTypes: INVENTORY_EVENT_TYPES,
      handlers: EVENT_HANDLERS,
      idempotencyRules: {
        TRANSFER: 'transferId + action + date',
        AUDIT: 'auditId + action',
        AUDIT_COUNT: 'auditId + productId + variantId + minute',
        ADJUSTMENT: 'adjustmentId/auditId + type',
        MOVEMENT: 'offlineId or generated UUID',
        REORDER_SUGGESTION: 'ruleId + productId + locationId + date',
        LOW_STOCK_ALERT: 'productId + locationId + date',
      },
      documentation: {
        description: 'Inventory & Warehouse Management module events',
        version: '1.0',
        coreEvents: [
          {
            type: INVENTORY_EVENT_TYPES.STOCK_TRANSFER_SHIPPED,
            description: 'Emitted when items are shipped. Core MUST apply negative delta to source location.',
            coreAction: 'DECREASE inventory at source locationId',
          },
          {
            type: INVENTORY_EVENT_TYPES.STOCK_TRANSFER_RECEIVED,
            description: 'Emitted when items are received. Core MUST apply positive delta to destination.',
            coreAction: 'INCREASE inventory at destination locationId',
          },
          {
            type: INVENTORY_EVENT_TYPES.INVENTORY_ADJUSTMENT_APPROVED,
            description: 'Emitted when audit adjustments are approved. Core MUST apply delta to location.',
            coreAction: 'APPLY variance to inventory at locationId',
          },
        ],
        notificationEvents: [
          INVENTORY_EVENT_TYPES.STOCK_TRANSFER_REQUESTED,
          INVENTORY_EVENT_TYPES.REORDER_SUGGESTED,
          INVENTORY_EVENT_TYPES.LOW_STOCK_ALERT,
        ],
      },
    });
  } catch (error) {
    console.error('[Events API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
