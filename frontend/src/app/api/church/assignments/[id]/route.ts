export const dynamic = 'force-dynamic'

/**
 * Church Suite — Role Assignment Detail API
 * Phase 1: Registry & Membership
 * 
 * APPEND-ONLY: Only terminate action allowed (no edit/delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  terminateRoleAssignment,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/assignments/[id] - Get assignment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;

    const assignment = await prisma.chu_role_assignment.findFirst({
      where: { id, tenantId },
      include: {
        member: { select: { firstName: true, lastName: true } },
        role: { select: { name: true, type: true } },
        unit: { select: { name: true, level: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({
      assignment,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Assignment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/assignments/[id] - Actions (terminate)
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
      case 'terminate': {
        const assignment = await terminateRoleAssignment(tenantId, id, {
          terminationReason: body.reason,
        }, actorId);
        return NextResponse.json({
          assignment,
          _append_only: 'Role terminated. Historical record preserved.',
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Only 'terminate' is allowed.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Assignment Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') || message.includes('already') ? 400 : 500 }
    );
  }
}

// PUT/PATCH/DELETE - FORBIDDEN (APPEND-ONLY)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Role assignments are APPEND-ONLY. Use POST with action: "terminate" instead.',
      _append_only: 'APPEND-ONLY: Cannot modify assignment history',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Role assignments are APPEND-ONLY. Use POST with action: "terminate" instead.',
      _append_only: 'APPEND-ONLY: Cannot modify assignment history',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Role assignments are APPEND-ONLY and IMMUTABLE. Records cannot be deleted.',
      _append_only: 'APPEND-ONLY: Cannot delete assignment history',
    },
    { status: 403 }
  );
}
