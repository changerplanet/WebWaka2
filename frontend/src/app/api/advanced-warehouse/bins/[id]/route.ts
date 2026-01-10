/**
 * ADVANCED WAREHOUSE SUITE — Bin Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/bins/[id]         - Get bin
 * PATCH  /api/advanced-warehouse/bins/[id]         - Update bin
 * DELETE /api/advanced-warehouse/bins/[id]         - Delete bin
 * POST   /api/advanced-warehouse/bins/[id]         - Actions (block, unblock, get-contents)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BinService } from '@/lib/advanced-warehouse/bin-service';

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

    const bin = await BinService.getById(ctx, id);
    if (!bin) {
      return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
    }

    return NextResponse.json(bin);
  } catch (error: any) {
    console.error('Error getting bin:', error);
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

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const bin = await BinService.update(ctx, id, body);
    return NextResponse.json(bin);
  } catch (error: any) {
    console.error('Error updating bin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const bin = await BinService.delete(ctx, id);
    return NextResponse.json(bin);
  } catch (error: any) {
    console.error('Error deleting bin:', error);
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
    const { action, reason } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    switch (action) {
      case 'block': {
        const bin = await BinService.setBlocked(ctx, id, true, reason);
        return NextResponse.json(bin);
      }

      case 'unblock': {
        const bin = await BinService.setBlocked(ctx, id, false);
        return NextResponse.json(bin);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing bin action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
