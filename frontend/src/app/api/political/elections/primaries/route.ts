/**
 * Political Suite - Primaries API Route (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT AN OFFICIAL ELECTION
 * 
 * Authorization: January 8, 2026 (Checkpoint B Approved)
 * Classification: HIGH-RISK PHASE — HEIGHTENED CONTROLS
 * 
 * MANDATORY LABELS IN ALL RESPONSES:
 * - UNOFFICIAL
 * - INTERNAL / PARTY-LEVEL ONLY
 * - NOT INEC / NOT GOVERNMENT / NOT CERTIFICATION
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPrimary,
  listPrimaries,
  PolPrimaryType,
  PolPrimaryStatus,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _classification: 'INTERNAL PARTY PRIMARY - NOT AN OFFICIAL ELECTION',
  _disclaimer1: 'UNOFFICIAL',
  _disclaimer2: 'INTERNAL / PARTY-LEVEL ONLY',
  _disclaimer3: 'NOT INEC / NOT GOVERNMENT / NOT CERTIFICATION',
  _legal_notice: 'Results have no legal standing. Not INEC-certified.',
};

// GET /api/political/elections/primaries - List primaries
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolPrimaryType | undefined,
      status: searchParams.get('status') as PolPrimaryStatus | undefined,
      state: searchParams.get('state') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listPrimaries(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('List primaries error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/elections/primaries - Create primary
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.partyId || !body.title || !body.type || !body.office) {
      return NextResponse.json(
        { 
          error: 'partyId, title, type, and office are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Validate jurisdiction
    if (!body.state && !body.zone) {
      return NextResponse.json(
        { 
          error: 'Jurisdiction (state or zone) is required for primary elections',
          code: 'JURISDICTION_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Parse dates if provided
    if (body.nominationStart) body.nominationStart = new Date(body.nominationStart);
    if (body.nominationEnd) body.nominationEnd = new Date(body.nominationEnd);
    if (body.votingStart) body.votingStart = new Date(body.votingStart);
    if (body.votingEnd) body.votingEnd = new Date(body.votingEnd);

    const primary = await createPrimary(tenantId, body, actorId);
    return NextResponse.json({ ...primary, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Create primary error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
