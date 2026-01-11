export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Warehouse API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { WarehouseService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';

// GET /api/inventory/warehouses - List warehouses
// POST /api/inventory/warehouses - Create warehouse
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
    const isActive = searchParams.get('isActive');
    const warehouseType = searchParams.get('warehouseType');

    const warehouses = await WarehouseService.list(session.activeTenantId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      warehouseType: warehouseType || undefined,
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('[Warehouse API] List error:', error);
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
    if (!body.locationId || !body.name || !body.code) {
      return NextResponse.json(
        { error: 'locationId, name, and code are required' },
        { status: 400 }
      );
    }

    const warehouse = await WarehouseService.create(session.activeTenantId, body);

    return NextResponse.json({ warehouse }, { status: 201 });
  } catch (error) {
    console.error('[Warehouse API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('already exists') ? 409 : 500 }
    );
  }
}
