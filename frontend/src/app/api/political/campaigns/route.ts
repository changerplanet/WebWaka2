export const dynamic = 'force-dynamic'

/**
 * Political Suite - Campaigns API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCampaign,
  listCampaigns,
  PolCampaignStatus,
  PolCampaignType,
} from '@/lib/political';

// GET /api/political/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolCampaignType | undefined,
      status: searchParams.get('status') as PolCampaignStatus | undefined,
      state: searchParams.get('state') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listCampaigns(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('List campaigns error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.partyId || !body.name || !body.type || !body.startDate) {
      return NextResponse.json(
        { error: 'Party ID, name, type, and start date are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse dates
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    if (body.electionDate) body.electionDate = new Date(body.electionDate);

    const campaign = await createCampaign(tenantId, body, actorId);
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
