export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Zones API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/zones         - List zones
 * POST   /api/advanced-warehouse/zones         - Create zone
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZoneService } from '@/lib/advanced-warehouse/zone-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const zoneType = searchParams.get('zoneType') || undefined;
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await ZoneService.list(
      ctx,
      {
        warehouseId,
        zoneType: zoneType as any,
        isActive: isActive ? isActive === 'true' : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing zones:', error);
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
    const { warehouseId, code, name, description, zoneType, totalCapacity, capacityUnit, defaultForProductTypes, allowMixedProducts, requiresInspection } = body;

    if (!warehouseId || !code || !name) {
      return NextResponse.json({ error: 'warehouseId, code, and name are required' }, { status: 400 });
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
    };

    const zone = await ZoneService.create(ctx, {
      warehouseId,
      code,
      name,
      description,
      zoneType,
      totalCapacity,
      capacityUnit,
      defaultForProductTypes,
      allowMixedProducts,
      requiresInspection,
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error: any) {
    console.error('Error creating zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
