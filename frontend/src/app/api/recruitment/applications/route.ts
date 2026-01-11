export const dynamic = 'force-dynamic'

/**
 * RECRUITMENT SUITE — Applications API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/applications - List applications with filters
 * POST /api/recruitment/applications - Create new application (apply to job)
 */

import { NextResponse } from 'next/server';
import {
  createApplication,
  getApplications,
  getApplicationStats,
  getPipeline,
  bulkAssignRecruiter,
  type CreateApplicationInput,
  type ApplicationFilters,
} from '@/lib/recruitment';

// GET /api/recruitment/applications
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
      const jobId = searchParams.get('jobId') || undefined;
      const stats = await getApplicationStats(tenantId, jobId);
      return NextResponse.json(stats);
    }

    // Check if pipeline view
    if (searchParams.get('pipeline') === 'true') {
      const jobId = searchParams.get('jobId');
      if (!jobId) {
        return NextResponse.json(
          { error: 'jobId required for pipeline view' },
          { status: 400 }
        );
      }
      const pipeline = await getPipeline(tenantId, jobId);
      return NextResponse.json(pipeline);
    }

    const filters: ApplicationFilters = {
      jobId: searchParams.get('jobId') || undefined,
      stage: searchParams.get('stage') as any,
      assignedTo: searchParams.get('assignedTo') || undefined,
      isShortlisted: searchParams.get('isShortlisted') === 'true' ? true : searchParams.get('isShortlisted') === 'false' ? false : undefined,
      isRejected: searchParams.get('isRejected') === 'true' ? true : searchParams.get('isRejected') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getApplications(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/recruitment/applications error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/applications
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

    // Check for bulk assign action
    if (body.action === 'bulkAssign') {
      if (!body.applicationIds || !body.recruiterId || !body.recruiterName) {
        return NextResponse.json(
          { error: 'Missing required fields for bulk assign' },
          { status: 400 }
        );
      }
      const count = await bulkAssignRecruiter(tenantId, body.applicationIds, body.recruiterId, body.recruiterName);
      return NextResponse.json({ success: true, updatedCount: count });
    }

    // Regular application creation
    const input: CreateApplicationInput = body;

    if (!input.jobId || !input.applicantName) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, applicantName' },
        { status: 400 }
      );
    }

    const application = await createApplication(tenantId, platformInstanceId!, input);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('POST /api/recruitment/applications error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
