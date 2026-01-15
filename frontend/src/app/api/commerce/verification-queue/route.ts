/**
 * Payment Verification Queue API
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Manages the verification queue for admin/partner review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createVerificationQueueService } from '@/lib/commerce/payment-verification';

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
    const { action } = body;

    const queueService = createVerificationQueueService(tenantId);

    switch (action) {
      case 'assign': {
        const { queueItemId, assignedToId, assignedToName } = body;

        if (!queueItemId) {
          return NextResponse.json({ error: 'Missing required field: queueItemId' }, { status: 400 });
        }

        const result = await queueService.assignToVerifier(
          queueItemId,
          assignedToId || session.user.id,
          assignedToName || session.user.name || session.user.email || 'Unknown'
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_urgent': {
        const { queueItemId } = body;

        if (!queueItemId) {
          return NextResponse.json({ error: 'Missing required field: queueItemId' }, { status: 400 });
        }

        const result = await queueService.markUrgent(queueItemId);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'escalate': {
        const { queueItemId } = body;

        if (!queueItemId) {
          return NextResponse.json({ error: 'Missing required field: queueItemId' }, { status: 400 });
        }

        const result = await queueService.escalate(queueItemId);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Verification Queue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const stats = searchParams.get('stats') === 'true';
    const myItems = searchParams.get('myItems') === 'true';
    const history = searchParams.get('history') === 'true';
    const paymentType = searchParams.get('paymentType') as 'BANK_TRANSFER' | 'COD' | null;
    const assignedToId = searchParams.get('assignedToId');
    const urgentOnly = searchParams.get('urgentOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const queueService = createVerificationQueueService(tenantId);

    if (stats) {
      const queueStats = await queueService.getQueueStats();
      return NextResponse.json(queueStats);
    }

    if (myItems) {
      const items = await queueService.getMyAssignedItems(session.user.id);
      return NextResponse.json({ items });
    }

    if (history) {
      const decidedById = searchParams.get('decidedById');
      const { items, total } = await queueService.getDecisionHistory({
        limit,
        offset,
        decidedById: decidedById || undefined,
      });
      return NextResponse.json({ items, total, limit, offset });
    }

    const { items, total } = await queueService.getPendingQueue({
      paymentType: paymentType || undefined,
      assignedToId: assignedToId || undefined,
      urgentOnly,
      limit,
      offset,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error('Verification Queue GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
