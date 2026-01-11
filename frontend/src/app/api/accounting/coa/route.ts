export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Chart of Accounts API
 * 
 * GET /api/accounting/coa - List all accounts
 * POST /api/accounting/coa - Create custom account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { ChartOfAccountService } from '@/lib/accounting/coa-service';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { AcctAccountType } from '@prisma/client';

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
    const accountType = searchParams.get('accountType') as AcctAccountType | null;
    const isActive = searchParams.get('isActive');
    const format = searchParams.get('format'); // 'tree' or 'flat'

    // Return tree format if requested
    if (format === 'tree') {
      const tree = await ChartOfAccountService.getTree(session.activeTenantId);
      return NextResponse.json({ accounts: tree, format: 'tree' });
    }

    const accounts = await ChartOfAccountService.list(session.activeTenantId, {
      accountType: accountType || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeChildren: true,
    });

    return NextResponse.json({ accounts, count: accounts.length });
  } catch (error) {
    console.error('[COA API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Validate required fields
    if (!body.code || !body.name || !body.accountType) {
      return NextResponse.json(
        { error: 'code, name, and accountType are required' },
        { status: 400 }
      );
    }

    const account = await ChartOfAccountService.create(
      session.activeTenantId,
      {
        code: body.code,
        name: body.name,
        description: body.description,
        accountType: body.accountType,
        accountSubType: body.accountSubType,
        parentId: body.parentId,
        normalBalance: body.normalBalance,
        isBankAccount: body.isBankAccount,
        isControlAccount: body.isControlAccount,
        taxCode: body.taxCode,
        isTaxAccount: body.isTaxAccount,
        sortOrder: body.sortOrder,
        metadata: body.metadata,
      },
      session.user.id
    );

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('[COA API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
