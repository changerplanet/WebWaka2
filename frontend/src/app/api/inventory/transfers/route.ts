/**
 * MODULE 1: Inventory & Warehouse Management
 * Stock Transfer API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockTransferService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';

// GET /api/inventory/transfers - List transfers
// POST /api/inventory/transfers - Create transfer
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fromWarehouseId = searchParams.get('fromWarehouseId');
    const toWarehouseId = searchParams.get('toWarehouseId');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await StockTransferService.list(session.activeTenantId, {
      status: status || undefined,
      fromWarehouseId: fromWarehouseId || undefined,
      toWarehouseId: toWarehouseId || undefined,
      priority: priority || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Transfer API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const body = await request.json();

    // Validate required fields
    if (!body.fromWarehouseId || !body.toWarehouseId || !body.items?.length) {
      return NextResponse.json(
        { error: 'fromWarehouseId, toWarehouseId, and items are required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.productId || !item.quantityRequested || item.quantityRequested < 1) {
        return NextResponse.json(
          { error: 'Each item must have productId and quantityRequested >= 1' },
          { status: 400 }
        );
      }
    }

    const transfer = await StockTransferService.create(
      session.activeTenantId,
      body,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error('[Transfer API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
