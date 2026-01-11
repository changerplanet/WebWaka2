export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Disbursements API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createDisbursement, 
  getDisbursements, 
  getDisbursementStats,
  type CreateDisbursementInput,
  type DisbursementFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/disbursements
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
      const stats = await getDisbursementStats(tenantId, matterId);
      return NextResponse.json(stats);
    }

    const filters: DisbursementFilters = {
      matterId: searchParams.get('matterId') || undefined,
      category: searchParams.get('category') as any,
      billable: searchParams.get('billable') === 'true' ? true : searchParams.get('billable') === 'false' ? false : undefined,
      invoiced: searchParams.get('invoiced') === 'true' ? true : searchParams.get('invoiced') === 'false' ? false : undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getDisbursements(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/disbursements error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/disbursements
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateDisbursementInput = await request.json();

    if (!body.matterId || !body.category || !body.description || body.amount === undefined || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, category, description, amount, date' },
        { status: 400 }
      );
    }

    const disbursementData = {
      ...body,
      date: new Date(body.date),
    };

    const disbursement = await createDisbursement(tenantId, disbursementData);
    return NextResponse.json(disbursement, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/disbursements error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
