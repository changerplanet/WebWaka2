/**
 * Church Suite — Ministry Detail API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMinistry,
  updateMinistry,
  getMinistryMembers,
  assignToMinistry,
  endMinistryAssignment,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/ministries/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = req.nextUrl.searchParams;

    const ministry = await getMinistry(tenantId, id);

    if (!ministry) {
      return NextResponse.json({ error: 'Ministry not found' }, { status: 404 });
    }

    let members = null;
    if (searchParams.get('includeMembers') === 'true') {
      members = await getMinistryMembers(tenantId, id);
    }

    return NextResponse.json({
      ministry,
      members,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Ministry Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/ministries/[id]
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

    const ministry = await updateMinistry(tenantId, id, body, actorId);

    return NextResponse.json({
      ministry,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Ministry Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/ministries/[id] - Actions (assignMember, removeMember)
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
      case 'assignMember': {
        if (!body.churchId || !body.memberId) {
          return NextResponse.json(
            { error: 'churchId and memberId are required' },
            { status: 400 }
          );
        }
        const assignment = await assignToMinistry(tenantId, {
          churchId: body.churchId,
          memberId: body.memberId,
          ministryId: id,
          role: body.role,
          effectiveDate: body.effectiveDate,
        }, actorId);
        return NextResponse.json({
          assignment,
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      case 'removeMember': {
        if (!body.assignmentId) {
          return NextResponse.json(
            { error: 'assignmentId is required' },
            { status: 400 }
          );
        }
        const assignment = await endMinistryAssignment(tenantId, body.assignmentId, actorId);
        return NextResponse.json({
          assignment,
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
    console.error('Ministry Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
