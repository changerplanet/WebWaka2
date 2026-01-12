export const dynamic = 'force-dynamic'

/**
 * Church Suite — Role Assignments API
 * Phase 1: Registry & Membership
 * 
 * APPEND-ONLY: Role assignment history cannot be modified
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  assignRole,
  terminateRoleAssignment,
  getMemberRoles,
  getLeadershipHistory,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/assignments - List assignments
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const churchId = searchParams.get('churchId');
    const unitId = searchParams.get('unitId') || undefined;

    if (memberId) {
      // Get member's roles
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const roles = await getMemberRoles(tenantId, memberId, includeInactive);
      return NextResponse.json({
        roles,
        total: roles.length,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    if (churchId) {
      // Get leadership history
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
      const history = await getLeadershipHistory(tenantId, churchId, unitId, limit);
      return NextResponse.json({
        history,
        total: history.length,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    return NextResponse.json(
      { error: 'Either memberId or churchId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('List Assignments Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/assignments - Assign role
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.churchId || !body.memberId || !body.roleId) {
      return NextResponse.json(
        { error: 'churchId, memberId, and roleId are required' },
        { status: 400 }
      );
    }

    const assignment = await assignRole(tenantId, body, actorId);

    return NextResponse.json({
      assignment,
      _append_only: 'Role assignment history is APPEND-ONLY',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Assign Role Error:', error);
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
      message: 'Role assignments are APPEND-ONLY. Use POST /api/church/assignments/[id] with action: "terminate" instead.',
      _append_only: 'APPEND-ONLY: Cannot modify assignment history',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Role assignments are APPEND-ONLY. Use POST /api/church/assignments/[id] with action: "terminate" instead.',
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
