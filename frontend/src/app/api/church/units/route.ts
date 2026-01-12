export const dynamic = 'force-dynamic'

/**
 * Church Suite — Church Units API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createChurchUnit,
  listChurchUnits,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/units - List units
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filters = {
      churchId: searchParams.get('churchId') || undefined,
      level: searchParams.get('level') as any || undefined,
      parentUnitId: searchParams.get('parentUnitId') || undefined,
      state: searchParams.get('state') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await listChurchUnits(tenantId, filters);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Units Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/units - Create unit
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
    if (!body.churchId || !body.name || !body.level) {
      return NextResponse.json(
        { error: 'churchId, name, and level are required' },
        { status: 400 }
      );
    }

    const unit = await createChurchUnit(tenantId, body, actorId);

    return NextResponse.json({
      unit,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Unit Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
