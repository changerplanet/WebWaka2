/**
 * INVENTORY SYNC MODULE
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * Exports for cross-channel stock visibility, low-stock detection,
 * and traceability services.
 * 
 * CONSTRAINTS:
 * - Read-only visibility (no auto-reordering)
 * - No background jobs
 * - No automation
 * - Offline-safe reconciliation support
 */

export * from './types';
export { InventorySyncService, createInventorySyncService } from './inventory-sync-service';
export { LowStockService, createLowStockService } from './low-stock-service';
export { StockTraceabilityService, createStockTraceabilityService } from './traceability-service';
