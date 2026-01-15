/**
 * PARKHUB POS SYNC API
 * Wave F1: ParkHub Walk-Up POS Interface
 * 
 * POST /api/parkhub/pos/sync - Sync queued tickets (agent-initiated)
 * GET /api/parkhub/pos/sync - Get sync status for agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createParkHubPosService } from '@/lib/commerce/parkhub/parkhub-pos-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const service = createParkHubPosService(tenantId);
    const status = await service.getAgentSyncStatus(session.user.id);
    const queuedItems = await service.getQueuedItems(session.user.id);

    return NextResponse.json({
      success: true,
      status,
      queuedItems: queuedItems.map((item: {
        id: string;
        clientTicketId: string;
        routeName: string;
        tripNumber: string;
        ticketCount: number;
        totalAmount: number | { toNumber: () => number };
        paymentMethod: string;
        syncStatus: string;
        errorMessage: string | null;
        clientTimestamp: Date;
      }) => ({
        id: item.id,
        clientTicketId: item.clientTicketId,
        routeName: item.routeName,
        tripNumber: item.tripNumber,
        ticketCount: item.ticketCount,
        totalAmount: typeof item.totalAmount === 'object' ? item.totalAmount.toNumber() : Number(item.totalAmount),
        paymentMethod: item.paymentMethod,
        syncStatus: item.syncStatus,
        errorMessage: item.errorMessage,
        clientTimestamp: item.clientTimestamp,
      })),
    });

  } catch (error) {
    console.error('ParkHub POS sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
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
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const body = await request.json();
    const { action, queueId } = body;

    const service = createParkHubPosService(tenantId);

    if (action === 'retry' && queueId) {
      const result = await service.retryFailedItem(queueId);
      return NextResponse.json({
        success: result.success,
        message: 'Item requeued for sync',
      });
    }

    const results = await service.syncQueuedTickets(session.user.id);
    const status = await service.getAgentSyncStatus(session.user.id);

    return NextResponse.json({
      success: true,
      results,
      status,
      message: `Synced ${results.filter((r: { success: boolean }) => r.success).length} of ${results.length} tickets`,
    });

  } catch (error) {
    console.error('ParkHub POS sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tickets' },
      { status: 500 }
    );
  }
}
