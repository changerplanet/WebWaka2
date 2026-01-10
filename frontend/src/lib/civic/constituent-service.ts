/**
 * CIVIC SUITE: Constituent Service
 * 
 * In-memory service for managing constituents/members.
 * Wraps CRM Contact concepts for civic organizations.
 */

import {
  Constituent,
  generateMemberNumber,
  MembershipType,
  MembershipStatus,
} from './config';
import { getConstituentsStore, DEMO_STATS } from './demo-data';

// ============================================================================
// CONSTITUENT SERVICE
// ============================================================================

export async function getConstituents(tenantId: string, options?: {
  status?: MembershipStatus;
  type?: MembershipType;
  ward?: string;
  zone?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ constituents: Constituent[]; total: number; stats: typeof DEMO_STATS }> {
  const store = getConstituentsStore();
  let filtered = store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.status) {
    filtered = filtered.filter((c: any) => c.membershipStatus === options.status);
  }
  
  if (options?.type) {
    filtered = filtered.filter((c: any) => c.membershipType === options.type);
  }
  
  if (options?.ward) {
    filtered = filtered.filter((c: any) => c.ward === options.ward);
  }
  
  if (options?.zone) {
    filtered = filtered.filter((c: any) => c.zone === options.zone);
  }
  
  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter((c: any) => 
      c.firstName.toLowerCase().includes(search) ||
      c.lastName.toLowerCase().includes(search) ||
      c.memberNumber.toLowerCase().includes(search) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search)
    );
  }
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    constituents: paginated,
    total,
    stats: calculateStats(store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getConstituentById(tenantId: string, id: string): Promise<Constituent | null> {
  const store = getConstituentsStore();
  return store.find((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function createConstituent(tenantId: string, data: Partial<Constituent>): Promise<Constituent> {
  const store = getConstituentsStore();
  
  const newConstituent: Constituent = {
    id: `const_${Date.now()}`,
    tenantId,
    memberNumber: generateMemberNumber(tenantId),
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email,
    phone: data.phone || '',
    membershipType: data.membershipType || 'RESIDENT',
    membershipStatus: 'PENDING',
    ward: data.ward,
    zone: data.zone,
    unit: data.unit,
    block: data.block,
    propertyType: data.propertyType,
    propertyAddress: data.propertyAddress,
    householdSize: data.householdSize,
    occupation: data.occupation,
    registrationDate: new Date().toISOString().split('T')[0],
    totalContributions: 0,
    outstandingBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newConstituent);
  return newConstituent;
}

export async function updateConstituent(tenantId: string, id: string, data: Partial<Constituent>): Promise<Constituent | null> {
  const store = getConstituentsStore();
  const index = store.findIndex((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function updateMembershipStatus(
  tenantId: string, 
  id: string, 
  status: MembershipStatus
): Promise<Constituent | null> {
  return updateConstituent(tenantId, id, { membershipStatus: status });
}

// ============================================================================
// STATISTICS
// ============================================================================

function calculateStats(constituents: Constituent[]): typeof import('./demo-data').DEMO_STATS {
  return {
    totalConstituents: constituents.length,
    activeConstituents: constituents.filter((c: any) => c.membershipStatus === 'ACTIVE').length,
    totalDuesCollected: constituents.reduce((sum: any, c: any) => sum + c.totalContributions, 0),
    pendingDues: constituents.reduce((sum: any, c: any) => sum + c.outstandingBalance, 0),
    overdueDues: constituents.filter((c: any) => c.outstandingBalance > 0 && c.membershipStatus === 'SUSPENDED').reduce((sum: any, c: any) => sum + c.outstandingBalance, 0),
    openServiceRequests: 0, // Would need service requests data
    resolvedThisMonth: 0, // Would need service requests data
    certificatesIssued: 0, // Would need certificates data
    upcomingEvents: 0, // Would need events data
    scheduledPolls: 0, // Would need polls data
  };
}

export async function getConstituentStats(tenantId: string) {
  const store = getConstituentsStore();
  const filtered = store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateStats(filtered);
}

// ============================================================================
// WARD/ZONE HELPERS
// ============================================================================

export async function getWards(tenantId: string): Promise<string[]> {
  const store = getConstituentsStore();
  const wards = new Set(store
    .filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic')
    .map((c: any) => c.ward)
    .filter(Boolean) as string[]
  );
  return Array.from(wards).sort();
}

export async function getZones(tenantId: string): Promise<string[]> {
  const store = getConstituentsStore();
  const zones = new Set(store
    .filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic')
    .map((c: any) => c.zone)
    .filter(Boolean) as string[]
  );
  return Array.from(zones).sort();
}
