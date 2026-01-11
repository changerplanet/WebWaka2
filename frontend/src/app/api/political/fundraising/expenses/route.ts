export const dynamic = 'force-dynamic'

/**
 * Political Suite - Expenses API Route (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 * 
 * CRITICAL: This API records EXPENSE FACTS only.
 * Records are APPEND-ONLY — only verification status can be updated.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordExpenseFact,
  queryExpenseFacts,
  getExpenseStats,
  PolExpenseCategory,
  PolExpenseStatus,
} from '@/lib/political';

const COMMERCE_BOUNDARY_NOTICE = {
  _commerce_boundary: 'STRICTLY ENFORCED',
  _facts_only: 'Records FACTS only. Payment execution handled by Commerce suite.',
  _append_only: 'Records are APPEND-ONLY. Only verification status can be updated.',
};

// GET /api/political/fundraising/expenses - Query expense facts
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
    
    // Check for stats query
    if (searchParams.get('stats') === 'true') {
      const campaignId = searchParams.get('campaignId') || undefined;
      const partyId = searchParams.get('partyId') || undefined;
      const stats = await getExpenseStats(tenantId, campaignId, partyId);
      return NextResponse.json({ ...stats, ...COMMERCE_BOUNDARY_NOTICE });
    }

    const filters = {
      campaignId: searchParams.get('campaignId') || undefined,
      partyId: searchParams.get('partyId') || undefined,
      category: searchParams.get('category') as PolExpenseCategory | undefined,
      status: searchParams.get('status') as PolExpenseStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      requiresDisclosure: searchParams.get('requiresDisclosure') === 'true' ? true :
                          searchParams.get('requiresDisclosure') === 'false' ? false : undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true :
                  searchParams.get('isVerified') === 'false' ? false : undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await queryExpenseFacts(tenantId, filters);
    return NextResponse.json({ ...result, ...COMMERCE_BOUNDARY_NOTICE });
  } catch (error) {
    console.error('Query expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/fundraising/expenses - Record expense fact (APPEND-ONLY)
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
    if ((!body.campaignId && !body.partyId) || !body.amount || !body.category || 
        !body.beneficiaryName || !body.expenseDate || !body.description) {
      return NextResponse.json(
        { 
          error: 'campaignId or partyId, amount, category, beneficiaryName, expenseDate, and description are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Parse dates
    body.expenseDate = new Date(body.expenseDate);
    if (body.paymentDate) body.paymentDate = new Date(body.paymentDate);

    const fact = await recordExpenseFact(tenantId, body, actorId);
    return NextResponse.json(
      { ...fact, ...COMMERCE_BOUNDARY_NOTICE },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record expense fact error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Block updates - APPEND-ONLY (verification handled via [id] route)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Expense facts are APPEND-ONLY. Use /api/political/fundraising/expenses/[id] to verify.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Expense facts are APPEND-ONLY. Use /api/political/fundraising/expenses/[id] to verify.',
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
