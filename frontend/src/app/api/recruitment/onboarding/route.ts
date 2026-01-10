/**
 * RECRUITMENT SUITE — Onboarding API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/onboarding - List onboarding tasks with filters
 * POST /api/recruitment/onboarding - Create task or generate checklist
 */

import { NextResponse } from 'next/server';
import {
  createOnboardingTask,
  generateOnboardingChecklist,
  getOnboardingTasks,
  getChecklistByApplication,
  getOverdueTasks,
  getOnboardingStats,
  deleteChecklistByApplication,
  type CreateOnboardingTaskInput,
  type OnboardingTaskFilters,
} from '@/lib/recruitment';

// GET /api/recruitment/onboarding
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
      const stats = await getOnboardingStats(tenantId);
      return NextResponse.json(stats);
    }

    // Check if overdue tasks
    if (searchParams.get('overdue') === 'true') {
      const tasks = await getOverdueTasks(tenantId);
      return NextResponse.json({ tasks, total: tasks.length });
    }

    // Check if checklist view for specific application
    const applicationId = searchParams.get('applicationId');
    if (applicationId && searchParams.get('checklist') === 'true') {
      const checklist = await getChecklistByApplication(tenantId, applicationId);
      return NextResponse.json(checklist);
    }

    const filters: OnboardingTaskFilters = {
      applicationId: applicationId || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') as any,
      assignedTo: searchParams.get('assignedTo') || undefined,
      assignedDepartment: searchParams.get('assignedDepartment') || undefined,
      isOverdue: searchParams.get('isOverdue') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getOnboardingTasks(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/recruitment/onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/onboarding
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id') || tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if generate checklist action
    if (body.action === 'generateChecklist') {
      if (!body.applicationId) {
        return NextResponse.json(
          { error: 'applicationId required' },
          { status: 400 }
        );
      }
      const tasks = await generateOnboardingChecklist(
        tenantId,
        platformInstanceId!,
        body.applicationId,
        body.startDate ? new Date(body.startDate) : undefined
      );
      return NextResponse.json({ tasks, total: tasks.length }, { status: 201 });
    }

    // Check if delete checklist action
    if (body.action === 'deleteChecklist') {
      if (!body.applicationId) {
        return NextResponse.json(
          { error: 'applicationId required' },
          { status: 400 }
        );
      }
      const deletedCount = await deleteChecklistByApplication(tenantId, body.applicationId);
      return NextResponse.json({ success: true, deletedCount });
    }

    // Regular task creation
    const input: CreateOnboardingTaskInput = body;

    if (!input.applicationId || !input.taskName) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, taskName' },
        { status: 400 }
      );
    }

    const task = await createOnboardingTask(tenantId, platformInstanceId!, input);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/recruitment/onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
