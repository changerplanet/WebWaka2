export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Tasks API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/tasks - List tasks with filters
 * POST /api/project-management/tasks - Create task
 */

import { NextResponse } from 'next/server';
import {
  createTask,
  listTasks,
  getTaskStats,
  getMyTasks,
  bulkUpdateTaskStatus,
  reorderTasks,
  type CreateTaskInput,
  type TaskFilters,
} from '@/lib/project-management/task-service';
import {
  validateTaskStatus,
  validateTaskPriority,
} from '@/lib/enums';

// GET /api/project-management/tasks
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const projectId = searchParams.get('projectId') || undefined;
      const stats = await getTaskStats(tenantId, projectId);
      return NextResponse.json(stats);
    }

    // Check if "my tasks" view
    if (searchParams.get('view') === 'my' && userId) {
      const includeCompleted = searchParams.get('includeCompleted') === 'true';
      const tasks = await getMyTasks(tenantId, userId, includeCompleted);
      return NextResponse.json({ tasks, total: tasks.length });
    }

    // Phase 11B: Using type-safe enum validators
    const filters: TaskFilters = {
      projectId: searchParams.get('projectId') || undefined,
      milestoneId: searchParams.get('milestoneId') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      status: validateTaskStatus(searchParams.get('status')),
      priority: validateTaskPriority(searchParams.get('priority')),
      overdue: searchParams.get('overdue') === 'true' || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await listTasks(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/project-management/tasks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/tasks
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

    // Handle bulk status update
    if (body.action === 'bulkStatus') {
      if (!body.taskIds || !body.status) {
        return NextResponse.json(
          { error: 'Missing required fields for bulk update: taskIds, status' },
          { status: 400 }
        );
      }
      const count = await bulkUpdateTaskStatus(tenantId, body.taskIds, body.status, userId || undefined);
      return NextResponse.json({ success: true, updated: count });
    }

    // Handle reorder
    if (body.action === 'reorder') {
      if (!body.taskIds) {
        return NextResponse.json(
          { error: 'Missing required field for reorder: taskIds' },
          { status: 400 }
        );
      }
      await reorderTasks(tenantId, body.taskIds);
      return NextResponse.json({ success: true });
    }

    // Create task
    const { projectId, ...taskData }: { projectId: string } & CreateTaskInput = body;

    if (!projectId || !taskData.title) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, title' },
        { status: 400 }
      );
    }

    const task = await createTask(
      tenantId,
      platformInstanceId!,
      projectId,
      taskData,
      userId || undefined
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-management/tasks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
