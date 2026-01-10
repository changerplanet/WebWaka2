/**
 * Political Suite - Expense Fact Detail API Route (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Only action allowed: verify (mark as verified after document review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExpenseFact, verifyExpenseFact } from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const COMMERCE_BOUNDARY_NOTICE = {
  _commerce_boundary: 'STRICTLY ENFORCED',
  _facts_only: 'This is a FACT record. Payment execution handled by Commerce suite.',
  _append_only: 'This record is IMMUTABLE. Only verification status can be updated.',
};

// GET /api/political/fundraising/expenses/[id] - Get expense fact details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const fact = await getExpenseFact(tenantId, id);

    if (!fact) {
      return NextResponse.json(
        { error: 'Expense fact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...fact, ...COMMERCE_BOUNDARY_NOTICE });
  } catch (error) {
    console.error('Get expense fact error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/fundraising/expenses/[id] - Verify expense fact (ONLY allowed action)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, verificationNote } = body;

    if (action !== 'verify') {
      return NextResponse.json(
        {
          error: 'Only "verify" action is permitted on expense facts.',
          code: 'INVALID_ACTION',
          allowed_actions: ['verify'],
        },
        { status: 400 }
      );
    }

    const verified = await verifyExpenseFact(tenantId, id, actorId, verificationNote);
    return NextResponse.json({ ...verified, ...COMMERCE_BOUNDARY_NOTICE });
  } catch (error) {
    console.error('Verify expense fact error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('already verified') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// Block modifications - APPEND-ONLY
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Expense facts are APPEND-ONLY. Only verification is permitted via POST with action: "verify".',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Expense facts are APPEND-ONLY. Only verification is permitted via POST with action: "verify".',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Expense facts are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}
