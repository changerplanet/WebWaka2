export const dynamic = 'force-dynamic'

/**
 * Church Suite — Giving Summary API
 * Phase 3: Giving & Financial Facts
 * 
 * 🚨 COMMERCE BOUNDARY: FACTS ONLY
 * - NO payment processing
 * - NO wallet management  
 * - NO balance calculations
 * - NO receipt generation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getGivingSummary,
  COMMERCE_BOUNDARY,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/giving - Summary of giving facts
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

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const result = await getGivingSummary(tenantId, churchId, startDate, endDate);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Giving Summary Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST/PUT/PATCH/DELETE - Info about commerce boundary
export async function POST() {
  return NextResponse.json({
    message: 'Use specific endpoints: /api/church/giving/tithes, /api/church/giving/offerings, etc.',
    ...COMMERCE_BOUNDARY,
    ...CHURCH_SUITE_DISCLAIMERS,
  });
}
