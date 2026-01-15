/**
 * INVENTORY SYNC ENGINE TYPES
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Event-driven cross-channel inventory synchronization.
 * 
 * CONSTRAINTS:
 * - NO automation or cron jobs
 * - NO background workers
 * - NO auto-reordering
 * - Manual, user-triggered operations only
 * - Demo-safe operation maintained
 */

import { ChannelType, InventoryMode, StockMovementReason } from '@prisma/client';

export type ChannelSource = ChannelType | 'PARKHUB';

export type StockEventType =
  | 'SALE'
  | 'SALE_REVERSAL'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'RECEIPT'
  | 'RETURN'
  | 'PARKHUB_BOOKING'
  | 'PARKHUB_CANCELLATION';

export interface StockEvent {
  id: string;
  tenantId: string;
  channel: ChannelSource;
  eventType: StockEventType;
  productId: string;
  variantId?: string | null;
  locationId?: string | null;
  quantity: number;
  unitPrice?: number;
  referenceType: string;
  referenceId: string;
  performedById?: string | null;
  performedByName?: string | null;
  clientTimestamp?: Date;
  serverTimestamp?: Date;
  isOffline: boolean;
  offlineEventId?: string | null;
  metadata?: Record<string, unknown>;
}

export type ConflictSeverity = 'NONE' | 'MILD' | 'SEVERE' | 'CRITICAL';

export type ConflictType =
  | 'NONE'
  | 'OVERSELL_MILD'
  | 'OVERSELL_SEVERE'
  | 'PRICE_MISMATCH_MINOR'
  | 'PRICE_MISMATCH_MAJOR'
  | 'PRODUCT_UNAVAILABLE'
  | 'CHANNEL_DISABLED'
  | 'ALLOCATION_EXCEEDED'
  | 'STALE_INVENTORY'
  | 'CAPACITY_EXCEEDED';

export interface ConflictDetails {
  type: ConflictType;
  severity: ConflictSeverity;
  productId: string;
  productName?: string;
  channel: ChannelSource;
  requestedQuantity: number;
  availableQuantity: number;
  shortage?: number;
  priceVariance?: number;
  message: string;
  suggestedResolution?: 'ACCEPT' | 'REJECT' | 'PARTIAL' | 'MANUAL_REVIEW';
  metadata?: Record<string, unknown>;
}

export interface EventProcessingResult {
  success: boolean;
  eventId: string;
  processed: boolean;
  conflict?: ConflictDetails;
  stockBefore?: number;
  stockAfter?: number;
  message: string;
  auditLogId?: string;
}

export interface ChannelStockSnapshot {
  channel: ChannelSource;
  productId: string;
  variantId?: string | null;
  inventoryMode: InventoryMode;
  totalAvailable: number;
  channelAllocated: number | null;
  channelEffectiveAvailable: number;
  reserved: number;
  pending: number;
  isActive: boolean;
  lastUpdated: Date;
}

export interface UnifiedStockView {
  productId: string;
  productName: string;
  sku: string | null;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  byChannel: ChannelStockSnapshot[];
  lastEventAt: Date | null;
  hasConflicts: boolean;
  pendingOfflineEvents: number;
}

export interface ParkHubCapacityView {
  tripId: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture: Date | null;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  reservedSeats: number;
  departureMode: string;
  status: string;
  lastBookingAt: Date | null;
}

export interface InventoryAuditEntry {
  id: string;
  tenantId: string;
  eventId: string;
  channel: ChannelSource;
  eventType: StockEventType;
  productId: string;
  variantId?: string | null;
  locationId?: string | null;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string;
  referenceId: string;
  conflictType?: ConflictType;
  conflictSeverity?: ConflictSeverity;
  resolutionAction?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: Date | null;
  isOffline: boolean;
  offlineEventId?: string | null;
  performedById?: string | null;
  performedByName?: string | null;
  createdAt: Date;
}

export interface StockReconciliationRequest {
  productId: string;
  locationId?: string;
  channel?: ChannelSource;
  expectedQuantity: number;
  actualQuantity: number;
  notes?: string;
  performedById: string;
  performedByName: string;
}

export interface ReconciliationResult {
  success: boolean;
  discrepancy: number;
  discrepancyType: 'SHORTAGE' | 'SURPLUS' | 'MATCH';
  adjustmentMade: boolean;
  auditLogId?: string;
  message: string;
}

export interface OfflineEventReplayResult {
  total: number;
  replayed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
  errors: Array<{ eventId: string; error: string }>;
}

export interface ChannelAdapter {
  channel: ChannelSource;
  processEvent(event: StockEvent): Promise<EventProcessingResult>;
  getCurrentStock(productId: string, variantId?: string | null): Promise<number>;
  reserveStock(productId: string, quantity: number, referenceId: string): Promise<boolean>;
  releaseReservation(productId: string, quantity: number, referenceId: string): Promise<boolean>;
  getChannelSnapshot(productId: string): Promise<ChannelStockSnapshot | null>;
}
