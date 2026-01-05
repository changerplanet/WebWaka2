/**
 * MODULE 3: CRM & Customer Engagement
 * Engagement & Events API
 * 
 * GET /api/crm/engagement - Get analytics
 * POST /api/crm/engagement - Record event or process system event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { EngagementService } from '@/lib/crm/engagement-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics';
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (action === 'customer-history' && customerId) {
      const history = await EngagementService.getCustomerHistory(
        session.activeTenantId,
        customerId,
        {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        }
      );
      return NextResponse.json(history);
    }

    if (action === 'customer-summary' && customerId) {
      const summary = await EngagementService.getCustomerSummary(
        session.activeTenantId,
        customerId
      );
      return NextResponse.json(summary);
    }

    // Default: get analytics
    const analytics = await EngagementService.getAnalytics(session.activeTenantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[Engagement API] Get error:', error);
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

    switch (action) {
      case 'record': {
        if (!body.customerId || !body.eventType) {
          return NextResponse.json(
            { error: 'customerId and eventType are required' },
            { status: 400 }
          );
        }
        const event = await EngagementService.recordEvent(session.activeTenantId, body);
        return NextResponse.json(event, { status: 201 });
      }

      case 'process-sale': {
        const result = await EngagementService.processSaleCompleted(
          session.activeTenantId,
          body.event
        );
        return NextResponse.json(result);
      }

      case 'process-order': {
        const result = await EngagementService.processOrderCompleted(
          session.activeTenantId,
          body.event
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Engagement API] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
