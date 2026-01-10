/**
 * Subscription Service
 * 
 * Manages subscription lifecycle and emits events.
 * 
 * KEY PRINCIPLES:
 * 1. Subscriptions may have OPTIONAL Partner attribution
 * 2. Modules check entitlements, NOT this service
 * 3. Partner/commission logic is NOT here - it's in the events
 * 4. Events are module-agnostic
 */

import { prisma } from './prisma'
import { 
  Subscription, 
  SubscriptionStatus, 
  BillingInterval,
  SubscriptionEventType,
  SubscriptionPlan
} from '@prisma/client'
import { grantEntitlement, revokeEntitlement, suspendEntitlement, reactivateEntitlement } from './entitlements'
import { emitSubscriptionEvent, SubscriptionEventPayload } from './subscription-events'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateSubscriptionInput {
  tenantId: string
  planId: string
  billingInterval?: BillingInterval
  amount?: number  // Override plan price if needed
  trialDays?: number
  externalId?: string
  paymentProvider?: string
  metadata?: Record<string, any>
}

export interface SubscriptionResult {
  success: boolean
  subscription?: Subscription
  error?: string
  code?: string
}

// ============================================================================
// SUBSCRIPTION CREATION
// ============================================================================

/**
 * Create a new subscription for a tenant
 * 
 * This automatically:
 * 1. Links to partner attribution if exists
 * 2. Grants entitlements for included modules
 * 3. Emits SUBSCRIPTION_CREATED event
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<SubscriptionResult> {
  // 1. Validate tenant exists and doesn't have subscription
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    include: { 
      subscription: true,
      partnerReferral: true 
    }
  })
  
  if (!tenant) {
    return { success: false, error: 'Tenant not found', code: 'NOT_FOUND' }
  }
  
  const tenantAny = tenant as any;
  if (tenantAny.subscription) {
    return { success: false, error: 'Tenant already has a subscription', code: 'ALREADY_EXISTS' }
  }
  
  // 2. Get the plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId }
  })
  
  if (!plan || !plan.isActive) {
    return { success: false, error: 'Plan not found or inactive', code: 'PLAN_NOT_FOUND' }
  }
  
  // 3. Calculate dates
  const now = new Date()
  const billingInterval = input.billingInterval || 'MONTHLY'
  const trialDays = input.trialDays ?? plan.trialDays
  
  let trialStart: Date | null = null
  let trialEnd: Date | null = null
  let periodStart = now
  let periodEnd: Date
  
  if (trialDays > 0) {
    trialStart = now
    trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
    periodStart = trialEnd
  }
  
  // Calculate period end based on billing interval
  periodEnd = calculatePeriodEnd(periodStart, billingInterval)
  
  // 4. Calculate amount
  const amount = input.amount ?? (
    billingInterval === 'YEARLY' 
      ? plan.priceYearly 
      : plan.priceMonthly
  )
  
  // 5. Create subscription and entitlements in transaction
  const subscription = await prisma.$transaction(async (tx) => {
    // Create subscription
    const sub = await (tx.subscription.create as any)({
      data: {
        tenantId: input.tenantId,
        planId: input.planId,
        status: trialDays > 0 ? 'TRIALING' : 'PENDING',
        billingInterval,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        amount,
        currency: plan.currency,
        trialStart,
        trialEnd,
        externalId: input.externalId,
        paymentProvider: input.paymentProvider,
        partnerReferralId: tenantAny.partnerReferral?.id, // OPTIONAL partner link
        metadata: input.metadata
      }
    })
    
    // Grant entitlements for included modules
    for (const moduleName of plan.includedModules) {
      await (tx.entitlement.create as any)({
        data: {
          tenantId: input.tenantId,
          subscriptionId: sub.id,
          module: moduleName,
          status: 'ACTIVE',
          validUntil: periodEnd,
          source: 'subscription'
        }
      })
    }
    
    // Audit log
    await (tx.auditLog.create as any)({
      data: {
        action: 'SUBSCRIPTION_CREATED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: input.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          planId: plan.id,
          planName: plan.name,
          modules: plan.includedModules,
          amount: amount.toString(),
          currency: plan.currency,
          billingInterval,
          hasPartner: !!tenantAny.partnerReferral,
          partnerId: tenantAny.partnerReferral?.partnerId
        }
      }
    })
    
    return sub
  })
  
  // 6. Emit event (async, doesn't block)
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_CREATED',
    subscriptionId: subscription.id,
    tenantId: input.tenantId,
    partnerId: tenantAny.partnerReferral?.partnerId ?? null, // OPTIONAL
    modules: plan.includedModules,
    billingAmount: Number(amount),
    billingCurrency: plan.currency,
    billingInterval,
    periodStart,
    periodEnd,
    metadata: {
      planId: plan.id,
      planName: plan.name,
      isTrialing: trialDays > 0
    }
  })
  
  return { success: true, subscription }
}

// ============================================================================
// SUBSCRIPTION ACTIVATION
// ============================================================================

/**
 * Activate a subscription after successful payment
 */
export async function activateSubscription(
  subscriptionId: string,
  options?: {
    externalId?: string
    paymentReference?: string
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { 
      SubscriptionPlan: true,
      Tenant: { include: { partnerReferral: true } }
    }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  if (subscription.status === 'ACTIVE') {
    return { success: true, subscription } // Already active
  }
  
  const subAny = subscription as any;
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        externalId: options?.externalId ?? subscription.externalId
      }
    })
    
    // Lock attribution on first activation
    if (subAny.Tenant?.partnerReferral && !subAny.Tenant.partnerReferral.attributionLocked) {
      await tx.partnerReferral.update({
        where: { id: subAny.Tenant.partnerReferral.id },
        data: {
          attributionLocked: true,
          lockedAt: new Date()
        }
      })
    }
    
    // Audit log
    await (tx.auditLog.create as any)({
      data: {
        action: 'SUBSCRIPTION_ACTIVATED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          paymentReference: options?.paymentReference
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_ACTIVATED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: subAny.Tenant?.partnerReferral?.partnerId ?? null,
    modules: subAny.SubscriptionPlan?.includedModules ?? [],
    billingAmount: Number(subscription.amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    metadata: {
      paymentReference: options?.paymentReference
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

// ============================================================================
// SUBSCRIPTION RENEWAL
// ============================================================================

/**
 * Renew a subscription for a new billing period
 */
export async function renewSubscription(
  subscriptionId: string,
  options?: {
    paymentReference?: string
    newAmount?: number
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { 
      SubscriptionPlan: true,
      Tenant: { include: { partnerReferral: true } }
    }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  // Calculate new period
  const newPeriodStart = subscription.currentPeriodEnd
  const newPeriodEnd = calculatePeriodEnd(newPeriodStart, subscription.billingInterval)
  const amount = options?.newAmount ?? subscription.amount
  
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        amount,
        cancelAtPeriodEnd: false
      }
    })
    
    // Extend entitlements
    await tx.entitlement.updateMany({
      where: {
        subscriptionId,
        status: 'ACTIVE'
      },
      data: {
        validUntil: newPeriodEnd
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_RENEWED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          newPeriodStart: newPeriodStart.toISOString(),
          newPeriodEnd: newPeriodEnd.toISOString(),
          amount: amount.toString(),
          paymentReference: options?.paymentReference
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_RENEWED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: subscription.Tenant?.partnerReferral?.partnerId ?? null,
    modules: subscription.SubscriptionPlan.includedModules,
    billingAmount: Number(amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: newPeriodStart,
    periodEnd: newPeriodEnd,
    metadata: {
      paymentReference: options?.paymentReference,
      renewalCount: 1 // Could track this
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

// ============================================================================
// SUBSCRIPTION CANCELLATION
// ============================================================================

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  options?: {
    reason?: string
    immediate?: boolean  // Cancel immediately vs at period end
    actorId?: string
    actorEmail?: string
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { 
      SubscriptionPlan: true,
      Tenant: { include: { partnerReferral: true } }
    }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  const immediate = options?.immediate ?? false
  
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: immediate ? 'CANCELLED' : subscription.status,
        cancelledAt: new Date(),
        cancelReason: options?.reason,
        cancelAtPeriodEnd: !immediate
      }
    })
    
    // If immediate, expire entitlements
    if (immediate) {
      await tx.entitlement.updateMany({
        where: { subscriptionId },
        data: { status: 'EXPIRED' }
      })
    }
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_CANCELLED',
        actorId: options?.actorId || 'system',
        actorEmail: options?.actorEmail || 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          reason: options?.reason,
          immediate,
          effectiveDate: immediate 
            ? new Date().toISOString() 
            : subscription.currentPeriodEnd.toISOString()
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_CANCELLED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: subscription.Tenant?.partnerReferral?.partnerId ?? null,
    modules: subscription.SubscriptionPlan.includedModules,
    billingAmount: Number(subscription.amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    metadata: {
      reason: options?.reason,
      immediate,
      effectiveDate: immediate 
        ? new Date().toISOString() 
        : subscription.currentPeriodEnd.toISOString()
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Get subscription for a tenant
 */
export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({
    where: { tenantId },
    include: {
      SubscriptionPlan: true,
      Entitlement: true
    }
  })
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      SubscriptionPlan: true,
      Tenant: true,
      Entitlement: true
    }
  })
}

// ============================================================================
// HELPERS
// ============================================================================

function calculatePeriodEnd(start: Date, interval: BillingInterval): Date {
  const end = new Date(start)
  
  switch (interval) {
    case 'MONTHLY':
      end.setMonth(end.getMonth() + 1)
      break
    case 'QUARTERLY':
      end.setMonth(end.getMonth() + 3)
      break
    case 'YEARLY':
      end.setFullYear(end.getFullYear() + 1)
      break
  }
  
  return end
}

// ============================================================================
// PLAN MANAGEMENT
// ============================================================================

/**
 * Get all active subscription plans
 */
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  return prisma.subscriptionPlan.findMany({
    where: {
      isActive: true,
      isPublic: true
    },
    orderBy: { sortOrder: 'asc' }
  })
}

/**
 * Get a plan by ID or slug
 */
export async function getPlan(idOrSlug: string): Promise<SubscriptionPlan | null> {
  return prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  })
}

// ============================================================================
// GRACE PERIOD MANAGEMENT
// ============================================================================

/**
 * Enter grace period after payment failure
 * Subscription enters PAST_DUE -> GRACE_PERIOD status progression
 */
export async function enterGracePeriod(
  subscriptionId: string,
  options?: {
    reason?: string
    gracePeriodDays?: number
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { SubscriptionPlan: true, Tenant: true }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  // Already in grace period or suspended
  if (subscription.status === 'GRACE_PERIOD' || subscription.status === 'SUSPENDED') {
    return { success: true, subscription }
  }
  
  // Calculate grace period end
  const gracePeriodDays = options?.gracePeriodDays ?? subscription.gracePeriodDays ?? subscription.SubscriptionPlan.gracePeriodDays ?? 7
  const gracePeriodStart = new Date()
  const gracePeriodEnd = new Date(gracePeriodStart.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
  
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'GRACE_PERIOD',
        gracePeriodStart,
        gracePeriodEnd,
        paymentFailedAt: subscription.paymentFailedAt ?? new Date(),
        paymentRetryCount: subscription.paymentRetryCount + 1
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPDATED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          eventType: 'GRACE_PERIOD_STARTED',
          reason: options?.reason ?? 'Payment failed',
          gracePeriodDays,
          gracePeriodEnd: gracePeriodEnd.toISOString(),
          retryCount: sub.paymentRetryCount
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_GRACE_PERIOD_STARTED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: null,
    modules: subscription.SubscriptionPlan.includedModules,
    billingAmount: Number(subscription.amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    metadata: {
      gracePeriodDays,
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      reason: options?.reason ?? 'Payment failed'
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

/**
 * Suspend subscription after grace period expires
 * Full access revocation
 */
export async function suspendSubscription(
  subscriptionId: string,
  options?: {
    reason?: string
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { SubscriptionPlan: true, Tenant: true }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  if (subscription.status === 'SUSPENDED') {
    return { success: true, subscription }
  }
  
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'SUSPENDED'
      }
    })
    
    // Deactivate all entitlements
    await tx.entitlement.updateMany({
      where: {
        subscriptionId,
        status: 'ACTIVE'
      },
      data: {
        status: 'SUSPENDED'
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_SUSPENDED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          reason: options?.reason ?? 'Grace period expired',
          paymentFailedAt: subscription.paymentFailedAt?.toISOString(),
          gracePeriodDays: subscription.gracePeriodDays,
          retryCount: subscription.paymentRetryCount
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_SUSPENDED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: null,
    modules: subscription.SubscriptionPlan.includedModules,
    billingAmount: Number(subscription.amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    metadata: {
      reason: options?.reason ?? 'Grace period expired'
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

/**
 * Recover subscription after payment success (during grace period)
 */
export async function recoverSubscription(
  subscriptionId: string,
  options?: {
    paymentReference?: string
  }
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { SubscriptionPlan: true, Tenant: true }
  })
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found', code: 'NOT_FOUND' }
  }
  
  if (subscription.status === 'ACTIVE') {
    return { success: true, subscription }
  }
  
  // Can only recover from PAST_DUE, GRACE_PERIOD, or SUSPENDED
  const recoverableStatuses = ['PAST_DUE', 'GRACE_PERIOD', 'SUSPENDED']
  if (!recoverableStatuses.includes(subscription.status)) {
    return { 
      success: false, 
      error: `Cannot recover subscription from ${subscription.status} status`,
      code: 'INVALID_STATUS'
    }
  }
  
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        gracePeriodStart: null,
        gracePeriodEnd: null,
        paymentFailedAt: null,
        paymentRetryCount: 0
      }
    })
    
    // Reactivate entitlements
    await tx.entitlement.updateMany({
      where: {
        subscriptionId,
        status: 'SUSPENDED'
      },
      data: {
        status: 'ACTIVE'
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_ACTIVATED',
        actorId: 'system',
        actorEmail: 'subscription@webwaka.internal',
        tenantId: subscription.tenantId,
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: {
          eventType: 'SUBSCRIPTION_RECOVERED',
          previousStatus: subscription.status,
          paymentReference: options?.paymentReference,
          gracePeriodDaysUsed: subscription.gracePeriodStart 
            ? Math.ceil((Date.now() - subscription.gracePeriodStart.getTime()) / (24 * 60 * 60 * 1000))
            : 0
        }
      }
    })
    
    return sub
  })
  
  // Emit event
  await emitSubscriptionEvent({
    eventType: 'SUBSCRIPTION_RECOVERED',
    subscriptionId: subscription.id,
    tenantId: subscription.tenantId,
    partnerId: null,
    modules: subscription.SubscriptionPlan.includedModules,
    billingAmount: Number(subscription.amount),
    billingCurrency: subscription.currency,
    billingInterval: subscription.billingInterval,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    metadata: {
      previousStatus: subscription.status,
      paymentReference: options?.paymentReference
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(subscription: {
  status: string
  gracePeriodEnd?: Date | null
}): boolean {
  if (subscription.status !== 'GRACE_PERIOD') {
    return false
  }
  
  if (!subscription.gracePeriodEnd) {
    return false
  }
  
  return new Date() < subscription.gracePeriodEnd
}

/**
 * Check if grace period has expired
 */
export function isGracePeriodExpired(subscription: {
  status: string
  gracePeriodEnd?: Date | null
}): boolean {
  if (subscription.status !== 'GRACE_PERIOD') {
    return false
  }
  
  if (!subscription.gracePeriodEnd) {
    return true // No end date means expired
  }
  
  return new Date() >= subscription.gracePeriodEnd
}

/**
 * Get remaining grace period days
 */
export function getRemainingGraceDays(subscription: {
  gracePeriodEnd?: Date | null
}): number {
  if (!subscription.gracePeriodEnd) {
    return 0
  }
  
  const remaining = subscription.gracePeriodEnd.getTime() - Date.now()
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

/**
 * Check subscription access status
 * Returns whether tenant has access and any limitations
 */
export async function checkSubscriptionAccess(tenantId: string): Promise<{
  hasAccess: boolean
  status: string
  isGracePeriod: boolean
  gracePeriodDaysRemaining: number
  message?: string
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { SubscriptionPlan: true }
  })
  
  if (!subscription) {
    return {
      hasAccess: false,
      status: 'NO_SUBSCRIPTION',
      isGracePeriod: false,
      gracePeriodDaysRemaining: 0,
      message: 'No active subscription found'
    }
  }
  
  switch (subscription.status) {
    case 'ACTIVE':
    case 'TRIALING':
      return {
        hasAccess: true,
        status: subscription.status,
        isGracePeriod: false,
        gracePeriodDaysRemaining: 0
      }
      
    case 'GRACE_PERIOD':
      const daysRemaining = getRemainingGraceDays(subscription)
      if (daysRemaining > 0) {
        return {
          hasAccess: true, // Limited access during grace period
          status: 'GRACE_PERIOD',
          isGracePeriod: true,
          gracePeriodDaysRemaining: daysRemaining,
          message: `Payment failed. ${daysRemaining} days remaining to update payment method.`
        }
      } else {
        return {
          hasAccess: false,
          status: 'GRACE_PERIOD_EXPIRED',
          isGracePeriod: true,
          gracePeriodDaysRemaining: 0,
          message: 'Grace period has expired. Please update your payment method.'
        }
      }
      
    case 'PAST_DUE':
      return {
        hasAccess: true, // Still has access, payment retry in progress
        status: 'PAST_DUE',
        isGracePeriod: false,
        gracePeriodDaysRemaining: 0,
        message: 'Payment failed. We will retry shortly.'
      }
      
    case 'CANCELLED':
      // Access until period end
      if (subscription.currentPeriodEnd > new Date()) {
        return {
          hasAccess: true,
          status: 'CANCELLED',
          isGracePeriod: false,
          gracePeriodDaysRemaining: 0,
          message: 'Subscription cancelled. Access until end of billing period.'
        }
      } else {
        return {
          hasAccess: false,
          status: 'CANCELLED_EXPIRED',
          isGracePeriod: false,
          gracePeriodDaysRemaining: 0,
          message: 'Subscription has ended.'
        }
      }
      
    case 'SUSPENDED':
    case 'EXPIRED':
      return {
        hasAccess: false,
        status: subscription.status,
        isGracePeriod: false,
        gracePeriodDaysRemaining: 0,
        message: 'Subscription is not active. Please renew to continue.'
      }
      
    default:
      return {
        hasAccess: false,
        status: subscription.status,
        isGracePeriod: false,
        gracePeriodDaysRemaining: 0
      }
  }
}
