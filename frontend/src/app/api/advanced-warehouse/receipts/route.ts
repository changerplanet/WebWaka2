/**
 * ADVANCED WAREHOUSE SUITE — Receipts API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/receipts         - List receipts
 * POST   /api/advanced-warehouse/receipts         - Create receipt
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReceiptService } from '@/lib/advanced-warehouse/receipt-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const status = searchParams.get('status') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await ReceiptService.list(
      ctx,
      {
        warehouseId,
        supplierId,
        status: status as any,
        referenceType,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing receipts:', error);
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
    const { warehouseId, referenceType, referenceId, supplierId, supplierName, supplierRef, expectedDate, requiresInspection, notes, items } = body;

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

    const receipt = await ReceiptService.create(
      ctx,
      {
        warehouseId,
        referenceType,
        referenceId,
        supplierId,
        supplierName,
        supplierRef,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        requiresInspection,
        notes,
      },
      items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        expectedQuantity: item.expectedQuantity,
        unitOfMeasure: item.unitOfMeasure,
        unitsPerCase: item.unitsPerCase,
        unitCost: item.unitCost,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      }))
    );

    return NextResponse.json(receipt, { status: 201 });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
