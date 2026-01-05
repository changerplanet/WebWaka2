/**
 * PHASE 4B: Expansion Signals
 * 
 * Advisory signals for partners about client growth opportunities:
 * - Usage growth indicators
 * - Multi-platform readiness
 * - Capability usage thresholds
 * - Underutilized platforms
 * 
 * RULES:
 * - Advisory only, no auto-upsell
 * - No forced activation
 * - Signals are insights, not actions
 */

import { prisma } from '../prisma'

// ============================================================================
// TYPES
// ============================================================================

export type SignalType = 
  | 'upgrade_opportunity'     // Client may need higher tier
  | 'expansion_recommended'   // Ready for more platforms
  | 'underutilized'          // Platform not being used
  | 'trial_expiring'         // Trial ending soon
  | 'renewal_coming'         // Subscription renewal approaching
  | 'growth_detected'        // Significant usage increase

export type SignalPriority = 'low' | 'medium' | 'high'

export interface ExpansionSignal {
  id: string
  type: SignalType
  priority: SignalPriority
  title: string
  description: string
  recommendation: string
  
  // Context
  platformInstanceId: string
  instanceName: string
  tenantId: string
  tenantName: string
  
  // Metrics
  metrics?: Record<string, any>
  
  // Timestamps
  detectedAt: Date
  expiresAt?: Date
}

export interface SignalSummary {
  total: number
  byType: Record<SignalType, number>
  byPriority: Record<SignalPriority, number>
  topSignals: ExpansionSignal[]
}

// ============================================================================
// DETECT SIGNALS
// ============================================================================

/**
 * Detect all expansion signals for a partner's clients
 */
export async function detectExpansionSignals(
  partnerId: string
): Promise<ExpansionSignal[]> {
  const signals: ExpansionSignal[] = []
  
  // Get all instances for this partner
  const instances = await prisma.platformInstance.findMany({
    where: { createdByPartnerId: partnerId },
    include: {
      tenant: { select: { id: true, name: true } },
      subscriptions: true,
      financialSummary: true,
    }
  })
  
  const now = new Date()
  
  for (const instance of instances) {
    const subscription = instance.subscriptions[0]
    
    // 1. Trial Expiring Signal
    if (subscription?.status === 'TRIAL' && subscription.trialEnd) {
      const trialEnd = new Date(subscription.trialEnd)
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft <= 7 && daysLeft > 0) {
        signals.push({
          id: `trial-${instance.id}`,
          type: 'trial_expiring',
          priority: daysLeft <= 3 ? 'high' : 'medium',
          title: 'Trial Expiring Soon',
          description: `Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
          recommendation: 'Contact client to discuss subscription conversion',
          platformInstanceId: instance.id,
          instanceName: instance.name,
          tenantId: instance.tenant.id,
          tenantName: instance.tenant.name,
          metrics: { daysLeft, trialEndDate: trialEnd.toISOString() },
          detectedAt: now,
          expiresAt: trialEnd,
        })
      }
    }
    
    // 2. Renewal Coming Signal
    if (subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd) {
      const renewalDate = new Date(subscription.currentPeriodEnd)
      const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysToRenewal <= 14 && daysToRenewal > 0) {
        signals.push({
          id: `renewal-${instance.id}`,
          type: 'renewal_coming',
          priority: daysToRenewal <= 7 ? 'medium' : 'low',
          title: 'Renewal Approaching',
          description: `Subscription renews in ${daysToRenewal} days`,
          recommendation: 'Good time to check in and discuss any upgrade needs',
          platformInstanceId: instance.id,
          instanceName: instance.name,
          tenantId: instance.tenant.id,
          tenantName: instance.tenant.name,
          metrics: { 
            daysToRenewal, 
            renewalDate: renewalDate.toISOString(),
            currentAmount: subscription.amount 
          },
          detectedAt: now,
        })
      }
    }
    
    // 3. Revenue Growth Signal
    const financials = instance.financialSummary
    if (financials) {
      const currentMonth = Number(financials.currentMonthRevenue || 0)
      const lastMonth = Number(financials.lastMonthRevenue || 0)
      
      if (lastMonth > 0 && currentMonth > lastMonth * 1.2) {
        const growthPercent = Math.round(((currentMonth - lastMonth) / lastMonth) * 100)
        
        signals.push({
          id: `growth-${instance.id}`,
          type: 'growth_detected',
          priority: growthPercent > 50 ? 'high' : 'medium',
          title: 'Significant Growth Detected',
          description: `${growthPercent}% revenue increase this month`,
          recommendation: 'Client may be ready for additional instances or features',
          platformInstanceId: instance.id,
          instanceName: instance.name,
          tenantId: instance.tenant.id,
          tenantName: instance.tenant.name,
          metrics: { currentMonth, lastMonth, growthPercent },
          detectedAt: now,
        })
      }
    }
    
    // 4. Underutilized Platform Signal
    const lastUpdate = new Date(instance.updatedAt)
    const daysSinceActivity = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity > 30 && subscription?.status === 'ACTIVE') {
      signals.push({
        id: `underutilized-${instance.id}`,
        type: 'underutilized',
        priority: daysSinceActivity > 60 ? 'high' : 'medium',
        title: 'Underutilized Platform',
        description: `No activity for ${daysSinceActivity} days`,
        recommendation: 'Check if client needs support or training',
        platformInstanceId: instance.id,
        instanceName: instance.name,
        tenantId: instance.tenant.id,
        tenantName: instance.tenant.name,
        metrics: { daysSinceActivity, lastActivity: lastUpdate.toISOString() },
        detectedAt: now,
      })
    }
  }
  
  // Sort by priority
  const priorityOrder: Record<SignalPriority, number> = { high: 3, medium: 2, low: 1 }
  signals.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  
  return signals
}

/**
 * Get signals for a specific instance
 */
export async function getInstanceSignals(
  platformInstanceId: string
): Promise<ExpansionSignal[]> {
  const instance = await prisma.platformInstance.findUnique({
    where: { id: platformInstanceId },
    include: {
      createdByPartner: { select: { id: true } }
    }
  })
  
  if (!instance?.createdByPartnerId) {
    return []
  }
  
  const allSignals = await detectExpansionSignals(instance.createdByPartnerId)
  return allSignals.filter(s => s.platformInstanceId === platformInstanceId)
}

// ============================================================================
// SIGNAL SUMMARY
// ============================================================================

/**
 * Get signal summary for partner dashboard
 */
export async function getSignalSummary(partnerId: string): Promise<SignalSummary> {
  const signals = await detectExpansionSignals(partnerId)
  
  const byType: Record<SignalType, number> = {
    upgrade_opportunity: 0,
    expansion_recommended: 0,
    underutilized: 0,
    trial_expiring: 0,
    renewal_coming: 0,
    growth_detected: 0,
  }
  
  const byPriority: Record<SignalPriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  }
  
  for (const signal of signals) {
    byType[signal.type]++
    byPriority[signal.priority]++
  }
  
  return {
    total: signals.length,
    byType,
    byPriority,
    topSignals: signals.slice(0, 5),
  }
}
