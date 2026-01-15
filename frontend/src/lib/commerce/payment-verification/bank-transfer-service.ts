/**
 * Bank Transfer Payment Service
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Handles bank transfer payments with proof upload and manual verification.
 * Works with or without Paystack enabled.
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import {
  BankTransferStatus,
  CreateBankTransferRequest,
  BankTransferPayment,
  SubmitProofRequest,
  VerifyPaymentRequest,
  VerificationDecision,
} from './types';

const DEFAULT_EXPIRY_HOURS = 24;

export class BankTransferService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `BT-${timestamp}-${random}`;
  }

  async createPayment(request: CreateBankTransferRequest): Promise<BankTransferPayment> {
    const expiryHours = request.expiryHours || DEFAULT_EXPIRY_HOURS;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const payment = await prisma.bank_transfer_payment.create({
      data: {
        tenantId: request.tenantId,
        orderId: request.orderId,
        orderNumber: request.orderNumber,
        amount: request.amount,
        currency: request.currency || 'NGN',
        bankName: request.bankAccount.bankName,
        accountNumber: request.bankAccount.accountNumber,
        accountName: request.bankAccount.accountName,
        paymentReference: this.generatePaymentReference(),
        status: 'PENDING_PROOF',
        expiresAt,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        customerName: request.customerName,
      },
    });

    return this.mapToPayment(payment);
  }

  async getPayment(paymentId: string): Promise<BankTransferPayment | null> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        id: paymentId,
        tenantId: this.tenantId,
      },
    });

    return payment ? this.mapToPayment(payment) : null;
  }

  async getPaymentByReference(reference: string): Promise<BankTransferPayment | null> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        paymentReference: reference,
        tenantId: this.tenantId,
      },
    });

    return payment ? this.mapToPayment(payment) : null;
  }

  async listPayments(options: {
    status?: BankTransferStatus;
    orderId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ payments: BankTransferPayment[]; total: number }> {
    const where = {
      tenantId: this.tenantId,
      ...(options.status && { status: options.status }),
      ...(options.orderId && { orderId: options.orderId }),
    };

    const [payments, total] = await Promise.all([
      prisma.bank_transfer_payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      prisma.bank_transfer_payment.count({ where }),
    ]);

    return {
      payments: payments.map(this.mapToPayment),
      total,
    };
  }

  async submitProof(request: SubmitProofRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        id: request.paymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'PENDING_PROOF' && payment.status !== 'PROOF_SUBMITTED') {
      return { success: false, error: `Cannot submit proof for payment in ${payment.status} status` };
    }

    if (new Date() > payment.expiresAt) {
      await prisma.bank_transfer_payment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      });
      return { success: false, error: 'Payment has expired' };
    }

    await prisma.$transaction([
      prisma.bank_transfer_proof.create({
        data: {
          paymentId: request.paymentId,
          proofType: request.proofType,
          fileUrl: request.fileUrl,
          fileName: request.fileName,
          fileSize: request.fileSize,
          mimeType: request.mimeType,
          extractedAmount: request.extractedAmount,
          extractedReference: request.extractedReference,
          extractedDate: request.extractedDate,
          extractedBankName: request.extractedBankName,
          submittedById: request.submittedById,
          submittedByName: request.submittedByName,
        },
      }),
      prisma.bank_transfer_payment.update({
        where: { id: request.paymentId },
        data: {
          status: 'PROOF_SUBMITTED',
          proofSubmittedAt: new Date(),
        },
      }),
    ]);

    await this.addToVerificationQueue(request.paymentId, 'BANK_TRANSFER');

    return { success: true };
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        id: request.paymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'PROOF_SUBMITTED' && payment.status !== 'PENDING_VERIFICATION') {
      return { success: false, error: `Cannot verify payment in ${payment.status} status` };
    }

    const newStatus: BankTransferStatus = 
      request.decision === 'APPROVED' ? 'VERIFIED' :
      request.decision === 'REJECTED' ? 'REJECTED' :
      'PENDING_VERIFICATION';

    await prisma.$transaction([
      prisma.bank_transfer_payment.update({
        where: { id: request.paymentId },
        data: {
          status: newStatus,
          verifiedAt: request.decision === 'APPROVED' ? new Date() : undefined,
          verifiedById: request.verifiedById,
          verifiedByName: request.verifiedByName,
          verificationNote: request.note,
          rejectionReason: request.decision === 'REJECTED' ? request.note : undefined,
          customerReference: request.customerReference,
        },
      }),
      prisma.payment_verification_queue.updateMany({
        where: {
          paymentType: 'BANK_TRANSFER',
          paymentId: request.paymentId,
        },
        data: {
          decision: request.decision,
          decisionNote: request.note,
          decidedAt: new Date(),
          decidedById: request.verifiedById,
          decidedByName: request.verifiedByName,
        },
      }),
    ]);

    return { success: true };
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const payment = await prisma.bank_transfer_payment.findFirst({
      where: {
        id: paymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status === 'VERIFIED' || payment.status === 'CANCELLED') {
      return { success: false, error: `Cannot cancel payment in ${payment.status} status` };
    }

    await prisma.bank_transfer_payment.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason,
      },
    });

    return { success: true };
  }

  async getProofs(paymentId: string): Promise<Array<{
    id: string;
    proofType: string;
    fileUrl: string;
    fileName?: string;
    submittedAt: Date;
    isValid?: boolean;
    validationNote?: string;
  }>> {
    const proofs = await prisma.bank_transfer_proof.findMany({
      where: { paymentId },
      orderBy: { submittedAt: 'desc' },
    });

    return proofs.map((p) => ({
      id: p.id,
      proofType: p.proofType,
      fileUrl: p.fileUrl,
      fileName: p.fileName ?? undefined,
      submittedAt: p.submittedAt,
      isValid: p.isValid ?? undefined,
      validationNote: p.validationNote ?? undefined,
    }));
  }

  private async addToVerificationQueue(paymentId: string, paymentType: string): Promise<void> {
    const existing = await prisma.payment_verification_queue.findUnique({
      where: {
        paymentType_paymentId: {
          paymentType,
          paymentId,
        },
      },
    });

    if (!existing) {
      const dueBy = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      await prisma.payment_verification_queue.create({
        data: {
          tenantId: this.tenantId,
          paymentType,
          paymentId,
          priority: 0,
          dueBy,
        },
      });
    }
  }

  private mapToPayment(p: any): BankTransferPayment {
    return {
      id: p.id,
      tenantId: p.tenantId,
      orderId: p.orderId ?? undefined,
      orderNumber: p.orderNumber ?? undefined,
      amount: Number(p.amount),
      currency: p.currency,
      bankName: p.bankName,
      accountNumber: p.accountNumber,
      accountName: p.accountName,
      paymentReference: p.paymentReference,
      customerReference: p.customerReference ?? undefined,
      status: p.status as BankTransferStatus,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      proofSubmittedAt: p.proofSubmittedAt ?? undefined,
      verifiedAt: p.verifiedAt ?? undefined,
      customerPhone: p.customerPhone ?? undefined,
      customerEmail: p.customerEmail ?? undefined,
      customerName: p.customerName ?? undefined,
      verifiedById: p.verifiedById ?? undefined,
      verifiedByName: p.verifiedByName ?? undefined,
      verificationNote: p.verificationNote ?? undefined,
      rejectionReason: p.rejectionReason ?? undefined,
    };
  }
}

export function createBankTransferService(tenantId: string): BankTransferService {
  return new BankTransferService(tenantId);
}
