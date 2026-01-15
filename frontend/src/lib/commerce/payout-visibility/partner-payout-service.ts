/**
 * Partner Payout Overview Service
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Provides partner-level visibility into vendor earnings across their tenant.
 * NO payout execution - visibility only.
 */

import { prisma } from '@/lib/prisma';
import {
  PartnerPayoutOverview,
  VendorPayoutBreakdown,
  TimeFilter,
  getTimeFilterDates,
} from './types';

export class PartnerPayoutService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async getPayoutOverview(filter?: TimeFilter): Promise<PartnerPayoutOverview> {
    const { start, end } = filter 
      ? getTimeFilterDates(filter) 
      : { start: new Date(0), end: new Date() };

    const [vendors, subOrders, codPayments, bankTransferPayments] = await Promise.all([
      prisma.mvm_vendor.findMany({
        where: { tenantId: this.tenantId },
        select: { id: true, status: true },
      }),
      prisma.mvm_sub_order.findMany({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: start, lte: end },
        },
        include: {
          parentOrder: {
            select: {
              paymentMethod: true,
              paymentStatus: true,
            },
          },
        },
      }),
      prisma.cod_payment.findMany({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: start, lte: end },
        },
        select: {
          status: true,
          expectedAmount: true,
          collectedAmount: true,
        },
      }),
      prisma.bank_transfer_payment.findMany({
        where: {
          tenantId: this.tenantId,
          createdAt: { gte: start, lte: end },
        },
        select: {
          status: true,
          amount: true,
        },
      }),
    ]);

    let totalGrossSales = 0;
    let totalCommissionsCollected = 0;
    let totalVendorEarnings = 0;
    let paystackVolume = 0;
    let bankTransferVolume = 0;
    let codVolume = 0;
    let totalEligibleForPayout = 0;
    let totalPaid = 0;
    let totalPending = 0;

    for (const order of subOrders) {
      const gross = Number(order.grandTotal);
      const commission = Number(order.commissionAmount);
      const net = Number(order.vendorPayout);
      const paymentMethod = this.resolvePaymentMethod(order.parentOrder?.paymentMethod);
      
      totalGrossSales += gross;
      totalCommissionsCollected += commission;
      totalVendorEarnings += net;

      switch (paymentMethod) {
        case 'PAYSTACK':
          paystackVolume += gross;
          break;
        case 'BANK_TRANSFER':
          bankTransferVolume += gross;
          break;
        case 'COD':
          codVolume += gross;
          break;
      }

      if (order.status === 'CANCELLED') {
        continue;
      }
      
      const paymentConfirmed = order.parentOrder?.paymentStatus === 'PAID' || 
                               order.parentOrder?.paymentStatus === 'COMPLETED';
      
      if (paymentConfirmed && order.status === 'DELIVERED') {
        totalEligibleForPayout += net;
      } else {
        totalPending += net;
      }
    }

    let totalCollected = 0;
    let totalPendingCollection = 0;

    for (const cod of codPayments) {
      if (['COLLECTED', 'RECONCILED'].includes(cod.status)) {
        totalCollected += Number(cod.collectedAmount || cod.expectedAmount);
      } else if (!['FAILED', 'RETURNED', 'CANCELLED'].includes(cod.status)) {
        totalPendingCollection += Number(cod.expectedAmount);
      }
    }

    for (const bt of bankTransferPayments) {
      if (bt.status === 'VERIFIED') {
        totalCollected += Number(bt.amount);
      } else if (!['REJECTED', 'EXPIRED', 'CANCELLED'].includes(bt.status)) {
        totalPendingCollection += Number(bt.amount);
      }
    }

    return {
      partnerId: this.tenantId,
      partnerName: 'Partner',
      tenantId: this.tenantId,
      currency: 'NGN',
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.status === 'APPROVED').length,
      totalGrossSales,
      totalCommissionsCollected,
      totalVendorEarnings,
      paystackVolume,
      bankTransferVolume,
      codVolume,
      totalCollected,
      totalPendingCollection,
      totalEligibleForPayout,
      totalPaid,
      totalPending,
      periodStart: start,
      periodEnd: end,
    };
  }

  async getVendorBreakdown(filter?: TimeFilter): Promise<VendorPayoutBreakdown[]> {
    const { start, end } = filter 
      ? getTimeFilterDates(filter) 
      : { start: new Date(0), end: new Date() };

    const vendors = await prisma.mvm_vendor.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, name: true },
    });

    const subOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        parentOrder: {
          select: { paymentStatus: true },
        },
      },
    });

    const vendorMap = new Map<string, VendorPayoutBreakdown>();

    for (const vendor of vendors) {
      vendorMap.set(vendor.id, {
        vendorId: vendor.id,
        vendorName: vendor.name,
        totalOrders: 0,
        grossSales: 0,
        commissions: 0,
        netEarnings: 0,
        eligibleAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      });
    }

    for (const order of subOrders) {
      const breakdown = vendorMap.get(order.vendorId);
      if (!breakdown) continue;

      const net = Number(order.vendorPayout);

      breakdown.totalOrders++;
      breakdown.grossSales += Number(order.grandTotal);
      breakdown.commissions += Number(order.commissionAmount);
      breakdown.netEarnings += net;

      const paymentConfirmed = order.parentOrder?.paymentStatus === 'PAID' || 
                               order.parentOrder?.paymentStatus === 'COMPLETED';

      if (order.status !== 'CANCELLED') {
        if (paymentConfirmed && order.status === 'DELIVERED') {
          breakdown.eligibleAmount += net;
        } else {
          breakdown.pendingAmount += net;
        }
      }
    }

    return Array.from(vendorMap.values())
      .filter(v => v.totalOrders > 0)
      .sort((a, b) => b.netEarnings - a.netEarnings);
  }

  async getTopVendors(limit: number = 10, filter?: TimeFilter): Promise<VendorPayoutBreakdown[]> {
    const breakdown = await this.getVendorBreakdown(filter);
    return breakdown.slice(0, limit);
  }

  async getVendorPayoutDetails(vendorId: string, filter?: TimeFilter): Promise<VendorPayoutBreakdown | null> {
    const breakdown = await this.getVendorBreakdown(filter);
    return breakdown.find(v => v.vendorId === vendorId) || null;
  }

  async getPaymentMethodBreakdown(filter?: TimeFilter): Promise<{
    paystack: { count: number; volume: number; percentage: number };
    bankTransfer: { count: number; volume: number; percentage: number };
    cod: { count: number; volume: number; percentage: number };
  }> {
    const { start, end } = filter 
      ? getTimeFilterDates(filter) 
      : { start: new Date(0), end: new Date() };

    const subOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        parentOrder: {
          select: { paymentMethod: true },
        },
      },
    });

    let paystackCount = 0, paystackVolume = 0;
    let bankTransferCount = 0, bankTransferVolume = 0;
    let codCount = 0, codVolume = 0;
    let totalVolume = 0;

    for (const order of subOrders) {
      const volume = Number(order.grandTotal);
      totalVolume += volume;
      
      const method = this.resolvePaymentMethod(order.parentOrder?.paymentMethod);
      
      switch (method) {
        case 'PAYSTACK':
          paystackCount++;
          paystackVolume += volume;
          break;
        case 'BANK_TRANSFER':
          bankTransferCount++;
          bankTransferVolume += volume;
          break;
        case 'COD':
          codCount++;
          codVolume += volume;
          break;
      }
    }

    return {
      paystack: {
        count: paystackCount,
        volume: paystackVolume,
        percentage: totalVolume > 0 ? (paystackVolume / totalVolume) * 100 : 0,
      },
      bankTransfer: {
        count: bankTransferCount,
        volume: bankTransferVolume,
        percentage: totalVolume > 0 ? (bankTransferVolume / totalVolume) * 100 : 0,
      },
      cod: {
        count: codCount,
        volume: codVolume,
        percentage: totalVolume > 0 ? (codVolume / totalVolume) * 100 : 0,
      },
    };
  }

  private resolvePaymentMethod(method?: string | null): 'PAYSTACK' | 'BANK_TRANSFER' | 'COD' | 'UNKNOWN' {
    if (!method) return 'UNKNOWN';
    
    const normalized = method.toUpperCase();
    if (normalized.includes('PAYSTACK') || normalized.includes('CARD')) {
      return 'PAYSTACK';
    }
    if (normalized.includes('BANK') || normalized.includes('TRANSFER')) {
      return 'BANK_TRANSFER';
    }
    if (normalized.includes('COD') || normalized.includes('CASH')) {
      return 'COD';
    }
    return 'UNKNOWN';
  }
}

export function createPartnerPayoutService(tenantId: string): PartnerPayoutService {
  return new PartnerPayoutService(tenantId);
}
