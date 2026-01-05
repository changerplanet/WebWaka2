/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Bundle Service
 * 
 * Manages subscription bundles and packaging.
 * Bundles resolve into Core entitlements - no entitlement mutation outside Core APIs.
 */

import { PrismaClient } from '@prisma/client';
import { logBillingEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// BUNDLE MANAGEMENT
// ============================================================================

interface CreateBundleInput {
  tenantId?: string | null;  // null = global bundle
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  billingInterval?: string;
  savingsPercent?: number;
  isPromoted?: boolean;
  displayOrder?: number;
  badgeText?: string;
  items: Array<{
    moduleKey: string;
    moduleName?: string;
    featureLimits?: Record<string, any>;
    displayOrder?: number;
    isHighlighted?: boolean;
  }>;
}

export async function createBundle(input: CreateBundleInput): Promise<{
  success: boolean;
  bundle?: any;
  error?: string;
}> {
  try {
    // Check for duplicate slug
    const existing = await prisma.billingBundle.findFirst({
      where: {
        tenantId: input.tenantId,
        slug: input.slug,
      },
    });
    
    if (existing) {
      return { success: false, error: 'Bundle with this slug already exists' };
    }
    
    const bundle = await prisma.billingBundle.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        currency: input.currency || 'NGN',
        billingInterval: input.billingInterval || 'MONTHLY',
        savingsPercent: input.savingsPercent,
        isActive: true,
        isPromoted: input.isPromoted || false,
        displayOrder: input.displayOrder || 0,
        badgeText: input.badgeText,
        items: {
          create: input.items.map((item, index) => ({
            moduleKey: item.moduleKey,
            moduleName: item.moduleName,
            featureLimits: item.featureLimits,
            displayOrder: item.displayOrder ?? index,
            isHighlighted: item.isHighlighted || false,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    
    await logBillingEvent({
      eventType: 'BUNDLE_CREATED',
      tenantId: input.tenantId || undefined,
      bundleId: bundle.id,
      eventData: {
        name: bundle.name,
        price: bundle.price,
        moduleCount: input.items.length,
      },
    });
    
    return { success: true, bundle };
  } catch (error: any) {
    console.error('Create bundle error:', error);
    return { success: false, error: error.message || 'Failed to create bundle' };
  }
}

export async function getBundle(bundleId: string) {
  return prisma.billingBundle.findUnique({
    where: { id: bundleId },
    include: { items: { orderBy: { displayOrder: 'asc' } } },
  });
}

export async function listBundles(params: {
  tenantId?: string | null;
  activeOnly?: boolean;
  promotedOnly?: boolean;
}) {
  const { tenantId, activeOnly = true, promotedOnly = false } = params;
  
  const where: any = {};
  
  // Include global bundles (tenantId = null) and tenant-specific
  if (tenantId !== undefined) {
    where.OR = [
      { tenantId: null },
      { tenantId },
    ];
  }
  
  if (activeOnly) {
    where.isActive = true;
  }
  
  if (promotedOnly) {
    where.isPromoted = true;
  }
  
  return prisma.billingBundle.findMany({
    where,
    include: { items: { orderBy: { displayOrder: 'asc' } } },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function updateBundle(
  bundleId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    savingsPercent?: number;
    isActive?: boolean;
    isPromoted?: boolean;
    displayOrder?: number;
    badgeText?: string | null;
  }
): Promise<{ success: boolean; bundle?: any; error?: string }> {
  try {
    const bundle = await prisma.billingBundle.update({
      where: { id: bundleId },
      data,
      include: { items: true },
    });
    return { success: true, bundle };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update bundle' };
  }
}

export async function deactivateBundle(bundleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.billingBundle.update({
      where: { id: bundleId },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate bundle' };
  }
}

// ============================================================================
// BUNDLE RESOLUTION
// Resolves bundle into module entitlements
// ============================================================================

export async function resolveBundleEntitlements(bundleId: string): Promise<{
  modules: string[];
  featureLimits: Record<string, any>;
}> {
  const bundle = await prisma.billingBundle.findUnique({
    where: { id: bundleId },
    include: { items: true },
  });
  
  if (!bundle) {
    return { modules: [], featureLimits: {} };
  }
  
  const modules = bundle.items.map(item => item.moduleKey);
  const featureLimits: Record<string, any> = {};
  
  for (const item of bundle.items) {
    if (item.featureLimits) {
      featureLimits[item.moduleKey] = item.featureLimits;
    }
  }
  
  return { modules, featureLimits };
}

// ============================================================================
// BUNDLE COMPARISON
// Compare bundle pricing vs individual modules
// ============================================================================

export async function compareBundleSavings(bundleId: string): Promise<{
  bundlePrice: number;
  individualPrice: number;
  savings: number;
  savingsPercent: number;
}> {
  const bundle = await getBundle(bundleId);
  
  if (!bundle) {
    return { bundlePrice: 0, individualPrice: 0, savings: 0, savingsPercent: 0 };
  }
  
  // For now, use stored savings percent
  // In production, this would calculate from individual module prices
  const bundlePrice = Number(bundle.price);
  const savingsPercent = Number(bundle.savingsPercent || 0);
  const individualPrice = savingsPercent > 0 
    ? bundlePrice / (1 - savingsPercent / 100)
    : bundlePrice;
  const savings = individualPrice - bundlePrice;
  
  return {
    bundlePrice,
    individualPrice,
    savings,
    savingsPercent,
  };
}
