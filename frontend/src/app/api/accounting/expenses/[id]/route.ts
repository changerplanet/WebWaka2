export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Single Expense API
 * 
 * GET /api/accounting/expenses/[id] - Get single expense
 * PUT /api/accounting/expenses/[id] - Update expense (DRAFT/REJECTED only)
 * DELETE /api/accounting/expenses/[id] - Delete expense (DRAFT only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { ExpenseService } from '@/lib/accounting/expense-service';
import { AcctExpensePaymentMethod } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;

    const expense = await ExpenseService.getById(session.activeTenantId, id);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[Expenses API] Get by ID error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Validate amount if provided
    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (body.paymentMethod) {
      const validMethods: AcctExpensePaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'CREDIT', 'OTHER'];
      if (!validMethods.includes(body.paymentMethod)) {
        return NextResponse.json(
          { error: `Invalid paymentMethod. Must be one of: ${validMethods.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const expense = await ExpenseService.update(
      session.activeTenantId,
      id,
      {
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : undefined,
        accountCode: body.accountCode,
        categoryName: body.categoryName,
        amount: body.amount,
        taxAmount: body.taxAmount,
        taxCode: body.taxCode,
        isVatInclusive: body.isVatInclusive,
        paymentMethod: body.paymentMethod,
        paidFrom: body.paidFrom,
        vendorName: body.vendorName,
        vendorContact: body.vendorContact,
        vendorPhone: body.vendorPhone,
        description: body.description,
        memo: body.memo,
        receiptNumber: body.receiptNumber,
        receiptDate: body.receiptDate ? new Date(body.receiptDate) : undefined,
        attachmentUrls: body.attachmentUrls,
        metadata: body.metadata,
      },
      session.user.id
    );

    return NextResponse.json({
      ...expense,
      amount: expense.amount.toString(),
      taxAmount: expense.taxAmount?.toString(),
    });
  } catch (error) {
    console.error('[Expenses API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;

    await ExpenseService.delete(session.activeTenantId, id);

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('[Expenses API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
