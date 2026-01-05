/**
 * MODULE 2: Accounting & Finance
 * Expenses API
 * 
 * GET /api/accounting/expenses - List expenses with filters
 * POST /api/accounting/expenses - Create new expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { ExpenseService, EXPENSE_CATEGORIES } from '@/lib/accounting/expense-service';
import { AcctExpenseStatus, AcctExpensePaymentMethod } from '@prisma/client';

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
    const status = searchParams.get('status') as AcctExpenseStatus | null;
    const paymentMethod = searchParams.get('paymentMethod') as AcctExpensePaymentMethod | null;
    const periodId = searchParams.get('periodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vendorName = searchParams.get('vendorName');
    const accountCode = searchParams.get('accountCode');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await ExpenseService.list(session.activeTenantId, {
      status: status || undefined,
      paymentMethod: paymentMethod || undefined,
      periodId: periodId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      vendorName: vendorName || undefined,
      accountCode: accountCode || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({
      expenses: result.expenses,
      total: result.total,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  } catch (error) {
    console.error('[Expenses API] List error:', error);
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
    if (!body.expenseDate || !body.accountCode || !body.amount || !body.description || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'expenseDate, accountCode, amount, description, and paymentMethod are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods: AcctExpensePaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'CREDIT', 'OTHER'];
    if (!validMethods.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const expense = await ExpenseService.create(
      session.activeTenantId,
      {
        expenseDate: new Date(body.expenseDate),
        accountCode: body.accountCode,
        categoryName: body.categoryName,
        amount: body.amount,
        currency: body.currency,
        taxAmount: body.taxAmount,
        taxCode: body.taxCode,
        isVatInclusive: body.isVatInclusive,
        paymentMethod: body.paymentMethod,
        paidFrom: body.paidFrom,
        vendorName: body.vendorName,
        vendorId: body.vendorId,
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
    }, { status: 201 });
  } catch (error) {
    console.error('[Expenses API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
