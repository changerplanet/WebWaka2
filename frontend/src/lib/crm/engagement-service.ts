/**
 * MODULE 3: CRM & Customer Engagement
 * Engagement Service
 * 
 * Tracks customer engagement events and emits CRM events.
 * 
 * CONSUMES (from Core/other modules):
 * - SALE_COMPLETED
 * - ORDER_COMPLETED
 * - CUSTOMER_CREATED
 * - CUSTOMER_UPDATED
 * 
 * EMITS (for Core/other modules):
 * - LOYALTY_POINTS_EARNED
 * - LOYALTY_POINTS_REDEEMED
 * - CAMPAIGN_TRIGGERED
 * - CUSTOMER_ENGAGEMENT_RECORDED
 * 
 * CONSTRAINTS:
 * - Events must be idempotent
 * - No synchronous dependencies
 */

import { prisma } from '@/lib/prisma';
import { CrmEngagementType, Prisma } from '@prisma/client';
import { LoyaltyService } from './loyalty-service';

// ============================================================================
// TYPES
// ============================================================================

export interface EngagementInput {
  customerId: string;
  eventType: CrmEngagementType;
  channel?: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
  monetaryValue?: number;
  pointsValue?: number;
  campaignId?: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface SaleEvent {
  saleId: string;
  saleNumber: string;
  customerId: string;
  totalAmount: number;
  channel: string;  // "POS", "ONLINE", "MARKETPLACE"
  itemCount: number;
  paymentMethod: string;
  saleDate: Date;
}

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  channel: string;
  itemCount: number;
  orderDate: Date;
}

// ============================================================================
// ENGAGEMENT SERVICE
// ============================================================================

export class EngagementService {
  /**
   * Record an engagement event
   */
  static async recordEvent(tenantId: string, input: EngagementInput) {
    return prisma.crmEngagementEvent.create({
      data: {
        tenantId,
        customerId: input.customerId,
        eventType: input.eventType,
        channel: input.channel,
        description: input.description,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        monetaryValue: input.monetaryValue,
        pointsValue: input.pointsValue,
        campaignId: input.campaignId,
        sessionId: input.sessionId,
        deviceId: input.deviceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Process a sale completion event
   * - Records engagement
   * - Awards loyalty points
   * - Updates customer stats
   */
  static async processSaleCompleted(tenantId: string, event: SaleEvent) {
    // Check idempotency
    const existing = await prisma.crmEngagementEvent.findFirst({
      where: {
        tenantId,
        sourceType: 'SALE',
        sourceId: event.saleId,
      },
    });

    if (existing) {
      return { action: 'skipped', reason: 'Event already processed' };
    }

    // Record engagement
    await this.recordEvent(tenantId, {
      customerId: event.customerId,
      eventType: 'PURCHASE',
      channel: event.channel,
      description: `Sale ${event.saleNumber} - ${event.itemCount} items`,
      sourceType: 'SALE',
      sourceId: event.saleId,
      monetaryValue: event.totalAmount,
      metadata: {
        saleNumber: event.saleNumber,
        itemCount: event.itemCount,
        paymentMethod: event.paymentMethod,
      },
    });

    // Award loyalty points
    let loyaltyResult = null;
    try {
      const program = await prisma.crmLoyaltyProgram.findUnique({
        where: { tenantId },
      });

      if (program?.isActive) {
        const calculation = await LoyaltyService.calculateEarnPoints(
          tenantId,
          event.customerId,
          event.totalAmount,
          event.channel
        );

        if (calculation.points > 0) {
          const transaction = await LoyaltyService.earnPoints(tenantId, {
            customerId: event.customerId,
            points: calculation.points,
            sourceType: 'POS_SALE',
            sourceId: event.saleId,
            description: `Points from sale ${event.saleNumber}`,
            ruleId: calculation.ruleId,
          });

          loyaltyResult = {
            pointsEarned: calculation.points,
            transactionId: transaction.id,
            breakdown: calculation.breakdown,
          };
        }
      }
    } catch (error) {
      console.error('Failed to award loyalty points:', error);
    }

    // Update customer stats
    await prisma.customer.update({
      where: { id: event.customerId },
      data: {
        totalSpent: { increment: event.totalAmount },
        totalOrders: { increment: 1 },
        lastOrderAt: event.saleDate,
      },
    });

    return {
      action: 'processed',
      engagement: true,
      loyalty: loyaltyResult,
    };
  }

  /**
   * Process an order completion event
   */
  static async processOrderCompleted(tenantId: string, event: OrderEvent) {
    // Check idempotency
    const existing = await prisma.crmEngagementEvent.findFirst({
      where: {
        tenantId,
        sourceType: 'ORDER',
        sourceId: event.orderId,
      },
    });

    if (existing) {
      return { action: 'skipped', reason: 'Event already processed' };
    }

    // Record engagement
    await this.recordEvent(tenantId, {
      customerId: event.customerId,
      eventType: 'PURCHASE',
      channel: event.channel,
      description: `Order ${event.orderNumber} - ${event.itemCount} items`,
      sourceType: 'ORDER',
      sourceId: event.orderId,
      monetaryValue: event.totalAmount,
      metadata: {
        orderNumber: event.orderNumber,
        itemCount: event.itemCount,
      },
    });

    // Award loyalty points (similar to sale)
    let loyaltyResult = null;
    try {
      const program = await prisma.crmLoyaltyProgram.findUnique({
        where: { tenantId },
      });

      if (program?.isActive) {
        const calculation = await LoyaltyService.calculateEarnPoints(
          tenantId,
          event.customerId,
          event.totalAmount,
          event.channel
        );

        if (calculation.points > 0) {
          const transaction = await LoyaltyService.earnPoints(tenantId, {
            customerId: event.customerId,
            points: calculation.points,
            sourceType: 'ONLINE_ORDER',
            sourceId: event.orderId,
            description: `Points from order ${event.orderNumber}`,
            ruleId: calculation.ruleId,
          });

          loyaltyResult = {
            pointsEarned: calculation.points,
            transactionId: transaction.id,
          };
        }
      }
    } catch (error) {
      console.error('Failed to award loyalty points:', error);
    }

    // Update customer stats
    await prisma.customer.update({
      where: { id: event.customerId },
      data: {
        totalSpent: { increment: event.totalAmount },
        totalOrders: { increment: 1 },
        lastOrderAt: event.orderDate,
      },
    });

    return {
      action: 'processed',
      engagement: true,
      loyalty: loyaltyResult,
    };
  }

  /**
   * Get customer engagement history
   */
  static async getCustomerHistory(
    tenantId: string,
    customerId: string,
    options?: {
      eventType?: CrmEngagementType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.CrmEngagementEventWhereInput = { tenantId, customerId };

    if (options?.eventType) where.eventType = options.eventType;
    if (options?.startDate || options?.endDate) {
      where.occurredAt = {};
      if (options.startDate) where.occurredAt.gte = options.startDate;
      if (options.endDate) where.occurredAt.lte = options.endDate;
    }

    const [events, total] = await Promise.all([
      prisma.crmEngagementEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.crmEngagementEvent.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Get engagement summary for customer
   */
  static async getCustomerSummary(tenantId: string, customerId: string) {
    const [
      totalEngagements,
      purchaseCount,
      totalSpent,
      lastEngagement,
      recentEngagements,
    ] = await Promise.all([
      prisma.crmEngagementEvent.count({ where: { tenantId, customerId } }),
      prisma.crmEngagementEvent.count({ where: { tenantId, customerId, eventType: 'PURCHASE' } }),
      prisma.crmEngagementEvent.aggregate({
        where: { tenantId, customerId, eventType: 'PURCHASE' },
        _sum: { monetaryValue: true },
      }),
      prisma.crmEngagementEvent.findFirst({
        where: { tenantId, customerId },
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.crmEngagementEvent.findMany({
        where: { tenantId, customerId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      customerId,
      totalEngagements,
      purchaseCount,
      totalSpent: totalSpent._sum.monetaryValue?.toString() || '0',
      lastEngagement: lastEngagement?.occurredAt,
      lastEventType: lastEngagement?.eventType,
      recentEngagements: recentEngagements.map(e => ({
        id: e.id,
        eventType: e.eventType,
        channel: e.channel,
        description: e.description,
        monetaryValue: e.monetaryValue?.toString(),
        occurredAt: e.occurredAt,
      })),
    };
  }

  /**
   * Get engagement analytics for tenant
   */
  static async getAnalytics(
    tenantId: string,
    options?: { startDate?: Date; endDate?: Date }
  ) {
    const where: Prisma.CrmEngagementEventWhereInput = { tenantId };

    if (options?.startDate || options?.endDate) {
      where.occurredAt = {};
      if (options.startDate) where.occurredAt.gte = options.startDate;
      if (options.endDate) where.occurredAt.lte = options.endDate;
    }

    // Get counts by event type
    const byEventType = await prisma.crmEngagementEvent.groupBy({
      by: ['eventType'],
      where,
      _count: { eventType: true },
    });

    // Get counts by channel
    const byChannel = await prisma.crmEngagementEvent.groupBy({
      by: ['channel'],
      where,
      _count: { channel: true },
    });

    // Get total revenue from purchases
    const revenue = await prisma.crmEngagementEvent.aggregate({
      where: { ...where, eventType: 'PURCHASE' },
      _sum: { monetaryValue: true },
      _count: true,
    });

    // Get unique customers
    const uniqueCustomers = await prisma.crmEngagementEvent.findMany({
      where,
      distinct: ['customerId'],
      select: { customerId: true },
    });

    return {
      totalEngagements: byEventType.reduce((sum, e) => sum + e._count.eventType, 0),
      byEventType: byEventType.map(e => ({
        eventType: e.eventType,
        count: e._count.eventType,
      })),
      byChannel: byChannel.map(c => ({
        channel: c.channel || 'Unknown',
        count: c._count.channel,
      })),
      revenue: {
        total: revenue._sum.monetaryValue?.toString() || '0',
        transactionCount: revenue._count,
      },
      uniqueCustomers: uniqueCustomers.length,
    };
  }
}
