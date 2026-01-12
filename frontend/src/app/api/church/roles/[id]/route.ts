export const dynamic = 'force-dynamic'

/**
 * Church Suite — Role Detail API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRole,
  updateRole,
  getRoleHolders,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/roles/[id] - Get role details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = req.nextUrl.searchParams;

    const role = await getRole(tenantId, id);

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    let holders = null;
    if (searchParams.get('includeHolders') === 'true') {
      const unitId = searchParams.get('unitId') || undefined;
      holders = await getRoleHolders(tenantId, id, unitId);
    }

    return NextResponse.json({
      role,
      holders,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Role Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/roles/[id] - Update role
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

    const role = await updateRole(tenantId, id, body, actorId);

    return NextResponse.json({
      role,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Role Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
