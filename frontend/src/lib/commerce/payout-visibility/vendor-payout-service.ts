/**
 * Vendor Payout Visibility Service
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Provides read-only visibility into vendor earnings, commissions, and payment status.
 * NO payout execution - visibility only.
 */

import { prisma } from '@/lib/prisma';
import {
  VendorEarningsSummary,
  VendorOrderEarning,
  PayoutStatus,
  PaymentMethodType,
  TimeFilter,
  getTimeFilterDates,
} from './types';

export class VendorPayoutService {
  private tenantId: string;
  private vendorId: string;

  constructor(tenantId: string, vendorId: string) {
    this.tenantId = tenantId;
    this.vendorId = vendorId;
  }

  async getEarningsSummary(filter?: TimeFilter): Promise<VendorEarningsSummary> {
    const { start, end } = filter 
      ? getTimeFilterDates(filter) 
      : { start: new Date(0), end: new Date() };

    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: this.vendorId },
      select: { name: true },
    });

    const subOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        vendorId: this.vendorId,
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
    });

    let totalGrossSales = 0;
    let totalCommissions = 0;
    let totalNetEarnings = 0;
    let pendingEarnings = 0;
    let eligibleEarnings = 0;
    let paidEarnings = 0;
    let paystackEarnings = 0;
    let bankTransferEarnings = 0;
    let codEarnings = 0;

    for (const order of subOrders) {
      const gross = Number(order.grandTotal);
      const commission = Number(order.commissionAmount);
      const net = Number(order.vendorPayout);
      const paymentMethod = this.resolvePaymentMethod(order.parentOrder?.paymentMethod);
      const payoutStatus = this.resolvePayoutStatus(order.status, order.parentOrder?.paymentStatus || 'PENDING');

      totalGrossSales += gross;
      totalCommissions += commission;
      totalNetEarnings += net;

      switch (payoutStatus) {
        case 'PENDING':
        case 'HOLD':
          pendingEarnings += net;
          break;
        case 'ELIGIBLE':
        case 'SCHEDULED':
          eligibleEarnings += net;
          break;
        case 'PAID':
          paidEarnings += net;
          break;
      }

      switch (paymentMethod) {
        case 'PAYSTACK':
          paystackEarnings += net;
          break;
        case 'BANK_TRANSFER':
          bankTransferEarnings += net;
          break;
        case 'COD':
          codEarnings += net;
          break;
      }
    }

    const codPayments = await this.getCodCollectionStatus(start, end);
    const bankTransferPayments = await this.getBankTransferCollectionStatus(start, end);

    return {
      vendorId: this.vendorId,
      vendorName: vendor?.name || 'Unknown Vendor',
      tenantId: this.tenantId,
      currency: 'NGN',
      totalOrders: subOrders.length,
      totalGrossSales,
      totalCommissions,
      totalNetEarnings,
      pendingEarnings,
      eligibleEarnings,
      paidEarnings,
      paystackEarnings,
      bankTransferEarnings,
      codEarnings,
      collectedAmount: codPayments.collected + bankTransferPayments.verified,
      pendingCollectionAmount: codPayments.pending + bankTransferPayments.pending,
      periodStart: start,
      periodEnd: end,
    };
  }

  async getOrderEarnings(options: {
    filter?: TimeFilter;
    status?: string;
    paymentMethod?: PaymentMethodType;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: VendorOrderEarning[]; total: number }> {
    const { filter, status, paymentMethod, limit = 50, offset = 0 } = options;
    const { start, end } = filter 
      ? getTimeFilterDates(filter) 
      : { start: new Date(0), end: new Date() };

    const baseWhere = {
      tenantId: this.tenantId,
      vendorId: this.vendorId,
      createdAt: { gte: start, lte: end },
    };

    const where = status 
      ? { ...baseWhere, status: status as any }
      : baseWhere;

    const subOrders = await prisma.mvm_sub_order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.mvm_sub_order.count({ where: baseWhere });

    const orders: VendorOrderEarning[] = [];

    for (const order of subOrders) {
      const parentOrder = await prisma.mvm_parent_order.findUnique({
        where: { id: order.parentOrderId },
        select: {
          orderNumber: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      });

      const itemCount = await prisma.mvm_sub_order_item.count({
        where: { subOrderId: order.id },
      });

      const pm = this.resolvePaymentMethod(parentOrder?.paymentMethod);
      
      if (paymentMethod && pm !== paymentMethod) {
        continue;
      }

      const collectionInfo = await this.getOrderCollectionInfo(
        order.parentOrderId,
        pm
      );

      orders.push({
        subOrderId: order.id,
        subOrderNumber: order.subOrderNumber,
        parentOrderId: order.parentOrderId,
        parentOrderNumber: parentOrder?.orderNumber || '',
        orderDate: order.createdAt,
        status: order.status,
        itemCount,
        grossAmount: Number(order.grandTotal),
        commissionRate: Number(order.commissionRate),
        commissionAmount: Number(order.commissionAmount),
        netEarning: Number(order.vendorPayout),
        currency: order.currency,
        paymentMethod: pm,
        paymentStatus: this.resolvePayoutStatus(order.status, parentOrder?.paymentStatus || 'PENDING'),
        paymentVerified: collectionInfo.verified,
        collectedAmount: collectionInfo.collectedAmount,
        collectionStatus: collectionInfo.status,
        reconciledAt: collectionInfo.reconciledAt,
        customerName: order.customerName ?? undefined,
        shippingCity: order.shippingCity ?? undefined,
        shippingState: order.shippingState ?? undefined,
      });
    }

    return { orders, total };
  }

  async getPendingPayouts(): Promise<VendorOrderEarning[]> {
    const { orders } = await this.getOrderEarnings({
      filter: { period: 'all' },
    });

    return orders.filter(o => 
      o.paymentStatus === 'ELIGIBLE' || 
      o.paymentStatus === 'SCHEDULED'
    );
  }

  async getRecentPayouts(limit: number = 10): Promise<VendorOrderEarning[]> {
    const { orders } = await this.getOrderEarnings({
      filter: { period: '30d' },
      limit,
    });

    return orders.filter(o => o.paymentStatus === 'PAID');
  }

  private async getCodCollectionStatus(start: Date, end: Date): Promise<{
    collected: number;
    pending: number;
  }> {
    const codPayments = await prisma.cod_payment.findMany({
      where: {
        tenantId: this.tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        status: true,
        expectedAmount: true,
        collectedAmount: true,
      },
    });

    let collected = 0;
    let pending = 0;

    for (const payment of codPayments) {
      if (['COLLECTED', 'RECONCILED'].includes(payment.status)) {
        collected += Number(payment.collectedAmount || payment.expectedAmount);
      } else if (!['FAILED', 'RETURNED', 'CANCELLED'].includes(payment.status)) {
        pending += Number(payment.expectedAmount);
      }
    }

    return { collected, pending };
  }

  private async getBankTransferCollectionStatus(start: Date, end: Date): Promise<{
    verified: number;
    pending: number;
  }> {
    const bankTransferPayments = await prisma.bank_transfer_payment.findMany({
      where: {
        tenantId: this.tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        status: true,
        amount: true,
      },
    });

    let verified = 0;
    let pending = 0;

    for (const payment of bankTransferPayments) {
      if (payment.status === 'VERIFIED') {
        verified += Number(payment.amount);
      } else if (!['REJECTED', 'EXPIRED', 'CANCELLED'].includes(payment.status)) {
        pending += Number(payment.amount);
      }
    }

    return { verified, pending };
  }

  private async getOrderCollectionInfo(parentOrderId: string, paymentMethod: PaymentMethodType): Promise<{
    verified: boolean;
    collectedAmount?: number;
    status?: string;
    reconciledAt?: Date;
  }> {
    if (paymentMethod === 'COD') {
      const codPayment = await prisma.cod_payment.findFirst({
        where: { orderId: parentOrderId },
        select: {
          status: true,
          collectedAmount: true,
          reconciledAt: true,
        },
      });

      if (codPayment) {
        return {
          verified: ['COLLECTED', 'RECONCILED'].includes(codPayment.status),
          collectedAmount: codPayment.collectedAmount ? Number(codPayment.collectedAmount) : undefined,
          status: codPayment.status,
          reconciledAt: codPayment.reconciledAt ?? undefined,
        };
      }
    }

    if (paymentMethod === 'BANK_TRANSFER') {
      const btPayment = await prisma.bank_transfer_payment.findFirst({
        where: { orderId: parentOrderId },
        select: {
          status: true,
          amount: true,
          verifiedAt: true,
        },
      });

      if (btPayment) {
        return {
          verified: btPayment.status === 'VERIFIED',
          collectedAmount: btPayment.status === 'VERIFIED' ? Number(btPayment.amount) : undefined,
          status: btPayment.status,
          reconciledAt: btPayment.verifiedAt ?? undefined,
        };
      }
    }

    if (paymentMethod === 'PAYSTACK') {
      return { verified: true };
    }

    return { verified: false };
  }

  private resolvePaymentMethod(method?: string | null): PaymentMethodType {
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

  private resolvePayoutStatus(orderStatus: string, paymentStatus: string): PayoutStatus {
    if (orderStatus === 'CANCELLED') {
      return 'CANCELLED';
    }
    
    if (paymentStatus === 'PAID' || paymentStatus === 'COMPLETED') {
      if (orderStatus === 'DELIVERED') {
        return 'ELIGIBLE';
      }
      return 'PENDING';
    }
    
    if (paymentStatus === 'PENDING' || paymentStatus === 'AWAITING') {
      return 'PENDING';
    }
    
    return 'PENDING';
  }
}

export function createVendorPayoutService(tenantId: string, vendorId: string): VendorPayoutService {
  return new VendorPayoutService(tenantId, vendorId);
}
