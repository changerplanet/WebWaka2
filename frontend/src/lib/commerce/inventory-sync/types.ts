/**
 * INVENTORY SYNC TYPES
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * Types for cross-channel stock visibility, low-stock detection,
 * offline reconciliation, and traceability.
 * 
 * CONSTRAINTS:
 * - Read-only visibility (no auto-reordering)
 * - No background jobs
 * - No automation
 * - Offline-safe reconciliation support
 */

import { ChannelType, StockMovementReason } from '@prisma/client';

export interface TimeFilter {
  period: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface ChannelStockLevel {
  channel: ChannelType;
  inventoryMode: 'SHARED' | 'ALLOCATED';
  allocatedQuantity: number | null;
  effectiveAvailable: number;
  isActive: boolean;
}

export interface ProductStockView {
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  totalIncoming: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  isLowStock: boolean;
  channelBreakdown: ChannelStockLevel[];
  locationBreakdown: LocationStockLevel[];
  lastMovement: StockMovementSummary | null;
}

export interface LocationStockLevel {
  locationId: string;
  locationName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityIncoming: number;
  lastCountedAt: Date | null;
}

export interface StockMovementSummary {
  id: string;
  reason: StockMovementReason;
  quantity: number;
  channel: ChannelType | null;
  referenceType: string | null;
  referenceId: string | null;
  performedBy: string | null;
  performedByName: string | null;
  createdAt: Date;
  isOfflineCreated: boolean;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  sku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number | null;
  shortage: number;
  daysOfStockLeft: number | null;
  avgDailySales: number | null;
  channelsAffected: ChannelType[];
  severity: 'CRITICAL' | 'WARNING' | 'ATTENTION';
  lastRestocked: Date | null;
}

export interface LowStockSummary {
  tenantId: string;
  totalProducts: number;
  lowStockCount: number;
  criticalCount: number;
  warningCount: number;
  attentionCount: number;
  estimatedRevenueLoss: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    lowStockCount: number;
  }>;
}

export interface ChannelSalesRecord {
  channel: ChannelType;
  productId: string;
  productName: string;
  variantId: string | null;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  lastSaleAt: Date | null;
}

export interface ProductSalesTraceability {
  productId: string;
  productName: string;
  sku: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  channelBreakdown: ChannelSalesRecord[];
  locationBreakdown: LocationSalesRecord[];
  dailySales: DailySalesRecord[];
}

export interface LocationSalesRecord {
  locationId: string;
  locationName: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  lastSaleAt: Date | null;
  channel: ChannelType;
}

export interface DailySalesRecord {
  date: string;
  quantitySold: number;
  revenue: number;
  byChannel: Record<ChannelType, number>;
}

export interface StockReconciliationRecord {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  discrepancyType: 'SHORTAGE' | 'SURPLUS' | 'MATCH';
  source: 'OFFLINE_SYNC' | 'MANUAL_COUNT' | 'SYSTEM_AUDIT';
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'ADJUSTED';
  offlineSaleId: string | null;
  notes: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedById: string | null;
}

export interface ReconciliationSummary {
  tenantId: string;
  pendingCount: number;
  totalDiscrepancyValue: number;
  shortageCount: number;
  surplusCount: number;
  offlineSyncIssues: number;
  lastReconciliation: Date | null;
}

export interface OfflineStockEvent {
  offlineSaleId: string;
  clientSaleId: string;
  locationId: string;
  locationName: string;
  clientTimestamp: Date;
  syncedAt: Date | null;
  items: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    stockBefore: number | null;
    stockAfter: number | null;
    hasConflict: boolean;
  }>;
  hasStockConflict: boolean;
  conflictType: string | null;
}

export interface InventorySyncStatus {
  locationId: string;
  locationName: string;
  lastOnlineSync: Date | null;
  pendingOfflineSales: number;
  conflictCount: number;
  stockAccuracy: number;
}
