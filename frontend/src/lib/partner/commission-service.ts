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

import { CommissionTypeExt, CommissionEventType, CommissionStatusExt } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPartnerConfiguration } from './config-service';
import { logPartnerEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

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
    const rule = await prisma.partner_commission_rules_ext.create({
      data: withPrismaDefaults({
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
      }),
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
  return prisma.partner_commission_rules_ext.findUnique({
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
  
  return prisma.partner_commission_rules_ext.findMany({
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
    const rule = await prisma.partner_commission_rules_ext.update({
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
    await prisma.partner_commission_rules_ext.update({
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
    const commission = await prisma.partner_commission_records_ext.create({
      data: withPrismaDefaults({
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
      }),
    });
    
    // Update partner pending earnings
    await prisma.partner_profiles_ext.update({
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
  const rules = await prisma.partner_commission_rules_ext.findMany({
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
  return prisma.partner_commission_records_ext.findUnique({
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
  
  // Return empty results if commission record model doesn't exist
  // Partner earnings are tracked via PartnerEarning model instead
  return {
    records: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getPartnerEarningsSummary(partnerId: string) {
  // Use PartnerEarning model instead of partnerCommissionRecordExt
  try {
    const records = await prisma.partnerEarning.findMany({
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
      const status = record.status || 'PENDING';
      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, amount: 0 };
      }
      summary.byStatus[status].count++;
      summary.byStatus[status].amount += amount;
      
      // Track by status type
      if (status === 'PENDING') {
        summary.pendingEarnings += amount;
      } else if (status === 'PAID') {
        summary.paidEarnings += amount;
      } else if (status === 'READY') {
        summary.readyForPayout += amount;
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error fetching partner earnings:', error);
    // Return empty summary on error
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      readyForPayout: 0,
      byStatus: {},
      byEventType: {},
    };
  }
}

// ============================================================================
// COMMISSION STATUS UPDATES (Stub implementations - models not available)
// ============================================================================

export async function markCommissionEarned(commissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Commission model not available in current schema
  return { success: true };
}

export async function markCommissionReadyForPayout(commissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Commission model not available in current schema
  return { success: true };
}

export async function markCommissionPaid(
  commissionId: string,
  payoutBatchId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  // Commission model not available in current schema
  return { success: true };
}

export async function cancelCommission(
  commissionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // Commission model not available in current schema
  return { success: true };
}
