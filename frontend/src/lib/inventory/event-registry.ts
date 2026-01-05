/**
 * MODULE 1: Inventory & Warehouse Management
 * Event Registry - Complete documentation of all events
 * 
 * RULES:
 * - Events are module-scoped (prefixed with inventory domain)
 * - Core remains authoritative for inventory quantities
 * - All events must be idempotent (safe to replay)
 * - Events include idempotency keys for deduplication
 */

// ============================================================================
// EVENT TYPE REGISTRY
// ============================================================================

/**
 * All event types emitted by the Inventory & Warehouse Management module
 */
export const INVENTORY_EVENT_TYPES = {
  // Stock Transfer Events
  STOCK_TRANSFER_REQUESTED: 'inventory.transfer.requested',
  STOCK_TRANSFER_APPROVED: 'inventory.transfer.approved',
  STOCK_TRANSFER_REJECTED: 'inventory.transfer.rejected',
  STOCK_TRANSFER_SHIPPED: 'inventory.transfer.shipped',
  STOCK_TRANSFER_RECEIVED: 'inventory.transfer.received',
  STOCK_TRANSFER_COMPLETED: 'inventory.transfer.completed',
  STOCK_TRANSFER_CANCELLED: 'inventory.transfer.cancelled',

  // Inventory Adjustment Events
  INVENTORY_ADJUSTMENT_REQUESTED: 'inventory.adjustment.requested',
  INVENTORY_ADJUSTMENT_APPROVED: 'inventory.adjustment.approved',
  INVENTORY_ADJUSTMENT_REJECTED: 'inventory.adjustment.rejected',

  // Inventory Audit Events
  INVENTORY_AUDIT_CREATED: 'inventory.audit.created',
  INVENTORY_AUDIT_STARTED: 'inventory.audit.started',
  INVENTORY_AUDIT_COUNT_RECORDED: 'inventory.audit.count_recorded',
  INVENTORY_AUDIT_SUBMITTED: 'inventory.audit.submitted',
  INVENTORY_AUDIT_COMPLETED: 'inventory.audit.completed',
  INVENTORY_AUDIT_CANCELLED: 'inventory.audit.cancelled',

  // Reorder Events
  REORDER_RULE_CREATED: 'inventory.reorder.rule_created',
  REORDER_RULE_UPDATED: 'inventory.reorder.rule_updated',
  REORDER_SUGGESTED: 'inventory.reorder.suggested',
  REORDER_SUGGESTION_APPROVED: 'inventory.reorder.suggestion_approved',
  REORDER_SUGGESTION_REJECTED: 'inventory.reorder.suggestion_rejected',

  // Stock Movement Events
  STOCK_MOVEMENT_RECORDED: 'inventory.movement.recorded',

  // Warehouse Events
  WAREHOUSE_CREATED: 'inventory.warehouse.created',
  WAREHOUSE_UPDATED: 'inventory.warehouse.updated',
  WAREHOUSE_DEACTIVATED: 'inventory.warehouse.deactivated',

  // Low Stock Events
  LOW_STOCK_ALERT: 'inventory.alert.low_stock',
  OUT_OF_STOCK_ALERT: 'inventory.alert.out_of_stock',
  STOCK_REPLENISHED: 'inventory.alert.stock_replenished',
} as const;

export type InventoryEventType = typeof INVENTORY_EVENT_TYPES[keyof typeof INVENTORY_EVENT_TYPES];

// ============================================================================
// EVENT PAYLOAD SCHEMAS
// ============================================================================

/**
 * Base event structure
 * All events extend this
 */
export interface BaseInventoryEvent {
  /** Unique event ID (UUID) */
  eventId: string;
  
  /** Event type from INVENTORY_EVENT_TYPES */
  eventType: InventoryEventType;
  
  /** Tenant ID */
  tenantId: string;
  
  /** Timestamp when event was created */
  timestamp: string; // ISO 8601
  
  /** Event version for schema evolution */
  version: '1.0';
  
  /** Idempotency key - same key = same event (for deduplication) */
  idempotencyKey: string;
  
  /** Source of the event */
  source: {
    module: 'inventory-warehouse-management';
    service: string;
    action: string;
  };
  
  /** Actor who triggered the event */
  actor?: {
    userId: string;
    userName?: string;
    type: 'USER' | 'SYSTEM' | 'SCHEDULER';
  };
  
  /** Correlation ID for tracing related events */
  correlationId?: string;
  
  /** Causation ID - the event that caused this event */
  causationId?: string;
  
  /** Event payload */
  payload: Record<string, unknown>;
  
  /** Additional metadata */
  metadata?: {
    isOffline?: boolean;
    offlineId?: string;
    clientVersion?: string;
    environment?: string;
  };
}

// ============================================================================
// STOCK TRANSFER EVENT PAYLOADS
// ============================================================================

export interface StockTransferRequestedPayload {
  transferId: string;
  transferNumber: string;
  fromWarehouse: {
    id: string;
    name: string;
    locationId: string;
  };
  toWarehouse: {
    id: string;
    name: string;
    locationId: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    sku?: string;
    productName: string;
    quantityRequested: number;
  }>;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  reason?: string;
  totalItems: number;
  totalQuantity: number;
}

export interface StockTransferApprovedPayload {
  transferId: string;
  transferNumber: string;
  approvedBy: {
    userId: string;
    userName: string;
  };
  approvedAt: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantityApproved: number;
  }>;
}

export interface StockTransferShippedPayload {
  transferId: string;
  transferNumber: string;
  fromWarehouse: {
    id: string;
    locationId: string;
  };
  shippedAt: string;
  shippingDetails?: {
    method?: string;
    trackingNumber?: string;
    carrier?: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    quantityShipped: number;
  }>;
  /**
   * Inventory deltas for Core to apply
   * Core MUST process these to update InventoryLevel
   */
  inventoryDeltas: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    delta: number; // Negative for outbound
    reason: 'TRANSFER_OUT';
  }>;
}

export interface StockTransferReceivedPayload {
  transferId: string;
  transferNumber: string;
  toWarehouse: {
    id: string;
    locationId: string;
  };
  receivedAt: string;
  receivedBy: {
    userId: string;
    userName: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    quantityShipped: number;
    quantityReceived: number;
    variance?: number;
    varianceReason?: string;
  }>;
  /**
   * Inventory deltas for Core to apply
   * Core MUST process these to update InventoryLevel
   */
  inventoryDeltas: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    delta: number; // Positive for inbound
    reason: 'TRANSFER_IN';
  }>;
}

// ============================================================================
// INVENTORY ADJUSTMENT EVENT PAYLOADS
// ============================================================================

export interface InventoryAdjustmentRequestedPayload {
  adjustmentId?: string;
  auditId?: string;
  locationId: string;
  locationName: string;
  adjustments: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    currentQuantity: number;
    adjustedQuantity: number;
    variance: number;
    reason: string;
  }>;
  totalAdjustments: number;
  netVariance: number;
}

export interface InventoryAdjustmentApprovedPayload {
  adjustmentId?: string;
  auditId?: string;
  approvedBy: {
    userId: string;
    userName: string;
  };
  approvedAt: string;
  /**
   * Inventory deltas for Core to apply
   * Core MUST process these to update InventoryLevel
   */
  inventoryDeltas: Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    delta: number;
    reason: 'AUDIT_CORRECTION' | 'MANUAL_ADJUSTMENT';
  }>;
}

// ============================================================================
// INVENTORY AUDIT EVENT PAYLOADS
// ============================================================================

export interface InventoryAuditStartedPayload {
  auditId: string;
  auditNumber: string;
  auditType: 'FULL' | 'CYCLE' | 'SPOT' | 'ANNUAL';
  warehouse: {
    id: string;
    name: string;
    locationId: string;
  };
  totalItems: number;
  supervisor?: {
    userId: string;
    userName: string;
  };
  startedAt: string;
}

export interface InventoryAuditCompletedPayload {
  auditId: string;
  auditNumber: string;
  warehouse: {
    id: string;
    name: string;
  };
  completedAt: string;
  summary: {
    totalItemsCounted: number;
    itemsWithVariance: number;
    itemsWithPositiveVariance: number;
    itemsWithNegativeVariance: number;
    totalVarianceValue: number;
    variancePercentage: number;
    currency: string;
  };
  adjustmentsApplied: number;
  approvedBy?: {
    userId: string;
    userName: string;
  };
}

// ============================================================================
// REORDER EVENT PAYLOADS
// ============================================================================

export interface ReorderSuggestedPayload {
  suggestionId: string;
  product: {
    id: string;
    variantId?: string;
    name: string;
    sku?: string;
  };
  location: {
    id: string;
    name: string;
  };
  stockStatus: {
    currentQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    reorderPoint?: number;
  };
  suggestion: {
    quantity: number;
    estimatedCost?: number;
    currency: string;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  };
  supplier?: {
    id: string;
    name: string;
  };
  reason: string;
  ruleId?: string;
  ruleName?: string;
  expiresAt: string;
}

// ============================================================================
// STOCK MOVEMENT EVENT PAYLOAD
// ============================================================================

export interface StockMovementRecordedPayload {
  movementId: string;
  product: {
    id: string;
    variantId?: string;
    name: string;
    sku?: string;
  };
  location: {
    id: string;
    name: string;
  };
  movement: {
    quantity: number; // Positive for in, negative for out
    quantityBefore: number;
    quantityAfter: number;
    reason: string;
    referenceType?: string;
    referenceId?: string;
  };
  batch?: {
    batchNumber?: string;
    lotNumber?: string;
    expiryDate?: string;
  };
}

// ============================================================================
// LOW STOCK ALERT PAYLOAD
// ============================================================================

export interface LowStockAlertPayload {
  alerts: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    sku?: string;
    locationId: string;
    locationName: string;
    currentQuantity: number;
    reorderPoint: number;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  }>;
  summary: {
    totalAlerts: number;
    critical: number;
    high: number;
    normal: number;
    low: number;
  };
}

// ============================================================================
// IDEMPOTENCY RULES
// ============================================================================

/**
 * Idempotency key generation rules
 * These ensure events can be safely replayed without duplicate effects
 */
export const IDEMPOTENCY_RULES = {
  /**
   * Transfer events: transferId + action + timestamp (day)
   * Same transfer action on same day = same event
   */
  TRANSFER: (transferId: string, action: string) => 
    `transfer:${transferId}:${action}:${new Date().toISOString().split('T')[0]}`,

  /**
   * Audit events: auditId + action
   * Audit actions are naturally idempotent (state machine)
   */
  AUDIT: (auditId: string, action: string) => 
    `audit:${auditId}:${action}`,

  /**
   * Audit count: auditId + productId + variantId + timestamp (minute)
   * Allows recounts within same audit
   */
  AUDIT_COUNT: (auditId: string, productId: string, variantId?: string) =>
    `audit_count:${auditId}:${productId}:${variantId || 'base'}:${new Date().toISOString().slice(0, 16)}`,

  /**
   * Adjustment events: adjustmentId or auditId
   * One adjustment per audit/request
   */
  ADJUSTMENT: (id: string, type: 'audit' | 'manual') =>
    `adjustment:${type}:${id}`,

  /**
   * Stock movement: offlineId or generated UUID
   * Offline movements use client ID for deduplication
   */
  MOVEMENT: (offlineId?: string) =>
    offlineId || `movement:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Reorder suggestion: ruleId + productId + locationId + date
   * One suggestion per product/location/day per rule
   */
  REORDER_SUGGESTION: (ruleId: string, productId: string, locationId: string) =>
    `reorder:${ruleId}:${productId}:${locationId}:${new Date().toISOString().split('T')[0]}`,

  /**
   * Low stock alert: productId + locationId + date
   * One alert per product/location per day
   */
  LOW_STOCK_ALERT: (productId: string, locationId: string) =>
    `low_stock:${productId}:${locationId}:${new Date().toISOString().split('T')[0]}`,
};

// ============================================================================
// EVENT HANDLERS REGISTRY
// Documents which systems should handle each event
// ============================================================================

export const EVENT_HANDLERS = {
  // Core inventory system handles these (applies to InventoryLevel)
  CORE_INVENTORY: [
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_SHIPPED,
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_RECEIVED,
    INVENTORY_EVENT_TYPES.INVENTORY_ADJUSTMENT_APPROVED,
  ],

  // Notification system handles these
  NOTIFICATIONS: [
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_REQUESTED,
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_APPROVED,
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_REJECTED,
    INVENTORY_EVENT_TYPES.INVENTORY_AUDIT_COMPLETED,
    INVENTORY_EVENT_TYPES.REORDER_SUGGESTED,
    INVENTORY_EVENT_TYPES.LOW_STOCK_ALERT,
    INVENTORY_EVENT_TYPES.OUT_OF_STOCK_ALERT,
  ],

  // Analytics/reporting handles these
  ANALYTICS: [
    INVENTORY_EVENT_TYPES.STOCK_MOVEMENT_RECORDED,
    INVENTORY_EVENT_TYPES.INVENTORY_AUDIT_COMPLETED,
    INVENTORY_EVENT_TYPES.STOCK_TRANSFER_COMPLETED,
  ],

  // Audit log handles ALL events
  AUDIT_LOG: Object.values(INVENTORY_EVENT_TYPES),
};

// ============================================================================
// EVENT VALIDATION
// ============================================================================

/**
 * Validate event structure
 */
export function validateEvent(event: BaseInventoryEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event.eventId) errors.push('eventId is required');
  if (!event.eventType) errors.push('eventType is required');
  if (!event.tenantId) errors.push('tenantId is required');
  if (!event.timestamp) errors.push('timestamp is required');
  if (!event.idempotencyKey) errors.push('idempotencyKey is required');
  if (!event.source?.module) errors.push('source.module is required');
  if (!event.payload) errors.push('payload is required');

  // Validate event type is known
  if (event.eventType && !Object.values(INVENTORY_EVENT_TYPES).includes(event.eventType)) {
    errors.push(`Unknown eventType: ${event.eventType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if event has been processed (idempotency check)
 * In production, this would check a persistent store
 */
const processedEvents = new Set<string>();

export function isEventProcessed(idempotencyKey: string): boolean {
  return processedEvents.has(idempotencyKey);
}

export function markEventProcessed(idempotencyKey: string): void {
  processedEvents.add(idempotencyKey);
}
