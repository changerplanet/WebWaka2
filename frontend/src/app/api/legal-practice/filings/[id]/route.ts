/**
 * LEGAL PRACTICE SUITE — Filing Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getFilingById, 
  updateFiling,
  markServed,
  deleteFiling,
  type UpdateFilingInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/filings/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const filing = await getFilingById(tenantId, id);

    if (!filing) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    return NextResponse.json(filing);
  } catch (error) {
    console.error('GET /api/legal-practice/filings/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/filings/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateFilingInput = await request.json();

    const filing = await updateFiling(tenantId, id, body);

    if (!filing) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    return NextResponse.json(filing);
  } catch (error) {
    console.error('PATCH /api/legal-practice/filings/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/filings/[id]?action=markServed
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'markServed') {
      const body = await request.json();
      if (!body.servedDate || !body.servedOn) {
        return NextResponse.json({ error: 'servedDate and servedOn required' }, { status: 400 });
      }
      const filing = await markServed(tenantId, id, new Date(body.servedDate), body.servedOn);
      if (!filing) {
        return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
      }
      return NextResponse.json(filing);
    }

    return NextResponse.json({ error: 'Invalid action. Use: markServed' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/filings/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-practice/filings/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteFiling(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Filing deleted' });
  } catch (error) {
    console.error('DELETE /api/legal-practice/filings/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
