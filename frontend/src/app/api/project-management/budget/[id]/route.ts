/**
 * PROJECT MANAGEMENT SUITE — Budget Item Detail API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/budget/[id] - Get budget item details
 * PATCH /api/project-management/budget/[id] - Update budget item
 * POST /api/project-management/budget/[id] - Actions (approve, record spend)
 * DELETE /api/project-management/budget/[id] - Delete budget item
 */

import { NextResponse } from 'next/server';
import {
  getBudgetItemById,
  updateBudgetItem,
  deleteBudgetItem,
  approveBudgetItem,
  revokeApproval,
  recordActualSpend,
  linkExpense,
  type UpdateBudgetItemInput,
} from '@/lib/project-management/budget-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/project-management/budget/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const item = await getBudgetItemById(tenantId, params.id);

    if (!item) {
      return NextResponse.json(
        { error: 'Budget item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('GET /api/project-management/budget/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-management/budget/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body: UpdateBudgetItemInput = await request.json();
    const item = await updateBudgetItem(tenantId, params.id, body, userId || undefined);

    return NextResponse.json(item);
  } catch (error) {
    console.error('PATCH /api/project-management/budget/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/budget/[id] - Actions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    let item;

    switch (action) {
      case 'approve':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required for approval' },
            { status: 400 }
          );
        }
        item = await approveBudgetItem(tenantId, params.id, userId);
        break;
      case 'revokeApproval':
        item = await revokeApproval(tenantId, params.id);
        break;
      case 'recordSpend':
        if (body.actualAmount === undefined) {
          return NextResponse.json(
            { error: 'Missing required field: actualAmount' },
            { status: 400 }
          );
        }
        item = await recordActualSpend(tenantId, params.id, body.actualAmount, body.expenseId);
        break;
      case 'linkExpense':
        if (!body.expenseId || body.expenseAmount === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: expenseId, expenseAmount' },
            { status: 400 }
          );
        }
        item = await linkExpense(tenantId, params.id, body.expenseId, body.expenseAmount);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('POST /api/project-management/budget/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-management/budget/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    await deleteBudgetItem(tenantId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-management/budget/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
