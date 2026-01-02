'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface POSProduct {
  productId: string
  variantId?: string
  sku: string
  name: string
  barcode?: string
  price: number
  costPrice?: number
  quantityAvailable: number
  isInStock: boolean
  trackInventory: boolean
  categoryId?: string
  categoryName?: string
  imageUrl?: string
}

export interface CartItem {
  id: string
  product: POSProduct
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface POSCart {
  items: CartItem[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  customerId?: string
  customerName?: string
}

export interface POSLocation {
  id: string
  name: string
  code?: string
  type: string
  isDefault: boolean
}

export interface POSState {
  // Connection & sync
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  pendingTransactions: number
  
  // Session
  tenantId: string | null
  locationId: string | null
  locationName: string | null
  registerId: string | null
  staffId: string | null
  staffName: string | null
  
  // Cart
  cart: POSCart
  
  // Products cache
  products: POSProduct[]
  isLoadingProducts: boolean
  
  // Locations
  locations: POSLocation[]
}

// ============================================================================
// CONTEXT
// ============================================================================

interface POSContextValue extends POSState {
  // Actions
  setLocation: (locationId: string, locationName: string) => void
  setStaff: (staffId: string, staffName: string) => void
  searchProducts: (query: string) => Promise<POSProduct[]>
  addToCart: (product: POSProduct, quantity?: number) => void
  updateCartItem: (itemId: string, quantity: number) => void
  removeFromCart: (itemId: string) => void
  applyDiscount: (itemId: string, discount: number) => void
  setCustomer: (customerId: string, customerName: string) => void
  clearCart: () => void
  checkout: (paymentMethod: string) => Promise<{ success: boolean; saleId?: string; error?: string }>
  refreshProducts: () => Promise<void>
  syncOfflineTransactions: () => Promise<void>
}

const POSContext = createContext<POSContextValue | null>(null)

export function usePOS() {
  const context = useContext(POSContext)
  if (!context) {
    throw new Error('usePOS must be used within POSProvider')
  }
  return context
}

// ============================================================================
// OFFLINE STORAGE
// ============================================================================

const STORAGE_KEYS = {
  CART: 'pos_cart',
  PRODUCTS_CACHE: 'pos_products_cache',
  PENDING_TRANSACTIONS: 'pos_pending_transactions',
  SESSION: 'pos_session'
}

interface POSSession {
  locationId?: string | null
  locationName?: string | null
  staffId?: string | null
  staffName?: string | null
}

function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to storage:', e)
  }
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface POSProviderProps {
  children: React.ReactNode
  tenantId: string
}

export function POSProvider({ children, tenantId }: POSProviderProps) {
  const [state, setState] = useState<POSState>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingTransactions: 0,
    tenantId,
    locationId: null,
    locationName: null,
    registerId: null,
    staffId: null,
    staffName: null,
    cart: {
      items: [],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0
    },
    products: [],
    isLoadingProducts: false,
    locations: []
  })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true }))
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setState(s => ({ ...s, isOnline: navigator.onLine }))
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load session and cart from storage on mount
  useEffect(() => {
    const session = loadFromStorage<POSSession>(STORAGE_KEYS.SESSION, {})
    const cart = loadFromStorage(STORAGE_KEYS.CART, state.cart)
    const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
    
    setState(s => ({
      ...s,
      locationId: session.locationId || null,
      locationName: session.locationName || null,
      staffId: session.staffId || null,
      staffName: session.staffName || null,
      cart,
      pendingTransactions: pending.length
    }))
  }, [])

  // Save cart to storage on change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CART, state.cart)
  }, [state.cart])

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations()
  }, [tenantId])

  const fetchLocations = async () => {
    try {
      const res = await fetch(`/api/pos/locations?tenantId=${tenantId}`)
      const data = await res.json()
      if (data.success && data.locations?.length > 0) {
        setState(s => ({ ...s, locations: data.locations }))
      } else {
        // Provide demo locations when no real locations exist
        const demoLocations: POSLocation[] = [
          { id: 'demo-store-1', name: 'Main Store', code: 'MAIN', type: 'RETAIL', isDefault: true },
          { id: 'demo-store-2', name: 'Downtown Branch', code: 'DT01', type: 'RETAIL', isDefault: false },
          { id: 'demo-warehouse', name: 'Warehouse', code: 'WH01', type: 'WAREHOUSE', isDefault: false }
        ]
        setState(s => ({ ...s, locations: demoLocations }))
      }
    } catch (e) {
      console.warn('Failed to fetch locations:', e)
      // Provide demo locations on error
      const demoLocations: POSLocation[] = [
        { id: 'demo-store-1', name: 'Main Store', code: 'MAIN', type: 'RETAIL', isDefault: true },
        { id: 'demo-store-2', name: 'Downtown Branch', code: 'DT01', type: 'RETAIL', isDefault: false }
      ]
      setState(s => ({ ...s, locations: demoLocations }))
    }
  }

  const setLocation = useCallback((locationId: string, locationName: string) => {
    setState(s => ({ ...s, locationId, locationName }))
    saveToStorage(STORAGE_KEYS.SESSION, { 
      ...loadFromStorage<POSSession>(STORAGE_KEYS.SESSION, {}),
      locationId, 
      locationName 
    })
  }, [])

  const setStaff = useCallback((staffId: string, staffName: string) => {
    setState(s => ({ ...s, staffId, staffName }))
    saveToStorage(STORAGE_KEYS.SESSION, { 
      ...loadFromStorage<POSSession>(STORAGE_KEYS.SESSION, {}),
      staffId, 
      staffName 
    })
  }, [])

  const searchProducts = useCallback(async (query: string): Promise<POSProduct[]> => {
    // Try online first
    if (state.isOnline) {
      try {
        const res = await fetch(
          `/api/pos/products?tenantId=${tenantId}&query=${encodeURIComponent(query)}&locationId=${state.locationId || ''}&limit=20`
        )
        const data = await res.json()
        if (data.success) {
          return data.products || []
        }
      } catch (e) {
        console.warn('Online search failed, using cache:', e)
      }
    }
    
    // Fallback to cached products
    const cached = loadFromStorage<POSProduct[]>(STORAGE_KEYS.PRODUCTS_CACHE, [])
    const q = query.toLowerCase()
    return cached.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [tenantId, state.isOnline, state.locationId])

  const refreshProducts = useCallback(async () => {
    setState(s => ({ ...s, isLoadingProducts: true }))
    try {
      const res = await fetch(
        `/api/pos/inventory?tenantId=${tenantId}&locationId=${state.locationId || ''}&includeZeroStock=true`
      )
      const data = await res.json()
      if (data.success) {
        const products = data.inventory || []
        setState(s => ({ ...s, products, isLoadingProducts: false }))
        saveToStorage(STORAGE_KEYS.PRODUCTS_CACHE, products)
      }
    } catch (e) {
      console.warn('Failed to refresh products:', e)
      setState(s => ({ ...s, isLoadingProducts: false }))
    }
  }, [tenantId, state.locationId])

  const calculateCartTotals = useCallback((items: CartItem[]): POSCart => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0)
    const taxRate = 0.08 // 8% tax - would come from Core in production
    const taxTotal = (subtotal - discountTotal) * taxRate
    const grandTotal = subtotal - discountTotal + taxTotal
    
    return {
      ...state.cart,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100
    }
  }, [state.cart])

  const addToCart = useCallback((product: POSProduct, quantity: number = 1) => {
    setState(s => {
      const existingIndex = s.cart.items.findIndex(
        item => item.product.productId === product.productId && 
                item.product.variantId === product.variantId
      )
      
      let newItems: CartItem[]
      
      if (existingIndex >= 0) {
        newItems = [...s.cart.items]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
          total: (newItems[existingIndex].quantity + quantity) * newItems[existingIndex].unitPrice
        }
      } else {
        const newItem: CartItem = {
          id: `item_${Date.now()}`,
          product,
          quantity,
          unitPrice: product.price,
          discount: 0,
          total: product.price * quantity
        }
        newItems = [...s.cart.items, newItem]
      }
      
      return { ...s, cart: calculateCartTotals(newItems) }
    })
  }, [calculateCartTotals])

  const updateCartItem = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    setState(s => {
      const newItems = s.cart.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity, total: quantity * item.unitPrice - item.discount }
          : item
      )
      return { ...s, cart: calculateCartTotals(newItems) }
    })
  }, [calculateCartTotals])

  const removeFromCart = useCallback((itemId: string) => {
    setState(s => {
      const newItems = s.cart.items.filter(item => item.id !== itemId)
      return { ...s, cart: calculateCartTotals(newItems) }
    })
  }, [calculateCartTotals])

  const applyDiscount = useCallback((itemId: string, discount: number) => {
    setState(s => {
      const newItems = s.cart.items.map(item => 
        item.id === itemId 
          ? { ...item, discount, total: item.quantity * item.unitPrice - discount }
          : item
      )
      return { ...s, cart: calculateCartTotals(newItems) }
    })
  }, [calculateCartTotals])

  const setCustomer = useCallback((customerId: string, customerName: string) => {
    setState(s => ({
      ...s,
      cart: { ...s.cart, customerId, customerName }
    }))
  }, [])

  const clearCart = useCallback(() => {
    setState(s => ({
      ...s,
      cart: {
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0
      }
    }))
  }, [])

  const checkout = useCallback(async (paymentMethod: string) => {
    const saleData = {
      tenantId,
      locationId: state.locationId,
      staffId: state.staffId,
      customerId: state.cart.customerId,
      items: state.cart.items.map(item => ({
        productId: item.product.productId,
        variantId: item.product.variantId,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total
      })),
      subtotal: state.cart.subtotal,
      discountTotal: state.cart.discountTotal,
      taxTotal: state.cart.taxTotal,
      grandTotal: state.cart.grandTotal,
      paymentMethod,
      timestamp: new Date().toISOString()
    }

    // If online, submit immediately
    if (state.isOnline) {
      try {
        const res = await fetch('/api/pos/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'pos.sale.completed',
            tenantId,
            payload: saleData
          })
        })
        const data = await res.json()
        if (data.success) {
          clearCart()
          return { success: true, saleId: data.saleId || `sale_${Date.now()}` }
        }
        return { success: false, error: data.error || 'Sale failed' }
      } catch (e) {
        // Fall through to offline handling
      }
    }

    // Save for offline sync
    const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
    pending.push({ ...saleData, offlineId: `offline_${Date.now()}` })
    saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, pending)
    
    setState(s => ({ ...s, pendingTransactions: pending.length }))
    clearCart()
    
    return { success: true, saleId: `offline_${Date.now()}` }
  }, [tenantId, state.locationId, state.staffId, state.cart, state.isOnline, clearCart])

  const syncOfflineTransactions = useCallback(async () => {
    if (!state.isOnline) return
    
    setState(s => ({ ...s, isSyncing: true }))
    
    const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
    const synced: string[] = []
    
    for (const transaction of pending) {
      try {
        const res = await fetch('/api/pos/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'pos.sale.completed',
            tenantId,
            payload: transaction
          })
        })
        if (res.ok) {
          synced.push(transaction.offlineId)
        }
      } catch (e) {
        console.warn('Failed to sync transaction:', transaction.offlineId)
      }
    }
    
    // Remove synced transactions
    const remaining = pending.filter(t => !synced.includes(t.offlineId))
    saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, remaining)
    
    setState(s => ({ 
      ...s, 
      isSyncing: false, 
      lastSyncTime: new Date(),
      pendingTransactions: remaining.length
    }))
  }, [tenantId, state.isOnline])

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.pendingTransactions > 0) {
      syncOfflineTransactions()
    }
  }, [state.isOnline])

  const value: POSContextValue = {
    ...state,
    setLocation,
    setStaff,
    searchProducts,
    addToCart,
    updateCartItem,
    removeFromCart,
    applyDiscount,
    setCustomer,
    clearCart,
    checkout,
    refreshProducts,
    syncOfflineTransactions
  }

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  )
}
