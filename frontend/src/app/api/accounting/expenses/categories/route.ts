/**
 * MODULE 2: Accounting & Finance
 * Expense Categories API
 * 
 * GET /api/accounting/expenses/categories - Get expense categories
 * 
 * Returns pre-defined Nigeria SME expense categories with their
 * corresponding Chart of Account codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { EXPENSE_CATEGORIES } from '@/lib/accounting/expense-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    return NextResponse.json({
      categories: EXPENSE_CATEGORIES,
      total: EXPENSE_CATEGORIES.length,
    });
  } catch (error) {
    console.error('[Expenses API] Get categories error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
