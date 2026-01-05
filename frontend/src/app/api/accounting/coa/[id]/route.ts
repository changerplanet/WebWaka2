/**
 * MODULE 2: Accounting & Finance
 * Chart of Accounts - Single Account API
 * 
 * GET /api/accounting/coa/[id] - Get single account
 * PUT /api/accounting/coa/[id] - Update account
 * DELETE /api/accounting/coa/[id] - Delete account (non-system only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { ChartOfAccountService } from '@/lib/accounting/coa-service';
import { checkCapabilityForSession } from '@/lib/capabilities';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;

    const account = await ChartOfAccountService.getById(session.activeTenantId, id);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('[COA API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await request.json();

    const account = await ChartOfAccountService.update(
      session.activeTenantId,
      id,
      {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        metadata: body.metadata,
      },
      session.user.id
    );

    return NextResponse.json({ account });
  } catch (error) {
    console.error('[COA API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;

    await ChartOfAccountService.delete(session.activeTenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[COA API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
