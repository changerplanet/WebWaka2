/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Usage-Based Billing Service
 * 
 * Tracks usage metrics and calculates overage charges.
 * 
 * Nigeria-First Considerations:
 * - Conservative overage handling
 * - Clear usage visibility
 * - No surprise billing logic
 */

import { PrismaClient, UsageAggregationType } from '@prisma/client';
import { logBillingEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// USAGE METRIC MANAGEMENT
// ============================================================================

interface CreateUsageMetricInput {
  tenantId?: string | null;  // null = global metric
  key: string;
  name: string;
  description?: string;
  unit: string;
  aggregationType?: UsageAggregationType;
  includedUnits?: number;
  overageRate?: number;
  billingPeriod?: string;
}

export async function createUsageMetric(input: CreateUsageMetricInput): Promise<{
  success: boolean;
  metric?: any;
  error?: string;
}> {
  try {
    // Check for duplicate key
    const existing = await prisma.billingUsageMetric.findFirst({
      where: {
        tenantId: input.tenantId,
        key: input.key,
      },
    });
    
    if (existing) {
      return { success: false, error: 'Metric with this key already exists' };
    }
    
    const metric = await prisma.billingUsageMetric.create({
      data: {
        tenantId: input.tenantId,
        key: input.key,
        name: input.name,
        description: input.description,
        unit: input.unit,
        aggregationType: input.aggregationType || 'SUM',
        includedUnits: input.includedUnits,
        overageRate: input.overageRate,
        billingPeriod: input.billingPeriod || 'MONTHLY',
        isActive: true,
      },
    });
    
    return { success: true, metric };
  } catch (error: any) {
    console.error('Create usage metric error:', error);
    return { success: false, error: error.message || 'Failed to create usage metric' };
  }
}

export async function getUsageMetric(metricId: string) {
  return prisma.billingUsageMetric.findUnique({
    where: { id: metricId },
  });
}

export async function getUsageMetricByKey(key: string, tenantId?: string | null) {
  return prisma.billingUsageMetric.findFirst({
    where: {
      key,
      OR: [
        { tenantId: null },
        { tenantId },
      ],
    },
  });
}

export async function listUsageMetrics(params: {
  tenantId?: string | null;
  activeOnly?: boolean;
}) {
  const { tenantId, activeOnly = true } = params;
  
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
  
  return prisma.billingUsageMetric.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// USAGE RECORDING (IMMUTABLE)
// ============================================================================

interface RecordUsageInput {
  tenantId: string;
  metricKey: string;
  quantity: number;
  periodStart: Date;
  periodEnd: Date;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}

export async function recordUsage(input: RecordUsageInput): Promise<{
  success: boolean;
  record?: any;
  error?: string;
}> {
  try {
    // Find the metric
    const metric = await getUsageMetricByKey(input.metricKey, input.tenantId);
    
    if (!metric || !metric.isActive) {
      return { success: false, error: 'Usage metric not found or inactive' };
    }
    
    // Create immutable usage record
    const record = await prisma.billingUsageRecord.create({
      data: {
        tenantId: input.tenantId,
        metricId: metric.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        quantity: input.quantity,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        metadata: input.metadata,
      },
    });
    
    // Check if usage exceeds limit
    if (metric.includedUnits) {
      const totalUsage = await getTotalUsageForPeriod(
        input.tenantId,
        metric.id,
        input.periodStart,
        input.periodEnd
      );
      
      if (totalUsage > metric.includedUnits) {
        await logBillingEvent({
          eventType: 'USAGE_LIMIT_EXCEEDED',
          tenantId: input.tenantId,
          eventData: {
            metricKey: input.metricKey,
            includedUnits: metric.includedUnits,
            currentUsage: totalUsage,
            overage: totalUsage - metric.includedUnits,
          },
        });
      }
    }
    
    return { success: true, record };
  } catch (error: any) {
    console.error('Record usage error:', error);
    return { success: false, error: error.message || 'Failed to record usage' };
  }
}

// ============================================================================
// USAGE QUERIES
// ============================================================================

export async function getTotalUsageForPeriod(
  tenantId: string,
  metricId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const metric = await prisma.billingUsageMetric.findUnique({
    where: { id: metricId },
  });
  
  if (!metric) return 0;
  
  const records = await prisma.billingUsageRecord.findMany({
    where: {
      tenantId,
      metricId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
  });
  
  // Aggregate based on type
  switch (metric.aggregationType) {
    case 'MAX':
      return records.reduce((max, r) => Math.max(max, Number(r.quantity)), 0);
    case 'AVG':
      if (records.length === 0) return 0;
      const sum = records.reduce((s, r) => s + Number(r.quantity), 0);
      return sum / records.length;
    case 'COUNT':
      return records.length;
    case 'SUM':
    default:
      return records.reduce((s, r) => s + Number(r.quantity), 0);
  }
}

export async function getUsageSummary(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  metrics: Array<{
    key: string;
    name: string;
    unit: string;
    usage: number;
    included: number | null;
    overage: number;
    overageCost: number;
  }>;
  totalOverageCost: number;
}> {
  const metrics = await listUsageMetrics({ tenantId, activeOnly: true });
  
  const results = await Promise.all(
    metrics.map(async (metric) => {
      const usage = await getTotalUsageForPeriod(tenantId, metric.id, periodStart, periodEnd);
      const included = metric.includedUnits || 0;
      const overage = Math.max(0, usage - included);
      const overageCost = overage * Number(metric.overageRate || 0);
      
      return {
        key: metric.key,
        name: metric.name,
        unit: metric.unit,
        usage,
        included: metric.includedUnits,
        overage,
        overageCost,
      };
    })
  );
  
  const totalOverageCost = results.reduce((sum, r) => sum + r.overageCost, 0);
  
  return { metrics: results, totalOverageCost };
}

export async function getUsageHistory(
  tenantId: string,
  metricKey: string,
  limit: number = 12
): Promise<Array<{ periodStart: Date; periodEnd: Date; usage: number }>> {
  const metric = await getUsageMetricByKey(metricKey, tenantId);
  
  if (!metric) return [];
  
  const records = await prisma.billingUsageRecord.findMany({
    where: {
      tenantId,
      metricId: metric.id,
    },
    orderBy: { periodStart: 'desc' },
    take: limit,
  });
  
  // Group by period
  const grouped = new Map<string, { periodStart: Date; periodEnd: Date; usage: number }>();
  
  for (const record of records) {
    const key = `${record.periodStart.toISOString()}-${record.periodEnd.toISOString()}`;
    const existing = grouped.get(key);
    
    if (existing) {
      existing.usage += Number(record.quantity);
    } else {
      grouped.set(key, {
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
        usage: Number(record.quantity),
      });
    }
  }
  
  return Array.from(grouped.values()).sort(
    (a, b) => b.periodStart.getTime() - a.periodStart.getTime()
  );
}

// ============================================================================
// OVERAGE CHARGE CALCULATION (request only, not execution)
// ============================================================================

export async function calculateOverageCharges(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  chargesRequested: boolean;
  totalAmount: number;
  currency: string;
  breakdown: Array<{
    metricKey: string;
    overage: number;
    rate: number;
    amount: number;
  }>;
}> {
  const summary = await getUsageSummary(tenantId, periodStart, periodEnd);
  
  const breakdown = summary.metrics
    .filter(m => m.overage > 0 && m.overageCost > 0)
    .map(m => ({
      metricKey: m.key,
      overage: m.overage,
      rate: m.overageCost / m.overage,
      amount: m.overageCost,
    }));
  
  if (breakdown.length > 0) {
    // Emit event for Payments module to process
    await logBillingEvent({
      eventType: 'OVERAGE_CHARGE_REQUESTED',
      tenantId,
      eventData: {
        periodStart,
        periodEnd,
        totalAmount: summary.totalOverageCost,
        breakdown,
      },
    });
  }
  
  return {
    chargesRequested: breakdown.length > 0,
    totalAmount: summary.totalOverageCost,
    currency: 'NGN',
    breakdown,
  };
}
