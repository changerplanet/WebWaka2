/**
 * ADVANCED WAREHOUSE SUITE — Bins API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/bins         - List bins
 * POST   /api/advanced-warehouse/bins         - Create bin
 */

import { NextRequest, NextResponse } from 'next/server';
import { BinService } from '@/lib/advanced-warehouse/bin-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const zoneId = searchParams.get('zoneId') || undefined;
    const binType = searchParams.get('binType') || undefined;
    const isEmpty = searchParams.get('isEmpty');
    const isActive = searchParams.get('isActive');
    const isBlocked = searchParams.get('isBlocked');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await BinService.list(
      ctx,
      {
        warehouseId,
        zoneId,
        binType: binType as any,
        isEmpty: isEmpty ? isEmpty === 'true' : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        isBlocked: isBlocked ? isBlocked === 'true' : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing bins:', error);
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
    const { warehouseId, zoneId, code, aisle, rack, level, position, binType, maxWeight, maxVolume, maxUnits, restrictedToProductId, restrictedToCategory, allowMixedBatches, bulk } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    // Bulk creation
    if (bulk && Array.isArray(bulk)) {
      if (!warehouseId || !zoneId) {
        return NextResponse.json({ error: 'warehouseId and zoneId are required for bulk creation' }, { status: 400 });
      }
      const result = await BinService.createBulk(ctx, warehouseId, zoneId, bulk);
      return NextResponse.json(result, { status: 201 });
    }

    // Single creation
    if (!warehouseId || !zoneId || !code) {
      return NextResponse.json({ error: 'warehouseId, zoneId, and code are required' }, { status: 400 });
    }

    const bin = await BinService.create(ctx, {
      warehouseId,
      zoneId,
      code,
      aisle,
      rack,
      level,
      position,
      binType,
      maxWeight,
      maxVolume,
      maxUnits,
      restrictedToProductId,
      restrictedToCategory,
      allowMixedBatches,
    });

    return NextResponse.json(bin, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
