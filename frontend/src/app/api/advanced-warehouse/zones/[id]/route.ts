/**
 * ADVANCED WAREHOUSE SUITE — Zone Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/zones/[id]         - Get zone
 * PATCH  /api/advanced-warehouse/zones/[id]         - Update zone
 * DELETE /api/advanced-warehouse/zones/[id]         - Delete zone
 * POST   /api/advanced-warehouse/zones/[id]         - Actions (get-summary, list-bins)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZoneService } from '@/lib/advanced-warehouse/zone-service';

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

    const zone = await ZoneService.getById(ctx, id);
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json(zone);
  } catch (error: any) {
    console.error('Error getting zone:', error);
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

    const zone = await ZoneService.update(ctx, id, body);
    return NextResponse.json(zone);
  } catch (error: any) {
    console.error('Error updating zone:', error);
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

    const zone = await ZoneService.delete(ctx, id);
    return NextResponse.json(zone);
  } catch (error: any) {
    console.error('Error deleting zone:', error);
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
    const { action } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    switch (action) {
      case 'get-summary': {
        const summary = await ZoneService.getZoneSummary(ctx, id);
        if (!summary) {
          return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
        }
        return NextResponse.json(summary);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing zone action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
