export const dynamic = 'force-dynamic'

/**
 * Church Suite — Member Detail API
 * Phase 1: Registry & Membership
 * 
 * ⚠️ SAFEGUARDING: Minors data is protected
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMember,
  updateMember,
  changeMemberStatus,
  getMemberStatusHistory,
  getMemberRoles,
  getMemberCells,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/members/[id] - Get member details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = req.nextUrl.searchParams;
    
    // ⚠️ SAFEGUARDING: Only authorized users can see minor details
    const includeMinorDetails = searchParams.get('includeMinorDetails') === 'true';
    
    const member = await getMember(tenantId, id, includeMinorDetails);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Additional data based on query params
    let statusHistory = null;
    let roles = null;
    let cells = null;

    if (searchParams.get('includeStatusHistory') === 'true') {
      statusHistory = await getMemberStatusHistory(tenantId, id);
    }
    if (searchParams.get('includeRoles') === 'true') {
      roles = await getMemberRoles(tenantId, id);
    }
    if (searchParams.get('includeCells') === 'true') {
      cells = await getMemberCells(tenantId, id);
    }

    return NextResponse.json({
      member,
      statusHistory,
      roles,
      cells,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Member Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/members/[id] - Update member
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const member = await updateMember(tenantId, id, body, actorId);

    return NextResponse.json({
      member,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Member Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/members/[id] - Actions (changeStatus)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'changeStatus': {
        if (!body.newStatus) {
          return NextResponse.json(
            { error: 'newStatus is required' },
            { status: 400 }
          );
        }
        const member = await changeMemberStatus(tenantId, id, {
          newStatus: body.newStatus,
          reason: body.reason,
        }, actorId);
        return NextResponse.json({
          member,
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Member Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
