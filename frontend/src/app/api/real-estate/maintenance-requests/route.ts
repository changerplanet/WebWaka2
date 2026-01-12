export const dynamic = 'force-dynamic'

/**
 * REAL ESTATE MANAGEMENT — Maintenance Requests API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceStats,
  getMaintenanceByCategory,
  type CreateMaintenanceRequestInput,
  type MaintenanceFilters 
} from '@/lib/real-estate';
import { getEnumParam } from '@/lib/utils/urlParams';

// Valid enum values
const MAINTENANCE_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const MAINTENANCE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const;
const MAINTENANCE_CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'HVAC', 'CLEANING', 'SECURITY', 'OTHER'] as const;

// GET /api/real-estate/maintenance-requests
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Special endpoint for stats
    if (searchParams.get('stats') === 'true') {
      const propertyId = searchParams.get('propertyId') || undefined;
      const stats = await getMaintenanceStats(tenantId, propertyId);
      return NextResponse.json(stats);
    }

    // Special endpoint for category breakdown
    if (searchParams.get('byCategory') === 'true') {
      const breakdown = await getMaintenanceByCategory(tenantId);
      return NextResponse.json({ categories: breakdown });
    }

    const filters: MaintenanceFilters = {
      propertyId: searchParams.get('propertyId') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      status: getEnumParam(searchParams, 'status', MAINTENANCE_STATUSES),
      priority: getEnumParam(searchParams, 'priority', MAINTENANCE_PRIORITIES),
      category: getEnumParam(searchParams, 'category', MAINTENANCE_CATEGORIES),
      assignedTo: searchParams.get('assignedTo') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getMaintenanceRequests(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/real-estate/maintenance-requests error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/maintenance-requests
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateMaintenanceRequestInput = await request.json();

    // Validate required fields
    if (!body.propertyId || !body.category || !body.title || !body.description || !body.requesterName || !body.requesterPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, category, title, description, requesterName, requesterPhone' },
        { status: 400 }
      );
    }

    const requestData = {
      ...body,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
    };

    const maintenanceRequest = await createMaintenanceRequest(tenantId, requestData);

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('POST /api/real-estate/maintenance-requests error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
