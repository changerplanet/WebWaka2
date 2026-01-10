/**
 * LOGISTICS SUITE: Fleet Service
 * 
 * In-memory service for managing vehicles/fleet.
 * ⚠️ DEMO ONLY - No database persistence
 */

import {
  Vehicle,
  VehicleType,
  VehicleStatus,
} from './config';
import { getVehiclesStore } from './demo-data';

// ============================================================================
// FLEET SERVICE
// ============================================================================

export async function getVehicles(tenantId: string, options?: {
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  isActive?: boolean;
  hasDriver?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ vehicles: Vehicle[]; total: number; stats: FleetStats }> {
  const store = getVehiclesStore();
  let filtered = store.filter((v) => v.tenantId === tenantId || tenantId === 'demo-logistics');
  
  if (options?.vehicleType) {
    filtered = filtered.filter((v) => v.vehicleType === options.vehicleType);
  }
  
  if (options?.status) {
    filtered = filtered.filter((v) => v.status === options.status);
  }
  
  if (options?.isActive !== undefined) {
    filtered = filtered.filter((v) => v.isActive === options.isActive);
  }
  
  if (options?.hasDriver !== undefined) {
    if (options.hasDriver) {
      filtered = filtered.filter((v) => v.currentDriverId);
    } else {
      filtered = filtered.filter((v) => !v.currentDriverId);
    }
  }
  
  // Sort by vehicle number
  filtered.sort((a: any, b: any) => a.vehicleNumber.localeCompare(b.vehicleNumber));
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    vehicles: paginated,
    total,
    stats: calculateFleetStats(store.filter((v) => v.tenantId === tenantId || tenantId === 'demo-logistics')),
  };
}

export async function getVehicleById(tenantId: string, id: string): Promise<Vehicle | null> {
  const store = getVehiclesStore();
  return store.find((v) => v.id === id && (v.tenantId === tenantId || tenantId === 'demo-logistics')) || null;
}

export async function getVehicleByNumber(tenantId: string, vehicleNumber: string): Promise<Vehicle | null> {
  const store = getVehiclesStore();
  return store.find((v) => 
    v.vehicleNumber === vehicleNumber && 
    (v.tenantId === tenantId || tenantId === 'demo-logistics')
  ) || null;
}

export async function getAvailableVehicles(tenantId: string, vehicleType?: VehicleType): Promise<Vehicle[]> {
  const store = getVehiclesStore();
  let available = store.filter((v) => 
    (v.tenantId === tenantId || tenantId === 'demo-logistics') &&
    v.status === 'AVAILABLE' &&
    v.isActive
  );
  
  if (vehicleType) {
    available = available.filter((v) => v.vehicleType === vehicleType);
  }
  
  return available;
}

// ============================================================================
// VEHICLE OPERATIONS
// ============================================================================

export async function updateVehicleStatus(
  tenantId: string,
  vehicleId: string,
  status: VehicleStatus,
  driverId?: string,
  driverName?: string
): Promise<Vehicle | null> {
  const store = getVehiclesStore();
  const index = store.findIndex((v) => 
    v.id === vehicleId && 
    (v.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status,
    currentDriverId: driverId,
    currentDriverName: driverName,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function assignDriverToVehicle(
  tenantId: string,
  vehicleId: string,
  driverId: string,
  driverName: string
): Promise<Vehicle | null> {
  return updateVehicleStatus(tenantId, vehicleId, 'IN_USE', driverId, driverName);
}

export async function releaseVehicle(tenantId: string, vehicleId: string): Promise<Vehicle | null> {
  return updateVehicleStatus(tenantId, vehicleId, 'AVAILABLE', undefined, undefined);
}

export async function setVehicleMaintenance(
  tenantId: string,
  vehicleId: string,
  reason?: string
): Promise<Vehicle | null> {
  const store = getVehiclesStore();
  const index = store.findIndex((v) => 
    v.id === vehicleId && 
    (v.tenantId === tenantId || tenantId === 'demo-logistics')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'MAINTENANCE',
    currentDriverId: undefined,
    currentDriverName: undefined,
    lastServiceDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function createVehicle(tenantId: string, data: {
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  insuranceExpiry?: string;
}): Promise<Vehicle> {
  const store = getVehiclesStore();
  
  // Check for duplicate
  const existing = await getVehicleByNumber(tenantId, data.vehicleNumber);
  if (existing) {
    throw new Error(`Vehicle with number ${data.vehicleNumber} already exists`);
  }
  
  const newVehicle: Vehicle = {
    id: `veh_${Date.now()}`,
    tenantId,
    ...data,
    status: 'AVAILABLE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newVehicle);
  return newVehicle;
}

// ============================================================================
// STATISTICS
// ============================================================================

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  available: number;
  inUse: number;
  maintenance: number;
  outOfService: number;
  reserved: number;
  utilizationRate: number;
  byType: Record<string, number>;
}

function calculateFleetStats(vehicles: Vehicle[]): FleetStats {
  const active = vehicles.filter((v) => v.isActive);
  const available = vehicles.filter((v) => v.status === 'AVAILABLE' && v.isActive);
  const inUse = vehicles.filter((v) => v.status === 'IN_USE');
  const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE');
  const outOfService = vehicles.filter((v) => v.status === 'OUT_OF_SERVICE');
  const reserved = vehicles.filter((v) => v.status === 'RESERVED');
  
  // Calculate utilization (in-use / active)
  const utilizationRate = active.length > 0 
    ? Math.round((inUse.length / active.length) * 100) 
    : 0;
  
  // Group by type
  const byType: Record<string, number> = {};
  vehicles.forEach((v) => {
    byType[v.vehicleType] = (byType[v.vehicleType] || 0) + 1;
  });
  
  return {
    totalVehicles: vehicles.length,
    activeVehicles: active.length,
    available: available.length,
    inUse: inUse.length,
    maintenance: maintenance.length,
    outOfService: outOfService.length,
    reserved: reserved.length,
    utilizationRate,
    byType,
  };
}

export async function getFleetStats(tenantId: string): Promise<FleetStats> {
  const store = getVehiclesStore();
  const filtered = store.filter((v) => v.tenantId === tenantId || tenantId === 'demo-logistics');
  return calculateFleetStats(filtered);
}
