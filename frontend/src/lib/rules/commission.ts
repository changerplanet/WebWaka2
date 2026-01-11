/**
 * COMMERCE RULES ENGINE
 * Commission Rules Module
 * 
 * CANONICAL WRAPPER - S2-S3
 * 
 * Re-exports the battle-tested commission engine from /lib/commission-engine.ts
 * with type exports for canonical usage.
 * 
 * @module lib/rules/commission
 */

// Re-export everything from the existing commission engine
export {
  calculateCommission,
  COMMISSION_EXAMPLES,
  type CommissionCalculationInput,
  type CommissionCalculationResult,
  type CommissionBreakdown,
  type CommissionTier,
  type HybridRule,
  type RuleCondition
} from '../commission-engine'

// Additional type aliases for canonical naming
export type { CommissionCalculationInput as CommissionRule }
export type { CommissionCalculationResult as CommissionCalculation }
