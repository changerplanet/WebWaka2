/**
 * ADVANCED WAREHOUSE SUITE — Type Definitions
 * Phase 7C.3, S3 Core Services
 */

import type {
  wh_ZoneType,
  wh_BinType,
  wh_ReceiptStatus,
  wh_PutawayStatus,
  wh_PickStatus,
  wh_MovementType,
} from '@prisma/client';

// Re-export Prisma enums for convenience
export {
  wh_ZoneType,
  wh_BinType,
  wh_ReceiptStatus,
  wh_PutawayStatus,
  wh_PickStatus,
  wh_MovementType,
};

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface TenantContext {
  tenantId: string;
  platformInstanceId: string;
  userId?: string;
  userName?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// ZONE TYPES
// =============================================================================

export interface CreateZoneInput {
  warehouseId: string;
  code: string;
  name: string;
  description?: string;
  zoneType?: wh_ZoneType;
  totalCapacity?: number;
  capacityUnit?: string;
  defaultForProductTypes?: string[];
  allowMixedProducts?: boolean;
  requiresInspection?: boolean;
}

export interface UpdateZoneInput {
  name?: string;
  description?: string;
  zoneType?: wh_ZoneType;
  totalCapacity?: number;
  capacityUnit?: string;
  defaultForProductTypes?: string[];
  allowMixedProducts?: boolean;
  requiresInspection?: boolean;
  isActive?: boolean;
}

export interface ZoneFilters {
  warehouseId?: string;
  zoneType?: wh_ZoneType;
  isActive?: boolean;
}

// =============================================================================
// BIN TYPES
// =============================================================================

export interface CreateBinInput {
  warehouseId: string;
  zoneId: string;
  code: string;
  aisle?: string;
  rack?: string;
  level?: string;
  position?: string;
  binType?: wh_BinType;
  maxWeight?: number;
  maxVolume?: number;
  maxUnits?: number;
  restrictedToProductId?: string;
  restrictedToCategory?: string;
  allowMixedBatches?: boolean;
}

export interface UpdateBinInput {
  binType?: wh_BinType;
  maxWeight?: number;
  maxVolume?: number;
  maxUnits?: number;
  restrictedToProductId?: string;
  restrictedToCategory?: string;
  allowMixedBatches?: boolean;
  isActive?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface BinFilters {
  warehouseId?: string;
  zoneId?: string;
  binType?: wh_BinType;
  isEmpty?: boolean;
  isActive?: boolean;
  isBlocked?: boolean;
}

// =============================================================================
// BATCH TYPES
// =============================================================================

export interface CreateBatchInput {
  productId: string;
  variantId?: string;
  batchNumber: string;
  lotNumber?: string;
  serialNumber?: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  supplierId?: string;
  supplierBatchRef?: string;
  purchaseOrderId?: string;
  initialQuantity: number;
  qualityStatus?: string;
  inspectionNotes?: string;
}

export interface UpdateBatchInput {
  lotNumber?: string;
  expiryDate?: Date;
  currentQuantity?: number;
  reservedQuantity?: number;
  qualityStatus?: string;
  inspectionNotes?: string;
  isActive?: boolean;
  isRecalled?: boolean;
  recallReason?: string;
}

export interface BatchFilters {
  productId?: string;
  variantId?: string;
  qualityStatus?: string;
  isExpiringSoon?: boolean; // Within 30 days
  isExpired?: boolean;
  isRecalled?: boolean;
  isActive?: boolean;
}

// =============================================================================
// RECEIPT TYPES
// =============================================================================

export interface CreateReceiptInput {
  warehouseId: string;
  referenceType?: string; // PO, TRANSFER, RETURN, MANUAL
  referenceId?: string;
  supplierId?: string;
  supplierName?: string;
  supplierRef?: string;
  expectedDate?: Date;
  requiresInspection?: boolean;
  notes?: string;
}

export interface CreateReceiptItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  expectedQuantity: number;
  unitOfMeasure?: string;
  unitsPerCase?: number;
  unitCost?: number;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface ReceiveItemInput {
  receiptItemId: string;
  receivedQuantity: number;
  damagedQuantity?: number;
  varianceReason?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface UpdateReceiptInput {
  expectedDate?: Date;
  requiresInspection?: boolean;
  notes?: string;
  internalNotes?: string;
}

export interface ReceiptFilters {
  warehouseId?: string;
  supplierId?: string;
  status?: wh_ReceiptStatus;
  referenceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// =============================================================================
// PUTAWAY TYPES
// =============================================================================

export interface CreatePutawayTaskInput {
  warehouseId: string;
  receiptId?: string;
  receiptItemId?: string;
  transferId?: string;
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  batchId?: string;
  quantity: number;
  suggestedZoneId?: string;
  suggestedBinId?: string;
  priority?: string;
  notes?: string;
}

export interface AssignPutawayInput {
  assignedToId: string;
  assignedToName: string;
}

export interface CompletePutawayInput {
  actualZoneId: string;
  actualBinId: string;
  quantityPutaway: number;
  completedById: string;
  completedByName: string;
  notes?: string;
}

export interface PutawayFilters {
  warehouseId?: string;
  receiptId?: string;
  status?: wh_PutawayStatus;
  priority?: string;
  assignedToId?: string;
}

// =============================================================================
// PICK LIST TYPES
// =============================================================================

export interface CreatePickListInput {
  warehouseId: string;
  pickType?: string; // ORDER, TRANSFER, REPLENISH
  sourceType?: string; // ORDER, TRANSFER, MANUAL
  sourceId?: string;
  priority?: string;
  notes?: string;
}

export interface CreatePickListItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  requestedQuantity: number;
  suggestedBinId?: string;
  suggestedBinCode?: string;
  suggestedBatchId?: string;
  suggestedBatchNumber?: string;
}

export interface AssignPickListInput {
  assignedToId: string;
  assignedToName: string;
}

export interface PickItemInput {
  pickListItemId: string;
  pickedQuantity: number;
  shortQuantity?: number;
  shortReason?: string;
  actualBinId?: string;
  actualBinCode?: string;
  actualBatchId?: string;
  actualBatchNumber?: string;
  pickedById: string;
  pickedByName: string;
}

export interface CompletePackingInput {
  packageCount: number;
  totalWeight?: number;
  packingNotes?: string;
}

export interface DispatchPickListInput {
  dispatchManifestId?: string;
  waybillNumber?: string;
  carrierName?: string;
}

export interface PickListFilters {
  warehouseId?: string;
  sourceType?: string;
  sourceId?: string;
  status?: wh_PickStatus;
  priority?: string;
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// =============================================================================
// MOVEMENT TYPES
// =============================================================================

export interface RecordMovementInput {
  warehouseId: string;
  movementType: wh_MovementType;
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  quantity: number; // Positive = in, Negative = out
  beforeQuantity?: number;
  afterQuantity?: number;
  fromZoneId?: string;
  fromBinId?: string;
  fromBinCode?: string;
  toZoneId?: string;
  toBinId?: string;
  toBinCode?: string;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  reasonCode?: string;
  reasonDescription?: string;
  performedById?: string;
  performedByName?: string;
  notes?: string;
}

export interface MovementFilters {
  warehouseId?: string;
  productId?: string;
  batchId?: string;
  movementType?: wh_MovementType;
  fromBinId?: string;
  toBinId?: string;
  referenceType?: string;
  referenceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// =============================================================================
// DASHBOARD / SUMMARY TYPES
// =============================================================================

export interface WarehouseSummary {
  warehouseId: string;
  warehouseName: string;
  totalZones: number;
  totalBins: number;
  occupiedBins: number;
  emptyBins: number;
  pendingReceipts: number;
  pendingPutaways: number;
  pendingPicks: number;
  expiringBatches: number; // Within 30 days
}

export interface ZoneSummary {
  zoneId: string;
  zoneName: string;
  zoneType: wh_ZoneType;
  totalBins: number;
  occupiedBins: number;
  emptyBins: number;
  blockedBins: number;
}

export interface BinContentItem {
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  quantity: number;
}
