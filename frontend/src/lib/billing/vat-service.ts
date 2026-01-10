/**
 * BILLING & SUBSCRIPTIONS SUITE
 * VAT Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Nigerian VAT (7.5%) calculations:
 * - Inclusive pricing (VAT included)
 * - Exclusive pricing (VAT added on top)
 * - Exemption handling
 * 
 * @module lib/billing/vat-service
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Nigerian VAT rate (7.5%)
 */
export const NIGERIAN_VAT_RATE = 7.5

/**
 * VAT exemption categories
 */
export const VAT_EXEMPT_CATEGORIES = [
  'BASIC_FOOD', // Basic food items
  'MEDICAL', // Medical & pharmaceutical products
  'EDUCATION', // Educational materials & services
  'EXPORTS', // Exported goods
  'AGRICULTURAL', // Agricultural equipment
  'NGO_ACTIVITIES', // NGO/charitable activities
  'GOVERNMENT', // Government services
] as const

export type VATExemptCategory = typeof VAT_EXEMPT_CATEGORIES[number]

// ============================================================================
// TYPES
// ============================================================================

export interface VATBreakdown {
  subtotal: number // Amount before VAT
  vatAmount: number // VAT amount
  grandTotal: number // Final amount
  vatRate: number // Rate applied
  isExempt: boolean
  exemptReason?: string
}

export interface VATCalculationInput {
  amount: number
  vatRate?: number // Defaults to Nigerian 7.5%
  vatInclusive?: boolean // Is VAT already included?
  vatExempt?: boolean
  exemptReason?: string
}

// ============================================================================
// VAT SERVICE
// ============================================================================

export class VATService {
  /**
   * Calculate VAT on an amount (VAT exclusive pricing)
   */
  static calculateVAT(amount: number, vatRate: number = NIGERIAN_VAT_RATE): number {
    return Math.round(amount * (vatRate / 100) * 100) / 100
  }

  /**
   * Extract VAT from VAT-inclusive price
   */
  static extractVATFromInclusive(
    inclusiveAmount: number,
    vatRate: number = NIGERIAN_VAT_RATE
  ): number {
    const exclusiveAmount = inclusiveAmount / (1 + vatRate / 100)
    return Math.round((inclusiveAmount - exclusiveAmount) * 100) / 100
  }

  /**
   * Get amount excluding VAT from VAT-inclusive price
   */
  static getExclusiveAmount(
    inclusiveAmount: number,
    vatRate: number = NIGERIAN_VAT_RATE
  ): number {
    return Math.round((inclusiveAmount / (1 + vatRate / 100)) * 100) / 100
  }

  /**
   * Get amount including VAT from VAT-exclusive price
   */
  static getInclusiveAmount(
    exclusiveAmount: number,
    vatRate: number = NIGERIAN_VAT_RATE
  ): number {
    return Math.round((exclusiveAmount * (1 + vatRate / 100)) * 100) / 100
  }

  /**
   * Calculate full VAT breakdown
   */
  static calculateBreakdown(input: VATCalculationInput): VATBreakdown {
    const vatRate = input.vatExempt ? 0 : (input.vatRate ?? NIGERIAN_VAT_RATE)
    
    if (input.vatExempt) {
      return {
        subtotal: input.amount,
        vatAmount: 0,
        grandTotal: input.amount,
        vatRate: 0,
        isExempt: true,
        exemptReason: input.exemptReason
      }
    }

    if (input.vatInclusive) {
      // Price includes VAT - extract it
      const vatAmount = this.extractVATFromInclusive(input.amount, vatRate)
      const subtotal = input.amount - vatAmount
      
      return {
        subtotal,
        vatAmount,
        grandTotal: input.amount,
        vatRate,
        isExempt: false
      }
    } else {
      // Price excludes VAT - add it
      const vatAmount = this.calculateVAT(input.amount, vatRate)
      
      return {
        subtotal: input.amount,
        vatAmount,
        grandTotal: input.amount + vatAmount,
        vatRate,
        isExempt: false
      }
    }
  }

  /**
   * Calculate VAT for multiple items
   */
  static calculateItemsVAT(
    items: Array<{
      amount: number
      vatRate?: number
      vatExempt?: boolean
    }>,
    defaultVatRate: number = NIGERIAN_VAT_RATE,
    vatInclusive: boolean = false
  ): {
    items: Array<{ amount: number; vatAmount: number; total: number }>
    subtotal: number
    totalVat: number
    grandTotal: number
  } {
    let subtotal = 0
    let totalVat = 0

    const processedItems = items.map((item: any) => {
      const rate = item.vatExempt ? 0 : (item.vatRate ?? defaultVatRate)
      let vatAmount: number
      let itemTotal: number

      if (vatInclusive) {
        vatAmount = this.extractVATFromInclusive(item.amount, rate)
        itemTotal = item.amount
        subtotal += item.amount - vatAmount
      } else {
        vatAmount = this.calculateVAT(item.amount, rate)
        itemTotal = item.amount + vatAmount
        subtotal += item.amount
      }

      totalVat += vatAmount

      return {
        amount: item.amount,
        vatAmount,
        total: itemTotal
      }
    })

    return {
      items: processedItems,
      subtotal,
      totalVat,
      grandTotal: subtotal + totalVat
    }
  }

  /**
   * Check if a category is VAT exempt
   */
  static isExemptCategory(category: string): boolean {
    return VAT_EXEMPT_CATEGORIES.includes(category as VATExemptCategory)
  }

  /**
   * Get exemption reason for display
   */
  static getExemptionReason(category: VATExemptCategory): string {
    const reasons: Record<VATExemptCategory, string> = {
      BASIC_FOOD: 'VAT exempt: Basic food items',
      MEDICAL: 'VAT exempt: Medical & pharmaceutical products',
      EDUCATION: 'VAT exempt: Educational materials & services',
      EXPORTS: 'VAT exempt: Exported goods',
      AGRICULTURAL: 'VAT exempt: Agricultural equipment',
      NGO_ACTIVITIES: 'VAT exempt: NGO/charitable activities',
      GOVERNMENT: 'VAT exempt: Government services'
    }
    return reasons[category] || 'VAT exempt'
  }

  /**
   * Format VAT amount for display
   */
  static formatVAT(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency
    }).format(amount)
  }

  /**
   * Format VAT rate for display
   */
  static formatVATRate(rate: number): string {
    return `${rate}%`
  }
}
