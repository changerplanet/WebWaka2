/**
 * LEGAL PRACTICE SUITE — Disbursement Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getDisbursementById, 
  updateDisbursement,
  deleteDisbursement,
  type UpdateDisbursementInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/disbursements/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const disbursement = await getDisbursementById(tenantId, id);

    if (!disbursement) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    return NextResponse.json(disbursement);
  } catch (error) {
    console.error('GET /api/legal-practice/disbursements/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/disbursements/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateDisbursementInput = await request.json();

    const disbursement = await updateDisbursement(tenantId, id, body);

    if (!disbursement) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    return NextResponse.json(disbursement);
  } catch (error) {
    console.error('PATCH /api/legal-practice/disbursements/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-practice/disbursements/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteDisbursement(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Disbursement deleted' });
  } catch (error) {
    console.error('DELETE /api/legal-practice/disbursements/[id] error:', error);
    
    if (error instanceof Error && error.message.includes('invoiced')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
