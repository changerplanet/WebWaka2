/**
 * LOGISTICS SUITE: Driver Service
 * 
 * In-memory service for managing drivers.
 * ⚠️ DEMO ONLY - No database persistence
 */

import {
  Driver,
  DriverStatus,
  LicenseType,
  generateDriverNumber,
} from './config';
import { getDriversStore, getJobsStore } from './demo-data';

// ============================================================================
// DRIVER SERVICE
// ============================================================================

export async function getDrivers(tenantId: string, options?: {
  status?: DriverStatus;
  licenseType?: LicenseType;
  isActive?: boolean;
  hasVehicle?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ drivers: Driver[]; total: number; stats: DriverStats }> {
  const store = getDriversStore();
  let filtered = store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-logistics');
  
  if (options?.status) {
    filtered = filtered.filter((d: any) => d.status === options.status);
  }
  
  if (options?.licenseType) {
    filtered = filtered.filter((d: any) => d.licenseType === options.licenseType);
  }
  
  if (options?.isActive !== undefined) {
    filtered = filtered.filter((d: any) => d.isActive === options.isActive);
  }
  
  if (options?.hasVehicle !== undefined) {
    if (options.hasVehicle) {
      filtered = filtered.filter((d: any) => d.currentVehicleId);
    } else {
      filtered = filtered.filter((d: any) => !d.currentVehicleId);
    }
  }
  
  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter((d: any) => 
      d.firstName.toLowerCase().includes(search) ||
      d.lastName.toLowerCase().includes(search) ||
      d.phone.includes(search) ||
      d.driverNumber.toLowerCase().includes(search)
    );
  }
  
  // Sort by name
  filtered.sort((a: any, b: any) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    drivers: paginated,
    total,
    stats: calculateDriverStats(store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-logistics')),
  };
}

export async function getDriverById(tenantId: string, id: string): Promise<Driver | null> {
  const store = getDriversStore();
  return store.find((d: any) => d.id === id && (d.tenantId === tenantId || tenantId === 'demo-logistics')) || null;
}

export async function getDriverByNumber(tenantId: string, driverNumber: string): Promise<Driver | null> {
  const store = getDriversStore();
  return store.find((d: any) => 
    d.driverNumber === driverNumber && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  ) || null;
}

export async function getAvailableDrivers(tenantId: string, licenseType?: LicenseType): Promise<Driver[]> {
  const store = getDriversStore();
  let available = store.filter((d: any) => 
    (d.tenantId === tenantId || tenantId === 'demo-logistics') &&
    d.status === 'AVAILABLE' &&
    d.isActive
  );
  
  if (licenseType) {
    available = available.filter((d: any) => d.licenseType === licenseType);
  }
  
  return available;
}

export async function searchDrivers(tenantId: string, query: string): Promise<Driver[]> {
  const store = getDriversStore();
  const search = query.toLowerCase();
  
  return store.filter((d: any) => 
    (d.tenantId === tenantId || tenantId === 'demo-logistics') &&
    (
      d.firstName.toLowerCase().includes(search) ||
      d.lastName.toLowerCase().includes(search) ||
      d.phone.includes(search) ||
      d.driverNumber.toLowerCase().includes(search)
    )
  ).slice(0, 10);
}

// ============================================================================
// DRIVER OPERATIONS
// ============================================================================

export async function updateDriverStatus(
  tenantId: string,
  driverId: string,
  status: DriverStatus,
  vehicleId?: string,
  vehicleNumber?: string,
  jobId?: string
): Promise<Driver | null> {
  const store = getDriversStore();
  const index = store.findIndex((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status,
    currentVehicleId: vehicleId,
    currentVehicleNumber: vehicleNumber,
    currentJobId: jobId,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function assignDriverToJob(
  tenantId: string,
  driverId: string,
  vehicleId: string,
  vehicleNumber: string,
  jobId: string
): Promise<Driver | null> {
  return updateDriverStatus(tenantId, driverId, 'ON_TRIP', vehicleId, vehicleNumber, jobId);
}

export async function releaseDriver(tenantId: string, driverId: string): Promise<Driver | null> {
  return updateDriverStatus(tenantId, driverId, 'AVAILABLE', undefined, undefined, undefined);
}

export async function setDriverOffDuty(tenantId: string, driverId: string): Promise<Driver | null> {
  return updateDriverStatus(tenantId, driverId, 'OFF_DUTY', undefined, undefined, undefined);
}

export async function suspendDriver(tenantId: string, driverId: string, reason?: string): Promise<Driver | null> {
  const store = getDriversStore();
  const index = store.findIndex((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'SUSPENDED',
    isActive: false,
    currentVehicleId: undefined,
    currentVehicleNumber: undefined,
    currentJobId: undefined,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function reinstateDriver(tenantId: string, driverId: string): Promise<Driver | null> {
  const store = getDriversStore();
  const index = store.findIndex((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'AVAILABLE',
    isActive: true,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function createDriver(tenantId: string, data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;
  ninNumber?: string;
  bankName?: string;
  bankAccount?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}): Promise<Driver> {
  const store = getDriversStore();
  
  // Check for duplicate phone
  const existingPhone = store.find((d: any) => 
    (d.tenantId === tenantId || tenantId === 'demo-logistics') &&
    d.phone === data.phone
  );
  if (existingPhone) {
    throw new Error(`Driver with phone ${data.phone} already exists`);
  }
  
  const newDriver: Driver = {
    id: `drv_${Date.now()}`,
    tenantId,
    driverNumber: generateDriverNumber(),
    ...data,
    status: 'AVAILABLE',
    rating: 5.0,
    totalTrips: 0,
    totalEarnings: 0,
    isActive: true,
    joinedAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newDriver);
  return newDriver;
}

export async function updateDriverRating(
  tenantId: string,
  driverId: string,
  newRating: number
): Promise<Driver | null> {
  const store = getDriversStore();
  const index = store.findIndex((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  const driver = store[index];
  // Calculate weighted average rating
  const totalRatings = driver.totalTrips;
  const newAvgRating = totalRatings > 0
    ? Math.round(((driver.rating * totalRatings) + newRating) / (totalRatings + 1) * 10) / 10
    : newRating;
  
  store[index] = {
    ...driver,
    rating: newAvgRating,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function recordTripCompletion(
  tenantId: string,
  driverId: string,
  earnings: number
): Promise<Driver | null> {
  const store = getDriversStore();
  const index = store.findIndex((d: any) => 
    d.id === driverId && 
    (d.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    totalTrips: store[index].totalTrips + 1,
    totalEarnings: store[index].totalEarnings + earnings,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// DRIVER PERFORMANCE
// ============================================================================

export async function getDriverPerformance(tenantId: string, driverId: string): Promise<{
  driver: Driver | null;
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
  onTimeRate: number;
}> {
  const driver = await getDriverById(tenantId, driverId);
  if (!driver) {
    return {
      driver: null,
      completedJobs: 0,
      totalEarnings: 0,
      averageRating: 0,
      completionRate: 0,
      onTimeRate: 0,
    };
  }
  
  const jobsStore = getJobsStore();
  const driverJobs = jobsStore.filter((j: any) => j.driverId === driverId);
  const completedJobs = driverJobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'DELIVERED');
  const failedJobs = driverJobs.filter((j: any) => j.status === 'FAILED' || j.status === 'CANCELLED');
  
  // Calculate on-time rate
  const onTimeDeliveries = completedJobs.filter((j: any) => {
    if (!j.scheduledDeliveryTime || !j.actualDeliveryTime) return true;
    return new Date(j.actualDeliveryTime) <= new Date(j.scheduledDeliveryTime);
  });
  
  const completionRate = driverJobs.length > 0
    ? Math.round((completedJobs.length / driverJobs.length) * 100)
    : 100;
    
  const onTimeRate = completedJobs.length > 0
    ? Math.round((onTimeDeliveries.length / completedJobs.length) * 100)
    : 100;
  
  return {
    driver,
    completedJobs: completedJobs.length,
    totalEarnings: driver.totalEarnings,
    averageRating: driver.rating,
    completionRate,
    onTimeRate,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  available: number;
  onTrip: number;
  offDuty: number;
  onBreak: number;
  suspended: number;
  averageRating: number;
  topPerformers: { id: string; name: string; rating: number; trips: number }[];
}

function calculateDriverStats(drivers: Driver[]): DriverStats {
  const active = drivers.filter((d: any) => d.isActive);
  const available = drivers.filter((d: any) => d.status === 'AVAILABLE' && d.isActive);
  const onTrip = drivers.filter((d: any) => d.status === 'ON_TRIP');
  const offDuty = drivers.filter((d: any) => d.status === 'OFF_DUTY');
  const onBreak = drivers.filter((d: any) => d.status === 'ON_BREAK');
  const suspended = drivers.filter((d: any) => d.status === 'SUSPENDED');
  
  // Calculate average rating
  const ratedDrivers = drivers.filter((d: any) => d.totalTrips > 0);
  const avgRating = ratedDrivers.length > 0
    ? Math.round(ratedDrivers.reduce((sum: any, d: any) => sum + d.rating, 0) / ratedDrivers.length * 10) / 10
    : 0;
  
  // Get top performers
  const topPerformers = [...drivers]
    .filter((d: any) => d.isActive && d.totalTrips > 0)
    .sort((a: any, b: any) => b.rating - a.rating)
    .slice(0, 5)
    .map((d: any) => ({
      id: d.id,
      name: `${d.firstName} ${d.lastName}`,
      rating: d.rating,
      trips: d.totalTrips,
    }));
  
  return {
    totalDrivers: drivers.length,
    activeDrivers: active.length,
    available: available.length,
    onTrip: onTrip.length,
    offDuty: offDuty.length,
    onBreak: onBreak.length,
    suspended: suspended.length,
    averageRating: avgRating,
    topPerformers,
  };
}

export async function getDriverStats(tenantId: string): Promise<DriverStats> {
  const store = getDriversStore();
  const filtered = store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-logistics');
  return calculateDriverStats(filtered);
}
