'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type VendorStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'CHURNED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface Vendor {
  id: string
  tenantId: string
  name: string
  slug: string
  email: string
  phone?: string
  businessType?: string
  description?: string
  status: VendorStatus
  isVerified: boolean
  commissionRate: number
  totalSales: number
  totalOrders: number
  reviewCount: number
  onboardingStep: string
  createdAt: string
  updatedAt: string
}

export interface VendorDashboard {
  vendorId: string
  metrics: {
    totalSales: number
    totalOrders: number
    pendingOrders: number
    averageRating: number | null
    reviewCount: number
    conversionRate: number | null
  }
  comparison: {
    period: string
    salesChange: number
    ordersChange: number
  }
  vendorStatus: VendorStatus
  tierName: string | null
  commissionRate: number
  earnings: {
    pendingPayout: number
    lastPayoutAmount: number | null
    lastPayoutDate: string | null
    lifetimeEarnings: number
  }
  recentOrders: VendorOrder[]
  topProducts: ProductMapping[]
}

export interface VendorOrder {
  id: string
  orderNumber: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  items: {
    productId: string
    productName: string
    variantName?: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
  subtotal: number
  commissionAmount: number
  vendorPayout: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface ProductMapping {
  id: string
  vendorId: string
  productId: string
  productName?: string
  productSku?: string
  price?: number
  commissionOverride?: number
  isActive: boolean
  salesCount?: number
  revenue?: number
  createdAt: string
}

export interface Commission {
  id: string
  subOrderId: string
  vendorId: string
  saleAmount: number
  commissionRate: number
  commissionAmount: number
  vendorPayout: number
  status: 'PENDING' | 'PROCESSING' | 'PAID'
  calculatedAt: string
}

interface MVMContextType {
  // Config
  tenantId: string
  vendorId: string | null
  
  // Vendor
  vendor: Vendor | null
  isLoadingVendor: boolean
  
  // Dashboard
  dashboard: VendorDashboard | null
  isLoadingDashboard: boolean
  
  // Orders
  orders: VendorOrder[]
  isLoadingOrders: boolean
  totalOrders: number
  
  // Products
  productMappings: ProductMapping[]
  isLoadingProducts: boolean
  
  // Commissions
  commissions: Commission[]
  isLoadingCommissions: boolean
  totalCommissions: number
  pendingEarnings: number
  
  // Actions
  setVendorId: (vendorId: string) => void
  fetchVendor: () => Promise<void>
  fetchDashboard: () => Promise<void>
  fetchOrders: (status?: OrderStatus) => Promise<void>
  fetchProductMappings: () => Promise<void>
  fetchCommissions: () => Promise<void>
  updateVendorProfile: (data: Partial<Vendor>) => Promise<{ success: boolean; error?: string }>
  addProductMapping: (productId: string, commissionOverride?: number) => Promise<{ success: boolean; error?: string }>
  removeProductMapping: (productId: string) => Promise<{ success: boolean; error?: string }>
}

const MVMContext = createContext<MVMContextType | null>(null)

export function useMVM() {
  const context = useContext(MVMContext)
  if (!context) {
    throw new Error('useMVM must be used within MVMProvider')
  }
  return context
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_VENDOR: Vendor = {
  id: 'vendor-demo-1',
  tenantId: 'demo-tenant',
  name: 'Demo Vendor Store',
  slug: 'demo-vendor-store',
  email: 'vendor@demo.com',
  phone: '+1 555-0123',
  businessType: 'Retail',
  description: 'Quality products at great prices. We specialize in electronics and accessories.',
  status: 'APPROVED',
  isVerified: true,
  commissionRate: 15,
  totalSales: 15750.50,
  totalOrders: 127,
  reviewCount: 89,
  onboardingStep: 'COMPLETE',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2026-01-02T08:00:00Z'
}

const DEMO_DASHBOARD: VendorDashboard = {
  vendorId: 'vendor-demo-1',
  metrics: {
    totalSales: 15750.50,
    totalOrders: 127,
    pendingOrders: 8,
    averageRating: 4.7,
    reviewCount: 89,
    conversionRate: 3.2
  },
  comparison: {
    period: 'month',
    salesChange: 12.5,
    ordersChange: 8.3
  },
  vendorStatus: 'APPROVED',
  tierName: 'Gold',
  commissionRate: 15,
  earnings: {
    pendingPayout: 2340.75,
    lastPayoutAmount: 1856.20,
    lastPayoutDate: '2025-12-28T00:00:00Z',
    lifetimeEarnings: 13387.93
  },
  recentOrders: [],
  topProducts: []
}

const DEMO_ORDERS: VendorOrder[] = [
  {
    id: 'so-001',
    orderNumber: 'ORD-20260101-0012',
    customerId: 'cust-1',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    items: [
      { productId: 'prod-5', productName: 'Wireless Headphones', quantity: 1, unitPrice: 199.99, lineTotal: 199.99 }
    ],
    subtotal: 199.99,
    commissionAmount: 30.00,
    vendorPayout: 169.99,
    status: 'PENDING',
    createdAt: '2026-01-02T06:30:00Z',
    updatedAt: '2026-01-02T06:30:00Z'
  },
  {
    id: 'so-002',
    orderNumber: 'ORD-20260101-0008',
    customerId: 'cust-2',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    items: [
      { productId: 'prod-8', productName: 'Fitness Watch', variantName: 'Black', quantity: 2, unitPrice: 149.99, lineTotal: 299.98 }
    ],
    subtotal: 299.98,
    commissionAmount: 45.00,
    vendorPayout: 254.98,
    status: 'CONFIRMED',
    createdAt: '2026-01-01T18:45:00Z',
    updatedAt: '2026-01-02T08:00:00Z'
  },
  {
    id: 'so-003',
    orderNumber: 'ORD-20251231-0156',
    customerId: 'cust-3',
    customerName: 'Mike Brown',
    customerEmail: 'mike@example.com',
    items: [
      { productId: 'prod-5', productName: 'Wireless Headphones', quantity: 1, unitPrice: 199.99, lineTotal: 199.99 },
      { productId: 'prod-4', productName: 'Leather Wallet', variantName: 'Brown', quantity: 1, unitPrice: 49.99, lineTotal: 49.99 }
    ],
    subtotal: 249.98,
    commissionAmount: 37.50,
    vendorPayout: 212.48,
    status: 'SHIPPED',
    createdAt: '2025-12-31T14:20:00Z',
    updatedAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 'so-004',
    orderNumber: 'ORD-20251230-0089',
    customerName: 'Emily Davis',
    items: [
      { productId: 'prod-8', productName: 'Fitness Watch', variantName: 'White', quantity: 1, unitPrice: 149.99, lineTotal: 149.99 }
    ],
    subtotal: 149.99,
    commissionAmount: 22.50,
    vendorPayout: 127.49,
    status: 'DELIVERED',
    createdAt: '2025-12-30T09:15:00Z',
    updatedAt: '2025-12-31T16:30:00Z'
  }
]

const DEMO_PRODUCT_MAPPINGS: ProductMapping[] = [
  { id: 'map-1', vendorId: 'vendor-demo-1', productId: 'prod-5', productName: 'Wireless Headphones', productSku: 'HP-WLS-BLK', price: 199.99, isActive: true, salesCount: 45, revenue: 8999.55, createdAt: '2025-06-20T00:00:00Z' },
  { id: 'map-2', vendorId: 'vendor-demo-1', productId: 'prod-8', productName: 'Fitness Watch', productSku: 'FW-GPS-BLK', price: 149.99, isActive: true, salesCount: 38, revenue: 5699.62, createdAt: '2025-06-20T00:00:00Z' },
  { id: 'map-3', vendorId: 'vendor-demo-1', productId: 'prod-4', productName: 'Leather Wallet', productSku: 'WLT-LTH-BRN', price: 49.99, isActive: true, salesCount: 28, revenue: 1399.72, createdAt: '2025-07-15T00:00:00Z' },
  { id: 'map-4', vendorId: 'vendor-demo-1', productId: 'prod-7', productName: 'Sunglasses', productSku: 'SG-AVT-GLD', price: 79.99, isActive: false, salesCount: 12, revenue: 959.88, createdAt: '2025-08-01T00:00:00Z' },
]

const DEMO_COMMISSIONS: Commission[] = [
  { id: 'comm-1', subOrderId: 'so-001', vendorId: 'vendor-demo-1', saleAmount: 199.99, commissionRate: 15, commissionAmount: 30.00, vendorPayout: 169.99, status: 'PENDING', calculatedAt: '2026-01-02T06:30:00Z' },
  { id: 'comm-2', subOrderId: 'so-002', vendorId: 'vendor-demo-1', saleAmount: 299.98, commissionRate: 15, commissionAmount: 45.00, vendorPayout: 254.98, status: 'PENDING', calculatedAt: '2026-01-01T18:45:00Z' },
  { id: 'comm-3', subOrderId: 'so-003', vendorId: 'vendor-demo-1', saleAmount: 249.98, commissionRate: 15, commissionAmount: 37.50, vendorPayout: 212.48, status: 'PROCESSING', calculatedAt: '2025-12-31T14:20:00Z' },
  { id: 'comm-4', subOrderId: 'so-004', vendorId: 'vendor-demo-1', saleAmount: 149.99, commissionRate: 15, commissionAmount: 22.50, vendorPayout: 127.49, status: 'PAID', calculatedAt: '2025-12-30T09:15:00Z' },
]

// ============================================================================
// PROVIDER
// ============================================================================

interface MVMProviderProps {
  children: ReactNode
  tenantId?: string
  initialVendorId?: string
}

export function MVMProvider({ children, tenantId = 'demo-tenant', initialVendorId }: MVMProviderProps) {
  const [vendorId, setVendorIdState] = useState<string | null>(initialVendorId || 'vendor-demo-1')
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoadingVendor, setIsLoadingVendor] = useState(false)
  
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)
  
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false)
  const [totalCommissions, setTotalCommissions] = useState(0)
  const [pendingEarnings, setPendingEarnings] = useState(0)

  const setVendorId = useCallback((id: string) => {
    setVendorIdState(id)
  }, [])

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return
    
    setIsLoadingVendor(true)
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}?tenantId=${tenantId}`)
      const data = await res.json()
      
      if (data.success && data.vendor) {
        setVendor(data.vendor)
      } else {
        // Use demo vendor
        setVendor(DEMO_VENDOR)
      }
    } catch (e) {
      console.warn('Failed to fetch vendor, using demo:', e)
      setVendor(DEMO_VENDOR)
    } finally {
      setIsLoadingVendor(false)
    }
  }, [tenantId, vendorId])

  const fetchDashboard = useCallback(async () => {
    if (!vendorId) return
    
    setIsLoadingDashboard(true)
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}/dashboard?tenantId=${tenantId}`)
      const data = await res.json()
      
      if (data.success && data.dashboard) {
        // Check if API returned meaningful metrics, otherwise use demo
        const apiMetrics = data.dashboard.metrics
        const hasRealData = apiMetrics && (apiMetrics.totalSales > 0 || apiMetrics.totalOrders > 0)
        
        setDashboard({
          ...DEMO_DASHBOARD,
          ...(hasRealData ? data.dashboard : {}),
          recentOrders: data.dashboard.recentOrders?.length > 0 ? data.dashboard.recentOrders : DEMO_ORDERS.slice(0, 5),
          topProducts: data.dashboard.topProducts?.length > 0 ? data.dashboard.topProducts : DEMO_PRODUCT_MAPPINGS.slice(0, 4)
        })
      } else {
        // Use full demo data
        setDashboard({
          ...DEMO_DASHBOARD,
          recentOrders: DEMO_ORDERS.slice(0, 5),
          topProducts: DEMO_PRODUCT_MAPPINGS.slice(0, 4)
        })
      }
    } catch (e) {
      console.warn('Failed to fetch dashboard, using demo:', e)
      setDashboard({
        ...DEMO_DASHBOARD,
        recentOrders: DEMO_ORDERS.slice(0, 5),
        topProducts: DEMO_PRODUCT_MAPPINGS.slice(0, 4)
      })
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [tenantId, vendorId])

  const fetchOrders = useCallback(async (status?: OrderStatus) => {
    if (!vendorId) return
    
    setIsLoadingOrders(true)
    try {
      const url = `/api/mvm/vendors/${vendorId}/orders?tenantId=${tenantId}${status ? `&status=${status}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success && data.orders?.length > 0) {
        setOrders(data.orders)
        setTotalOrders(data.total || data.orders.length)
      } else {
        // Use demo orders
        let demoOrders = [...DEMO_ORDERS]
        if (status) {
          demoOrders = demoOrders.filter(o => o.status === status)
        }
        setOrders(demoOrders)
        setTotalOrders(demoOrders.length)
      }
    } catch (e) {
      console.warn('Failed to fetch orders, using demo:', e)
      setOrders(DEMO_ORDERS)
      setTotalOrders(DEMO_ORDERS.length)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [tenantId, vendorId])

  const fetchProductMappings = useCallback(async () => {
    if (!vendorId) return
    
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}/products?tenantId=${tenantId}`)
      const data = await res.json()
      
      if (data.success && data.mappings?.length > 0) {
        setProductMappings(data.mappings)
      } else {
        setProductMappings(DEMO_PRODUCT_MAPPINGS)
      }
    } catch (e) {
      console.warn('Failed to fetch product mappings, using demo:', e)
      setProductMappings(DEMO_PRODUCT_MAPPINGS)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [tenantId, vendorId])

  const fetchCommissions = useCallback(async () => {
    if (!vendorId) return
    
    setIsLoadingCommissions(true)
    try {
      const res = await fetch(`/api/mvm/commissions?tenantId=${tenantId}&vendorId=${vendorId}`)
      const data = await res.json()
      
      if (data.success && data.commissions?.length > 0) {
        setCommissions(data.commissions)
        setTotalCommissions(data.summary?.totalCommission || 0)
        setPendingEarnings(data.summary?.totalPending || 0)
      } else {
        setCommissions(DEMO_COMMISSIONS)
        const pending = DEMO_COMMISSIONS
          .filter(c => c.status === 'PENDING')
          .reduce((sum, c) => sum + c.vendorPayout, 0)
        setPendingEarnings(pending)
        setTotalCommissions(DEMO_COMMISSIONS.reduce((sum, c) => sum + c.commissionAmount, 0))
      }
    } catch (e) {
      console.warn('Failed to fetch commissions, using demo:', e)
      setCommissions(DEMO_COMMISSIONS)
      const pending = DEMO_COMMISSIONS
        .filter(c => c.status === 'PENDING')
        .reduce((sum, c) => sum + c.vendorPayout, 0)
      setPendingEarnings(pending)
    } finally {
      setIsLoadingCommissions(false)
    }
  }, [tenantId, vendorId])

  const updateVendorProfile = useCallback(async (data: Partial<Vendor>): Promise<{ success: boolean; error?: string }> => {
    if (!vendorId) return { success: false, error: 'No vendor ID' }
    
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data })
      })
      const result = await res.json()
      
      if (result.success) {
        setVendor(prev => prev ? { ...prev, ...data } : null)
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (e) {
      // Demo mode - update locally
      setVendor(prev => prev ? { ...prev, ...data } : null)
      return { success: true }
    }
  }, [tenantId, vendorId])

  const addProductMapping = useCallback(async (productId: string, commissionOverride?: number): Promise<{ success: boolean; error?: string }> => {
    if (!vendorId) return { success: false, error: 'No vendor ID' }
    
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, productId, commissionOverride })
      })
      const result = await res.json()
      
      if (result.success) {
        await fetchProductMappings()
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (e) {
      return { success: false, error: 'Failed to add product' }
    }
  }, [tenantId, vendorId, fetchProductMappings])

  const removeProductMapping = useCallback(async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!vendorId) return { success: false, error: 'No vendor ID' }
    
    try {
      const res = await fetch(`/api/mvm/vendors/${vendorId}/products?tenantId=${tenantId}&productId=${productId}`, {
        method: 'DELETE'
      })
      const result = await res.json()
      
      if (result.success) {
        setProductMappings(prev => prev.filter(m => m.productId !== productId))
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (e) {
      // Demo mode - remove locally
      setProductMappings(prev => prev.filter(m => m.productId !== productId))
      return { success: true }
    }
  }, [tenantId, vendorId])

  // Load initial data
  useEffect(() => {
    if (vendorId) {
      fetchVendor()
      fetchDashboard()
    }
  }, [vendorId, fetchVendor, fetchDashboard])

  const value: MVMContextType = {
    tenantId,
    vendorId,
    vendor,
    isLoadingVendor,
    dashboard,
    isLoadingDashboard,
    orders,
    isLoadingOrders,
    totalOrders,
    productMappings,
    isLoadingProducts,
    commissions,
    isLoadingCommissions,
    totalCommissions,
    pendingEarnings,
    setVendorId,
    fetchVendor,
    fetchDashboard,
    fetchOrders,
    fetchProductMappings,
    fetchCommissions,
    updateVendorProfile,
    addProductMapping,
    removeProductMapping
  }

  return (
    <MVMContext.Provider value={value}>
      {children}
    </MVMContext.Provider>
  )
}
