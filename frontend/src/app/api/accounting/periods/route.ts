/**
 * MODULE 2: Accounting & Finance
 * Financial Periods API
 * 
 * GET /api/accounting/periods - List financial periods
 * POST /api/accounting/periods/[code]/close - Close a financial period
 * 
 * Financial periods control when journal entries can be posted.
 * Periods are auto-created when needed (monthly by default).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import { AcctPeriodStatus } from '@prisma/client';

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
    const status = searchParams.get('status') as AcctPeriodStatus | null;
    const fiscalYear = searchParams.get('fiscalYear');

    // Build query
    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    };

    if (status) where.status = status;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);

    const periods = await prisma.acct_financial_periods.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { startDate: 'desc' }],
      include: {
        _count: {
          select: { acct_journal_entries: true, ledgerEntries: true },
        },
      },
    });

    // Transform for response
    const response = periods.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      periodType: p.periodType,
      startDate: p.startDate,
      endDate: p.endDate,
      fiscalYear: p.fiscalYear,
      status: p.status,
      isCurrent: p.status === 'OPEN' && 
        new Date() >= p.startDate && 
        new Date() <= p.endDate,
      closedAt: p.closedAt,
      closedBy: p.closedBy,
      journalCount: p._count.journalEntries,
      ledgerEntryCount: p._count.ledgerEntries,
      createdAt: p.createdAt,
    }));

    // Find current period
    const currentPeriod = response.find((p) => p.isCurrent);

    return NextResponse.json({
      periods: response,
      total: response.length,
      currentPeriod: currentPeriod || null,
    });
  } catch (error) {
    console.error('[Periods API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounting/periods - Create or close a period
 * Body: { action: 'close', code: string } or { action: 'reopen', code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action, code } = body;

    if (!action || !code) {
      return NextResponse.json(
        { error: 'action and code are required' },
        { status: 400 }
      );
    }

    // Find the period
    const period = await prisma.acct_financial_periods.findUnique({
      where: {
        tenantId_code: { tenantId: session.activeTenantId, code },
      },
    });

    if (!period) {
      return NextResponse.json(
        { error: `Period '${code}' not found` },
        { status: 404 }
      );
    }

    if (action === 'close') {
      if (period.status === 'CLOSED') {
        return NextResponse.json(
          { error: 'Period is already closed' },
          { status: 400 }
        );
      }

      // Close the period
      const updated = await prisma.acct_financial_periods.update({
        where: { id: period.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedBy: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Period '${code}' closed successfully`,
        period: {
          id: updated.id,
          code: updated.code,
          name: updated.name,
          status: updated.status,
          closedAt: updated.closedAt,
        },
      });
    } else if (action === 'reopen') {
      if (period.status !== 'CLOSED') {
        return NextResponse.json(
          { error: 'Only closed periods can be reopened' },
          { status: 400 }
        );
      }

      // Reopen the period
      const updated = await prisma.acct_financial_periods.update({
        where: { id: period.id },
        data: {
          status: 'OPEN',
          closedAt: null,
          closedBy: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Period '${code}' reopened successfully`,
        period: {
          id: updated.id,
          code: updated.code,
          name: updated.name,
          status: updated.status,
        },
      });
    } else {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Use 'close' or 'reopen'` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Periods API] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
