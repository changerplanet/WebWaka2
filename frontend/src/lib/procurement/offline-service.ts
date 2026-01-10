/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Offline Service - Offline support for procurement
 * 
 * PHASE 6: Offline Behavior
 * 
 * Offline-safe actions:
 * - Purchase requests (create)
 * - Goods receipt (record)
 * 
 * Requires online:
 * - PO confirmation
 * - Price list updates
 * - Performance calculations
 * 
 * Sync rules:
 * - Idempotent with offlineId
 * - Timestamp-based conflict resolution
 * - No duplicate receipts or POs
 */

import { prisma } from '@/lib/prisma'
import { PurchaseRequestService, PurchaseRequestInput } from './purchase-request-service'
import { GoodsReceiptService, GoodsReceiptInput } from './goods-receipt-service'

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineDataPackage {
  suppliers: Array<{
    id: string
    name: string
    phone: string | null
    contactName: string | null
  }>
  products: Array<{
    id: string
    sku: string | null
    name: string
  }>
  pendingPOs: Array<{
    id: string
    poNumber: string
    supplierId: string
    supplierName: string
    status: string
    items: Array<{
      id: string
      productId: string
      productName: string
      orderedQuantity: number
      receivedQuantity: number
      pendingQuantity: number
    }>
  }>
  config: {
    defaultCurrency: string
    allowCashPurchases: boolean
    requireReceiptPhotos: boolean
  } | null
  syncedAt: Date
}

export interface OfflineSyncInput {
  purchaseRequests?: Array<PurchaseRequestInput & { offlineId: string }>
  goodsReceipts?: Array<GoodsReceiptInput & { offlineId: string }>
  lastSyncAt?: Date
}

export interface SyncResult {
  purchaseRequests: {
    synced: number
    duplicates: number
    errors: Array<{ offlineId: string; error: string }>
  }
  goodsReceipts: {
    synced: number
    duplicates: number
    errors: Array<{ offlineId: string; error: string }>
  }
  syncedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class OfflineProcurementService {
  /**
   * Get offline data package for mobile/offline use
   */
  static async getOfflinePackage(tenantId: string): Promise<OfflineDataPackage> {
    const [suppliers, products, pendingPOs, config] = await Promise.all([
      // Get active suppliers
      prisma.supplier.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          phone: true,
          contactName: true,
        },
        orderBy: { name: 'asc' },
        take: 500,
      }),

      // Get active products (basic info only)
      prisma.product.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          sku: true,
          name: true,
        },
        orderBy: { name: 'asc' },
        take: 1000,
      }),

      // Get pending POs for goods receipt
      prisma.proc_purchase_orders.findMany({
        where: {
          tenantId,
          status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
        },
        select: {
          id: true,
          poNumber: true,
          supplierId: true,
          supplierName: true,
          status: true,
          bill_invoice_items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              orderedQuantity: true,
              receivedQuantity: true,
              pendingQuantity: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        take: 100,
      }),

      // Get config
      prisma.proc_configurations.findUnique({
        where: { tenantId },
        select: {
          defaultCurrency: true,
          allowCashPurchases: true,
          requireReceiptPhotos: true,
        },
      }),
    ])

    return {
      suppliers,
      products,
      pendingPOs: pendingPOs.map(po => ({
        ...po,
        items: po.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: Number(item.orderedQuantity),
          receivedQuantity: Number(item.receivedQuantity),
          pendingQuantity: Number(item.pendingQuantity),
        })),
      })),
      config,
      syncedAt: new Date(),
    }
  }

  /**
   * Sync offline changes
   */
  static async syncOfflineChanges(
    tenantId: string,
    input: OfflineSyncInput
  ): Promise<SyncResult> {
    const result: SyncResult = {
      purchaseRequests: { synced: 0, duplicates: 0, errors: [] },
      goodsReceipts: { synced: 0, duplicates: 0, errors: [] },
      syncedAt: new Date(),
    }

    // Sync purchase requests
    if (input.purchaseRequests) {
      for (const pr of input.purchaseRequests) {
        try {
          // Check for existing by offlineId
          const existing = await prisma.proc_purchase_requests.findUnique({
            where: { tenantId_offlineId: { tenantId, offlineId: pr.offlineId } },
          })

          if (existing) {
            result.purchaseRequests.duplicates++
            continue
          }

          await PurchaseRequestService.createPurchaseRequest(tenantId, pr)
          result.purchaseRequests.synced++
        } catch (error) {
          result.purchaseRequests.errors.push({
            offlineId: pr.offlineId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    // Sync goods receipts
    if (input.goodsReceipts) {
      for (const gr of input.goodsReceipts) {
        try {
          // Check for existing by offlineId
          const existing = await prisma.proc_goods_receipts.findUnique({
            where: { tenantId_offlineId: { tenantId, offlineId: gr.offlineId } },
          })

          if (existing) {
            result.goodsReceipts.duplicates++
            continue
          }

          await GoodsReceiptService.createGoodsReceipt(tenantId, gr)
          result.goodsReceipts.synced++
        } catch (error) {
          result.goodsReceipts.errors.push({
            offlineId: gr.offlineId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return result
  }

  /**
   * Get changes since last sync
   */
  static async getChangesSince(tenantId: string, lastSyncAt: Date) {
    const [newPRs, updatedPRs, newPOs, updatedPOs, newReceipts] = await Promise.all([
      // New purchase requests
      prisma.proc_purchase_requests.findMany({
        where: { tenantId, createdAt: { gt: lastSyncAt } },
        include: { bill_invoice_items: true },
        orderBy: { createdAt: 'desc' },
      }),

      // Updated purchase requests
      prisma.proc_purchase_requests.findMany({
        where: {
          tenantId,
          createdAt: { lte: lastSyncAt },
          updatedAt: { gt: lastSyncAt },
        },
        include: { bill_invoice_items: true },
        orderBy: { updatedAt: 'desc' },
      }),

      // New POs
      prisma.proc_purchase_orders.findMany({
        where: { tenantId, createdAt: { gt: lastSyncAt } },
        include: { bill_invoice_items: true },
        orderBy: { createdAt: 'desc' },
      }),

      // Updated POs
      prisma.proc_purchase_orders.findMany({
        where: {
          tenantId,
          createdAt: { lte: lastSyncAt },
          updatedAt: { gt: lastSyncAt },
        },
        include: { bill_invoice_items: true },
        orderBy: { updatedAt: 'desc' },
      }),

      // New goods receipts
      prisma.proc_goods_receipts.findMany({
        where: { tenantId, createdAt: { gt: lastSyncAt } },
        include: { bill_invoice_items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      purchaseRequests: {
        new: newPRs.length,
        updated: updatedPRs.length,
        items: [...newPRs, ...updatedPRs],
      },
      purchaseOrders: {
        new: newPOs.length,
        updated: updatedPOs.length,
        items: [...newPOs, ...updatedPOs],
      },
      goodsReceipts: {
        new: newReceipts.length,
        items: newReceipts,
      },
      lastSyncAt,
      currentSyncAt: new Date(),
    }
  }

  /**
   * Resolve sync conflicts
   * Uses timestamp + status precedence for conflict resolution
   */
  static resolveConflict<T extends { updatedAt: Date; status?: string }>(
    localRecord: T,
    serverRecord: T,
    statusPrecedence: string[] = []
  ): 'local' | 'server' {
    // If status precedence is defined, use it
    if (localRecord.status && serverRecord.status && statusPrecedence.length > 0) {
      const localIndex = statusPrecedence.indexOf(localRecord.status)
      const serverIndex = statusPrecedence.indexOf(serverRecord.status)

      if (localIndex !== -1 && serverIndex !== -1 && localIndex !== serverIndex) {
        // Higher index = more advanced status = wins
        return localIndex > serverIndex ? 'local' : 'server'
      }
    }

    // Fall back to timestamp
    return localRecord.updatedAt > serverRecord.updatedAt ? 'local' : 'server'
  }
}
