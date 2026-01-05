/**
 * MODULE 14: AI & AUTOMATION
 * Recommendations Service
 * 
 * Suggested actions that require MANUAL acceptance.
 * No auto-application by default.
 */

import { PrismaClient } from '@prisma/client';
import { logAIEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

export const RECOMMENDATION_TYPES = {
  REORDER: 'REORDER',
  PRICE_CHANGE: 'PRICE_CHANGE',
  PROMOTION: 'PROMOTION',
  STAFF_SCHEDULE: 'STAFF_SCHEDULE',
} as const;

// ============================================================================
// RECOMMENDATION CREATION
// ============================================================================

interface CreateRecommendationInput {
  tenantId: string;
  recommendationType: string;
  title: string;
  summary: string;
  details: Record<string, any>;
  explanation: string;  // MANDATORY
  expectedOutcome: string;  // MANDATORY
  dataSourcesUsed: string[];
  confidence: number;
  relatedType?: string;
  relatedId?: string;
  suggestedAction: Record<string, any>;
  expiresAt?: Date;
}

export async function createRecommendation(input: CreateRecommendationInput): Promise<{
  success: boolean;
  recommendation?: any;
  error?: string;
}> {
  try {
    // Validate mandatory fields
    if (!input.explanation || input.explanation.trim().length < 10) {
      return { success: false, error: 'Explanation is mandatory' };
    }
    
    if (!input.expectedOutcome || input.expectedOutcome.trim().length < 10) {
      return { success: false, error: 'Expected outcome is mandatory' };
    }
    
    if (!input.dataSourcesUsed || input.dataSourcesUsed.length === 0) {
      return { success: false, error: 'Data sources must be documented' };
    }
    
    const recommendation = await prisma.aIRecommendation.create({
      data: {
        tenantId: input.tenantId,
        recommendationType: input.recommendationType,
        title: input.title,
        summary: input.summary,
        details: input.details,
        explanation: input.explanation,
        expectedOutcome: input.expectedOutcome,
        dataSourcesUsed: input.dataSourcesUsed,
        confidence: input.confidence,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        suggestedAction: input.suggestedAction,
        status: 'PENDING',
        expiresAt: input.expiresAt,
      },
    });
    
    await logAIEvent({
      eventType: 'RECOMMENDATION_CREATED',
      tenantId: input.tenantId,
      recommendationId: recommendation.id,
      eventData: {
        recommendationType: input.recommendationType,
        confidence: input.confidence,
      },
    });
    
    return { success: true, recommendation };
  } catch (error: any) {
    console.error('Create recommendation error:', error);
    return { success: false, error: error.message || 'Failed to create recommendation' };
  }
}

// ============================================================================
// RECOMMENDATION QUERIES
// ============================================================================

export async function getRecommendation(recommendationId: string) {
  return prisma.aIRecommendation.findUnique({
    where: { id: recommendationId },
  });
}

export async function listRecommendations(params: {
  tenantId: string;
  recommendationType?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { tenantId, recommendationType, status, page = 1, limit = 20 } = params;
  
  const where: any = { tenantId };
  
  if (recommendationType) where.recommendationType = recommendationType;
  if (status) where.status = status;
  
  const [recommendations, total] = await Promise.all([
    prisma.aIRecommendation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.aIRecommendation.count({ where }),
  ]);
  
  return {
    recommendations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// RECOMMENDATION WORKFLOW
// ============================================================================

export async function acceptRecommendation(
  recommendationId: string,
  acceptedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id: recommendationId },
    });
    
    if (!recommendation) {
      return { success: false, error: 'Recommendation not found' };
    }
    
    if (recommendation.status !== 'PENDING') {
      return { success: false, error: 'Recommendation is not pending' };
    }
    
    // Check expiry
    if (recommendation.expiresAt && recommendation.expiresAt < new Date()) {
      await prisma.aIRecommendation.update({
        where: { id: recommendationId },
        data: { status: 'EXPIRED' },
      });
      return { success: false, error: 'Recommendation has expired' };
    }
    
    await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedBy,
      },
    });
    
    await logAIEvent({
      eventType: 'RECOMMENDATION_ACCEPTED',
      tenantId: recommendation.tenantId,
      recommendationId: recommendation.id,
      actorId: acceptedBy,
      eventData: {
        recommendationType: recommendation.recommendationType,
        suggestedAction: recommendation.suggestedAction,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to accept recommendation' };
  }
}

export async function rejectRecommendation(
  recommendationId: string,
  rejectedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id: recommendationId },
    });
    
    if (!recommendation) {
      return { success: false, error: 'Recommendation not found' };
    }
    
    if (recommendation.status !== 'PENDING') {
      return { success: false, error: 'Recommendation is not pending' };
    }
    
    await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason,
      },
    });
    
    await logAIEvent({
      eventType: 'RECOMMENDATION_REJECTED',
      tenantId: recommendation.tenantId,
      recommendationId: recommendation.id,
      actorId: rejectedBy,
      eventData: {
        recommendationType: recommendation.recommendationType,
        reason,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject recommendation' };
  }
}

// ============================================================================
// SAMPLE RECOMMENDATION GENERATORS (for demo/testing)
// ============================================================================

export async function generateSampleReorderRecommendation(tenantId: string) {
  return createRecommendation({
    tenantId,
    recommendationType: RECOMMENDATION_TYPES.REORDER,
    title: 'Reorder Product X',
    summary: 'Product X stock is low. Consider placing a reorder.',
    details: {
      productId: 'product-x-123',
      productName: 'Product X',
      currentStock: 10,
      suggestedQuantity: 50,
      estimatedCost: 250000,
      preferredVendor: 'Vendor ABC',
    },
    explanation: 'Based on your sales velocity of 3 units per day and current stock of 10 units, Product X will likely run out in 3-4 days. Historical data shows this product has strong demand.',
    expectedOutcome: 'Maintaining adequate stock levels will prevent stockouts and ensure continued sales. Expected revenue protection: ₦150,000 over the next 2 weeks.',
    dataSourcesUsed: ['inventory', 'orders', 'vendors'],
    confidence: 82,
    relatedType: 'PRODUCT',
    relatedId: 'product-x-123',
    suggestedAction: {
      type: 'CREATE_PURCHASE_ORDER',
      vendorId: 'vendor-abc',
      productId: 'product-x-123',
      quantity: 50,
    },
  });
}
