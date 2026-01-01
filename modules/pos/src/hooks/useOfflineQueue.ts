/**
 * Offline Queue Hook - Manages pending sync operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllItems,
  putItem,
  deleteItem,
  STORES,
  type PendingSyncItem
} from '../lib/client/offline-store'

export interface UseOfflineQueueReturn {
  pendingItems: PendingSyncItem[]
  pendingCount: number
  addToQueue: (type: PendingSyncItem['type'], payload: Record<string, unknown>) => Promise<string>
  removeFromQueue: (id: string) => Promise<void>
  retryItem: (id: string) => Promise<void>
  isProcessing: boolean
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [pendingItems, setPendingItems] = useState<PendingSyncItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Load pending items on mount
  useEffect(() => {
    loadPendingItems()
  }, [])

  const loadPendingItems = async () => {
    try {
      const items = await getAllItems<PendingSyncItem>(STORES.PENDING_SYNC)
      setPendingItems(items.sort((a, b) => a.createdAt - b.createdAt))
    } catch (error) {
      console.error('Failed to load pending items:', error)
    }
  }

  const addToQueue = useCallback(async (
    type: PendingSyncItem['type'],
    payload: Record<string, unknown>
  ): Promise<string> => {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const item: PendingSyncItem = {
      id,
      type,
      payload,
      createdAt: Date.now(),
      retryCount: 0
    }

    await putItem(STORES.PENDING_SYNC, item)
    await loadPendingItems()
    return id
  }, [])

  const removeFromQueue = useCallback(async (id: string): Promise<void> => {
    await deleteItem(STORES.PENDING_SYNC, id)
    await loadPendingItems()
  }, [])

  const retryItem = useCallback(async (id: string): Promise<void> => {
    const item = pendingItems.find(i => i.id === id)
    if (!item) return

    // Update retry count
    const updated: PendingSyncItem = {
      ...item,
      retryCount: item.retryCount + 1
    }
    await putItem(STORES.PENDING_SYNC, updated)
    await loadPendingItems()
  }, [pendingItems])

  return {
    pendingItems,
    pendingCount: pendingItems.length,
    addToQueue,
    removeFromQueue,
    retryItem,
    isProcessing
  }
}
