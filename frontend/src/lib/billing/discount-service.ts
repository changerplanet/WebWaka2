/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Discount & Promo Service
 * 
 * Manages billing-side discounts and partner pricing.
 * Discounts apply at billing calculation time - no payment execution.
 */

import { PrismaClient, DiscountType } from '@prisma/client';
import { logBillingEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// DISCOUNT RULE MANAGEMENT
// ============================================================================

interface CreateDiscountRuleInput {
  tenantId?: string | null;  // null = global rule
  name: string;
  code?: string;  // Promo code
  description?: string;
  discountType?: DiscountType;
  value: number;  // Percentage or fixed amount
  planIds?: string[];
  moduleIds?: string[];
  partnerId?: string;
  maxUses?: number;
  maxUsesPerTenant?: number;
  validFrom?: Date;
  validTo?: Date;
  minOrderValue?: number;
  firstTimeOnly?: boolean;
}

export async function createDiscountRule(input: CreateDiscountRuleInput): Promise<{
  success: boolean;
  rule?: any;
  error?: string;
}> {
  try {
    // Check for duplicate code
    if (input.code) {
      const existing = await prisma.billingDiscountRule.findUnique({
        where: { code: input.code },
      });
      
      if (existing) {
        return { success: false, error: 'Discount code already exists' };
      }
    }
    
    const rule = await prisma.billingDiscountRule.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        code: input.code,
        description: input.description,
        discountType: input.discountType || 'PERCENTAGE',
        value: input.value,
        planIds: input.planIds || [],
        moduleIds: input.moduleIds || [],
        partnerId: input.partnerId,
        maxUses: input.maxUses,
        maxUsesPerTenant: input.maxUsesPerTenant,
        currentUses: 0,
        validFrom: input.validFrom,
        validTo: input.validTo,
        minOrderValue: input.minOrderValue,
        firstTimeOnly: input.firstTimeOnly || false,
        isActive: true,
      },
    });
    
    await logBillingEvent({
      eventType: 'DISCOUNT_RULE_CREATED',
      tenantId: input.tenantId || undefined,
      eventData: {
        ruleId: rule.id,
        name: rule.name,
        code: rule.code,
        discountType: rule.discountType,
        value: rule.value,
      },
    });
    
    return { success: true, rule };
  } catch (error: any) {
    console.error('Create discount rule error:', error);
    return { success: false, error: error.message || 'Failed to create discount rule' };
  }
}

export async function getDiscountRule(ruleId: string) {
  return prisma.billingDiscountRule.findUnique({
    where: { id: ruleId },
  });
}

export async function getDiscountByCode(code: string) {
  return prisma.billingDiscountRule.findUnique({
    where: { code },
  });
}

export async function listDiscountRules(params: {
  tenantId?: string | null;
  activeOnly?: boolean;
  partnerId?: string;
}) {
  const { tenantId, activeOnly = true, partnerId } = params;
  
  const where: any = {};
  
  if (tenantId !== undefined) {
    where.OR = [
      { tenantId: null },
      { tenantId },
    ];
  }
  
  if (activeOnly) {
    where.isActive = true;
  }
  
  if (partnerId) {
    where.partnerId = partnerId;
  }
  
  return prisma.billingDiscountRule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function deactivateDiscountRule(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.billingDiscountRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate rule' };
  }
}

// ============================================================================
// DISCOUNT VALIDATION
// ============================================================================

interface ValidateDiscountInput {
  code: string;
  tenantId: string;
  planId?: string;
  moduleId?: string;
  orderValue?: number;
  isFirstPurchase?: boolean;
}

export async function validateDiscount(input: ValidateDiscountInput): Promise<{
  valid: boolean;
  rule?: any;
  error?: string;
}> {
  const rule = await getDiscountByCode(input.code);
  
  if (!rule) {
    return { valid: false, error: 'Discount code not found' };
  }
  
  if (!rule.isActive) {
    return { valid: false, error: 'Discount code is no longer active' };
  }
  
  const now = new Date();
  
  // Check validity period
  if (rule.validFrom && rule.validFrom > now) {
    return { valid: false, error: 'Discount code is not yet valid' };
  }
  
  if (rule.validTo && rule.validTo < now) {
    return { valid: false, error: 'Discount code has expired' };
  }
  
  // Check max uses
  if (rule.maxUses && rule.currentUses >= rule.maxUses) {
    return { valid: false, error: 'Discount code has reached maximum uses' };
  }
  
  // Check plan/module scope
  if (rule.planIds.length > 0 && input.planId && !rule.planIds.includes(input.planId)) {
    return { valid: false, error: 'Discount code not valid for this plan' };
  }
  
  if (rule.moduleIds.length > 0 && input.moduleId && !rule.moduleIds.includes(input.moduleId)) {
    return { valid: false, error: 'Discount code not valid for this module' };
  }
  
  // Check minimum order value
  if (rule.minOrderValue && input.orderValue && input.orderValue < Number(rule.minOrderValue)) {
    return { valid: false, error: `Minimum order value is ${rule.minOrderValue}` };
  }
  
  // Check first-time only
  if (rule.firstTimeOnly && !input.isFirstPurchase) {
    return { valid: false, error: 'Discount code is for first-time purchases only' };
  }
  
  return { valid: true, rule };
}

// ============================================================================
// DISCOUNT CALCULATION
// ============================================================================

export async function calculateDiscount(
  code: string,
  originalAmount: number
): Promise<{
  valid: boolean;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountType?: string;
  error?: string;
}> {
  const rule = await getDiscountByCode(code);
  
  if (!rule || !rule.isActive) {
    return {
      valid: false,
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Invalid discount code',
    };
  }
  
  let discountAmount: number;
  
  switch (rule.discountType) {
    case 'FIXED_AMOUNT':
      discountAmount = Math.min(Number(rule.value), originalAmount);
      break;
    case 'FREE_MONTHS':
      // For free months, return full amount as discount (handled at subscription level)
      discountAmount = originalAmount;
      break;
    case 'PERCENTAGE':
    default:
      discountAmount = (originalAmount * Number(rule.value)) / 100;
      break;
  }
  
  const finalAmount = Math.max(0, originalAmount - discountAmount);
  
  return {
    valid: true,
    originalAmount,
    discountAmount,
    finalAmount,
    discountType: rule.discountType,
  };
}

// ============================================================================
// DISCOUNT USAGE TRACKING
// ============================================================================

export async function recordDiscountUsage(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const rule = await getDiscountByCode(code);
    
    if (!rule) {
      return { success: false, error: 'Discount code not found' };
    }
    
    await prisma.billingDiscountRule.update({
      where: { code },
      data: { currentUses: { increment: 1 } },
    });
    
    // Check if max uses reached, auto-deactivate
    if (rule.maxUses && rule.currentUses + 1 >= rule.maxUses) {
      await prisma.billingDiscountRule.update({
        where: { code },
        data: { isActive: false },
      });
    }
    
    await logBillingEvent({
      eventType: 'DISCOUNT_USED',
      eventData: {
        code,
        ruleId: rule.id,
        currentUses: rule.currentUses + 1,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record usage' };
  }
}

// ============================================================================
// PARTNER PRICING
// ============================================================================

export async function getPartnerDiscounts(partnerId: string) {
  return prisma.billingDiscountRule.findMany({
    where: {
      partnerId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPartnerDiscount(
  partnerId: string,
  data: {
    name: string;
    code: string;
    discountType?: DiscountType;
    value: number;
    maxUses?: number;
    validFrom?: Date;
    validTo?: Date;
  }
): Promise<{ success: boolean; rule?: any; error?: string }> {
  return createDiscountRule({
    ...data,
    partnerId,
    description: `Partner discount for ${partnerId}`,
  });
}
