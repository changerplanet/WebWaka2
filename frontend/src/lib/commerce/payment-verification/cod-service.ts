/**
 * COD (Cash on Delivery) Payment Service
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Handles COD payment lifecycle from order creation to cash reconciliation.
 * Manual verification workflow with no automation.
 */

import { prisma } from '@/lib/prisma';
import {
  CodStatus,
  CreateCodRequest,
  CodPayment,
  AssignDeliveryAgentRequest,
  CollectCodRequest,
  ReconcileCodRequest,
  MarkCodFailedRequest,
} from './types';

export class CodService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async createCodPayment(request: CreateCodRequest): Promise<CodPayment> {
    const payment = await prisma.cod_payment.create({
      data: {
        tenantId: request.tenantId,
        orderId: request.orderId,
        orderNumber: request.orderNumber,
        expectedAmount: request.expectedAmount,
        currency: request.currency || 'NGN',
        status: 'PENDING_DELIVERY',
        customerPhone: request.customerPhone,
        customerName: request.customerName,
        deliveryAddress: request.deliveryAddress,
      },
    });

    return this.mapToPayment(payment);
  }

  async getPayment(paymentId: string): Promise<CodPayment | null> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: paymentId,
        tenantId: this.tenantId,
      },
    });

    return payment ? this.mapToPayment(payment) : null;
  }

  async getPaymentByOrderId(orderId: string): Promise<CodPayment | null> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        orderId,
        tenantId: this.tenantId,
      },
    });

    return payment ? this.mapToPayment(payment) : null;
  }

  async listPayments(options: {
    status?: CodStatus;
    deliveryAgentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ payments: CodPayment[]; total: number }> {
    const where = {
      tenantId: this.tenantId,
      ...(options.status && { status: options.status }),
      ...(options.deliveryAgentId && { deliveryAgentId: options.deliveryAgentId }),
    };

    const [payments, total] = await Promise.all([
      prisma.cod_payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.cod_payment.count({ where }),
    ]);

    return {
      payments: payments.map(this.mapToPayment),
      total,
    };
  }

  async assignDeliveryAgent(request: AssignDeliveryAgentRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: request.codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    if (payment.status !== 'PENDING_DELIVERY') {
      return { success: false, error: `Cannot assign agent for payment in ${payment.status} status` };
    }

    await prisma.cod_payment.update({
      where: { id: request.codPaymentId },
      data: {
        deliveryAgentId: request.agentId,
        deliveryAgentName: request.agentName,
        assignedAt: new Date(),
        status: 'OUT_FOR_DELIVERY',
      },
    });

    return { success: true };
  }

  async markAsDelivered(codPaymentId: string): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    if (payment.status !== 'OUT_FOR_DELIVERY') {
      return { success: false, error: `Cannot mark delivered for payment in ${payment.status} status` };
    }

    await prisma.cod_payment.update({
      where: { id: codPaymentId },
      data: {
        deliveredAt: new Date(),
        status: 'DELIVERED_PENDING',
      },
    });

    return { success: true };
  }

  async collectPayment(request: CollectCodRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: request.codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    const allowedStatuses: CodStatus[] = ['OUT_FOR_DELIVERY', 'DELIVERED_PENDING'];
    if (!allowedStatuses.includes(payment.status as CodStatus)) {
      return { success: false, error: `Cannot collect payment in ${payment.status} status` };
    }

    const expectedAmount = Number(payment.expectedAmount);
    const isPartial = request.collectedAmount < expectedAmount;
    const newStatus: CodStatus = isPartial ? 'PARTIAL_COLLECTED' : 'COLLECTED';

    await prisma.cod_payment.update({
      where: { id: request.codPaymentId },
      data: {
        collectedAmount: request.collectedAmount,
        collectionMethod: request.collectionMethod,
        collectedAt: new Date(),
        collectedById: request.collectedById,
        collectedByName: request.collectedByName,
        deliveredAt: payment.deliveredAt || new Date(),
        status: newStatus,
        notes: request.notes,
      },
    });

    return { success: true };
  }

  async markAsFailed(request: MarkCodFailedRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: request.codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    const finalStatuses: CodStatus[] = ['COLLECTED', 'RECONCILED', 'FAILED', 'RETURNED'];
    if (finalStatuses.includes(payment.status as CodStatus)) {
      return { success: false, error: `Cannot mark failed for payment in ${payment.status} status` };
    }

    await prisma.cod_payment.update({
      where: { id: request.codPaymentId },
      data: {
        status: 'FAILED',
        failureReason: request.reason,
      },
    });

    return { success: true };
  }

  async markAsReturned(codPaymentId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    const nonReturnableStatuses: CodStatus[] = ['COLLECTED', 'RECONCILED', 'RETURNED'];
    if (nonReturnableStatuses.includes(payment.status as CodStatus)) {
      return { success: false, error: `Cannot mark returned for payment in ${payment.status} status` };
    }

    await prisma.cod_payment.update({
      where: { id: codPaymentId },
      data: {
        status: 'RETURNED',
        returnReason: reason,
        returnedAt: new Date(),
      },
    });

    return { success: true };
  }

  async reconcilePayment(request: ReconcileCodRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.cod_payment.findFirst({
      where: {
        id: request.codPaymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'COD payment not found' };
    }

    const reconcilableStatuses: CodStatus[] = ['COLLECTED', 'PARTIAL_COLLECTED'];
    if (!reconcilableStatuses.includes(payment.status as CodStatus)) {
      return { success: false, error: `Cannot reconcile payment in ${payment.status} status` };
    }

    await prisma.cod_payment.update({
      where: { id: request.codPaymentId },
      data: {
        status: 'RECONCILED',
        reconciledAt: new Date(),
        reconciledById: request.reconciledById,
        reconciledByName: request.reconciledByName,
        reconciliationRef: request.reconciliationRef,
      },
    });

    return { success: true };
  }

  async getAgentPendingCollections(agentId: string): Promise<CodPayment[]> {
    const payments = await prisma.cod_payment.findMany({
      where: {
        tenantId: this.tenantId,
        deliveryAgentId: agentId,
        status: {
          in: ['OUT_FOR_DELIVERY', 'DELIVERED_PENDING'],
        },
      },
      orderBy: { assignedAt: 'asc' },
    });

    return payments.map(this.mapToPayment);
  }

  async getPendingReconciliation(): Promise<CodPayment[]> {
    const payments = await prisma.cod_payment.findMany({
      where: {
        tenantId: this.tenantId,
        status: {
          in: ['COLLECTED', 'PARTIAL_COLLECTED'],
        },
      },
      orderBy: { collectedAt: 'asc' },
    });

    return payments.map(this.mapToPayment);
  }

  private mapToPayment(p: any): CodPayment {
    return {
      id: p.id,
      tenantId: p.tenantId,
      orderId: p.orderId,
      orderNumber: p.orderNumber ?? undefined,
      expectedAmount: Number(p.expectedAmount),
      collectedAmount: p.collectedAmount ? Number(p.collectedAmount) : undefined,
      currency: p.currency,
      status: p.status as CodStatus,
      createdAt: p.createdAt,
      deliveryAgentId: p.deliveryAgentId ?? undefined,
      deliveryAgentName: p.deliveryAgentName ?? undefined,
      assignedAt: p.assignedAt ?? undefined,
      deliveredAt: p.deliveredAt ?? undefined,
      collectedAt: p.collectedAt ?? undefined,
      collectedById: p.collectedById ?? undefined,
      collectedByName: p.collectedByName ?? undefined,
      collectionMethod: p.collectionMethod ?? undefined,
      reconciledAt: p.reconciledAt ?? undefined,
      customerPhone: p.customerPhone ?? undefined,
      customerName: p.customerName ?? undefined,
      deliveryAddress: p.deliveryAddress ?? undefined,
      failureReason: p.failureReason ?? undefined,
      returnReason: p.returnReason ?? undefined,
      notes: p.notes ?? undefined,
    };
  }
}

export function createCodService(tenantId: string): CodService {
  return new CodService(tenantId);
}
