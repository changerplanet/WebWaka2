export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Expense Summary API
 * 
 * GET /api/accounting/expenses/summary - Get expense summaries
 * 
 * Returns expense totals grouped by category or payment method.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { ExpenseService } from '@/lib/accounting/expense-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'category';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (groupBy === 'paymentMethod') {
      const summary = await ExpenseService.getSummaryByPaymentMethod(
        session.activeTenantId,
        start,
        end
      );
      return NextResponse.json({
        groupBy: 'paymentMethod',
        summary,
      });
    } else {
      const summary = await ExpenseService.getSummaryByCategory(
        session.activeTenantId,
        start,
        end
      );
      return NextResponse.json({
        groupBy: 'category',
        ...summary,
      });
    }
  } catch (error) {
    console.error('[Expenses API] Get summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
