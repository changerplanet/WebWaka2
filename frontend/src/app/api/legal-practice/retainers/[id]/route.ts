/**
 * LEGAL PRACTICE SUITE — Retainer Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getRetainerById,
  depositToRetainer,
  withdrawFromRetainer 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/retainers/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const retainer = await getRetainerById(tenantId, id);

    if (!retainer) {
      return NextResponse.json({ error: 'Retainer not found' }, { status: 404 });
    }

    return NextResponse.json(retainer);
  } catch (error) {
    console.error('GET /api/legal-practice/retainers/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/retainers/[id]?action=deposit|withdraw
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'deposit') {
      if (!body.amount || !body.description) {
        return NextResponse.json({ error: 'amount and description required' }, { status: 400 });
      }
      const result = await depositToRetainer(
        tenantId, id, body.amount, body.description, body.reference, userId || undefined, body.processedName
      );
      return NextResponse.json(result);
    }

    if (action === 'withdraw') {
      if (!body.amount || !body.description) {
        return NextResponse.json({ error: 'amount and description required' }, { status: 400 });
      }
      const result = await withdrawFromRetainer(
        tenantId, id, body.amount, body.description, body.timeEntryId, body.disbursementId, userId || undefined, body.processedName
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action. Use: deposit, withdraw' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/retainers/[id] error:', error);
    
    if (error instanceof Error && (error.message.includes('not active') || error.message.includes('Insufficient'))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
