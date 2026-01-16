'use client'

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import {
  initDB,
  addPendingTransaction,
  getPendingTransactions,
  getPendingTransactionCount,
  removePendingTransaction,
  isIndexedDBSupported,
  PendingTransaction
} from '@/lib/pos-indexed-db'

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
    
    setState(s => ({
      ...s,
      locationId: session.locationId || null,
      locationName: session.locationName || null,
      staffId: session.staffId || null,
      staffName: session.staffName || null,
      cart
    }))
    
    const loadPendingCount = async () => {
      if (isIndexedDBSupported()) {
        try {
          await initDB()
          
          // Migrate any pending transactions from localStorage to IndexedDB
          const localPending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
          if (localPending.length > 0) {
            console.log('[POS] Migrating', localPending.length, 'pending transactions from localStorage to IndexedDB')
            for (const txn of localPending) {
              const pendingTxn: PendingTransaction = {
                offlineId: txn.offlineId || `migrated-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                timestamp: txn.timestamp || Date.now(),
                status: 'pending',
                retryCount: 0,
                data: txn
              }
              try {
                await addPendingTransaction(pendingTxn)
              } catch (e) {
                console.warn('[POS] Failed to migrate transaction:', e)
              }
            }
            // Clear localStorage after successful migration
            localStorage.removeItem(STORAGE_KEYS.PENDING_TRANSACTIONS)
            console.log('[POS] Migration complete, cleared localStorage')
          }
          
          const count = await getPendingTransactionCount()
          setState(s => ({ ...s, pendingTransactions: count }))
        } catch (e) {
          console.warn('IndexedDB not available, falling back to localStorage:', e)
          const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
          setState(s => ({ ...s, pendingTransactions: pending.length }))
        }
      } else {
        const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
        setState(s => ({ ...s, pendingTransactions: pending.length }))
      }
    }
    loadPendingCount()
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
        setState(s => ({ ...s, locations: [] }))
      }
    } catch (e) {
      console.warn('Failed to fetch locations:', e)
      setState(s => ({ ...s, locations: [] }))
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
    
    // Fallback to cached products
    const cached = loadFromStorage<POSProduct[]>(STORAGE_KEYS.PRODUCTS_CACHE, [])
    // Filter out any legacy demo products from cache
    const realProducts = cached.filter(p => !p.productId.startsWith('demo-'))
    const q = query.toLowerCase()
    return realProducts.filter(p => 
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
        setState(s => ({ ...s, products: [], isLoadingProducts: false }))
        saveToStorage(STORAGE_KEYS.PRODUCTS_CACHE, [])
      }
    } catch (e) {
      console.warn('Failed to refresh products:', e)
      const cachedProducts = loadFromStorage<POSProduct[]>(STORAGE_KEYS.PRODUCTS_CACHE, [])
      setState(s => ({ ...s, products: cachedProducts, isLoadingProducts: false }))
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
    // Validate discount: clamp to 0 if negative or NaN
    const validDiscount = isNaN(discount) || discount < 0 ? 0 : discount
    
    setState(s => {
      const newItems = s.cart.items.map(item => {
        if (item.id !== itemId) return item
        // Ensure discount doesn't exceed item total
        const maxDiscount = item.quantity * item.unitPrice
        const clampedDiscount = Math.min(validDiscount, maxDiscount)
        return { 
          ...item, 
          discount: clampedDiscount, 
          total: item.quantity * item.unitPrice - clampedDiscount 
        }
      })
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

    if (isIndexedDBSupported()) {
      try {
        const pendingTxn: PendingTransaction = {
          offlineId: idempotencyKey,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          data: saleData
        }
        await addPendingTransaction(pendingTxn)
        const count = await getPendingTransactionCount()
        setState(s => ({ ...s, pendingTransactions: count }))
      } catch (e) {
        console.warn('IndexedDB failed, falling back to localStorage:', e)
        const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
        pending.push({ ...saleData, offlineId: idempotencyKey, isOffline: true })
        saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, pending)
        setState(s => ({ ...s, pendingTransactions: pending.length }))
      }
    } else {
      const pending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
      pending.push({ ...saleData, offlineId: idempotencyKey, isOffline: true })
      saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, pending)
      setState(s => ({ ...s, pendingTransactions: pending.length }))
    }
    
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
    
    let pendingTransactions: PendingTransaction[] = []
    let usingIndexedDB = false
    
    if (isIndexedDBSupported()) {
      try {
        pendingTransactions = await getPendingTransactions()
        usingIndexedDB = true
      } catch (e) {
        console.warn('IndexedDB failed, falling back to localStorage:', e)
        const localPending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
        pendingTransactions = localPending.map(t => ({
          offlineId: t.offlineId || `legacy-${Date.now()}`,
          timestamp: t.timestamp || Date.now(),
          status: 'pending' as const,
          retryCount: 0,
          data: t
        }))
      }
    } else {
      const localPending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
      pendingTransactions = localPending.map(t => ({
        offlineId: t.offlineId || `legacy-${Date.now()}`,
        timestamp: t.timestamp || Date.now(),
        status: 'pending' as const,
        retryCount: 0,
        data: t
      }))
    }
    
    const synced: string[] = []
    const rejected: string[] = []
    
    for (const transaction of pendingTransactions) {
      if (!transaction.offlineId) {
        console.warn('[POS Sync] Rejecting transaction without offlineId')
        rejected.push(transaction.offlineId || 'unknown')
        continue
      }
      
      const txnData = transaction.data || transaction
      const isOnlineOnlyMethod = ONLINE_ONLY_PAYMENT_METHODS.includes(txnData.paymentMethod as any)
      if (isOnlineOnlyMethod) {
        console.warn('[POS Sync] Rejecting offline online-only payment:', transaction.offlineId, txnData.paymentMethod)
        rejected.push(transaction.offlineId)
        if (usingIndexedDB) {
          await removePendingTransaction(transaction.offlineId)
        }
        continue
      }

      try {
        const res = await fetch('/api/pos/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...txnData,
            offlineId: transaction.offlineId,
            isOffline: true,
          })
        })
        if (res.ok) {
          synced.push(transaction.offlineId)
          if (usingIndexedDB) {
            await removePendingTransaction(transaction.offlineId)
          }
        }
      } catch (e) {
        console.warn('Failed to sync transaction:', transaction.offlineId)
      }
    }
    
    let remainingCount = 0
    if (usingIndexedDB) {
      remainingCount = await getPendingTransactionCount()
    } else {
      const localPending = loadFromStorage<any[]>(STORAGE_KEYS.PENDING_TRANSACTIONS, [])
      const remaining = localPending.filter(t => 
        !synced.includes(t.offlineId) && !rejected.includes(t.offlineId)
      )
      saveToStorage(STORAGE_KEYS.PENDING_TRANSACTIONS, remaining)
      remainingCount = remaining.length
    }
    
    setState(s => ({ 
      ...s, 
      isSyncing: false, 
      lastSyncTime: new Date(),
      pendingTransactions: remainingCount
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
