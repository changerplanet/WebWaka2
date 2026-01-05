/**
 * MODULE 2: Accounting & Finance
 * Financial Reports API
 * 
 * GET /api/accounting/reports/profit-loss - Profit & Loss Statement
 * GET /api/accounting/reports/balance-sheet - Balance Sheet
 * GET /api/accounting/reports/trial-balance - Trial Balance
 * GET /api/accounting/reports/cash-flow - Cash Flow Statement
 * GET /api/accounting/reports/expense-breakdown - Expense Breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { ReportsService } from '@/lib/accounting/reports-service';

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
    const reportType = searchParams.get('type') || 'profit-loss';
    const periodCode = searchParams.get('periodCode');
    const periodId = searchParams.get('periodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const asOfDate = searchParams.get('asOfDate');

    const filters = {
      periodCode: periodCode || undefined,
      periodId: periodId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    switch (reportType) {
      case 'profit-loss':
      case 'pnl':
      case 'income-statement': {
        const report = await ReportsService.generateProfitAndLoss(
          session.activeTenantId,
          filters
        );
        return NextResponse.json(report);
      }

      case 'balance-sheet': {
        const date = asOfDate ? new Date(asOfDate) : new Date();
        const report = await ReportsService.generateBalanceSheet(
          session.activeTenantId,
          date
        );
        return NextResponse.json(report);
      }

      case 'trial-balance': {
        const date = asOfDate ? new Date(asOfDate) : new Date();
        const report = await ReportsService.generateTrialBalance(
          session.activeTenantId,
          date
        );
        return NextResponse.json(report);
      }

      case 'cash-flow': {
        const report = await ReportsService.generateCashFlow(
          session.activeTenantId,
          filters
        );
        return NextResponse.json(report);
      }

      case 'expense-breakdown': {
        const report = await ReportsService.getExpenseBreakdown(
          session.activeTenantId,
          filters
        );
        return NextResponse.json(report);
      }

      default:
        return NextResponse.json(
          { 
            error: `Invalid report type: ${reportType}`,
            validTypes: ['profit-loss', 'balance-sheet', 'trial-balance', 'cash-flow', 'expense-breakdown']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Reports API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
