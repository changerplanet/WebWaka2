export const dynamic = 'force-dynamic'

/**
 * Church Suite — Budget Facts API
 * Phase 3: Giving & Financial Facts
 * 
 * 🚨 COMMERCE BOUNDARY: FACTS ONLY — APPEND-ONLY
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordBudgetFact,
  getBudgetFacts,
  COMMERCE_BOUNDARY,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/giving/budgets - List budget facts
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId');

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    const fiscalYear = searchParams.get('fiscalYear') ? parseInt(searchParams.get('fiscalYear')!) : undefined;

    const result = await getBudgetFacts(tenantId, churchId, fiscalYear);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Budget Facts Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/giving/budgets - Record budget fact (APPEND-ONLY)
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

    if (!body.churchId || !body.fiscalYear || !body.category || body.allocatedAmount === undefined || !body.approvedBy || !body.approvalDate) {
      return NextResponse.json(
        { error: 'churchId, fiscalYear, category, allocatedAmount, approvedBy, and approvalDate are required' },
        { status: 400 }
      );
    }

    const fact = await recordBudgetFact(tenantId, body, actorId);

    return NextResponse.json({
      fact,
      _append_only: 'Budget facts are APPEND-ONLY and cannot be modified',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Record Budget Fact Error:', error);
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
      message: 'Budget facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify budget facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Budget facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify budget facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Budget facts are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete budget facts',
      ...COMMERCE_BOUNDARY,
    },
    { status: 403 }
  );
}
