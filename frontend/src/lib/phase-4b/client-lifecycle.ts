/**
 * PHASE 4B: Client Subscription Lifecycle
 * 
 * Partner-controlled subscription management:
 * - Start subscription (from package or custom)
 * - Pause subscription (temporary)
 * - Resume subscription
 * - Cancel subscription
 * 
 * RULES:
 * - Partner initiates all lifecycle changes
 * - Instance-level suspension only (tenant core preserved)
 * - Grace periods respected
 * - Data always preserved
 */

import { prisma } from '../prisma'
import { 
  createInstanceSubscription, 
  suspendInstanceSubscription, 
  resumeInstanceSubscription,
  cancelInstanceSubscription 
} from '../phase-3/instance-subscription'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

export interface StartSubscriptionInput {
  partnerId: string
  platformInstanceId: string
  
  // From package OR custom pricing
  packageId?: string        // Use package pricing
  customPricing?: {         // OR custom pricing
    amount: number
    billingInterval: 'monthly' | 'yearly'
    setupFee?: number
    trialDays?: number
  }
  
  // Wholesale (partner's cost to WebWaka)
  wholesaleCost?: number
  
  metadata?: Record<string, any>
}

export interface PauseSubscriptionInput {
  subscriptionId: string
  reason?: string
  scheduledResumeDate?: Date
}

export interface CancelSubscriptionInput {
  subscriptionId: string
  reason?: string
  cancelAtPeriodEnd?: boolean
  feedback?: string
}

export interface LifecycleResult {
  success: boolean
  subscription?: any
  error?: string
  errorCode?: string
}

// ============================================================================
// START SUBSCRIPTION
// ============================================================================

/**
 * Start a subscription for a client instance.
 * Can use a package or custom pricing.
 */
export async function startClientSubscription(
  input: StartSubscriptionInput
): Promise<LifecycleResult> {
  try {
    // Verify instance belongs to partner
    const instance = await prisma.platformInstance.findUnique({
      where: { id: input.platformInstanceId },
      include: {
        tenant: { select: { id: true, name: true } },
        subscriptions: { where: { status: { not: 'CANCELLED' } } }
      }
    })
    
    if (!instance) {
      return {
        success: false,
        error: 'Platform instance not found',
        errorCode: 'INSTANCE_NOT_FOUND',
      }
    }
    
    if (instance.createdByPartnerId !== input.partnerId) {
      return {
        success: false,
        error: 'You do not have permission to manage this instance',
        errorCode: 'PERMISSION_DENIED',
      }
    }
    
    // Check for existing active subscription
    if (instance.subscriptions.length > 0) {
      return {
        success: false,
        error: 'Instance already has an active subscription',
        errorCode: 'SUBSCRIPTION_EXISTS',
      }
    }
    
    // Get pricing from package or custom
    let amount: number
    let billingInterval: 'monthly' | 'yearly' = 'monthly'
    let trialDays = 0
    let wholesaleCost = input.wholesaleCost || 0
    
    if (input.packageId) {
      const pkg = await prisma.partnerPackage.findUnique({
        where: { id: input.packageId }
      })
      
      if (!pkg || pkg.partnerId !== input.partnerId) {
        return {
          success: false,
          error: 'Package not found or access denied',
          errorCode: 'PACKAGE_NOT_FOUND',
        }
      }
      
      amount = Number(pkg.priceMonthly)
      trialDays = pkg.trialDays
      wholesaleCost = Number(pkg.wholesaleCostMonthly || 0)
    } else if (input.customPricing) {
      amount = input.customPricing.amount
      billingInterval = input.customPricing.billingInterval
      trialDays = input.customPricing.trialDays || 0
    } else {
      return {
        success: false,
        error: 'Either packageId or customPricing is required',
        errorCode: 'PRICING_REQUIRED',
      }
    }
    
    // Create subscription using Phase 3 service
    const result = await createInstanceSubscription({
      platformInstanceId: input.platformInstanceId,
      partnerId: input.partnerId,
      amount,
      billingInterval,
      wholesaleCost,
      trialDays,
      metadata: input.metadata,
    })
    
    return result
  } catch (error) {
    console.error('Failed to start subscription:', error)
    return {
      success: false,
      error: 'Failed to start subscription',
      errorCode: 'START_FAILED',
    }
  }
}

// ============================================================================
// PAUSE SUBSCRIPTION
// ============================================================================

/**
 * Pause a subscription temporarily.
 * Instance becomes inaccessible but data is preserved.
 */
export async function pauseClientSubscription(
  input: PauseSubscriptionInput
): Promise<LifecycleResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: input.subscriptionId },
      include: { PlatformInstance: true }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return {
        success: false,
        error: 'Can only pause active or trial subscriptions',
        errorCode: 'INVALID_STATUS',
      }
    }
    
    // Use Phase 3 suspend function
    const result = await suspendInstanceSubscription(
      input.subscriptionId,
      input.reason || 'Paused by partner'
    )
    
    if (result.success && input.scheduledResumeDate) {
      // Store scheduled resume date in metadata
      await prisma.instanceSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          metadata: {
            ...(subscription.metadata as any || {}),
            scheduledResumeDate: input.scheduledResumeDate.toISOString(),
          }
        }
      })
    }
    
    return result
  } catch (error) {
    console.error('Failed to pause subscription:', error)
    return {
      success: false,
      error: 'Failed to pause subscription',
      errorCode: 'PAUSE_FAILED',
    }
  }
}

// ============================================================================
// RESUME SUBSCRIPTION
// ============================================================================

/**
 * Resume a paused subscription.
 */
export async function resumeClientSubscription(
  subscriptionId: string
): Promise<LifecycleResult> {
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
    
    // Use Phase 3 resume function
    const result = await resumeInstanceSubscription(subscriptionId)
    
    if (result.success) {
      // Clear scheduled resume date if present
      const metadata = (subscription.metadata as any) || {}
      if (metadata.scheduledResumeDate) {
        delete metadata.scheduledResumeDate
        await prisma.instanceSubscription.update({
          where: { id: subscriptionId },
          data: { metadata }
        })
      }
    }
    
    return result
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
// CANCEL SUBSCRIPTION
// ============================================================================

/**
 * Cancel a subscription.
 * Can cancel immediately or at period end.
 */
export async function cancelClientSubscription(
  input: CancelSubscriptionInput
): Promise<LifecycleResult> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: input.subscriptionId }
    })
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    // Store feedback if provided
    if (input.feedback) {
      await prisma.instanceSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          metadata: {
            ...(subscription.metadata as any || {}),
            cancellationFeedback: input.feedback,
          }
        }
      })
    }
    
    // Use Phase 3 cancel function
    return cancelInstanceSubscription(input.subscriptionId, {
      reason: input.reason,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return {
      success: false,
      error: 'Failed to cancel subscription',
      errorCode: 'CANCEL_FAILED',
    }
  }
}

// ============================================================================
// GET CLIENT SUBSCRIPTION STATUS
// ============================================================================

/**
 * Get the current subscription status for a client's instance
 */
export async function getClientSubscriptionStatus(
  platformInstanceId: string
): Promise<{
  hasSubscription: boolean
  subscription?: any
  status: 'none' | 'trial' | 'active' | 'paused' | 'cancelled' | 'past_due'
  daysRemaining?: number
  nextBillingDate?: Date
}> {
  const subscription = await prisma.instanceSubscription.findUnique({
    where: { platformInstanceId },
    include: {
      PlatformInstance: {
        select: { id: true, name: true }
      }
    }
  })
  
  if (!subscription) {
    return { hasSubscription: false, status: 'none' }
  }
  
  // Map status
  let status: 'none' | 'trial' | 'active' | 'paused' | 'cancelled' | 'past_due' = 'active'
  switch (subscription.status) {
    case 'TRIAL':
      status = 'trial'
      break
    case 'ACTIVE':
      status = 'active'
      break
    case 'SUSPENDED':
      status = 'paused'
      break
    case 'CANCELLED':
      status = 'cancelled'
      break
    case 'PAST_DUE':
      status = 'past_due'
      break
  }
  
  // Calculate days remaining
  const now = new Date()
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    hasSubscription: true,
    subscription,
    status,
    daysRemaining: Math.max(0, daysRemaining),
    nextBillingDate: periodEnd,
  }
}
