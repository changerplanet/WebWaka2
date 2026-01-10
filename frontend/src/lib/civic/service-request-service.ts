/**
 * CIVIC SUITE: Service Request Service
 * 
 * In-memory service for managing service requests and complaints.
 */

import {
  ServiceRequest,
  ServiceRequestCategory,
  ServiceRequestStatus,
  ServiceRequestPriority,
  SERVICE_REQUEST_PRIORITY,
  generateTicketNumber,
  calculateSlaDue,
  isOverdue,
} from './config';
import { getServiceRequestsStore, getConstituentsStore } from './demo-data';

// ============================================================================
// SERVICE REQUEST SERVICE
// ============================================================================

export async function getServiceRequests(tenantId: string, options?: {
  status?: ServiceRequestStatus;
  category?: ServiceRequestCategory;
  priority?: ServiceRequestPriority;
  assignedTo?: string;
  constituentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ requests: ServiceRequest[]; total: number; stats: ServiceRequestStats }> {
  const store = getServiceRequestsStore();
  let filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.status) {
    filtered = filtered.filter((r: any) => r.status === options.status);
  }
  
  if (options?.category) {
    filtered = filtered.filter((r: any) => r.category === options.category);
  }
  
  if (options?.priority) {
    filtered = filtered.filter((r: any) => r.priority === options.priority);
  }
  
  if (options?.assignedTo) {
    filtered = filtered.filter((r: any) => r.assignedTo === options.assignedTo);
  }
  
  if (options?.constituentId) {
    filtered = filtered.filter((r: any) => r.constituentId === options.constituentId);
  }
  
  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter((r: any) => 
      r.ticketNumber.toLowerCase().includes(search) ||
      r.subject.toLowerCase().includes(search) ||
      r.constituentName.toLowerCase().includes(search)
    );
  }
  
  // Sort by priority and created date
  filtered.sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const priorityDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    requests: paginated,
    total,
    stats: calculateStats(store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getServiceRequestById(tenantId: string, id: string): Promise<ServiceRequest | null> {
  const store = getServiceRequestsStore();
  return store.find((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function createServiceRequest(tenantId: string, data: Partial<ServiceRequest>): Promise<ServiceRequest> {
  const store = getServiceRequestsStore();
  const constituents = getConstituentsStore();
  const constituent = constituents.find((c: any) => c.id === data.constituentId);
  
  const priority = data.priority || 'MEDIUM';
  
  const newRequest: ServiceRequest = {
    id: `req_${Date.now()}`,
    tenantId,
    ticketNumber: generateTicketNumber(),
    constituentId: data.constituentId,
    constituentName: constituent 
      ? `${constituent.firstName} ${constituent.lastName}` 
      : data.constituentName || 'Anonymous',
    category: data.category || 'GENERAL_INQUIRY',
    subcategory: data.subcategory,
    priority,
    status: 'SUBMITTED',
    subject: data.subject || '',
    description: data.description || '',
    location: data.location,
    attachments: data.attachments,
    slaHours: SERVICE_REQUEST_PRIORITY[priority].slaHours,
    slaDue: calculateSlaDue(priority),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newRequest);
  return newRequest;
}

export async function updateServiceRequest(
  tenantId: string, 
  id: string, 
  data: Partial<ServiceRequest>
): Promise<ServiceRequest | null> {
  const store = getServiceRequestsStore();
  const index = store.findIndex((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function assignRequest(
  tenantId: string,
  id: string,
  assignedTo: string,
  assignedToName: string
): Promise<ServiceRequest | null> {
  return updateServiceRequest(tenantId, id, {
    assignedTo,
    assignedToName,
    status: 'UNDER_REVIEW',
  });
}

export async function updateRequestStatus(
  tenantId: string,
  id: string,
  status: ServiceRequestStatus,
  notes?: string
): Promise<ServiceRequest | null> {
  const updates: Partial<ServiceRequest> = { status };
  
  if (status === 'RESOLVED') {
    updates.resolvedAt = new Date().toISOString();
    if (notes) updates.resolutionNotes = notes;
  }
  
  if (status === 'ESCALATED') {
    updates.escalatedAt = new Date().toISOString();
  }
  
  return updateServiceRequest(tenantId, id, updates);
}

export async function resolveRequest(
  tenantId: string,
  id: string,
  resolutionNotes: string
): Promise<ServiceRequest | null> {
  return updateServiceRequest(tenantId, id, {
    status: 'RESOLVED',
    resolvedAt: new Date().toISOString(),
    resolutionNotes,
  });
}

// ============================================================================
// SLA & ESCALATION
// ============================================================================

export async function checkAndEscalateOverdue(tenantId: string): Promise<number> {
  const store = getServiceRequestsStore();
  const openStatuses: ServiceRequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'];
  let escalatedCount = 0;
  
  store.forEach((request, index) => {
    if (
      (request.tenantId === tenantId || tenantId === 'demo-civic') &&
      openStatuses.includes(request.status) &&
      isOverdue(request.slaDue) &&
      request.status !== 'ESCALATED'
    ) {
      store[index] = {
        ...request,
        status: 'ESCALATED',
        escalatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      escalatedCount++;
    }
  });
  
  return escalatedCount;
}

export async function getOverdueRequests(tenantId: string): Promise<ServiceRequest[]> {
  const store = getServiceRequestsStore();
  const openStatuses: ServiceRequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'ESCALATED'];
  
  return store.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-civic') &&
    openStatuses.includes(r.status) &&
    isOverdue(r.slaDue)
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

interface ServiceRequestStats {
  total: number;
  open: number;
  resolved: number;
  escalated: number;
  overdue: number;
  avgResolutionHours: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

function calculateStats(requests: ServiceRequest[]): ServiceRequestStats {
  const openStatuses: ServiceRequestStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'];
  const open = requests.filter((r: any) => openStatuses.includes(r.status));
  const resolved = requests.filter((r: any) => r.status === 'RESOLVED');
  const escalated = requests.filter((r: any) => r.status === 'ESCALATED');
  const overdue = requests.filter((r: any) => openStatuses.includes(r.status) && isOverdue(r.slaDue));
  
  // Calculate average resolution time
  let totalResolutionHours = 0;
  let resolvedWithTime = 0;
  resolved.forEach((r: any) => {
    if (r.resolvedAt) {
      const created = new Date(r.createdAt).getTime();
      const resolvedAt = new Date(r.resolvedAt).getTime();
      totalResolutionHours += (resolvedAt - created) / (1000 * 60 * 60);
      resolvedWithTime++;
    }
  });
  
  const byCategory = requests.reduce((acc: any, r: any) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byPriority = requests.reduce((acc: any, r: any) => {
    acc[r.priority] = (acc[r.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: requests.length,
    open: open.length,
    resolved: resolved.length,
    escalated: escalated.length,
    overdue: overdue.length,
    avgResolutionHours: resolvedWithTime > 0 ? Math.round(totalResolutionHours / resolvedWithTime) : 0,
    byCategory,
    byPriority,
  };
}

export async function getServiceRequestStats(tenantId: string): Promise<ServiceRequestStats> {
  const store = getServiceRequestsStore();
  const filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateStats(filtered);
}
