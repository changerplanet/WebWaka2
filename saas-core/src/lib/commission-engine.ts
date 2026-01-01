/**
 * Commission Model Engine
 * 
 * Flexible, declarative commission calculation system.
 * 
 * SUPPORTED MODELS:
 * 1. PERCENTAGE - % of subscription amount
 * 2. FIXED - Fixed amount per event
 * 3. TIERED - Volume-based tiers
 * 4. HYBRID - Combination of multiple models
 * 
 * KEY PRINCIPLES:
 * - Commission rules are declarative, not procedural
 * - Rules are defined in PartnerAgreement
 * - Rules are versioned over time
 * - No hardcoded logic
 * - No assumptions about pricing
 */

import { 
  CommissionType, 
  CommissionTrigger,
  PartnerAgreement,
  SubscriptionEventType 
} from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for commission calculation
 */
export interface CommissionCalculationInput {
  // Event details
  eventType: SubscriptionEventType
  grossAmount: number  // Amount billed to tenant
  currency: string
  
  // Period (for volume calculations)
  periodStart: Date
  periodEnd: Date
  
  // Context
  isFirstPayment?: boolean
  modules?: string[]
  
  // Historical volume (for tiered calculations)
  historicalVolume?: number
}

/**
 * Result of commission calculation
 */
export interface CommissionCalculationResult {
  success: boolean
  commissionAmount: number
  currency: string
  
  // Calculation details
  details: {
    commissionType: CommissionType
    formula: string
    inputs: Record<string, any>
    breakdown: CommissionBreakdown[]
  }
  
  error?: string
}

/**
 * Breakdown of commission calculation
 */
export interface CommissionBreakdown {
  component: string  // "base_percentage", "setup_fee", "tier_1", etc.
  amount: number
  calculation: string
}

/**
 * Tiered commission structure
 */
export interface CommissionTier {
  minVolume: number
  maxVolume: number | null  // null = unlimited
  rate: number  // For percentage
  fixedAmount?: number  // For fixed per tier
}

/**
 * Hybrid commission rule
 */
export interface HybridRule {
  condition: RuleCondition
  type: CommissionType
  rate?: number
  fixedAmount?: number
  tiers?: CommissionTier[]
}

/**
 * Rule condition for hybrid models
 */
export interface RuleCondition {
  field: 'eventType' | 'grossAmount' | 'module' | 'isFirstPayment' | 'period'
  operator: 'equals' | 'in' | 'gt' | 'gte' | 'lt' | 'lte'
  value: any
}

// ============================================================================
// COMMISSION CALCULATION STRATEGIES
// ============================================================================

/**
 * Calculate commission based on agreement rules
 * 
 * This is the main entry point - it delegates to specific strategies
 */
export function calculateCommission(
  agreement: PartnerAgreement,
  input: CommissionCalculationInput
): CommissionCalculationResult {
  // Check if this event type should trigger commission
  if (!shouldTriggerCommission(agreement.commissionTrigger, input.eventType, input.isFirstPayment)) {
    return {
      success: true,
      commissionAmount: 0,
      currency: input.currency,
      details: {
        commissionType: agreement.commissionType,
        formula: 'Event type does not trigger commission',
        inputs: { eventType: input.eventType, trigger: agreement.commissionTrigger },
        breakdown: []
      }
    }
  }
  
  // Delegate to appropriate strategy
  switch (agreement.commissionType) {
    case 'PERCENTAGE':
      return calculatePercentageCommission(agreement, input)
    case 'FIXED':
      return calculateFixedCommission(agreement, input)
    case 'TIERED':
      return calculateTieredCommission(agreement, input)
    case 'HYBRID':
      return calculateHybridCommission(agreement, input)
    default:
      return {
        success: false,
        commissionAmount: 0,
        currency: input.currency,
        details: {
          commissionType: agreement.commissionType,
          formula: 'Unknown commission type',
          inputs: {},
          breakdown: []
        },
        error: `Unknown commission type: ${agreement.commissionType}`
      }
  }
}

/**
 * Check if event type should trigger commission based on agreement trigger
 */
function shouldTriggerCommission(
  trigger: CommissionTrigger,
  eventType: SubscriptionEventType,
  isFirstPayment?: boolean
): boolean {
  switch (trigger) {
    case 'ON_PAYMENT':
      return eventType === 'PAYMENT_SUCCEEDED' || 
             eventType === 'SUBSCRIPTION_ACTIVATED' || 
             eventType === 'SUBSCRIPTION_RENEWED'
    case 'ON_ACTIVATION':
      return eventType === 'SUBSCRIPTION_ACTIVATED'
    case 'ON_RENEWAL':
      return eventType === 'SUBSCRIPTION_RENEWED'
    case 'ON_SIGNUP':
      return eventType === 'SUBSCRIPTION_CREATED' || 
             (eventType === 'SUBSCRIPTION_ACTIVATED' && isFirstPayment)
    default:
      return false
  }
}

// ============================================================================
// PERCENTAGE COMMISSION
// ============================================================================

/**
 * Calculate percentage-based commission
 * 
 * Formula: grossAmount * commissionRate
 * With optional min/max caps and setup fee
 */
function calculatePercentageCommission(
  agreement: PartnerAgreement,
  input: CommissionCalculationInput
): CommissionCalculationResult {
  const breakdown: CommissionBreakdown[] = []
  let totalCommission = 0
  
  // Base percentage calculation
  const rate = Number(agreement.commissionRate)
  const baseCommission = input.grossAmount * rate
  
  breakdown.push({
    component: 'base_percentage',
    amount: baseCommission,
    calculation: `${input.grossAmount} × ${rate} = ${baseCommission}`
  })
  
  totalCommission += baseCommission
  
  // Add setup fee if first payment
  if (input.isFirstPayment && agreement.setupFee) {
    const setupFee = Number(agreement.setupFee)
    breakdown.push({
      component: 'setup_fee',
      amount: setupFee,
      calculation: `First payment setup fee: ${setupFee}`
    })
    totalCommission += setupFee
  }
  
  // Apply min/max caps
  const { capped, cappedAmount, capBreakdown } = applyMinMaxCaps(
    totalCommission,
    agreement.minCommission ? Number(agreement.minCommission) : null,
    agreement.maxCommission ? Number(agreement.maxCommission) : null
  )
  
  if (capped && capBreakdown) {
    breakdown.push(capBreakdown)
    totalCommission = cappedAmount
  }
  
  return {
    success: true,
    commissionAmount: roundCurrency(totalCommission),
    currency: input.currency,
    details: {
      commissionType: 'PERCENTAGE',
      formula: `grossAmount × rate${agreement.setupFee ? ' + setupFee' : ''}${capped ? ' (capped)' : ''}`,
      inputs: {
        grossAmount: input.grossAmount,
        rate,
        setupFee: agreement.setupFee ? Number(agreement.setupFee) : null,
        minCommission: agreement.minCommission ? Number(agreement.minCommission) : null,
        maxCommission: agreement.maxCommission ? Number(agreement.maxCommission) : null
      },
      breakdown
    }
  }
}

// ============================================================================
// FIXED COMMISSION
// ============================================================================

/**
 * Calculate fixed-amount commission
 * 
 * Formula: fixedAmount per event
 * With optional setup fee
 */
function calculateFixedCommission(
  agreement: PartnerAgreement,
  input: CommissionCalculationInput
): CommissionCalculationResult {
  const breakdown: CommissionBreakdown[] = []
  let totalCommission = 0
  
  // Fixed amount
  if (agreement.fixedAmount) {
    const fixed = Number(agreement.fixedAmount)
    breakdown.push({
      component: 'fixed_amount',
      amount: fixed,
      calculation: `Fixed commission per event: ${fixed}`
    })
    totalCommission += fixed
  }
  
  // Add setup fee if first payment
  if (input.isFirstPayment && agreement.setupFee) {
    const setupFee = Number(agreement.setupFee)
    breakdown.push({
      component: 'setup_fee',
      amount: setupFee,
      calculation: `First payment setup fee: ${setupFee}`
    })
    totalCommission += setupFee
  }
  
  return {
    success: true,
    commissionAmount: roundCurrency(totalCommission),
    currency: input.currency,
    details: {
      commissionType: 'FIXED',
      formula: `fixedAmount${agreement.setupFee ? ' + setupFee' : ''}`,
      inputs: {
        fixedAmount: agreement.fixedAmount ? Number(agreement.fixedAmount) : 0,
        setupFee: agreement.setupFee ? Number(agreement.setupFee) : null
      },
      breakdown
    }
  }
}

// ============================================================================
// TIERED COMMISSION
// ============================================================================

/**
 * Calculate tiered commission based on volume
 * 
 * Uses historical volume to determine applicable tier
 */
function calculateTieredCommission(
  agreement: PartnerAgreement,
  input: CommissionCalculationInput
): CommissionCalculationResult {
  const breakdown: CommissionBreakdown[] = []
  
  if (!agreement.commissionTiers) {
    return {
      success: false,
      commissionAmount: 0,
      currency: input.currency,
      details: {
        commissionType: 'TIERED',
        formula: 'Missing tier configuration',
        inputs: {},
        breakdown: []
      },
      error: 'Tiered commission requires commissionTiers configuration'
    }
  }
  
  const tiers = agreement.commissionTiers as CommissionTier[]
  const volume = input.historicalVolume ?? input.grossAmount
  
  // Find applicable tier based on volume
  const applicableTier = tiers.find(tier => 
    volume >= tier.minVolume && 
    (tier.maxVolume === null || volume <= tier.maxVolume)
  )
  
  if (!applicableTier) {
    return {
      success: false,
      commissionAmount: 0,
      currency: input.currency,
      details: {
        commissionType: 'TIERED',
        formula: 'No applicable tier found',
        inputs: { volume, tiers },
        breakdown: []
      },
      error: `No tier found for volume: ${volume}`
    }
  }
  
  // Calculate commission using tier rate
  let commission: number
  if (applicableTier.fixedAmount !== undefined) {
    commission = applicableTier.fixedAmount
    breakdown.push({
      component: `tier_${tiers.indexOf(applicableTier) + 1}_fixed`,
      amount: commission,
      calculation: `Tier fixed amount: ${commission}`
    })
  } else {
    commission = input.grossAmount * applicableTier.rate
    breakdown.push({
      component: `tier_${tiers.indexOf(applicableTier) + 1}_percentage`,
      amount: commission,
      calculation: `${input.grossAmount} × ${applicableTier.rate} = ${commission}`
    })
  }
  
  // Add setup fee if first payment
  if (input.isFirstPayment && agreement.setupFee) {
    const setupFee = Number(agreement.setupFee)
    breakdown.push({
      component: 'setup_fee',
      amount: setupFee,
      calculation: `First payment setup fee: ${setupFee}`
    })
    commission += setupFee
  }
  
  // Apply min/max caps
  const { capped, cappedAmount, capBreakdown } = applyMinMaxCaps(
    commission,
    agreement.minCommission ? Number(agreement.minCommission) : null,
    agreement.maxCommission ? Number(agreement.maxCommission) : null
  )
  
  if (capped && capBreakdown) {
    breakdown.push(capBreakdown)
    commission = cappedAmount
  }
  
  return {
    success: true,
    commissionAmount: roundCurrency(commission),
    currency: input.currency,
    details: {
      commissionType: 'TIERED',
      formula: `tierRate(volume) × grossAmount`,
      inputs: {
        grossAmount: input.grossAmount,
        volume,
        applicableTier,
        tierIndex: tiers.indexOf(applicableTier) + 1
      },
      breakdown
    }
  }
}

// ============================================================================
// HYBRID COMMISSION
// ============================================================================

/**
 * Calculate hybrid commission using multiple rules
 * 
 * Evaluates rules in order, applies first matching rule
 */
function calculateHybridCommission(
  agreement: PartnerAgreement,
  input: CommissionCalculationInput
): CommissionCalculationResult {
  if (!agreement.commissionRules) {
    return {
      success: false,
      commissionAmount: 0,
      currency: input.currency,
      details: {
        commissionType: 'HYBRID',
        formula: 'Missing rules configuration',
        inputs: {},
        breakdown: []
      },
      error: 'Hybrid commission requires commissionRules configuration'
    }
  }
  
  const rules = (agreement.commissionRules as { rules: HybridRule[] }).rules
  const breakdown: CommissionBreakdown[] = []
  let totalCommission = 0
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    
    // Check if rule condition matches
    if (!evaluateCondition(rule.condition, input)) {
      continue
    }
    
    // Calculate commission for this rule
    let ruleCommission = 0
    
    switch (rule.type) {
      case 'PERCENTAGE':
        ruleCommission = input.grossAmount * (rule.rate || 0)
        breakdown.push({
          component: `rule_${i + 1}_percentage`,
          amount: ruleCommission,
          calculation: `${input.grossAmount} × ${rule.rate} = ${ruleCommission}`
        })
        break
        
      case 'FIXED':
        ruleCommission = rule.fixedAmount || 0
        breakdown.push({
          component: `rule_${i + 1}_fixed`,
          amount: ruleCommission,
          calculation: `Fixed: ${ruleCommission}`
        })
        break
        
      case 'TIERED':
        if (rule.tiers) {
          const volume = input.historicalVolume ?? input.grossAmount
          const tier = rule.tiers.find(t => 
            volume >= t.minVolume && (t.maxVolume === null || volume <= t.maxVolume)
          )
          if (tier) {
            ruleCommission = tier.fixedAmount ?? (input.grossAmount * tier.rate)
            breakdown.push({
              component: `rule_${i + 1}_tiered`,
              amount: ruleCommission,
              calculation: `Tier rate applied: ${ruleCommission}`
            })
          }
        }
        break
    }
    
    totalCommission += ruleCommission
  }
  
  // Add setup fee if first payment
  if (input.isFirstPayment && agreement.setupFee) {
    const setupFee = Number(agreement.setupFee)
    breakdown.push({
      component: 'setup_fee',
      amount: setupFee,
      calculation: `First payment setup fee: ${setupFee}`
    })
    totalCommission += setupFee
  }
  
  // Apply min/max caps
  const { capped, cappedAmount, capBreakdown } = applyMinMaxCaps(
    totalCommission,
    agreement.minCommission ? Number(agreement.minCommission) : null,
    agreement.maxCommission ? Number(agreement.maxCommission) : null
  )
  
  if (capped && capBreakdown) {
    breakdown.push(capBreakdown)
    totalCommission = cappedAmount
  }
  
  return {
    success: true,
    commissionAmount: roundCurrency(totalCommission),
    currency: input.currency,
    details: {
      commissionType: 'HYBRID',
      formula: 'Sum of matching rules',
      inputs: {
        rulesEvaluated: rules.length,
        rulesMatched: breakdown.filter(b => b.component.startsWith('rule_')).length
      },
      breakdown
    }
  }
}

/**
 * Evaluate a rule condition
 */
function evaluateCondition(condition: RuleCondition, input: CommissionCalculationInput): boolean {
  let fieldValue: any
  
  switch (condition.field) {
    case 'eventType':
      fieldValue = input.eventType
      break
    case 'grossAmount':
      fieldValue = input.grossAmount
      break
    case 'module':
      fieldValue = input.modules
      break
    case 'isFirstPayment':
      fieldValue = input.isFirstPayment
      break
    default:
      return false
  }
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value
    case 'in':
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(v => condition.value.includes(v))
      }
      return Array.isArray(condition.value) && condition.value.includes(fieldValue)
    case 'gt':
      return fieldValue > condition.value
    case 'gte':
      return fieldValue >= condition.value
    case 'lt':
      return fieldValue < condition.value
    case 'lte':
      return fieldValue <= condition.value
    default:
      return false
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply min/max caps to commission amount
 */
function applyMinMaxCaps(
  amount: number,
  min: number | null,
  max: number | null
): { capped: boolean; cappedAmount: number; capBreakdown?: CommissionBreakdown } {
  if (min !== null && amount < min) {
    return {
      capped: true,
      cappedAmount: min,
      capBreakdown: {
        component: 'min_cap',
        amount: min - amount,
        calculation: `Minimum cap applied: ${amount} → ${min}`
      }
    }
  }
  
  if (max !== null && amount > max) {
    return {
      capped: true,
      cappedAmount: max,
      capBreakdown: {
        component: 'max_cap',
        amount: max - amount,
        calculation: `Maximum cap applied: ${amount} → ${max}`
      }
    }
  }
  
  return { capped: false, cappedAmount: amount }
}

/**
 * Round to 2 decimal places for currency
 */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100
}

// ============================================================================
// EXAMPLES (for documentation and testing)
// ============================================================================

export const COMMISSION_EXAMPLES = {
  // Example 1: Simple 15% commission
  simplePercentage: {
    agreementConfig: {
      commissionType: 'PERCENTAGE' as const,
      commissionTrigger: 'ON_PAYMENT' as const,
      commissionRate: 0.15,
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, eventType: 'SUBSCRIPTION_RENEWED' },
      output: { commissionAmount: 15.00, formula: '100 × 0.15 = 15.00' }
    }
  },
  
  // Example 2: Fixed $10 per renewal
  fixedRecurring: {
    agreementConfig: {
      commissionType: 'FIXED' as const,
      commissionTrigger: 'ON_RENEWAL' as const,
      fixedAmount: 10.00,
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, eventType: 'SUBSCRIPTION_RENEWED' },
      output: { commissionAmount: 10.00, formula: 'Fixed: 10.00' }
    }
  },
  
  // Example 3: One-time $50 setup fee
  setupFee: {
    agreementConfig: {
      commissionType: 'PERCENTAGE' as const,
      commissionTrigger: 'ON_SIGNUP' as const,
      commissionRate: 0,
      setupFee: 50.00,
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, eventType: 'SUBSCRIPTION_ACTIVATED', isFirstPayment: true },
      output: { commissionAmount: 50.00, formula: 'Setup fee: 50.00' }
    }
  },
  
  // Example 4: 10% + $25 setup fee
  percentagePlusSetup: {
    agreementConfig: {
      commissionType: 'PERCENTAGE' as const,
      commissionTrigger: 'ON_PAYMENT' as const,
      commissionRate: 0.10,
      setupFee: 25.00,
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, eventType: 'SUBSCRIPTION_ACTIVATED', isFirstPayment: true },
      output: { commissionAmount: 35.00, formula: '(100 × 0.10) + 25.00 = 35.00' }
    }
  },
  
  // Example 5: Volume-based tiers
  tieredByVolume: {
    agreementConfig: {
      commissionType: 'TIERED' as const,
      commissionTrigger: 'ON_PAYMENT' as const,
      commissionTiers: [
        { minVolume: 0, maxVolume: 10000, rate: 0.20 },      // 20% for < $10k
        { minVolume: 10000, maxVolume: 50000, rate: 0.15 },  // 15% for $10k-$50k
        { minVolume: 50000, maxVolume: null, rate: 0.10 }    // 10% for > $50k
      ],
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, historicalVolume: 25000 },
      output: { commissionAmount: 15.00, formula: 'Tier 2 (15%): 100 × 0.15 = 15.00' }
    }
  },
  
  // Example 6: Hybrid - different rates by event type
  hybridModel: {
    agreementConfig: {
      commissionType: 'HYBRID' as const,
      commissionTrigger: 'ON_PAYMENT' as const,
      commissionRules: {
        rules: [
          {
            condition: { field: 'isFirstPayment', operator: 'equals', value: true },
            type: 'PERCENTAGE',
            rate: 0.25  // 25% on first payment
          },
          {
            condition: { field: 'eventType', operator: 'equals', value: 'SUBSCRIPTION_RENEWED' },
            type: 'PERCENTAGE',
            rate: 0.10  // 10% on renewals
          }
        ]
      },
      clearanceDays: 30
    },
    example: {
      input: { grossAmount: 100, eventType: 'SUBSCRIPTION_ACTIVATED', isFirstPayment: true },
      output: { commissionAmount: 25.00, formula: 'Rule 1 (first payment): 100 × 0.25 = 25.00' }
    }
  }
}
