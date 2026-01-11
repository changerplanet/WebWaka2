export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Parties API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createParty, 
  getParties, 
  type CreatePartyInput,
  type PartyFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/parties
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filters: PartyFilters = {
      matterId: searchParams.get('matterId') || undefined,
      partyRole: searchParams.get('partyRole') as any,
      isAdverseParty: searchParams.get('isAdverseParty') === 'true' ? true : searchParams.get('isAdverseParty') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getParties(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/parties error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/parties
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreatePartyInput = await request.json();

    if (!body.matterId || !body.partyRole || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, partyRole, name' },
        { status: 400 }
      );
    }

    const party = await createParty(tenantId, body);
    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/parties error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
