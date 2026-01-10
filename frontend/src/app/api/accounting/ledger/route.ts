/**
 * MODULE 2: Accounting & Finance
 * Ledger Entries API
 * 
 * GET /api/accounting/ledger - List ledger entries
 * 
 * Provides access to individual ledger entries (the actual debit/credit lines)
 * for account-specific views and reconciliation.
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
    const accountCode = searchParams.get('accountCode');
    const ledgerAccountId = searchParams.get('ledgerAccountId');
    const periodId = searchParams.get('periodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build query
    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    };

    // Filter by account code (requires join)
    let ledgerAccountIdFilter: string | undefined;
    if (accountCode) {
      const chartAccount = await prisma.acct_chart_of_accounts.findFirst({
        where: { tenantId: session.activeTenantId, code: accountCode },
      });
      if (!chartAccount) {
        return NextResponse.json({ error: `Account code '${accountCode}' not found` }, { status: 404 });
      }
      
      const ledgerAccount = await prisma.acct_ledger_accounts.findFirst({
        where: { tenantId: session.activeTenantId, chartOfAccountId: chartAccount.id },
      });
      if (!ledgerAccount) {
        return NextResponse.json({
          entries: [],
          total: 0,
          account: {
            code: chartAccount.code,
            name: chartAccount.name,
            type: chartAccount.accountType,
          },
          message: 'No ledger entries for this account',
        });
      }
      ledgerAccountIdFilter = ledgerAccount.id;
    }

    if (ledgerAccountIdFilter || ledgerAccountId) {
      where.ledgerAccountId = ledgerAccountIdFilter || ledgerAccountId;
    }

    if (periodId) where.periodId = periodId;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) (where.entryDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.entryDate as Record<string, Date>).lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.acct_ledger_entries.findMany({
        where,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        take: limit ? parseInt(limit) : 100,
        skip: offset ? parseInt(offset) : 0,
        include: {
          ledgerAccount: {
            include: { chartOfAccount: true },
          },
          journalEntry: {
            select: {
              id: true,
              journalNumber: true,
              description: true,
              sourceType: true,
              sourceModule: true,
              status: true,
            },
          },
          period: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.acct_ledger_entries.count({ where }),
    ]);

    // Transform for response
    const response = entries.map((e) => ({
      id: e.id,
      entryDate: e.entryDate,
      lineNumber: e.lineNumber,
      account: {
        id: e.ledgerAccountId,
        code: e.ledgerAccount.chartOfAccount.code,
        name: e.ledgerAccount.chartOfAccount.name,
        type: e.ledgerAccount.chartOfAccount.accountType,
        normalBalance: e.ledgerAccount.chartOfAccount.normalBalance,
      },
      debitAmount: e.debitAmount.toString(),
      creditAmount: e.creditAmount.toString(),
      balanceAfter: e.balanceAfter.toString(),
      description: e.description,
      memo: e.memo,
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      referenceNumber: e.referenceNumber,
      journal: e.journalEntry ? {
        id: e.journalEntry.id,
        journalNumber: e.journalEntry.journalNumber,
        description: e.journalEntry.description,
        sourceType: e.journalEntry.sourceType,
        sourceModule: e.journalEntry.sourceModule,
        status: e.journalEntry.status,
      } : null,
      period: e.period ? { id: e.period.id, name: e.period.name, code: e.period.code } : null,
      createdAt: e.createdAt,
    }));

    return NextResponse.json({
      entries: response,
      total,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });
  } catch (error) {
    console.error('[Ledger API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
