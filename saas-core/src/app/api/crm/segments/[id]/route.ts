/**
 * MODULE 3: CRM & Customer Engagement
 * Single Segment API
 * 
 * GET /api/crm/segments/[id] - Get segment
 * PUT /api/crm/segments/[id] - Update segment
 * DELETE /api/crm/segments/[id] - Delete segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { SegmentationService } from '@/lib/crm/segmentation-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const segment = await SegmentationService.getById(session.activeTenantId, id);

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[Segments API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await request.json();

    const segment = await SegmentationService.update(session.activeTenantId, id, body);

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[Segments API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    await SegmentationService.delete(session.activeTenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Segments API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
