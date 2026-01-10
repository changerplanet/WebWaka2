/**
 * RECRUITMENT SUITE — Onboarding Task Detail API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/onboarding/[id] - Get task details
 * PATCH /api/recruitment/onboarding/[id] - Update task
 * POST /api/recruitment/onboarding/[id] - Task actions (complete, upload doc, verify, etc.)
 * DELETE /api/recruitment/onboarding/[id] - Delete task
 */

import { NextResponse } from 'next/server';
import {
  getOnboardingTaskById,
  updateOnboardingTask,
  startTask,
  completeTask,
  skipTask,
  uploadTaskDocument,
  verifyDocument,
  assignTask,
  deleteOnboardingTask,
  type UpdateOnboardingTaskInput,
} from '@/lib/recruitment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recruitment/onboarding/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await getOnboardingTaskById(tenantId, id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /api/recruitment/onboarding/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruitment/onboarding/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateOnboardingTaskInput = await request.json();

    const task = await updateOnboardingTask(tenantId, id, body);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('PATCH /api/recruitment/onboarding/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/onboarding/[id] - Actions
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

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'start':
        result = await startTask(tenantId, id);
        break;

      case 'complete':
        result = await completeTask(tenantId, id, userId || undefined, data.notes);
        break;

      case 'skip':
        result = await skipTask(tenantId, id, data.reason, userId || undefined);
        break;

      case 'uploadDocument':
        if (!data.fileId || !data.fileName) {
          return NextResponse.json(
            { error: 'fileId and fileName required' },
            { status: 400 }
          );
        }
        result = await uploadTaskDocument(tenantId, id, data.fileId, data.fileName);
        break;

      case 'verifyDocument':
        result = await verifyDocument(tenantId, id, userId || 'system');
        break;

      case 'assign':
        if (!data.assignedTo || !data.assignedToName) {
          return NextResponse.json(
            { error: 'assignedTo and assignedToName required' },
            { status: 400 }
          );
        }
        result = await assignTask(tenantId, id, data.assignedTo, data.assignedToName);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Action failed - task not found or invalid state' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/recruitment/onboarding/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitment/onboarding/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await deleteOnboardingTask(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('DELETE /api/recruitment/onboarding/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
