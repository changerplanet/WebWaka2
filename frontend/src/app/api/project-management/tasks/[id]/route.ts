/**
 * PROJECT MANAGEMENT SUITE — Task Detail API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/tasks/[id] - Get task details
 * PATCH /api/project-management/tasks/[id] - Update task
 * POST /api/project-management/tasks/[id] - Actions (start, complete, assign, etc.)
 * DELETE /api/project-management/tasks/[id] - Delete task
 */

import { NextResponse } from 'next/server';
import {
  getTaskById,
  updateTask,
  deleteTask,
  startTask,
  submitTaskForReview,
  completeTask,
  reopenTask,
  blockTask,
  assignTask,
  unassignTask,
  type UpdateTaskInput,
} from '@/lib/project-management/task-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/project-management/tasks/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const task = await getTaskById(tenantId, params.id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /api/project-management/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-management/tasks/[id]
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

    const body: UpdateTaskInput = await request.json();
    const task = await updateTask(tenantId, params.id, body, userId || undefined);

    return NextResponse.json(task);
  } catch (error) {
    console.error('PATCH /api/project-management/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/tasks/[id] - Actions
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

    let task;

    switch (action) {
      case 'start':
        task = await startTask(tenantId, params.id, userId || undefined);
        break;
      case 'review':
        task = await submitTaskForReview(tenantId, params.id, userId || undefined);
        break;
      case 'complete':
        task = await completeTask(tenantId, params.id, body.actualHours, userId || undefined);
        break;
      case 'reopen':
        task = await reopenTask(tenantId, params.id, userId || undefined);
        break;
      case 'block':
        task = await blockTask(tenantId, params.id, body.reason, userId || undefined);
        break;
      case 'assign':
        if (!body.assigneeId || !body.assigneeName) {
          return NextResponse.json(
            { error: 'Missing required fields for assign: assigneeId, assigneeName' },
            { status: 400 }
          );
        }
        task = await assignTask(tenantId, params.id, body.assigneeId, body.assigneeName, userId || undefined);
        break;
      case 'unassign':
        task = await unassignTask(tenantId, params.id, userId || undefined);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('POST /api/project-management/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-management/tasks/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    await deleteTask(tenantId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-management/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
