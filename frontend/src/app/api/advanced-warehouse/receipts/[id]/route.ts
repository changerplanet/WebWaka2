export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Receipt Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/receipts/[id]         - Get receipt
 * PATCH  /api/advanced-warehouse/receipts/[id]         - Update receipt
 * POST   /api/advanced-warehouse/receipts/[id]         - Actions (start-receiving, receive-item, complete, inspect, cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptService } from '@/lib/advanced-warehouse/receipt-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const receipt = await ReceiptService.getById(ctx, id);
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error: any) {
    console.error('Error getting receipt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.expectedDate) {
      body.expectedDate = new Date(body.expectedDate);
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const receipt = await ReceiptService.update(ctx, id, body);
    return NextResponse.json(receipt);
  } catch (error: any) {
    console.error('Error updating receipt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
      userName: request.headers.get('x-user-name') || undefined,
    };

    switch (action) {
      case 'start-receiving': {
        const { receivedById, receivedByName, receivingBay } = body;
        if (!receivedById || !receivedByName) {
          return NextResponse.json({ error: 'receivedById and receivedByName are required' }, { status: 400 });
        }
        const receipt = await ReceiptService.startReceiving(ctx, id, receivedById, receivedByName, receivingBay);
        return NextResponse.json(receipt);
      }

      case 'receive-item': {
        const { receiptItemId, receivedQuantity, damagedQuantity, varianceReason, batchNumber, expiryDate } = body;
        if (!receiptItemId || receivedQuantity === undefined) {
          return NextResponse.json({ error: 'receiptItemId and receivedQuantity are required' }, { status: 400 });
        }
        const item = await ReceiptService.receiveItem(ctx, id, {
          receiptItemId,
          receivedQuantity,
          damagedQuantity,
          varianceReason,
          batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        });
        return NextResponse.json(item);
      }

      case 'complete': {
        const receipt = await ReceiptService.completeReceiving(ctx, id);
        return NextResponse.json(receipt);
      }

      case 'inspect': {
        const { inspectedById, inspectedByName, passed, notes } = body;
        if (!inspectedById || !inspectedByName || passed === undefined) {
          return NextResponse.json({ error: 'inspectedById, inspectedByName, and passed are required' }, { status: 400 });
        }
        const receipt = await ReceiptService.completeInspection(ctx, id, inspectedById, inspectedByName, passed, notes);
        return NextResponse.json(receipt);
      }

      case 'cancel': {
        const { reason } = body;
        const receipt = await ReceiptService.cancel(ctx, id, reason);
        return NextResponse.json(receipt);
      }

      case 'get-pending-putaway': {
        const items = await ReceiptService.getItemsPendingPutaway(ctx, id);
        return NextResponse.json(items);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing receipt action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
