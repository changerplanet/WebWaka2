/**
 * Church Suite — Churches API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createChurch,
  listChurches,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/churches - List churches
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') || undefined,
      state: searchParams.get('state') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await listChurches(tenantId, filters);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Churches Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/churches - Create church
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

    // Validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Church name is required' },
        { status: 400 }
      );
    }

    const church = await createChurch(tenantId, body, actorId);

    return NextResponse.json({
      church,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Church Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
