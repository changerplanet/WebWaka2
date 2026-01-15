/**
 * Payout Execution Service
 * Wave F2: Payout Execution Engine (MVM)
 * 
 * Manual-trigger payout execution for multi-vendor marketplace.
 * NO automation, NO background jobs, partner-triggered only.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateBatchInput,
  ApproveBatchInput,
  ProcessBatchInput,
  CancelBatchInput,
  BatchPreview,
  BatchSummary,
  VendorPayoutPreview,
  VendorPayoutView,
  PayoutDetail,
  PayoutLogEntry,
  PayoutPeriodType,
} from './types';

const DEFAULT_MIN_PAYOUT_THRESHOLD = 5000; // ₦5,000
const CURRENCY = 'NGN';

function generateBatchNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PAY-${dateStr}-${random}`;
}

function generatePayoutNumber(vendorSlug: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PO-${vendorSlug.slice(0, 4).toUpperCase()}-${dateStr}-${random}`;
}

export function createPayoutExecutionService(tenantId: string) {
  
  async function previewBatch(input: {
    periodType: PayoutPeriodType;
    periodStart: Date;
    periodEnd: Date;
    minPayoutThreshold?: number;
  }): Promise<BatchPreview> {
    const threshold = input.minPayoutThreshold ?? DEFAULT_MIN_PAYOUT_THRESHOLD;
    
    const eligibleCommissions = await prisma.mvm_commission.findMany({
      where: {
        tenantId,
        status: 'CLEARED',
        payoutId: null,
        clearedAt: {
          gte: input.periodStart,
          lte: input.periodEnd,
        },
      },
      include: {
        subOrder: true,
        vendor: true,
      },
    });
    
    const vendorMap = new Map<string, VendorPayoutPreview>();
    
    for (const commission of eligibleCommissions) {
      if (!vendorMap.has(commission.vendorId)) {
        vendorMap.set(commission.vendorId, {
          vendorId: commission.vendorId,
          vendorName: commission.vendor.name,
          bankName: commission.vendor.bankName || undefined,
          accountNumber: commission.vendor.accountNumber || undefined,
          accountName: commission.vendor.accountName || undefined,
          eligibleOrders: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          belowThreshold: false,
          thresholdAmount: threshold,
          subOrders: [],
        });
      }
      
      const vendor = vendorMap.get(commission.vendorId)!;
      const gross = Number(commission.saleAmount);
      const commissionAmt = Number(commission.commissionAmount);
      const net = Number(commission.vendorPayout);
      
      vendor.eligibleOrders++;
      vendor.grossAmount += gross;
      vendor.commissionAmount += commissionAmt;
      vendor.netAmount += net;
      
      vendor.subOrders.push({
        subOrderId: commission.subOrderId,
        subOrderNumber: commission.subOrder.subOrderNumber,
        orderDate: commission.subOrder.createdAt,
        grossAmount: gross,
        commissionAmount: commissionAmt,
        netAmount: net,
        paymentMethod: 'UNKNOWN',
        collectionStatus: undefined,
      });
    }
    
    const vendors = Array.from(vendorMap.values());
    vendors.forEach(v => {
      v.belowThreshold = v.netAmount < threshold;
    });
    
    const eligibleVendors = vendors.filter(v => !v.belowThreshold);
    const excludedVendors = vendors.filter(v => v.belowThreshold);
    
    return {
      tenantId,
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalVendors: vendors.length,
      eligibleVendors: eligibleVendors.length,
      excludedVendors: excludedVendors.length,
      totalGross: eligibleVendors.reduce((sum, v) => sum + v.grossAmount, 0),
      totalCommissions: eligibleVendors.reduce((sum, v) => sum + v.commissionAmount, 0),
      totalNet: eligibleVendors.reduce((sum, v) => sum + v.netAmount, 0),
      minPayoutThreshold: threshold,
      currency: CURRENCY,
      vendors,
    };
  }
  
  async function createBatch(input: CreateBatchInput): Promise<BatchSummary> {
    const threshold = input.minPayoutThreshold ?? DEFAULT_MIN_PAYOUT_THRESHOLD;
    
    const eligibleCommissions = await prisma.mvm_commission.findMany({
      where: {
        tenantId,
        status: 'CLEARED',
        payoutId: null,
        clearedAt: {
          gte: input.periodStart,
          lte: input.periodEnd,
        },
      },
      include: {
        vendor: true,
      },
    });
    
    const vendorTotals = new Map<string, {
      vendor: typeof eligibleCommissions[0]['vendor'];
      grossAmount: number;
      commissionAmount: number;
      netAmount: number;
      commissionIds: string[];
    }>();
    
    for (const commission of eligibleCommissions) {
      if (!vendorTotals.has(commission.vendorId)) {
        vendorTotals.set(commission.vendorId, {
          vendor: commission.vendor,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          commissionIds: [],
        });
      }
      
      const vt = vendorTotals.get(commission.vendorId)!;
      vt.grossAmount += Number(commission.saleAmount);
      vt.commissionAmount += Number(commission.commissionAmount);
      vt.netAmount += Number(commission.vendorPayout);
      vt.commissionIds.push(commission.id);
    }
    
    const eligibleVendors = Array.from(vendorTotals.entries())
      .filter(([_, v]) => v.netAmount >= threshold);
    
    const batchNumber = generateBatchNumber();
    const totalGross = eligibleVendors.reduce((sum, [_, v]) => sum + v.grossAmount, 0);
    const totalDeductions = eligibleVendors.reduce((sum, [_, v]) => sum + v.commissionAmount, 0);
    const totalNet = eligibleVendors.reduce((sum, [_, v]) => sum + v.netAmount, 0);
    
    const batch = await prisma.mvm_payout_batch.create({
      data: {
        tenantId,
        batchNumber,
        description: input.description,
        periodType: input.periodType,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: 'PENDING',
        currency: CURRENCY,
        totalGross: new Decimal(totalGross),
        totalDeductions: new Decimal(totalDeductions),
        totalNet: new Decimal(totalNet),
        vendorCount: eligibleVendors.length,
        payoutCount: eligibleVendors.length,
        minPayoutThreshold: new Decimal(threshold),
        isDemo: input.isDemo ?? false,
        createdBy: input.createdBy,
      },
    });
    
    for (const [vendorId, vendorData] of eligibleVendors) {
      const payoutNumber = generatePayoutNumber(vendorData.vendor.slug);
      
      const payout = await prisma.mvm_payout.create({
        data: {
          tenantId,
          vendorId,
          payoutNumber,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          currency: CURRENCY,
          grossAmount: new Decimal(vendorData.grossAmount),
          deductions: new Decimal(vendorData.commissionAmount),
          netAmount: new Decimal(vendorData.netAmount),
          status: 'PENDING',
          payoutMethod: 'BANK_TRANSFER',
          bankName: vendorData.vendor.bankName,
          bankCode: vendorData.vendor.bankCode,
          accountNumber: vendorData.vendor.accountNumber,
          accountName: vendorData.vendor.accountName,
        },
      });
      
      await prisma.mvm_commission.updateMany({
        where: {
          id: { in: vendorData.commissionIds },
        },
        data: {
          payoutId: payout.id,
          status: 'PROCESSING',
        },
      });
    }
    
    await prisma.mvm_payout_log.create({
      data: {
        tenantId,
        batchId: batch.id,
        action: 'BATCH_CREATED',
        toStatus: 'PENDING',
        details: `Batch created with ${eligibleVendors.length} vendors, total ₦${totalNet.toLocaleString()}`,
        performedBy: input.createdBy,
        performedByName: input.createdByName,
      },
    });
    
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      description: batch.description || undefined,
      status: batch.status as any,
      periodType: batch.periodType as PayoutPeriodType,
      periodStart: batch.periodStart,
      periodEnd: batch.periodEnd,
      vendorCount: batch.vendorCount,
      payoutCount: batch.payoutCount,
      totalGross: Number(batch.totalGross),
      totalDeductions: Number(batch.totalDeductions),
      totalNet: Number(batch.totalNet),
      currency: batch.currency,
      isDemo: batch.isDemo,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy,
    };
  }
  
  async function approveBatch(input: ApproveBatchInput): Promise<BatchSummary> {
    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: input.batchId },
    });
    
    if (!batch || batch.tenantId !== tenantId) {
      throw new Error('Batch not found');
    }
    
    if (batch.status !== 'PENDING') {
      throw new Error(`Cannot approve batch in ${batch.status} status`);
    }
    
    const updated = await prisma.mvm_payout_batch.update({
      where: { id: input.batchId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: input.approvedBy,
      },
    });
    
    await prisma.mvm_payout_log.create({
      data: {
        tenantId,
        batchId: batch.id,
        action: 'BATCH_APPROVED',
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        details: 'Batch approved for processing',
        performedBy: input.approvedBy,
        performedByName: input.approvedByName,
      },
    });
    
    return formatBatchSummary(updated);
  }
  
  async function processBatch(input: ProcessBatchInput): Promise<BatchSummary> {
    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: input.batchId },
    });
    
    if (!batch || batch.tenantId !== tenantId) {
      throw new Error('Batch not found');
    }
    
    if (batch.status !== 'APPROVED') {
      throw new Error(`Cannot process batch in ${batch.status} status. Must be APPROVED first.`);
    }
    
    await prisma.mvm_payout_batch.update({
      where: { id: input.batchId },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
        processedBy: input.processedBy,
      },
    });
    
    await prisma.mvm_payout_log.create({
      data: {
        tenantId,
        batchId: batch.id,
        action: 'BATCH_PROCESSING',
        fromStatus: 'APPROVED',
        toStatus: 'PROCESSING',
        details: 'Batch processing started',
        performedBy: input.processedBy,
        performedByName: input.processedByName,
      },
    });
    
    const payouts = await prisma.mvm_payout.findMany({
      where: {
        tenantId,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
        status: 'PENDING',
      },
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const payout of payouts) {
      try {
        if (batch.isDemo) {
          await prisma.mvm_payout.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
              completedAt: new Date(),
              paymentRef: `DEMO-${Date.now()}`,
            },
          });
          
          await prisma.mvm_commission.updateMany({
            where: { payoutId: payout.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });
          
          successCount++;
        } else {
          await prisma.mvm_payout.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
              completedAt: new Date(),
              paymentRef: `MANUAL-${Date.now()}`,
            },
          });
          
          await prisma.mvm_commission.updateMany({
            where: { payoutId: payout.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });
          
          successCount++;
        }
        
        await prisma.mvm_payout_log.create({
          data: {
            tenantId,
            payoutId: payout.id,
            batchId: batch.id,
            action: 'PAYOUT_COMPLETED',
            fromStatus: 'PENDING',
            toStatus: 'COMPLETED',
            details: `Payout to ${payout.accountName} completed`,
            performedBy: input.processedBy,
            performedByName: input.processedByName,
          },
        });
        
      } catch (error) {
        failCount++;
        
        await prisma.mvm_payout.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        
        await prisma.mvm_payout_log.create({
          data: {
            tenantId,
            payoutId: payout.id,
            batchId: batch.id,
            action: 'PAYOUT_FAILED',
            fromStatus: 'PENDING',
            toStatus: 'FAILED',
            details: error instanceof Error ? error.message : 'Payout failed',
            performedBy: input.processedBy,
            performedByName: input.processedByName,
          },
        });
      }
    }
    
    const finalStatus = failCount === 0 ? 'COMPLETED' : (successCount === 0 ? 'FAILED' : 'COMPLETED');
    
    const updated = await prisma.mvm_payout_batch.update({
      where: { id: input.batchId },
      data: {
        status: finalStatus,
        completedAt: finalStatus === 'COMPLETED' ? new Date() : undefined,
        failedAt: finalStatus === 'FAILED' ? new Date() : undefined,
        failureReason: failCount > 0 ? `${failCount} of ${payouts.length} payouts failed` : undefined,
      },
    });
    
    await prisma.mvm_payout_log.create({
      data: {
        tenantId,
        batchId: batch.id,
        action: finalStatus === 'COMPLETED' ? 'BATCH_COMPLETED' : 'BATCH_FAILED',
        fromStatus: 'PROCESSING',
        toStatus: finalStatus,
        details: `${successCount} succeeded, ${failCount} failed`,
        performedBy: input.processedBy,
        performedByName: input.processedByName,
      },
    });
    
    return formatBatchSummary(updated);
  }
  
  async function cancelBatch(input: CancelBatchInput): Promise<BatchSummary> {
    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: input.batchId },
    });
    
    if (!batch || batch.tenantId !== tenantId) {
      throw new Error('Batch not found');
    }
    
    if (batch.status === 'PROCESSING' || batch.status === 'COMPLETED') {
      throw new Error(`Cannot cancel batch in ${batch.status} status`);
    }
    
    const payouts = await prisma.mvm_payout.findMany({
      where: {
        tenantId,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
        status: 'PENDING',
      },
    });
    
    for (const payout of payouts) {
      await prisma.mvm_commission.updateMany({
        where: { payoutId: payout.id },
        data: {
          payoutId: null,
          status: 'CLEARED',
        },
      });
      
      await prisma.mvm_payout.update({
        where: { id: payout.id },
        data: { status: 'CANCELLED' },
      });
    }
    
    const updated = await prisma.mvm_payout_batch.update({
      where: { id: input.batchId },
      data: {
        status: 'CANCELLED',
        failureReason: input.reason,
      },
    });
    
    await prisma.mvm_payout_log.create({
      data: {
        tenantId,
        batchId: batch.id,
        action: 'BATCH_CANCELLED',
        fromStatus: batch.status,
        toStatus: 'CANCELLED',
        details: input.reason || 'Batch cancelled',
        performedBy: input.cancelledBy,
        performedByName: input.cancelledByName,
      },
    });
    
    return formatBatchSummary(updated);
  }
  
  async function listBatches(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ batches: BatchSummary[]; total: number }> {
    const where: any = { tenantId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    const [batches, total] = await Promise.all([
      prisma.mvm_payout_batch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 20,
        skip: filters?.offset ?? 0,
      }),
      prisma.mvm_payout_batch.count({ where }),
    ]);
    
    return {
      batches: batches.map(formatBatchSummary),
      total,
    };
  }
  
  async function getBatch(batchId: string): Promise<BatchSummary | null> {
    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: batchId },
    });
    
    if (!batch || batch.tenantId !== tenantId) {
      return null;
    }
    
    return formatBatchSummary(batch);
  }
  
  async function getBatchPayouts(batchId: string): Promise<PayoutDetail[]> {
    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: batchId },
    });
    
    if (!batch || batch.tenantId !== tenantId) {
      return [];
    }
    
    const payouts = await prisma.mvm_payout.findMany({
      where: {
        tenantId,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
      },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return payouts.map(p => ({
      id: p.id,
      payoutNumber: p.payoutNumber,
      vendorId: p.vendorId,
      vendorName: p.vendor.name,
      status: p.status,
      grossAmount: Number(p.grossAmount),
      deductions: Number(p.deductions),
      netAmount: Number(p.netAmount),
      currency: p.currency,
      bankName: p.bankName || undefined,
      accountNumber: p.accountNumber || undefined,
      accountName: p.accountName || undefined,
      paymentRef: p.paymentRef || undefined,
      scheduledAt: p.scheduledAt || undefined,
      processedAt: p.processedAt || undefined,
      completedAt: p.completedAt || undefined,
      failedAt: p.failedAt || undefined,
      failureReason: p.failureReason || undefined,
    }));
  }
  
  async function getBatchLogs(batchId: string): Promise<PayoutLogEntry[]> {
    const logs = await prisma.mvm_payout_log.findMany({
      where: {
        tenantId,
        batchId,
      },
      orderBy: { performedAt: 'desc' },
    });
    
    return logs.map(l => ({
      id: l.id,
      action: l.action as any,
      fromStatus: l.fromStatus || undefined,
      toStatus: l.toStatus || undefined,
      details: l.details || undefined,
      performedBy: l.performedBy,
      performedByName: l.performedByName || undefined,
      performedAt: l.performedAt,
    }));
  }
  
  async function getVendorPayouts(vendorId: string): Promise<VendorPayoutView> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: {
        id: vendorId,
        tenantId,
      },
    });
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    const payouts = await prisma.mvm_payout.findMany({
      where: {
        tenantId,
        vendorId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    const pendingPayouts = payouts.filter(p => p.status === 'PENDING');
    const processingPayouts = payouts.filter(p => p.status === 'PROCESSING');
    const completedPayouts = payouts.filter(p => p.status === 'COMPLETED');
    
    const totalPaid = completedPayouts.reduce((sum, p) => sum + Number(p.netAmount), 0);
    const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.netAmount), 0);
    
    return {
      vendorId,
      vendorName: vendor.name,
      tenantId,
      currency: CURRENCY,
      pendingPayouts: pendingPayouts.length,
      processingPayouts: processingPayouts.length,
      completedPayouts: completedPayouts.length,
      totalPaidAmount: totalPaid,
      totalPendingAmount: totalPending,
      recentPayouts: payouts.map(p => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        vendorId: p.vendorId,
        vendorName: vendor.name,
        status: p.status,
        grossAmount: Number(p.grossAmount),
        deductions: Number(p.deductions),
        netAmount: Number(p.netAmount),
        currency: p.currency,
        bankName: p.bankName || undefined,
        accountNumber: p.accountNumber || undefined,
        accountName: p.accountName || undefined,
        paymentRef: p.paymentRef || undefined,
        scheduledAt: p.scheduledAt || undefined,
        processedAt: p.processedAt || undefined,
        completedAt: p.completedAt || undefined,
        failedAt: p.failedAt || undefined,
        failureReason: p.failureReason || undefined,
      })),
      bankDetails: {
        bankName: vendor.bankName || undefined,
        accountNumber: vendor.accountNumber || undefined,
        accountName: vendor.accountName || undefined,
        isVerified: vendor.isVerified,
      },
    };
  }
  
  function formatBatchSummary(batch: any): BatchSummary {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      description: batch.description || undefined,
      status: batch.status,
      periodType: batch.periodType,
      periodStart: batch.periodStart,
      periodEnd: batch.periodEnd,
      vendorCount: batch.vendorCount,
      payoutCount: batch.payoutCount,
      totalGross: Number(batch.totalGross),
      totalDeductions: Number(batch.totalDeductions),
      totalNet: Number(batch.totalNet),
      currency: batch.currency,
      isDemo: batch.isDemo,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy,
      approvedAt: batch.approvedAt || undefined,
      approvedBy: batch.approvedBy || undefined,
      processedAt: batch.processedAt || undefined,
      completedAt: batch.completedAt || undefined,
      failedAt: batch.failedAt || undefined,
      failureReason: batch.failureReason || undefined,
    };
  }
  
  return {
    previewBatch,
    createBatch,
    approveBatch,
    processBatch,
    cancelBatch,
    listBatches,
    getBatch,
    getBatchPayouts,
    getBatchLogs,
    getVendorPayouts,
  };
}
