/**
 * MVM Vendor Rating Service (Wave G1)
 * 
 * Handles vendor ratings, aggregation, and score calculation.
 * Read-only trust layer - no enforcement or penalties.
 * 
 * @module lib/mvm/vendor-rating-service
 * @canonical Wave G1 - Differentiators & Scale
 */

import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface SubmitRatingInput {
  tenantId: string
  vendorId: string
  subOrderId: string
  parentOrderId: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  rating: number
  comment?: string
  orderDeliveredAt?: Date
  isDemo?: boolean
}

export interface VendorRatingResult {
  id: string
  vendorId: string
  rating: number
  comment?: string | null
  customerName?: string | null
  isVerifiedPurchase: boolean
  createdAt: Date
}

export interface RatingSummary {
  vendorId: string
  totalRatings: number
  averageRating: number
  rating1Count: number
  rating2Count: number
  rating3Count: number
  rating4Count: number
  rating5Count: number
  scoreBand: ScoreBand
  recentOrdersTotal: number
  recentOrdersOnTime: number
  recentOrdersCancelled: number
}

export interface RatingListFilters {
  tenantId: string
  vendorId: string
  minRating?: number
  maxRating?: number
  includeDemo?: boolean
  page?: number
  pageSize?: number
}

export interface RatingListResult {
  ratings: VendorRatingResult[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ScoreBand = 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEW'

// ============================================================================
// SCORE BAND CALCULATION
// ============================================================================

function calculateScoreBand(averageRating: number, totalRatings: number): ScoreBand {
  // Wave G1 Score Band Thresholds:
  // EXCELLENT: ≥4.5 average with ≥5 ratings
  // GOOD: ≥3.5 average with ≥3 ratings
  // NEEDS_ATTENTION: <3.0 average with ≥3 ratings
  // NEW: all other cases (including <3 ratings or 3.0-3.49 with insufficient volume)
  
  if (totalRatings < 3) return 'NEW'
  
  if (averageRating >= 4.5 && totalRatings >= 5) return 'EXCELLENT'
  if (averageRating >= 3.5 && totalRatings >= 3) return 'GOOD'
  if (averageRating < 3.0 && totalRatings >= 3) return 'NEEDS_ATTENTION'
  
  return 'NEW'
}

// ============================================================================
// WEIGHTING LOGIC
// ============================================================================

interface WeightedRating {
  rating: number
  weight: number
}

function calculateWeightedAverage(ratings: WeightedRating[]): number {
  if (ratings.length === 0) return 0
  
  const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0)
  if (totalWeight === 0) return 0
  
  const weightedSum = ratings.reduce((sum, r) => sum + (r.rating * r.weight), 0)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

function getRecencyWeight(createdAt: Date): number {
  const now = new Date()
  const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysOld <= 30) return 1.0
  if (daysOld <= 90) return 0.8
  if (daysOld <= 180) return 0.6
  if (daysOld <= 365) return 0.4
  return 0.2
}

// ============================================================================
// VENDOR RATING SERVICE
// ============================================================================

export const VendorRatingService = {
  /**
   * Submit a rating for a vendor (post-delivery only)
   */
  async submitRating(input: SubmitRatingInput): Promise<{ id: string; success: boolean }> {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    
    const existingRating = await prisma.mvm_vendor_rating.findUnique({
      where: { subOrderId: input.subOrderId }
    })
    
    if (existingRating) {
      throw new Error('A rating has already been submitted for this order')
    }
    
    const rating = await prisma.mvm_vendor_rating.create({
      data: {
        tenantId: input.tenantId,
        vendorId: input.vendorId,
        subOrderId: input.subOrderId,
        parentOrderId: input.parentOrderId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        rating: input.rating,
        comment: input.comment,
        orderDeliveredAt: input.orderDeliveredAt,
        isVerifiedPurchase: true,
        isDemo: input.isDemo ?? false,
        isVisible: true
      }
    })
    
    await this.recalculateSummary(input.tenantId, input.vendorId)
    
    return { id: rating.id, success: true }
  },
  
  /**
   * Get ratings for a vendor
   */
  async getVendorRatings(filters: RatingListFilters): Promise<RatingListResult> {
    const {
      tenantId,
      vendorId,
      minRating,
      maxRating,
      includeDemo = false,
      page = 1,
      pageSize = 20
    } = filters
    
    const where: Prisma.mvm_vendor_ratingWhereInput = {
      tenantId,
      vendorId,
      isVisible: true,
      ...(minRating && { rating: { gte: minRating } }),
      ...(maxRating && { rating: { lte: maxRating } }),
      ...(!includeDemo && { isDemo: false })
    }
    
    const [ratings, total] = await Promise.all([
      prisma.mvm_vendor_rating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_vendor_rating.count({ where })
    ])
    
    return {
      ratings: ratings.map(r => ({
        id: r.id,
        vendorId: r.vendorId,
        rating: r.rating,
        comment: r.comment,
        customerName: r.customerName,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Get rating summary for a vendor
   */
  async getRatingSummary(tenantId: string, vendorId: string): Promise<RatingSummary | null> {
    let summary = await prisma.mvm_vendor_rating_summary.findUnique({
      where: { vendorId }
    })
    
    if (!summary) {
      summary = await this.recalculateSummary(tenantId, vendorId)
    }
    
    if (!summary) return null
    
    return {
      vendorId: summary.vendorId,
      totalRatings: summary.totalRatings,
      averageRating: summary.averageRating.toNumber(),
      rating1Count: summary.rating1Count,
      rating2Count: summary.rating2Count,
      rating3Count: summary.rating3Count,
      rating4Count: summary.rating4Count,
      rating5Count: summary.rating5Count,
      scoreBand: summary.scoreBand as ScoreBand,
      recentOrdersTotal: summary.recentOrdersTotal,
      recentOrdersOnTime: summary.recentOrdersOnTime,
      recentOrdersCancelled: summary.recentOrdersCancelled
    }
  },
  
  /**
   * Recalculate rating summary for a vendor
   */
  async recalculateSummary(tenantId: string, vendorId: string) {
    const ratings = await prisma.mvm_vendor_rating.findMany({
      where: {
        tenantId,
        vendorId,
        isVisible: true,
        isDemo: false
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (ratings.length === 0) {
      return prisma.mvm_vendor_rating_summary.upsert({
        where: { vendorId },
        create: {
          tenantId,
          vendorId,
          totalRatings: 0,
          averageRating: 0,
          rating1Count: 0,
          rating2Count: 0,
          rating3Count: 0,
          rating4Count: 0,
          rating5Count: 0,
          scoreBand: 'NEW',
          lastCalculatedAt: new Date()
        },
        update: {
          totalRatings: 0,
          averageRating: 0,
          rating1Count: 0,
          rating2Count: 0,
          rating3Count: 0,
          rating4Count: 0,
          rating5Count: 0,
          scoreBand: 'NEW',
          lastCalculatedAt: new Date()
        }
      })
    }
    
    const weightedRatings: WeightedRating[] = ratings.map(r => ({
      rating: r.rating,
      weight: getRecencyWeight(r.createdAt)
    }))
    
    const weightedAverage = calculateWeightedAverage(weightedRatings)
    
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating as 1|2|3|4|5]++
      }
    })
    
    const scoreBand = calculateScoreBand(weightedAverage, ratings.length)
    
    const summary = await prisma.mvm_vendor_rating_summary.upsert({
      where: { vendorId },
      create: {
        tenantId,
        vendorId,
        totalRatings: ratings.length,
        averageRating: weightedAverage,
        rating1Count: ratingCounts[1],
        rating2Count: ratingCounts[2],
        rating3Count: ratingCounts[3],
        rating4Count: ratingCounts[4],
        rating5Count: ratingCounts[5],
        scoreBand,
        lastCalculatedAt: new Date()
      },
      update: {
        totalRatings: ratings.length,
        averageRating: weightedAverage,
        rating1Count: ratingCounts[1],
        rating2Count: ratingCounts[2],
        rating3Count: ratingCounts[3],
        rating4Count: ratingCounts[4],
        rating5Count: ratingCounts[5],
        scoreBand,
        lastCalculatedAt: new Date()
      }
    })
    
    await prisma.mvm_vendor.updateMany({
      where: { id: vendorId, tenantId },
      data: {
        averageRating: weightedAverage,
        reviewCount: ratings.length
      }
    })
    
    return summary
  },
  
  /**
   * Check if order can be rated (is delivered and not already rated)
   */
  async canRateOrder(subOrderId: string): Promise<{ canRate: boolean; reason?: string }> {
    const existingRating = await prisma.mvm_vendor_rating.findUnique({
      where: { subOrderId }
    })
    
    if (existingRating) {
      return { canRate: false, reason: 'Order has already been rated' }
    }
    
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      select: { status: true }
    })
    
    if (!subOrder) {
      return { canRate: false, reason: 'Order not found' }
    }
    
    if (subOrder.status !== 'DELIVERED') {
      return { canRate: false, reason: 'Order must be delivered before rating' }
    }
    
    return { canRate: true }
  },
  
  /**
   * Get pending rating opportunities for a customer
   */
  async getPendingRatings(tenantId: string, customerId: string): Promise<{
    subOrderId: string
    vendorId: string
    vendorName: string
    subOrderNumber: string
    deliveredAt: Date
  }[]> {
    const deliveredOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId,
        status: 'DELIVERED'
      },
      include: {
        vendor: { select: { id: true, name: true } }
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50
    })
    
    const existingRatings = await prisma.mvm_vendor_rating.findMany({
      where: {
        tenantId,
        customerId,
        subOrderId: { in: deliveredOrders.map(o => o.id) }
      },
      select: { subOrderId: true }
    })
    
    const ratedSubOrderIds = new Set(existingRatings.map(r => r.subOrderId))
    
    return deliveredOrders
      .filter(o => !ratedSubOrderIds.has(o.id))
      .map(o => ({
        subOrderId: o.id,
        vendorId: o.vendor.id,
        vendorName: o.vendor.name,
        subOrderNumber: o.subOrderNumber,
        deliveredAt: o.deliveredAt || o.updatedAt
      }))
  },
  
  /**
   * Get vendor quality overview for admin
   */
  async getAdminQualityOverview(tenantId: string, filters?: {
    scoreBand?: ScoreBand
    minRating?: number
    page?: number
    pageSize?: number
  }): Promise<{
    vendors: {
      id: string
      name: string
      slug: string
      averageRating: number
      totalRatings: number
      scoreBand: ScoreBand
      recentOrdersOnTime: number
      recentOrdersCancelled: number
    }[]
    total: number
    summary: {
      excellent: number
      good: number
      needsAttention: number
      new: number
    }
  }> {
    const { scoreBand, minRating, page = 1, pageSize = 20 } = filters || {}
    
    const [bandCounts, summaries] = await Promise.all([
      prisma.mvm_vendor_rating_summary.groupBy({
        by: ['scoreBand'],
        where: { tenantId },
        _count: { scoreBand: true }
      }),
      prisma.mvm_vendor_rating_summary.findMany({
        where: {
          tenantId,
          ...(scoreBand && { scoreBand }),
          ...(minRating && { averageRating: { gte: minRating } })
        },
        orderBy: { averageRating: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])
    
    const vendorIds = summaries.map(s => s.vendorId)
    const vendors = await prisma.mvm_vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true, slug: true }
    })
    
    const vendorMap = new Map(vendors.map(v => [v.id, v]))
    
    const summary = {
      excellent: 0,
      good: 0,
      needsAttention: 0,
      new: 0
    }
    
    bandCounts.forEach(bc => {
      const band = bc.scoreBand
      if (band === 'EXCELLENT') summary.excellent = bc._count.scoreBand
      else if (band === 'GOOD') summary.good = bc._count.scoreBand
      else if (band === 'NEEDS_ATTENTION') summary.needsAttention = bc._count.scoreBand
      else if (band === 'NEW') summary.new = bc._count.scoreBand
    })
    
    return {
      vendors: summaries.map(s => {
        const vendor = vendorMap.get(s.vendorId)
        return {
          id: s.vendorId,
          name: vendor?.name || 'Unknown',
          slug: vendor?.slug || '',
          averageRating: s.averageRating.toNumber(),
          totalRatings: s.totalRatings,
          scoreBand: s.scoreBand as ScoreBand,
          recentOrdersOnTime: s.recentOrdersOnTime,
          recentOrdersCancelled: s.recentOrdersCancelled
        }
      }),
      total: summaries.length,
      summary
    }
  },
  
  /**
   * Get trust badge info for display
   */
  async getTrustBadge(vendorId: string): Promise<{
    scoreBand: ScoreBand
    averageRating: number
    totalRatings: number
    displayText: string
  } | null> {
    const summary = await prisma.mvm_vendor_rating_summary.findUnique({
      where: { vendorId }
    })
    
    if (!summary) return null
    
    const displayTextMap: Record<ScoreBand, string> = {
      'EXCELLENT': 'Top Rated',
      'GOOD': 'Trusted Seller',
      'NEEDS_ATTENTION': '',
      'NEW': 'New Seller'
    }
    
    return {
      scoreBand: summary.scoreBand as ScoreBand,
      averageRating: summary.averageRating.toNumber(),
      totalRatings: summary.totalRatings,
      displayText: displayTextMap[summary.scoreBand as ScoreBand] || ''
    }
  }
}
