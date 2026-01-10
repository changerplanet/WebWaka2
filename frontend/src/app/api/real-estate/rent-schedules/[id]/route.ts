/**
 * REAL ESTATE MANAGEMENT — Rent Schedule Detail API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getRentScheduleById, 
  updateRentSchedule,
  recordPayment,
  type UpdateRentScheduleInput,
  type RecordPaymentInput 
} from '@/lib/real-estate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/rent-schedules/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const schedule = await getRentScheduleById(tenantId, id);

    if (!schedule) {
      return NextResponse.json({ error: 'Rent schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('GET /api/real-estate/rent-schedules/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/real-estate/rent-schedules/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateRentScheduleInput = await request.json();

    const schedule = await updateRentSchedule(tenantId, id, body);

    if (!schedule) {
      return NextResponse.json({ error: 'Rent schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('PATCH /api/real-estate/rent-schedules/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/rent-schedules/[id] - Record payment
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'recordPayment') {
      const body: RecordPaymentInput = await request.json();
      
      if (body.paidAmount === undefined || body.paidAmount <= 0) {
        return NextResponse.json({ error: 'paidAmount must be a positive number' }, { status: 400 });
      }

      const payment = {
        ...body,
        paidDate: body.paidDate ? new Date(body.paidDate) : undefined,
      };

      const schedule = await recordPayment(tenantId, id, payment);
      return NextResponse.json(schedule);
    }

    return NextResponse.json({ error: 'Invalid action. Use: recordPayment' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/real-estate/rent-schedules/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
