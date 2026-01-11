export const dynamic = 'force-dynamic'

/**
 * LOGISTICS SUITE: Tracking API Route
 * 
 * GET - Get tracking board, job status history
 * POST - Update job status, record POD
 * 
 * NOTE: This is STATUS-based tracking, not GPS tracking.
 * ⚠️ DEMO ONLY - All data is in-memory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateJobStatus,
  recordProofOfDelivery,
  markJobPaid,
  completeJob,
  getTrackingBoard,
  getJobStatusHistory,
  updateDriverLocation,
  getPODByJobId,
} from '@/lib/logistics/tracking-service';
import { getJobById } from '@/lib/logistics/job-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query');
    const jobId = searchParams.get('jobId');
    
    // Get tracking board (active jobs overview)
    if (query === 'board') {
      const board = await getTrackingBoard(tenantId);
      return NextResponse.json({ success: true, board });
    }
    
    // Get status history for a specific job
    if (query === 'history' && jobId) {
      const history = await getJobStatusHistory(tenantId, jobId);
      return NextResponse.json({ success: true, history });
    }
    
    // Get POD for a specific job
    if (query === 'pod' && jobId) {
      const pod = await getPODByJobId(tenantId, jobId);
      if (!pod) {
        return NextResponse.json(
          { success: false, error: 'POD not found for this job' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, pod });
    }
    
    // Get job tracking info
    if (jobId) {
      const job = await getJobById(tenantId, jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        tracking: {
          jobId: job.id,
          jobNumber: job.jobNumber,
          status: job.status,
          priority: job.priority,
          driverName: job.driverName,
          vehicleNumber: job.vehicleNumber,
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress,
          scheduledDeliveryTime: job.scheduledDeliveryTime,
          actualDeliveryTime: job.actualDeliveryTime,
          statusHistory: job.logistics_delivery_status_history,
          pod: job.pod,
        },
      });
    }
    
    // Default: return tracking board
    const board = await getTrackingBoard(tenantId);
    return NextResponse.json({ success: true, board });
    
  } catch (error) {
    console.error('Tracking API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const body = await request.json();
    const { action, jobId, driverId, ...data } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'update-status': {
        if (!jobId || !data.status) {
          return NextResponse.json(
            { success: false, error: 'jobId and status are required' },
            { status: 400 }
          );
        }
        const job = await updateJobStatus(
          tenantId,
          jobId,
          data.status,
          data.updatedBy || 'system',
          data.note
        );
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: `Status updated to ${data.status}`,
          job,
        });
      }
      
      case 'driver-update': {
        if (!driverId || !data.status) {
          return NextResponse.json(
            { success: false, error: 'driverId and status are required' },
            { status: 400 }
          );
        }
        // Simulated driver location update (status-based)
        const job = await updateDriverLocation(
          tenantId,
          driverId,
          data.status,
          data.note
        );
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Driver has no active job' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Driver status updated',
          job,
        });
      }
      
      case 'record-pod': {
        if (!jobId || !data.receivedBy) {
          return NextResponse.json(
            { success: false, error: 'jobId and receivedBy are required' },
            { status: 400 }
          );
        }
        const result = await recordProofOfDelivery(tenantId, jobId, data);
        if (!result) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Proof of delivery recorded',
          job: result.job,
          pod: result.pod,
        });
      }
      
      case 'mark-paid': {
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'jobId is required' },
            { status: 400 }
          );
        }
        const job = await markJobPaid(tenantId, jobId, data.paidBy || 'system');
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Job marked as paid',
          job,
        });
      }
      
      case 'complete': {
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'jobId is required' },
            { status: 400 }
          );
        }
        const job = await completeJob(tenantId, jobId, data.completedBy || 'system');
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Job completed',
          job,
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
    
  } catch (error: any) {
    console.error('Tracking API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process tracking operation' },
      { status: 500 }
    );
  }
}
