export const dynamic = 'force-dynamic'

/**
 * Political Suite - Transparency Reports API Route (Phase 4)
 * TRANSPARENCY PUBLISHING (NON-PARTISAN)
 * 
 * MANDATORY LABELS:
 * - TRANSPARENCY REPORT
 * - NON-PARTISAN - FOR PUBLIC INFORMATION
 * - UNOFFICIAL - NOT GOVERNMENT CERTIFIED
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createReport,
  listReports,
  getReport,
  updateReport,
  publishReport,
  getPublicReports,
  PolTransparencyType,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'TRANSPARENCY REPORT',
  _disclaimer2: 'NON-PARTISAN - FOR PUBLIC INFORMATION',
  _disclaimer3: 'UNOFFICIAL - NOT GOVERNMENT CERTIFIED',
};

// GET /api/political/governance/transparency - List reports
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    // Get single report
    if (reportId) {
      const report = await getReport(tenantId, reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...report, ...MANDATORY_NOTICE });
    }

    // Get public reports only
    if (searchParams.get('public') === 'true') {
      const partyId = searchParams.get('partyId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const reports = await getPublicReports(tenantId, partyId, limit);
      return NextResponse.json({ ...reports, ...MANDATORY_NOTICE });
    }

    // List all reports
    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolTransparencyType | undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true :
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      period: searchParams.get('period') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listReports(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/transparency - Create report or actions
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Publish report
    if (action === 'publish') {
      if (!body.reportId) {
        return NextResponse.json(
          { error: 'reportId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const report = await publishReport(tenantId, body.reportId, actorId);
      return NextResponse.json({ ...report, ...MANDATORY_NOTICE });
    }

    // Update report
    if (action === 'update') {
      if (!body.reportId) {
        return NextResponse.json(
          { error: 'reportId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const { reportId, action: _, ...updateData } = body;
      const report = await updateReport(tenantId, reportId, updateData, actorId);
      return NextResponse.json({ ...report, ...MANDATORY_NOTICE });
    }

    // Create report
    if (!body.partyId || !body.type || !body.title || !body.period || !body.summary) {
      return NextResponse.json(
        { 
          error: 'partyId, type, title, period, and summary are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const report = await createReport(tenantId, body, actorId);
    return NextResponse.json({ ...report, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Report action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('cannot') || message.includes('already') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
