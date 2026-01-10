/**
 * Church Suite — Ministries API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createMinistry,
  listMinistries,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/ministries - List ministries
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filters = {
      churchId: searchParams.get('churchId') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      type: searchParams.get('type') as any || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true :
                searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await listMinistries(tenantId, filters);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Ministries Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/ministries - Create ministry
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

    if (!body.churchId || !body.name || !body.type) {
      return NextResponse.json(
        { error: 'churchId, name, and type are required' },
        { status: 400 }
      );
    }

    const ministry = await createMinistry(tenantId, body, actorId);

    return NextResponse.json({
      ministry,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Ministry Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
