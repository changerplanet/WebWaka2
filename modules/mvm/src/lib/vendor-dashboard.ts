/**
 * MVM Vendor Dashboard
 * 
 * Data contracts and utilities for vendor-specific dashboards.
 * 
 * RULES:
 * - Strict data isolation - vendors see ONLY their data
 * - No access to other vendors
 * - No access to tenant internals
 * - Read-only access to their performance metrics
 */

// ============================================================================
// DASHBOARD DATA CONTRACTS
// ============================================================================

/**
 * Vendor dashboard overview
 */
export interface VendorDashboardOverview {
  vendorId: string
  vendorName: string
  tenantId: string
  
  // Key metrics
  metrics: {
    totalSales: number
    totalOrders: number
    pendingOrders: number
    averageRating: number | null
    reviewCount: number
    conversionRate: number | null // If available
  }
  
  // Period comparison (e.g., this month vs last month)
  comparison: {
    period: 'day' | 'week' | 'month'
    salesChange: number // Percentage change
    ordersChange: number
  }
  
  // Status
  vendorStatus: string
  tierName: string | null
  commissionRate: number
  
  // Earnings
  earnings: {
    pendingPayout: number
    lastPayoutAmount: number | null
    lastPayoutDate: string | null
    lifetimeEarnings: number
  }
}

/**
 * Vendor orders list view
 */
export interface VendorOrdersView {
  vendorId: string
  orders: VendorOrderSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  filters: {
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  }
}

export interface VendorOrderSummary {
  subOrderId: string
  subOrderNumber: string
  parentOrderNumber: string
  status: string
  customerName: string | null
  itemCount: number
  grandTotal: number
  commissionAmount: number
  vendorEarnings: number
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
}

/**
 * Vendor order detail view
 */
export interface VendorOrderDetail {
  subOrderId: string
  subOrderNumber: string
  parentOrderNumber: string
  status: string
  
  // Customer info (limited - no email/phone for privacy)
  customer: {
    name: string | null
    shippingAddress: {
      city: string
      state: string | null
      country: string
    }
  }
  
  // Items
  items: Array<{
    productId: string
    productName: string
    variantName: string | null
    imageUrl: string | null
    sku: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
    fulfilledQuantity: number
  }>
  
  // Financials
  financials: {
    subtotal: number
    shippingTotal: number
    taxTotal: number
    discountTotal: number
    grandTotal: number
    commissionRate: number
    commissionAmount: number
    vendorEarnings: number
  }
  
  // Fulfillment
  fulfillment: {
    shippingMethod: string | null
    trackingNumber: string | null
    trackingUrl: string | null
    shippedAt: string | null
    deliveredAt: string | null
  }
  
  // Timeline
  timeline: Array<{
    status: string
    timestamp: string
    note: string | null
  }>
  
  createdAt: string
  updatedAt: string
}

/**
 * Vendor products view
 */
export interface VendorProductsView {
  vendorId: string
  products: VendorProductSummary[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  stats: {
    totalProducts: number
    activeProducts: number
    featuredProducts: number
  }
}

export interface VendorProductSummary {
  mappingId: string
  productId: string
  productName: string // From Core
  variantId: string | null
  variantName: string | null
  imageUrl: string | null
  vendorPrice: number | null
  corePrice: number // From Core
  isActive: boolean
  isFeatured: boolean
  totalSold: number
  revenue: number
}

/**
 * Vendor earnings view
 */
export interface VendorEarningsView {
  vendorId: string
  summary: {
    lifetimeEarnings: number
    lifetimeCommission: number
    pendingPayout: number
    lastPayoutAmount: number | null
    lastPayoutDate: string | null
    nextPayoutDate: string | null
    minimumPayoutThreshold: number
    payoutFrequency: string
  }
  
  // Recent payouts
  payouts: Array<{
    id: string
    reference: string | null
    grossAmount: number
    commissionAmount: number
    netAmount: number
    status: string
    periodStart: string | null
    periodEnd: string | null
    scheduledAt: string | null
    completedAt: string | null
  }>
  
  // Earnings by period
  periodBreakdown: Array<{
    period: string // e.g., "2024-01", "2024-W01"
    grossSales: number
    commissionPaid: number
    netEarnings: number
    orderCount: number
  }>
}

/**
 * Vendor performance metrics
 */
export interface VendorPerformanceView {
  vendorId: string
  period: 'week' | 'month' | 'quarter' | 'year'
  
  metrics: {
    salesTotal: number
    orderCount: number
    averageOrderValue: number
    conversionRate: number | null
    returnRate: number
    fulfillmentRate: number
    averageShippingTime: number | null // hours
    responseTime: number | null // hours to accept orders
  }
  
  ratings: {
    averageRating: number | null
    reviewCount: number
    fiveStarPercent: number
    oneStarPercent: number
    recentReviews: Array<{
      rating: number
      title: string | null
      createdAt: string
    }>
  }
  
  // Comparison with previous period
  comparison: {
    salesChange: number
    ordersChange: number
    ratingChange: number | null
  }
  
  // Tier progress
  tierProgress: {
    currentTier: string
    nextTier: string | null
    requirements: Array<{
      metric: string
      current: number
      required: number
      met: boolean
    }>
  } | null
}

// ============================================================================
// DATA ACCESS HELPERS
// ============================================================================

/**
 * Vendor data access - ensures isolation
 */
export class VendorDataAccess {
  /**
   * Validate that requested data belongs to the vendor
   */
  static validateAccess(
    requestedVendorId: string,
    authenticatedVendorId: string
  ): { allowed: boolean; error?: string } {
    if (requestedVendorId !== authenticatedVendorId) {
      return {
        allowed: false,
        error: 'Access denied: You can only view your own data'
      }
    }
    return { allowed: true }
  }
  
  /**
   * Filter sub-orders to only vendor's orders
   */
  static filterVendorOrders<T extends { vendorId: string }>(
    orders: T[],
    vendorId: string
  ): T[] {
    return orders.filter(order => order.vendorId === vendorId)
  }
  
  /**
   * Sanitize customer data for vendor view
   */
  static sanitizeCustomerData(customer: {
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: {
      city?: string
      state?: string
      country?: string
      addressLine1?: string
      addressLine2?: string
      postalCode?: string
    }
  }): {
    name: string | null
    shippingAddress: {
      city: string
      state: string | null
      country: string
    }
  } {
    // Vendors only see limited customer info
    return {
      name: customer.name || null,
      shippingAddress: {
        city: customer.address?.city || 'Unknown',
        state: customer.address?.state || null,
        country: customer.address?.country || 'Unknown'
      }
    }
  }
  
  /**
   * Calculate period comparison metrics
   */
  static calculatePeriodComparison(
    currentValue: number,
    previousValue: number
  ): number {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0
    }
    return Math.round(((currentValue - previousValue) / previousValue) * 100)
  }
  
  /**
   * Generate period labels
   */
  static getPeriodLabels(
    period: 'day' | 'week' | 'month',
    count: number
  ): string[] {
    const labels: string[] = []
    const now = new Date()
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now)
      
      switch (period) {
        case 'day':
          date.setDate(date.getDate() - i)
          labels.push(date.toISOString().split('T')[0])
          break
        case 'week':
          date.setDate(date.getDate() - (i * 7))
          const weekNum = Math.ceil((date.getDate()) / 7)
          labels.push(`${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`)
          break
        case 'month':
          date.setMonth(date.getMonth() - i)
          labels.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`)
          break
      }
    }
    
    return labels
  }
}

// ============================================================================
// VENDOR NOTIFICATION PREFERENCES
// ============================================================================

export interface VendorNotificationPreferences {
  vendorId: string
  
  // Email notifications
  email: {
    newOrders: boolean
    orderStatusChanges: boolean
    payoutNotifications: boolean
    reviewNotifications: boolean
    promotionalUpdates: boolean
    weeklyDigest: boolean
  }
  
  // In-app notifications
  inApp: {
    newOrders: boolean
    lowStock: boolean
    reviews: boolean
  }
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<VendorNotificationPreferences, 'vendorId'> = {
  email: {
    newOrders: true,
    orderStatusChanges: true,
    payoutNotifications: true,
    reviewNotifications: true,
    promotionalUpdates: false,
    weeklyDigest: true
  },
  inApp: {
    newOrders: true,
    lowStock: true,
    reviews: true
  }
}

// VendorDataAccess and DEFAULT_NOTIFICATION_PREFERENCES are exported inline
