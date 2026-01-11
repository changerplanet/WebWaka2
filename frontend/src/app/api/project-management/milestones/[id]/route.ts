export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Milestone Detail API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/milestones/[id] - Get milestone details
 * PATCH /api/project-management/milestones/[id] - Update milestone
 * POST /api/project-management/milestones/[id] - Actions (complete, reopen)
 * DELETE /api/project-management/milestones/[id] - Delete milestone
 */

import { NextResponse } from 'next/server';
import {
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  reopenMilestone,
  recalculateMilestoneProgress,
  type UpdateMilestoneInput,
} from '@/lib/project-management/milestone-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/project-management/milestones/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const milestone = await getMilestoneById(tenantId, params.id);

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('GET /api/project-management/milestones/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-management/milestones/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body: UpdateMilestoneInput = await request.json();
    const milestone = await updateMilestone(tenantId, params.id, body);

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('PATCH /api/project-management/milestones/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/milestones/[id] - Actions
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

    const { action } = await request.json();

    let milestone;

    switch (action) {
      case 'complete':
        milestone = await completeMilestone(tenantId, params.id, userId || undefined);
        break;
      case 'reopen':
        milestone = await reopenMilestone(tenantId, params.id);
        break;
      case 'recalculate':
        milestone = await recalculateMilestoneProgress(tenantId, params.id);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('POST /api/project-management/milestones/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-management/milestones/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    await deleteMilestone(tenantId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-management/milestones/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
