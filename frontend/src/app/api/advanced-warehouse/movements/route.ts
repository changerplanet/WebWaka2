/**
 * ADVANCED WAREHOUSE SUITE — Stock Movements API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/movements         - List movements
 * POST   /api/advanced-warehouse/movements         - Record movement
 */

import { NextRequest, NextResponse } from 'next/server';
import { MovementService } from '@/lib/advanced-warehouse/movement-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const movementType = searchParams.get('movementType') || undefined;
    const fromBinId = searchParams.get('fromBinId') || undefined;
    const toBinId = searchParams.get('toBinId') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const referenceId = searchParams.get('referenceId') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await MovementService.list(
      ctx,
      {
        warehouseId,
        productId,
        batchId,
        movementType: movementType as any,
        fromBinId,
        toBinId,
        referenceType,
        referenceId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing movements:', error);
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
    const { 
      warehouseId, 
      movementType, 
      productId, 
      variantId, 
      productName, 
      sku,
      batchId,
      batchNumber,
      expiryDate,
      quantity,
      beforeQuantity,
      afterQuantity,
      fromZoneId,
      fromBinId,
      fromBinCode,
      toZoneId,
      toBinId,
      toBinCode,
      unitCost,
      referenceType,
      referenceId,
      referenceNumber,
      reasonCode,
      reasonDescription,
      notes,
    } = body;

    if (!warehouseId || !movementType || !productId || !productName || quantity === undefined) {
      return NextResponse.json({ error: 'warehouseId, movementType, productId, productName, and quantity are required' }, { status: 400 });
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
      userName: request.headers.get('x-user-name') || undefined,
    };

    const movement = await MovementService.record(ctx, {
      warehouseId,
      movementType,
      productId,
      variantId,
      productName,
      sku,
      batchId,
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      quantity,
      beforeQuantity,
      afterQuantity,
      fromZoneId,
      fromBinId,
      fromBinCode,
      toZoneId,
      toBinId,
      toBinCode,
      unitCost,
      referenceType,
      referenceId,
      referenceNumber,
      reasonCode,
      reasonDescription,
      performedById: ctx.userId,
      performedByName: ctx.userName,
      notes,
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    console.error('Error recording movement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
