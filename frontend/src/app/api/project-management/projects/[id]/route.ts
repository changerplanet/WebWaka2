/**
 * PROJECT MANAGEMENT SUITE — Project Detail API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/projects/[id] - Get project details
 * PATCH /api/project-management/projects/[id] - Update project
 * POST /api/project-management/projects/[id] - Actions (start, hold, complete, etc.)
 * DELETE /api/project-management/projects/[id] - Delete project
 */

import { NextResponse } from 'next/server';
import {
  getProjectById,
  updateProject,
  deleteProject,
  startProject,
  holdProject,
  resumeProject,
  completeProject,
  cancelProject,
  archiveProject,
  recalculateProjectProgress,
  type UpdateProjectInput,
} from '@/lib/project-management/project-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/project-management/projects/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const project = await getProjectById(tenantId, params.id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('GET /api/project-management/projects/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-management/projects/[id]
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

    const body: UpdateProjectInput = await request.json();
    const project = await updateProject(tenantId, params.id, body, userId || undefined);

    return NextResponse.json(project);
  } catch (error) {
    console.error('PATCH /api/project-management/projects/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/projects/[id] - Actions
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

    let project;

    switch (action) {
      case 'start':
        project = await startProject(tenantId, params.id, userId || undefined);
        break;
      case 'hold':
        project = await holdProject(tenantId, params.id, userId || undefined);
        break;
      case 'resume':
        project = await resumeProject(tenantId, params.id, userId || undefined);
        break;
      case 'complete':
        project = await completeProject(tenantId, params.id, userId || undefined);
        break;
      case 'cancel':
        project = await cancelProject(tenantId, params.id, userId || undefined);
        break;
      case 'archive':
        project = await archiveProject(tenantId, params.id, userId || undefined);
        break;
      case 'recalculate':
        project = await recalculateProjectProgress(tenantId, params.id);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('POST /api/project-management/projects/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-management/projects/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    await deleteProject(tenantId, params.id, hard);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-management/projects/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
