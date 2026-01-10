/**
 * RECRUITMENT SUITE — Interview Detail API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/interviews/[id] - Get interview details
 * PATCH /api/recruitment/interviews/[id] - Update interview
 * POST /api/recruitment/interviews/[id] - Interview actions (feedback, reschedule, cancel, etc.)
 * DELETE /api/recruitment/interviews/[id] - Delete interview
 */

import { NextResponse } from 'next/server';
import {
  getInterviewById,
  updateInterview,
  recordFeedback,
  markNoShow,
  cancelInterview,
  rescheduleInterview,
  deleteInterview,
  type UpdateInterviewInput,
  type InterviewFeedbackInput,
} from '@/lib/recruitment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recruitment/interviews/[id]
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
    const interview = await getInterviewById(tenantId, id);

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('GET /api/recruitment/interviews/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruitment/interviews/[id]
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
    const body: UpdateInterviewInput = await request.json();

    const interview = await updateInterview(tenantId, id, body);

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('PATCH /api/recruitment/interviews/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/interviews/[id] - Actions
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
      case 'feedback':
        if (!data.result) {
          return NextResponse.json({ error: 'result required' }, { status: 400 });
        }
        const feedbackInput: InterviewFeedbackInput = {
          result: data.result,
          feedback: data.feedback,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          recommendation: data.recommendation,
          scorecard: data.scorecard,
          overallScore: data.overallScore,
          resultBy: userId || undefined,
        };
        result = await recordFeedback(tenantId, id, feedbackInput);
        break;

      case 'noshow':
        result = await markNoShow(tenantId, id, data.notes);
        break;

      case 'cancel':
        result = await cancelInterview(tenantId, id, data.reason);
        break;

      case 'reschedule':
        if (!data.newDate) {
          return NextResponse.json({ error: 'newDate required' }, { status: 400 });
        }
        result = await rescheduleInterview(
          tenantId,
          id,
          new Date(data.newDate),
          data.newTime,
          data.reason
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Action failed - interview not found or invalid state' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/recruitment/interviews/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitment/interviews/[id]
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
    const deleted = await deleteInterview(tenantId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Interview not found or cannot be deleted (already completed)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Interview deleted' });
  } catch (error) {
    console.error('DELETE /api/recruitment/interviews/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
