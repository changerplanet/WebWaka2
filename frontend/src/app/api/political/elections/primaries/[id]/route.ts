/**
 * Political Suite - Primary Detail API Route (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT AN OFFICIAL ELECTION
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPrimary,
  updatePrimary,
  transitionPrimaryStatus,
  addAspirant,
  screenAspirant,
  clearAspirant,
  listAspirants,
  PolPrimaryStatus,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MANDATORY_NOTICE = {
  _classification: 'INTERNAL PARTY PRIMARY - NOT AN OFFICIAL ELECTION',
  _disclaimer1: 'UNOFFICIAL',
  _disclaimer2: 'INTERNAL / PARTY-LEVEL ONLY',
  _disclaimer3: 'NOT INEC / NOT GOVERNMENT / NOT CERTIFICATION',
};

// GET /api/political/elections/primaries/[id] - Get primary details
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
    const includeAspirants = searchParams.get('includeAspirants') === 'true';

    const primary = await getPrimary(tenantId, id);

    if (!primary) {
      return NextResponse.json(
        { error: 'Primary not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let response: Record<string, unknown> = { ...primary, ...MANDATORY_NOTICE };

    if (includeAspirants) {
      const aspirants = await listAspirants(tenantId, id, { isActive: true });
      response.allAspirants = aspirants;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get primary error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/elections/primaries/[id] - Update primary
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
    if (body.nominationStart) body.nominationStart = new Date(body.nominationStart);
    if (body.nominationEnd) body.nominationEnd = new Date(body.nominationEnd);
    if (body.votingStart) body.votingStart = new Date(body.votingStart);
    if (body.votingEnd) body.votingEnd = new Date(body.votingEnd);

    const primary = await updatePrimary(tenantId, id, body, actorId);
    return NextResponse.json({ ...primary, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Update primary error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('only be updated') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/elections/primaries/[id] - Actions
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
      case 'transition':
        if (!data.newStatus) {
          return NextResponse.json(
            { error: 'newStatus is required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const transitioned = await transitionPrimaryStatus(
          tenantId, id, data.newStatus as PolPrimaryStatus, actorId, data.statusNote
        );
        return NextResponse.json({ ...transitioned, ...MANDATORY_NOTICE });

      case 'addAspirant':
        if (!data.firstName || !data.lastName || !data.phone) {
          return NextResponse.json(
            { error: 'firstName, lastName, and phone are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const aspirant = await addAspirant(tenantId, { primaryId: id, ...data }, actorId);
        return NextResponse.json({ ...aspirant, ...MANDATORY_NOTICE }, { status: 201 });

      case 'screenAspirant':
        if (!data.aspirantId || typeof data.passed !== 'boolean') {
          return NextResponse.json(
            { error: 'aspirantId and passed (boolean) are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const screened = await screenAspirant(
          tenantId, data.aspirantId, actorId, data.passed, data.screeningNote
        );
        return NextResponse.json({ ...screened, ...MANDATORY_NOTICE });

      case 'clearAspirant':
        if (!data.aspirantId) {
          return NextResponse.json(
            { error: 'aspirantId is required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const cleared = await clearAspirant(
          tenantId, data.aspirantId, actorId, data.clearanceNote
        );
        return NextResponse.json({ ...cleared, ...MANDATORY_NOTICE });

      default:
        return NextResponse.json(
          { 
            error: 'Unknown action', 
            code: 'INVALID_ACTION',
            allowed_actions: ['transition', 'addAspirant', 'screenAspirant', 'clearAspirant'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Primary action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('Invalid') || message.includes('already') || 
                   message.includes('not open') || message.includes('must pass') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
