export const dynamic = 'force-dynamic'

/**
 * RECRUITMENT SUITE — Interviews API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/interviews - List interviews with filters
 * POST /api/recruitment/interviews - Schedule new interview
 */

import { NextResponse } from 'next/server';
import {
  createInterview,
  getInterviews,
  getInterviewStats,
  getUpcomingInterviews,
  getTodayInterviews,
  getInterviewsByInterviewer,
  type CreateInterviewInput,
  type InterviewFilters,
} from '@/lib/recruitment';

// GET /api/recruitment/interviews
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
      const stats = await getInterviewStats(tenantId);
      return NextResponse.json(stats);
    }

    // Check if upcoming view
    if (searchParams.get('upcoming') === 'true') {
      const days = parseInt(searchParams.get('days') || '7');
      const interviews = await getUpcomingInterviews(tenantId, days);
      return NextResponse.json({ interviews, total: interviews.length });
    }

    // Check if today view
    if (searchParams.get('today') === 'true') {
      const interviews = await getTodayInterviews(tenantId);
      return NextResponse.json({ interviews, total: interviews.length });
    }

    // Check if interviewer view
    const interviewerId = searchParams.get('interviewerId');
    if (interviewerId) {
      const upcoming = searchParams.get('interviewerUpcoming') === 'true';
      const result = await getInterviewsByInterviewer(tenantId, interviewerId, {
        upcoming,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
      });
      return NextResponse.json(result);
    }

    // Standard list with filters
    const filters: InterviewFilters = {
      applicationId: searchParams.get('applicationId') || undefined,
      interviewType: searchParams.get('interviewType') as any,
      result: searchParams.get('result') as any,
      leadInterviewer: searchParams.get('leadInterviewer') || undefined,
      scheduledFrom: searchParams.get('scheduledFrom') ? new Date(searchParams.get('scheduledFrom')!) : undefined,
      scheduledTo: searchParams.get('scheduledTo') ? new Date(searchParams.get('scheduledTo')!) : undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getInterviews(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/recruitment/interviews error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/interviews
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

    if (!body.applicationId || !body.interviewType) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, interviewType' },
        { status: 400 }
      );
    }

    // Parse scheduledDate if provided
    const input: CreateInterviewInput = {
      ...body,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
    };

    const interview = await createInterview(tenantId, platformInstanceId!, input, userId || undefined);
    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('POST /api/recruitment/interviews error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
