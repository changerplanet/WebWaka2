export const dynamic = 'force-dynamic'

/**
 * Church Suite — Church Detail API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChurch,
  updateChurch,
  getHierarchy,
  seedDefaultRoles,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/churches/[id] - Get church details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const includeHierarchy = req.nextUrl.searchParams.get('includeHierarchy') === 'true';

    const church = await getChurch(tenantId, id);

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    let hierarchy = null;
    if (includeHierarchy) {
      hierarchy = await getHierarchy(tenantId, id);
    }

    return NextResponse.json({
      church,
      hierarchy,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Church Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/churches/[id] - Update church
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

    const church = await updateChurch(tenantId, id, body, actorId);

    return NextResponse.json({
      church,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Church Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/churches/[id] - Actions (seedRoles, etc.)
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
      case 'seedRoles': {
        const roles = await seedDefaultRoles(tenantId, id, actorId);
        return NextResponse.json({
          message: `Created ${roles.length} default roles`,
          roles,
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
    console.error('Church Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
