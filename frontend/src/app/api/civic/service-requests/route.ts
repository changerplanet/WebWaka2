export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Service Requests API
 * 
 * GET - List service requests with filters
 * POST - Create request, update status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest,
  assignRequest,
  updateRequestStatus,
  resolveRequest,
  checkAndEscalateOverdue,
  getOverdueRequests,
  getServiceRequestStats,
} from '@/lib/civic/service-request-service';
import {
  validateCivicRequestStatus,
  validateCivicCategory,
  validateCivicPriority,
} from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for single request fetch
    const id = searchParams.get('id');
    if (id) {
      const serviceRequest = await getServiceRequestById(tenantId, id);
      if (!serviceRequest) {
        return NextResponse.json(
          { success: false, error: 'Service request not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, request: serviceRequest });
    }
    
    // Check for overdue list
    const listType = searchParams.get('list');
    if (listType === 'overdue') {
      const overdue = await getOverdueRequests(tenantId);
      return NextResponse.json({ success: true, overdue });
    }
    
    // Check for stats only
    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getServiceRequestStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Get list with filters
    const options = {
      status: searchParams.get('status') as any,
      category: searchParams.get('category') as any,
      priority: searchParams.get('priority') as any,
      assignedTo: searchParams.get('assignedTo') || undefined,
      constituentId: searchParams.get('constituentId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getServiceRequests(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Service Requests API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'assign':
        if (!data.id || !data.assignedTo || !data.assignedToName) {
          return NextResponse.json(
            { success: false, error: 'Request ID and assignee details required' },
            { status: 400 }
          );
        }
        const assigned = await assignRequest(
          tenantId,
          data.id,
          data.assignedTo,
          data.assignedToName
        );
        if (!assigned) {
          return NextResponse.json(
            { success: false, error: 'Service request not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          request: assigned,
          message: 'Request assigned successfully',
        });
        
      case 'update-status':
        if (!data.id || !data.status) {
          return NextResponse.json(
            { success: false, error: 'Request ID and status required' },
            { status: 400 }
          );
        }
        const updated = await updateRequestStatus(tenantId, data.id, data.status, data.notes);
        if (!updated) {
          return NextResponse.json(
            { success: false, error: 'Service request not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          request: updated,
          message: 'Status updated successfully',
        });
        
      case 'resolve':
        if (!data.id || !data.resolutionNotes) {
          return NextResponse.json(
            { success: false, error: 'Request ID and resolution notes required' },
            { status: 400 }
          );
        }
        const resolved = await resolveRequest(tenantId, data.id, data.resolutionNotes);
        if (!resolved) {
          return NextResponse.json(
            { success: false, error: 'Service request not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          request: resolved,
          message: 'Request resolved successfully',
        });
        
      case 'check-escalations':
        const escalatedCount = await checkAndEscalateOverdue(tenantId);
        return NextResponse.json({
          success: true,
          escalatedCount,
          message: `${escalatedCount} requests escalated due to SLA breach`,
        });
        
      case 'update':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Request ID required' },
            { status: 400 }
          );
        }
        const updatedRequest = await updateServiceRequest(tenantId, data.id, data);
        if (!updatedRequest) {
          return NextResponse.json(
            { success: false, error: 'Service request not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          request: updatedRequest,
          message: 'Request updated successfully',
        });
        
      default:
        // Create new service request
        const serviceRequest = await createServiceRequest(tenantId, data);
        return NextResponse.json({
          success: true,
          request: serviceRequest,
          message: 'Service request submitted successfully',
        }, { status: 201 });
    }
  } catch (error) {
    console.error('Service Requests API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process service request' },
      { status: 500 }
    );
  }
}
