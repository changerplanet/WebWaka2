/**
 * LOGISTICS SUITE: Job/Dispatch Service
 * 
 * In-memory service for managing jobs and dispatch operations.
 * ⚠️ DEMO ONLY - No database persistence
 */

import {
  Job,
  JobType,
  JobStatus,
  JobPriority,
  BillingType,
  PaymentMethod,
  StatusUpdate,
  generateJobNumber,
  canTransitionTo,
} from './config';
import { getJobsStore, getDriversStore, getVehiclesStore } from './demo-data';

// ============================================================================
// JOB SERVICE
// ============================================================================

export async function getJobs(tenantId: string, options?: {
  status?: JobStatus;
  jobType?: JobType;
  priority?: JobPriority;
  driverId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  isPaid?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ jobs: Job[]; total: number; stats: JobStats }> {
  const store = getJobsStore();
  let filtered = store.filter((j: any) => j.tenantId === tenantId || tenantId === 'demo-logistics');
  
  if (options?.status) {
    filtered = filtered.filter((j: any) => j.status === options.status);
  }
  
  if (options?.jobType) {
    filtered = filtered.filter((j: any) => j.jobType === options.jobType);
  }
  
  if (options?.priority) {
    filtered = filtered.filter((j: any) => j.priority === options.priority);
  }
  
  if (options?.driverId) {
    filtered = filtered.filter((j: any) => j.driverId === options.driverId);
  }
  
  if (options?.customerId) {
    filtered = filtered.filter((j: any) => j.customerId === options.customerId);
  }
  
  if (options?.dateFrom) {
    filtered = filtered.filter((j: any) => j.createdAt >= options.dateFrom!);
  }
  
  if (options?.dateTo) {
    filtered = filtered.filter((j: any) => j.createdAt <= options.dateTo!);
  }
  
  if (options?.isPaid !== undefined) {
    filtered = filtered.filter((j: any) => j.isPaid === options.isPaid);
  }
  
  // Sort by created date (newest first)
  filtered.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    jobs: paginated,
    total,
    stats: calculateJobStats(store.filter((j: any) => j.tenantId === tenantId || tenantId === 'demo-logistics')),
  };
}

export async function getJobById(tenantId: string, id: string): Promise<Job | null> {
  const store = getJobsStore();
  return store.find((j: any) => j.id === id && (j.tenantId === tenantId || tenantId === 'demo-logistics')) || null;
}

export async function getJobByNumber(tenantId: string, jobNumber: string): Promise<Job | null> {
  const store = getJobsStore();
  return store.find((j: any) => 
    j.jobNumber === jobNumber && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  ) || null;
}

export async function getActiveJobs(tenantId: string): Promise<Job[]> {
  const store = getJobsStore();
  const activeStatuses: JobStatus[] = ['CREATED', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'AT_DELIVERY'];
  return store.filter((j: any) => 
    (j.tenantId === tenantId || tenantId === 'demo-logistics') &&
    activeStatuses.includes(j.status)
  );
}

export async function getPendingJobs(tenantId: string): Promise<Job[]> {
  const store = getJobsStore();
  return store.filter((j: any) => 
    (j.tenantId === tenantId || tenantId === 'demo-logistics') &&
    (j.status === 'CREATED' || j.status === 'PENDING')
  );
}

export async function getJobsByDriver(tenantId: string, driverId: string): Promise<Job[]> {
  const store = getJobsStore();
  return store.filter((j: any) => 
    (j.tenantId === tenantId || tenantId === 'demo-logistics') &&
    j.driverId === driverId
  );
}

// ============================================================================
// JOB CREATION
// ============================================================================

export async function createJob(tenantId: string, data: {
  jobType: JobType;
  priority?: JobPriority;
  pickupAddress: string;
  pickupLandmark?: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupNotes?: string;
  scheduledPickupTime?: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryNotes?: string;
  scheduledDeliveryTime?: string;
  itemDescription: string;
  itemQuantity: number;
  itemWeight?: number;
  itemValue?: number;
  isFragile?: boolean;
  requiresSignature?: boolean;
  billingType: BillingType;
  amount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  reference?: string;
  tags?: string[];
  createdBy: string;
}): Promise<Job> {
  const store = getJobsStore();
  
  const newJob: Job = {
    id: `job_${Date.now()}`,
    tenantId,
    jobNumber: generateJobNumber(),
    jobType: data.jobType,
    status: 'CREATED',
    priority: data.priority || 'NORMAL',
    pickupAddress: data.pickupAddress,
    pickupLandmark: data.pickupLandmark,
    pickupContactName: data.pickupContactName,
    pickupContactPhone: data.pickupContactPhone,
    pickupNotes: data.pickupNotes,
    scheduledPickupTime: data.scheduledPickupTime,
    deliveryAddress: data.deliveryAddress,
    deliveryLandmark: data.deliveryLandmark,
    deliveryContactName: data.deliveryContactName,
    deliveryContactPhone: data.deliveryContactPhone,
    deliveryNotes: data.deliveryNotes,
    scheduledDeliveryTime: data.scheduledDeliveryTime,
    itemDescription: data.itemDescription,
    itemQuantity: data.itemQuantity,
    itemWeight: data.itemWeight,
    itemValue: data.itemValue,
    isFragile: data.isFragile || false,
    requiresSignature: data.requiresSignature || false,
    billingType: data.billingType,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    isPaid: data.paymentMethod === 'PREPAID',
    customerId: data.customerId,
    customerName: data.customerName,
    reference: data.reference,
    tags: data.tags,
    logistics_delivery_status_history: [{
      status: 'CREATED',
      timestamp: new Date().toISOString(),
      updatedBy: data.createdBy,
    }],
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newJob);
  return newJob;
}

// ============================================================================
// DISPATCH OPERATIONS
// ============================================================================

export async function assignJob(
  tenantId: string,
  jobId: string,
  driverId: string,
  vehicleId: string,
  dispatchedBy: string
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
  
  // Validate job can be assigned
  if (!['CREATED', 'PENDING'].includes(job.status)) {
    throw new Error(`Job in status ${job.status} cannot be assigned`);
  }
  
  // Get driver and vehicle
  const driver = driversStore.find((d: any) => d.id === driverId);
  const vehicle = vehiclesStore.find((v: string) => v.id === vehicleId);
  
  if (!driver) throw new Error('Driver not found');
  if (!vehicle) throw new Error('Vehicle not found');
  
  // Update job
  const statusUpdate: StatusUpdate = {
    status: 'ASSIGNED',
    timestamp: new Date().toISOString(),
    updatedBy: dispatchedBy,
  };
  
  store[jobIndex] = {
    ...job,
    status: 'ASSIGNED',
    driverId,
    driverName: `${driver.firstName} ${driver.lastName}`,
    vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    assignedAt: new Date().toISOString(),
    logistics_delivery_status_history: [...job.statusHistory, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  // Update driver status
  const driverIndex = driversStore.findIndex((d: any) => d.id === driverId);
  if (driverIndex !== -1) {
    driversStore[driverIndex] = {
      ...driversStore[driverIndex],
      status: 'ON_TRIP',
      currentVehicleId: vehicleId,
      currentVehicleNumber: vehicle.vehicleNumber,
      currentJobId: jobId,
      updatedAt: new Date().toISOString(),
    };
  }
  
  // Update vehicle status
  const vehicleIndex = vehiclesStore.findIndex((v: string) => v.id === vehicleId);
  if (vehicleIndex !== -1) {
    vehiclesStore[vehicleIndex] = {
      ...vehiclesStore[vehicleIndex],
      status: 'IN_USE',
      currentDriverId: driverId,
      currentDriverName: `${driver.firstName} ${driver.lastName}`,
      updatedAt: new Date().toISOString(),
    };
  }
  
  return store[jobIndex];
}

export async function acceptJob(
  tenantId: string,
  jobId: string,
  driverId: string
): Promise<Job | null> {
  const store = getJobsStore();
  const jobIndex = store.findIndex(j => 
    j.id === jobId && 
    (j.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (jobIndex === -1) return null;
  
  const job = store[jobIndex];
  
  if (job.status !== 'ASSIGNED') {
    throw new Error(`Job in status ${job.status} cannot be accepted`);
  }
  
  if (job.driverId !== driverId) {
    throw new Error('Job is not assigned to this driver');
  }
  
  const statusUpdate: StatusUpdate = {
    status: 'ACCEPTED',
    timestamp: new Date().toISOString(),
    updatedBy: driverId,
  };
  
  store[jobIndex] = {
    ...job,
    status: 'ACCEPTED',
    acceptedAt: new Date().toISOString(),
    logistics_delivery_status_history: [...job.statusHistory, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  return store[jobIndex];
}

export async function unassignJob(
  tenantId: string,
  jobId: string,
  reason: string,
  updatedBy: string
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
  
  // Release driver
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
  
  // Release vehicle
  if (job.vehicleId) {
    const vehicleIndex = vehiclesStore.findIndex((v: string) => v.id === job.vehicleId);
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
  
  const statusUpdate: StatusUpdate = {
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    note: reason,
    updatedBy,
  };
  
  store[jobIndex] = {
    ...job,
    status: 'PENDING',
    driverId: undefined,
    driverName: undefined,
    vehicleId: undefined,
    vehicleNumber: undefined,
    assignedAt: undefined,
    acceptedAt: undefined,
    logistics_delivery_status_history: [...job.statusHistory, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  return store[jobIndex];
}

export async function cancelJob(
  tenantId: string,
  jobId: string,
  reason: string,
  cancelledBy: string
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
  
  if (job.status === 'COMPLETED' || job.status === 'DELIVERED') {
    throw new Error('Cannot cancel a completed job');
  }
  
  // Release driver
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
  
  // Release vehicle
  if (job.vehicleId) {
    const vehicleIndex = vehiclesStore.findIndex((v: string) => v.id === job.vehicleId);
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
  
  const statusUpdate: StatusUpdate = {
    status: 'CANCELLED',
    timestamp: new Date().toISOString(),
    note: reason,
    updatedBy: cancelledBy,
  };
  
  store[jobIndex] = {
    ...job,
    status: 'CANCELLED',
    logistics_delivery_status_history: [...job.statusHistory, statusUpdate],
    updatedAt: new Date().toISOString(),
  };
  
  return store[jobIndex];
}

// ============================================================================
// STATISTICS
// ============================================================================

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  failedJobs: number;
  totalRevenue: number;
  unpaidAmount: number;
  averageDeliveryTime: number;
  onTimeRate: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

function calculateJobStats(jobs: Job[]): JobStats {
  const activeStatuses: JobStatus[] = ['CREATED', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'AT_DELIVERY'];
  const completedStatuses: JobStatus[] = ['DELIVERED', 'COMPLETED'];
  
  const active = jobs.filter((j: any) => activeStatuses.includes(j.status));
  const pending = jobs.filter((j: any) => j.status === 'CREATED' || j.status === 'PENDING');
  const completed = jobs.filter((j: any) => completedStatuses.includes(j.status));
  const cancelled = jobs.filter((j: any) => j.status === 'CANCELLED');
  const failed = jobs.filter((j: any) => j.status === 'FAILED');
  
  const totalRevenue = completed.reduce((sum: any, j) => sum + j.amount, 0);
  const unpaidAmount = jobs.filter((j: any) => !j.isPaid && !['CANCELLED', 'FAILED'].includes(j.status))
    .reduce((sum: any, j) => sum + j.amount, 0);
  
  // Calculate average delivery time
  const completedWithTimes = completed.filter((j: any) => j.actualPickupTime && j.actualDeliveryTime);
  let avgDeliveryTime = 0;
  if (completedWithTimes.length > 0) {
    const totalTime = completedWithTimes.reduce((sum: any, j) => {
      const pickup = new Date(j.actualPickupTime!).getTime();
      const delivery = new Date(j.actualDeliveryTime!).getTime();
      return sum + (delivery - pickup);
    }, 0);
    avgDeliveryTime = Math.round(totalTime / completedWithTimes.length / 60000); // minutes
  }
  
  // Calculate on-time rate
  const scheduledCompleted = completed.filter((j: any) => j.scheduledDeliveryTime && j.actualDeliveryTime);
  const onTime = scheduledCompleted.filter((j: any) => 
    new Date(j.actualDeliveryTime!) <= new Date(j.scheduledDeliveryTime!)
  );
  const onTimeRate = scheduledCompleted.length > 0
    ? Math.round((onTime.length / scheduledCompleted.length) * 100)
    : 100;
  
  // Group by status
  const byStatus: Record<string, number> = {};
  jobs.forEach((j: any) => {
    byStatus[j.status] = (byStatus[j.status] || 0) + 1;
  });
  
  // Group by type
  const byType: Record<string, number> = {};
  jobs.forEach((j: any) => {
    byType[j.jobType] = (byType[j.jobType] || 0) + 1;
  });
  
  // Group by priority
  const byPriority: Record<string, number> = {};
  jobs.forEach((j: any) => {
    byPriority[j.priority] = (byPriority[j.priority] || 0) + 1;
  });
  
  return {
    totalJobs: jobs.length,
    activeJobs: active.length,
    pendingJobs: pending.length,
    completedJobs: completed.length,
    cancelledJobs: cancelled.length,
    failedJobs: failed.length,
    totalRevenue,
    unpaidAmount,
    averageDeliveryTime: avgDeliveryTime,
    onTimeRate,
    byStatus,
    byType,
    byPriority,
  };
}

export async function getJobStats(tenantId: string): Promise<JobStats> {
  const store = getJobsStore();
  const filtered = store.filter((j: any) => j.tenantId === tenantId || tenantId === 'demo-logistics');
  return calculateJobStats(filtered);
}
