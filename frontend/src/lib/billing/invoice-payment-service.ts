/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Invoice Payment Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Tracks payments against invoices:
 * - Record payments (full & partial)
 * - Link to Payments suite transactions
 * - Update invoice status
 * - Payment history
 * 
 * CRITICAL: This is RECORD-KEEPING only.
 * Actual payment execution flows through Payments & Collections Suite.
 * 
 * @module lib/billing/invoice-payment-service
 */

import { prisma } from '@/lib/prisma'
import { BillInvoiceStatus, BillPaymentStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface InvoicePayment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  paymentReference: string | null
  transactionId: string | null
  status: BillPaymentStatus
  paidAt: Date | null
  confirmedAt: Date | null
  confirmedBy: string | null
  notes: string | null
  createdAt: Date
}

export interface RecordPaymentInput {
  invoiceId: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  transactionId?: string
  notes?: string
  paidAt?: Date
}

// ============================================================================
// INVOICE PAYMENT SERVICE
// ============================================================================

export class InvoicePaymentService {
  /**
   * Record a payment against an invoice
   */
  static async recordPayment(
    tenantId: string,
    input: RecordPaymentInput,
    recordedBy?: string
  ): Promise<{
    payment: InvoicePayment
    invoice: {
      id: string
      invoiceNumber: string
      status: BillInvoiceStatus
      amountPaid: number
      amountDue: number
    }
  }> {
    // Get invoice
    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: input.invoiceId, tenantId }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    if (['PAID', 'CANCELLED', 'VOID'].includes(invoice.status)) {
      throw new Error(`Cannot record payment for ${invoice.status} invoice`)
    }

    // Validate payment amount
    const amountDue = invoice.amountDue.toNumber()
    if (input.amount > amountDue) {
      throw new Error(`Payment amount (${input.amount}) exceeds amount due (${amountDue})`)
    }

    // Calculate new amounts
    const newAmountPaid = invoice.amountPaid.toNumber() + input.amount
    const newAmountDue = amountDue - input.amount

    // Determine new status
    let newStatus: BillInvoiceStatus = invoice.status
    if (newAmountDue <= 0) {
      newStatus = 'PAID'
    } else if (newAmountPaid > 0 && newAmountDue > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    // Create payment record and update invoice in transaction
    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.bill_invoice_payments.create({
        data: {
          id: randomUUID(),
          invoiceId: input.invoiceId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          transactionId: input.transactionId,
          status: 'CONFIRMED',
          paidAt: input.paidAt || new Date(),
          confirmedAt: new Date(),
          confirmedBy: recordedBy,
          notes: input.notes
        }
      }),
      prisma.bill_invoices.update({
        where: { id: input.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null
        }
      })
    ])

    return {
      payment: this.formatPayment(payment),
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        amountPaid: updatedInvoice.amountPaid.toNumber(),
        amountDue: updatedInvoice.amountDue.toNumber()
      }
    }
  }

  /**
   * Get payments for an invoice
   */
  static async getInvoicePayments(
    tenantId: string,
    invoiceId: string
  ): Promise<InvoicePayment[]> {
    // Verify invoice belongs to tenant
    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: invoiceId, tenantId }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const payments = await prisma.bill_invoice_payments.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' }
    })

    return payments.map((p: any) => this.formatPayment(p))
  }

  /**
   * Get payment by ID
   */
  static async getPayment(
    tenantId: string,
    paymentId: string
  ): Promise<InvoicePayment | null> {
    const payment = await prisma.bill_invoice_payments.findFirst({
      where: { id: paymentId },
      include: { invoice: true }
    })

    if (!payment || payment.invoice.tenantId !== tenantId) {
      return null
    }

    return this.formatPayment(payment)
  }

  /**
   * Reverse/refund a payment
   */
  static async reversePayment(
    tenantId: string,
    paymentId: string,
    reason: string,
    reversedBy: string
  ): Promise<{
    payment: InvoicePayment
    invoice: {
      id: string
      invoiceNumber: string
      status: BillInvoiceStatus
      amountPaid: number
      amountDue: number
    }
  }> {
    // Get payment with invoice
    const payment = await prisma.bill_invoice_payments.findFirst({
      where: { id: paymentId },
      include: { invoice: true }
    })

    if (!payment || payment.invoice.tenantId !== tenantId) {
      throw new Error('Payment not found')
    }

    if (payment.status === 'REFUNDED') {
      throw new Error('Payment already refunded')
    }

    const invoice = payment.invoice

    // Calculate new amounts
    const paymentAmount = payment.amount.toNumber()
    const newAmountPaid = Math.max(0, invoice.amountPaid.toNumber() - paymentAmount)
    const newAmountDue = invoice.grandTotal.toNumber() - newAmountPaid

    // Determine new status
    let newStatus: BillInvoiceStatus = invoice.status
    if (newAmountPaid === 0) {
      newStatus = invoice.sentAt ? 'SENT' : 'DRAFT'
    } else if (newAmountDue > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    // Update payment and invoice
    const [updatedPayment, updatedInvoice] = await prisma.$transaction([
      prisma.bill_invoice_payments.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          notes: payment.notes 
            ? `${payment.notes}\n[REFUNDED by ${reversedBy}: ${reason}]`
            : `[REFUNDED by ${reversedBy}: ${reason}]`
        }
      }),
      prisma.bill_invoices.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidDate: null
        }
      })
    ])

    return {
      payment: this.formatPayment(updatedPayment),
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        amountPaid: updatedInvoice.amountPaid.toNumber(),
        amountDue: updatedInvoice.amountDue.toNumber()
      }
    }
  }

  /**
   * Link invoice payment to Payments suite transaction
   */
  static async linkToTransaction(
    tenantId: string,
    paymentId: string,
    transactionId: string
  ): Promise<InvoicePayment> {
    const payment = await prisma.bill_invoice_payments.findFirst({
      where: { id: paymentId },
      include: { invoice: true }
    })

    if (!payment || payment.invoice.tenantId !== tenantId) {
      throw new Error('Payment not found')
    }

    const updated = await prisma.bill_invoice_payments.update({
      where: { id: paymentId },
      data: { transactionId }
    })

    return this.formatPayment(updated)
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatPayment(payment: any): InvoicePayment {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount?.toNumber?.() ?? payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      transactionId: payment.transactionId,
      status: payment.status,
      paidAt: payment.paidAt,
      confirmedAt: payment.confirmedAt,
      confirmedBy: payment.confirmedBy,
      notes: payment.notes,
      createdAt: payment.createdAt
    }
  }
}
