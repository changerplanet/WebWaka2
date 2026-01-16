/**
 * ORDER AUDIT SERVICE - Wave D1
 * =============================
 * 
 * Provides immutable, append-only audit logging for order operations.
 * 
 * Features:
 * - Status change history (order_status_history)
 * - Payment status history (payment_status_history)
 * - Never overwrites - always appends
 * 
 * @module lib/commerce/audit/order-audit-service
 */

import { prisma } from '@/lib/prisma';

export type OrderType = 'SVM_ORDER' | 'MVM_PARENT_ORDER' | 'MVM_SUB_ORDER' | 'PARK_TICKET';
export type AuditSource = 'SYSTEM' | 'USER' | 'WEBHOOK' | 'POS' | 'ADMIN' | 'API' | 'RECOVERY';

export interface StatusChangeParams {
  tenantId: string;
  orderType: OrderType;
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy?: string;
  source?: AuditSource;
  sourceRef?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentStatusChangeParams {
  tenantId: string;
  orderType: OrderType;
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  source?: AuditSource;
  transactionId?: string;
  paymentRef?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export class OrderAuditService {
  /**
   * Log an order status change (immutable append)
   */
  static async logStatusChange(params: StatusChangeParams): Promise<string> {
    const record = await prisma.order_status_history.create({
      data: {
        tenantId: params.tenantId,
        orderType: params.orderType,
        orderId: params.orderId,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        changedBy: params.changedBy,
        source: params.source || 'SYSTEM',
        sourceRef: params.sourceRef,
        metadata: params.metadata ? params.metadata : undefined,
      },
    });

    console.log(`[OrderAudit] Status change logged: ${params.orderType} ${params.orderId} ${params.oldStatus} → ${params.newStatus}`);
    return record.id;
  }

  /**
   * Log a payment status change (immutable append)
   */
  static async logPaymentStatusChange(params: PaymentStatusChangeParams): Promise<string> {
    const record = await prisma.payment_status_history.create({
      data: {
        tenantId: params.tenantId,
        orderType: params.orderType,
        orderId: params.orderId,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        source: params.source || 'SYSTEM',
        transactionId: params.transactionId,
        paymentRef: params.paymentRef,
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata ? params.metadata : undefined,
      },
    });

    console.log(`[OrderAudit] Payment status change logged: ${params.orderType} ${params.orderId} ${params.oldStatus} → ${params.newStatus}`);
    return record.id;
  }

  /**
   * Get status history for an order
   */
  static async getStatusHistory(orderType: OrderType, orderId: string) {
    return prisma.order_status_history.findMany({
      where: { orderType, orderId },
      orderBy: { changedAt: 'asc' },
    });
  }

  /**
   * Get payment status history for an order
   */
  static async getPaymentStatusHistory(orderType: OrderType, orderId: string) {
    return prisma.payment_status_history.findMany({
      where: { orderType, orderId },
      orderBy: { changedAt: 'asc' },
    });
  }
}

export const logOrderStatusChange = OrderAuditService.logStatusChange;
export const logPaymentStatusChange = OrderAuditService.logPaymentStatusChange;
