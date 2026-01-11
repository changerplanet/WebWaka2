export const dynamic = 'force-dynamic'

/**
 * RECRUITMENT SUITE — Job Detail API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/jobs/[id] - Get job details
 * PATCH /api/recruitment/jobs/[id] - Update job
 * POST /api/recruitment/jobs/[id] - Job actions (publish, close, etc.)
 * DELETE /api/recruitment/jobs/[id] - Delete draft job
 */

import { NextResponse } from 'next/server';
import {
  getJobById,
  updateJob,
  publishJob,
  holdJob,
  reopenJob,
  closeJob,
  markJobFilled,
  cancelJob,
  deleteJob,
  approveJob,
  type UpdateJobInput,
} from '@/lib/recruitment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recruitment/jobs/[id]
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
    const job = await getJobById(tenantId, id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('GET /api/recruitment/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruitment/jobs/[id]
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
    const body: UpdateJobInput = await request.json();

    const job = await updateJob(tenantId, id, body);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('PATCH /api/recruitment/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/jobs/[id] - Actions
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
      case 'publish':
        result = await publishJob(tenantId, id, data.shareableLink);
        break;
      case 'hold':
        result = await holdJob(tenantId, id, data.reason);
        break;
      case 'reopen':
        result = await reopenJob(tenantId, id);
        break;
      case 'close':
        result = await closeJob(tenantId, id, data.reason);
        break;
      case 'fill':
        result = await markJobFilled(tenantId, id);
        break;
      case 'cancel':
        result = await cancelJob(tenantId, id, data.reason);
        break;
      case 'approve':
        result = await approveJob(tenantId, id, userId || 'system');
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Action failed - job not found or invalid state' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/recruitment/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitment/jobs/[id]
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
    const deleted = await deleteJob(tenantId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Job not found or cannot be deleted (must be DRAFT)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    console.error('DELETE /api/recruitment/jobs/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
