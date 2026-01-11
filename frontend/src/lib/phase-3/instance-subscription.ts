/**
 * PHASE 3: Instance Subscription Service
 * 
 * Manages subscriptions scoped to Platform Instances.
 * Partners control client pricing.
 * WebWaka tracks wholesale costs.
 * 
 * RULES:
 * - Subscriptions belong to platformInstanceId
 * - Partner defines price to client
 * - WebWaka has wholesale cost
 * - Tenant core access remains if one instance suspended
 */

import { prisma } from '../prisma'
import { InstanceSubscriptionStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { withPrismaDefaults } from '../db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInstanceSubscriptionInput {
  platformInstanceId: string
  partnerId: string
  planId?: string
  
  // Billing
  billingInterval?: 'monthly' | 'yearly' | 'custom'
  amount: number
  currency?: string
  wholesaleCost: number
  
  // Trial (optional)
  trialDays?: number
  
  // Metadata
  metadata?: Record<string, any>
}

export interface UpdateInstanceSubscriptionInput {
  amount?: number
  wholesaleCost?: number
  billingInterval?: string
  metadata?: Record<string, any>
}

export interface InstanceSubscriptionResult {
  success: boolean
  subscription?: any
  error?: string
  errorCode?: string
}

// ============================================================================
// CREATE SUBSCRIPTION
// ============================================================================

/**
 * Create a subscription for a platform instance.
 * Only Partners can create subscriptions for their clients.
 */
export async function createInstanceSubscription(
  input: CreateInstanceSubscriptionInput
): Promise<InstanceSubscriptionResult> {
  try {
    // Validate instance exists
    const instance = await prisma.platformInstance.findUnique({
      where: { id: input.platformInstanceId },
      include: { tenant: true }
    })
    
    if (!instance) {
      return {
        success: false,
        error: 'Platform instance not found',
        errorCode: 'INSTANCE_NOT_FOUND',
      }
    }
    
    // Check for existing subscription
    const existing = await prisma.instanceSubscription.findUnique({
      where: { platformInstanceId: input.platformInstanceId }
    })
    
    if (existing) {
      return {
        success: false,
        error: 'Instance already has a subscription',
        errorCode: 'SUBSCRIPTION_EXISTS',
      }
    }
    
    // Calculate period dates
    const now = new Date()
    const periodStart = now
    const periodEnd = new Date(now)
    
    if (input.billingInterval === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }
    
    // Handle trial
    let trialStart: Date | null = null
    let trialEnd: Date | null = null
    let status: InstanceSubscriptionStatus = 'ACTIVE'
    
    if (input.trialDays && input.trialDays > 0) {
      trialStart = now
      trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + input.trialDays)
      status = 'TRIAL'
    }
    
    // Calculate partner margin
    const partnerMargin = input.amount - input.wholesaleCost
    
    // Create subscription
    const subscription = await prisma.instanceSubscription.create({
      data: withPrismaDefaults({
        platformInstanceId: input.platformInstanceId,
        partnerId: input.partnerId,
        planId: input.planId || null,
        status,
        billingInterval: input.billingInterval || 'monthly',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        amount: input.amount,
        currency: input.currency || 'NGN',
        wholesaleCost: input.wholesaleCost,
        partnerMargin,
        trialStart,
        trialEnd,
        metadata: input.metadata ? input.metadata : undefined,
      })
    })
    
    // Update instance with partner if not set
    if (!instance.createdByPartnerId) {
      await prisma.platformInstance.update({
        where: { id: input.platformInstanceId },
        data: { createdByPartnerId: input.partnerId }
      })
    }
    
    return { success: true, subscription }
  } catch (error) {
    console.error('Failed to create instance subscription:', error)
    return {
      success: false,
      error: 'Failed to create subscription',
      errorCode: 'CREATE_FAILED',
    }
  }
}

// ============================================================================
// GET SUBSCRIPTION
// ============================================================================

/**
 * Get subscription for an instance
 */
export async function getInstanceSubscription(
  platformInstanceId: string
): Promise<any | null> {
  return prisma.instanceSubscription.findUnique({
    where: { platformInstanceId },
    include: {
      platformInstance: {
        select: {
          id: true,
          name: true,
          slug: true,
          tenantId: true,
        }
      },
      partner: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    }
  })
}

/**
 * Get all subscriptions for a partner
 */
export async function getPartnerSubscriptions(
  partnerId: string,
  options?: {
    status?: InstanceSubscriptionStatus[]
    limit?: number
    offset?: number
  }
): Promise<{ subscriptions: any[]; total: number }> {
  const where: any = { partnerId }
  
  if (options?.status?.length) {
    where.status = { in: options.status }
  }
  
  const [subscriptions, total] = await Promise.all([
    prisma.instanceSubscription.findMany({
      where,
      include: {
        platformInstance: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.instanceSubscription.count({ where })
  ])
  
  return { subscriptions, total }
}

// ============================================================================
// UPDATE SUBSCRIPTION
// ============================================================================

/**
 * Update subscription pricing
 */
export async function updateInstanceSubscription(
  subscriptionId: string,
  input: UpdateInstanceSubscriptionInput
): Promise<InstanceSubscriptionResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: subscriptionId }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    // Calculate new margin if amounts changed
    const newAmount = input.amount ?? Number(subscription.amount)
    const newWholesale = input.wholesaleCost ?? Number(subscription.wholesaleCost)
    const newMargin = newAmount - newWholesale
    
    const updated = await prisma.instanceSubscription.update({
      where: { id: subscriptionId },
      data: {
        amount: input.amount,
        wholesaleCost: input.wholesaleCost,
        partnerMargin: newMargin,
        billingInterval: input.billingInterval,
        metadata: input.metadata,
      }
    })
    
    return { success: true, subscription: updated }
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return {
      success: false,
      error: 'Failed to update subscription',
      errorCode: 'UPDATE_FAILED',
    }
  }
}

// ============================================================================
// SUSPEND / RESUME
// ============================================================================

/**
 * Suspend an instance subscription.
 * The instance becomes inaccessible but data is preserved.
 * Other instances in the tenant remain accessible.
 */
export async function suspendInstanceSubscription(
  subscriptionId: string,
  reason?: string
): Promise<InstanceSubscriptionResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { platformInstance: true }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    if (subscription.status === 'SUSPENDED') {
      return {
        success: false,
        error: 'Subscription is already suspended',
        errorCode: 'ALREADY_SUSPENDED',
      }
    }
    
    // Update subscription and instance
    const now = new Date()
    
    await prisma.$transaction([
      prisma.instanceSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: now,
          suspendedReason: reason,
        }
      }),
      prisma.platformInstance.update({
        where: { id: subscription.platformInstanceId },
        data: {
          suspendedAt: now,
          suspendedReason: reason,
        }
      })
    ])
    
    return { success: true }
  } catch (error) {
    console.error('Failed to suspend subscription:', error)
    return {
      success: false,
      error: 'Failed to suspend subscription',
      errorCode: 'SUSPEND_FAILED',
    }
  }
}

/**
 * Resume a suspended instance subscription.
 */
export async function resumeInstanceSubscription(
  subscriptionId: string
): Promise<InstanceSubscriptionResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: subscriptionId }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    if (subscription.status !== 'SUSPENDED') {
      return {
        success: false,
        error: 'Subscription is not suspended',
        errorCode: 'NOT_SUSPENDED',
      }
    }
    
    // Update subscription and instance
    await prisma.$transaction([
      prisma.instanceSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          suspendedReason: null,
        }
      }),
      prisma.platformInstance.update({
        where: { id: subscription.platformInstanceId },
        data: {
          suspendedAt: null,
          suspendedReason: null,
        }
      })
    ])
    
    return { success: true }
  } catch (error) {
    console.error('Failed to resume subscription:', error)
    return {
      success: false,
      error: 'Failed to resume subscription',
      errorCode: 'RESUME_FAILED',
    }
  }
}

// ============================================================================
// CANCEL
// ============================================================================

/**
 * Cancel an instance subscription.
 */
export async function cancelInstanceSubscription(
  subscriptionId: string,
  options?: {
    reason?: string
    cancelAtPeriodEnd?: boolean
  }
): Promise<InstanceSubscriptionResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: subscriptionId }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    if (subscription.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Subscription is already cancelled',
        errorCode: 'ALREADY_CANCELLED',
      }
    }
    
    const now = new Date()
    
    const updated = await prisma.instanceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: options?.cancelAtPeriodEnd ? subscription.status : 'CANCELLED',
        cancelAtPeriodEnd: options?.cancelAtPeriodEnd || false,
        cancelledAt: options?.cancelAtPeriodEnd ? null : now,
        cancelReason: options?.reason,
      }
    })
    
    return { success: true, subscription: updated }
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return {
      success: false,
      error: 'Failed to cancel subscription',
      errorCode: 'CANCEL_FAILED',
    }
  }
}
