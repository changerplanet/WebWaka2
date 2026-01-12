export const dynamic = 'force-dynamic'

/**
 * LOGISTICS SUITE: Jobs/Dispatch API Route
 * 
 * GET - List/filter jobs
 * POST - Create job or perform dispatch actions
 * 
 * ⚠️ DEMO ONLY - All data is in-memory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getJobs,
  getJobById,
  getJobByNumber,
  getActiveJobs,
  getPendingJobs,
  getJobsByDriver,
  createJob,
  assignJob,
  acceptJob,
  unassignJob,
  cancelJob,
  getJobStats,
} from '@/lib/logistics/job-service';
import {
  updateJobStatus,
  recordProofOfDelivery,
  markJobPaid,
  completeJob,
  getTrackingBoard,
  getJobStatusHistory,
} from '@/lib/logistics/tracking-service';
import {
  validateJobStatus,
  validateJobType,
  validateJobPriority,
} from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const jobNumber = searchParams.get('number');
    const query = searchParams.get('query');
    
    if (id) {
      const job = await getJobById(tenantId, id);
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }
    
    if (jobNumber) {
      const job = await getJobByNumber(tenantId, jobNumber);
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }
    
    if (query === 'active') {
      const jobs = await getActiveJobs(tenantId);
      return NextResponse.json({ success: true, jobs, count: jobs.length });
    }
    
    if (query === 'pending') {
      const jobs = await getPendingJobs(tenantId);
      return NextResponse.json({ success: true, jobs, count: jobs.length });
    }
    
    if (query === 'tracking-board') {
      const board = await getTrackingBoard(tenantId);
      return NextResponse.json({ success: true, board });
    }
    
    if (query === 'stats') {
      const stats = await getJobStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    if (query === 'by-driver') {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        return NextResponse.json(
          { success: false, error: 'driverId is required' },
          { status: 400 }
        );
      }
      const jobs = await getJobsByDriver(tenantId, driverId);
      return NextResponse.json({ success: true, jobs, count: jobs.length });
    }
    
    if (query === 'history') {
      const jobId = searchParams.get('jobId');
      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'jobId is required' },
          { status: 400 }
        );
      }
      const history = await getJobStatusHistory(tenantId, jobId);
      return NextResponse.json({ success: true, history });
    }
    
    // Phase 11B: Using type-safe enum validators
    const { jobs, total, stats } = await getJobs(tenantId, {
      status: validateJobStatus(searchParams.get('status')),
      jobType: validateJobType(searchParams.get('jobType')),
      priority: validateJobPriority(searchParams.get('priority')),
      driverId: searchParams.get('driverId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      isPaid: searchParams.get('isPaid') === 'true' ? true : searchParams.get('isPaid') === 'false' ? false : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    });
    
    return NextResponse.json({
      success: true,
      jobs,
      total,
      stats,
    });
  } catch (error) {
    console.error('Jobs API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-logistics';
    const body = await request.json();
    const { action, jobId, ...data } = body;
    
    if (action && jobId) {
      switch (action) {
        case 'assign': {
          if (!data.driverId || !data.vehicleId) {
            return NextResponse.json(
              { success: false, error: 'driverId and vehicleId are required' },
              { status: 400 }
            );
          }
          const job = await assignJob(
            tenantId,
            jobId,
            data.driverId,
            data.vehicleId,
            data.dispatchedBy || 'dispatcher'
          );
          if (!job) {
            return NextResponse.json(
              { success: false, error: 'Job not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Job assigned',
            job,
          });
        }
        
        case 'accept': {
          if (!data.driverId) {
            return NextResponse.json(
              { success: false, error: 'driverId is required' },
              { status: 400 }
            );
          }
          const job = await acceptJob(tenantId, jobId, data.driverId);
          if (!job) {
            return NextResponse.json(
              { success: false, error: 'Job not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Job accepted',
            job,
          });
        }
        
        case 'unassign': {
          const job = await unassignJob(
            tenantId,
            jobId,
            data.reason || 'Unassigned by dispatcher',
            data.updatedBy || 'dispatcher'
          );
          if (!job) {
            return NextResponse.json(
              { success: false, error: 'Job not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Job unassigned',
            job,
          });
        }
        
        case 'cancel': {
          const job = await cancelJob(
            tenantId,
            jobId,
            data.reason || 'Cancelled',
            data.cancelledBy || 'system'
          );
          if (!job) {
            return NextResponse.json(
              { success: false, error: 'Job not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Job cancelled',
            job,
          });
        }
        
        case 'update-status': {
          if (!data.status) {
            return NextResponse.json(
              { success: false, error: 'status is required' },
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
        
        case 'record-pod': {
          if (!data.receivedBy) {
            return NextResponse.json(
              { success: false, error: 'receivedBy is required' },
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
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Create new job
    if (!data.pickupAddress || !data.pickupContactName || !data.pickupContactPhone ||
        !data.deliveryAddress || !data.deliveryContactName || !data.deliveryContactPhone ||
        !data.itemDescription || !data.billingType || data.amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for job creation' },
        { status: 400 }
      );
    }
    
    const job = await createJob(tenantId, {
      ...data,
      createdBy: data.createdBy || 'api',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      job,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Jobs API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process job operation' },
      { status: 500 }
    );
  }
}
