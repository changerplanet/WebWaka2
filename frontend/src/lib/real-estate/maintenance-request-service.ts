/**
 * REAL ESTATE MANAGEMENT — Maintenance Request Service
 * Phase 7A, S2 Core Services
 * 
 * Database-backed maintenance request management.
 * Integrates with Logistics for dispatch.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'STRUCTURAL' | 'HVAC' | 'CLEANING' | 'SECURITY' | 'OTHER';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CreateMaintenanceRequestInput {
  propertyId: string;
  unitId?: string;
  leaseId?: string;
  category: MaintenanceCategory;
  priority?: MaintenancePriority;
  title: string;
  description: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  photosBefore?: string[];
  scheduledDate?: Date;
  estimatedCost?: number;
}

export interface UpdateMaintenanceRequestInput {
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  title?: string;
  description?: string;
  assignedTo?: string;
  assignedName?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  costNotes?: string;
  photosBefore?: string[];
  photosAfter?: string[];
  resolutionNotes?: string;
}

export interface MaintenanceFilters {
  propertyId?: string;
  unitId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// REQUEST NUMBER GENERATION
// ============================================================================

async function generateRequestNumber(tenantId: string): Promise<string> {
  const count = await prisma.re_maintenance_request.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(5, '0');
  return `MNT-${year}-${sequence}`;
}

// ============================================================================
// MAINTENANCE REQUEST CRUD OPERATIONS
// ============================================================================

export async function createMaintenanceRequest(
  tenantId: string,
  data: CreateMaintenanceRequestInput
) {
  // Verify property belongs to tenant
  const property = await prisma.re_property.findFirst({
    where: { id: data.propertyId, tenantId },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  // Verify unit if provided
  if (data.unitId) {
    const unit = await prisma.re_unit.findFirst({
      where: { id: data.unitId, propertyId: data.propertyId },
    });
    if (!unit) {
      throw new Error('Unit not found');
    }
  }

  const requestNumber = await generateRequestNumber(tenantId);

  const request = await prisma.re_maintenance_request.create({
    data: withPrismaDefaults({
      tenantId,
      propertyId: data.propertyId,
      unitId: data.unitId,
      leaseId: data.leaseId,
      requestNumber,
      category: data.category as any,
      priority: (data.priority || 'MEDIUM') as any,
      status: 'OPEN',
      title: data.title,
      description: data.description,
      requesterName: data.requesterName,
      requesterPhone: data.requesterPhone,
      requesterEmail: data.requesterEmail,
      photosBefore: data.photosBefore || [],
      scheduledDate: data.scheduledDate,
      estimatedCost: data.estimatedCost,
    }),
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  return request;
}

export async function getMaintenanceRequestById(tenantId: string, requestId: string) {
  const request = await prisma.re_maintenance_request.findFirst({
    where: {
      id: requestId,
      tenantId,
    },
    include: {
      property: {
        select: { id: true, name: true, address: true, city: true, state: true },
      },
    },
  });

  // Fetch unit info if unitId exists
  if (request?.unitId) {
    const unit = await prisma.re_unit.findFirst({
      where: { id: request.unitId },
      select: { id: true, unitNumber: true, unitType: true },
    });
    return { ...request, unit };
  }

  return request;
}

export async function getMaintenanceRequests(tenantId: string, filters: MaintenanceFilters = {}) {
  const { 
    propertyId, 
    unitId, 
    status, 
    priority, 
    category,
    assignedTo,
    dateFrom,
    dateTo,
    page = 1, 
    limit = 20 
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.re_maintenance_requestWhereInput = {
    tenantId,
    ...(propertyId && { propertyId }),
    ...(unitId && { unitId }),
    ...(status && { status: status as any }),
    ...(priority && { priority: priority as any }),
    ...(category && { category: category as any }),
    ...(assignedTo && { assignedTo }),
    ...(dateFrom && { createdAt: { gte: dateFrom } }),
    ...(dateTo && { createdAt: { lte: dateTo } }),
  };

  const [requests, total] = await Promise.all([
    prisma.re_maintenance_request.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.re_maintenance_request.count({ where }),
  ]);

  // Fetch unit info for requests with unitId
  const requestsWithUnits = await Promise.all(
    requests.map(async (request) => {
      if (request.unitId) {
        const unit = await prisma.re_unit.findFirst({
          where: { id: request.unitId },
          select: { id: true, unitNumber: true },
        });
        return { ...request, unit };
      }
      return { ...request, unit: null };
    })
  );

  return {
    requests: requestsWithUnits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateMaintenanceRequest(
  tenantId: string,
  requestId: string,
  data: UpdateMaintenanceRequestInput
) {
  const result = await prisma.re_maintenance_request.updateMany({
    where: {
      id: requestId,
      tenantId,
    },
    data: {
      ...(data.category && { category: data.category as any }),
      ...(data.priority && { priority: data.priority as any }),
      ...(data.status && { status: data.status as any }),
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(data.assignedName !== undefined && { assignedName: data.assignedName }),
      ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate }),
      ...(data.completedDate !== undefined && { completedDate: data.completedDate }),
      ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
      ...(data.actualCost !== undefined && { actualCost: data.actualCost }),
      ...(data.costNotes !== undefined && { costNotes: data.costNotes }),
      ...(data.photosBefore && { photosBefore: data.photosBefore }),
      ...(data.photosAfter && { photosAfter: data.photosAfter }),
      ...(data.resolutionNotes !== undefined && { resolutionNotes: data.resolutionNotes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getMaintenanceRequestById(tenantId, requestId);
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export async function assignRequest(
  tenantId: string,
  requestId: string,
  assignedTo: string,
  assignedName: string,
  scheduledDate?: Date
) {
  const request = await prisma.re_maintenance_request.findFirst({
    where: { id: requestId, tenantId, status: 'OPEN' },
  });

  if (!request) {
    throw new Error('Request not found or not in open status');
  }

  const updated = await prisma.re_maintenance_request.update({
    where: { id: requestId },
    data: {
      status: 'ASSIGNED',
      assignedTo,
      assignedName,
      scheduledDate,
    },
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  return updated;
}

export async function startWork(tenantId: string, requestId: string) {
  const request = await prisma.re_maintenance_request.findFirst({
    where: { id: requestId, tenantId, status: 'ASSIGNED' },
  });

  if (!request) {
    throw new Error('Request not found or not assigned');
  }

  const updated = await prisma.re_maintenance_request.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  return updated;
}

export async function completeRequest(
  tenantId: string,
  requestId: string,
  resolution: {
    actualCost?: number;
    costNotes?: string;
    photosAfter?: string[];
    resolutionNotes?: string;
  }
) {
  const request = await prisma.re_maintenance_request.findFirst({
    where: { id: requestId, tenantId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
  });

  if (!request) {
    throw new Error('Request not found or not in progress');
  }

  const updated = await prisma.re_maintenance_request.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      ...(resolution.actualCost !== undefined && { actualCost: resolution.actualCost }),
      ...(resolution.costNotes && { costNotes: resolution.costNotes }),
      ...(resolution.photosAfter && { photosAfter: resolution.photosAfter }),
      ...(resolution.resolutionNotes && { resolutionNotes: resolution.resolutionNotes }),
    },
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  return updated;
}

export async function cancelRequest(
  tenantId: string,
  requestId: string,
  reason?: string
) {
  const request = await prisma.re_maintenance_request.findFirst({
    where: { id: requestId, tenantId, status: { not: 'COMPLETED' } },
  });

  if (!request) {
    throw new Error('Request not found or already completed');
  }

  const updated = await prisma.re_maintenance_request.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      resolutionNotes: reason ? `Cancelled: ${reason}` : 'Cancelled',
    },
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
    },
  });

  return updated;
}

// ============================================================================
// MAINTENANCE STATISTICS
// ============================================================================

export async function getMaintenanceStats(tenantId: string, propertyId?: string) {
  const baseWhere = { tenantId, ...(propertyId && { propertyId }) };

  const [
    totalRequests,
    openRequests,
    assignedRequests,
    inProgressRequests,
    completedRequests,
    cancelledRequests,
    emergencyRequests,
  ] = await Promise.all([
    prisma.re_maintenance_request.count({ where: baseWhere }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, status: 'OPEN' } }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, status: 'ASSIGNED' } }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
    prisma.re_maintenance_request.count({ where: { ...baseWhere, priority: 'EMERGENCY', status: { not: 'COMPLETED' } } }),
  ]);

  // Cost stats for completed requests
  const costStats = await prisma.re_maintenance_request.aggregate({
    where: { ...baseWhere, status: 'COMPLETED' },
    _sum: { actualCost: true, estimatedCost: true },
    _avg: { actualCost: true },
  });

  // Average resolution time (simplified - based on records with completedDate)
  const completedWithDates = await prisma.re_maintenance_request.findMany({
    where: { ...baseWhere, status: 'COMPLETED', completedDate: { not: null } },
    select: { createdAt: true, completedDate: true },
    take: 100,
  });

  let averageResolutionDays = 0;
  if (completedWithDates.length > 0) {
    const totalDays = completedWithDates.reduce((sum: any, r: any) => {
      if (r.completedDate) {
        const diff = r.completedDate.getTime() - r.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);
    averageResolutionDays = Math.round(totalDays / completedWithDates.length);
  }

  return {
    totalRequests,
    openRequests,
    assignedRequests,
    inProgressRequests,
    completedRequests,
    cancelledRequests,
    emergencyRequests,
    activeRequests: openRequests + assignedRequests + inProgressRequests,
    totalMaintenanceCost: costStats._sum.actualCost || 0,
    averageMaintenanceCost: costStats._avg.actualCost || 0,
    averageResolutionDays,
  };
}

// ============================================================================
// CATEGORY BREAKDOWN
// ============================================================================

export async function getMaintenanceByCategory(tenantId: string) {
  const categories: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'HVAC', 'CLEANING', 'SECURITY', 'OTHER'];
  
  const breakdown = await Promise.all(
    categories.map(async (category) => {
      const [total, open, completed] = await Promise.all([
        prisma.re_maintenance_request.count({ where: { tenantId, category: category as any } }),
        prisma.re_maintenance_request.count({ where: { tenantId, category: category as any, status: 'OPEN' } }),
        prisma.re_maintenance_request.count({ where: { tenantId, category: category as any, status: 'COMPLETED' } }),
      ]);
      
      const costStats = await prisma.re_maintenance_request.aggregate({
        where: { tenantId, category: category as any, status: 'COMPLETED' },
        _sum: { actualCost: true },
      });

      return {
        category,
        total,
        open,
        completed,
        totalCost: costStats._sum.actualCost || 0,
      };
    })
  );

  return breakdown.sort((a: any, b: any) => b.total - a.total);
}

// ============================================================================
// PRIORITY LABELS & HELPERS
// ============================================================================

export const PRIORITY_LABELS: Record<MaintenancePriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'gray' },
  MEDIUM: { label: 'Medium', color: 'yellow' },
  HIGH: { label: 'High', color: 'orange' },
  EMERGENCY: { label: 'Emergency', color: 'red' },
};

export const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  STRUCTURAL: 'Structural',
  HVAC: 'HVAC',
  CLEANING: 'Cleaning',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<MaintenanceStatus, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'blue' },
  ASSIGNED: { label: 'Assigned', color: 'purple' },
  IN_PROGRESS: { label: 'In Progress', color: 'yellow' },
  COMPLETED: { label: 'Completed', color: 'green' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
};
