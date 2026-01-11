export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Pick Lists API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/pick-lists         - List pick lists
 * POST   /api/advanced-warehouse/pick-lists         - Create pick list
 */

import { NextRequest, NextResponse } from 'next/server';
import { PickListService } from '@/lib/advanced-warehouse/pick-list-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const sourceId = searchParams.get('sourceId') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await PickListService.list(
      ctx,
      {
        warehouseId,
        sourceType,
        sourceId,
        status: status as any,
        priority,
        assignedToId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing pick lists:', error);
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
    const { warehouseId, pickType, sourceType, sourceId, priority, notes, items } = body;

    if (!warehouseId) {
      return NextResponse.json({ error: 'warehouseId is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
    };

    const pickList = await PickListService.create(
      ctx,
      {
        warehouseId,
        pickType,
        sourceType,
        sourceId,
        priority,
        notes,
      },
      items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        requestedQuantity: item.requestedQuantity,
        suggestedBinId: item.suggestedBinId,
        suggestedBinCode: item.suggestedBinCode,
        suggestedBatchId: item.suggestedBatchId,
        suggestedBatchNumber: item.suggestedBatchNumber,
      }))
    );

    return NextResponse.json(pickList, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pick list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
