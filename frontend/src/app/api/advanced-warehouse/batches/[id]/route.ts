/**
 * ADVANCED WAREHOUSE SUITE — Batch Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/batches/[id]         - Get batch
 * PATCH  /api/advanced-warehouse/batches/[id]         - Update batch
 * POST   /api/advanced-warehouse/batches/[id]         - Actions (adjust, reserve, release, recall, update-quality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BatchService } from '@/lib/advanced-warehouse/batch-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const batch = await BatchService.getById(ctx, id);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('Error getting batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Convert date strings to Date objects
    if (body.expiryDate) {
      body.expiryDate = new Date(body.expiryDate);
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const batch = await BatchService.update(ctx, id, body);
    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, quantity, reason, status, notes } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    switch (action) {
      case 'adjust': {
        if (quantity === undefined) {
          return NextResponse.json({ error: 'quantity is required for adjust action' }, { status: 400 });
        }
        const batch = await BatchService.adjustQuantity(ctx, id, quantity, reason);
        return NextResponse.json(batch);
      }

      case 'reserve': {
        if (!quantity || quantity <= 0) {
          return NextResponse.json({ error: 'positive quantity is required for reserve action' }, { status: 400 });
        }
        const batch = await BatchService.reserveQuantity(ctx, id, quantity);
        return NextResponse.json(batch);
      }

      case 'release': {
        if (!quantity || quantity <= 0) {
          return NextResponse.json({ error: 'positive quantity is required for release action' }, { status: 400 });
        }
        const batch = await BatchService.releaseReservation(ctx, id, quantity);
        return NextResponse.json(batch);
      }

      case 'recall': {
        if (!reason) {
          return NextResponse.json({ error: 'reason is required for recall action' }, { status: 400 });
        }
        const batch = await BatchService.recall(ctx, id, reason);
        return NextResponse.json(batch);
      }

      case 'update-quality': {
        if (!status) {
          return NextResponse.json({ error: 'status is required for update-quality action' }, { status: 400 });
        }
        const batch = await BatchService.updateQualityStatus(ctx, id, status, notes);
        return NextResponse.json(batch);
      }

      case 'get-history': {
        const history = await BatchService.getMovementHistory(ctx, id);
        return NextResponse.json(history);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing batch action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
