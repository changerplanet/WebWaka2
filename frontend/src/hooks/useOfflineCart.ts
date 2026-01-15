/**
 * useOfflineCart Hook (Wave G2)
 * 
 * React hook for offline cart persistence with conflict detection.
 * User-triggered operations only - no automation.
 * 
 * @module hooks/useOfflineCart
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  OfflineCartService,
  CartConflictDetector,
  CartMergeService,
  getCartStatusSignal,
  type OfflineCart,
  type CartItem,
  type ShippingAddress,
  type CartConflict,
  type CartStatusSignal,
  type ProductCheckResult
} from '@/lib/svm'

interface UseOfflineCartOptions {
  tenantId: string
  sessionId: string
  isDemo?: boolean
  autoSave?: boolean
}

interface UseOfflineCartReturn {
  offlineCart: OfflineCart | null
  conflicts: CartConflict[]
  statusSignal: CartStatusSignal
  isAvailable: boolean
  isLoading: boolean
  isSaving: boolean
  hasRestorable: boolean
  saveCart: (items: CartItem[], options?: { shippingAddress?: ShippingAddress; promotionCode?: string }) => Promise<boolean>
  restoreCart: (serverProducts: ProductCheckResult[]) => Promise<OfflineCart | null>
  clearCart: () => Promise<boolean>
  checkForSavedCart: () => Promise<boolean>
  resolveConflicts: (serverProducts: ProductCheckResult[]) => Promise<CartConflict[]>
}

export function useOfflineCart(options: UseOfflineCartOptions): UseOfflineCartReturn {
  const { tenantId, sessionId, isDemo = false, autoSave = true } = options
  
  const [offlineCart, setOfflineCart] = useState<OfflineCart | null>(null)
  const [conflicts, setConflicts] = useState<CartConflict[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasRestorable, setHasRestorable] = useState(false)
  
  const isAvailable = OfflineCartService.isAvailable()
  const statusSignal = getCartStatusSignal(offlineCart, conflicts)
  
  useEffect(() => {
    async function checkForCart() {
      if (!isAvailable) {
        setIsLoading(false)
        return
      }
      
      try {
        const cart = await OfflineCartService.getCartBySession(tenantId, sessionId)
        setOfflineCart(cart)
        setHasRestorable(cart !== null && cart.items.length > 0)
      } catch (error) {
        console.error('[useOfflineCart] Failed to check for cart:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkForCart()
  }, [tenantId, sessionId, isAvailable])
  
  const saveCart = useCallback(async (
    items: CartItem[],
    saveOptions?: { shippingAddress?: ShippingAddress; promotionCode?: string }
  ): Promise<boolean> => {
    if (!isAvailable) return false
    
    setIsSaving(true)
    try {
      const result = await OfflineCartService.saveCart(
        tenantId,
        sessionId,
        items,
        {
          shippingAddress: saveOptions?.shippingAddress,
          promotionCode: saveOptions?.promotionCode,
          isDemo
        }
      )
      
      if (result.success) {
        const cart = await OfflineCartService.getCartBySession(tenantId, sessionId)
        setOfflineCart(cart)
        setConflicts([])
      }
      
      return result.success
    } catch (error) {
      console.error('[useOfflineCart] Failed to save cart:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [tenantId, sessionId, isDemo, isAvailable])
  
  const restoreCart = useCallback(async (
    serverProducts: ProductCheckResult[]
  ): Promise<OfflineCart | null> => {
    if (!isAvailable) return null
    
    setIsLoading(true)
    try {
      const result = await CartMergeService.restoreCart(tenantId, sessionId, serverProducts)
      
      if (result.success && result.cart) {
        setOfflineCart(result.cart)
        
        const detectedConflicts = await CartConflictDetector.detectConflicts(
          result.cart,
          serverProducts
        )
        setConflicts(detectedConflicts)
        
        return result.cart
      }
      
      return null
    } catch (error) {
      console.error('[useOfflineCart] Failed to restore cart:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, sessionId, isAvailable])
  
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !offlineCart) return false
    
    try {
      const result = await OfflineCartService.deleteCart(offlineCart.id)
      if (result.success) {
        setOfflineCart(null)
        setConflicts([])
        setHasRestorable(false)
      }
      return result.success
    } catch (error) {
      console.error('[useOfflineCart] Failed to clear cart:', error)
      return false
    }
  }, [offlineCart, isAvailable])
  
  const checkForSavedCart = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false
    
    try {
      const hasCart = await OfflineCartService.hasRestorable(tenantId, sessionId)
      setHasRestorable(hasCart)
      return hasCart
    } catch (error) {
      console.error('[useOfflineCart] Failed to check for saved cart:', error)
      return false
    }
  }, [tenantId, sessionId, isAvailable])
  
  const resolveConflicts = useCallback(async (
    serverProducts: ProductCheckResult[]
  ): Promise<CartConflict[]> => {
    if (!isAvailable || !offlineCart) return []
    
    try {
      const detectedConflicts = await CartConflictDetector.detectConflicts(
        offlineCart,
        serverProducts
      )
      setConflicts(detectedConflicts)
      return detectedConflicts
    } catch (error) {
      console.error('[useOfflineCart] Failed to resolve conflicts:', error)
      return []
    }
  }, [offlineCart, isAvailable])
  
  return {
    offlineCart,
    conflicts,
    statusSignal,
    isAvailable,
    isLoading,
    isSaving,
    hasRestorable,
    saveCart,
    restoreCart,
    clearCart,
    checkForSavedCart,
    resolveConflicts
  }
}
