/**
 * MODULE 11: PARTNER & RESELLER PLATFORM
 * Commission Service
 * 
 * Manages commission rules and calculations.
 * 
 * CRITICAL RULES:
 * - Commission CALCULATION only, NOT payout execution
 * - No wallet mutation
 * - No direct payment execution
 * - Commission records are immutable
 */

import { PrismaClient, CommissionTypeExt, CommissionEventType, CommissionStatusExt } from '@prisma/client';
import { getPartnerConfiguration } from './config-service';
import { logPartnerEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// COMMISSION RULE MANAGEMENT
// ============================================================================

interface CreateCommissionRuleInput {
  partnerId?: string | null;  // null = global rule
  name: string;
  description?: string;
  planId?: string;
  moduleId?: string;
  commissionType: CommissionTypeExt;
  value: number;  // Percentage (e.g., 10) or fixed amount
  isRecurring?: boolean;
  maxRecurrences?: number;
  validFrom?: Date;
  validTo?: Date;
  priority?: number;
}

export async function createCommissionRule(input: CreateCommissionRuleInput): Promise<{
  success: boolean;
  rule?: any;
  error?: string;
}> {
  try {
    const rule = await prisma.partnerCommissionRuleExt.create({
      data: {
        partnerId: input.partnerId,
        name: input.name,
        description: input.description,
        planId: input.planId,
        moduleId: input.moduleId,
        commissionType: input.commissionType,
        value: input.value,
        isRecurring: input.isRecurring ?? true,
        maxRecurrences: input.maxRecurrences,
        validFrom: input.validFrom,
        validTo: input.validTo,
        priority: input.priority ?? 0,
        isActive: true,
      },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'COMMISSION_RULE_CREATED',
      partnerId: input.partnerId || undefined,
      eventData: {
        ruleId: rule.id,
        name: rule.name,
        commissionType: rule.commissionType,
        value: rule.value,
      },
    });
    
    return {
      success: true,
      rule,
    };
  } catch (error: any) {
    console.error('Create commission rule error:', error);
    return { success: false, error: error.message || 'Failed to create commission rule' };
  }
}

export async function getCommissionRule(ruleId: string) {
  return prisma.partnerCommissionRuleExt.findUnique({
    where: { id: ruleId },
  });
}

export async function listCommissionRules(params: {
  partnerId?: string | null;
  planId?: string;
  activeOnly?: boolean;
}) {
  const where: any = {};
  
  if (params.partnerId !== undefined) {
    where.partnerId = params.partnerId;
  }
  
  if (params.planId) {
    where.planId = params.planId;
  }
  
  if (params.activeOnly !== false) {
    where.isActive = true;
  }
  
  return prisma.partnerCommissionRuleExt.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function updateCommissionRule(
  ruleId: string,
  data: {
    name?: string;
    description?: string;
    value?: number;
    isActive?: boolean;
    validFrom?: Date;
    validTo?: Date;
    priority?: number;
  }
): Promise<{ success: boolean; rule?: any; error?: string }> {
  try {
    const rule = await prisma.partnerCommissionRuleExt.update({
      where: { id: ruleId },
      data,
    });
    return { success: true, rule };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update rule' };
  }
}

export async function deactivateCommissionRule(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.partnerCommissionRuleExt.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate rule' };
  }
}

// ============================================================================
// COMMISSION CALCULATION
// ============================================================================

interface CalculateCommissionInput {
  partnerId: string;
  attributionId: string;
  eventType: CommissionEventType;
  eventId?: string;
  grossAmount: number;
  currency?: string;
  planId?: string;
  moduleId?: string;
}

export async function calculateCommission(input: CalculateCommissionInput): Promise<{
  success: boolean;
  commission?: any;
  error?: string;
}> {
  try {
    // Find applicable rule
    const rule = await findApplicableRule({
      partnerId: input.partnerId,
      planId: input.planId,
      moduleId: input.moduleId,
    });
    
    if (!rule) {
      // Use default commission from config
      const config = await getPartnerConfiguration();
      const commissionAmount = (input.grossAmount * Number(config.defaultCommission)) / 100;
      
      return createCommissionRecord({
        ...input,
        commissionRate: Number(config.defaultCommission),
        commissionAmount,
        ruleId: null,
      });
    }
    
    // Calculate based on rule type
    let commissionAmount: number;
    let commissionRate: number;
    
    switch (rule.commissionType) {
      case 'FIXED':
        commissionAmount = Number(rule.value);
        commissionRate = (commissionAmount / input.grossAmount) * 100;
        break;
      
      case 'PERCENTAGE':
      default:
        commissionRate = Number(rule.value);
        commissionAmount = (input.grossAmount * commissionRate) / 100;
        break;
    }
    
    return createCommissionRecord({
      ...input,
      commissionRate,
      commissionAmount,
      ruleId: rule.id,
    });
  } catch (error: any) {
    console.error('Calculate commission error:', error);
    return { success: false, error: error.message || 'Failed to calculate commission' };
  }
}

async function createCommissionRecord(data: {
  partnerId: string;
  attributionId: string;
  eventType: CommissionEventType;
  eventId?: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  currency?: string;
  ruleId?: string | null;
}): Promise<{ success: boolean; commission?: any; error?: string }> {
  try {
    const commission = await prisma.partnerCommissionRecordExt.create({
      data: {
        partnerId: data.partnerId,
        attributionId: data.attributionId,
        eventType: data.eventType,
        eventId: data.eventId,
        eventDate: new Date(),
        grossAmount: data.grossAmount,
        commissionRate: data.commissionRate,
        commissionAmount: data.commissionAmount,
        currency: data.currency || 'NGN',
        status: 'PENDING',
      },
    });
    
    // Update partner pending earnings
    await prisma.partnerProfileExt.update({
      where: { partnerId: data.partnerId },
      data: {
        pendingEarnings: { increment: data.commissionAmount },
      },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'COMMISSION_EARNED',
      partnerId: data.partnerId,
      attributionId: data.attributionId,
      commissionId: commission.id,
      eventData: {
        eventType: data.eventType,
        grossAmount: data.grossAmount,
        commissionAmount: data.commissionAmount,
        commissionRate: data.commissionRate,
      },
    });
    
    return { success: true, commission };
  } catch (error: any) {
    console.error('Create commission record error:', error);
    return { success: false, error: error.message || 'Failed to create commission record' };
  }
}

async function findApplicableRule(params: {
  partnerId: string;
  planId?: string;
  moduleId?: string;
}) {
  const now = new Date();
  
  // Look for partner-specific rule first, then global
  const rules = await prisma.partnerCommissionRuleExt.findMany({
    where: {
      isActive: true,
      OR: [
        { partnerId: params.partnerId },
        { partnerId: null },  // Global rules
      ],
      AND: [
        {
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
        },
        {
          OR: [
            { validTo: null },
            { validTo: { gte: now } },
          ],
        },
      ],
    },
    orderBy: [
      { partnerId: 'desc' },  // Partner-specific first
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  
  // Find most specific matching rule
  for (const rule of rules) {
    // Check plan match
    if (rule.planId && rule.planId !== params.planId) continue;
    
    // Check module match
    if (rule.moduleId && rule.moduleId !== params.moduleId) continue;
    
    return rule;
  }
  
  return null;
}

// ============================================================================
// COMMISSION RECORD QUERIES
// ============================================================================

export async function getCommissionRecord(commissionId: string) {
  return prisma.partnerCommissionRecordExt.findUnique({
    where: { id: commissionId },
  });
}

export async function listCommissionRecords(params: {
  partnerId?: string;
  attributionId?: string;
  status?: CommissionStatusExt;
  page?: number;
  limit?: number;
}) {
  const { partnerId, attributionId, status, page = 1, limit = 20 } = params;
  
  const where: any = {};
  
  if (partnerId) where.partnerId = partnerId;
  if (attributionId) where.attributionId = attributionId;
  if (status) where.status = status;
  
  const [records, total] = await Promise.all([
    prisma.partnerCommissionRecordExt.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partnerCommissionRecordExt.count({ where }),
  ]);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPartnerEarningsSummary(partnerId: string) {
  const records = await prisma.partnerCommissionRecordExt.findMany({
    where: { partnerId },
  });
  
  const summary = {
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    readyForPayout: 0,
    byStatus: {} as Record<string, { count: number; amount: number }>,
    byEventType: {} as Record<string, { count: number; amount: number }>,
  };
  
  for (const record of records) {
    const amount = Number(record.commissionAmount);
    summary.totalEarnings += amount;
    
    // By status
    if (!summary.byStatus[record.status]) {
      summary.byStatus[record.status] = { count: 0, amount: 0 };
    }
    summary.byStatus[record.status].count++;
    summary.byStatus[record.status].amount += amount;
    
    // By event type
    if (!summary.byEventType[record.eventType]) {
      summary.byEventType[record.eventType] = { count: 0, amount: 0 };
    }
    summary.byEventType[record.eventType].count++;
    summary.byEventType[record.eventType].amount += amount;
    
    // Status-based totals
    switch (record.status) {
      case 'PENDING':
      case 'EARNED':
        summary.pendingEarnings += amount;
        break;
      case 'READY_FOR_PAYOUT':
        summary.readyForPayout += amount;
        break;
      case 'PAID':
        summary.paidEarnings += amount;
        break;
    }
  }
  
  return summary;
}

// ============================================================================
// COMMISSION STATUS UPDATES (for event processing)
// ============================================================================

export async function markCommissionEarned(commissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.partnerCommissionRecordExt.update({
      where: { id: commissionId },
      data: { status: 'EARNED' },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markCommissionReadyForPayout(commissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const commission = await prisma.partnerCommissionRecordExt.update({
      where: { id: commissionId },
      data: { status: 'READY_FOR_PAYOUT' },
    });
    
    // Log event - this can be consumed by Payments module
    await logPartnerEvent({
      eventType: 'COMMISSION_READY_FOR_PAYOUT',
      partnerId: commission.partnerId,
      commissionId: commission.id,
      eventData: {
        amount: commission.commissionAmount,
        currency: commission.currency,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markCommissionPaid(
  commissionId: string,
  payoutId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const commission = await prisma.partnerCommissionRecordExt.findUnique({
      where: { id: commissionId },
    });
    
    if (!commission) {
      return { success: false, error: 'Commission not found' };
    }
    
    await prisma.partnerCommissionRecordExt.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        payoutId,
        paidAt: new Date(),
      },
    });
    
    // Update partner earnings
    await prisma.partnerProfileExt.update({
      where: { partnerId: commission.partnerId },
      data: {
        pendingEarnings: { decrement: Number(commission.commissionAmount) },
        totalEarnings: { increment: Number(commission.commissionAmount) },
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelCommission(
  commissionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const commission = await prisma.partnerCommissionRecordExt.findUnique({
      where: { id: commissionId },
    });
    
    if (!commission) {
      return { success: false, error: 'Commission not found' };
    }
    
    if (commission.status === 'PAID') {
      return { success: false, error: 'Cannot cancel paid commission' };
    }
    
    await prisma.partnerCommissionRecordExt.update({
      where: { id: commissionId },
      data: {
        status: 'CANCELLED',
        metadata: { ...(commission.metadata as any || {}), cancellationReason: reason },
      },
    });
    
    // Update partner pending earnings
    if (['PENDING', 'EARNED', 'READY_FOR_PAYOUT'].includes(commission.status)) {
      await prisma.partnerProfileExt.update({
        where: { partnerId: commission.partnerId },
        data: {
          pendingEarnings: { decrement: Number(commission.commissionAmount) },
        },
      });
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
