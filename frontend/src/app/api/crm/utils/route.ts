export const dynamic = 'force-dynamic'

/**
 * MODULE 3: CRM & Customer Engagement
 * CRM Entitlements & Offline API
 * 
 * GET /api/crm/entitlements - Get entitlement summary
 * GET /api/crm/offline - Get offline package
 * POST /api/crm/offline - Sync offline data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { CrmEntitlementsService } from '@/lib/crm/entitlements-service';
import { CrmOfflineService } from '@/lib/crm/offline-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    // Entitlements don't need capability check (to show upgrade prompts)
    if (resource === 'entitlements') {
      const summary = await CrmEntitlementsService.getEntitlementSummary(session.activeTenantId);
      return NextResponse.json(summary);
    }

    // Offline package needs capability
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    if (resource === 'offline') {
      const pkg = await CrmOfflineService.getOfflinePackage(session.activeTenantId);
      return NextResponse.json(pkg);
    }

    if (resource === 'changes') {
      const lastSyncAt = searchParams.get('lastSyncAt');
      if (!lastSyncAt) {
        return NextResponse.json(
          { error: 'lastSyncAt is required' },
          { status: 400 }
        );
      }
      const changes = await CrmOfflineService.getChangesSince(
        session.activeTenantId,
        new Date(lastSyncAt)
      );
      return NextResponse.json(changes);
    }

    return NextResponse.json(
      { error: 'Invalid resource. Use entitlements, offline, or changes.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[CRM Utils API] Error:', error);
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

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action } = body;

    if (action === 'sync-loyalty') {
      if (!body.clientId || !Array.isArray(body.loyaltyEarns)) {
        return NextResponse.json(
          { error: 'clientId and loyaltyEarns array are required' },
          { status: 400 }
        );
      }
      const result = await CrmOfflineService.syncLoyaltyEarns(
        session.activeTenantId,
        body,
        session.user.id
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[CRM Utils API] Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
