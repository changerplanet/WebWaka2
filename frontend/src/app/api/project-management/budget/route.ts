export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Budget API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/budget - List budget items
 * POST /api/project-management/budget - Create budget item
 */

import { NextResponse } from 'next/server';
import {
  createBudgetItem,
  createBudgetItems,
  listBudgetItems,
  getBudgetSummary,
  getProjectBudgetStatus,
  getBudgetStats,
  syncProjectBudget,
  type CreateBudgetItemInput,
  type BudgetFilters,
} from '@/lib/project-management/budget-service';

// GET /api/project-management/budget
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Get overall budget stats (cross-project)
    if (searchParams.get('stats') === 'true' && !projectId) {
      const stats = await getBudgetStats(tenantId, platformInstanceId || undefined);
      return NextResponse.json(stats);
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    // Get budget summary for project
    if (searchParams.get('summary') === 'true') {
      const summary = await getBudgetSummary(tenantId, projectId);
      return NextResponse.json(summary);
    }

    // Get budget status (simple overview)
    if (searchParams.get('status') === 'true') {
      const status = await getProjectBudgetStatus(tenantId, projectId);
      return NextResponse.json(status);
    }

    const filters: BudgetFilters = {
      projectId,
      category: searchParams.get('category') || undefined,
      milestoneId: searchParams.get('milestoneId') || undefined,
      isApproved: searchParams.get('isApproved') === 'true' ? true : 
                  searchParams.get('isApproved') === 'false' ? false : undefined,
    };

    const items = await listBudgetItems(tenantId, filters);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('GET /api/project-management/budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/budget
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id') || tenantId;
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Handle bulk create
    if (body.action === 'bulkCreate') {
      if (!body.projectId || !body.items || !Array.isArray(body.items)) {
        return NextResponse.json(
          { error: 'Missing required fields for bulk create: projectId, items' },
          { status: 400 }
        );
      }
      const count = await createBudgetItems(
        tenantId,
        platformInstanceId!,
        body.projectId,
        body.items,
        userId || undefined
      );
      return NextResponse.json({ success: true, created: count });
    }

    // Handle sync budget
    if (body.action === 'sync') {
      if (!body.projectId) {
        return NextResponse.json(
          { error: 'Missing required field for sync: projectId' },
          { status: 400 }
        );
      }
      const project = await syncProjectBudget(tenantId, body.projectId);
      return NextResponse.json({ success: true, budgetEstimated: project.budgetEstimated });
    }

    // Create single budget item
    const { projectId, ...itemData }: { projectId: string } & CreateBudgetItemInput = body;

    if (!projectId || !itemData.category || !itemData.description || itemData.estimatedAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, category, description, estimatedAmount' },
        { status: 400 }
      );
    }

    const item = await createBudgetItem(
      tenantId,
      platformInstanceId!,
      projectId,
      itemData,
      userId || undefined
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-management/budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
