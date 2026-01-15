/**
 * Payment Verification Queue Service
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Manages the verification queue for admin/partner review of payments.
 * Manual verification workflow - no automation.
 */

import { prisma } from '@/lib/prisma';
import { VerificationDecision, VerificationQueueItem } from './types';

export class VerificationQueueService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async getPendingQueue(options: {
    paymentType?: 'BANK_TRANSFER' | 'COD';
    assignedToId?: string;
    limit?: number;
    offset?: number;
    urgentOnly?: boolean;
  } = {}): Promise<{ items: VerificationQueueItem[]; total: number }> {
    const where = {
      tenantId: this.tenantId,
      decision: null,
      ...(options.paymentType && { paymentType: options.paymentType }),
      ...(options.assignedToId && { assignedToId: options.assignedToId }),
      ...(options.urgentOnly && { isUrgent: true }),
    };

    const [items, total] = await Promise.all([
      prisma.payment_verification_queue.findMany({
        where,
        orderBy: [
          { isUrgent: 'desc' },
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.payment_verification_queue.count({ where }),
    ]);

    return {
      items: items.map(this.mapToQueueItem),
      total,
    };
  }

  async assignToVerifier(
    queueItemId: string,
    assignedToId: string,
    assignedToName: string
  ): Promise<{ success: boolean; error?: string }> {
    const item = await prisma.payment_verification_queue.findFirst({
      where: {
        id: queueItemId,
        tenantId: this.tenantId,
      },
    });

    if (!item) {
      return { success: false, error: 'Queue item not found' };
    }

    if (item.decision) {
      return { success: false, error: 'Item already decided' };
    }

    await prisma.payment_verification_queue.update({
      where: { id: queueItemId },
      data: {
        assignedToId,
        assignedToName,
        assignedAt: new Date(),
      },
    });

    return { success: true };
  }

  async markUrgent(queueItemId: string): Promise<{ success: boolean; error?: string }> {
    const item = await prisma.payment_verification_queue.findFirst({
      where: {
        id: queueItemId,
        tenantId: this.tenantId,
      },
    });

    if (!item) {
      return { success: false, error: 'Queue item not found' };
    }

    await prisma.payment_verification_queue.update({
      where: { id: queueItemId },
      data: {
        isUrgent: true,
        priority: Math.max(item.priority, 10),
      },
    });

    return { success: true };
  }

  async escalate(queueItemId: string): Promise<{ success: boolean; error?: string }> {
    const item = await prisma.payment_verification_queue.findFirst({
      where: {
        id: queueItemId,
        tenantId: this.tenantId,
      },
    });

    if (!item) {
      return { success: false, error: 'Queue item not found' };
    }

    await prisma.payment_verification_queue.update({
      where: { id: queueItemId },
      data: {
        needsEscalation: true,
        isUrgent: true,
        priority: 99,
      },
    });

    return { success: true };
  }

  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    urgent: number;
    overdue: number;
    byType: { bankTransfer: number; cod: number };
  }> {
    const now = new Date();

    const [total, pending, urgent, overdue, bankTransfer, cod] = await Promise.all([
      prisma.payment_verification_queue.count({
        where: { tenantId: this.tenantId },
      }),
      prisma.payment_verification_queue.count({
        where: { tenantId: this.tenantId, decision: null },
      }),
      prisma.payment_verification_queue.count({
        where: { tenantId: this.tenantId, decision: null, isUrgent: true },
      }),
      prisma.payment_verification_queue.count({
        where: {
          tenantId: this.tenantId,
          decision: null,
          dueBy: { lt: now },
        },
      }),
      prisma.payment_verification_queue.count({
        where: {
          tenantId: this.tenantId,
          decision: null,
          paymentType: 'BANK_TRANSFER',
        },
      }),
      prisma.payment_verification_queue.count({
        where: {
          tenantId: this.tenantId,
          decision: null,
          paymentType: 'COD',
        },
      }),
    ]);

    return {
      total,
      pending,
      urgent,
      overdue,
      byType: { bankTransfer, cod },
    };
  }

  async getMyAssignedItems(verifierId: string): Promise<VerificationQueueItem[]> {
    const items = await prisma.payment_verification_queue.findMany({
      where: {
        tenantId: this.tenantId,
        assignedToId: verifierId,
        decision: null,
      },
      orderBy: [
        { isUrgent: 'desc' },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return items.map(this.mapToQueueItem);
  }

  async getDecisionHistory(options: {
    limit?: number;
    offset?: number;
    decidedById?: string;
  } = {}): Promise<{ items: VerificationQueueItem[]; total: number }> {
    const where = {
      tenantId: this.tenantId,
      decision: { not: null },
      ...(options.decidedById && { decidedById: options.decidedById }),
    };

    const [items, total] = await Promise.all([
      prisma.payment_verification_queue.findMany({
        where,
        orderBy: { decidedAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.payment_verification_queue.count({ where }),
    ]);

    return {
      items: items.map(this.mapToQueueItem),
      total,
    };
  }

  private mapToQueueItem(item: any): VerificationQueueItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      paymentType: item.paymentType as 'BANK_TRANSFER' | 'COD',
      paymentId: item.paymentId,
      priority: item.priority,
      assignedToId: item.assignedToId ?? undefined,
      assignedToName: item.assignedToName ?? undefined,
      assignedAt: item.assignedAt ?? undefined,
      decision: item.decision as VerificationDecision | undefined,
      decisionNote: item.decisionNote ?? undefined,
      decidedAt: item.decidedAt ?? undefined,
      createdAt: item.createdAt,
      dueBy: item.dueBy ?? undefined,
      isUrgent: item.isUrgent,
      needsEscalation: item.needsEscalation,
    };
  }
}

export function createVerificationQueueService(tenantId: string): VerificationQueueService {
  return new VerificationQueueService(tenantId);
}
