export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Movement Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/movements/[id]         - Get movement
 * POST   /api/advanced-warehouse/movements/[id]         - Actions (verify)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MovementService } from '@/lib/advanced-warehouse/movement-service';

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

    const movement = await MovementService.getById(ctx, id);
    if (!movement) {
      return NextResponse.json({ error: 'Movement not found' }, { status: 404 });
    }

    return NextResponse.json(movement);
  } catch (error: any) {
    console.error('Error getting movement:', error);
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
    const { action, verifiedById, verifiedByName } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    switch (action) {
      case 'verify': {
        if (!verifiedById || !verifiedByName) {
          return NextResponse.json({ error: 'verifiedById and verifiedByName are required' }, { status: 400 });
        }
        const movement = await MovementService.verify(ctx, id, verifiedById, verifiedByName);
        return NextResponse.json(movement);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing movement action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
