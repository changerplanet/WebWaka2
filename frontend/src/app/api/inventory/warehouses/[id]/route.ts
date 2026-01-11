export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Single Warehouse API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { WarehouseService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/warehouses/[id] - Get warehouse
// PATCH /api/inventory/warehouses/[id] - Update warehouse
// DELETE /api/inventory/warehouses/[id] - Deactivate warehouse
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const warehouse = await WarehouseService.getById(session.activeTenantId, id);

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error('[Warehouse API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const warehouse = await WarehouseService.update(session.activeTenantId, id, body);

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error('[Warehouse API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await WarehouseService.deactivate(session.activeTenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Warehouse API] Deactivate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('pending transfers') ? 409 : 500 }
    );
  }
}
