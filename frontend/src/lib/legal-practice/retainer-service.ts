/**
 * LEGAL PRACTICE SUITE — Retainer Service
 * Phase 7B.1, S3 Core Services
 * 
 * Retainer account management (Nigeria-first: retainer billing is common).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type RetainerTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT' | 'REFUND' | 'TRANSFER';

export interface CreateRetainerInput {
  matterId: string;
  clientId: string;
  clientName: string;
  initialAmount: number;
  minimumBalance?: number;
  notes?: string;
}

export interface RecordTransactionInput {
  transactionType: RetainerTransactionType;
  amount: number;
  description: string;
  reference?: string;
  processedBy?: string;
  processedName?: string;
  timeEntryId?: string;
  disbursementId?: string;
}

// ============================================================================
// RETAINER CRUD OPERATIONS
// ============================================================================

export async function createRetainer(tenantId: string, data: CreateRetainerInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  // Check if retainer already exists for this matter
  const existingRetainer = await prisma.leg_retainer.findFirst({
    where: { matterId: data.matterId },
  });

  if (existingRetainer) {
    throw new Error('Retainer already exists for this matter');
  }

  // Create retainer with initial deposit transaction
  const retainer = await prisma.$transaction(async (tx) => {
    const newRetainer = await tx.leg_retainer.create({
      data: withPrismaDefaults({
        tenantId,
        matterId: data.matterId,
        clientId: data.clientId,
        clientName: data.clientName,
        initialAmount: data.initialAmount,
        currentBalance: data.initialAmount,
        minimumBalance: data.minimumBalance,
        notes: data.notes,
      }),
    });

    // Create initial deposit transaction
    await tx.leg_retainer_transaction.create({
      data: withPrismaDefaults({
        tenantId,
        retainerId: newRetainer.id,
        transactionType: 'DEPOSIT',
        amount: data.initialAmount,
        balanceAfter: data.initialAmount,
        description: 'Initial retainer deposit',
      }),
    });

    return newRetainer;
  });

  return getRetainerById(tenantId, retainer.id);
}

export async function getRetainerById(tenantId: string, retainerId: string) {
  const retainer = await prisma.leg_retainer.findFirst({
    where: {
      id: retainerId,
      tenantId,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, status: true },
      },
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 20,
      },
    },
  });

  return retainer;
}

export async function getRetainerByMatter(tenantId: string, matterId: string) {
  const retainer = await prisma.leg_retainer.findFirst({
    where: {
      tenantId,
      matterId,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true },
      },
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 20,
      },
    },
  });

  return retainer;
}

export async function getRetainers(tenantId: string, filters: { clientId?: string; isActive?: boolean; exhausted?: boolean; page?: number; limit?: number } = {}) {
  const { clientId, isActive, exhausted, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_retainerWhereInput = {
    tenantId,
    ...(clientId && { clientId }),
    ...(isActive !== undefined && { isActive }),
    ...(exhausted !== undefined && { exhausted }),
  };

  const [retainers, total] = await Promise.all([
    prisma.leg_retainer.findMany({
      where,
      include: {
        matter: {
          select: { id: true, matterNumber: true, title: true, status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_retainer.count({ where }),
  ]);

  return {
    retainers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================================
// RETAINER TRANSACTIONS
// ============================================================================

export async function recordTransaction(
  tenantId: string,
  retainerId: string,
  data: RecordTransactionInput
) {
  const retainer = await prisma.leg_retainer.findFirst({
    where: { id: retainerId, tenantId },
  });

  if (!retainer) {
    throw new Error('Retainer not found');
  }

  if (!retainer.isActive) {
    throw new Error('Retainer is not active');
  }

  // Calculate new balance
  let balanceChange = data.amount;
  if (data.transactionType === 'WITHDRAWAL' || data.transactionType === 'REFUND') {
    balanceChange = -Math.abs(data.amount);
  }

  const newBalance = retainer.currentBalance + balanceChange;

  if (newBalance < 0 && data.transactionType === 'WITHDRAWAL') {
    throw new Error('Insufficient retainer balance');
  }

  // Update retainer and create transaction
  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.leg_retainer_transaction.create({
      data: withPrismaDefaults({
        tenantId,
        retainerId,
        transactionType: data.transactionType as any,
        amount: data.amount,
        balanceAfter: newBalance,
        description: data.description,
        reference: data.reference,
        processedBy: data.processedBy,
        processedName: data.processedName,
        timeEntryId: data.timeEntryId,
        disbursementId: data.disbursementId,
      }),
    });

    // Update retainer balance
    await tx.leg_retainer.update({
      where: { id: retainerId },
      data: {
        currentBalance: newBalance,
        exhausted: newBalance <= 0,
        exhaustedAt: newBalance <= 0 ? new Date() : null,
      },
    });

    return transaction;
  });

  return {
    transaction: result,
    retainer: await getRetainerById(tenantId, retainerId),
  };
}

export async function depositToRetainer(
  tenantId: string,
  retainerId: string,
  amount: number,
  description: string,
  reference?: string,
  processedBy?: string,
  processedName?: string
) {
  return recordTransaction(tenantId, retainerId, {
    transactionType: 'DEPOSIT',
    amount,
    description,
    reference,
    processedBy,
    processedName,
  });
}

export async function withdrawFromRetainer(
  tenantId: string,
  retainerId: string,
  amount: number,
  description: string,
  timeEntryId?: string,
  disbursementId?: string,
  processedBy?: string,
  processedName?: string
) {
  return recordTransaction(tenantId, retainerId, {
    transactionType: 'WITHDRAWAL',
    amount,
    description,
    timeEntryId,
    disbursementId,
    processedBy,
    processedName,
  });
}

// ============================================================================
// RETAINER STATISTICS
// ============================================================================

export async function getRetainerStats(tenantId: string) {
  const [
    totalRetainers,
    activeRetainers,
    exhaustedRetainers,
  ] = await Promise.all([
    prisma.leg_retainer.count({ where: { tenantId } }),
    prisma.leg_retainer.count({ where: { tenantId, isActive: true } }),
    prisma.leg_retainer.count({ where: { tenantId, exhausted: true } }),
  ]);

  const balanceStats = await prisma.leg_retainer.aggregate({
    where: { tenantId, isActive: true },
    _sum: { currentBalance: true, initialAmount: true },
  });

  // Low balance retainers (below minimum or below 20% of initial)
  const lowBalanceRetainers = await prisma.leg_retainer.count({
    where: {
      tenantId,
      isActive: true,
      exhausted: false,
      OR: [
        { currentBalance: { lte: prisma.leg_retainer.fields.minimumBalance } },
      ],
    },
  });

  return {
    totalRetainers,
    activeRetainers,
    exhaustedRetainers,
    lowBalanceRetainers,
    totalBalance: balanceStats._sum.currentBalance || 0,
    totalDeposited: balanceStats._sum.initialAmount || 0,
  };
}

export async function getLowBalanceRetainers(tenantId: string) {
  const retainers = await prisma.leg_retainer.findMany({
    where: {
      tenantId,
      isActive: true,
      exhausted: false,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
    orderBy: { currentBalance: 'asc' },
  });

  // Filter to those below minimum or below 20% of initial
  return retainers.filter((r: any) => {
    if (r.minimumBalance && r.currentBalance <= r.minimumBalance) return true;
    if (r.currentBalance < r.initialAmount * 0.2) return true;
    return false;
  });
}
