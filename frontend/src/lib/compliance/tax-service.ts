/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * Tax Computation Service
 * 
 * Compute VAT collected, VAT payable, period-based summaries.
 * Computations derived from Accounting summaries - no remittance logic.
 */

import { PrismaClient } from '@prisma/client';
import { getTaxConfiguration, DEFAULT_VAT_RATE } from './config-service';
import { logComplianceEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

const prisma = new PrismaClient();

// ============================================================================
// TAX COMPUTATION (ADVISORY ONLY)
// ============================================================================

interface ComputeTaxInput {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  periodType?: string;
  // Sales data (would come from accounting module)
  totalSales: number;
  exemptSales?: number;
  // Purchase data
  totalPurchases?: number;
  exemptPurchases?: number;
  computedBy?: string;
}

export async function computeTaxForPeriod(input: ComputeTaxInput): Promise<{
  success: boolean;
  computation?: any;
  error?: string;
}> {
  try {
    const taxConfig = await getTaxConfiguration(input.tenantId);
    
    if (!taxConfig) {
      return { success: false, error: 'Tax configuration not found' };
    }
    
    const vatRate = Number(taxConfig.vatRate || DEFAULT_VAT_RATE);
    
    // Calculate taxable amounts
    const exemptSales = input.exemptSales || 0;
    const taxableSales = input.totalSales - exemptSales;
    
    // Calculate output VAT (collected from customers)
    let outputVat: number;
    if (taxConfig.vatInclusive) {
      // VAT is included in price: extracting VAT
      outputVat = (taxableSales * vatRate) / (100 + vatRate);
    } else {
      // VAT is added on top
      outputVat = (taxableSales * vatRate) / 100;
    }
    
    // Calculate input VAT (paid to suppliers)
    const totalPurchases = input.totalPurchases || 0;
    const exemptPurchases = input.exemptPurchases || 0;
    const taxablePurchases = totalPurchases - exemptPurchases;
    
    let inputVat: number;
    if (taxConfig.vatInclusive) {
      inputVat = (taxablePurchases * vatRate) / (100 + vatRate);
    } else {
      inputVat = (taxablePurchases * vatRate) / 100;
    }
    
    // Net VAT payable
    const netVatPayable = outputVat - inputVat;
    
    // Create computation record (append-only)
    const computation = await prisma.tax_computation_records.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        periodType: input.periodType || 'MONTHLY',
        totalSales: input.totalSales,
        exemptSales,
        taxableSales,
        outputVat,
        totalPurchases,
        exemptPurchases,
        taxablePurchases,
        inputVat,
        netVatPayable,
        status: 'COMPUTED',
        computedAt: new Date(),
        computedBy: input.computedBy,
        sourceType: 'AUTO',
      }),
    });
    
    // Log event
    await logComplianceEvent({
      eventType: 'TAX_COMPUTATION_COMPLETED',
      tenantId: input.tenantId,
      eventData: {
        computationId: computation.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        netVatPayable,
      },
    });
    
    return { success: true, computation };
  } catch (error: any) {
    console.error('Tax computation error:', error);
    return { success: false, error: error.message || 'Failed to compute tax' };
  }
}

// ============================================================================
// TAX COMPUTATION QUERIES
// ============================================================================

export async function getComputationRecord(computationId: string) {
  return prisma.tax_computation_records.findUnique({
    where: { id: computationId },
  });
}

export async function listComputations(params: {
  tenantId: string;
  periodType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { tenantId, periodType, startDate, endDate, page = 1, limit = 20 } = params;
  
  const where: any = { tenantId };
  
  if (periodType) {
    where.periodType = periodType;
  }
  
  if (startDate || endDate) {
    where.periodStart = {};
    if (startDate) where.periodStart.gte = startDate;
    if (endDate) where.periodStart.lte = endDate;
  }
  
  const [records, total] = await Promise.all([
    prisma.tax_computation_records.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { periodStart: 'desc' },
    }),
    prisma.tax_computation_records.count({ where }),
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

export async function getComputationSummary(tenantId: string, year: number): Promise<{
  year: number;
  totalOutputVat: number;
  totalInputVat: number;
  totalNetVat: number;
  byPeriod: Array<{
    periodStart: Date;
    periodEnd: Date;
    outputVat: number;
    inputVat: number;
    netVat: number;
  }>;
}> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  
  const records = await prisma.tax_computation_records.findMany({
    where: {
      tenantId,
      periodStart: { gte: startOfYear },
      periodEnd: { lt: endOfYear },
    },
    orderBy: { periodStart: 'asc' },
  });
  
  let totalOutputVat = 0;
  let totalInputVat = 0;
  let totalNetVat = 0;
  
  const byPeriod = records.map(r => {
    const outputVat = Number(r.outputVat);
    const inputVat = Number(r.inputVat);
    const netVat = Number(r.netVatPayable);
    
    totalOutputVat += outputVat;
    totalInputVat += inputVat;
    totalNetVat += netVat;
    
    return {
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      outputVat,
      inputVat,
      netVat,
    };
  });
  
  return {
    year,
    totalOutputVat,
    totalInputVat,
    totalNetVat,
    byPeriod,
  };
}

// ============================================================================
// TAX CALCULATION HELPERS (for real-time use)
// ============================================================================

export async function calculateVatForAmount(
  tenantId: string,
  amount: number
): Promise<{
  originalAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  grossAmount: number;
  vatInclusive: boolean;
}> {
  const taxConfig = await getTaxConfiguration(tenantId);
  const vatRate = Number(taxConfig?.vatRate || DEFAULT_VAT_RATE);
  const vatInclusive = taxConfig?.vatInclusive ?? true;
  
  let vatAmount: number;
  let netAmount: number;
  let grossAmount: number;
  
  if (vatInclusive) {
    // Amount includes VAT
    vatAmount = (amount * vatRate) / (100 + vatRate);
    netAmount = amount - vatAmount;
    grossAmount = amount;
  } else {
    // VAT is added on top
    netAmount = amount;
    vatAmount = (amount * vatRate) / 100;
    grossAmount = amount + vatAmount;
  }
  
  return {
    originalAmount: amount,
    vatRate,
    vatAmount,
    netAmount,
    grossAmount,
    vatInclusive,
  };
}

export async function isExemptProduct(tenantId: string, productId: string): Promise<boolean> {
  const taxConfig = await getTaxConfiguration(tenantId);
  
  if (!taxConfig) return false;
  
  return taxConfig.exemptProducts.includes(productId);
}

export async function isExemptCategory(tenantId: string, categoryId: string): Promise<boolean> {
  const taxConfig = await getTaxConfiguration(tenantId);
  
  if (!taxConfig) return false;
  
  return taxConfig.exemptCategories.includes(categoryId);
}
