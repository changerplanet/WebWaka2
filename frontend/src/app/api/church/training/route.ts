export const dynamic = 'force-dynamic'

/**
 * Church Suite — Training Records API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createTrainingRecord,
  completeTraining,
  getMemberTraining,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/training
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    const records = await getMemberTraining(tenantId, memberId);

    return NextResponse.json({
      records,
      total: records.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Training Records Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/training
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

    // Complete action
    if (action === 'complete') {
      if (!body.recordId) {
        return NextResponse.json(
          { error: 'recordId is required' },
          { status: 400 }
        );
      }
      const record = await completeTraining(tenantId, body.recordId, body.certificateUrl, actorId);
      return NextResponse.json({
        record,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create record
    if (!body.churchId || !body.memberId || !body.title || !body.startDate) {
      return NextResponse.json(
        { error: 'churchId, memberId, title, and startDate are required' },
        { status: 400 }
      );
    }

    const record = await createTrainingRecord(tenantId, body, actorId);

    return NextResponse.json({
      record,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Training Record Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
