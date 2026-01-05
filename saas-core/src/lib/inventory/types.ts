/**
 * MODULE 1: Inventory & Warehouse Management
 * Type definitions and event contracts
 * 
 * OWNERSHIP RULES:
 * - This module OWNS: Warehouse, StockMovement, StockTransfer, etc.
 * - This module USES from Core (by ID only): Product, InventoryLevel, Location, Supplier
 * - Core InventoryLevel remains the SINGLE SOURCE OF TRUTH for quantities
 * - All inventory changes emit events for Core to process
 */

// ============================================================================
// EVENT CONTRACTS
// These events are emitted by this module and consumed by Core
// Core is responsible for applying actual inventory changes
// ============================================================================

export type InventoryEventType =
  | 'STOCK_TRANSFER_REQUESTED'
  | 'STOCK_TRANSFER_APPROVED'
  | 'STOCK_TRANSFER_REJECTED'
  | 'STOCK_TRANSFER_SHIPPED'
  | 'STOCK_TRANSFER_RECEIVED'
  | 'STOCK_TRANSFER_COMPLETED'
  | 'STOCK_TRANSFER_CANCELLED'
  | 'INVENTORY_ADJUSTMENT_REQUESTED'
  | 'INVENTORY_ADJUSTMENT_APPROVED'
  | 'INVENTORY_AUDIT_STARTED'
  | 'INVENTORY_AUDIT_COMPLETED'
  | 'REORDER_SUGGESTED'
  | 'STOCK_MOVEMENT_RECORDED';

export interface InventoryEvent {
  id: string;
  type: InventoryEventType;
  tenantId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: {
    userId?: string;
    userName?: string;
    source?: 'WEB' | 'MOBILE' | 'API' | 'SYSTEM';
    isOffline?: boolean;
    offlineId?: string;
  };
}

// ============================================================================
// STOCK TRANSFER EVENTS
// ============================================================================

export interface StockTransferRequestedEvent extends InventoryEvent {
  type: 'STOCK_TRANSFER_REQUESTED';
  payload: {
    transferId: string;
    transferNumber: string;
    fromWarehouseId: string;
    fromLocationId: string;
    toWarehouseId: string;
    toLocationId: string;
    items: Array<{
      productId: string;
      variantId?: string;
      sku?: string;
      quantityRequested: number;
      batchNumber?: string;
    }>;
    priority: string;
    reason?: string;
  };
}

export interface StockTransferApprovedEvent extends InventoryEvent {
  type: 'STOCK_TRANSFER_APPROVED';
  payload: {
    transferId: string;
    transferNumber: string;
    approvedById: string;
    approvedByName: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantityApproved: number;
    }>;
  };
}

export interface StockTransferShippedEvent extends InventoryEvent {
  type: 'STOCK_TRANSFER_SHIPPED';
  payload: {
    transferId: string;
    transferNumber: string;
    fromWarehouseId: string;
    fromLocationId: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantityShipped: number;
      batchNumber?: string;
    }>;
    // This event triggers Core to DECREASE inventory at source location
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number; // Negative for shipped items
      reason: 'TRANSFER_OUT';
    }>;
  };
}

export interface StockTransferReceivedEvent extends InventoryEvent {
  type: 'STOCK_TRANSFER_RECEIVED';
  payload: {
    transferId: string;
    transferNumber: string;
    toWarehouseId: string;
    toLocationId: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantityReceived: number;
      varianceQuantity?: number;
      varianceReason?: string;
    }>;
    // This event triggers Core to INCREASE inventory at destination
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number; // Positive for received items
      reason: 'TRANSFER_IN';
    }>;
  };
}

// ============================================================================
// INVENTORY ADJUSTMENT EVENTS
// ============================================================================

export interface InventoryAdjustmentRequestedEvent extends InventoryEvent {
  type: 'INVENTORY_ADJUSTMENT_REQUESTED';
  payload: {
    auditId?: string;
    locationId: string;
    adjustments: Array<{
      productId: string;
      variantId?: string;
      expectedQuantity: number;
      actualQuantity: number;
      variance: number;
      reason: string;
    }>;
  };
}

export interface InventoryAdjustmentApprovedEvent extends InventoryEvent {
  type: 'INVENTORY_ADJUSTMENT_APPROVED';
  payload: {
    auditId?: string;
    approvedById: string;
    approvedByName: string;
    // This event triggers Core to apply adjustments
    inventoryDeltas: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      delta: number;
      reason: 'AUDIT_CORRECTION';
    }>;
  };
}

// ============================================================================
// REORDER EVENTS
// ============================================================================

export interface ReorderSuggestedEvent extends InventoryEvent {
  type: 'REORDER_SUGGESTED';
  payload: {
    suggestionId: string;
    productId: string;
    variantId?: string;
    locationId: string;
    currentQuantity: number;
    suggestedQuantity: number;
    suggestedSupplierId?: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    reason: string;
  };
}

// ============================================================================
// STOCK MOVEMENT EVENT
// ============================================================================

export interface StockMovementRecordedEvent extends InventoryEvent {
  type: 'STOCK_MOVEMENT_RECORDED';
  payload: {
    movementId: string;
    productId: string;
    variantId?: string;
    locationId: string;
    quantity: number;
    reason: string;
    referenceType?: string;
    referenceId?: string;
  };
}

// ============================================================================
// TRANSFER STATE MACHINE
// ============================================================================

export const TRANSFER_STATE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['IN_TRANSIT', 'CANCELLED'],
  REJECTED: [], // Terminal state
  IN_TRANSIT: ['PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['COMPLETED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = TRANSFER_STATE_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

// ============================================================================
// AUDIT STATE MACHINE
// ============================================================================

export const AUDIT_STATE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['APPROVED', 'IN_PROGRESS', 'CANCELLED'], // Can go back for recount
  APPROVED: ['ADJUSTMENTS_PENDING'],
  ADJUSTMENTS_PENDING: ['COMPLETED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export function canAuditTransitionTo(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = AUDIT_STATE_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface WarehouseResponse {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  code: string;
  description?: string;
  warehouseType: string;
  totalCapacity?: number;
  usedCapacity?: number;
  capacityUnit?: string;
  fulfillmentPriority: number;
  isActive: boolean;
  acceptsTransfersIn: boolean;
  acceptsTransfersOut: boolean;
  isDefaultForReceiving: boolean;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  lgaCode?: string;
  stateCode?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined from Core Location
  location?: {
    id: string;
    name: string;
    type: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface StockTransferResponse {
  id: string;
  tenantId: string;
  transferNumber: string;
  fromWarehouse: WarehouseResponse;
  toWarehouse: WarehouseResponse;
  status: string;
  priority: string;
  reason?: string;
  requestedDate: Date;
  approvedDate?: Date;
  shippedDate?: Date;
  expectedArrival?: Date;
  receivedDate?: Date;
  requestedByName?: string;
  approvedByName?: string;
  items: StockTransferItemResponse[];
  itemCount: number;
  totalQuantityRequested: number;
  totalQuantityShipped: number;
  totalQuantityReceived: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransferItemResponse {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  varianceQuantity?: number;
  varianceReason?: string;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: Date;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateWarehouseRequest {
  locationId: string;
  name: string;
  code: string;
  description?: string;
  warehouseType?: string;
  totalCapacity?: number;
  capacityUnit?: string;
  fulfillmentPriority?: number;
  acceptsTransfersIn?: boolean;
  acceptsTransfersOut?: boolean;
  isDefaultForReceiving?: boolean;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  lgaCode?: string;
  stateCode?: string;
}

export interface CreateStockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  reason?: string;
  expectedArrival?: Date;
  notes?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantityRequested: number;
    batchNumber?: string;
    lotNumber?: string;
    fromBinLocation?: string;
    toBinLocation?: string;
  }>;
}

export interface ShipTransferRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantityShipped: number;
  }>;
  shippingMethod?: string;
  trackingNumber?: string;
  carrierName?: string;
  shippingCost?: number;
}

export interface ReceiveTransferRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantityReceived: number;
    varianceReason?: string;
    toBinLocation?: string;
  }>;
  receivingNotes?: string;
}
