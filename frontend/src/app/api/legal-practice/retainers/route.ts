/**
 * LEGAL PRACTICE SUITE — Retainers API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createRetainer, 
  getRetainers, 
  getRetainerStats,
  getLowBalanceRetainers,
  type CreateRetainerInput 
} from '@/lib/legal-practice';

// GET /api/legal-practice/retainers
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const stats = await getRetainerStats(tenantId);
      return NextResponse.json(stats);
    }

    // Low balance endpoint
    if (searchParams.get('lowBalance') === 'true') {
      const retainers = await getLowBalanceRetainers(tenantId);
      return NextResponse.json({ retainers });
    }

    const filters = {
      clientId: searchParams.get('clientId') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      exhausted: searchParams.get('exhausted') === 'true' ? true : searchParams.get('exhausted') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getRetainers(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/retainers error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/retainers
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateRetainerInput = await request.json();

    if (!body.matterId || !body.clientId || !body.clientName || body.initialAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, clientId, clientName, initialAmount' },
        { status: 400 }
      );
    }

    const retainer = await createRetainer(tenantId, body);
    return NextResponse.json(retainer, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/retainers error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
