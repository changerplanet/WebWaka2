/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Adjustments Service
 * 
 * Manages billing adjustments (credits, discounts, refunds, etc.).
 * Adjustments are append-only and immutable.
 */

import { PrismaClient, AdjustmentType, AdjustmentStatus } from '@prisma/client';
import { logBillingEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// ADJUSTMENT MANAGEMENT
// ============================================================================

interface CreateAdjustmentInput {
  tenantId: string;
  subscriptionId?: string;
  type: AdjustmentType;
  reason: string;
  description?: string;
  amount: number;
  currency?: string;
  expiresAt?: Date;
  createdBy?: string;
}

export async function createAdjustment(input: CreateAdjustmentInput): Promise<{
  success: boolean;
  adjustment?: any;
  error?: string;
}> {
  try {
    const adjustment = await (prisma.billing_adjustments.create as any)({
      data: {
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        type: input.type,
        reason: input.reason,
        description: input.description,
        amount: input.amount,
        currency: input.currency || 'NGN',
        expiresAt: input.expiresAt,
        status: 'PENDING',
        createdBy: input.createdBy,
      },
    });
    
    await logBillingEvent({
      eventType: 'BILLING_ADJUSTMENT_CREATED',
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      adjustmentId: adjustment.id,
      actorId: input.createdBy,
      eventData: {
        type: input.type,
        amount: input.amount,
        reason: input.reason,
      },
    });
    
    return { success: true, adjustment };
  } catch (error: any) {
    console.error('Create adjustment error:', error);
    return { success: false, error: error.message || 'Failed to create adjustment' };
  }
}

export async function getAdjustment(adjustmentId: string) {
  return prisma.billing_adjustments.findUnique({
    where: { id: adjustmentId },
  });
}

export async function listAdjustments(params: {
  tenantId?: string;
  subscriptionId?: string;
  type?: AdjustmentType;
  status?: AdjustmentStatus;
  page?: number;
  limit?: number;
}) {
  const { tenantId, subscriptionId, type, status, page = 1, limit = 20 } = params;
  
  const where: any = {};
  
  if (tenantId) where.tenantId = tenantId;
  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (type) where.type = type;
  if (status) where.status = status;
  
  const [adjustments, total] = await Promise.all([
    prisma.billing_adjustments.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.billing_adjustments.count({ where }),
  ]);
  
  return {
    adjustments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// ADJUSTMENT WORKFLOW
// ============================================================================

export async function approveAdjustment(
  adjustmentId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adjustment = await prisma.billing_adjustments.findUnique({
      where: { id: adjustmentId },
    });
    
    if (!adjustment) {
      return { success: false, error: 'Adjustment not found' };
    }
    
    if (adjustment.status !== 'PENDING') {
      return { success: false, error: 'Adjustment is not pending' };
    }
    
    await prisma.billing_adjustments.update({
      where: { id: adjustmentId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
    
    await logBillingEvent({
      eventType: 'ADJUSTMENT_APPROVED',
      tenantId: adjustment.tenantId,
      subscriptionId: adjustment.subscriptionId || undefined,
      adjustmentId: adjustment.id,
      actorId: approvedBy,
      eventData: {
        type: adjustment.type,
        amount: adjustment.amount,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to approve adjustment' };
  }
}

export async function applyAdjustment(adjustmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adjustment = await prisma.billing_adjustments.findUnique({
      where: { id: adjustmentId },
    });
    
    if (!adjustment) {
      return { success: false, error: 'Adjustment not found' };
    }
    
    if (adjustment.status !== 'APPROVED') {
      return { success: false, error: 'Adjustment must be approved before applying' };
    }
    
    // Check if expired
    if (adjustment.expiresAt && adjustment.expiresAt < new Date()) {
      await prisma.billing_adjustments.update({
        where: { id: adjustmentId },
        data: { status: 'EXPIRED' },
      });
      return { success: false, error: 'Adjustment has expired' };
    }
    
    await prisma.billing_adjustments.update({
      where: { id: adjustmentId },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
      },
    });
    
    await logBillingEvent({
      eventType: 'ADJUSTMENT_APPLIED',
      tenantId: adjustment.tenantId,
      subscriptionId: adjustment.subscriptionId || undefined,
      adjustmentId: adjustment.id,
      eventData: {
        type: adjustment.type,
        amount: adjustment.amount,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to apply adjustment' };
  }
}

export async function cancelAdjustment(
  adjustmentId: string,
  cancelledBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adjustment = await prisma.billing_adjustments.findUnique({
      where: { id: adjustmentId },
    });
    
    if (!adjustment) {
      return { success: false, error: 'Adjustment not found' };
    }
    
    if (adjustment.status === 'APPLIED') {
      return { success: false, error: 'Cannot cancel applied adjustment' };
    }
    
    await prisma.billing_adjustments.update({
      where: { id: adjustmentId },
      data: { status: 'CANCELLED' },
    });
    
    await logBillingEvent({
      eventType: 'ADJUSTMENT_CANCELLED',
      tenantId: adjustment.tenantId,
      adjustmentId: adjustment.id,
      actorId: cancelledBy,
      eventData: {
        type: adjustment.type,
        amount: adjustment.amount,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel adjustment' };
  }
}

// ============================================================================
// ADJUSTMENT BALANCE
// ============================================================================

export async function getAdjustmentBalance(tenantId: string): Promise<{
  totalCredits: number;
  pendingCredits: number;
  appliedCredits: number;
  byType: Record<string, { count: number; amount: number }>;
}> {
  const adjustments = await prisma.billing_adjustments.findMany({
    where: { tenantId },
  });
  
  let totalCredits = 0;
  let pendingCredits = 0;
  let appliedCredits = 0;
  const byType: Record<string, { count: number; amount: number }> = {};
  
  for (const adj of adjustments) {
    const amount = Number(adj.amount);
    
    // Only count non-cancelled adjustments
    if (adj.status === 'CANCELLED' || adj.status === 'EXPIRED') continue;
    
    totalCredits += amount;
    
    if (adj.status === 'APPLIED') {
      appliedCredits += amount;
    } else {
      pendingCredits += amount;
    }
    
    // By type
    if (!byType[adj.type]) {
      byType[adj.type] = { count: 0, amount: 0 };
    }
    byType[adj.type].count++;
    byType[adj.type].amount += amount;
  }
  
  return {
    totalCredits,
    pendingCredits,
    appliedCredits,
    byType,
  };
}
