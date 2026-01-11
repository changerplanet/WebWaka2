export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Milestones API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/milestones - List milestones
 * POST /api/project-management/milestones - Create milestone
 */

import { NextResponse } from 'next/server';
import {
  createMilestone,
  listMilestones,
  getMilestoneStats,
  reorderMilestones,
  type CreateMilestoneInput,
  type MilestoneFilters,
} from '@/lib/project-management/milestone-service';

// GET /api/project-management/milestones
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId' },
        { status: 400 }
      );
    }

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getMilestoneStats(tenantId, projectId);
      return NextResponse.json(stats);
    }

    const filters: MilestoneFilters = {
      projectId,
      isCompleted: searchParams.get('isCompleted') === 'true' ? true : 
                   searchParams.get('isCompleted') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
    };

    const milestones = await listMilestones(tenantId, filters);
    return NextResponse.json({ milestones, total: milestones.length });
  } catch (error) {
    console.error('GET /api/project-management/milestones error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/milestones
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

    // Handle reorder action
    if (body.action === 'reorder') {
      if (!body.projectId || !body.milestoneIds) {
        return NextResponse.json(
          { error: 'Missing required fields for reorder: projectId, milestoneIds' },
          { status: 400 }
        );
      }
      await reorderMilestones(tenantId, body.projectId, body.milestoneIds);
      return NextResponse.json({ success: true });
    }

    // Create milestone
    const { projectId, ...milestoneData }: { projectId: string } & CreateMilestoneInput = body;

    if (!projectId || !milestoneData.name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    const milestone = await createMilestone(
      tenantId,
      platformInstanceId!,
      projectId,
      milestoneData,
      userId || undefined
    );

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-management/milestones error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
