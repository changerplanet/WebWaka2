/**
 * LEGAL PRACTICE SUITE — Filings API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createFiling, 
  getFilings, 
  getFilingStats,
  type CreateFilingInput,
  type FilingFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/filings
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const matterId = searchParams.get('matterId') || undefined;
      const stats = await getFilingStats(tenantId, matterId);
      return NextResponse.json(stats);
    }

    const filters: FilingFilters = {
      matterId: searchParams.get('matterId') || undefined,
      filingType: searchParams.get('filingType') as any,
      court: searchParams.get('court') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      served: searchParams.get('served') === 'true' ? true : searchParams.get('served') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getFilings(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/filings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/filings
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateFilingInput = await request.json();

    if (!body.matterId || !body.filingType || !body.title || !body.court || !body.filedDate) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, filingType, title, court, filedDate' },
        { status: 400 }
      );
    }

    const filingData = {
      ...body,
      filedDate: new Date(body.filedDate),
    };

    const filing = await createFiling(tenantId, filingData);
    return NextResponse.json(filing, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/filings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
