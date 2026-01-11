export const dynamic = 'force-dynamic'

/**
 * MODULE 3: CRM & Customer Engagement
 * Single Campaign API
 * 
 * GET /api/crm/campaigns/[id] - Get campaign
 * PUT /api/crm/campaigns/[id] - Update campaign
 * DELETE /api/crm/campaigns/[id] - Delete campaign
 * POST /api/crm/campaigns/[id] - Campaign actions (publish, pause, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { CampaignService } from '@/lib/crm/campaign-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'performance') {
      const performance = await CampaignService.getPerformance(session.activeTenantId, id);
      return NextResponse.json(performance);
    }

    if (action === 'recipients') {
      const recipients = await CampaignService.getRecipients(session.activeTenantId, id);
      return NextResponse.json(recipients);
    }

    const campaign = await CampaignService.getById(session.activeTenantId, id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[Campaigns API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await request.json();

    const campaign = await CampaignService.update(session.activeTenantId, id, body);

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[Campaigns API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    await CampaignService.delete(session.activeTenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Campaigns API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'set-audience': {
        const audience = await CampaignService.setAudience(
          session.activeTenantId,
          id,
          body.audience
        );
        return NextResponse.json({ success: true, audience });
      }

      case 'publish': {
        const campaign = await CampaignService.publish(
          session.activeTenantId,
          id,
          session.user.id
        );
        return NextResponse.json({ success: true, campaign });
      }

      case 'pause': {
        const campaign = await CampaignService.pause(session.activeTenantId, id);
        return NextResponse.json({ success: true, campaign });
      }

      case 'resume': {
        const campaign = await CampaignService.resume(session.activeTenantId, id);
        return NextResponse.json({ success: true, campaign });
      }

      case 'cancel': {
        const campaign = await CampaignService.cancel(session.activeTenantId, id);
        return NextResponse.json({ success: true, campaign });
      }

      case 'complete': {
        const campaign = await CampaignService.complete(session.activeTenantId, id);
        return NextResponse.json({ success: true, campaign });
      }

      case 'record-metrics': {
        await CampaignService.recordMetrics(id, body.metrics);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Campaigns API] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
