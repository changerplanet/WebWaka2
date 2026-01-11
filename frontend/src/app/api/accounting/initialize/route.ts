export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Initialize Accounting API
 * 
 * POST /api/accounting/initialize - Initialize accounting for tenant
 * 
 * This creates:
 * - Default Chart of Accounts (Nigeria SME template)
 * - Initial financial period
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { ChartOfAccountService } from '@/lib/accounting/coa-service';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    // Initialize Chart of Accounts
    const coaResult = await ChartOfAccountService.initializeForTenant(
      session.activeTenantId,
      session.user.id
    );

    // Create initial financial period (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const periodCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const periodName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Check if period already exists
    let period = await prisma.acct_financial_periods.findUnique({
      where: {
        tenantId_code: {
          tenantId: session.activeTenantId,
          code: periodCode,
        },
      },
    });

    if (!period) {
      period = await prisma.acct_financial_periods.create({
        data: withPrismaDefaults({
          tenantId: session.activeTenantId,
          name: periodName,
          code: periodCode,
          periodType: 'MONTHLY',
          startDate: startOfMonth,
          endDate: endOfMonth,
          fiscalYear: now.getFullYear(),
          status: 'OPEN',
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Accounting initialized successfully',
      chartOfAccounts: {
        accountCount: coaResult.accountCount,
        template: 'NIGERIA_SME',
      },
      currentPeriod: {
        id: period.id,
        name: period.name,
        code: period.code,
        status: period.status,
      },
    });
  } catch (error) {
    console.error('[Accounting API] Initialize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    // Check initialization status
    const accountCount = await prisma.acct_chart_of_accounts.count({
      where: { tenantId: session.activeTenantId },
    });

    const currentPeriod = await prisma.acct_financial_periods.findFirst({
      where: {
        tenantId: session.activeTenantId,
        status: 'OPEN',
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({
      initialized: accountCount > 0,
      accountCount,
      currentPeriod: currentPeriod
        ? {
            id: currentPeriod.id,
            name: currentPeriod.name,
            code: currentPeriod.code,
            status: currentPeriod.status,
          }
        : null,
    });
  } catch (error) {
    console.error('[Accounting API] Status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
