export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Putaway API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/putaway         - List putaway tasks
 * POST   /api/advanced-warehouse/putaway         - Create putaway task
 */

import { NextRequest, NextResponse } from 'next/server';
import { PutawayService } from '@/lib/advanced-warehouse/putaway-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const receiptId = searchParams.get('receiptId') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await PutawayService.list(
      ctx,
      {
        warehouseId,
        receiptId,
        status: status as any,
        priority,
        assignedToId,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing putaway tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { fromReceiptId, warehouseId, receiptId, receiptItemId, transferId, productId, variantId, productName, sku, batchId, quantity, suggestedZoneId, suggestedBinId, priority, notes } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
    };

    // Create from receipt
    if (fromReceiptId) {
      const tasks = await PutawayService.createFromReceipt(ctx, fromReceiptId);
      return NextResponse.json({ tasks, count: tasks.length }, { status: 201 });
    }

    // Manual creation
    if (!warehouseId || !productId || !productName || quantity === undefined) {
      return NextResponse.json({ error: 'warehouseId, productId, productName, and quantity are required' }, { status: 400 });
    }

    const task = await PutawayService.create(ctx, {
      warehouseId,
      receiptId,
      receiptItemId,
      transferId,
      productId,
      variantId,
      productName,
      sku,
      batchId,
      quantity,
      suggestedZoneId,
      suggestedBinId,
      priority,
      notes,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating putaway task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
