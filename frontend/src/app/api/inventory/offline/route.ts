/**
 * MODULE 1: Inventory & Warehouse Management
 * Offline Sync API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  OfflineSyncService,
  getPendingActions,
  getAllActions,
  getConflicts,
  createOfflineAction,
  OFFLINE_SAFE_ACTIONS,
  OfflineAction,
} from '@/lib/inventory/offline-sync-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/offline - Get offline status and pending actions
// POST /api/inventory/offline - Queue offline actions
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';
    const conflictsOnly = searchParams.get('conflicts') === 'true';

    let actions: OfflineAction[];
    if (conflictsOnly) {
      actions = getConflicts(session.activeTenantId);
    } else if (includeAll) {
      actions = getAllActions(session.activeTenantId);
    } else {
      actions = getPendingActions(session.activeTenantId);
    }

    // Get summary
    const allActions = getAllActions(session.activeTenantId);
    const summary = {
      pending: allActions.filter(a => a.syncStatus === 'PENDING').length,
      syncing: allActions.filter(a => a.syncStatus === 'SYNCING').length,
      synced: allActions.filter(a => a.syncStatus === 'SYNCED').length,
      conflicts: allActions.filter(a => a.syncStatus === 'CONFLICT').length,
      failed: allActions.filter(a => a.syncStatus === 'FAILED').length,
      rejected: allActions.filter(a => a.syncStatus === 'REJECTED').length,
    };

    return NextResponse.json({
      actions,
      summary,
      offlineSafeActions: OFFLINE_SAFE_ACTIONS,
    });
  } catch (error) {
    console.error('[Offline API] Get error:', error);
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

    if (!body.actionType || !body.entityType || !body.payload) {
      return NextResponse.json(
        { error: 'actionType, entityType, and payload are required' },
        { status: 400 }
      );
    }

    // Check if action is safe for offline
    const safeAction = OFFLINE_SAFE_ACTIONS[body.actionType as keyof typeof OFFLINE_SAFE_ACTIONS];
    if (!safeAction?.safe) {
      return NextResponse.json(
        { error: `Action '${body.actionType}' is not safe for offline use` },
        { status: 400 }
      );
    }

    const action = createOfflineAction(
      session.activeTenantId,
      session.user.id,
      body.actionType,
      body.entityType,
      body.payload,
      session.user.name || session.user.email || 'unknown',
      body.entityId
    );

    return NextResponse.json({
      action,
      message: 'Action queued for sync',
    }, { status: 201 });
  } catch (error) {
    console.error('[Offline API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
