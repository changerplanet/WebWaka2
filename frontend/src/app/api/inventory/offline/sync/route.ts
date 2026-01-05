/**
 * MODULE 1: Inventory & Warehouse Management
 * Offline Sync Execution Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { OfflineSyncService, getPendingActions } from '@/lib/inventory/offline-sync-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/offline/sync - Execute sync of pending actions
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Get actions to sync
    let actions;
    if (body.actionIds && Array.isArray(body.actionIds)) {
      // Sync specific actions
      const allPending = getPendingActions(session.activeTenantId);
      actions = allPending.filter(a => body.actionIds.includes(a.id));
    } else {
      // Sync all pending
      actions = getPendingActions(session.activeTenantId);
    }

    if (actions.length === 0) {
      return NextResponse.json({
        message: 'No pending actions to sync',
        result: {
          totalActions: 0,
          synced: 0,
          failed: 0,
          conflicts: 0,
          rejected: 0,
          results: [],
        },
      });
    }

    const result = await OfflineSyncService.syncBatch(
      session.activeTenantId,
      actions
    );

    return NextResponse.json({
      message: `Synced ${result.synced}/${result.totalActions} actions`,
      result,
    });
  } catch (error) {
    console.error('[Offline API] Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
