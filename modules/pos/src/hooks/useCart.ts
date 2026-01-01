/**
 * Cart Hook - Manages POS cart state with offline persistence
 */

import { useState, useEffect, useCallback } from 'react'
import type { CartItem } from '../lib/client/offline-store'

export interface CartState {
  items: CartItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  itemCount: number
}

export interface UseCartReturn extends CartState {
  addItem: (product: { id: string; name: string; sku?: string; price: number }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isEmpty: boolean
}

const TAX_RATE = 0.0825 // 8.25% default tax

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos-cart')
      if (saved) {
        try {
          setItems(JSON.parse(saved))
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos-cart', JSON.stringify(items))
    }
  }, [items])

  const addItem = useCallback((product: { id: string; name: string; sku?: string; price: number }) => {
    setItems(prev => {
      // Check if product already in cart
      const existing = prev.find(item => item.productId === product.id)
      
      if (existing) {
        // Increment quantity
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * item.unitPrice
              }
            : item
        )
      }

      // Add new item
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        quantity: 1,
        lineTotal: product.price,
        addedAt: Date.now()
      }

      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice
            }
          : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const taxAmount = subtotal * TAX_RATE
  const total = subtotal + taxAmount
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    subtotal,
    taxRate: TAX_RATE,
    taxAmount,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isEmpty: items.length === 0
  }
}
