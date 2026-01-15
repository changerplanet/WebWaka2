/**
 * SVM Social Proof Service (Wave G3)
 * 
 * Provides read-only social proof signals derived from real purchase data.
 * 
 * Constraints:
 * - NO dark patterns
 * - NO fake urgency
 * - NO fake scarcity
 * - NO countdown timers
 * - NO manipulative nudges
 * - NO cross-tenant leakage
 * - Demo vs live clearly labeled
 * - All signals derived from real data
 * 
 * @module lib/svm/social-proof-service
 */

import { prisma } from '../prisma'
import { SvmOrderStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductSocialProof {
  productId: string
  purchasesToday: number
  purchasesThisWeek: number
  isPopular: boolean
  popularityBadge: PopularityBadge | null
  recentPurchases: RecentPurchase[]
  popularInCities: string[]
  isDemo: boolean
}

export interface RecentPurchase {
  timestamp: Date
  city: string | null
  displayTime: string
}

export type PopularityBadge = 
  | 'BESTSELLER'      // Top 10% by sales this week
  | 'TRENDING'        // 50%+ increase vs last week
  | 'POPULAR'         // Above average sales
  | null

export interface TenantSocialProofConfig {
  enabled: boolean
  showPurchaseCount: boolean
  showRecentPurchases: boolean
  showPopularityBadges: boolean
  showCityPopularity: boolean
  recentPurchaseThrottleMinutes: number
  maxRecentPurchasesToShow: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TenantSocialProofConfig = {
  enabled: true,
  showPurchaseCount: true,
  showRecentPurchases: true,
  showPopularityBadges: true,
  showCityPopularity: true,
  recentPurchaseThrottleMinutes: 15,
  maxRecentPurchasesToShow: 3
}

const DEMO_TENANT_ID = 'demo-tenant-001'

const NIGERIAN_CITIES = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt',
  'Benin City', 'Kaduna', 'Enugu', 'Onitsha', 'Warri'
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractCityFromAddress(shippingAddress: unknown): string | null {
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return null
  }
  
  const addr = shippingAddress as Record<string, unknown>
  const city = addr.city || addr.lga || addr.state
  
  if (typeof city === 'string' && city.length > 0) {
    return city
  }
  
  return null
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) {
    return 'Just now'
  } else if (diffMins < 60) {
    return `${diffMins} min ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return 'Recently'
  }
}

function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date()
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)
  return date >= cutoff
}

function isWithinDays(date: Date, days: number): boolean {
  return isWithinHours(date, days * 24)
}

// ============================================================================
// CORE SERVICE FUNCTIONS
// ============================================================================

/**
 * Get social proof data for a single product
 * All data derived from real purchases - no fake signals
 */
export async function getProductSocialProof(
  tenantId: string,
  productId: string,
  config: Partial<TenantSocialProofConfig> = {}
): Promise<ProductSocialProof> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const isDemo = tenantId === DEMO_TENANT_ID
  
  if (!mergedConfig.enabled) {
    return {
      productId,
      purchasesToday: 0,
      purchasesThisWeek: 0,
      isPopular: false,
      popularityBadge: null,
      recentPurchases: [],
      popularInCities: [],
      isDemo
    }
  }
  
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const completedStatuses: SvmOrderStatus[] = [
    SvmOrderStatus.CONFIRMED,
    SvmOrderStatus.PROCESSING,
    SvmOrderStatus.SHIPPED,
    SvmOrderStatus.DELIVERED
  ]
  
  const orderItems = await prisma.svm_order_items.findMany({
    where: {
      productId,
      svm_orders: {
        tenantId,
        status: { in: completedStatuses },
        createdAt: { gte: weekStart }
      }
    },
    include: {
      svm_orders: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  const purchasesToday = orderItems.filter(item => 
    isWithinHours(item.svm_orders.createdAt, 24)
  ).reduce((sum, item) => sum + item.quantity, 0)
  
  const purchasesThisWeek = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  
  const cityCounts = new Map<string, number>()
  orderItems.forEach(item => {
    const city = extractCityFromAddress(item.svm_orders.shippingAddress)
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) || 0) + item.quantity)
    }
  })
  
  const popularInCities = Array.from(cityCounts.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city)
  
  const throttleMs = mergedConfig.recentPurchaseThrottleMinutes * 60 * 1000
  const throttledPurchases: RecentPurchase[] = []
  let lastShownTime = Infinity
  
  for (const item of orderItems) {
    if (throttledPurchases.length >= mergedConfig.maxRecentPurchasesToShow) break
    
    const purchaseTime = item.svm_orders.createdAt.getTime()
    if (lastShownTime - purchaseTime >= throttleMs || throttledPurchases.length === 0) {
      const city = extractCityFromAddress(item.svm_orders.shippingAddress)
      throttledPurchases.push({
        timestamp: item.svm_orders.createdAt,
        city,
        displayTime: formatRelativeTime(item.svm_orders.createdAt)
      })
      lastShownTime = purchaseTime
    }
  }
  
  const popularityBadge = calculatePopularityBadge(purchasesToday, purchasesThisWeek)
  const isPopular = purchasesThisWeek >= 5 || purchasesToday >= 2
  
  return {
    productId,
    purchasesToday: mergedConfig.showPurchaseCount ? purchasesToday : 0,
    purchasesThisWeek: mergedConfig.showPurchaseCount ? purchasesThisWeek : 0,
    isPopular: mergedConfig.showPopularityBadges ? isPopular : false,
    popularityBadge: mergedConfig.showPopularityBadges ? popularityBadge : null,
    recentPurchases: mergedConfig.showRecentPurchases ? throttledPurchases : [],
    popularInCities: mergedConfig.showCityPopularity ? popularInCities : [],
    isDemo
  }
}

/**
 * Get social proof data for multiple products (batch)
 * More efficient for product listing pages
 */
export async function getBatchProductSocialProof(
  tenantId: string,
  productIds: string[],
  config: Partial<TenantSocialProofConfig> = {}
): Promise<Map<string, ProductSocialProof>> {
  const results = new Map<string, ProductSocialProof>()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const isDemo = tenantId === DEMO_TENANT_ID
  
  if (!mergedConfig.enabled || productIds.length === 0) {
    productIds.forEach(id => {
      results.set(id, {
        productId: id,
        purchasesToday: 0,
        purchasesThisWeek: 0,
        isPopular: false,
        popularityBadge: null,
        recentPurchases: [],
        popularInCities: [],
        isDemo
      })
    })
    return results
  }
  
  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const completedStatuses: SvmOrderStatus[] = [
    SvmOrderStatus.CONFIRMED,
    SvmOrderStatus.PROCESSING,
    SvmOrderStatus.SHIPPED,
    SvmOrderStatus.DELIVERED
  ]
  
  const orderItems = await prisma.svm_order_items.findMany({
    where: {
      productId: { in: productIds },
      svm_orders: {
        tenantId,
        status: { in: completedStatuses },
        createdAt: { gte: weekStart }
      }
    },
    include: {
      svm_orders: true
    }
  })
  
  const productData = new Map<string, {
    todayCount: number
    weekCount: number
    cities: Map<string, number>
  }>()
  
  productIds.forEach(id => {
    productData.set(id, { todayCount: 0, weekCount: 0, cities: new Map() })
  })
  
  orderItems.forEach(item => {
    const data = productData.get(item.productId)
    if (!data) return
    
    data.weekCount += item.quantity
    
    if (isWithinHours(item.svm_orders.createdAt, 24)) {
      data.todayCount += item.quantity
    }
    
    const city = extractCityFromAddress(item.svm_orders.shippingAddress)
    if (city) {
      data.cities.set(city, (data.cities.get(city) || 0) + item.quantity)
    }
  })
  
  productIds.forEach(productId => {
    const data = productData.get(productId)!
    const popularInCities = Array.from(data.cities.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([city]) => city)
    
    const popularityBadge = calculatePopularityBadge(data.todayCount, data.weekCount)
    
    results.set(productId, {
      productId,
      purchasesToday: mergedConfig.showPurchaseCount ? data.todayCount : 0,
      purchasesThisWeek: mergedConfig.showPurchaseCount ? data.weekCount : 0,
      isPopular: data.weekCount >= 5 || data.todayCount >= 2,
      popularityBadge: mergedConfig.showPopularityBadges ? popularityBadge : null,
      recentPurchases: [],
      popularInCities: mergedConfig.showCityPopularity ? popularInCities : [],
      isDemo
    })
  })
  
  return results
}

/**
 * Calculate popularity badge based on real sales data
 * No fake badges - all derived from actual purchases
 */
function calculatePopularityBadge(todayCount: number, weekCount: number): PopularityBadge {
  if (weekCount >= 20 || todayCount >= 10) {
    return 'BESTSELLER'
  }
  
  if (todayCount >= 5 && weekCount > 0 && (todayCount / (weekCount / 7)) >= 1.5) {
    return 'TRENDING'
  }
  
  if (weekCount >= 10 || todayCount >= 3) {
    return 'POPULAR'
  }
  
  return null
}

/**
 * Get recent store-wide activity (privacy-safe, throttled)
 * Shows anonymized purchase activity for store credibility
 */
export async function getRecentStoreActivity(
  tenantId: string,
  limit: number = 5
): Promise<{
  recentPurchases: { productName: string; city: string | null; timeAgo: string }[]
  isDemo: boolean
}> {
  const isDemo = tenantId === DEMO_TENANT_ID
  const hoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const completedStatuses: SvmOrderStatus[] = [
    SvmOrderStatus.CONFIRMED,
    SvmOrderStatus.PROCESSING,
    SvmOrderStatus.SHIPPED,
    SvmOrderStatus.DELIVERED
  ]
  
  const recentOrders = await prisma.svm_orders.findMany({
    where: {
      tenantId,
      status: { in: completedStatuses },
      createdAt: { gte: hoursAgo }
    },
    include: {
      svm_order_items: {
        take: 1,
        select: {
          productName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2
  })
  
  const throttledResults: { productName: string; city: string | null; timeAgo: string }[] = []
  let lastTime = Date.now()
  const throttleMs = 10 * 60 * 1000
  
  for (const order of recentOrders) {
    if (throttledResults.length >= limit) break
    
    const orderTime = order.createdAt.getTime()
    if (orderTime <= lastTime - throttleMs || throttledResults.length === 0) {
      const productName = order.svm_order_items[0]?.productName || 'Product'
      const city = extractCityFromAddress(order.shippingAddress)
      
      throttledResults.push({
        productName: productName.length > 30 ? productName.substring(0, 27) + '...' : productName,
        city,
        timeAgo: formatRelativeTime(order.createdAt)
      })
      lastTime = orderTime
    }
  }
  
  return {
    recentPurchases: throttledResults,
    isDemo
  }
}

// ============================================================================
// DEMO DATA GENERATION
// ============================================================================

/**
 * Generate demo social proof data for testing
 * Clearly marked as demo data - not real purchases
 */
export function generateDemoSocialProof(productId: string): ProductSocialProof {
  const randomToday = Math.floor(Math.random() * 15) + 1
  const randomWeek = randomToday + Math.floor(Math.random() * 30)
  
  const demoCities = NIGERIAN_CITIES.slice(0, Math.floor(Math.random() * 3) + 1)
  
  return {
    productId,
    purchasesToday: randomToday,
    purchasesThisWeek: randomWeek,
    isPopular: randomWeek > 10,
    popularityBadge: randomWeek > 20 ? 'BESTSELLER' : randomWeek > 10 ? 'POPULAR' : null,
    recentPurchases: [
      { timestamp: new Date(Date.now() - 15 * 60000), city: 'Lagos', displayTime: '15 min ago' },
      { timestamp: new Date(Date.now() - 45 * 60000), city: 'Abuja', displayTime: '45 min ago' }
    ],
    popularInCities: demoCities,
    isDemo: true
  }
}
