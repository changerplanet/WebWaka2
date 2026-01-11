/**
 * MODULE 9: B2B & WHOLESALE
 * Invoice & Credit Service
 * 
 * PHASE 5: Credit Terms & Invoicing (RECORD-ONLY)
 * 
 * CRITICAL: No payment execution. No wallet mutation.
 * Invoices are records only. Accounting remains authoritative.
 */

import { prisma } from '@/lib/prisma'
import { B2BInvoiceStatus, B2BCreditTransactionType, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface B2BInvoice {
  id: string
  tenantId: string
  invoiceNumber: string
  profileId: string
  orderId: string | null
  orderNumber: string | null
  subtotal: number
  discountTotal: number
  taxTotal: number
  totalAmount: number
  amountPaid: number
  amountDue: number
  invoiceDate: Date
  dueDate: Date
  paidDate: Date | null
  status: B2BInvoiceStatus
  paymentTerms: string | null
  notes: string | null
  createdAt: Date
}

export interface CreditLedgerEntry {
  id: string
  tenantId: string
  profileId: string
  transactionType: B2BCreditTransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  referenceType: string | null
  referenceId: string | null
  invoiceId: string | null
  description: string | null
  dueDate: Date | null
  createdAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class B2BInvoiceService {
  /**
   * Generate invoice number
   */
  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await prisma.b2b_invoices.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `INV-${year}${month}-${(count + 1).toString().padStart(5, '0')}`
  }

  /**
   * Create invoice from order (RECORD ONLY - no payment)
   */
  static async createInvoice(
    tenantId: string,
    input: {
      profileId: string
      orderId?: string
      orderNumber?: string
      subtotal: number
      discountTotal?: number
      taxTotal?: number
      paymentTerms?: string
      notes?: string
      lineItems?: Array<{
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        lineTotal: number
      }>
    },
    createdBy?: string
  ): Promise<B2BInvoice> {
    // Get profile and credit terms
    const profile = await prisma.b2b_customer_profiles.findUnique({
      where: { id: input.profileId },
      include: { b2b_credit_terms: true },
    })

    if (!profile) throw new Error('B2B profile not found')

    const creditDays = profile.b2b_credit_terms?.creditDays || 30
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + creditDays)

    const totalAmount = input.subtotal - (input.discountTotal || 0) + (input.taxTotal || 0)
    const invoiceNumber = await this.generateInvoiceNumber(tenantId)

    const invoice = await prisma.b2b_invoices.create({
      data: withPrismaDefaults({
        tenantId,
        invoiceNumber,
        profileId: input.profileId,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        subtotal: input.subtotal,
        discountTotal: input.discountTotal || 0,
        taxTotal: input.taxTotal || 0,
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        dueDate,
        paymentTerms: input.paymentTerms || `Net ${creditDays}`,
        notes: input.notes,
        lineItems: input.lineItems,
        createdBy,
        status: 'DRAFT',
      }),
    })

    return this.formatInvoice(invoice)
  }

  /**
   * Send invoice (update status)
   */
  static async sendInvoice(
    tenantId: string,
    invoiceId: string
  ): Promise<B2BInvoice> {
    const invoice = await prisma.b2b_invoices.update({
      where: { id: invoiceId, tenantId },
      data: { status: 'SENT' },
    })

    // Create credit ledger entry
    await this.createCreditEntry(
      tenantId,
      invoice.profileId,
      'PURCHASE',
      invoice.totalAmount.toNumber(),
      invoiceId,
      `Invoice ${invoice.invoiceNumber}`,
      invoice.dueDate
    )

    return this.formatInvoice(invoice)
  }

  /**
   * Record payment against invoice (RECORD ONLY)
   */
  static async recordPayment(
    tenantId: string,
    invoiceId: string,
    amount: number,
    paymentReference?: string
  ): Promise<B2BInvoice> {
    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: invoiceId, tenantId },
    })

    if (!invoice) throw new Error('Invoice not found')

    const newAmountPaid = invoice.amountPaid.toNumber() + amount
    const newAmountDue = invoice.totalAmount.toNumber() - newAmountPaid
    
    let newStatus = invoice.status
    if (newAmountDue <= 0) {
      newStatus = 'PAID'
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL'
    }

    const updated = await prisma.b2b_invoices.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : null,
      },
    })

    // Create credit ledger entry for payment
    await this.createCreditEntry(
      tenantId,
      invoice.profileId,
      'PAYMENT',
      -amount, // Negative = credit reduction
      invoiceId,
      `Payment for ${invoice.invoiceNumber}${paymentReference ? ` (Ref: ${paymentReference})` : ''}`
    )

    return this.formatInvoice(updated)
  }

  /**
   * List invoices
   */
  static async listInvoices(
    tenantId: string,
    options?: {
      profileId?: string
      status?: B2BInvoiceStatus[]
      overdue?: boolean
      page?: number
      limit?: number
    }
  ): Promise<{ invoices: B2BInvoice[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.b2b_invoicesWhereInput = {
      tenantId,
      ...(options?.profileId && { profileId: options.profileId }),
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.overdue && {
        dueDate: { lt: new Date() },
        status: { notIn: [B2BInvoiceStatus.PAID, B2BInvoiceStatus.CANCELLED] },
      }),
    }

    const [invoices, total] = await Promise.all([
      prisma.b2b_invoices.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.b2b_invoices.count({ where }),
    ])

    return {
      invoices: invoices.map(i => this.formatInvoice(i)),
      total,
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(tenantId: string, invoiceId: string): Promise<B2BInvoice | null> {
    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: invoiceId, tenantId },
    })

    return invoice ? this.formatInvoice(invoice) : null
  }

  /**
   * Create credit ledger entry
   */
  static async createCreditEntry(
    tenantId: string,
    profileId: string,
    transactionType: B2BCreditTransactionType,
    amount: number,
    invoiceId?: string,
    description?: string,
    dueDate?: Date
  ): Promise<CreditLedgerEntry> {
    // Get current credit balance
    const profile = await prisma.b2b_customer_profiles.findUnique({
      where: { id: profileId },
      select: { creditUsed: true },
    })

    if (!profile) throw new Error('Profile not found')

    const balanceBefore = profile.creditUsed.toNumber()
    const balanceAfter = balanceBefore + amount

    // Create ledger entry
    const entry = await prisma.b2b_credit_ledger.create({
      data: withPrismaDefaults({
        tenantId,
        profileId,
        transactionType,
        amount: Math.abs(amount),
        balanceBefore,
        balanceAfter,
        invoiceId,
        description,
        dueDate,
      }),
    })

    // Update profile's credit used
    await prisma.b2b_customer_profiles.update({
      where: { id: profileId },
      data: { creditUsed: balanceAfter },
    })

    return {
      id: entry.id,
      tenantId: entry.tenantId,
      profileId: entry.profileId,
      transactionType: entry.transactionType,
      amount: entry.amount.toNumber(),
      balanceBefore: entry.balanceBefore.toNumber(),
      balanceAfter: entry.balanceAfter.toNumber(),
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      invoiceId: entry.invoiceId,
      description: entry.description,
      dueDate: entry.dueDate,
      createdAt: entry.createdAt,
    }
  }

  /**
   * Get credit ledger for profile
   */
  static async getCreditLedger(
    tenantId: string,
    profileId: string,
    limit: number = 50
  ): Promise<CreditLedgerEntry[]> {
    const entries = await prisma.b2b_credit_ledger.findMany({
      where: { tenantId, profileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return entries.map(e => ({
      id: e.id,
      tenantId: e.tenantId,
      profileId: e.profileId,
      transactionType: e.transactionType,
      amount: e.amount.toNumber(),
      balanceBefore: e.balanceBefore.toNumber(),
      balanceAfter: e.balanceAfter.toNumber(),
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      invoiceId: e.invoiceId,
      description: e.description,
      dueDate: e.dueDate,
      createdAt: e.createdAt,
    }))
  }

  /**
   * Check and update overdue invoices
   */
  static async updateOverdueInvoices(tenantId: string): Promise<number> {
    const result = await prisma.b2b_invoices.updateMany({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
      },
      data: { status: 'OVERDUE' },
    })

    return result.count
  }

  /**
   * Get invoice statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, totals, overdue] = await Promise.all([
      prisma.b2b_invoices.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { totalAmount: true, amountDue: true },
      }),
      prisma.b2b_invoices.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true, amountPaid: true, amountDue: true },
        _count: { id: true },
      }),
      prisma.b2b_invoices.aggregate({
        where: {
          tenantId,
          dueDate: { lt: new Date() },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        _sum: { amountDue: true },
        _count: { id: true },
      }),
    ])

    return {
      byStatus: byStatus.reduce((acc, s) => ({
        ...acc,
        [s.status]: {
          count: s._count.id,
          totalAmount: s._sum.totalAmount?.toNumber() || 0,
          amountDue: s._sum.amountDue?.toNumber() || 0,
        },
      }), {}),
      totals: {
        invoiceCount: totals._count.id,
        totalAmount: totals._sum.totalAmount?.toNumber() || 0,
        totalPaid: totals._sum.amountPaid?.toNumber() || 0,
        totalDue: totals._sum.amountDue?.toNumber() || 0,
      },
      overdue: {
        count: overdue._count.id,
        amount: overdue._sum.amountDue?.toNumber() || 0,
      },
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatInvoice(invoice: {
    id: string
    tenantId: string
    invoiceNumber: string
    profileId: string
    orderId: string | null
    orderNumber: string | null
    subtotal: { toNumber: () => number }
    discountTotal: { toNumber: () => number }
    taxTotal: { toNumber: () => number }
    totalAmount: { toNumber: () => number }
    amountPaid: { toNumber: () => number }
    amountDue: { toNumber: () => number }
    invoiceDate: Date
    dueDate: Date
    paidDate: Date | null
    status: B2BInvoiceStatus
    paymentTerms: string | null
    notes: string | null
    createdAt: Date
  }): B2BInvoice {
    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      profileId: invoice.profileId,
      orderId: invoice.orderId,
      orderNumber: invoice.orderNumber,
      subtotal: invoice.subtotal.toNumber(),
      discountTotal: invoice.discountTotal.toNumber(),
      taxTotal: invoice.taxTotal.toNumber(),
      totalAmount: invoice.totalAmount.toNumber(),
      amountPaid: invoice.amountPaid.toNumber(),
      amountDue: invoice.amountDue.toNumber(),
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      status: invoice.status,
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    }
  }
}
