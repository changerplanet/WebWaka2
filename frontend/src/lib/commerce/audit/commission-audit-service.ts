/**
 * COMMISSION AUDIT SERVICE - Wave D1
 * ===================================
 * 
 * Audit trail for MVM commission calculations.
 * Purpose: future dispute resolution.
 * 
 * Features:
 * - Persists commission inputs: rate, base amount, formula
 * - One-time capture at order time
 * - No recalculation logic
 * 
 * @module lib/commerce/audit/commission-audit-service
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export type AuditSource = 'SYSTEM' | 'USER' | 'WEBHOOK' | 'POS' | 'ADMIN' | 'API' | 'RECOVERY';

export interface CommissionAuditParams {
  tenantId: string;
  subOrderId: string;
  vendorId: string;
  saleAmount: number | Decimal;
  commissionRateUsed: number | Decimal;
  commissionRateSource: string;
  baseAmountForCalc: number | Decimal;
  formulaVersion?: string;
  vatApplied?: number | Decimal;
  vatRate?: number | Decimal;
  commissionComputed: number | Decimal;
  vendorPayoutComputed: number | Decimal;
  calculatedBy?: AuditSource;
}

export class CommissionAuditService {
  /**
   * Record commission calculation audit trail
   * Called once when sub-order is created with commission
   */
  static async recordCommissionAudit(params: CommissionAuditParams): Promise<string> {
    const existing = await prisma.mvm_commission_audit.findUnique({
      where: { subOrderId: params.subOrderId },
    });

    if (existing) {
      console.log(`[CommissionAudit] Already exists for sub-order ${params.subOrderId}`);
      return existing.id;
    }

    const record = await prisma.mvm_commission_audit.create({
      data: {
        tenantId: params.tenantId,
        subOrderId: params.subOrderId,
        vendorId: params.vendorId,
        saleAmount: params.saleAmount,
        commissionRateUsed: params.commissionRateUsed,
        commissionRateSource: params.commissionRateSource,
        baseAmountForCalc: params.baseAmountForCalc,
        formulaVersion: params.formulaVersion || 'v1',
        vatApplied: params.vatApplied || 0,
        vatRate: params.vatRate || 7.5,
        commissionComputed: params.commissionComputed,
        vendorPayoutComputed: params.vendorPayoutComputed,
        calculatedBy: params.calculatedBy || 'SYSTEM',
      },
    });

    console.log(`[CommissionAudit] Recorded for sub-order ${params.subOrderId}: rate=${params.commissionRateUsed}%, commission=${params.commissionComputed}`);
    return record.id;
  }

  /**
   * Get commission audit for a sub-order
   */
  static async getCommissionAudit(subOrderId: string) {
    return prisma.mvm_commission_audit.findUnique({
      where: { subOrderId },
    });
  }

  /**
   * Get all commission audits for a vendor
   */
  static async getVendorCommissionAudits(vendorId: string, limit = 100) {
    return prisma.mvm_commission_audit.findMany({
      where: { vendorId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });
  }
}

export const recordCommissionAudit = CommissionAuditService.recordCommissionAudit.bind(CommissionAuditService);
