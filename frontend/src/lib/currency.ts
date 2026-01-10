/**
 * Currency Formatting Service
 * 
 * Nigeria-first currency formatting utilities for the WebWaka platform.
 * Provides consistent monetary display across all commerce suites.
 * 
 * @module lib/currency
 */

// ============================================================================
// TYPES
// ============================================================================

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR'

export interface CurrencyConfig {
  code: SupportedCurrency
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  thousandSeparator: string
  decimalSeparator: string
  locale: string
}

// ============================================================================
// CURRENCY CONFIGURATIONS
// ============================================================================

const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-NG'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-US'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-GB'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    locale: 'de-DE'
  }
}

// Default currency for Nigeria-first platform
export const DEFAULT_CURRENCY: SupportedCurrency = 'NGN'

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: SupportedCurrency = DEFAULT_CURRENCY): CurrencyConfig {
  return CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS[DEFAULT_CURRENCY]
}

/**
 * Format a number as currency with the appropriate symbol and formatting
 * 
 * @example
 * formatCurrency(1234.56) // "₦1,234.56"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 * formatCurrency(0) // "₦0.00"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string {
  const config = getCurrencyConfig(currency)
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  
  if (isNaN(numAmount)) {
    return `${config.symbol}0.00`
  }
  
  // Use Intl.NumberFormat for proper locale-aware formatting
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  }).format(Math.abs(numAmount))
  
  const sign = numAmount < 0 ? '-' : ''
  
  if (config.symbolPosition === 'before') {
    return `${sign}${config.symbol}${formatted}`
  } else {
    return `${sign}${formatted}${config.symbol}`
  }
}

/**
 * Format Nigerian Naira specifically
 * Convenience function for the most common use case
 * 
 * @example
 * formatNGN(1234.56) // "₦1,234.56"
 * formatNGN(1000000) // "₦1,000,000.00"
 */
export function formatNGN(amount: number | string | null | undefined): string {
  return formatCurrency(amount, 'NGN')
}

/**
 * Format currency without the symbol (for inputs and calculations)
 * 
 * @example
 * formatAmount(1234.56) // "1,234.56"
 */
export function formatAmount(
  amount: number | string | null | undefined,
  locale: string = 'en-NG'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  
  if (isNaN(numAmount)) {
    return '0.00'
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
}

/**
 * Get just the currency symbol
 * 
 * @example
 * getCurrencySymbol('NGN') // "₦"
 * getCurrencySymbol('USD') // "$"
 */
export function getCurrencySymbol(currency: SupportedCurrency = DEFAULT_CURRENCY): string {
  return getCurrencyConfig(currency).symbol
}

/**
 * Parse a currency string back to a number
 * Handles various formats including Nigerian number formatting
 * 
 * @example
 * parseCurrencyString("₦1,234.56") // 1234.56
 * parseCurrencyString("1,234.56") // 1234.56
 * parseCurrencyString("$1,234.56") // 1234.56
 */
export function parseCurrencyString(value: string): number {
  if (!value) return 0
  
  // Remove currency symbols and whitespace
  const cleaned = value
    .replace(/[₦$£€\s]/g, '')
    .replace(/,/g, '')
    .trim()
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a price range
 * 
 * @example
 * formatPriceRange(100, 500) // "₦100.00 - ₦500.00"
 * formatPriceRange(100, 100) // "₦100.00"
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string {
  if (min === max) {
    return formatCurrency(min, currency)
  }
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
}

/**
 * Format discount display
 * 
 * @example
 * formatDiscount(10, 'percentage') // "10% off"
 * formatDiscount(500, 'fixed', 'NGN') // "₦500.00 off"
 */
export function formatDiscount(
  value: number,
  type: 'percentage' | 'fixed',
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string {
  if (type === 'percentage') {
    return `${value}% off`
  }
  return `${formatCurrency(value, currency)} off`
}

/**
 * Format free shipping threshold message
 * 
 * @example
 * formatFreeShippingMessage(5000, 3500) // "Add ₦1,500.00 more for free shipping"
 * formatFreeShippingMessage(5000, 6000) // null (already qualifies)
 */
export function formatFreeShippingMessage(
  threshold: number,
  currentTotal: number,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string | null {
  const remaining = threshold - currentTotal
  if (remaining <= 0) return null
  return `Add ${formatCurrency(remaining, currency)} more for free shipping`
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return code in CURRENCY_CONFIGS
}

// ============================================================================
// COMPACT FORMATTING (for tight UI spaces)
// ============================================================================

/**
 * Format large amounts in compact notation
 * 
 * @example
 * formatCompact(1500000) // "₦1.5M"
 * formatCompact(250000) // "₦250K"
 * formatCompact(1234) // "₦1,234"
 */
export function formatCompact(
  amount: number,
  currency: SupportedCurrency = DEFAULT_CURRENCY
): string {
  const config = getCurrencyConfig(currency)
  
  if (amount >= 1000000) {
    const millions = amount / 1000000
    return `${config.symbol}${millions.toFixed(1)}M`
  }
  
  if (amount >= 100000) {
    const thousands = amount / 1000
    return `${config.symbol}${Math.round(thousands)}K`
  }
  
  return formatCurrency(amount, currency)
}
