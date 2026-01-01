/**
 * POS Offline Queue Manager
 * 
 * Handles offline operations with:
 * - Idempotent operations (using offlineId)
 * - Queue persistence (IndexedDB via Core)
 * - Conflict resolution
 * - Graceful degradation for card payments
 * 
 * IMPORTANT:
 * - Offline sales use LOCAL inventory cache (may oversell)
 * - Sync defers to Core for final inventory validation
 * - Core handles conflicts and adjustments
 */

import type { POSEvent } from './sale-engine'

// ============================================================================
// TYPES
// ============================================================================

export type OfflineActionType =
  | 'SALE_CREATE'
  | 'SALE_ADD_ITEM'
  | 'SALE_REMOVE_ITEM'
  | 'SALE_UPDATE_QUANTITY'
  | 'SALE_APPLY_DISCOUNT'
  | 'SALE_REMOVE_DISCOUNT'
  | 'SALE_ADD_PAYMENT'
  | 'SALE_SUSPEND'
  | 'SALE_RESUME'
  | 'SALE_COMPLETE'
  | 'SALE_VOID'
  | 'REGISTER_OPEN'
  | 'REGISTER_CLOSE'
  | 'SHIFT_START'
  | 'SHIFT_END'

export type OfflineActionStatus =
  | 'PENDING'      // Waiting to sync
  | 'SYNCING'      // Currently syncing
  | 'SYNCED'       // Successfully synced
  | 'CONFLICT'     // Conflict detected, needs resolution
  | 'FAILED'       // Failed to sync (will retry)
  | 'REJECTED'     // Permanently rejected by server

export type PaymentMethod = 
  | 'CASH'
  | 'CARD'
  | 'MOBILE_PAYMENT'
  | 'STORE_CREDIT'
  | 'GIFT_CARD'
  | 'OTHER'

// Offline action record
export interface OfflineAction {
  id: string                    // Unique action ID
  offlineId: string             // Idempotency key (same for retries)
  tenantId: string
  actionType: OfflineActionType
  status: OfflineActionStatus
  payload: Record<string, unknown>
  
  // Context
  saleId?: string               // Related sale (if applicable)
  staffId: string
  registerId?: string
  
  // Timestamps
  createdAt: Date
  attemptedAt?: Date
  syncedAt?: Date
  
  // Retry tracking
  attemptCount: number
  maxAttempts: number
  lastError?: string
  
  // Conflict data
  conflictData?: ConflictData
  
  // Related events (emitted when action was created)
  events: POSEvent[]
}

export interface ConflictData {
  type: ConflictType
  serverState: Record<string, unknown>
  localState: Record<string, unknown>
  resolution?: ConflictResolution
  resolvedAt?: Date
  resolvedBy?: string
}

export type ConflictType =
  | 'INVENTORY_INSUFFICIENT'    // Product out of stock
  | 'PRODUCT_UNAVAILABLE'       // Product deleted/disabled
  | 'PRICE_CHANGED'             // Price differs from cached
  | 'CUSTOMER_INVALID'          // Customer not found
  | 'DUPLICATE_SALE'            // Sale already exists
  | 'SESSION_CLOSED'            // Register session already closed
  | 'UNKNOWN'

export type ConflictResolution =
  | 'ACCEPT_SERVER'             // Use server state
  | 'ACCEPT_LOCAL'              // Force local state (manager override)
  | 'MERGE'                     // Merge both states
  | 'CANCEL'                    // Cancel the operation

// ============================================================================
// OFFLINE-SAFE ACTIONS
// ============================================================================

/**
 * Actions that are SAFE to perform offline
 */
export const OFFLINE_SAFE_ACTIONS: OfflineActionType[] = [
  'SALE_CREATE',
  'SALE_ADD_ITEM',
  'SALE_REMOVE_ITEM',
  'SALE_UPDATE_QUANTITY',
  'SALE_APPLY_DISCOUNT',
  'SALE_REMOVE_DISCOUNT',
  'SALE_SUSPEND',
  'SALE_RESUME',
  'SALE_VOID',
  'REGISTER_OPEN',
  'SHIFT_START',
  'SHIFT_END'
]

/**
 * Actions that REQUIRE network or special handling
 */
export const ONLINE_REQUIRED_ACTIONS: OfflineActionType[] = [
  // None currently - all actions can queue
]

/**
 * Payment methods allowed offline
 */
export const OFFLINE_PAYMENT_METHODS: PaymentMethod[] = [
  'CASH'
]

/**
 * Payment methods that queue for later processing
 */
export const QUEUED_PAYMENT_METHODS: PaymentMethod[] = [
  'CARD',
  'MOBILE_PAYMENT',
  'STORE_CREDIT',
  'GIFT_CARD'
]

// ============================================================================
// OFFLINE QUEUE CLASS
// ============================================================================

export class OfflineQueue {
  private queue: Map<string, OfflineAction> = new Map()
  private persistenceKey = 'pos_offline_queue'
  private syncInProgress = false
  private onStatusChange?: (action: OfflineAction) => void
  
  // Storage interface (injected - uses Core's IndexedDB)
  private storage: OfflineStorage

  constructor(storage: OfflineStorage) {
    this.storage = storage
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------

  async initialize(): Promise<void> {
    // Load persisted queue
    const persisted = await this.storage.get<OfflineAction[]>(this.persistenceKey)
    if (persisted) {
      for (const action of persisted) {
        // Restore dates
        action.createdAt = new Date(action.createdAt)
        if (action.attemptedAt) action.attemptedAt = new Date(action.attemptedAt)
        if (action.syncedAt) action.syncedAt = new Date(action.syncedAt)
        
        this.queue.set(action.id, action)
      }
    }
  }

  // -------------------------------------------------------------------------
  // QUEUE OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Add action to queue
   */
  async enqueue(action: Omit<OfflineAction, 'id' | 'status' | 'attemptCount' | 'maxAttempts' | 'createdAt'>): Promise<OfflineAction> {
    const id = generateOfflineId()
    
    const fullAction: OfflineAction = {
      ...action,
      id,
      status: 'PENDING',
      attemptCount: 0,
      maxAttempts: 5,
      createdAt: new Date()
    }

    this.queue.set(id, fullAction)
    await this.persist()
    
    return fullAction
  }

  /**
   * Get action by ID
   */
  get(id: string): OfflineAction | undefined {
    return this.queue.get(id)
  }

  /**
   * Get action by offlineId (idempotency key)
   */
  getByOfflineId(offlineId: string): OfflineAction | undefined {
    for (const action of this.queue.values()) {
      if (action.offlineId === offlineId) {
        return action
      }
    }
    return undefined
  }

  /**
   * Get all pending actions
   */
  getPending(): OfflineAction[] {
    return Array.from(this.queue.values())
      .filter(a => a.status === 'PENDING' || a.status === 'FAILED')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  /**
   * Get actions for a specific sale
   */
  getForSale(saleId: string): OfflineAction[] {
    return Array.from(this.queue.values())
      .filter(a => a.saleId === saleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  /**
   * Get conflicts needing resolution
   */
  getConflicts(): OfflineAction[] {
    return Array.from(this.queue.values())
      .filter(a => a.status === 'CONFLICT')
  }

  /**
   * Update action status
   */
  async updateStatus(id: string, status: OfflineActionStatus, error?: string): Promise<void> {
    const action = this.queue.get(id)
    if (!action) return

    action.status = status
    action.attemptedAt = new Date()
    if (status === 'SYNCED') {
      action.syncedAt = new Date()
    }
    if (error) {
      action.lastError = error
    }

    await this.persist()
    this.onStatusChange?.(action)
  }

  /**
   * Mark action as conflict
   */
  async markConflict(id: string, conflictData: ConflictData): Promise<void> {
    const action = this.queue.get(id)
    if (!action) return

    action.status = 'CONFLICT'
    action.conflictData = conflictData
    action.attemptedAt = new Date()

    await this.persist()
    this.onStatusChange?.(action)
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(id: string, resolution: ConflictResolution, resolvedBy: string): Promise<void> {
    const action = this.queue.get(id)
    if (!action || !action.conflictData) return

    action.conflictData.resolution = resolution
    action.conflictData.resolvedAt = new Date()
    action.conflictData.resolvedBy = resolvedBy

    if (resolution === 'CANCEL') {
      action.status = 'REJECTED'
    } else {
      // Re-queue for sync with resolution
      action.status = 'PENDING'
      action.attemptCount = 0
    }

    await this.persist()
  }

  /**
   * Remove synced/rejected actions (cleanup)
   */
  async cleanup(olderThan: Date): Promise<number> {
    let removed = 0
    for (const [id, action] of this.queue) {
      if (
        (action.status === 'SYNCED' || action.status === 'REJECTED') &&
        action.createdAt < olderThan
      ) {
        this.queue.delete(id)
        removed++
      }
    }
    await this.persist()
    return removed
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  private async persist(): Promise<void> {
    const actions = Array.from(this.queue.values())
    await this.storage.set(this.persistenceKey, actions)
  }

  // -------------------------------------------------------------------------
  // SYNC
  // -------------------------------------------------------------------------

  /**
   * Set status change callback
   */
  onAction(callback: (action: OfflineAction) => void): void {
    this.onStatusChange = callback
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const actions = Array.from(this.queue.values())
    return {
      total: actions.length,
      pending: actions.filter(a => a.status === 'PENDING').length,
      syncing: actions.filter(a => a.status === 'SYNCING').length,
      synced: actions.filter(a => a.status === 'SYNCED').length,
      conflicts: actions.filter(a => a.status === 'CONFLICT').length,
      failed: actions.filter(a => a.status === 'FAILED').length,
      rejected: actions.filter(a => a.status === 'REJECTED').length
    }
  }
}

export interface QueueStats {
  total: number
  pending: number
  syncing: number
  synced: number
  conflicts: number
  failed: number
  rejected: number
}

// ============================================================================
// STORAGE INTERFACE (Implemented by Core)
// ============================================================================

export interface OfflineStorage {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

// ============================================================================
// OFFLINE SALE MANAGER
// ============================================================================

export class OfflineSaleManager {
  private queue: OfflineQueue
  private inventoryCache: Map<string, number> = new Map() // productId -> quantity
  private isOnline: boolean = true

  constructor(queue: OfflineQueue) {
    this.queue = queue
  }

  // -------------------------------------------------------------------------
  // NETWORK STATUS
  // -------------------------------------------------------------------------

  setOnlineStatus(online: boolean): void {
    this.isOnline = online
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // -------------------------------------------------------------------------
  // INVENTORY CACHE
  // -------------------------------------------------------------------------

  /**
   * Update local inventory cache (called by Core sync)
   */
  updateInventoryCache(productId: string, quantity: number): void {
    this.inventoryCache.set(productId, quantity)
  }

  /**
   * Get cached inventory (for offline display)
   */
  getCachedInventory(productId: string): number | undefined {
    return this.inventoryCache.get(productId)
  }

  /**
   * Deduct from local cache (optimistic)
   */
  deductFromCache(productId: string, quantity: number): boolean {
    const current = this.inventoryCache.get(productId) ?? 0
    if (current < quantity) {
      // Low stock warning but allow (offline can't block)
      console.warn(`Low stock warning: ${productId} has ${current}, requested ${quantity}`)
    }
    this.inventoryCache.set(productId, Math.max(0, current - quantity))
    return true
  }

  /**
   * Restore to cache (on void/remove)
   */
  restoreToCache(productId: string, quantity: number): void {
    const current = this.inventoryCache.get(productId) ?? 0
    this.inventoryCache.set(productId, current + quantity)
  }

  // -------------------------------------------------------------------------
  // PAYMENT HANDLING
  // -------------------------------------------------------------------------

  /**
   * Check if payment method is allowed offline
   */
  isPaymentAllowedOffline(method: PaymentMethod): boolean {
    if (this.isOnline) return true
    return OFFLINE_PAYMENT_METHODS.includes(method)
  }

  /**
   * Check if payment should be queued
   */
  shouldQueuePayment(method: PaymentMethod): boolean {
    if (this.isOnline) return false
    return QUEUED_PAYMENT_METHODS.includes(method)
  }

  /**
   * Get allowed payment methods for current state
   */
  getAllowedPaymentMethods(): PaymentMethod[] {
    if (this.isOnline) {
      return ['CASH', 'CARD', 'MOBILE_PAYMENT', 'STORE_CREDIT', 'GIFT_CARD', 'OTHER']
    }
    return [...OFFLINE_PAYMENT_METHODS]
  }

  // -------------------------------------------------------------------------
  // ACTION HANDLING
  // -------------------------------------------------------------------------

  /**
   * Check if action can be performed offline
   */
  canPerformOffline(actionType: OfflineActionType): boolean {
    return OFFLINE_SAFE_ACTIONS.includes(actionType)
  }

  /**
   * Create idempotent offline action
   */
  async createOfflineAction(
    actionType: OfflineActionType,
    payload: Record<string, unknown>,
    context: {
      tenantId: string
      staffId: string
      saleId?: string
      registerId?: string
      events?: POSEvent[]
    }
  ): Promise<OfflineAction> {
    // Generate idempotency key
    const offlineId = generateIdempotencyKey(actionType, payload, context)

    // Check if already exists (idempotency)
    const existing = this.queue.getByOfflineId(offlineId)
    if (existing) {
      return existing
    }

    // Create new action
    return this.queue.enqueue({
      offlineId,
      tenantId: context.tenantId,
      actionType,
      payload,
      saleId: context.saleId,
      staffId: context.staffId,
      registerId: context.registerId,
      events: context.events ?? []
    })
  }
}

// ============================================================================
// SYNC SERVICE
// ============================================================================

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  conflicts: number
  errors: Array<{ actionId: string; error: string }>
}

export interface SyncHandler {
  syncAction(action: OfflineAction): Promise<{
    success: boolean
    conflict?: ConflictData
    error?: string
  }>
}

export class OfflineSyncService {
  private queue: OfflineQueue
  private handler: SyncHandler
  private isSyncing = false

  constructor(queue: OfflineQueue, handler: SyncHandler) {
    this.queue = queue
    this.handler = handler
  }

  /**
   * Sync all pending actions
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, conflicts: 0, errors: [] }
    }

    this.isSyncing = true
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    }

    try {
      const pending = this.queue.getPending()

      for (const action of pending) {
        // Check max attempts
        if (action.attemptCount >= action.maxAttempts) {
          await this.queue.updateStatus(action.id, 'REJECTED', 'Max attempts exceeded')
          result.failed++
          continue
        }

        // Mark as syncing
        await this.queue.updateStatus(action.id, 'SYNCING')
        action.attemptCount++

        try {
          const syncResult = await this.handler.syncAction(action)

          if (syncResult.success) {
            await this.queue.updateStatus(action.id, 'SYNCED')
            result.synced++
          } else if (syncResult.conflict) {
            await this.queue.markConflict(action.id, syncResult.conflict)
            result.conflicts++
          } else {
            await this.queue.updateStatus(action.id, 'FAILED', syncResult.error)
            result.failed++
            result.errors.push({ actionId: action.id, error: syncResult.error ?? 'Unknown error' })
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          await this.queue.updateStatus(action.id, 'FAILED', errorMsg)
          result.failed++
          result.errors.push({ actionId: action.id, error: errorMsg })
        }
      }

      result.success = result.failed === 0 && result.conflicts === 0
    } finally {
      this.isSyncing = false
    }

    return result
  }

  /**
   * Sync single action
   */
  async syncOne(actionId: string): Promise<boolean> {
    const action = this.queue.get(actionId)
    if (!action) return false

    await this.queue.updateStatus(actionId, 'SYNCING')
    action.attemptCount++

    try {
      const result = await this.handler.syncAction(action)

      if (result.success) {
        await this.queue.updateStatus(actionId, 'SYNCED')
        return true
      } else if (result.conflict) {
        await this.queue.markConflict(actionId, result.conflict)
        return false
      } else {
        await this.queue.updateStatus(actionId, 'FAILED', result.error)
        return false
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      await this.queue.updateStatus(actionId, 'FAILED', errorMsg)
      return false
    }
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateOfflineId(): string {
  return `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateIdempotencyKey(
  actionType: OfflineActionType,
  payload: Record<string, unknown>,
  context: { saleId?: string; staffId: string }
): string {
  // Create deterministic key from action details
  const parts = [
    actionType,
    context.saleId ?? 'no-sale',
    context.staffId,
    JSON.stringify(payload)
  ]
  
  // Simple hash for idempotency
  let hash = 0
  const str = parts.join('|')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return `idem_${Math.abs(hash).toString(36)}`
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateOfflineId,
  generateIdempotencyKey
}
