export const dynamic = 'force-dynamic'

/**
 * Church Suite — Cell Group Detail API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCellGroup,
  updateCellGroup,
  assignToCell,
  removeFromCell,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/cells/[id] - Get cell group details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const cellGroup = await getCellGroup(tenantId, id);

    if (!cellGroup) {
      return NextResponse.json({ error: 'Cell group not found' }, { status: 404 });
    }

    return NextResponse.json({
      cellGroup,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Cell Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/cells/[id] - Update cell group
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

    const cellGroup = await updateCellGroup(tenantId, id, body, actorId);

    return NextResponse.json({
      cellGroup,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Cell Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/cells/[id] - Actions (addMember, removeMember)
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
      case 'addMember': {
        if (!body.memberId) {
          return NextResponse.json(
            { error: 'memberId is required' },
            { status: 400 }
          );
        }
        const membership = await assignToCell(tenantId, {
          memberId: body.memberId,
          cellGroupId: id,
          role: body.role,
        }, actorId);
        return NextResponse.json({
          membership,
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      case 'removeMember': {
        if (!body.membershipId) {
          return NextResponse.json(
            { error: 'membershipId is required' },
            { status: 400 }
          );
        }
        const membership = await removeFromCell(tenantId, body.membershipId, actorId);
        return NextResponse.json({
          membership,
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
    console.error('Cell Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') || message.includes('already') ? 400 : 500 }
    );
  }
}
