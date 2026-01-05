/**
 * MODULE 3: CRM & Customer Engagement
 * Segments API
 * 
 * GET /api/crm/segments - List segments
 * POST /api/crm/segments - Create segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { SegmentationService } from '@/lib/crm/segmentation-service';
import { CrmSegmentStatus, CrmSegmentType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CrmSegmentStatus | null;
    const segmentType = searchParams.get('segmentType') as CrmSegmentType | null;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await SegmentationService.list(session.activeTenantId, {
      status: status || undefined,
      segmentType: segmentType || undefined,
      tags,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Segments API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const segment = await SegmentationService.create(
      session.activeTenantId,
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        segmentType: body.segmentType,
        rules: body.rules,
        tags: body.tags,
        priority: body.priority,
        metadata: body.metadata,
      },
      session.user.id
    );

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error('[Segments API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
