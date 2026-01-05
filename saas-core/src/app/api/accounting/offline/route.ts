/**
 * MODULE 2: Accounting & Finance
 * Offline Sync API
 * 
 * GET /api/accounting/offline/package - Get offline data package
 * POST /api/accounting/offline/sync - Sync offline expenses
 * GET /api/accounting/offline/changes - Get changes since last sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { OfflineService } from '@/lib/accounting/offline-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'package';

    switch (action) {
      case 'package': {
        const pkg = await OfflineService.getOfflinePackage(session.activeTenantId);
        return NextResponse.json(pkg);
      }

      case 'changes': {
        const lastSyncAt = searchParams.get('lastSyncAt');
        if (!lastSyncAt) {
          return NextResponse.json(
            { error: 'lastSyncAt is required for changes action' },
            { status: 400 }
          );
        }

        const changes = await OfflineService.getChangesSince(
          session.activeTenantId,
          new Date(lastSyncAt)
        );
        return NextResponse.json(changes);
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Offline API] Error:', error);
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

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync': {
        const { clientId, lastSyncAt, offlineExpenses } = body;

        if (!clientId || !Array.isArray(offlineExpenses)) {
          return NextResponse.json(
            { error: 'clientId and offlineExpenses array are required' },
            { status: 400 }
          );
        }

        const result = await OfflineService.syncExpenses(
          session.activeTenantId,
          {
            clientId,
            lastSyncAt,
            offlineExpenses,
          },
          session.user.id
        );

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use 'sync' to sync offline expenses.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Offline API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
