/**
 * Phase 16B - Procurement Entity Builders
 * 
 * Pure, deterministic functions that transform service-layer inputs
 * into Prisma-compliant create/update input objects.
 * 
 * NO side effects, NO I/O, NO business logic.
 */

import { Prisma, ProcPurchaseOrderStatus, ProcPurchaseRequestStatus, ProcPriority } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export interface PurchaseOrderInput {
  tenantId: string;
  poNumber: string;
  status?: ProcPurchaseOrderStatus | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  priority?: ProcPriority | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  supplierId: string;
  supplierName?: string | null;
  warehouseId?: string | null;
  purchaseRequestId?: string | null;
  currency?: string;
  subtotal: number;
  taxTotal?: number;
  discountTotal?: number;
  grandTotal: number;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  expectedDeliveryDate?: Date | null;
  notes?: string | null;
  internalNotes?: string | null;
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}

export function buildPurchaseOrderCreate(
  input: PurchaseOrderInput
): Prisma.proc_purchase_ordersCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    poNumber: input.poNumber,
    status: (input.status ?? 'DRAFT') as ProcPurchaseOrderStatus,
    priority: (input.priority ?? 'NORMAL') as ProcPriority,
    supplierId: input.supplierId,
    supplierName: input.supplierName ?? null,
    warehouseId: input.warehouseId ?? null,
    purchaseRequestId: input.purchaseRequestId ?? null,
    currency: input.currency ?? 'NGN',
    subtotal: input.subtotal,
    taxTotal: input.taxTotal ?? 0,
    discountTotal: input.discountTotal ?? 0,
    grandTotal: input.grandTotal,
    paymentTerms: input.paymentTerms ?? null,
    deliveryTerms: input.deliveryTerms ?? null,
    expectedDeliveryDate: input.expectedDeliveryDate ?? null,
    notes: input.notes ?? null,
    internalNotes: input.internalNotes ?? null,
    createdBy: input.createdBy,
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.approvedAt ?? null,
  };
}

export function buildPurchaseOrderUpdate(
  input: Partial<PurchaseOrderInput>
): Prisma.proc_purchase_ordersUpdateInput {
  const update: Prisma.proc_purchase_ordersUpdateInput = {};
  
  if (input.status !== undefined) update.status = input.status as ProcPurchaseOrderStatus;
  if (input.priority !== undefined) update.priority = input.priority as ProcPriority;
  if (input.supplierName !== undefined) update.supplierName = input.supplierName;
  if (input.warehouseId !== undefined) update.warehouseId = input.warehouseId;
  if (input.subtotal !== undefined) update.subtotal = input.subtotal;
  if (input.taxTotal !== undefined) update.taxTotal = input.taxTotal;
  if (input.discountTotal !== undefined) update.discountTotal = input.discountTotal;
  if (input.grandTotal !== undefined) update.grandTotal = input.grandTotal;
  if (input.paymentTerms !== undefined) update.paymentTerms = input.paymentTerms;
  if (input.deliveryTerms !== undefined) update.deliveryTerms = input.deliveryTerms;
  if (input.expectedDeliveryDate !== undefined) update.expectedDeliveryDate = input.expectedDeliveryDate;
  if (input.notes !== undefined) update.notes = input.notes;
  if (input.internalNotes !== undefined) update.internalNotes = input.internalNotes;
  if (input.approvedBy !== undefined) update.approvedBy = input.approvedBy;
  if (input.approvedAt !== undefined) update.approvedAt = input.approvedAt;
  
  update.updatedAt = new Date();
  
  return update;
}

// ============================================================================
// PURCHASE ORDER ITEMS
// ============================================================================

export interface PurchaseOrderItemInput {
  purchaseOrderId: string;
  productId: string;
  productSku?: string | null;
  productName: string;
  orderedQuantity: number;
  receivedQuantity?: number;
  pendingQuantity?: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  lineTotal: number;
  specifications?: string | null;
  notes?: string | null;
  lineNumber: number;
}

export function buildPurchaseOrderItemCreate(
  input: PurchaseOrderItemInput
): Prisma.proc_purchase_order_itemsCreateInput {
  return {
    id: randomUUID(),
    proc_purchase_orders: {
      connect: { id: input.purchaseOrderId }
    },
    productId: input.productId,
    productSku: input.productSku ?? null,
    productName: input.productName,
    orderedQuantity: input.orderedQuantity,
    receivedQuantity: input.receivedQuantity ?? 0,
    pendingQuantity: input.pendingQuantity ?? input.orderedQuantity,
    unit: input.unit ?? 'UNIT',
    unitPrice: input.unitPrice,
    taxRate: input.taxRate ?? 0,
    discount: input.discount ?? 0,
    lineTotal: input.lineTotal,
    specifications: input.specifications ?? null,
    notes: input.notes ?? null,
    lineNumber: input.lineNumber,
  };
}

// ============================================================================
// PURCHASE REQUESTS
// ============================================================================

export interface PurchaseRequestInput {
  tenantId: string;
  requestNumber: string;
  status?: ProcPurchaseRequestStatus | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'CANCELLED';
  priority?: ProcPriority | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  requestedBy: string;
  department?: string | null;
  locationId?: string | null;
  preferredSupplierId?: string | null;
  justification?: string | null;
  notes?: string | null;
  requiredByDate?: Date | null;
  currency?: string;
  estimatedTotal?: number | null;
  attachments?: Record<string, unknown> | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
}

export function buildPurchaseRequestCreate(
  input: PurchaseRequestInput
): Prisma.proc_purchase_requestsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    requestNumber: input.requestNumber,
    status: (input.status ?? 'DRAFT') as ProcPurchaseRequestStatus,
    priority: (input.priority ?? 'NORMAL') as ProcPriority,
    requestedBy: input.requestedBy,
    department: input.department ?? null,
    locationId: input.locationId ?? null,
    preferredSupplierId: input.preferredSupplierId ?? null,
    justification: input.justification ?? null,
    notes: input.notes ?? null,
    requiredByDate: input.requiredByDate ?? null,
    currency: input.currency ?? 'NGN',
    estimatedTotal: input.estimatedTotal ?? null,
    attachments: input.attachments ? input.attachments as Prisma.InputJsonValue : Prisma.JsonNull,
    reviewedBy: input.reviewedBy ?? null,
    reviewedAt: input.reviewedAt ?? null,
    reviewNotes: input.reviewNotes ?? null,
  };
}

export function buildPurchaseRequestUpdate(
  input: Partial<PurchaseRequestInput>
): Prisma.proc_purchase_requestsUpdateInput {
  const update: Prisma.proc_purchase_requestsUpdateInput = {};
  
  if (input.status !== undefined) update.status = input.status as ProcPurchaseRequestStatus;
  if (input.priority !== undefined) update.priority = input.priority as ProcPriority;
  if (input.department !== undefined) update.department = input.department;
  if (input.locationId !== undefined) update.locationId = input.locationId;
  if (input.preferredSupplierId !== undefined) update.preferredSupplierId = input.preferredSupplierId;
  if (input.justification !== undefined) update.justification = input.justification;
  if (input.notes !== undefined) update.notes = input.notes;
  if (input.requiredByDate !== undefined) update.requiredByDate = input.requiredByDate;
  if (input.estimatedTotal !== undefined) update.estimatedTotal = input.estimatedTotal;
  if (input.attachments !== undefined) update.attachments = input.attachments ?? Prisma.JsonNull;
  if (input.reviewedBy !== undefined) update.reviewedBy = input.reviewedBy;
  if (input.reviewedAt !== undefined) update.reviewedAt = input.reviewedAt;
  if (input.reviewNotes !== undefined) update.reviewNotes = input.reviewNotes;
  
  update.updatedAt = new Date();
  
  return update;
}

// ============================================================================
// PURCHASE REQUEST ITEMS
// ============================================================================

export interface PurchaseRequestItemInput {
  purchaseRequestId: string;
  productId: string;
  productSku?: string | null;
  productName: string;
  quantity: number;
  unit?: string;
  estimatedUnitPrice?: number | null;
  estimatedTotal?: number | null;
  specifications?: string | null;
  notes?: string | null;
  lineNumber: number;
}

export function buildPurchaseRequestItemCreate(
  input: PurchaseRequestItemInput
): Prisma.proc_purchase_request_itemsCreateInput {
  return {
    id: randomUUID(),
    proc_purchase_requests: {
      connect: { id: input.purchaseRequestId }
    },
    productId: input.productId,
    productSku: input.productSku ?? null,
    productName: input.productName,
    quantity: input.quantity,
    unit: input.unit ?? 'UNIT',
    estimatedUnitPrice: input.estimatedUnitPrice ?? null,
    estimatedTotal: input.estimatedTotal ?? null,
    specifications: input.specifications ?? null,
    notes: input.notes ?? null,
    lineNumber: input.lineNumber,
  };
}
