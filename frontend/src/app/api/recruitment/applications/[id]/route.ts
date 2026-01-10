/**
 * RECRUITMENT SUITE — Application Detail API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/applications/[id] - Get application details
 * PATCH /api/recruitment/applications/[id] - Update application
 * POST /api/recruitment/applications/[id] - Application actions (move stage, assign, score, etc.)
 * DELETE /api/recruitment/applications/[id] - Delete application (APPLIED only)
 */

import { NextResponse } from 'next/server';
import {
  getApplicationById,
  updateApplication,
  moveToStage,
  assignRecruiter,
  scoreApplication,
  shortlistApplication,
  rejectApplication,
  withdrawApplication,
  deleteApplication,
  type UpdateApplicationInput,
} from '@/lib/recruitment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recruitment/applications/[id]
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
    const application = await getApplicationById(tenantId, id);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('GET /api/recruitment/applications/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruitment/applications/[id]
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
    const body: UpdateApplicationInput = await request.json();

    const application = await updateApplication(tenantId, id, body);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('PATCH /api/recruitment/applications/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/applications/[id] - Actions
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
      case 'moveStage':
        if (!data.stage) {
          return NextResponse.json({ error: 'stage required' }, { status: 400 });
        }
        result = await moveToStage(tenantId, id, data.stage, userId || undefined);
        break;

      case 'assign':
        if (!data.recruiterId || !data.recruiterName) {
          return NextResponse.json(
            { error: 'recruiterId and recruiterName required' },
            { status: 400 }
          );
        }
        result = await assignRecruiter(tenantId, id, data.recruiterId, data.recruiterName);
        break;

      case 'score':
        if (data.score === undefined) {
          return NextResponse.json({ error: 'score required' }, { status: 400 });
        }
        result = await scoreApplication(
          tenantId,
          id,
          data.score,
          data.rating,
          data.screeningNotes,
          userId || undefined
        );
        break;

      case 'shortlist':
        result = await shortlistApplication(tenantId, id, data.shortlist !== false);
        break;

      case 'reject':
        if (!data.reason) {
          return NextResponse.json({ error: 'reason required' }, { status: 400 });
        }
        result = await rejectApplication(tenantId, id, data.reason, userId || undefined);
        break;

      case 'withdraw':
        result = await withdrawApplication(tenantId, id, data.reason);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Action failed - application not found or invalid state' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/recruitment/applications/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitment/applications/[id]
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
    const deleted = await deleteApplication(tenantId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Application not found or cannot be deleted (must be APPLIED stage)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('DELETE /api/recruitment/applications/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
