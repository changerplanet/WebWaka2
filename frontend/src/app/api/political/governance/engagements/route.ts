/**
 * Political Suite - Engagements API Route (Phase 4)
 * POST-ELECTION COMMUNITY ENGAGEMENT
 * 
 * MANDATORY LABELS:
 * - NON-PARTISAN COMMUNITY ENGAGEMENT
 * - FOR INFORMATIONAL PURPOSES ONLY
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createEngagement,
  listEngagements,
  getEngagement,
  updateEngagement,
  publishEngagement,
  incrementViewCount,
  PolEngagementType,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'NON-PARTISAN COMMUNITY ENGAGEMENT',
  _disclaimer2: 'FOR INFORMATIONAL PURPOSES ONLY',
};

// GET /api/political/governance/engagements - List engagements
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
    const engagementId = searchParams.get('id');

    // Get single engagement by ID
    if (engagementId) {
      const engagement = await getEngagement(tenantId, engagementId);
      if (!engagement) {
        return NextResponse.json(
          { error: 'Engagement not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...engagement, ...MANDATORY_NOTICE });
    }

    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolEngagementType | undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true :
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      state: searchParams.get('state') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listEngagements(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('List engagements error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/engagements - Create engagement or actions
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
    const { action } = body;

    // Handle actions
    if (action === 'publish') {
      if (!body.engagementId) {
        return NextResponse.json(
          { error: 'engagementId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const engagement = await publishEngagement(tenantId, body.engagementId, actorId);
      return NextResponse.json({ ...engagement, ...MANDATORY_NOTICE });
    }

    if (action === 'view') {
      if (!body.engagementId) {
        return NextResponse.json(
          { error: 'engagementId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const result = await incrementViewCount(tenantId, body.engagementId);
      return NextResponse.json(result);
    }

    if (action === 'update') {
      if (!body.engagementId) {
        return NextResponse.json(
          { error: 'engagementId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const { engagementId, action: _, ...updateData } = body;
      if (updateData.scheduledAt) updateData.scheduledAt = new Date(updateData.scheduledAt);
      const engagement = await updateEngagement(tenantId, engagementId, updateData, actorId);
      return NextResponse.json({ ...engagement, ...MANDATORY_NOTICE });
    }

    // Create engagement
    if (!body.partyId || !body.type || !body.title || !body.description) {
      return NextResponse.json(
        { 
          error: 'partyId, type, title, and description are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);

    const engagement = await createEngagement(tenantId, body, actorId);
    return NextResponse.json({ ...engagement, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Engagement action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('cannot') || message.includes('already') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
