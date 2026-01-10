/**
 * Tax Configuration Service
 * 
 * Nigeria-first tax calculation utilities for the WebWaka platform.
 * Provides tenant-configurable tax rates with Nigerian VAT as default.
 * 
 * @module lib/tax
 */

import { prisma } from './prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface TaxConfig {
  tenantId: string
  taxRate: number         // As decimal (0.075 = 7.5%)
  taxName: string         // "VAT", "Sales Tax", etc.
  taxEnabled: boolean
  taxIncludedInPrice: boolean
  exemptCategories: string[]
  exemptProducts: string[]
}

export interface TaxCalculation {
  subtotal: number
  taxableAmount: number
  taxAmount: number
  taxRate: number
  taxName: string
  total: number
}

// ============================================================================
// NIGERIAN TAX DEFAULTS
// ============================================================================

/**
 * Nigerian VAT rate as of 2024
 * Standard VAT rate in Nigeria is 7.5%
 */
export const NIGERIA_VAT_RATE = 0.075

/**
 * Default tax configuration for Nigerian businesses
 */
export const DEFAULT_TAX_CONFIG: Omit<TaxConfig, 'tenantId'> = {
  taxRate: NIGERIA_VAT_RATE,
  taxName: 'VAT',
  taxEnabled: true,
  taxIncludedInPrice: false,
  exemptCategories: [],
  exemptProducts: []
}

// ============================================================================
// TAX CONFIGURATION CACHE
// ============================================================================

// Simple in-memory cache for tax configs (1 hour TTL)
const taxConfigCache = new Map<string, { config: TaxConfig; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Get tax configuration for a tenant
 * Returns Nigerian VAT defaults if no custom config exists
 */
export async function getTaxConfig(tenantId: string): Promise<TaxConfig> {
  // Check cache first
  const cached = taxConfigCache.get(tenantId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }
  
  try {
    // Try to get tenant-specific tax config from entitlements
    // Tax configuration can be stored in the SVM entitlement limits
    const entitlement = await prisma.entitlement.findFirst({
      where: { 
        tenantId,
        module: 'SVM',
        status: 'ACTIVE'
      },
      select: { limits: true }
    })
    
    const limits = entitlement?.limits as Record<string, unknown> | null
    
    if (limits?.tax_config) {
      const taxSettings = limits.tax_config as Partial<TaxConfig>
      const config: TaxConfig = {
        tenantId,
        taxRate: taxSettings.taxRate ?? DEFAULT_TAX_CONFIG.taxRate,
        taxName: taxSettings.taxName ?? DEFAULT_TAX_CONFIG.taxName,
        taxEnabled: taxSettings.taxEnabled ?? DEFAULT_TAX_CONFIG.taxEnabled,
        taxIncludedInPrice: taxSettings.taxIncludedInPrice ?? DEFAULT_TAX_CONFIG.taxIncludedInPrice,
        exemptCategories: taxSettings.exemptCategories ?? DEFAULT_TAX_CONFIG.exemptCategories,
        exemptProducts: taxSettings.exemptProducts ?? DEFAULT_TAX_CONFIG.exemptProducts
      }
      
      // Cache the result
      taxConfigCache.set(tenantId, { config, timestamp: Date.now() })
      return config
    }
  } catch (error) {
    console.error('[Tax] Error fetching tenant tax config:', error)
  }
  
  // Return defaults
  const defaultConfig: TaxConfig = {
    tenantId,
    ...DEFAULT_TAX_CONFIG
  }
  
  taxConfigCache.set(tenantId, { config: defaultConfig, timestamp: Date.now() })
  return defaultConfig
}

/**
 * Clear tax config cache for a tenant (call after settings update)
 */
export function clearTaxConfigCache(tenantId: string): void {
  taxConfigCache.delete(tenantId)
}

// ============================================================================
// TAX CALCULATION
// ============================================================================

/**
 * Calculate tax for a given amount
 * 
 * @example
 * const tax = await calculateTax('tenant_123', 10000)
 * // { subtotal: 10000, taxableAmount: 10000, taxAmount: 750, taxRate: 0.075, taxName: 'VAT', total: 10750 }
 */
export async function calculateTax(
  tenantId: string,
  subtotal: number,
  options?: {
    excludeCategories?: string[]
    excludeProducts?: string[]
    exemptAmount?: number
  }
): Promise<TaxCalculation> {
  const config = await getTaxConfig(tenantId)
  
  // If tax is disabled, return zero tax
  if (!config.taxEnabled) {
    return {
      subtotal,
      taxableAmount: 0,
      taxAmount: 0,
      taxRate: 0,
      taxName: config.taxName,
      total: subtotal
    }
  }
  
  // Calculate taxable amount (subtract any exemptions)
  const exemptAmount = options?.exemptAmount ?? 0
  const taxableAmount = Math.max(0, subtotal - exemptAmount)
  
  // Calculate tax
  let taxAmount: number
  
  if (config.taxIncludedInPrice) {
    // Tax is already included in the price, extract it
    // Formula: tax = price - (price / (1 + rate))
    taxAmount = taxableAmount - (taxableAmount / (1 + config.taxRate))
  } else {
    // Tax is added on top
    taxAmount = taxableAmount * config.taxRate
  }
  
  // Round to 2 decimal places
  taxAmount = Math.round(taxAmount * 100) / 100
  
  return {
    subtotal,
    taxableAmount,
    taxAmount,
    taxRate: config.taxRate,
    taxName: config.taxName,
    total: config.taxIncludedInPrice ? subtotal : subtotal + taxAmount
  }
}

/**
 * Calculate tax synchronously using default Nigerian VAT
 * Use this when you don't need tenant-specific config
 * 
 * @example
 * calculateTaxSync(10000) // 750
 * calculateTaxSync(10000, 0.05) // 500
 */
export function calculateTaxSync(
  subtotal: number,
  taxRate: number = NIGERIA_VAT_RATE
): number {
  return Math.round(subtotal * taxRate * 100) / 100
}

/**
 * Calculate tax for cart items with per-item exemptions
 */
export async function calculateCartTax(
  tenantId: string,
  items: Array<{
    productId: string
    categoryId?: string
    lineTotal: number
  }>
): Promise<TaxCalculation> {
  const config = await getTaxConfig(tenantId)
  
  let taxableTotal = 0
  let exemptTotal = 0
  
  for (const item of items) {
    // Check if item is exempt
    const isExempt = 
      config.exemptProducts.includes(item.productId) ||
      (item.categoryId && config.exemptCategories.includes(item.categoryId))
    
    if (isExempt) {
      exemptTotal += item.lineTotal
    } else {
      taxableTotal += item.lineTotal
    }
  }
  
  const subtotal = taxableTotal + exemptTotal
  
  return calculateTax(tenantId, subtotal, { exemptAmount: exemptTotal })
}

// ============================================================================
// TAX DISPLAY HELPERS
// ============================================================================

/**
 * Format tax rate as percentage string
 * 
 * @example
 * formatTaxRate(0.075) // "7.5%"
 * formatTaxRate(0.1) // "10%"
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%`
}

/**
 * Get tax display label
 * 
 * @example
 * getTaxLabel('VAT', 0.075) // "VAT (7.5%)"
 */
export function getTaxLabel(name: string, rate: number): string {
  return `${name} (${formatTaxRate(rate)})`
}

/**
 * Check if a product/category is tax exempt
 */
export async function isTaxExempt(
  tenantId: string,
  productId: string,
  categoryId?: string
): Promise<boolean> {
  const config = await getTaxConfig(tenantId)
  
  if (config.exemptProducts.includes(productId)) {
    return true
  }
  
  if (categoryId && config.exemptCategories.includes(categoryId)) {
    return true
  }
  
  return false
}
