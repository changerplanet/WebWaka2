/**
 * Payment Expiry Service
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Handles timeout and expiry logic for bank transfer payments.
 * Manual triggering only - no background automation.
 */

import { prisma } from '@/lib/prisma';

export class PaymentExpiryService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async checkAndExpirePayments(): Promise<{
    checked: number;
    expired: number;
    expiredIds: string[];
  }> {
    const now = new Date();

    const expirablePayments = await prisma.bank_transfer_payment.findMany({
      where: {
        tenantId: this.tenantId,
        status: {
          in: ['PENDING_PROOF', 'PROOF_SUBMITTED'],
        },
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        paymentReference: true,
      },
    });

    if (expirablePayments.length === 0) {
      return { checked: 0, expired: 0, expiredIds: [] };
    }

    const ids = expirablePayments.map((p) => p.id);

    await prisma.bank_transfer_payment.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return {
      checked: expirablePayments.length,
      expired: expirablePayments.length,
      expiredIds: ids,
    };
  }

  async getExpiringPayments(withinHours: number = 2): Promise<Array<{
    id: string;
    paymentReference: string;
    amount: number;
    expiresAt: Date;
    customerPhone?: string;
    customerEmail?: string;
  }>> {
    const futureTime = new Date(Date.now() + withinHours * 60 * 60 * 1000);

    const payments = await prisma.bank_transfer_payment.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PENDING_PROOF',
        expiresAt: {
          gt: new Date(),
          lt: futureTime,
        },
      },
      select: {
        id: true,
        paymentReference: true,
        amount: true,
        expiresAt: true,
        customerPhone: true,
        customerEmail: true,
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    return payments.map((p) => ({
      id: p.id,
      paymentReference: p.paymentReference,
      amount: Number(p.amount),
      expiresAt: p.expiresAt,
      customerPhone: p.customerPhone ?? undefined,
      customerEmail: p.customerEmail ?? undefined,
    }));
  }

  async extendExpiry(paymentId: string, additionalHours: number): Promise<{
    success: boolean;
    newExpiresAt?: Date;
    error?: string;
  }> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        id: paymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status === 'VERIFIED' || payment.status === 'EXPIRED' || payment.status === 'CANCELLED') {
      return { success: false, error: `Cannot extend expiry for payment in ${payment.status} status` };
    }

    const currentExpiry = payment.expiresAt;
    const newExpiresAt = new Date(
      Math.max(currentExpiry.getTime(), Date.now()) + additionalHours * 60 * 60 * 1000
    );

    await prisma.bank_transfer_payment.update({
      where: { id: paymentId },
      data: { expiresAt: newExpiresAt },
    });

    return { success: true, newExpiresAt };
  }

  async getExpiryStats(): Promise<{
    pendingProof: number;
    expiringSoon: number;
    expired: number;
  }> {
    const now = new Date();
    const soonThreshold = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const [pendingProof, expiringSoon, expired] = await Promise.all([
      prisma.bank_transfer_payment.count({
        where: {
          tenantId: this.tenantId,
          status: 'PENDING_PROOF',
          expiresAt: { gt: now },
        },
      }),
      prisma.bank_transfer_payment.count({
        where: {
          tenantId: this.tenantId,
          status: 'PENDING_PROOF',
          expiresAt: {
            gt: now,
            lt: soonThreshold,
          },
        },
      }),
      prisma.bank_transfer_payment.count({
        where: {
          tenantId: this.tenantId,
          status: 'EXPIRED',
        },
      }),
    ]);

    return { pendingProof, expiringSoon, expired };
  }
}

export function createPaymentExpiryService(tenantId: string): PaymentExpiryService {
  return new PaymentExpiryService(tenantId);
}
