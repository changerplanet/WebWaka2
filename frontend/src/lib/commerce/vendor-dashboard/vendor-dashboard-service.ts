/**
 * Vendor Mobile Dashboard Service
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Provides read-only dashboard data for marketplace vendors.
 * Optimized for mobile with lightweight responses and efficient queries.
 * NO automation, NO payouts execution, read-only financials.
 */

import { prisma } from '@/lib/prisma';
import {
  VendorProfile,
  VendorDashboardStats,
  VendorOrder,
  VendorOrderItem,
  VendorFulfillmentItem,
  VendorPayoutInfo,
  VendorDashboardData,
  VendorOrderListParams,
  VendorOrderListResult,
  VendorFulfillmentListParams,
  VendorFulfillmentListResult,
  VendorEarningsParams,
  VendorEarningsResult,
  VendorEarningPeriod,
  ORDER_STATUS_LABELS,
  calculateFulfillmentPriority,
  getDaysSinceOrder,
  FulfillmentPriority,
} from './types';

const MINIMUM_PAYOUT_NGN = 5000;

export class VendorDashboardService {
  private tenantId: string;
  private vendorId: string;

  constructor(tenantId: string, vendorId: string) {
    this.tenantId = tenantId;
    this.vendorId = vendorId;
  }

  async getProfile(): Promise<VendorProfile | null> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: {
        id: this.vendorId,
        tenantId: this.tenantId,
      },
      include: {
        tier: {
          select: {
            name: true,
            commissionRate: true,
          },
        },
      },
    });

    if (!vendor) return null;

    return {
      id: vendor.id,
      tenantId: vendor.tenantId,
      name: vendor.name,
      slug: vendor.slug,
      email: vendor.email,
      phone: vendor.phone || undefined,
      logo: vendor.logo || undefined,
      status: vendor.status,
      isVerified: vendor.isVerified,
      tierName: vendor.tier?.name,
      commissionRate: vendor.commissionOverride 
        ? Number(vendor.commissionOverride) 
        : (vendor.tier?.commissionRate ? Number(vendor.tier.commissionRate) : 15),
      totalSales: Number(vendor.totalSales),
      totalOrders: vendor.totalOrders,
      averageRating: vendor.averageRating ? Number(vendor.averageRating) : undefined,
      reviewCount: vendor.reviewCount,
      createdAt: vendor.createdAt,
    };
  }

  async getDashboardStats(): Promise<VendorDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingCount,
      processingCount,
      confirmedCount,
      shippedCount,
      deliveredTodayCount,
      todayEarnings,
      pendingPayoutAmount,
    ] = await Promise.all([
      prisma.mvm_sub_order.count({
        where: { tenantId: this.tenantId, vendorId: this.vendorId, status: 'PENDING' },
      }),
      prisma.mvm_sub_order.count({
        where: { tenantId: this.tenantId, vendorId: this.vendorId, status: 'PROCESSING' },
      }),
      prisma.mvm_sub_order.count({
        where: { tenantId: this.tenantId, vendorId: this.vendorId, status: 'CONFIRMED' },
      }),
      prisma.mvm_sub_order.count({
        where: { tenantId: this.tenantId, vendorId: this.vendorId, status: 'SHIPPED' },
      }),
      prisma.mvm_sub_order.count({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: 'DELIVERED',
          deliveredAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.mvm_sub_order.aggregate({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: 'DELIVERED',
          deliveredAt: { gte: today, lt: tomorrow },
        },
        _sum: { vendorPayout: true },
      }),
      prisma.mvm_sub_order.aggregate({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
        _sum: { vendorPayout: true },
      }),
    ]);

    return {
      pendingOrders: pendingCount,
      processingOrders: processingCount,
      readyToShip: confirmedCount,
      shippedOrders: shippedCount,
      deliveredToday: deliveredTodayCount,
      totalEarningsToday: todayEarnings._sum.vendorPayout 
        ? Number(todayEarnings._sum.vendorPayout) 
        : 0,
      pendingPayout: pendingPayoutAmount._sum.vendorPayout 
        ? Number(pendingPayoutAmount._sum.vendorPayout) 
        : 0,
      currency: 'NGN',
    };
  }

  async getOrders(params: VendorOrderListParams = {}): Promise<VendorOrderListResult> {
    const { 
      status = 'ALL', 
      limit = 20, 
      offset = 0, 
      sortBy = 'date', 
      sortOrder = 'desc' 
    } = params;

    const where: any = {
      tenantId: this.tenantId,
      vendorId: this.vendorId,
    };

    if (status !== 'ALL') {
      where.status = status;
    }

    const orderBy: any = {};
    if (sortBy === 'date') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.grandTotal = sortOrder;
    }

    const [orders, total] = await Promise.all([
      prisma.mvm_sub_order.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          parentOrder: {
            select: { orderNumber: true },
          },
          items: true,
        },
      }),
      prisma.mvm_sub_order.count({ where }),
    ]);

    const vendorOrders: VendorOrder[] = orders.map(order => {
      const priority = calculateFulfillmentPriority(order.createdAt, order.status);
      const daysSince = getDaysSinceOrder(order.createdAt);

      return {
        id: order.id,
        subOrderNumber: order.subOrderNumber,
        parentOrderNumber: order.parentOrder?.orderNumber || '',
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        customerName: order.customerName || undefined,
        shippingCity: order.shippingCity || undefined,
        shippingState: order.shippingState || undefined,
        itemCount: order.items.length,
        grandTotal: Number(order.grandTotal),
        vendorPayout: Number(order.vendorPayout),
        currency: order.currency,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt || undefined,
        shippedAt: order.shippedAt || undefined,
        deliveredAt: order.deliveredAt || undefined,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName || undefined,
          sku: item.sku || undefined,
          imageUrl: item.imageUrl || undefined,
          quantity: item.quantity,
          fulfilledQuantity: item.fulfilledQuantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
        fulfillmentPriority: priority,
        daysSinceOrder: daysSince,
      };
    });

    if (sortBy === 'priority') {
      const priorityOrder: Record<FulfillmentPriority, number> = {
        URGENT: 0,
        NORMAL: 1,
        LOW: 2,
      };
      vendorOrders.sort((a, b) => {
        const diff = priorityOrder[a.fulfillmentPriority] - priorityOrder[b.fulfillmentPriority];
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return {
      orders: vendorOrders,
      total,
      hasMore: offset + orders.length < total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  async getOrderDetails(subOrderId: string): Promise<VendorOrder | null> {
    const order = await prisma.mvm_sub_order.findFirst({
      where: {
        id: subOrderId,
        tenantId: this.tenantId,
        vendorId: this.vendorId,
      },
      include: {
        parentOrder: {
          select: { orderNumber: true },
        },
        items: true,
      },
    });

    if (!order) return null;

    const priority = calculateFulfillmentPriority(order.createdAt, order.status);
    const daysSince = getDaysSinceOrder(order.createdAt);

    return {
      id: order.id,
      subOrderNumber: order.subOrderNumber,
      parentOrderNumber: order.parentOrder?.orderNumber || '',
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
      customerName: order.customerName || undefined,
      shippingCity: order.shippingCity || undefined,
      shippingState: order.shippingState || undefined,
      itemCount: order.items.length,
      grandTotal: Number(order.grandTotal),
      vendorPayout: Number(order.vendorPayout),
      currency: order.currency,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt || undefined,
      shippedAt: order.shippedAt || undefined,
      deliveredAt: order.deliveredAt || undefined,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName || undefined,
        sku: item.sku || undefined,
        imageUrl: item.imageUrl || undefined,
        quantity: item.quantity,
        fulfilledQuantity: item.fulfilledQuantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      fulfillmentPriority: priority,
      daysSinceOrder: daysSince,
    };
  }

  async getFulfillmentQueue(params: VendorFulfillmentListParams = {}): Promise<VendorFulfillmentListResult> {
    const { priority, limit = 50, offset = 0 } = params;

    const orders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        vendorId: this.vendorId,
        status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: true,
      },
    });

    let items: VendorFulfillmentItem[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        const pending = item.quantity - item.fulfilledQuantity;
        if (pending <= 0) continue;

        const daysWaiting = getDaysSinceOrder(order.createdAt);
        const itemPriority = calculateFulfillmentPriority(order.createdAt, order.status);

        if (priority && itemPriority !== priority) continue;

        items.push({
          subOrderId: order.id,
          subOrderNumber: order.subOrderNumber,
          productName: item.productName,
          variantName: item.variantName || undefined,
          imageUrl: item.imageUrl || undefined,
          quantity: item.quantity,
          fulfilledQuantity: item.fulfilledQuantity,
          pendingQuantity: pending,
          customerName: order.customerName || undefined,
          shippingCity: order.shippingCity || undefined,
          shippingState: order.shippingState || undefined,
          orderDate: order.createdAt,
          priority: itemPriority,
          daysWaiting,
        });
      }
    }

    items.sort((a, b) => {
      const priorityOrder: Record<FulfillmentPriority, number> = {
        URGENT: 0,
        NORMAL: 1,
        LOW: 2,
      };
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      return a.daysWaiting - b.daysWaiting;
    });

    const urgentCount = items.filter(i => i.priority === 'URGENT').length;
    const normalCount = items.filter(i => i.priority === 'NORMAL').length;

    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
      hasMore: offset + paginatedItems.length < items.length,
      urgentCount,
      normalCount,
    };
  }

  async getEarnings(params: VendorEarningsParams): Promise<VendorEarningsResult> {
    const { period } = params;
    const { start, end } = this.getPeriodDates(period);

    const orders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        vendorId: this.vendorId,
        status: 'DELIVERED',
        deliveredAt: { gte: start, lte: end },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 10,
      include: {
        parentOrder: {
          select: { paymentMethod: true },
        },
      },
    });

    let grossSales = 0;
    let commissions = 0;
    let netEarnings = 0;
    let paystackAmount = 0;
    let bankTransferAmount = 0;
    let codAmount = 0;

    for (const order of orders) {
      const gross = Number(order.grandTotal);
      const commission = Number(order.commissionAmount);
      const net = Number(order.vendorPayout);
      
      grossSales += gross;
      commissions += commission;
      netEarnings += net;

      const method = order.parentOrder?.paymentMethod?.toUpperCase() || '';
      if (method.includes('PAYSTACK') || method.includes('CARD')) {
        paystackAmount += net;
      } else if (method.includes('BANK') || method.includes('TRANSFER')) {
        bankTransferAmount += net;
      } else if (method.includes('COD') || method.includes('CASH')) {
        codAmount += net;
      }
    }

    const summary: VendorEarningPeriod = {
      label: this.getPeriodLabel(period),
      grossSales,
      commissions,
      netEarnings,
      orderCount: orders.length,
    };

    const payoutInfo = await this.getPayoutInfo();

    return {
      summary,
      payoutInfo,
      byPaymentMethod: {
        paystack: paystackAmount,
        bankTransfer: bankTransferAmount,
        cod: codAmount,
      },
      recentOrders: orders.map(o => ({
        subOrderNumber: o.subOrderNumber,
        date: o.deliveredAt || o.createdAt,
        grossAmount: Number(o.grandTotal),
        netEarning: Number(o.vendorPayout),
      })),
    };
  }

  async getPayoutInfo(): Promise<VendorPayoutInfo> {
    const [pendingAgg, eligibleAgg, paidAgg, lastPayout] = await Promise.all([
      prisma.mvm_sub_order.aggregate({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
        _sum: { vendorPayout: true },
      }),
      prisma.mvm_sub_order.aggregate({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: 'DELIVERED',
        },
        _sum: { vendorPayout: true },
      }),
      prisma.mvm_payout.aggregate({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: 'COMPLETED',
        },
        _sum: { netAmount: true },
      }),
      prisma.mvm_payout.findFirst({
        where: {
          tenantId: this.tenantId,
          vendorId: this.vendorId,
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
        select: {
          completedAt: true,
          netAmount: true,
        },
      }),
    ]);

    const pendingAmount = pendingAgg._sum.vendorPayout 
      ? Number(pendingAgg._sum.vendorPayout) 
      : 0;
    
    const eligibleAmount = eligibleAgg._sum.vendorPayout 
      ? Number(eligibleAgg._sum.vendorPayout) 
      : 0;
    
    const paidAmount = paidAgg._sum?.netAmount 
      ? Number(paidAgg._sum.netAmount) 
      : 0;

    return {
      pendingAmount,
      eligibleAmount: Math.max(0, eligibleAmount - paidAmount),
      paidAmount,
      lastPayoutDate: lastPayout?.completedAt || undefined,
      lastPayoutAmount: lastPayout?.netAmount ? Number(lastPayout.netAmount) : undefined,
      minimumPayout: MINIMUM_PAYOUT_NGN,
      currency: 'NGN',
    };
  }

  async getDashboard(): Promise<VendorDashboardData | null> {
    const [profile, stats, ordersResult, payoutInfo] = await Promise.all([
      this.getProfile(),
      this.getDashboardStats(),
      this.getOrders({ limit: 5, sortBy: 'priority', sortOrder: 'desc' }),
      this.getPayoutInfo(),
    ]);

    if (!profile) return null;

    return {
      profile,
      stats,
      recentOrders: ordersResult.orders,
      payoutInfo,
      lastUpdated: new Date(),
    };
  }

  private getPeriodDates(period: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '30d':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case '90d':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        start = new Date(0);
        break;
    }

    return { start, end };
  }

  private getPeriodLabel(period: string): string {
    switch (period) {
      case 'today':
        return 'Today';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      case 'all':
      default:
        return 'All Time';
    }
  }
}

export function createVendorDashboardService(tenantId: string, vendorId: string): VendorDashboardService {
  return new VendorDashboardService(tenantId, vendorId);
}
