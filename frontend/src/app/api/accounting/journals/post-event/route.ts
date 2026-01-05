/**
 * MODULE 2: Accounting & Finance
 * Event-Based Journal Posting API
 * 
 * POST /api/accounting/journals/post-event - Create journal entry from system event
 * 
 * This endpoint is the primary interface for other modules to create
 * accounting entries from their events (sales, refunds, inventory adjustments).
 * 
 * DESIGN:
 * - Event-sourced: All journal entries derive from traceable events
 * - Idempotent: Same event cannot create duplicate entries
 * - Automatic posting rules based on event type
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import {
  postPOSSale,
  postSVMOrder,
  postRefund,
  postInventoryAdjustment,
  PostingResult,
} from '@/lib/accounting/journal-service';

// Event type definitions
type EventType = 'POS_SALE' | 'SVM_ORDER' | 'MVM_ORDER' | 'REFUND' | 'INVENTORY_ADJUSTMENT';

interface BaseEventPayload {
  eventType: EventType;
  eventId: string;
}

interface POSSalePayload extends BaseEventPayload {
  eventType: 'POS_SALE';
  saleId: string;
  saleNumber: string;
  totalAmount: number;
  taxAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'TRANSFER';
  saleDate: string; // ISO date string
}

interface SVMOrderPayload extends BaseEventPayload {
  eventType: 'SVM_ORDER' | 'MVM_ORDER';
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  taxAmount: number;
  paymentMethod: string;
  orderDate: string; // ISO date string
}

interface RefundPayload extends BaseEventPayload {
  eventType: 'REFUND';
  refundId: string;
  refundNumber: string;
  originalSaleId: string;
  totalAmount: number;
  taxAmount: number;
  refundMethod: string;
  refundDate: string; // ISO date string
}

interface InventoryAdjustmentPayload extends BaseEventPayload {
  eventType: 'INVENTORY_ADJUSTMENT';
  adjustmentId: string;
  adjustmentNumber: string;
  adjustmentType: 'INCREASE' | 'DECREASE' | 'WRITE_OFF';
  totalValue: number;
  reason: string;
  adjustmentDate: string; // ISO date string
}

type EventPayload = POSSalePayload | SVMOrderPayload | RefundPayload | InventoryAdjustmentPayload;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const body: EventPayload = await request.json();

    // Validate required fields
    if (!body.eventType || !body.eventId) {
      return NextResponse.json(
        { error: 'eventType and eventId are required' },
        { status: 400 }
      );
    }

    let result: PostingResult;

    switch (body.eventType) {
      case 'POS_SALE': {
        const payload = body as POSSalePayload;
        if (!payload.saleId || !payload.saleNumber || payload.totalAmount === undefined) {
          return NextResponse.json(
            { error: 'saleId, saleNumber, and totalAmount are required for POS_SALE' },
            { status: 400 }
          );
        }
        result = await postPOSSale(
          session.activeTenantId,
          {
            saleId: payload.saleId,
            saleNumber: payload.saleNumber,
            totalAmount: payload.totalAmount,
            taxAmount: payload.taxAmount || 0,
            paymentMethod: payload.paymentMethod || 'CASH',
            saleDate: new Date(payload.saleDate || new Date()),
          },
          payload.eventId,
          session.user.id
        );
        break;
      }

      case 'SVM_ORDER':
      case 'MVM_ORDER': {
        const payload = body as SVMOrderPayload;
        if (!payload.orderId || !payload.orderNumber || payload.totalAmount === undefined) {
          return NextResponse.json(
            { error: 'orderId, orderNumber, and totalAmount are required for orders' },
            { status: 400 }
          );
        }
        result = await postSVMOrder(
          session.activeTenantId,
          {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            totalAmount: payload.totalAmount,
            taxAmount: payload.taxAmount || 0,
            paymentMethod: payload.paymentMethod || 'ONLINE',
            orderDate: new Date(payload.orderDate || new Date()),
          },
          payload.eventId,
          session.user.id
        );
        break;
      }

      case 'REFUND': {
        const payload = body as RefundPayload;
        if (!payload.refundId || !payload.refundNumber || !payload.originalSaleId || payload.totalAmount === undefined) {
          return NextResponse.json(
            { error: 'refundId, refundNumber, originalSaleId, and totalAmount are required for REFUND' },
            { status: 400 }
          );
        }
        result = await postRefund(
          session.activeTenantId,
          {
            refundId: payload.refundId,
            refundNumber: payload.refundNumber,
            originalSaleId: payload.originalSaleId,
            totalAmount: payload.totalAmount,
            taxAmount: payload.taxAmount || 0,
            refundMethod: payload.refundMethod || 'CASH',
            refundDate: new Date(payload.refundDate || new Date()),
          },
          payload.eventId,
          session.user.id
        );
        break;
      }

      case 'INVENTORY_ADJUSTMENT': {
        const payload = body as InventoryAdjustmentPayload;
        if (!payload.adjustmentId || !payload.adjustmentNumber || !payload.adjustmentType || payload.totalValue === undefined) {
          return NextResponse.json(
            { error: 'adjustmentId, adjustmentNumber, adjustmentType, and totalValue are required for INVENTORY_ADJUSTMENT' },
            { status: 400 }
          );
        }
        result = await postInventoryAdjustment(
          session.activeTenantId,
          {
            adjustmentId: payload.adjustmentId,
            adjustmentNumber: payload.adjustmentNumber,
            adjustmentType: payload.adjustmentType,
            totalValue: payload.totalValue,
            reason: payload.reason || 'No reason provided',
            adjustmentDate: new Date(payload.adjustmentDate || new Date()),
          },
          payload.eventId,
          session.user.id
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported event type: ${(body as BaseEventPayload).eventType}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      eventType: body.eventType,
      eventId: body.eventId,
      journalEntry: result.journalEntry,
    }, { status: 201 });

  } catch (error) {
    console.error('[Journals API] Post event error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
