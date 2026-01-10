/**
 * RECRUITMENT SUITE — Jobs API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/jobs - List jobs with filters
 * POST /api/recruitment/jobs - Create new job
 */

import { NextResponse } from 'next/server';
import {
  createJob,
  getJobs,
  getJobStats,
  type CreateJobInput,
  type JobFilters,
} from '@/lib/recruitment';

// GET /api/recruitment/jobs
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
      const stats = await getJobStats(tenantId);
      return NextResponse.json(stats);
    }

    const filters: JobFilters = {
      status: searchParams.get('status') as any,
      department: searchParams.get('department') || undefined,
      employmentType: searchParams.get('employmentType') as any,
      recruiterId: searchParams.get('recruiterId') || undefined,
      isInternal: searchParams.get('isInternal') === 'true' ? true : searchParams.get('isInternal') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getJobs(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/recruitment/jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/jobs
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

    const body: CreateJobInput = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const job = await createJob(tenantId, platformInstanceId!, body, userId || undefined);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('POST /api/recruitment/jobs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
