export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Offline Conflict Resolution Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { OfflineSyncService, getConflicts } from '@/lib/inventory/offline-sync-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/offline/conflicts - Get conflicts
// POST /api/inventory/offline/conflicts - Resolve conflicts
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conflicts = getConflicts(session.activeTenantId);

    return NextResponse.json({
      conflicts,
      count: conflicts.length,
    });
  } catch (error) {
    console.error('[Offline API] Get conflicts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.actionId || !body.resolution) {
      return NextResponse.json(
        { error: 'actionId and resolution are required' },
        { status: 400 }
      );
    }

    if (!['USE_LOCAL', 'USE_SERVER', 'MERGE'].includes(body.resolution)) {
      return NextResponse.json(
        { error: 'resolution must be USE_LOCAL, USE_SERVER, or MERGE' },
        { status: 400 }
      );
    }

    const result = await OfflineSyncService.resolveConflict(
      session.activeTenantId,
      {
        actionId: body.actionId,
        resolution: body.resolution,
        mergedData: body.mergedData,
      }
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Offline API] Resolve conflict error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
