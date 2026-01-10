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
  CommissionEngine,
  CommissionCalculator,
  type CommissionRule,
  type CommissionTier,
  type CommissionCalculation,
  type CommissionType,
  type TierType
} from '../commission-engine'

// Additional type aliases for canonical naming
export type { CommissionRule as CommissionRuleConfig }
export type { CommissionCalculation as CommissionResult }
