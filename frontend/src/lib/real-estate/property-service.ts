/**
 * REAL ESTATE MANAGEMENT — Property Service
 * Phase 7A, S2 Core Services
 * 
 * Database-backed property management.
 * Nigeria-first defaults (NGN, LGA-based addresses).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED' | 'LAND';
export type PropertyStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNLISTED';

export interface CreatePropertyInput {
  name: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  lga?: string;
  landmark?: string;
  description?: string;
  yearBuilt?: number;
  totalUnits?: number;
  amenities?: Record<string, unknown>;
  photos?: string[];
  documents?: string[];
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  status?: PropertyStatus;
}

export interface PropertyFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  state?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// PROPERTY CRUD OPERATIONS
// ============================================================================

export async function createProperty(
  tenantId: string,
  data: CreatePropertyInput,
  platformInstanceId?: string,
  createdBy?: string
) {
  const property = await prisma.re_property.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      name: data.name,
      propertyType: data.propertyType as any,
      status: 'AVAILABLE',
      address: data.address,
      city: data.city,
      state: data.state,
      lga: data.lga,
      landmark: data.landmark,
      description: data.description,
      yearBuilt: data.yearBuilt,
      totalUnits: data.totalUnits || 1,
      amenities: data.amenities as any,
      photos: data.photos || [],
      documents: data.documents || [],
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      createdBy,
    }),
    include: {
      units: true,
    },
  });

  return property;
}

export async function getPropertyById(tenantId: string, propertyId: string) {
  const property = await prisma.re_property.findFirst({
    where: {
      id: propertyId,
      tenantId,
    },
    include: {
      units: {
        orderBy: { unitNumber: 'asc' },
      },
      maintenanceRequests: {
        where: { status: { not: 'COMPLETED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  return property;
}

export async function getProperties(tenantId: string, filters: PropertyFilters = {}) {
  const { status, propertyType, state, city, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.re_propertyWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(propertyType && { propertyType: propertyType as any }),
    ...(state && { state }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.re_property.findMany({
      where,
      include: {
        units: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.re_property.count({ where }),
  ]);

  // Calculate stats
  const stats = await getPropertyStats(tenantId);

  return {
    properties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats,
  };
}

export async function updateProperty(
  tenantId: string,
  propertyId: string,
  data: UpdatePropertyInput
) {
  const property = await prisma.re_property.updateMany({
    where: {
      id: propertyId,
      tenantId,
    },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.propertyType && { propertyType: data.propertyType as any }),
      ...(data.status && { status: data.status as any }),
      ...(data.address && { address: data.address }),
      ...(data.city && { city: data.city }),
      ...(data.state && { state: data.state }),
      ...(data.lga !== undefined && { lga: data.lga }),
      ...(data.landmark !== undefined && { landmark: data.landmark }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.yearBuilt !== undefined && { yearBuilt: data.yearBuilt }),
      ...(data.totalUnits !== undefined && { totalUnits: data.totalUnits }),
      ...(data.amenities !== undefined && { amenities: data.amenities as any }),
      ...(data.photos && { photos: data.photos }),
      ...(data.documents && { documents: data.documents }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
      ...(data.ownerPhone !== undefined && { ownerPhone: data.ownerPhone }),
      ...(data.ownerEmail !== undefined && { ownerEmail: data.ownerEmail }),
    },
  });

  if (property.count === 0) {
    return null;
  }

  return getPropertyById(tenantId, propertyId);
}

export async function deleteProperty(tenantId: string, propertyId: string) {
  // Check if property has active leases
  const activeLeases = await prisma.re_lease.count({
    where: {
      tenantId,
      unit: {
        propertyId,
      },
      status: 'ACTIVE',
    },
  });

  if (activeLeases > 0) {
    throw new Error('Cannot delete property with active leases');
  }

  const result = await prisma.re_property.deleteMany({
    where: {
      id: propertyId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// PROPERTY STATISTICS
// ============================================================================

export async function getPropertyStats(tenantId: string) {
  const [
    totalProperties,
    availableProperties,
    occupiedProperties,
    maintenanceProperties,
  ] = await Promise.all([
    prisma.re_property.count({ where: { tenantId } }),
    prisma.re_property.count({ where: { tenantId, status: 'AVAILABLE' } }),
    prisma.re_property.count({ where: { tenantId, status: 'OCCUPIED' } }),
    prisma.re_property.count({ where: { tenantId, status: 'MAINTENANCE' } }),
  ]);

  const [totalUnits, vacantUnits, occupiedUnits] = await Promise.all([
    prisma.re_unit.count({ where: { tenantId } }),
    prisma.re_unit.count({ where: { tenantId, status: 'VACANT' } }),
    prisma.re_unit.count({ where: { tenantId, status: 'OCCUPIED' } }),
  ]);

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return {
    totalProperties,
    availableProperties,
    occupiedProperties,
    maintenanceProperties,
    totalUnits,
    vacantUnits,
    occupiedUnits,
    occupancyRate,
  };
}

// ============================================================================
// NIGERIAN STATES & LGAs (Subset for Demo)
// ============================================================================

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const LAGOS_LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
];

export const ABUJA_AREAS = [
  'AMAC', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji',
];
