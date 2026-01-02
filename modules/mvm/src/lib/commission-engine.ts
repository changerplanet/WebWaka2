/**
 * MVM Commission Engine
 * 
 * Calculates vendor commissions based on rules.
 * 
 * RULES:
 * - Commission calculation ONLY
 * - NO money movement
 * - NO wallet mutations
 * - NO payout execution
 * 
 * Supports:
 * - Percentage commissions
 * - Fixed amount commissions
 * - Category-based commissions
 * - Product-specific commissions
 * - Vendor tier-based commissions
 * - Tiered volume-based commissions
 * - Time-limited promotional rates
 */

// ============================================================================
// TYPES
// ============================================================================

export type CommissionRuleType =
  | 'GLOBAL'
  | 'CATEGORY'
  | 'PRODUCT'
  | 'VENDOR_TIER'
  | 'PROMOTIONAL'

export type CommissionCalculation =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'TIERED'

export interface CommissionRule {
  id: string
  tenantId: string
  vendorId?: string // null = tenant-wide rule
  name: string
  description?: string
  ruleType: CommissionRuleType
  calculation: CommissionCalculation
  rate: number // Percentage or fixed amount
  categoryId?: string
  productId?: string
  vendorTierId?: string
  tierRates?: TieredRate[]
  startsAt?: string
  endsAt?: string
  priority: number
  isActive: boolean
}

export interface TieredRate {
  min: number
  max: number | null
  rate: number
}

export interface CommissionContext {
  tenantId: string
  vendorId: string
  vendorTierId?: string
  productId: string
  categoryId?: string
  saleAmount: number
  quantity: number
  orderDate: Date
  vendorMonthlySales?: number // For tiered calculations
}

export interface CommissionResult {
  ruleId?: string
  ruleName?: string
  ruleType: CommissionRuleType
  calculation: CommissionCalculation
  baseAmount: number
  rate: number
  commissionAmount: number
  vendorEarnings: number
  appliedAt: string
}

export interface BulkCommissionResult {
  items: Array<{
    productId: string
    lineTotal: number
    commission: CommissionResult
  }>
  totalSaleAmount: number
  totalCommission: number
  totalVendorEarnings: number
  averageCommissionRate: number
}

// ============================================================================
// COMMISSION ENGINE
// ============================================================================

export class CommissionEngine {
  private rules: CommissionRule[]
  private tenantDefaultRate: number
  
  constructor(rules: CommissionRule[], tenantDefaultRate: number = 15) {
    // Sort rules by priority (higher first)
    this.rules = [...rules].sort((a, b) => b.priority - a.priority)
    this.tenantDefaultRate = tenantDefaultRate
  }
  
  /**
   * Calculate commission for a single item
   */
  calculateCommission(context: CommissionContext): CommissionResult {
    const now = context.orderDate
    
    // Find applicable rule
    const rule = this.findApplicableRule(context, now)
    
    if (!rule) {
      // Use default tenant rate
      return this.applyDefaultCommission(context)
    }
    
    return this.applyRule(rule, context)
  }
  
  /**
   * Calculate commission for multiple items
   */
  calculateBulkCommission(
    contexts: CommissionContext[]
  ): BulkCommissionResult {
    const items = contexts.map(ctx => ({
      productId: ctx.productId,
      lineTotal: ctx.saleAmount,
      commission: this.calculateCommission(ctx)
    }))
    
    const totalSaleAmount = items.reduce((sum, i) => sum + i.lineTotal, 0)
    const totalCommission = items.reduce((sum, i) => sum + i.commission.commissionAmount, 0)
    const totalVendorEarnings = items.reduce((sum, i) => sum + i.commission.vendorEarnings, 0)
    const averageCommissionRate = totalSaleAmount > 0 
      ? (totalCommission / totalSaleAmount) * 100 
      : 0
    
    return {
      items,
      totalSaleAmount,
      totalCommission,
      totalVendorEarnings,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100
    }
  }
  
  /**
   * Find the applicable commission rule
   */
  private findApplicableRule(
    context: CommissionContext,
    now: Date
  ): CommissionRule | undefined {
    for (const rule of this.rules) {
      if (!rule.isActive) continue
      
      // Check tenant match
      if (rule.tenantId !== context.tenantId) continue
      
      // Check time constraints
      if (rule.startsAt && new Date(rule.startsAt) > now) continue
      if (rule.endsAt && new Date(rule.endsAt) < now) continue
      
      // Check rule type applicability
      switch (rule.ruleType) {
        case 'PRODUCT':
          if (rule.productId === context.productId) {
            // Check vendor-specific rule
            if (rule.vendorId && rule.vendorId !== context.vendorId) continue
            return rule
          }
          break
          
        case 'CATEGORY':
          if (rule.categoryId === context.categoryId) {
            if (rule.vendorId && rule.vendorId !== context.vendorId) continue
            return rule
          }
          break
          
        case 'VENDOR_TIER':
          if (rule.vendorTierId === context.vendorTierId) {
            return rule
          }
          break
          
        case 'PROMOTIONAL':
          // Promotional rules are time-bound and already checked above
          if (rule.vendorId && rule.vendorId !== context.vendorId) continue
          return rule
          
        case 'GLOBAL':
          // Global rules apply to everyone in tenant
          if (rule.vendorId && rule.vendorId !== context.vendorId) continue
          return rule
      }
    }
    
    return undefined
  }
  
  /**
   * Apply a commission rule
   */
  private applyRule(
    rule: CommissionRule,
    context: CommissionContext
  ): CommissionResult {
    let rate: number
    let commissionAmount: number
    
    switch (rule.calculation) {
      case 'PERCENTAGE':
        rate = rule.rate
        commissionAmount = this.round((context.saleAmount * rate) / 100)
        break
        
      case 'FIXED':
        rate = 0 // Fixed amount, not percentage
        commissionAmount = rule.rate * context.quantity
        break
        
      case 'TIERED':
        const tieredResult = this.calculateTieredCommission(
          rule.tierRates || [],
          context.vendorMonthlySales || 0,
          context.saleAmount
        )
        rate = tieredResult.rate
        commissionAmount = tieredResult.amount
        break
        
      default:
        rate = rule.rate
        commissionAmount = this.round((context.saleAmount * rate) / 100)
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      calculation: rule.calculation,
      baseAmount: context.saleAmount,
      rate,
      commissionAmount,
      vendorEarnings: this.round(context.saleAmount - commissionAmount),
      appliedAt: new Date().toISOString()
    }
  }
  
  /**
   * Apply default commission rate
   */
  private applyDefaultCommission(context: CommissionContext): CommissionResult {
    const commissionAmount = this.round((context.saleAmount * this.tenantDefaultRate) / 100)
    
    return {
      ruleType: 'GLOBAL',
      calculation: 'PERCENTAGE',
      baseAmount: context.saleAmount,
      rate: this.tenantDefaultRate,
      commissionAmount,
      vendorEarnings: this.round(context.saleAmount - commissionAmount),
      appliedAt: new Date().toISOString()
    }
  }
  
  /**
   * Calculate tiered commission based on volume
   */
  private calculateTieredCommission(
    tiers: TieredRate[],
    currentVolume: number,
    saleAmount: number
  ): { rate: number; amount: number } {
    // Find applicable tier based on current monthly volume
    const sortedTiers = [...tiers].sort((a, b) => a.min - b.min)
    
    let applicableTier: TieredRate | undefined
    for (const tier of sortedTiers) {
      if (currentVolume >= tier.min && (tier.max === null || currentVolume < tier.max)) {
        applicableTier = tier
        break
      }
    }
    
    // Fall back to highest tier if none match
    if (!applicableTier && sortedTiers.length > 0) {
      applicableTier = sortedTiers[sortedTiers.length - 1]
    }
    
    const rate = applicableTier?.rate || this.tenantDefaultRate
    const amount = this.round((saleAmount * rate) / 100)
    
    return { rate, amount }
  }
  
  /**
   * Round to 2 decimal places
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100
  }
  
  // ==========================================================================
  // RULE VALIDATION
  // ==========================================================================
  
  /**
   * Validate a commission rule
   */
  static validateRule(rule: Partial<CommissionRule>): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (!rule.name || rule.name.length < 2) {
      errors.push('Rule name is required (min 2 characters)')
    }
    
    if (!rule.ruleType) {
      errors.push('Rule type is required')
    }
    
    if (!rule.calculation) {
      errors.push('Calculation method is required')
    }
    
    if (rule.rate === undefined || rule.rate === null) {
      errors.push('Rate is required')
    } else {
      if (rule.calculation === 'PERCENTAGE' && (rule.rate < 0 || rule.rate > 100)) {
        errors.push('Percentage rate must be between 0 and 100')
      }
      if (rule.calculation === 'FIXED' && rule.rate < 0) {
        errors.push('Fixed rate must be non-negative')
      }
    }
    
    if (rule.ruleType === 'CATEGORY' && !rule.categoryId) {
      errors.push('Category ID required for category-based rules')
    }
    
    if (rule.ruleType === 'PRODUCT' && !rule.productId) {
      errors.push('Product ID required for product-based rules')
    }
    
    if (rule.ruleType === 'VENDOR_TIER' && !rule.vendorTierId) {
      errors.push('Vendor tier ID required for tier-based rules')
    }
    
    if (rule.ruleType === 'PROMOTIONAL') {
      if (!rule.startsAt) {
        errors.push('Start date required for promotional rules')
      }
      if (!rule.endsAt) {
        errors.push('End date required for promotional rules')
      }
      if (rule.startsAt && rule.endsAt && new Date(rule.startsAt) >= new Date(rule.endsAt)) {
        errors.push('End date must be after start date')
      }
    }
    
    if (rule.calculation === 'TIERED') {
      if (!rule.tierRates || rule.tierRates.length === 0) {
        errors.push('Tier rates required for tiered calculation')
      } else {
        // Validate tier coverage
        const sortedTiers = [...rule.tierRates].sort((a, b) => a.min - b.min)
        if (sortedTiers[0].min !== 0) {
          errors.push('Tier rates should start from 0')
        }
        
        // Check for gaps
        for (let i = 1; i < sortedTiers.length; i++) {
          if (sortedTiers[i-1].max !== null && sortedTiers[i].min !== sortedTiers[i-1].max) {
            errors.push('Tier rates have gaps')
            break
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  // ==========================================================================
  // PAYOUT RECORD HELPERS
  // ==========================================================================
  
  /**
   * Calculate payout breakdown
   * NOTE: This only calculates - no money movement
   */
  static calculatePayoutBreakdown(subOrders: Array<{
    id: string
    grandTotal: number
    commissionAmount: number
    vendorEarnings: number
    status: string
  }>): {
    eligibleSubOrders: string[]
    grossAmount: number
    totalCommission: number
    netAmount: number
  } {
    // Only delivered orders are eligible for payout
    const eligible = subOrders.filter(so => so.status === 'DELIVERED')
    
    const grossAmount = eligible.reduce((sum, so) => sum + so.grandTotal, 0)
    const totalCommission = eligible.reduce((sum, so) => sum + so.commissionAmount, 0)
    const netAmount = eligible.reduce((sum, so) => sum + so.vendorEarnings, 0)
    
    return {
      eligibleSubOrders: eligible.map(so => so.id),
      grossAmount: Math.round(grossAmount * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    }
  }
  
  /**
   * Check if vendor meets minimum payout threshold
   */
  static meetsPayoutThreshold(
    pendingAmount: number,
    minimumThreshold: number = 50
  ): boolean {
    return pendingAmount >= minimumThreshold
  }
  
  /**
   * Generate payout schedule
   * NOTE: Scheduling only - no actual payout execution
   */
  static getNextPayoutDate(
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    fromDate: Date = new Date()
  ): Date {
    const nextDate = new Date(fromDate)
    
    switch (frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (7 - nextDate.getDay()))
        break
      case 'BIWEEKLY':
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1, 1)
        break
    }
    
    return nextDate
  }
}

// CommissionEngine is exported inline with its declaration
