/**
 * Political Suite - Party Detail API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getParty,
  updateParty,
  createPartyOrgan,
  listPartyOrgans,
  getPartyOrganHierarchy,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/parties/[id] - Get party details
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
    const includeOrgans = searchParams.get('includeOrgans') === 'true';
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true';

    const party = await getParty(tenantId, id);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    let response: Record<string, unknown> = { ...party };

    if (includeOrgans) {
      response.allOrgans = await listPartyOrgans(tenantId, id);
    }

    if (includeHierarchy) {
      response.hierarchy = await getPartyOrganHierarchy(tenantId, id);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get party error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/parties/[id] - Update party
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
    const party = await updateParty(tenantId, id, body, actorId);
    return NextResponse.json(party);
  } catch (error) {
    console.error('Update party error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Party not found' ? 404 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/parties/[id] - Actions (create organ)
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
      case 'createOrgan':
        if (!data.name || !data.level) {
          return NextResponse.json(
            { error: 'Name and level are required for organ', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const organ = await createPartyOrgan(tenantId, { partyId: id, ...data }, actorId);
        return NextResponse.json(organ, { status: 201 });

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Party action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
