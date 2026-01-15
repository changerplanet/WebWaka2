export const dynamic = 'force-dynamic';

/**
 * POS OFFLINE SYNC API
 * Wave 1: Nigeria-First Modular Commerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { PosOfflineService } from '@/lib/commerce/pos-offline/pos-offline-service';
import { getCurrentSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const action = searchParams.get('action');

    switch (action) {
      case 'pending':
        const pending = await PosOfflineService.getPendingSales(
          tenantId,
          locationId || undefined
        );
        return NextResponse.json({ pendingSales: pending });

      case 'conflicts':
        const conflicts = await PosOfflineService.getConflicts(
          tenantId,
          locationId || undefined
        );
        return NextResponse.json({ conflicts });

      default:
        return NextResponse.json({ error: 'action required' }, { status: 400 });
    }
  } catch (error) {
    console.error('POS offline GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { locationId, action, saleData, offlineSaleId, resolution, adjustments } = body;

    switch (action) {
      case 'queue':
        if (!locationId || !saleData) {
          return NextResponse.json(
            { error: 'locationId and saleData required' },
            { status: 400 }
          );
        }
        const queued = await PosOfflineService.queueOfflineSale(
          tenantId,
          locationId,
          saleData
        );
        return NextResponse.json({
          success: true,
          offlineSaleId: queued.id,
          message: 'Sale queued for sync'
        });

      case 'sync':
        if (!offlineSaleId) {
          return NextResponse.json(
            { error: 'offlineSaleId required' },
            { status: 400 }
          );
        }
        const syncResult = await PosOfflineService.syncOfflineSale(offlineSaleId);
        return NextResponse.json(syncResult);

      case 'resolve':
        if (!offlineSaleId || !resolution) {
          return NextResponse.json(
            { error: 'offlineSaleId and resolution required' },
            { status: 400 }
          );
        }
        const resolveResult = await PosOfflineService.resolveConflict(
          offlineSaleId,
          resolution,
          session.user.id,
          adjustments
        );
        return NextResponse.json(resolveResult);

      case 'sync-batch':
        const pendingSales = await PosOfflineService.getPendingSales(
          tenantId,
          locationId
        );
        const results = await Promise.all(
          pendingSales
            .filter(s => s.syncStatus === 'PENDING')
            .slice(0, 10)
            .map(s => PosOfflineService.syncOfflineSale(s.id))
        );
        const synced = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success && !r.hasConflict).length;
        const conflicts = results.filter(r => r.hasConflict).length;
        return NextResponse.json({
          synced,
          failed,
          conflicts,
          total: results.length
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POS offline POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
