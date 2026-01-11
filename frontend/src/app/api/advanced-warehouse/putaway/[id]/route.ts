export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Putaway Task Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/putaway/[id]         - Get task
 * POST   /api/advanced-warehouse/putaway/[id]         - Actions (assign, start, complete, cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PutawayService } from '@/lib/advanced-warehouse/putaway-service';

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

    const task = await PutawayService.getById(ctx, id);
    if (!task) {
      return NextResponse.json({ error: 'Putaway task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error getting putaway task:', error);
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
      case 'assign': {
        const { assignedToId, assignedToName } = body;
        if (!assignedToId || !assignedToName) {
          return NextResponse.json({ error: 'assignedToId and assignedToName are required' }, { status: 400 });
        }
        const task = await PutawayService.assign(ctx, id, { assignedToId, assignedToName });
        return NextResponse.json(task);
      }

      case 'start': {
        const task = await PutawayService.start(ctx, id);
        return NextResponse.json(task);
      }

      case 'complete': {
        const { actualZoneId, actualBinId, quantityPutaway, completedById, completedByName, notes } = body;
        if (!actualZoneId || !actualBinId || quantityPutaway === undefined || !completedById || !completedByName) {
          return NextResponse.json({ error: 'actualZoneId, actualBinId, quantityPutaway, completedById, and completedByName are required' }, { status: 400 });
        }
        const task = await PutawayService.complete(ctx, id, {
          actualZoneId,
          actualBinId,
          quantityPutaway,
          completedById,
          completedByName,
          notes,
        });
        return NextResponse.json(task);
      }

      case 'cancel': {
        const { reason } = body;
        const task = await PutawayService.cancel(ctx, id, reason);
        return NextResponse.json(task);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing putaway action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
