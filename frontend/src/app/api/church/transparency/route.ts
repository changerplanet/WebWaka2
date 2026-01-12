export const dynamic = 'force-dynamic'

/**
 * Church Suite — Transparency Reports API
 * Phase 4: Governance, Audit & Transparency
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createTransparencyReport,
  getTransparencyReports,
  publishTransparencyReport,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/transparency
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId');

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    const status = searchParams.get('status') || undefined;

    const reports = await getTransparencyReports(tenantId, churchId, status);

    return NextResponse.json({
      reports,
      total: reports.length,
      _transparency: 'Public transparency reports (aggregated data only)',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Transparency Reports Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/transparency
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Publish action
    if (action === 'publish') {
      if (!body.reportId) {
        return NextResponse.json(
          { error: 'reportId is required' },
          { status: 400 }
        );
      }
      const report = await publishTransparencyReport(
        tenantId,
        body.reportId,
        body.publicUrl || '',
        actorId
      );
      return NextResponse.json({
        report,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create report
    if (!body.churchId || !body.reportPeriod || !body.reportType || !body.preparedBy) {
      return NextResponse.json(
        { error: 'churchId, reportPeriod, reportType, and preparedBy are required' },
        { status: 400 }
      );
    }

    const report = await createTransparencyReport(tenantId, body, actorId);

    return NextResponse.json({
      report,
      _transparency: 'Report created (aggregated data only)',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Transparency Report Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
