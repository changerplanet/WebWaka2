/**
 * MODULE 1: Inventory & Warehouse Management
 * Main export file
 */

// Types and contracts
export * from './types';

// Event registry and schemas
export {
  INVENTORY_EVENT_TYPES,
  IDEMPOTENCY_RULES,
  EVENT_HANDLERS,
  validateEvent,
  isEventProcessed,
  markEventProcessed,
} from './event-registry';
export type {
  BaseInventoryEvent,
  InventoryEventType,
  StockTransferRequestedPayload,
  StockTransferShippedPayload,
  StockTransferReceivedPayload,
  InventoryAdjustmentApprovedPayload,
  InventoryAuditStartedPayload,
  InventoryAuditCompletedPayload,
  ReorderSuggestedPayload,
  StockMovementRecordedPayload,
  LowStockAlertPayload,
} from './event-registry';

// Event service
export {
  subscribeToEvent,
  publishEvent,
  InventoryEventFactory,
} from './event-service';

// Legacy event emitter (for backward compatibility)
export * from './event-emitter';

// Services
export { WarehouseService } from './warehouse-service';
export { StockTransferService } from './transfer-service';
export { ReorderRuleService, ReorderSuggestionEngine } from './reorder-service';
export { InventoryAuditService } from './audit-service';

// Entitlements
export {
  InventoryEntitlementsService,
  INVENTORY_ENTITLEMENTS,
  DEFAULT_ENTITLEMENTS,
} from './entitlements-service';
export type {
  InventoryEntitlement,
  EntitlementCheckResult,
  TenantEntitlements,
} from './entitlements-service';

// Offline sync
export {
  OfflineSyncService,
  createOfflineAction,
  generateOfflineId,
  getPendingActions,
  getAllActions,
  getConflicts,
  OFFLINE_SAFE_ACTIONS,
  CONFLICT_RESOLUTION_STRATEGIES,
} from './offline-sync-service';
export type {
  OfflineAction,
  OfflineActionType,
  SyncStatus,
  SyncResult,
  SyncBatchResult,
  ConflictResolution,
} from './offline-sync-service';
