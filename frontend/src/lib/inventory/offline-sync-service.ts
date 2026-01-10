/**
 * MODULE 1: Inventory & Warehouse Management
 * Offline Sync Service - Handles offline operations and sync
 * 
 * RULES:
 * - Audits can be performed offline
 * - Transfers can be queued offline
 * - Reorder suggestions cached offline
 * - Sync must be idempotent (safe to retry)
 * - Offline actions never overwrite Core blindly
 * 
 * CONFLICT RESOLUTION:
 * - Last-write-wins for non-critical data (notes, metadata)
 * - Server-wins for inventory quantities (Core is authoritative)
 * - Merge for audit counts (preserve all counts, flag conflicts)
 */

import { prisma } from '../prisma';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export type OfflineActionType =
  | 'TRANSFER_CREATE'
  | 'TRANSFER_SUBMIT'
  | 'TRANSFER_SHIP'
  | 'TRANSFER_RECEIVE'
  | 'AUDIT_CREATE'
  | 'AUDIT_START'
  | 'AUDIT_COUNT'
  | 'AUDIT_SUBMIT'
  | 'STOCK_MOVEMENT'
  | 'REORDER_SUGGESTION_ACTION';

export type SyncStatus =
  | 'PENDING'      // Waiting to sync
  | 'SYNCING'      // Currently syncing
  | 'SYNCED'       // Successfully synced
  | 'CONFLICT'     // Sync conflict detected
  | 'FAILED'       // Sync failed (retryable)
  | 'REJECTED';    // Sync rejected (not retryable)

export interface OfflineAction {
  id: string;                    // Client-generated UUID
  tenantId: string;
  userId: string;
  userName?: string;
  actionType: OfflineActionType;
  entityType: string;            // 'transfer', 'audit', 'movement'
  entityId?: string;             // Server ID if known
  offlineEntityId: string;       // Client ID for new entities
  payload: Record<string, unknown>;
  createdAt: Date;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  syncError?: string;
  serverResponse?: Record<string, unknown>;
  conflictData?: Record<string, unknown>;
}

export interface SyncResult {
  actionId: string;
  success: boolean;
  status: SyncStatus;
  serverId?: string;
  error?: string;
  conflictData?: Record<string, unknown>;
}

export interface SyncBatchResult {
  totalActions: number;
  synced: number;
  failed: number;
  conflicts: number;
  rejected: number;
  results: SyncResult[];
}

export interface ConflictResolution {
  actionId: string;
  resolution: 'USE_LOCAL' | 'USE_SERVER' | 'MERGE';
  mergedData?: Record<string, unknown>;
}

// ============================================================================
// OFFLINE QUEUE (In-memory - in production, use IndexedDB on client)
// This server-side implementation is for processing queued offline actions
// ============================================================================

const offlineQueue: Map<string, OfflineAction> = new Map();

/**
 * Generate a client-side offline ID
 */
export function generateOfflineId(): string {
  return `offline_${uuidv4()}`;
}

/**
 * Create an offline action
 */
export function createOfflineAction(
  tenantId: string,
  userId: string,
  actionType: OfflineActionType,
  entityType: string,
  payload: Record<string, unknown>,
  userName?: string,
  existingEntityId?: string
): OfflineAction {
  const action: OfflineAction = {
    id: uuidv4(),
    tenantId,
    userId,
    userName,
    actionType,
    entityType,
    entityId: existingEntityId,
    offlineEntityId: generateOfflineId(),
    payload,
    createdAt: new Date(),
    syncStatus: 'PENDING',
    syncAttempts: 0,
  };

  offlineQueue.set(action.id, action);
  return action;
}

/**
 * Get pending offline actions for a tenant
 */
export function getPendingActions(tenantId: string): OfflineAction[] {
  return Array.from(offlineQueue.values())
    .filter(a => a.tenantId === tenantId && a.syncStatus === 'PENDING')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Get all offline actions for a tenant
 */
export function getAllActions(tenantId: string): OfflineAction[] {
  return Array.from(offlineQueue.values())
    .filter(a => a.tenantId === tenantId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Get conflicts for a tenant
 */
export function getConflicts(tenantId: string): OfflineAction[] {
  return Array.from(offlineQueue.values())
    .filter(a => a.tenantId === tenantId && a.syncStatus === 'CONFLICT');
}

// ============================================================================
// SYNC SERVICE
// ============================================================================

export class OfflineSyncService {
  /**
   * Process a batch of offline actions
   * Actions are processed in order (FIFO)
   */
  static async syncBatch(
    tenantId: string,
    actions: OfflineAction[]
  ): Promise<SyncBatchResult> {
    const results: SyncResult[] = [];
    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    let rejected = 0;

    for (const action of actions) {
      // Skip if already synced or rejected
      if (action.syncStatus === 'SYNCED' || action.syncStatus === 'REJECTED') {
        continue;
      }

      // Update status to syncing
      action.syncStatus = 'SYNCING';
      action.syncAttempts++;
      action.lastSyncAttempt = new Date();

      try {
        const result = await this.processAction(tenantId, action);
        results.push(result);

        // Update action based on result
        action.syncStatus = result.status;
        action.serverResponse = result.serverId ? { serverId: result.serverId } : undefined;
        action.syncError = result.error;
        action.conflictData = result.conflictData;

        switch (result.status) {
          case 'SYNCED':
            synced++;
            break;
          case 'CONFLICT':
            conflicts++;
            break;
          case 'REJECTED':
            rejected++;
            break;
          case 'FAILED':
            failed++;
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          actionId: action.id,
          success: false,
          status: 'FAILED',
          error: errorMessage,
        });
        action.syncStatus = 'FAILED';
        action.syncError = errorMessage;
        failed++;
      }
    }

    return {
      totalActions: actions.length,
      synced,
      failed,
      conflicts,
      rejected,
      results,
    };
  }

  /**
   * Process a single offline action
   */
  private static async processAction(
    tenantId: string,
    action: OfflineAction
  ): Promise<SyncResult> {
    // Check idempotency - has this action already been processed?
    const idempotencyKey = `${action.id}_${action.actionType}`;
    
    switch (action.actionType) {
      case 'TRANSFER_CREATE':
        return this.syncTransferCreate(tenantId, action, idempotencyKey);
      case 'TRANSFER_SHIP':
        return this.syncTransferShip(tenantId, action, idempotencyKey);
      case 'TRANSFER_RECEIVE':
        return this.syncTransferReceive(tenantId, action, idempotencyKey);
      case 'AUDIT_CREATE':
        return this.syncAuditCreate(tenantId, action, idempotencyKey);
      case 'AUDIT_COUNT':
        return this.syncAuditCount(tenantId, action, idempotencyKey);
      case 'STOCK_MOVEMENT':
        return this.syncStockMovement(tenantId, action, idempotencyKey);
      default:
        return {
          actionId: action.id,
          success: false,
          status: 'REJECTED',
          error: `Unknown action type: ${action.actionType}`,
        };
    }
  }

  /**
   * Sync transfer creation
   */
  private static async syncTransferCreate(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    // Check if already synced (idempotency)
    const existing = await prisma.inv_stock_transfers.findFirst({
      where: {
        tenantId,
        offlineId: action.offlineEntityId,
      },
    });

    if (existing) {
      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: existing.id,
      };
    }

    // Create transfer
    const payload = action.payload as {
      fromWarehouseId: string;
      toWarehouseId: string;
      items: Array<{
        productId: string;
        variantId?: string;
        quantityRequested: number;
      }>;
      priority?: string;
      reason?: string;
    };

    try {
      // Generate transfer number
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await prisma.inv_stock_transfers.count({
        where: { tenantId },
      });
      const transferNumber = `TRF-${year}${month}-${String(count + 1).padStart(4, '0')}`;

      // Validate warehouses
      const [fromWh, toWh] = await Promise.all([
        prisma.inv_warehouses.findFirst({ where: { id: payload.fromWarehouseId, tenantId } }),
        prisma.inv_warehouses.findFirst({ where: { id: payload.toWarehouseId, tenantId } }),
      ]);

      if (!fromWh || !toWh) {
        return {
          actionId: action.id,
          success: false,
          status: 'REJECTED',
          error: 'Source or destination warehouse not found',
        };
      }

      // Get product details
      const productIds = payload.items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      const transfer = await prisma.inv_stock_transfers.create({
        data: {
          tenantId,
          transferNumber,
          fromWarehouseId: payload.fromWarehouseId,
          toWarehouseId: payload.toWarehouseId,
          status: 'DRAFT',
          priority: payload.priority || 'NORMAL',
          reason: payload.reason,
          requestedById: action.userId,
          requestedByName: action.userName,
          isOfflineCreated: true,
          offlineId: action.offlineEntityId,
          syncedAt: new Date(),
          items: {
            create: payload.items.map(item => {
              const product = productMap.get(item.productId);
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: product?.name || 'Unknown Product',
                sku: product?.sku,
                quantityRequested: item.quantityRequested,
              };
            }),
          },
        },
      });

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: transfer.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      };
    }
  }

  /**
   * Sync transfer ship action
   */
  private static async syncTransferShip(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    const payload = action.payload as {
      transferId: string;
      items: Array<{
        productId: string;
        variantId?: string;
        quantityShipped: number;
      }>;
    };

    // Get transfer
    const transfer = await prisma.inv_stock_transfers.findFirst({
      where: {
        OR: [
          { id: payload.transferId },
          { offlineId: payload.transferId },
        ],
        tenantId,
      },
      include: { inv_stock_transfer_items: true },
    });

    if (!transfer) {
      return {
        actionId: action.id,
        success: false,
        status: 'REJECTED',
        error: 'Transfer not found',
      };
    }

    // Check if already shipped (idempotency)
    if (transfer.status === 'IN_TRANSIT' || transfer.status === 'COMPLETED') {
      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: transfer.id,
      };
    }

    // Check for conflicts - transfer status changed server-side
    if (transfer.status !== 'APPROVED' && transfer.status !== 'DRAFT') {
      return {
        actionId: action.id,
        success: false,
        status: 'CONFLICT',
        conflictData: {
          expectedStatus: 'APPROVED',
          actualStatus: transfer.status,
          message: 'Transfer status has changed on server',
        },
      };
    }

    // Apply ship action
    try {
      for (const shipItem of payload.items) {
        const item = transfer.inv_stock_transfer_items.find(
          i => i.productId === shipItem.productId &&
               (i.variantId || null) === (shipItem.variantId || null)
        );

        if (item) {
          await prisma.inv_stock_transfer_items.update({
            where: { id: item.id },
            data: { quantityShipped: shipItem.quantityShipped },
          });
        }
      }

      await prisma.inv_stock_transfers.update({
        where: { id: transfer.id },
        data: {
          status: 'IN_TRANSIT',
          shippedDate: new Date(),
        },
      });

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: transfer.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to ship transfer',
      };
    }
  }

  /**
   * Sync transfer receive action
   */
  private static async syncTransferReceive(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    const payload = action.payload as {
      transferId: string;
      items: Array<{
        productId: string;
        variantId?: string;
        quantityReceived: number;
        varianceReason?: string;
      }>;
    };

    const transfer = await prisma.inv_stock_transfers.findFirst({
      where: {
        OR: [
          { id: payload.transferId },
          { offlineId: payload.transferId },
        ],
        tenantId,
      },
      include: { inv_stock_transfer_items: true },
    });

    if (!transfer) {
      return {
        actionId: action.id,
        success: false,
        status: 'REJECTED',
        error: 'Transfer not found',
      };
    }

    // Check if already completed (idempotency)
    if (transfer.status === 'COMPLETED') {
      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: transfer.id,
      };
    }

    // Check for conflicts
    if (transfer.status !== 'IN_TRANSIT') {
      return {
        actionId: action.id,
        success: false,
        status: 'CONFLICT',
        conflictData: {
          expectedStatus: 'IN_TRANSIT',
          actualStatus: transfer.status,
          message: 'Transfer status has changed on server',
        },
      };
    }

    try {
      for (const receiveItem of payload.items) {
        const item = transfer.inv_stock_transfer_items.find(
          i => i.productId === receiveItem.productId &&
               (i.variantId || null) === (receiveItem.variantId || null)
        );

        if (item) {
          const variance = receiveItem.quantityReceived - item.quantityShipped;
          await prisma.inv_stock_transfer_items.update({
            where: { id: item.id },
            data: {
              quantityReceived: receiveItem.quantityReceived,
              varianceQuantity: variance !== 0 ? variance : null,
              varianceReason: variance !== 0 ? receiveItem.varianceReason : null,
            },
          });
        }
      }

      await prisma.inv_stock_transfers.update({
        where: { id: transfer.id },
        data: {
          status: 'COMPLETED',
          receivedDate: new Date(),
          receivedById: action.userId,
          receivedByName: action.userName,
        },
      });

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: transfer.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to receive transfer',
      };
    }
  }

  /**
   * Sync audit creation
   */
  private static async syncAuditCreate(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    // Check idempotency
    const existing = await prisma.inv_audits.findFirst({
      where: {
        tenantId,
        offlineId: action.offlineEntityId,
      },
    });

    if (existing) {
      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: existing.id,
      };
    }

    const payload = action.payload as {
      warehouseId: string;
      auditType?: string;
      items: Array<{
        productId: string;
        variantId?: string;
        expectedQuantity: number;
      }>;
    };

    try {
      // Generate audit number
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await prisma.inv_audits.count({ where: { tenantId } });
      const auditNumber = `AUD-${year}${month}-${String(count + 1).padStart(4, '0')}`;

      // Get product details
      const productIds = payload.items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      const audit = await prisma.inv_audits.create({
        data: {
          tenantId,
          auditNumber,
          warehouseId: payload.warehouseId,
          auditType: payload.auditType || 'SPOT',
          status: 'DRAFT',
          createdById: action.userId,
          createdByName: action.userName,
          isOfflineCreated: true,
          offlineId: action.offlineEntityId,
          syncedAt: new Date(),
          items: {
            create: payload.items.map(item => {
              const product = productMap.get(item.productId);
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: product?.name || 'Unknown Product',
                sku: product?.sku,
                expectedQuantity: item.expectedQuantity,
              };
            }),
          },
        },
      });

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: audit.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to create audit',
      };
    }
  }

  /**
   * Sync audit count entries
   */
  private static async syncAuditCount(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    const payload = action.payload as {
      auditId: string;
      counts: Array<{
        productId: string;
        variantId?: string;
        countedQuantity: number;
        notes?: string;
      }>;
    };

    const audit = await prisma.inv_audits.findFirst({
      where: {
        OR: [
          { id: payload.auditId },
          { offlineId: payload.auditId },
        ],
        tenantId,
      },
      include: { inv_audit_items: true },
    });

    if (!audit) {
      return {
        actionId: action.id,
        success: false,
        status: 'REJECTED',
        error: 'Audit not found',
      };
    }

    // Check for conflicts - audit might have been completed or cancelled
    if (audit.status === 'COMPLETED' || audit.status === 'CANCELLED') {
      return {
        actionId: action.id,
        success: false,
        status: 'CONFLICT',
        conflictData: {
          actualStatus: audit.status,
          message: 'Audit has been completed or cancelled',
        },
      };
    }

    try {
      // Merge counts - if server has a more recent count, flag conflict
      const conflicts: Array<{ productId: string; serverCount: number; offlineCount: number }> = [];

      for (const count of payload.counts) {
        const item = audit.inv_audit_items.find(
          i => i.productId === count.productId &&
               (i.variantId || null) === (count.variantId || null)
        );

        if (item) {
          // Check if server has a more recent count
          if (item.countedAt && item.countedAt > action.createdAt) {
            // Server count is newer - conflict
            conflicts.push({
              productId: count.productId,
              serverCount: item.countedQuantity || 0,
              offlineCount: count.countedQuantity,
            });
          } else {
            // Apply offline count
            const variance = count.countedQuantity - item.expectedQuantity;
            await prisma.inv_audit_items.update({
              where: { id: item.id },
              data: {
                countedQuantity: count.countedQuantity,
                varianceQuantity: variance,
                varianceReason: variance !== 0 ? (count.notes || 'UNCATEGORIZED') : null,
                countedById: action.userId,
                countedByName: action.userName,
                countedAt: action.createdAt, // Use offline timestamp
                notes: count.notes,
              },
            });
          }
        }
      }

      if (conflicts.length > 0) {
        return {
          actionId: action.id,
          success: false,
          status: 'CONFLICT',
          conflictData: {
            message: 'Some counts have newer server values',
            conflicts,
          },
        };
      }

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: audit.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to sync counts',
      };
    }
  }

  /**
   * Sync stock movement
   */
  private static async syncStockMovement(
    tenantId: string,
    action: OfflineAction,
    idempotencyKey: string
  ): Promise<SyncResult> {
    const payload = action.payload as {
      productId: string;
      variantId?: string;
      locationId: string;
      reason: string;
      quantity: number;
      notes?: string;
    };

    // Check idempotency
    const existing = await prisma.wh_stock_movement.findFirst({
      where: {
        tenantId,
        offlineId: action.offlineEntityId,
      },
    });

    if (existing) {
      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: existing.id,
      };
    }

    try {
      // Get current inventory level
      const inventory = await prisma.inventoryLevel.findFirst({
        where: {
          tenantId,
          productId: payload.productId,
          variantId: payload.variantId || null,
          locationId: payload.locationId,
        },
      });

      const quantityBefore = inventory?.quantityOnHand || 0;

      const movement = await prisma.wh_stock_movement.create({
        data: {
          tenantId,
          productId: payload.productId,
          variantId: payload.variantId,
          locationId: payload.locationId,
          reason: payload.reason as any,
          quantity: payload.quantity,
          quantityBefore,
          notes: payload.notes,
          performedBy: action.userId,
          performedByName: action.userName,
          isOfflineCreated: true,
          offlineId: action.offlineEntityId,
          syncedAt: new Date(),
        },
      });

      return {
        actionId: action.id,
        success: true,
        status: 'SYNCED',
        serverId: movement.id,
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Failed to sync movement',
      };
    }
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    tenantId: string,
    resolution: ConflictResolution
  ): Promise<SyncResult> {
    const action = offlineQueue.get(resolution.actionId);

    if (!action || action.tenantId !== tenantId) {
      return {
        actionId: resolution.actionId,
        success: false,
        status: 'REJECTED',
        error: 'Action not found',
      };
    }

    if (action.syncStatus !== 'CONFLICT') {
      return {
        actionId: resolution.actionId,
        success: false,
        status: 'REJECTED',
        error: 'Action is not in conflict state',
      };
    }

    switch (resolution.resolution) {
      case 'USE_SERVER':
        // Discard offline action
        action.syncStatus = 'SYNCED';
        return {
          actionId: resolution.actionId,
          success: true,
          status: 'SYNCED',
        };

      case 'USE_LOCAL':
        // Force apply offline action
        action.syncStatus = 'PENDING';
        // Re-process with force flag
        return this.processAction(tenantId, action);

      case 'MERGE':
        // Apply merged data
        if (resolution.mergedData) {
          action.payload = { ...action.payload, ...resolution.mergedData };
        }
        action.syncStatus = 'PENDING';
        return this.processAction(tenantId, action);

      default:
        return {
          actionId: resolution.actionId,
          success: false,
          status: 'REJECTED',
          error: 'Invalid resolution type',
        };
    }
  }

  /**
   * Clear synced actions older than specified days
   */
  static clearOldActions(tenantId: string, daysOld: number = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    let cleared = 0;
    for (const [id, action] of offlineQueue) {
      if (
        action.tenantId === tenantId &&
        action.syncStatus === 'SYNCED' &&
        action.createdAt < cutoff
      ) {
        offlineQueue.delete(id);
        cleared++;
      }
    }

    return cleared;
  }
}

// ============================================================================
// OFFLINE-SAFE ACTION LIST
// Documents which actions are safe to perform offline
// ============================================================================

export const OFFLINE_SAFE_ACTIONS = {
  // Transfers
  TRANSFER_CREATE: {
    safe: true,
    description: 'Create draft transfers offline',
    conflictStrategy: 'Server wins on transfer number, client data preserved',
  },
  TRANSFER_SUBMIT: {
    safe: false,
    description: 'Requires server validation of inventory levels',
    conflictStrategy: 'N/A - must be online',
  },
  TRANSFER_SHIP: {
    safe: true,
    description: 'Record shipping offline, sync when online',
    conflictStrategy: 'Conflict if status changed on server',
  },
  TRANSFER_RECEIVE: {
    safe: true,
    description: 'Record receiving offline, sync when online',
    conflictStrategy: 'Conflict if status changed on server',
  },

  // Audits
  AUDIT_CREATE: {
    safe: true,
    description: 'Create audit with expected quantities from cache',
    conflictStrategy: 'Server expected quantities used on sync',
  },
  AUDIT_START: {
    safe: true,
    description: 'Start audit offline',
    conflictStrategy: 'Conflict if already started on server',
  },
  AUDIT_COUNT: {
    safe: true,
    description: 'Record counts offline - primary offline use case',
    conflictStrategy: 'Last-write-wins, conflicts flagged if server newer',
  },
  AUDIT_SUBMIT: {
    safe: false,
    description: 'Requires server calculation of variances',
    conflictStrategy: 'N/A - must be online',
  },
  AUDIT_APPROVE: {
    safe: false,
    description: 'Requires server to apply adjustments to Core',
    conflictStrategy: 'N/A - must be online',
  },

  // Stock Movements
  STOCK_MOVEMENT: {
    safe: true,
    description: 'Record movements offline for audit trail',
    conflictStrategy: 'Idempotent - duplicate ignored',
  },

  // Reorder Suggestions
  SUGGESTION_VIEW: {
    safe: true,
    description: 'View cached suggestions offline',
    conflictStrategy: 'Stale data warning shown',
  },
  SUGGESTION_APPROVE: {
    safe: false,
    description: 'Requires server validation',
    conflictStrategy: 'N/A - must be online',
  },
};

// ============================================================================
// CONFLICT RESOLUTION STRATEGIES
// ============================================================================

export const CONFLICT_RESOLUTION_STRATEGIES = {
  /**
   * Server wins for inventory quantities
   * Core InventoryLevel is always authoritative
   */
  INVENTORY_QUANTITIES: 'SERVER_WINS',

  /**
   * Last-write-wins for non-critical data
   * Notes, metadata, etc.
   */
  NON_CRITICAL_DATA: 'LAST_WRITE_WINS',

  /**
   * Merge for audit counts
   * Preserve all counts, flag conflicts for review
   */
  AUDIT_COUNTS: 'MERGE_WITH_CONFLICT_FLAG',

  /**
   * Reject if state changed
   * Transfer/audit status changes require conflict resolution
   */
  STATE_CHANGES: 'REJECT_IF_STATE_CHANGED',
};
