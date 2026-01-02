/**
 * MVM Vendor Engine
 * 
 * Manages vendor lifecycle, onboarding, and product mapping.
 * 
 * RULES:
 * - Vendors are NOT tenants
 * - Vendors do NOT own customers
 * - Products come from Core catalog
 * - Inventory remains Core-owned
 */

// ============================================================================
// TYPES
// ============================================================================

export type VendorStatus = 
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'CHURNED'

export type VendorStaffRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER'

export type OnboardingStep =
  | 'REGISTERED'
  | 'PROFILE_COMPLETED'
  | 'BANK_INFO_ADDED'
  | 'PRODUCTS_ADDED'
  | 'AGREEMENT_SIGNED'
  | 'COMPLETED'

export interface VendorProfile {
  id: string
  tenantId: string
  name: string
  slug: string
  email: string
  phone?: string
  legalName?: string
  taxId?: string
  businessType?: string
  description?: string
  logo?: string
  banner?: string
  address?: VendorAddress
  status: VendorStatus
  isVerified: boolean
  tierId?: string
  tierName?: string
  commissionRate: number
  totalSales: number
  totalOrders: number
  averageRating?: number
  reviewCount: number
  onboardingStep: OnboardingStep
  createdAt: string
  approvedAt?: string
}

export interface VendorAddress {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface VendorStaffMember {
  id: string
  vendorId: string
  email: string
  name: string
  phone?: string
  role: VendorStaffRole
  permissions: string[]
  isActive: boolean
  invitedAt?: string
  acceptedAt?: string
  lastLoginAt?: string
}

export interface CreateVendorInput {
  tenantId: string
  name: string
  email: string
  phone?: string
  legalName?: string
  businessType?: string
  description?: string
  address?: VendorAddress
}

export interface UpdateVendorInput {
  name?: string
  phone?: string
  legalName?: string
  taxId?: string
  businessType?: string
  description?: string
  logo?: string
  banner?: string
  address?: VendorAddress
}

export interface VendorProductMappingInput {
  vendorId: string
  productId: string
  variantId?: string
  vendorPrice?: number
  compareAtPrice?: number
  minPrice?: number
  maxPrice?: number
  allocatedStock?: number
  commissionOverride?: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface ProductMapping {
  id: string
  vendorId: string
  productId: string
  variantId?: string
  vendorPrice?: number
  compareAtPrice?: number
  minPrice?: number
  maxPrice?: number
  allocatedStock?: number
  commissionOverride?: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
}

// ============================================================================
// VENDOR ENGINE
// ============================================================================

export class VendorEngine {
  /**
   * Generate URL-friendly slug from vendor name
   */
  static generateSlug(name: string, existingSlugs: string[] = []): string {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    return slug
  }
  
  /**
   * Validate vendor profile data
   */
  static validateProfile(data: CreateVendorInput | UpdateVendorInput): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if ('name' in data && data.name) {
      if (data.name.length < 2) {
        errors.push('Vendor name must be at least 2 characters')
      }
      if (data.name.length > 100) {
        errors.push('Vendor name must be less than 100 characters')
      }
    }
    
    if ('email' in data && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email address')
      }
    }
    
    if (data.phone) {
      const phoneRegex = /^\+?[\d\s-()]{10,}$/
      if (!phoneRegex.test(data.phone)) {
        errors.push('Invalid phone number')
      }
    }
    
    if (data.description && data.description.length > 5000) {
      errors.push('Description must be less than 5000 characters')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Determine next onboarding step
   */
  static getNextOnboardingStep(
    currentStep: OnboardingStep,
    profile: Partial<VendorProfile>
  ): OnboardingStep {
    const steps: OnboardingStep[] = [
      'REGISTERED',
      'PROFILE_COMPLETED',
      'BANK_INFO_ADDED',
      'PRODUCTS_ADDED',
      'AGREEMENT_SIGNED',
      'COMPLETED'
    ]
    
    const currentIndex = steps.indexOf(currentStep)
    
    // Check if current step requirements are met
    switch (currentStep) {
      case 'REGISTERED':
        if (profile.name && profile.email && profile.description) {
          return 'PROFILE_COMPLETED'
        }
        break
      case 'PROFILE_COMPLETED':
        // Bank info check would be done externally
        return 'BANK_INFO_ADDED'
      case 'BANK_INFO_ADDED':
        // Products check would be done externally
        return 'PRODUCTS_ADDED'
      case 'PRODUCTS_ADDED':
        return 'AGREEMENT_SIGNED'
      case 'AGREEMENT_SIGNED':
        return 'COMPLETED'
    }
    
    return currentStep
  }
  
  /**
   * Check if vendor can transition to a new status
   */
  static canTransitionStatus(
    from: VendorStatus,
    to: VendorStatus
  ): { allowed: boolean; reason?: string } {
    const transitions: Record<VendorStatus, VendorStatus[]> = {
      'PENDING_APPROVAL': ['APPROVED', 'REJECTED'],
      'APPROVED': ['SUSPENDED', 'CHURNED'],
      'SUSPENDED': ['APPROVED', 'CHURNED'],
      'REJECTED': ['PENDING_APPROVAL'], // Can reapply
      'CHURNED': [] // Terminal state
    }
    
    if (transitions[from].includes(to)) {
      return { allowed: true }
    }
    
    return {
      allowed: false,
      reason: `Cannot transition from ${from} to ${to}`
    }
  }
  
  /**
   * Calculate vendor performance score
   */
  static calculatePerformanceScore(metrics: {
    totalOrders: number
    averageRating?: number
    fulfillmentRate: number // 0-1
    responseTime: number // hours
    returnRate: number // 0-1
  }): number {
    let score = 0
    
    // Order volume (20 points)
    if (metrics.totalOrders >= 100) score += 20
    else if (metrics.totalOrders >= 50) score += 15
    else if (metrics.totalOrders >= 10) score += 10
    else score += 5
    
    // Rating (30 points)
    if (metrics.averageRating) {
      score += (metrics.averageRating / 5) * 30
    }
    
    // Fulfillment rate (25 points)
    score += metrics.fulfillmentRate * 25
    
    // Response time (15 points)
    if (metrics.responseTime <= 4) score += 15
    else if (metrics.responseTime <= 12) score += 10
    else if (metrics.responseTime <= 24) score += 5
    
    // Low return rate (10 points)
    score += (1 - metrics.returnRate) * 10
    
    return Math.round(score)
  }
}

// ============================================================================
// PRODUCT MAPPING ENGINE
// ============================================================================

export class ProductMappingEngine {
  /**
   * Validate product pricing against rules
   */
  static validatePricing(input: {
    vendorPrice: number
    minPrice?: number
    maxPrice?: number
    corePrice?: number
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (input.vendorPrice <= 0) {
      errors.push('Vendor price must be greater than 0')
    }
    
    if (input.minPrice && input.vendorPrice < input.minPrice) {
      errors.push(`Price must be at least ${input.minPrice}`)
    }
    
    if (input.maxPrice && input.vendorPrice > input.maxPrice) {
      errors.push(`Price must not exceed ${input.maxPrice}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Calculate effective price for a vendor product
   */
  static getEffectivePrice(mapping: {
    vendorPrice?: number
    corePrice: number
  }): number {
    return mapping.vendorPrice ?? mapping.corePrice
  }
  
  /**
   * Check if vendor can sell a product
   */
  static canVendorSellProduct(
    mapping: ProductMapping,
    requestedQuantity: number,
    availableInventory: number
  ): { canSell: boolean; reason?: string; maxQuantity: number } {
    if (!mapping.isActive) {
      return { canSell: false, reason: 'Product mapping is inactive', maxQuantity: 0 }
    }
    
    // If vendor has allocated stock, check against that
    if (mapping.allocatedStock !== undefined && mapping.allocatedStock !== null) {
      if (requestedQuantity > mapping.allocatedStock) {
        return {
          canSell: false,
          reason: 'Exceeds vendor allocated stock',
          maxQuantity: mapping.allocatedStock
        }
      }
      return { canSell: true, maxQuantity: mapping.allocatedStock }
    }
    
    // Otherwise check against Core inventory
    if (requestedQuantity > availableInventory) {
      return {
        canSell: false,
        reason: 'Insufficient inventory',
        maxQuantity: availableInventory
      }
    }
    
    return { canSell: true, maxQuantity: availableInventory }
  }
  
  /**
   * Get products for a vendor with filtering
   */
  static filterMappings(
    mappings: ProductMapping[],
    filters: {
      isActive?: boolean
      isFeatured?: boolean
      productIds?: string[]
    }
  ): ProductMapping[] {
    return mappings.filter(m => {
      if (filters.isActive !== undefined && m.isActive !== filters.isActive) {
        return false
      }
      if (filters.isFeatured !== undefined && m.isFeatured !== filters.isFeatured) {
        return false
      }
      if (filters.productIds && !filters.productIds.includes(m.productId)) {
        return false
      }
      return true
    })
  }
}

// ============================================================================
// VENDOR TIER ENGINE
// ============================================================================

export interface VendorTier {
  id: string
  tenantId: string
  name: string
  code: string
  description?: string
  commissionRate: number
  priorityLevel: number
  featuredSlots: number
  supportLevel: 'STANDARD' | 'PRIORITY' | 'DEDICATED'
  minMonthlySales?: number
  minRating?: number
  minOrderCount?: number
  isActive: boolean
  isDefault: boolean
}

export class VendorTierEngine {
  /**
   * Check if vendor qualifies for a tier
   */
  static qualifiesForTier(
    vendor: {
      totalSales: number
      averageRating?: number
      totalOrders: number
    },
    tier: VendorTier
  ): boolean {
    if (tier.minMonthlySales && vendor.totalSales < tier.minMonthlySales) {
      return false
    }
    
    if (tier.minRating && (!vendor.averageRating || vendor.averageRating < tier.minRating)) {
      return false
    }
    
    if (tier.minOrderCount && vendor.totalOrders < tier.minOrderCount) {
      return false
    }
    
    return true
  }
  
  /**
   * Find best tier for vendor
   */
  static findBestTier(
    vendor: {
      totalSales: number
      averageRating?: number
      totalOrders: number
    },
    tiers: VendorTier[]
  ): VendorTier | undefined {
    // Sort by priority (highest first)
    const sortedTiers = [...tiers]
      .filter(t => t.isActive)
      .sort((a, b) => b.priorityLevel - a.priorityLevel)
    
    // Find highest tier vendor qualifies for
    for (const tier of sortedTiers) {
      if (this.qualifiesForTier(vendor, tier)) {
        return tier
      }
    }
    
    // Return default tier
    return tiers.find(t => t.isDefault && t.isActive)
  }
  
  /**
   * Calculate effective commission rate for vendor
   */
  static getEffectiveCommissionRate(
    vendor: { commissionOverride?: number },
    tier?: VendorTier,
    defaultRate: number = 15
  ): number {
    // Vendor override takes priority
    if (vendor.commissionOverride !== undefined && vendor.commissionOverride !== null) {
      return vendor.commissionOverride
    }
    
    // Then tier rate
    if (tier) {
      return tier.commissionRate
    }
    
    // Fall back to default
    return defaultRate
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VendorEngine,
  ProductMappingEngine,
  VendorTierEngine
}
