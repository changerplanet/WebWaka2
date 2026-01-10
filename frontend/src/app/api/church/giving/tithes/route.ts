/**
 * Church Suite — Tithe Facts API
 * Phase 3: Giving & Financial Facts
 * 
 * 🚨 COMMERCE BOUNDARY: FACTS ONLY — APPEND-ONLY
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordTitheFact,
  getTitheFacts,
  COMMERCE_BOUNDARY,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/giving/tithes - List tithe facts
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
      memberId: searchParams.get('memberId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getTitheFacts(tenantId, filters);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Tithe Facts Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/giving/tithes - Record tithe fact (APPEND-ONLY)
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

    if (!body.churchId || body.amount === undefined) {
      return NextResponse.json(
        { error: 'churchId and amount are required' },
        { status: 400 }
      );
    }

    const fact = await recordTitheFact(tenantId, body, actorId);

    return NextResponse.json({
      fact,
      _append_only: 'Tithe facts are APPEND-ONLY and cannot be modified',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Record Tithe Fact Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT/PATCH/DELETE - FORBIDDEN (APPEND-ONLY)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Tithe facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify tithe facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Tithe facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify tithe facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Tithe facts are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete tithe facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}
