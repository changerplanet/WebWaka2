/**
 * Church Suite — Unit Detail API
 * Phase 1: Registry & Membership
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getChurchUnit,
  updateChurchUnit,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/units/[id] - Get unit details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const unit = await getChurchUnit(tenantId, id);

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json({
      unit,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Unit Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/units/[id] - Update unit
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

    const unit = await updateChurchUnit(tenantId, id, body, actorId);

    return NextResponse.json({
      unit,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Unit Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
