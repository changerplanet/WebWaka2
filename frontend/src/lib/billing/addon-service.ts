/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Add-On Service
 * 
 * Manages add-ons and feature upgrades.
 * Add-ons modify entitlements only - billing adjustments emitted as events.
 */

import { AddOnType, AddOnStatus } from '@prisma/client';
import { logBillingEvent } from './event-service';
import { prisma } from '@/lib/prisma';

// ============================================================================
// ADD-ON MANAGEMENT
// ============================================================================

interface CreateAddOnInput {
  tenantId?: string | null;  // null = global add-on
  name: string;
  slug: string;
  description?: string;
  addOnType?: AddOnType;
  price: number;
  currency?: string;
  billingInterval?: string;
  isQuantityBased?: boolean;
  unitName?: string;
  minQuantity?: number;
  maxQuantity?: number;
  moduleKey?: string;
  featureKey?: string;
  featureValue?: Record<string, any>;
}

export async function createAddOn(input: CreateAddOnInput): Promise<{
  success: boolean;
  addOn?: any;
  error?: string;
}> {
  try {
    // Check for duplicate slug
    const existing = await prisma.billing_addons.findFirst({
      where: {
        tenantId: input.tenantId,
        slug: input.slug,
      },
    });
    
    if (existing) {
      return { success: false, error: 'Add-on with this slug already exists' };
    }
    
    const addOn = await (prisma.billing_addons.create as any)({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        addOnType: input.addOnType || 'FEATURE',
        price: input.price,
        currency: input.currency || 'NGN',
        billingInterval: input.billingInterval || 'MONTHLY',
        isQuantityBased: input.isQuantityBased || false,
        unitName: input.unitName,
        minQuantity: input.minQuantity || 1,
        maxQuantity: input.maxQuantity,
        moduleKey: input.moduleKey,
        featureKey: input.featureKey,
        featureValue: input.featureValue,
        isActive: true,
      },
    });
    
    await logBillingEvent({
      eventType: 'ADDON_CREATED',
      tenantId: input.tenantId || undefined,
      addOnId: addOn.id,
      eventData: {
        name: addOn.name,
        price: addOn.price,
        type: addOn.addOnType,
      },
    });
    
    return { success: true, addOn };
  } catch (error: any) {
    console.error('Create add-on error:', error);
    return { success: false, error: error.message || 'Failed to create add-on' };
  }
}

export async function getAddOn(addOnId: string) {
  return prisma.billing_addons.findUnique({
    where: { id: addOnId },
  });
}

export async function listAddOns(params: {
  tenantId?: string | null;
  activeOnly?: boolean;
  addOnType?: AddOnType;
}) {
  const { tenantId, activeOnly = true, addOnType } = params;
  
  const where: any = {};
  
  // Include global add-ons and tenant-specific
  if (tenantId !== undefined) {
    where.OR = [
      { tenantId: null },
      { tenantId },
    ];
  }
  
  if (activeOnly) {
    where.isActive = true;
  }
  
  if (addOnType) {
    where.addOnType = addOnType;
  }
  
  return prisma.billing_addons.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAddOn(
  addOnId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
    maxQuantity?: number;
  }
): Promise<{ success: boolean; addOn?: any; error?: string }> {
  try {
    const addOn = await prisma.billing_addons.update({
      where: { id: addOnId },
      data,
    });
    return { success: true, addOn };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update add-on' };
  }
}

// ============================================================================
// ADD-ON SUBSCRIPTIONS
// ============================================================================

interface SubscribeToAddOnInput {
  tenantId: string;
  subscriptionId: string;
  addOnId: string;
  quantity?: number;
}

export async function subscribeToAddOn(input: SubscribeToAddOnInput): Promise<{
  success: boolean;
  subscription?: any;
  error?: string;
}> {
  try {
    const addOn = await prisma.billing_addons.findUnique({
      where: { id: input.addOnId },
    });
    
    if (!addOn || !addOn.isActive) {
      return { success: false, error: 'Add-on not found or inactive' };
    }
    
    const quantity = input.quantity || 1;
    
    // Validate quantity
    if (quantity < addOn.minQuantity) {
      return { success: false, error: `Minimum quantity is ${addOn.minQuantity}` };
    }
    
    if (addOn.maxQuantity && quantity > addOn.maxQuantity) {
      return { success: false, error: `Maximum quantity is ${addOn.maxQuantity}` };
    }
    
    // Check for existing active subscription
    const existing = await prisma.billing_addon_subscriptions.findFirst({
      where: {
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        addOnId: input.addOnId,
        status: 'ACTIVE',
      },
    });
    
    if (existing) {
      return { success: false, error: 'Already subscribed to this add-on' };
    }
    
    const subscription = await (prisma.billing_addon_subscriptions.create as any)({
      data: {
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        addOnId: input.addOnId,
        quantity,
        priceAtPurchase: addOn.price,
        currency: addOn.currency,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });
    
    await logBillingEvent({
      eventType: 'ADDON_SUBSCRIBED',
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      addOnId: input.addOnId,
      eventData: {
        quantity,
        price: addOn.price,
        addOnName: addOn.name,
      },
    });
    
    return { success: true, subscription };
  } catch (error: any) {
    console.error('Subscribe to add-on error:', error);
    return { success: false, error: error.message || 'Failed to subscribe to add-on' };
  }
}

export async function updateAddOnQuantity(
  subscriptionId: string,
  newQuantity: number
): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    const existing = await prisma.billing_addon_subscriptions.findUnique({
      where: { id: subscriptionId },
      include: { billing_addons: true },
    });
    
    if (!existing) {
      return { success: false, error: 'Add-on subscription not found' };
    }
    
    if (existing.status !== 'ACTIVE') {
      return { success: false, error: 'Add-on subscription is not active' };
    }
    
    // Validate quantity
    const addOn = existing.billing_addons;
    if (newQuantity < addOn.minQuantity) {
      return { success: false, error: `Minimum quantity is ${addOn.minQuantity}` };
    }
    
    if (addOn.maxQuantity && newQuantity > addOn.maxQuantity) {
      return { success: false, error: `Maximum quantity is ${addOn.maxQuantity}` };
    }
    
    const subscription = await prisma.billing_addon_subscriptions.update({
      where: { id: subscriptionId },
      data: { quantity: newQuantity },
    });
    
    await logBillingEvent({
      eventType: 'ADDON_QUANTITY_UPDATED',
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      addOnId: existing.addOnId,
      eventData: {
        oldQuantity: existing.quantity,
        newQuantity,
      },
    });
    
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update quantity' };
  }
}

export async function cancelAddOnSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.billing_addon_subscriptions.findUnique({
      where: { id: subscriptionId },
    });
    
    if (!existing) {
      return { success: false, error: 'Add-on subscription not found' };
    }
    
    await prisma.billing_addon_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    
    await logBillingEvent({
      eventType: 'ADDON_CANCELLED',
      tenantId: existing.tenantId,
      subscriptionId: existing.subscriptionId,
      addOnId: existing.addOnId,
      eventData: {},
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel add-on' };
  }
}

export async function getActiveAddOns(tenantId: string, subscriptionId?: string) {
  const where: any = {
    tenantId,
    status: 'ACTIVE',
  };
  
  if (subscriptionId) {
    where.subscriptionId = subscriptionId;
  }
  
  return prisma.billing_addon_subscriptions.findMany({
    where,
    include: { billing_addons: true },
  });
}

// ============================================================================
// ADD-ON VALUE CALCULATION
// ============================================================================

export async function calculateAddOnTotal(tenantId: string): Promise<{
  monthlyTotal: number;
  addOnCount: number;
  byAddOn: Array<{ name: string; quantity: number; price: number; total: number }>;
}> {
  const activeAddOns = await getActiveAddOns(tenantId);
  
  let monthlyTotal = 0;
  const byAddOn = activeAddOns.map((sub: any) => {
    const total = Number(sub.priceAtPurchase) * sub.quantity;
    monthlyTotal += total;
    
    return {
      name: sub.billing_addons?.name || 'Unknown',
      quantity: sub.quantity,
      price: Number(sub.priceAtPurchase),
      total,
    };
  });
  
  return {
    monthlyTotal,
    addOnCount: activeAddOns.length,
    byAddOn,
  };
}
