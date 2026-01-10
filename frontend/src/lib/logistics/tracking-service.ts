/**
 * LOGISTICS SUITE: Tracking Service
 * 
 * In-memory service for status-based tracking.
 * NOTE: This is STATUS-based tracking, not GPS tracking.
 * 
 * ⚠️ DEMO ONLY - No database persistence
 */

import {
  Job,
  JobStatus,
  StatusUpdate,
  ProofOfDelivery,
  DeliveryException,
  canTransitionTo,
} from './config';
import { getJobsStore, getDriversStore, getVehiclesStore, getPODStore } from './demo-data';

// ============================================================================
// STATUS UPDATE SERVICE
// ============================================================================

export async function updateJobStatus(
  tenantId: string,
  jobId: string,
  newStatus: JobStatus,
  updatedBy: string,
  note?: string
): Promise<Job | null> {
  const store = getJobsStore();
  const driversStore = getDriversStore();
  const vehiclesStore = getVehiclesStore();
  
  const jobIndex = store.findIndex(j => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (jobIndex === -1) return null;
  
  const job = store[jobIndex];
  
  // Validate status transition
  if (!canTransitionTo(job.status, newStatus)) {
    throw new Error(`Cannot transition from ${job.status} to ${newStatus}`);
  }
  
  const statusUpdate: StatusUpdate = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note,
    updatedBy,
  };
  
  const updates: Partial<Job> = {
    status: newStatus,
    logistics_delivery_status_history: [...job.logistics_delivery_status_history, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  // Handle specific status transitions
  switch (newStatus) {
    case 'PICKED_UP':
      updates.actualPickupTime = new Date().toISOString();
      break;
    case 'DELIVERED':
      updates.actualDeliveryTime = new Date().toISOString();
      break;
    case 'COMPLETED':
      updates.completedAt = new Date().toISOString();
      // Release driver and vehicle
      if (job.driverId) {
        const driverIndex = driversStore.findIndex((d: any) => d.id === job.driverId);
        if (driverIndex !== -1) {
          driversStore[driverIndex] = {
            ...driversStore[driverIndex],
            status: 'AVAILABLE',
            currentVehicleId: undefined,
            currentVehicleNumber: undefined,
            currentJobId: undefined,
            totalTrips: driversStore[driverIndex].totalTrips + 1,
            totalEarnings: driversStore[driverIndex].totalEarnings + job.amount,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      if (job.vehicleId) {
        const vehicleIndex = vehiclesStore.findIndex((v) => v.id === job.vehicleId);
        if (vehicleIndex !== -1) {
          vehiclesStore[vehicleIndex] = {
            ...vehiclesStore[vehicleIndex],
            status: 'AVAILABLE',
            currentDriverId: undefined,
            currentDriverName: undefined,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      break;
    case 'FAILED':
    case 'CANCELLED':
      // Release driver and vehicle
      if (job.driverId) {
        const driverIndex = driversStore.findIndex((d: any) => d.id === job.driverId);
        if (driverIndex !== -1) {
          driversStore[driverIndex] = {
            ...driversStore[driverIndex],
            status: 'AVAILABLE',
            currentVehicleId: undefined,
            currentVehicleNumber: undefined,
            currentJobId: undefined,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      if (job.vehicleId) {
        const vehicleIndex = vehiclesStore.findIndex((v) => v.id === job.vehicleId);
        if (vehicleIndex !== -1) {
          vehiclesStore[vehicleIndex] = {
            ...vehiclesStore[vehicleIndex],
            status: 'AVAILABLE',
            currentDriverId: undefined,
            currentDriverName: undefined,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      break;
  }
  
  store[jobIndex] = {
    ...job,
    ...updates,
  };
  
  return store[jobIndex];
}

export async function getJobStatusHistory(tenantId: string, jobId: string): Promise<StatusUpdate[]> {
  const store = getJobsStore();
  const job = store.find((j: any) => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  return job?.logistics_delivery_status_history || [];
}

// ============================================================================
// DRIVER STATUS UPDATES (simulated location updates)
// ============================================================================

export async function updateDriverLocation(
  tenantId: string,
  driverId: string,
  status: 'EN_ROUTE_PICKUP' | 'AT_PICKUP' | 'IN_TRANSIT' | 'AT_DELIVERY',
  note?: string
): Promise<Job | null> {
  const driversStore = getDriversStore();
  const jobsStore = getJobsStore();
  
  const driver = driversStore.find((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (!driver || !driver.currentJobId) return null;
  
  return updateJobStatus(tenantId, driver.currentJobId, status, driverId, note);
}

// ============================================================================
// PROOF OF DELIVERY
// ============================================================================

export async function recordProofOfDelivery(
  tenantId: string,
  jobId: string,
  data: {
    receivedBy: string;
    signatureData?: string;
    photoUrl?: string;
    pinCode?: string;
    notes?: string;
    exception?: DeliveryException;
    exceptionNotes?: string;
  }
): Promise<{ job: Job; pod: ProofOfDelivery } | null> {
  const jobsStore = getJobsStore();
  const podStore = getPODStore();
  
  const jobIndex = jobsStore.findIndex(j => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (jobIndex === -1) return null;
  
  const job = jobsStore[jobIndex];
  
  // Create POD record
  const pod: ProofOfDelivery = {
    id: `pod_${Date.now()}`,
    jobId,
    deliveredAt: new Date().toISOString(),
    receivedBy: data.receivedBy,
    signatureData: data.signatureData,
    photoUrl: data.photoUrl,
    pinCode: data.pinCode,
    notes: data.notes,
    exception: data.exception,
    exceptionNotes: data.exceptionNotes,
    createdAt: new Date().toISOString(),
  };
  
  podStore.push(pod);
  
  // Update job with POD
  const newStatus: JobStatus = data.exception ? 'FAILED' : 'DELIVERED';
  const statusUpdate: StatusUpdate = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: data.exception ? `Exception: ${data.exceptionNotes || data.exception}` : 'Delivery confirmed',
    updatedBy: 'driver',
  };
  
  jobsStore[jobIndex] = {
    ...job,
    status: newStatus,
    actualDeliveryTime: pod.deliveredAt,
    pod,
    logistics_delivery_status_history: [...job.logistics_delivery_status_history, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  // If delivered successfully, mark as paid if COD
  if (newStatus === 'DELIVERED' && job.paymentMethod === 'COD') {
    jobsStore[jobIndex].isPaid = true;
    jobsStore[jobIndex].paidAt = new Date().toISOString();
  }
  
  return { job: jobsStore[jobIndex], pod };
}

export async function getPODByJobId(tenantId: string, jobId: string): Promise<ProofOfDelivery | null> {
  const jobsStore = getJobsStore();
  const job = jobsStore.find((j: any) => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  return job?.pod || null;
}

// ============================================================================
// MARK PAYMENT
// ============================================================================

export async function markJobPaid(
  tenantId: string,
  jobId: string,
  paidBy: string
): Promise<Job | null> {
  const store = getJobsStore();
  const jobIndex = store.findIndex(j => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (jobIndex === -1) return null;
  
  store[jobIndex] = {
    ...store[jobIndex],
    isPaid: true,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return store[jobIndex];
}

// ============================================================================
// COMPLETE JOB (Final step)
// ============================================================================

export async function completeJob(
  tenantId: string,
  jobId: string,
  completedBy: string
): Promise<Job | null> {
  const store = getJobsStore();
  const job = store.find((j: any) => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (!job) return null;
  
  // Job must be delivered first
  if (job.status !== 'DELIVERED') {
    throw new Error('Job must be delivered before it can be completed');
  }
  
  // Job must be paid (unless prepaid or specific methods)
  const paidMethods = ['PREPAID', 'WALLET'];
  if (!job.isPaid && !paidMethods.includes(job.paymentMethod)) {
    throw new Error('Job must be paid before completion');
  }
  
  return updateJobStatus(tenantId, jobId, 'COMPLETED', completedBy, 'Job completed');
}

// ============================================================================
// TRACKING BOARD (Dashboard View)
// ============================================================================

export interface TrackingBoardItem {
  jobId: string;
  jobNumber: string;
  status: JobStatus;
  priority: string;
  driverName?: string;
  vehicleNumber?: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName?: string;
  scheduledDeliveryTime?: string;
  lastUpdate: string;
  lastUpdateNote?: string;
}

export async function getTrackingBoard(tenantId: string): Promise<TrackingBoardItem[]> {
  const store = getJobsStore();
  const activeStatuses: JobStatus[] = ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'AT_DELIVERY'];
  
  const activeJobs = store.filter((j: any) => 
    (j.tenantId === tenantId || tenantId === 'demo-logistics') &&
    activeStatuses.includes(j.status)
  );
  
  return activeJobs.map(job => {
    const lastStatusUpdate = job.logistics_delivery_status_history[job.logistics_delivery_status_history.length - 1];
    return {
      jobId: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      priority: job.priority,
      driverName: job.driverName,
      vehicleNumber: job.vehicleNumber,
      pickupAddress: job.pickupAddress,
      deliveryAddress: job.deliveryAddress,
      customerName: job.customerName,
      scheduledDeliveryTime: job.scheduledDeliveryTime,
      lastUpdate: lastStatusUpdate?.timestamp || job.updatedAt,
      lastUpdateNote: lastStatusUpdate?.note,
    };
  }).sort((a: any, b: any) => {
    // Sort by priority first, then by last update
    const priorityOrder = { EXPRESS: 0, URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.lastUpdate.localeCompare(a.lastUpdate);
  });
}
