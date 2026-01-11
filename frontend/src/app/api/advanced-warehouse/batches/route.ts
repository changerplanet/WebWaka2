export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Batches API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/batches         - List batches
 * POST   /api/advanced-warehouse/batches         - Create batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { BatchService } from '@/lib/advanced-warehouse/batch-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const variantId = searchParams.get('variantId') || undefined;
    const qualityStatus = searchParams.get('qualityStatus') || undefined;
    const isExpiringSoon = searchParams.get('isExpiringSoon');
    const isExpired = searchParams.get('isExpired');
    const isRecalled = searchParams.get('isRecalled');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const result = await BatchService.list(
      ctx,
      {
        productId,
        variantId,
        qualityStatus,
        isExpiringSoon: isExpiringSoon === 'true',
        isExpired: isExpired === 'true',
        isRecalled: isRecalled ? isRecalled === 'true' : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing batches:', error);
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
    const { productId, variantId, batchNumber, lotNumber, serialNumber, manufacturingDate, expiryDate, supplierId, supplierBatchRef, purchaseOrderId, initialQuantity, qualityStatus, inspectionNotes } = body;

    if (!productId || !batchNumber || initialQuantity === undefined) {
      return NextResponse.json({ error: 'productId, batchNumber, and initialQuantity are required' }, { status: 400 });
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
      userId: request.headers.get('x-user-id') || undefined,
    };

    const batch = await BatchService.create(ctx, {
      productId,
      variantId,
      batchNumber,
      lotNumber,
      serialNumber,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      supplierId,
      supplierBatchRef,
      purchaseOrderId,
      initialQuantity,
      qualityStatus,
      inspectionNotes,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
