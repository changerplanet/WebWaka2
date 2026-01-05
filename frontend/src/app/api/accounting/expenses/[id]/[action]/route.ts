/**
 * MODULE 2: Accounting & Finance
 * Expense Actions API
 * 
 * POST /api/accounting/expenses/[id]/submit - Submit expense for approval
 * POST /api/accounting/expenses/[id]/approve - Approve expense
 * POST /api/accounting/expenses/[id]/reject - Reject expense
 * POST /api/accounting/expenses/[id]/post - Post expense to journal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { ExpenseService } from '@/lib/accounting/expense-service';

interface RouteParams {
  params: Promise<{ id: string; action: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id, action } = await params;

    switch (action) {
      case 'submit': {
        const expense = await ExpenseService.submit(
          session.activeTenantId,
          id,
          session.user.id
        );
        return NextResponse.json({
          success: true,
          message: 'Expense submitted for approval',
          expense: {
            id: expense.id,
            expenseNumber: expense.expenseNumber,
            status: expense.status,
            submittedAt: expense.submittedAt,
          },
        });
      }

      case 'approve': {
        const expense = await ExpenseService.approve(
          session.activeTenantId,
          id,
          session.user.id
        );
        return NextResponse.json({
          success: true,
          message: 'Expense approved',
          expense: {
            id: expense.id,
            expenseNumber: expense.expenseNumber,
            status: expense.status,
            approvedAt: expense.approvedAt,
          },
        });
      }

      case 'reject': {
        const body = await request.json();
        if (!body.reason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        const expense = await ExpenseService.reject(
          session.activeTenantId,
          id,
          session.user.id,
          body.reason
        );
        return NextResponse.json({
          success: true,
          message: 'Expense rejected',
          expense: {
            id: expense.id,
            expenseNumber: expense.expenseNumber,
            status: expense.status,
            rejectedAt: expense.rejectedAt,
            rejectionReason: expense.rejectionReason,
          },
        });
      }

      case 'post': {
        const expense = await ExpenseService.post(
          session.activeTenantId,
          id,
          session.user.id
        );
        return NextResponse.json({
          success: true,
          message: 'Expense posted to journal',
          expense: {
            id: expense.id,
            expenseNumber: expense.expenseNumber,
            status: expense.status,
            journalEntryId: expense.journalEntryId,
            postedAt: expense.postedAt,
            amount: expense.amount.toString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: submit, approve, reject, post` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Expenses API] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
