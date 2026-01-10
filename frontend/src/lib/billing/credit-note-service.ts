/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Credit Note Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Handles credit note lifecycle:
 * - Create credit notes
 * - Approval workflow
 * - Application to invoices
 * - Credit note history
 * 
 * @module lib/billing/credit-note-service
 */

import { prisma } from '@/lib/prisma'
import { BillCreditStatus, BillCreditReason } from '@prisma/client'
import { randomUUID } from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface CreditNote {
  id: string
  tenantId: string
  creditNoteNumber: string
  invoiceId: string | null
  invoiceNumber: string | null
  customerId: string | null
  customerName: string
  amount: number
  currency: string
  reason: BillCreditReason
  description: string | null
  status: BillCreditStatus
  appliedAt: Date | null
  appliedToInvoice: string | null
  createdBy: string | null
  approvedBy: string | null
  approvedAt: Date | null
  createdAt: Date
}

export interface CreateCreditNoteInput {
  invoiceId?: string
  invoiceNumber?: string
  customerId?: string
  customerName: string
  amount: number
  currency?: string
  reason: BillCreditReason
  description?: string
}

// ============================================================================
// CREDIT NOTE SERVICE
// ============================================================================

export class CreditNoteService {
  /**
   * Generate credit note number
   * Format: CN-{YYMM}-{XXXXX}
   */
  static async generateCreditNoteNumber(tenantId: string): Promise<string> {
    const count = await prisma.bill_credit_notes.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `CN-${year}${month}-${(count + 1).toString().padStart(5, '0')}`
  }

  /**
   * Create a credit note
   */
  static async createCreditNote(
    tenantId: string,
    input: CreateCreditNoteInput,
    createdBy?: string
  ): Promise<CreditNote> {
    const creditNoteNumber = await this.generateCreditNoteNumber(tenantId)

    // Validate invoice if provided
    if (input.invoiceId) {
      const invoice = await prisma.bill_invoices.findFirst({
        where: { id: input.invoiceId, tenantId }
      })
      
      if (!invoice) {
        throw new Error('Referenced invoice not found')
      }
      
      // Credit amount shouldn't exceed invoice grand total
      if (input.amount > invoice.grandTotal.toNumber()) {
        throw new Error('Credit amount exceeds invoice total')
      }
    }

    const creditNote = await prisma.bill_credit_notes.create({
      data: {
        id: randomUUID(),
        tenantId,
        creditNoteNumber,
        invoiceId: input.invoiceId,
        invoiceNumber: input.invoiceNumber,
        customerId: input.customerId,
        customerName: input.customerName,
        amount: input.amount,
        currency: input.currency || 'NGN',
        reason: input.reason,
        description: input.description,
        status: 'DRAFT',
        createdBy,
        updatedAt: new Date()
      }
    })

    return this.formatCreditNote(creditNote)
  }

  /**
   * Get credit note by ID
   */
  static async getCreditNote(
    tenantId: string,
    creditNoteId: string
  ): Promise<CreditNote | null> {
    const creditNote = await prisma.bill_credit_notes.findFirst({
      where: { id: creditNoteId, tenantId }
    })

    return creditNote ? this.formatCreditNote(creditNote) : null
  }

  /**
   * Get credit note by number
   */
  static async getCreditNoteByNumber(
    tenantId: string,
    creditNoteNumber: string
  ): Promise<CreditNote | null> {
    const creditNote = await prisma.bill_credit_notes.findUnique({
      where: { tenantId_creditNoteNumber: { tenantId, creditNoteNumber } }
    })

    return creditNote ? this.formatCreditNote(creditNote) : null
  }

  /**
   * Approve a credit note
   */
  static async approveCreditNote(
    tenantId: string,
    creditNoteId: string,
    approvedBy: string
  ): Promise<CreditNote> {
    const creditNote = await prisma.bill_credit_notes.findFirst({
      where: { id: creditNoteId, tenantId, status: 'DRAFT' }
    })

    if (!creditNote) {
      throw new Error('Credit note not found or cannot be approved')
    }

    const updated = await prisma.bill_credit_notes.update({
      where: { id: creditNoteId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      }
    })

    return this.formatCreditNote(updated)
  }

  /**
   * Apply credit note to an invoice
   */
  static async applyCreditNote(
    tenantId: string,
    creditNoteId: string,
    targetInvoiceId: string,
    appliedBy: string
  ): Promise<{
    creditNote: CreditNote
    invoice: {
      id: string
      invoiceNumber: string
      amountPaid: number
      amountDue: number
      status: string
    }
  }> {
    const creditNote = await prisma.bill_credit_notes.findFirst({
      where: { id: creditNoteId, tenantId, status: 'APPROVED' }
    })

    if (!creditNote) {
      throw new Error('Credit note not found or not approved')
    }

    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: targetInvoiceId, tenantId }
    })

    if (!invoice) {
      throw new Error('Target invoice not found')
    }

    if (['PAID', 'CANCELLED', 'VOID'].includes(invoice.status)) {
      throw new Error(`Cannot apply credit to ${invoice.status} invoice`)
    }

    // Calculate new amounts
    const creditAmount = creditNote.amount.toNumber()
    const currentAmountPaid = invoice.amountPaid.toNumber()
    const currentAmountDue = invoice.amountDue.toNumber()

    const newAmountPaid = currentAmountPaid + Math.min(creditAmount, currentAmountDue)
    const newAmountDue = Math.max(0, currentAmountDue - creditAmount)

    // Determine new status
    let newStatus = invoice.status
    if (newAmountDue <= 0) {
      newStatus = 'PAID'
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    // Update both in transaction
    const [updatedCreditNote, updatedInvoice] = await prisma.$transaction([
      prisma.bill_credit_notes.update({
        where: { id: creditNoteId },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedToInvoice: targetInvoiceId
        }
      }),
      prisma.bill_invoices.update({
        where: { id: targetInvoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null
        }
      }),
      // Also create a payment record for audit trail
      prisma.bill_invoice_payments.create({
        data: {
          id: randomUUID(),
          invoiceId: targetInvoiceId,
          amount: Math.min(creditAmount, currentAmountDue),
          paymentMethod: 'CREDIT_NOTE',
          paymentReference: creditNote.creditNoteNumber,
          status: 'CONFIRMED',
          paidAt: new Date(),
          confirmedAt: new Date(),
          confirmedBy: appliedBy,
          notes: `Credit note ${creditNote.creditNoteNumber} applied`
        }
      })
    ])

    return {
      creditNote: this.formatCreditNote(updatedCreditNote),
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        amountPaid: updatedInvoice.amountPaid.toNumber(),
        amountDue: updatedInvoice.amountDue.toNumber(),
        status: updatedInvoice.status
      }
    }
  }

  /**
   * Cancel a credit note
   */
  static async cancelCreditNote(
    tenantId: string,
    creditNoteId: string,
    cancelledBy: string
  ): Promise<CreditNote> {
    const creditNote = await prisma.bill_credit_notes.findFirst({
      where: { 
        id: creditNoteId, 
        tenantId,
        status: { in: ['DRAFT', 'APPROVED'] }
      }
    })

    if (!creditNote) {
      throw new Error('Credit note not found or cannot be cancelled')
    }

    const updated = await prisma.bill_credit_notes.update({
      where: { id: creditNoteId },
      data: {
        status: 'CANCELLED',
        description: creditNote.description 
          ? `${creditNote.description}\n[CANCELLED by ${cancelledBy}]`
          : `[CANCELLED by ${cancelledBy}]`
      }
    })

    return this.formatCreditNote(updated)
  }

  /**
   * List credit notes
   */
  static async listCreditNotes(
    tenantId: string,
    options?: {
      customerId?: string
      invoiceId?: string
      status?: BillCreditStatus[]
      page?: number
      limit?: number
    }
  ): Promise<{ creditNotes: CreditNote[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.customerId && { customerId: options.customerId }),
      ...(options?.invoiceId && { invoiceId: options.invoiceId }),
      ...(options?.status && { status: { in: options.status } })
    }

    const [creditNotes, total] = await Promise.all([
      prisma.bill_credit_notes.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bill_credit_notes.count({ where })
    ])

    return {
      creditNotes: creditNotes.map((cn: any) => this.formatCreditNote(cn)),
      total
    }
  }

  /**
   * Get credit note statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, totals] = await Promise.all([
      prisma.bill_credit_notes.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.bill_credit_notes.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: { id: true }
      })
    ])

    return {
      byStatus: byStatus.reduce((acc: any, s: any) => ({
        ...acc,
        [s.status]: {
          count: s._count.id,
          amount: s._sum.amount?.toNumber() || 0
        }
      }), {}),
      totals: {
        count: totals._count.id,
        totalAmount: totals._sum.amount?.toNumber() || 0
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatCreditNote(creditNote: any): CreditNote {
    return {
      id: creditNote.id,
      tenantId: creditNote.tenantId,
      creditNoteNumber: creditNote.creditNoteNumber,
      invoiceId: creditNote.invoiceId,
      invoiceNumber: creditNote.invoiceNumber,
      customerId: creditNote.customerId,
      customerName: creditNote.customerName,
      amount: creditNote.amount?.toNumber?.() ?? creditNote.amount,
      currency: creditNote.currency,
      reason: creditNote.reason,
      description: creditNote.description,
      status: creditNote.status,
      appliedAt: creditNote.appliedAt,
      appliedToInvoice: creditNote.appliedToInvoice,
      createdBy: creditNote.createdBy,
      approvedBy: creditNote.approvedBy,
      approvedAt: creditNote.approvedAt,
      createdAt: creditNote.createdAt
    }
  }
}
