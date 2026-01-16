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

export interface PaymentData {
  paymentMethod: string
  transferReference?: string
  transferImage?: string | null
  roundingMode?: 'N5' | 'N10' | null
  roundingAdjustment?: number
  amountPaid?: number
}

export interface CheckoutResult {
  success: boolean
  saleId?: string
  receiptId?: string
  receiptNumber?: string
  qrVerificationCode?: string
  error?: string
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

export const OFFLINE_SAFE_PAYMENT_METHODS = ['CASH', 'TRANSFER', 'BANK_TRANSFER'] as const
export const ONLINE_ONLY_PAYMENT_METHODS = ['CARD', 'MOBILE_MONEY', 'WALLET'] as const

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
  checkout: (paymentMethod: string, paymentData?: PaymentData) => Promise<CheckoutResult>
  refreshProducts: () => Promise<void>
  syncOfflineTransactions: () => Promise<void>
  canUsePaymentMethod: (method: string) => boolean
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
          { id: 'seed-location-1', name: 'Main Store', code: 'MAIN', type: 'RETAIL', isDefault: true },
          { id: 'seed-location-2', name: 'Downtown Branch', code: 'DT01', type: 'RETAIL', isDefault: false },
          { id: 'demo-warehouse', name: 'Warehouse', code: 'WH01', type: 'WAREHOUSE', isDefault: false }
        ]
        setState(s => ({ ...s, locations: demoLocations }))
      }
    } catch (e) {
      console.warn('Failed to fetch locations:', e)
      // Provide demo locations on error
      const demoLocations: POSLocation[] = [
        { id: 'seed-location-1', name: 'Main Store', code: 'MAIN', type: 'RETAIL', isDefault: true },
        { id: 'seed-location-2', name: 'Downtown Branch', code: 'DT01', type: 'RETAIL', isDefault: false }
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
        if (data.success && data.products?.length > 0) {
          return data.products
        }
      } catch (e) {
        console.warn('Online search failed, using cache:', e)
      }
    }
    
    // Fallback to cached products (which includes demo products)
    const cached = loadFromStorage<POSProduct[]>(STORAGE_KEYS.PRODUCTS_CACHE, [])
    const q = query.toLowerCase()
    return cached.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [tenantId, state.isOnline, state.locationId])

  const refreshProducts = useCallback(async () => {
    setState(s => ({ ...s, isLoadingProducts: true }))
    try {
      const res = await fetch(
        `/api/pos/inventory?tenantId=${tenantId}&locationId=${state.locationId || ''}&includeZeroStock=true`
      )
      const data = await res.json()
      if (data.success && data.inventory?.length > 0) {
        const products = data.inventory
        setState(s => ({ ...s, products, isLoadingProducts: false }))
        saveToStorage(STORAGE_KEYS.PRODUCTS_CACHE, products)
      } else {
        // Provide demo products when no real products exist
        const demoProducts: POSProduct[] = [
          { productId: 'demo-1', sku: 'COFFEE-001', name: 'Espresso', barcode: '1234567890123', price: 3.50, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-2', sku: 'COFFEE-002', name: 'Cappuccino', barcode: '1234567890124', price: 4.50, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-3', sku: 'COFFEE-003', name: 'Latte', barcode: '1234567890125', price: 4.75, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-4', sku: 'COFFEE-004', name: 'Americano', barcode: '1234567890126', price: 3.25, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-5', sku: 'TEA-001', name: 'Green Tea', barcode: '1234567890127', price: 2.75, quantityAvailable: 50, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-6', sku: 'TEA-002', name: 'Earl Grey', barcode: '1234567890128', price: 2.75, quantityAvailable: 50, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-7', sku: 'PASTRY-001', name: 'Croissant', barcode: '1234567890129', price: 3.25, quantityAvailable: 24, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
          { productId: 'demo-8', sku: 'PASTRY-002', name: 'Blueberry Muffin', barcode: '1234567890130', price: 3.50, quantityAvailable: 18, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
          { productId: 'demo-9', sku: 'PASTRY-003', name: 'Chocolate Donut', barcode: '1234567890131', price: 2.50, quantityAvailable: 30, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
          { productId: 'demo-10', sku: 'PASTRY-004', name: 'Cinnamon Roll', barcode: '1234567890132', price: 4.00, quantityAvailable: 12, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
          { productId: 'demo-11', sku: 'SAND-001', name: 'Ham & Cheese Sandwich', barcode: '1234567890133', price: 7.50, quantityAvailable: 15, isInStock: true, trackInventory: true, categoryName: 'Food' },
          { productId: 'demo-12', sku: 'SAND-002', name: 'Turkey Club', barcode: '1234567890134', price: 8.50, quantityAvailable: 12, isInStock: true, trackInventory: true, categoryName: 'Food' },
          { productId: 'demo-13', sku: 'SALAD-001', name: 'Caesar Salad', barcode: '1234567890135', price: 9.00, quantityAvailable: 10, isInStock: true, trackInventory: true, categoryName: 'Food' },
          { productId: 'demo-14', sku: 'SNACK-001', name: 'Granola Bar', barcode: '1234567890136', price: 2.00, quantityAvailable: 48, isInStock: true, trackInventory: true, categoryName: 'Snacks' },
          { productId: 'demo-15', sku: 'SNACK-002', name: 'Chips', barcode: '1234567890137', price: 1.75, quantityAvailable: 36, isInStock: true, trackInventory: true, categoryName: 'Snacks' },
          { productId: 'demo-16', sku: 'DRINK-001', name: 'Bottled Water', barcode: '1234567890138', price: 1.50, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Drinks' },
          { productId: 'demo-17', sku: 'DRINK-002', name: 'Orange Juice', barcode: '1234567890139', price: 3.00, quantityAvailable: 24, isInStock: true, trackInventory: true, categoryName: 'Drinks' },
          { productId: 'demo-18', sku: 'DRINK-003', name: 'Iced Coffee', barcode: '1234567890140', price: 4.25, quantityAvailable: 40, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-19', sku: 'SPECIAL-001', name: 'Mocha Frappe', barcode: '1234567890141', price: 5.50, quantityAvailable: 30, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
          { productId: 'demo-20', sku: 'SPECIAL-002', name: 'Caramel Macchiato', barcode: '1234567890142', price: 5.25, quantityAvailable: 25, isInStock: true, trackInventory: true, categoryName: 'Beverages' }
        ]
        setState(s => ({ ...s, products: demoProducts, isLoadingProducts: false }))
        saveToStorage(STORAGE_KEYS.PRODUCTS_CACHE, demoProducts)
      }
    } catch (e) {
      console.warn('Failed to refresh products:', e)
      // Provide demo products on error as well
      const demoProducts: POSProduct[] = [
        { productId: 'demo-1', sku: 'COFFEE-001', name: 'Espresso', price: 3.50, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
        { productId: 'demo-2', sku: 'COFFEE-002', name: 'Cappuccino', price: 4.50, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
        { productId: 'demo-3', sku: 'COFFEE-003', name: 'Latte', price: 4.75, quantityAvailable: 100, isInStock: true, trackInventory: true, categoryName: 'Beverages' },
        { productId: 'demo-4', sku: 'PASTRY-001', name: 'Croissant', price: 3.25, quantityAvailable: 24, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
        { productId: 'demo-5', sku: 'PASTRY-002', name: 'Blueberry Muffin', price: 3.50, quantityAvailable: 18, isInStock: true, trackInventory: true, categoryName: 'Pastries' },
        { productId: 'demo-6', sku: 'SAND-001', name: 'Ham & Cheese Sandwich', price: 7.50, quantityAvailable: 15, isInStock: true, trackInventory: true, categoryName: 'Food' }
      ]
      setState(s => ({ ...s, products: demoProducts, isLoadingProducts: false }))
    }
  }, [tenantId, state.locationId])

  const calculateCartTotals = useCallback((items: CartItem[]): POSCart => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0)
    const taxRate = 0.075 // 7.5% VAT - Nigeria standard rate (POS-P2-3)
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

  const canUsePaymentMethod = useCallback((method: string): boolean => {
    if (state.isOnline) return true
    return OFFLINE_SAFE_PAYMENT_METHODS.includes(method as any)
  }, [state.isOnline])

  const checkout = useCallback(async (paymentMethod: string, paymentData?: PaymentData): Promise<CheckoutResult> => {
    if (!canUsePaymentMethod(paymentMethod)) {
      return { 
        success: false, 
        error: `${paymentMethod} is not available while offline. Please use Cash or Bank Transfer.` 
      }
    }

    const idempotencyKey = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const saleData = {
      locationId: state.locationId!,
      locationName: state.locationName || 'POS',
      customerId: state.cart.customerId,
      customerName: state.cart.customerName,
      items: state.cart.items.map(item => ({
        productId: item.product.productId,
        variantId: item.product.variantId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: (item.unitPrice * item.quantity - item.discount) * 0.075,
        lineTotal: item.total
      })),
      subtotal: state.cart.subtotal,
      discountTotal: state.cart.discountTotal,
      taxTotal: state.cart.taxTotal,
      grandTotal: state.cart.grandTotal,
      paymentMethod,
      amountTendered: paymentData?.amountPaid,
      changeGiven: paymentData?.amountPaid ? paymentData.amountPaid - state.cart.grandTotal : undefined,
      transferReference: paymentData?.transferReference,
      transferImage: paymentData?.transferImage,
      roundingMode: paymentData?.roundingMode,
      roundingAdjustment: paymentData?.roundingAdjustment,
      offlineId: idempotencyKey,
    }

    const isDemo = state.locationId?.startsWith('demo-')
    
    if (isDemo) {
      const saleId = `demo_${Date.now()}`
      const demoSales = loadFromStorage<any[]>('pos_demo_sales', [])
      demoSales.push({ ...saleData, saleId, status: 'completed' })
      saveToStorage('pos_demo_sales', demoSales)
      clearCart()
      return { 
        success: true, 
        saleId,
        receiptNumber: `RCP-DEMO-${Date.now().toString().slice(-6)}`,
        qrVerificationCode: `DEMO-${Date.now().toString(36).toUpperCase()}`
      }
    }

    if (state.isOnline) {
      try {
        const res = await fetch('/api/pos/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData)
        })
        const data = await res.json()
        if (data.success) {
          clearCart()
          return { 
            success: true, 
            saleId: data.sale.id,
            receiptId: data.sale.receiptId,
            receiptNumber: data.sale.receiptNumber,
            qrVerificationCode: data.sale.qrVerificationCode
          }
        }
        return { success: false, error: data.error || 'Failed to process sale' }
      } catch (e) {
        const isOnlineOnlyMethod = ONLINE_ONLY_PAYMENT_METHODS.includes(paymentMethod as any)
        if (isOnlineOnlyMethod) {
          return { 
            success: false, 
            error: `Network error. ${paymentMethod} payments require a stable internet connection. Please check your connection and try again.` 
          }
        }
      }
    }

    const isOnlineOnlyMethod = ONLINE_ONLY_PAYMENT_METHODS.includes(paymentMethod as any)
    if (isOnlineOnlyMethod) {
      return { 
        success: false, 
        error: `${paymentMethod} payments cannot be processed offline. Please use Cash or Bank Transfer.` 
      }
    }

    const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
    pending.push({ ...saleData, isOffline: true })
    saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, pending)
    
    setState(s => ({ ...s, pendingTransactions: pending.length }))
    clearCart()
    
    return { 
      success: true, 
      saleId: idempotencyKey,
      receiptNumber: `RCP-OFFLINE-${idempotencyKey.slice(-6)}`,
      qrVerificationCode: `PENDING-SYNC`
    }
  }, [tenantId, state.locationId, state.locationName, state.staffId, state.cart, state.isOnline, clearCart, canUsePaymentMethod])

  const syncOfflineTransactions = useCallback(async () => {
    if (!state.isOnline) return
    
    setState(s => ({ ...s, isSyncing: true }))
    
    const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
    const synced: string[] = []
    const rejected: string[] = []
    
    for (const transaction of pending) {
      if (!transaction.offlineId) {
        console.warn('[POS Sync] Rejecting transaction without offlineId')
        rejected.push(transaction.offlineId || 'unknown')
        continue
      }
      
      const isOnlineOnlyMethod = ONLINE_ONLY_PAYMENT_METHODS.includes(transaction.paymentMethod as any)
      if (isOnlineOnlyMethod) {
        console.warn('[POS Sync] Rejecting offline online-only payment:', transaction.offlineId, transaction.paymentMethod)
        rejected.push(transaction.offlineId)
        continue
      }

      try {
        const res = await fetch('/api/pos/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...transaction,
            isOffline: true,
          })
        })
        if (res.ok) {
          synced.push(transaction.offlineId)
        }
      } catch (e) {
        console.warn('Failed to sync transaction:', transaction.offlineId)
      }
    }
    
    const remaining = pending.filter(t => 
      !synced.includes(t.offlineId) && !rejected.includes(t.offlineId)
    )
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
    syncOfflineTransactions,
    canUsePaymentMethod
  }

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  )
}
