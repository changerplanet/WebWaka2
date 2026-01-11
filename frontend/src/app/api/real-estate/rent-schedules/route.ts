export const dynamic = 'force-dynamic'

/**
 * REAL ESTATE MANAGEMENT — Rent Schedules API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createRentSchedule,
  getRentSchedules,
  getRentStats,
  getArrearsReport,
  generateRentSchedulesForLease,
  markOverduePayments,
  applyLateFees,
  type CreateRentScheduleInput,
  type RentScheduleFilters 
} from '@/lib/real-estate';

// GET /api/real-estate/rent-schedules
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Special endpoint for stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getRentStats(tenantId);
      return NextResponse.json(stats);
    }

    // Special endpoint for arrears report
    if (searchParams.get('arrears') === 'true') {
      const report = await getArrearsReport(tenantId);
      return NextResponse.json({ arrears: report });
    }

    const filters: RentScheduleFilters = {
      leaseId: searchParams.get('leaseId') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') as any,
      dueDateFrom: searchParams.get('dueDateFrom') ? new Date(searchParams.get('dueDateFrom')!) : undefined,
      dueDateTo: searchParams.get('dueDateTo') ? new Date(searchParams.get('dueDateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getRentSchedules(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/real-estate/rent-schedules error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/rent-schedules
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Special action: Generate schedules for a lease
    if (searchParams.get('action') === 'generate') {
      const body = await request.json();
      if (!body.leaseId) {
        return NextResponse.json({ error: 'leaseId required' }, { status: 400 });
      }
      const count = await generateRentSchedulesForLease(tenantId, body.leaseId);
      return NextResponse.json({ success: true, schedulesGenerated: count });
    }

    // Special action: Mark overdue payments
    if (searchParams.get('action') === 'markOverdue') {
      const count = await markOverduePayments(tenantId);
      return NextResponse.json({ success: true, markedOverdue: count });
    }

    // Special action: Apply late fees
    if (searchParams.get('action') === 'applyLateFees') {
      const body = await request.json().catch(() => ({}));
      const percentage = body.percentage || 10;
      const count = await applyLateFees(tenantId, percentage);
      return NextResponse.json({ success: true, feesApplied: count });
    }

    // Standard create
    const body: CreateRentScheduleInput = await request.json();

    if (!body.leaseId || !body.dueDate || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: leaseId, dueDate, amount' },
        { status: 400 }
      );
    }

    const scheduleData = {
      ...body,
      dueDate: new Date(body.dueDate),
    };

    const schedule = await createRentSchedule(tenantId, scheduleData);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('POST /api/real-estate/rent-schedules error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
