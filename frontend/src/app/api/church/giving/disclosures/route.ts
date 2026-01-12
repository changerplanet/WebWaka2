export const dynamic = 'force-dynamic'

/**
 * Church Suite — Financial Disclosures API
 * Phase 3: Giving & Financial Facts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createDisclosure,
  publishDisclosure,
  getDisclosures,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/giving/disclosures - List disclosures
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

    const isPublished = searchParams.get('isPublished') === 'true' ? true :
                        searchParams.get('isPublished') === 'false' ? false : undefined;

    const disclosures = await getDisclosures(tenantId, churchId, isPublished);

    return NextResponse.json({
      disclosures,
      total: disclosures.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Disclosures Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/giving/disclosures - Create or publish disclosure
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
      if (!body.disclosureId) {
        return NextResponse.json(
          { error: 'disclosureId is required' },
          { status: 400 }
        );
      }
      const disclosure = await publishDisclosure(tenantId, body.disclosureId, actorId);
      return NextResponse.json({
        disclosure,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create disclosure
    if (!body.churchId || !body.reportPeriod || !body.reportType || !body.preparedBy) {
      return NextResponse.json(
        { error: 'churchId, reportPeriod, reportType, and preparedBy are required' },
        { status: 400 }
      );
    }

    const disclosure = await createDisclosure(tenantId, body, actorId);

    return NextResponse.json({
      disclosure,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Disclosure Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
