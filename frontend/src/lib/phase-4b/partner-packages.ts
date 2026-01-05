/**
 * PHASE 4B: Partner Package Management
 * 
 * Enables partners to define commercial packages (GoHighLevel-style):
 * - Custom package names ("Retail Starter", "School Pro")
 * - Included instances and capabilities
 * - Partner-defined pricing (monthly/yearly/setup fee/trial)
 * - WebWaka wholesale pricing hidden from clients
 */

import { prisma } from '../prisma'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePackageInput {
  partnerId: string
  name: string
  slug?: string
  description?: string
  
  // What's included
  includedInstances?: number
  includedSuiteKeys?: string[]
  
  // Pricing (partner sets these)
  priceMonthly: number
  priceYearly?: number
  setupFee?: number
  trialDays?: number
  currency?: string
  
  // Internal (hidden from clients)
  wholesaleCostMonthly?: number
  
  // Features/limits
  features?: Record<string, any>
  
  // Visibility
  isPublic?: boolean
  sortOrder?: number
}

export interface UpdatePackageInput {
  name?: string
  description?: string
  includedInstances?: number
  includedSuiteKeys?: string[]
  priceMonthly?: number
  priceYearly?: number
  setupFee?: number
  trialDays?: number
  wholesaleCostMonthly?: number
  features?: Record<string, any>
  isPublic?: boolean
  isActive?: boolean
  sortOrder?: number
}

export interface PackageResult {
  success: boolean
  package?: any
  error?: string
  errorCode?: string
}

// ============================================================================
// CREATE PACKAGE
// ============================================================================

/**
 * Create a new package for a partner
 */
export async function createPartnerPackage(
  input: CreatePackageInput
): Promise<PackageResult> {
  try {
    // Generate slug if not provided
    const slug = input.slug || input.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check for duplicate slug
    const existing = await prisma.partnerPackage.findUnique({
      where: {
        partnerId_slug: {
          partnerId: input.partnerId,
          slug,
        }
      }
    })
    
    if (existing) {
      return {
        success: false,
        error: 'A package with this slug already exists',
        errorCode: 'DUPLICATE_SLUG',
      }
    }
    
    const pkg = await prisma.partnerPackage.create({
      data: {
        id: uuidv4(),
        partnerId: input.partnerId,
        name: input.name,
        slug,
        description: input.description,
        includedInstances: input.includedInstances || 1,
        includedSuiteKeys: input.includedSuiteKeys || [],
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        setupFee: input.setupFee,
        trialDays: input.trialDays || 14,
        currency: input.currency || 'NGN',
        wholesaleCostMonthly: input.wholesaleCostMonthly,
        features: input.features || undefined,
        isPublic: input.isPublic ?? true,
        sortOrder: input.sortOrder || 0,
      }
    })
    
    return { success: true, package: pkg }
  } catch (error) {
    console.error('Failed to create package:', error)
    return {
      success: false,
      error: 'Failed to create package',
      errorCode: 'CREATE_FAILED',
    }
  }
}

// ============================================================================
// GET PACKAGES
// ============================================================================

/**
 * Get all packages for a partner
 */
export async function getPartnerPackages(
  partnerId: string,
  options?: {
    includeInactive?: boolean
    publicOnly?: boolean
  }
): Promise<any[]> {
  const where: any = { partnerId }
  
  if (!options?.includeInactive) {
    where.isActive = true
  }
  
  if (options?.publicOnly) {
    where.isPublic = true
  }
  
  return prisma.partnerPackage.findMany({
    where,
    orderBy: { sortOrder: 'asc' }
  })
}

/**
 * Get a single package by ID
 */
export async function getPackageById(packageId: string): Promise<any | null> {
  return prisma.partnerPackage.findUnique({
    where: { id: packageId }
  })
}

/**
 * Get public packages for a partner (for client-facing pricing page)
 * Does NOT include wholesale costs
 */
export async function getPublicPackages(partnerId: string): Promise<any[]> {
  const packages = await prisma.partnerPackage.findMany({
    where: {
      partnerId,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      includedInstances: true,
      includedSuiteKeys: true,
      priceMonthly: true,
      priceYearly: true,
      setupFee: true,
      trialDays: true,
      currency: true,
      features: true,
      // EXCLUDED: wholesaleCostMonthly - never expose to clients
    },
    orderBy: { sortOrder: 'asc' }
  })
  
  return packages
}

// ============================================================================
// UPDATE PACKAGE
// ============================================================================

/**
 * Update an existing package
 */
export async function updatePartnerPackage(
  packageId: string,
  input: UpdatePackageInput
): Promise<PackageResult> {
  try {
    const existing = await prisma.partnerPackage.findUnique({
      where: { id: packageId }
    })
    
    if (!existing) {
      return {
        success: false,
        error: 'Package not found',
        errorCode: 'NOT_FOUND',
      }
    }
    
    const pkg = await prisma.partnerPackage.update({
      where: { id: packageId },
      data: {
        name: input.name,
        description: input.description,
        includedInstances: input.includedInstances,
        includedSuiteKeys: input.includedSuiteKeys,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        setupFee: input.setupFee,
        trialDays: input.trialDays,
        wholesaleCostMonthly: input.wholesaleCostMonthly,
        features: input.features,
        isPublic: input.isPublic,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      }
    })
    
    return { success: true, package: pkg }
  } catch (error) {
    console.error('Failed to update package:', error)
    return {
      success: false,
      error: 'Failed to update package',
      errorCode: 'UPDATE_FAILED',
    }
  }
}

// ============================================================================
// ARCHIVE PACKAGE
// ============================================================================

/**
 * Archive (soft delete) a package
 */
export async function archivePartnerPackage(packageId: string): Promise<PackageResult> {
  try {
    const pkg = await prisma.partnerPackage.update({
      where: { id: packageId },
      data: { isActive: false }
    })
    
    return { success: true, package: pkg }
  } catch (error) {
    console.error('Failed to archive package:', error)
    return {
      success: false,
      error: 'Failed to archive package',
      errorCode: 'ARCHIVE_FAILED',
    }
  }
}

// ============================================================================
// PACKAGE MARGIN CALCULATION
// ============================================================================

/**
 * Calculate partner margin for a package
 * This is internal - never shown to clients
 */
export function calculatePackageMargin(pkg: {
  priceMonthly: number
  wholesaleCostMonthly?: number | null
}): {
  margin: number
  marginPercent: number
} {
  const price = Number(pkg.priceMonthly)
  const wholesale = Number(pkg.wholesaleCostMonthly || 0)
  const margin = price - wholesale
  const marginPercent = price > 0 ? (margin / price) * 100 : 0
  
  return {
    margin: Math.round(margin * 100) / 100,
    marginPercent: Math.round(marginPercent * 10) / 10,
  }
}
