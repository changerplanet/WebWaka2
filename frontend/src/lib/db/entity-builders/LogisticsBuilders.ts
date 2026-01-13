/**
 * Phase 16B - Logistics Entity Builders
 *
 * Pure, deterministic functions that transform service-layer inputs
 * into Prisma-compliant create/update input objects.
 *
 * NO side effects, NO I/O, NO business logic.
 */

import {
  Prisma,
  LogisticsDeliveryStatus,
  LogisticsDeliveryPriority,
  LogisticsZoneType,
  LogisticsZoneStatus,
  LogisticsAgentStatus,
  LogisticsAgentAvailability,
  LogisticsProofType,
} from "@prisma/client";
import { randomUUID } from "crypto";

// ============================================================================
// DELIVERY ASSIGNMENTS
// ============================================================================

export interface DeliveryAssignmentInput {
  tenantId: string;
  orderId: string;
  orderType: string;
  orderNumber?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  zoneId?: string | null;
  agentId?: string | null;
  deliveryAddress?: Record<string, unknown> | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  pickupLocationId?: string | null;
  pickupAddress?: Record<string, unknown> | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  status?:
    | LogisticsDeliveryStatus
    | "PENDING"
    | "ASSIGNED"
    | "ACCEPTED"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "FAILED"
    | "CANCELLED";
  priority?:
    | LogisticsDeliveryPriority
    | "LOW"
    | "STANDARD"
    | "HIGH"
    | "EXPRESS"
    | "URGENT";
  estimatedFee?: number | null;
  actualFee?: number | null;
  currency?: string;
  feeCalculation?: Record<string, unknown> | null;
  estimatedDistanceKm?: number | null;
  estimatedDurationMin?: number | null;
  actualDistanceKm?: number | null;
  actualDurationMin?: number | null;
  actualPickupAt?: Date | null;
  actualDeliveryAt?: Date | null;
  contactOnArrival?: boolean;
  packageCount?: number;
  totalWeight?: number | null;
  scheduledPickupAt?: Date | null;
  scheduledDeliveryAt?: Date | null;
  packageDetails?: Record<string, unknown> | null;
  deliveryInstructions?: string | null;
  metadata?: Record<string, unknown> | null;
  autoAssigned?: boolean;
  assignedBy?: string | null;
}

export function buildDeliveryAssignmentCreate(
  input: DeliveryAssignmentInput,
): Prisma.logistics_delivery_assignmentsCreateInput {
  const hasAgent = !!input.agentId;

  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    orderId: input.orderId,
    orderType: input.orderType,
    orderNumber: input.orderNumber ?? null,
    customerId: input.customerId ?? null,
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
    ...(input.zoneId && {
      logistics_delivery_zones: { connect: { id: input.zoneId } },
    }),
    ...(input.agentId && {
      logistics_delivery_agents: { connect: { id: input.agentId } },
    }),
    deliveryAddress: input.deliveryAddress
      ? (input.deliveryAddress as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    deliveryLatitude: input.deliveryLatitude ?? null,
    deliveryLongitude: input.deliveryLongitude ?? null,
    pickupLocationId: input.pickupLocationId ?? null,
    pickupAddress: input.pickupAddress
      ? (input.pickupAddress as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    pickupLatitude: input.pickupLatitude ?? null,
    pickupLongitude: input.pickupLongitude ?? null,
    status: (hasAgent
      ? "ASSIGNED"
      : (input.status ?? "PENDING")) as LogisticsDeliveryStatus,
    priority: (input.priority ?? "STANDARD") as LogisticsDeliveryPriority,
    estimatedFee: input.estimatedFee ?? null,
    actualFee: input.actualFee ?? null,
    currency: input.currency ?? "NGN",
    feeCalculation: input.feeCalculation
      ? (input.feeCalculation as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    estimatedDistanceKm: input.estimatedDistanceKm ?? null,
    estimatedDurationMin: input.estimatedDurationMin ?? null,
    actualDistanceKm: input.actualDistanceKm ?? null,
    actualDurationMin: input.actualDurationMin ?? null,
    actualPickupAt: input.actualPickupAt ?? null,
    actualDeliveryAt: input.actualDeliveryAt ?? null,
    scheduledPickupAt: input.scheduledPickupAt ?? null,
    scheduledDeliveryAt: input.scheduledDeliveryAt ?? null,
    packageDetails: input.packageDetails
      ? (input.packageDetails as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    specialInstructions: input.deliveryInstructions ?? null,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    autoAssigned: input.autoAssigned ?? false,
    assignedBy: input.assignedBy ?? null,
    assignedAt: hasAgent ? new Date() : null,
    contactOnArrival: input.contactOnArrival ?? true,
    packageCount: input.packageCount ?? 1,
    totalWeight: input.totalWeight ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildDeliveryAssignmentUpdate(
  input: Partial<DeliveryAssignmentInput>,
): Prisma.logistics_delivery_assignmentsUpdateInput {
  const update: Prisma.logistics_delivery_assignmentsUpdateInput = {};

  if (input.status !== undefined)
    update.status = input.status as LogisticsDeliveryStatus;
  if (input.priority !== undefined)
    update.priority = input.priority as LogisticsDeliveryPriority;
  if (input.agentId !== undefined) {
    update.logistics_delivery_agents = input.agentId
      ? { connect: { id: input.agentId } }
      : { disconnect: true };
  }
  if (input.estimatedFee !== undefined)
    update.estimatedFee = input.estimatedFee;
  if (input.actualFee !== undefined) update.actualFee = input.actualFee;
  if (input.actualDistanceKm !== undefined)
    update.actualDistanceKm = input.actualDistanceKm;
  if (input.actualDurationMin !== undefined)
    update.actualDurationMin = input.actualDurationMin;
  if (input.metadata !== undefined)
    update.metadata = input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull;

  update.updatedAt = new Date();

  return update;
}

// ============================================================================
// DELIVERY ZONES
// ============================================================================

export interface DeliveryZoneInput {
  tenantId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  zoneType?: LogisticsZoneType | "CITY" | "LGA" | "STATE" | "REGION" | "CUSTOM";
  city?: string | null;
  lga?: string | null;
  postalCodes?: string[];
  radiusKm?: number | null;
  polygon?: Record<string, unknown> | null;
  status?: LogisticsZoneStatus | "ACTIVE" | "INACTIVE";
  metadata?: Record<string, unknown> | null;
  state?: string | null;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  sortOrder?: number;
  createdBy?: string | null;
}

export function buildDeliveryZoneCreate(
  input: DeliveryZoneInput,
): Prisma.logistics_delivery_zonesCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    zoneType: (input.zoneType ?? "CITY") as LogisticsZoneType,
    city: input.city ?? null,
    state: input.state ?? null,
    lga: input.lga ?? null,
    postalCodes: input.postalCodes ?? [],
    centerLatitude: input.centerLatitude ?? null,
    centerLongitude: input.centerLongitude ?? null,
    radiusKm: input.radiusKm ?? null,
    polygon: input.polygon
      ? (input.polygon as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    status: (input.status ?? "ACTIVE") as LogisticsZoneStatus,
    sortOrder: input.sortOrder ?? 0,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    createdBy: input.createdBy ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildDeliveryZoneUpdate(
  input: Partial<DeliveryZoneInput>,
): Prisma.logistics_delivery_zonesUpdateInput {
  const update: Prisma.logistics_delivery_zonesUpdateInput = {};

  if (input.name !== undefined) update.name = input.name;
  if (input.code !== undefined) update.code = input.code;
  if (input.description !== undefined) update.description = input.description;
  if (input.zoneType !== undefined)
    update.zoneType = input.zoneType as LogisticsZoneType;
  if (input.city !== undefined) update.city = input.city;
  if (input.state !== undefined) update.state = input.state;
  if (input.lga !== undefined) update.lga = input.lga;
  if (input.postalCodes !== undefined) update.postalCodes = input.postalCodes;
  if (input.centerLatitude !== undefined)
    update.centerLatitude = input.centerLatitude;
  if (input.centerLongitude !== undefined)
    update.centerLongitude = input.centerLongitude;
  if (input.radiusKm !== undefined) update.radiusKm = input.radiusKm;
  if (input.polygon !== undefined)
    update.polygon = input.polygon
      ? (input.polygon as Prisma.InputJsonValue)
      : Prisma.JsonNull;
  if (input.status !== undefined)
    update.status = input.status as LogisticsZoneStatus;
  if (input.sortOrder !== undefined) update.sortOrder = input.sortOrder;
  if (input.metadata !== undefined)
    update.metadata = input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull;

  update.updatedAt = new Date();

  return update;
}

// ============================================================================
// DELIVERY AGENTS
// ============================================================================

export interface DeliveryAgentInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
  status?: LogisticsAgentStatus | string;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  isAvailable?: boolean;
  rating?: number | null;
  completedDeliveries?: number;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export function buildDeliveryAgentCreate(
  input: DeliveryAgentInput,
): Prisma.logistics_delivery_agentsCreateInput {
  const names = (input.name || "").split(" ");
  const firstName = names.shift() ?? null;
  const lastName = names.join(" ") || null;

  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    phone: input.phone,
    email: input.email ?? null,
    photoUrl: (input as any).photoUrl ?? null,
    status: (input.status ?? "ACTIVE") as LogisticsAgentStatus,
    vehicleType: input.vehicleType ?? null,
    vehiclePlate: input.vehiclePlate ?? null,
    lastLatitude: input.currentLatitude ?? null,
    lastLongitude: input.currentLongitude ?? null,
    lastLocationAt: (input as any).lastSeenAt ?? null,
    totalDeliveries: 0,
    completedDeliveries: input.completedDeliveries ?? 0,
    failedDeliveries: 0,
    averageRating: input.rating ?? null,
    totalRatings: 0,
    employeeId: (input as any).employeeId ?? null,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// DELIVERY PROOFS
// ============================================================================

export interface DeliveryProofInput {
  assignmentId: string;
  proofType: LogisticsProofType | string;
  imageUrl?: string | null;
  signatureData?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientRelation?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, unknown> | null;
  capturedAt?: Date;
  capturedBy?: string | null;
}

export function buildDeliveryProofCreate(
  input: DeliveryProofInput,
): Prisma.logistics_delivery_proofsCreateInput {
  return {
    id: randomUUID(),
    logistics_delivery_assignments: {
      connect: { id: input.assignmentId },
    },
    proofType: input.proofType as LogisticsProofType,
    imageUrl: input.imageUrl ?? null,
    signatureData: input.signatureData ?? null,
    recipientName: input.recipientName ?? null,
    notes: input.notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    capturedAt: input.capturedAt ?? new Date(),
    capturedBy: input.capturedBy ?? null,
  };
}

// ============================================================================
// LOGISTICS CONFIGURATIONS
// ============================================================================

export interface LogisticsConfigInput {
  tenantId: string;
  autoAssign?: boolean;
  maxAssignmentsPerAgent?: number;
  autoAssignRadius?: number;
  defaultCurrency?: string;
  defaultPriority?: string;
  otpVerificationRequired?: boolean;
  photoProofRequired?: boolean;
  signatureRequired?: boolean;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  workingDays?: string[];
  createdBy?: string | null;
}

export function buildLogisticsConfigCreate(
  input: LogisticsConfigInput,
): Prisma.logistics_configurationsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    deliveryEnabled: true,
    autoAssignmentEnabled: input.autoAssign ?? false,
    realTimeTrackingEnabled: false,
    proofOfDeliveryRequired: true,
    defaultPriority: (input.defaultPriority ??
      "STANDARD") as LogisticsDeliveryPriority,
    defaultCurrency: input.defaultCurrency ?? "NGN",
    photoProofRequired: input.photoProofRequired ?? true,
    signatureProofRequired: input.signatureRequired ?? false,
    otpVerificationEnabled: input.otpVerificationRequired ?? false,
    assignmentAlgorithm: (input as any).assignmentAlgorithm ?? "NEAREST",
    maxConcurrentDeliveries: input.maxAssignmentsPerAgent ?? 5,
    operatingHours:
      input.workingHoursStart || input.workingHoursEnd || input.workingDays
        ? ({
            start: input.workingHoursStart ?? null,
            end: input.workingHoursEnd ?? null,
            days: input.workingDays ?? null,
          } as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function buildLogisticsConfigUpdate(
  input: Partial<LogisticsConfigInput>,
): Prisma.logistics_configurationsUpdateInput {
  const update: Prisma.logistics_configurationsUpdateInput = {};
  if (input.autoAssign !== undefined)
    update.autoAssignmentEnabled = input.autoAssign;
  if (input.maxAssignmentsPerAgent !== undefined)
    update.maxConcurrentDeliveries = input.maxAssignmentsPerAgent;
  if (input.defaultCurrency !== undefined)
    update.defaultCurrency = input.defaultCurrency;
  if (input.defaultPriority !== undefined)
    update.defaultPriority = input.defaultPriority as LogisticsDeliveryPriority;
  if (input.otpVerificationRequired !== undefined)
    update.otpVerificationEnabled = input.otpVerificationRequired;
  if (input.photoProofRequired !== undefined)
    update.photoProofRequired = input.photoProofRequired;
  if (input.signatureRequired !== undefined)
    update.signatureProofRequired = input.signatureRequired;
  if (
    input.workingHoursStart !== undefined ||
    input.workingHoursEnd !== undefined ||
    input.workingDays !== undefined
  )
    update.operatingHours = {
      set: {
        start: input.workingHoursStart ?? null,
        end: input.workingHoursEnd ?? null,
        days: input.workingDays ?? null,
      } as Prisma.InputJsonValue,
    };

  update.updatedAt = new Date();

  return update;
}

// ============================================================================
// STATUS HISTORY
// ============================================================================

export interface StatusHistoryInput {
  assignmentId: string;
  fromStatus?: LogisticsDeliveryStatus | string | null;
  toStatus: LogisticsDeliveryStatus | string;
  notes?: string | null;
  changedBy?: string | null;
  changedByType?: string;
  latitude?: number | null;
  longitude?: number | null;
  recordedAt?: Date;
  metadata?: Record<string, unknown> | null;
}

export function buildStatusHistoryCreate(
  input: StatusHistoryInput,
): Prisma.logistics_delivery_status_historyCreateInput {
  return {
    id: randomUUID(),
    logistics_delivery_assignments: {
      connect: { id: input.assignmentId },
    },
    fromStatus: input.fromStatus
      ? (input.fromStatus as unknown as LogisticsDeliveryStatus)
      : null,
    toStatus: input.toStatus as LogisticsDeliveryStatus,
    notes: input.notes ?? null,
    changedBy: input.changedBy ?? null,
    changedByType: input.changedByType ?? "SYSTEM",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    recordedAt: input.recordedAt ?? new Date(),
    createdAt: new Date(),
  };
}
