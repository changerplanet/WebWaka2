export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Projects API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/projects - List projects with filters
 * POST /api/project-management/projects - Create new project
 */

import { NextResponse } from 'next/server';
import {
  createProject,
  listProjects,
  getProjectStats,
  type CreateProjectInput,
  type ProjectFilters,
} from '@/lib/project-management/project-service';
import {
  validateProjectStatus,
  validateProjectPriority,
  validateProjectHealth,
} from '@/lib/enums';

// GET /api/project-management/projects
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

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getProjectStats(tenantId);
      return NextResponse.json(stats);
    }

    const filters: ProjectFilters = {
      status: searchParams.get('status') as any || undefined,
      priority: searchParams.get('priority') as any || undefined,
      health: searchParams.get('health') as any || undefined,
      category: searchParams.get('category') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      managerId: searchParams.get('managerId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await listProjects(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/project-management/projects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/projects
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

    const body: CreateProjectInput = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const project = await createProject(
      tenantId,
      platformInstanceId!,
      body,
      userId || undefined
    );

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-management/projects error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
