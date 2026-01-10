/**
 * Political Suite - Campaign Detail API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaign,
  updateCampaign,
  activateCampaign,
  createCandidate,
  listCandidates,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/campaigns/[id] - Get campaign details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeCandidates = searchParams.get('includeCandidates') === 'true';

    const campaign = await getCampaign(tenantId, id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let response: Record<string, unknown> = { ...campaign };

    if (includeCandidates) {
      response.allCandidates = await listCandidates(tenantId, id);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/campaigns/[id] - Update campaign
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Parse dates if provided
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    if (body.electionDate) body.electionDate = new Date(body.electionDate);

    const campaign = await updateCampaign(tenantId, id, body, actorId);
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('Cannot update') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/campaigns/[id] - Actions (activate, add candidate)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'activate':
        const activatedCampaign = await activateCampaign(tenantId, id, actorId);
        return NextResponse.json(activatedCampaign);

      case 'addCandidate':
        if (!data.firstName || !data.lastName || !data.phone || !data.position) {
          return NextResponse.json(
            { error: 'First name, last name, phone, and position are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
        const candidate = await createCandidate(tenantId, { campaignId: id, ...data }, actorId);
        return NextResponse.json(candidate, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Campaign action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
