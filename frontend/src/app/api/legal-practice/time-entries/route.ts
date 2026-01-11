export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Time Entries API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createTimeEntry, 
  getTimeEntries, 
  getTimeStats,
  type CreateTimeEntryInput,
  type TimeEntryFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/time-entries
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
      const stats = await getTimeStats(tenantId, matterId);
      return NextResponse.json(stats);
    }

    const filters: TimeEntryFilters = {
      matterId: searchParams.get('matterId') || undefined,
      staffId: searchParams.get('staffId') || undefined,
      activityType: searchParams.get('activityType') as any,
      billable: searchParams.get('billable') === 'true' ? true : searchParams.get('billable') === 'false' ? false : undefined,
      approved: searchParams.get('approved') === 'true' ? true : searchParams.get('approved') === 'false' ? false : undefined,
      invoiced: searchParams.get('invoiced') === 'true' ? true : searchParams.get('invoiced') === 'false' ? false : undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getTimeEntries(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/time-entries error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/time-entries
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateTimeEntryInput = await request.json();

    if (!body.matterId || !body.date || body.hours === undefined || !body.activityType || !body.description || !body.staffId || !body.staffName) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, date, hours, activityType, description, staffId, staffName' },
        { status: 400 }
      );
    }

    const entryData = {
      ...body,
      date: new Date(body.date),
    };

    const entry = await createTimeEntry(tenantId, entryData);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/time-entries error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
