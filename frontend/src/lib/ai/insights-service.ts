/**
 * MODULE 14: AI & AUTOMATION
 * Insights Service
 * 
 * Read-only insights with mandatory explanations.
 * No automatic actions, just informational.
 */

import { PrismaClient } from '@prisma/client';
import { logAIEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// INSIGHT TYPES
// ============================================================================

export const INSIGHT_TYPES = {
  SALES_TREND: 'SALES_TREND',
  INVENTORY_RISK: 'INVENTORY_RISK',
  CHURN_SIGNAL: 'CHURN_SIGNAL',
  VENDOR_PERF: 'VENDOR_PERF',
  CASH_FLOW: 'CASH_FLOW',
} as const;

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

interface GenerateInsightInput {
  tenantId: string;
  insightType: string;
  title: string;
  summary: string;
  details: Record<string, any>;
  explanation: string;  // MANDATORY
  dataSourcesUsed: string[];
  confidence: number;  // 0-100
  severity?: string;
  relatedType?: string;
  relatedId?: string;
  validTo?: Date;
}

export async function generateInsight(input: GenerateInsightInput): Promise<{
  success: boolean;
  insight?: any;
  error?: string;
}> {
  try {
    // Ensure explanation is provided
    if (!input.explanation || input.explanation.trim().length < 10) {
      return { success: false, error: 'Explanation is mandatory and must be meaningful' };
    }
    
    // Ensure data sources are documented
    if (!input.dataSourcesUsed || input.dataSourcesUsed.length === 0) {
      return { success: false, error: 'Data sources must be documented for transparency' };
    }
    
    const insight = await prisma.ai_insights.create({
      data: {
        tenantId: input.tenantId,
        insightType: input.insightType,
        title: input.title,
        summary: input.summary,
        details: input.details,
        explanation: input.explanation,
        dataSourcesUsed: input.dataSourcesUsed,
        confidence: input.confidence,
        severity: input.severity || 'INFO',
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        status: 'ACTIVE',
        validFrom: new Date(),
        validTo: input.validTo,
      },
    });
    
    await logAIEvent({
      eventType: 'AI_INSIGHT_GENERATED',
      tenantId: input.tenantId,
      insightId: insight.id,
      eventData: {
        insightType: input.insightType,
        confidence: input.confidence,
        severity: input.severity,
      },
    });
    
    return { success: true, insight };
  } catch (error: any) {
    console.error('Generate insight error:', error);
    return { success: false, error: error.message || 'Failed to generate insight' };
  }
}

// ============================================================================
// INSIGHT QUERIES
// ============================================================================

export async function getInsight(insightId: string) {
  return prisma.ai_insights.findUnique({
    where: { id: insightId },
  });
}

export async function listInsights(params: {
  tenantId: string;
  insightType?: string;
  severity?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { tenantId, insightType, severity, status, page = 1, limit = 20 } = params;
  
  const where: any = { tenantId };
  
  if (insightType) where.insightType = insightType;
  if (severity) where.severity = severity;
  if (status) where.status = status;
  else where.status = 'ACTIVE';  // Default to active
  
  const [insights, total] = await Promise.all([
    prisma.ai_insights.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.ai_insights.count({ where }),
  ]);
  
  return {
    insights,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function acknowledgeInsight(
  insightId: string,
  acknowledgedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.ai_insights.update({
      where: { id: insightId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to acknowledge insight' };
  }
}

export async function dismissInsight(insightId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.ai_insights.update({
      where: { id: insightId },
      data: { status: 'DISMISSED' },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to dismiss insight' };
  }
}

// ============================================================================
// SAMPLE INSIGHT GENERATORS (for demo/testing)
// ============================================================================

export async function generateSampleSalesTrendInsight(tenantId: string) {
  return generateInsight({
    tenantId,
    insightType: INSIGHT_TYPES.SALES_TREND,
    title: 'Sales Trending Upward',
    summary: 'Your sales have increased by 15% compared to last week.',
    details: {
      currentWeekSales: 1500000,
      previousWeekSales: 1300000,
      percentChange: 15.38,
      topSellingProducts: ['Product A', 'Product B'],
    },
    explanation: 'We analyzed your sales data from the past 14 days. This week shows higher transaction volume across most product categories, particularly in electronics and household items.',
    dataSourcesUsed: ['orders', 'products', 'payments'],
    confidence: 85,
    severity: 'INFO',
  });
}

export async function generateSampleInventoryRiskInsight(tenantId: string) {
  return generateInsight({
    tenantId,
    insightType: INSIGHT_TYPES.INVENTORY_RISK,
    title: 'Low Stock Alert',
    summary: '5 products may run out of stock within the next 7 days.',
    details: {
      atRiskProducts: [
        { name: 'Product X', currentStock: 10, avgDailySales: 3 },
        { name: 'Product Y', currentStock: 5, avgDailySales: 2 },
      ],
      estimatedStockoutDates: {
        'Product X': '2026-01-10',
        'Product Y': '2026-01-08',
      },
    },
    explanation: 'Based on your average daily sales over the past 30 days, these products are selling faster than your current inventory can sustain. Consider reordering soon.',
    dataSourcesUsed: ['inventory', 'orders', 'products'],
    confidence: 78,
    severity: 'WARNING',
  });
}
