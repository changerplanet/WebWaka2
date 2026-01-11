export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Ledger Accounts API
 * 
 * GET /api/accounting/ledger/accounts - List ledger accounts with balances
 * 
 * Ledger accounts are the runtime instances of Chart of Accounts
 * that track actual balances and period activity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';

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
    const accountType = searchParams.get('accountType');
    const hasActivity = searchParams.get('hasActivity');

    // Build query
    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    };

    if (accountType) {
      where.chartOfAccount = { accountType };
    }

    // Filter by activity (non-zero balance or period activity)
    if (hasActivity === 'true') {
      where.OR = [
        { currentBalance: { not: 0 } },
        { periodDebit: { not: 0 } },
        { periodCredit: { not: 0 } },
      ];
    }

    const accounts = await prisma.acct_ledger_accounts.findMany({
      where,
      orderBy: [
        { acct_chart_of_accounts: { sortOrder: 'asc' } },
        { acct_chart_of_accounts: { code: 'asc' } },
      ],
      include: {
        acct_chart_of_accounts: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            accountType: true,
            accountSubType: true,
            normalBalance: true,
            isActive: true,
            isBankAccount: true,
            isTaxAccount: true,
          },
        },
      },
    });

    // Transform for response
    const response = accounts.map((a) => ({
      id: a.id,
      chartOfAccountId: a.chartOfAccountId,
      code: a.acct_chart_of_accounts.code,
      name: a.acct_chart_of_accounts.name,
      description: a.acct_chart_of_accounts.description,
      accountType: a.acct_chart_of_accounts.accountType,
      accountSubType: a.acct_chart_of_accounts.accountSubType,
      normalBalance: a.acct_chart_of_accounts.normalBalance,
      isActive: a.acct_chart_of_accounts.isActive,
      isBankAccount: a.acct_chart_of_accounts.isBankAccount,
      isTaxAccount: a.acct_chart_of_accounts.isTaxAccount,
      currency: a.currency,
      currentBalance: a.currentBalance.toString(),
      openingBalance: a.openingBalance.toString(),
      periodDebit: a.periodDebit.toString(),
      periodCredit: a.periodCredit.toString(),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    // Calculate summary by account type
    const summary: Record<string, { count: number; totalBalance: string }> = {};
    for (const account of accounts) {
      const type = account.acct_chart_of_accounts.accountType;
      if (!summary[type]) {
        summary[type] = { count: 0, totalBalance: '0' };
      }
      summary[type].count++;
      const current = parseFloat(summary[type].totalBalance);
      const balance = parseFloat(account.currentBalance.toString());
      summary[type].totalBalance = (current + balance).toFixed(2);
    }

    return NextResponse.json({
      accounts: response,
      total: accounts.length,
      summary,
    });
  } catch (error) {
    console.error('[Ledger Accounts API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
