/**
 * MODULE 3: CRM & Customer Engagement
 * Campaigns API
 * 
 * GET /api/crm/campaigns - List campaigns
 * POST /api/crm/campaigns - Create campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { CampaignService } from '@/lib/crm/campaign-service';
import { CrmCampaignStatus, CrmCampaignType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CrmCampaignStatus | null;
    const campaignType = searchParams.get('campaignType') as CrmCampaignType | null;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await CampaignService.list(session.activeTenantId, {
      status: status || undefined,
      campaignType: campaignType || undefined,
      tags,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Campaigns API] List error:', error);
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

    if (!body.name || !body.campaignType || !body.channels?.length) {
      return NextResponse.json(
        { error: 'name, campaignType, and channels are required' },
        { status: 400 }
      );
    }

    const campaign = await CampaignService.create(
      session.activeTenantId,
      body,
      session.user.id
    );

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('[Campaigns API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
