/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Invoice Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Handles invoice lifecycle:
 * - Create (manual & from order)
 * - Send (status transition)
 * - View tracking
 * - Status management
 * - Partial payments
 * 
 * CRITICAL: Invoices are RECORDS, not payment triggers.
 * All payment execution flows through Payments & Collections Suite.
 * 
 * @module lib/billing/invoice-service
 */

import { prisma } from '@/lib/prisma'
import { BillInvoiceStatus, BillCustomerType, Prisma } from '@prisma/client'
import { VATService } from './vat-service'
import { randomUUID } from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface Invoice {
  id: string
  tenantId: string
  invoiceNumber: string
  customerId: string | null
  customerType: BillCustomerType
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  customerState: string | null
  customerTIN: string | null
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  amountPaid: number
  amountDue: number
  currency: string
  vatRate: number
  vatInclusive: boolean
  vatExempt: boolean
  invoiceDate: Date
  dueDate: Date
  paidDate: Date | null
  sentAt: Date | null
  viewedAt: Date | null
  status: BillInvoiceStatus
  paymentTerms: string | null
  paymentTermDays: number
  orderId: string | null
  orderNumber: string | null
  subscriptionId: string | null
  notes: string | null
  createdAt: Date
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  lineNumber: number
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  taxRate: number
  taxAmount: number
  taxExempt: boolean
  discountAmount: number
  productId: string | null
  productName: string | null
  sku: string | null
}

export interface CreateInvoiceInput {
  customerId?: string
  customerType?: BillCustomerType
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerTIN?: string
  currency?: string
  vatInclusive?: boolean
  vatExempt?: boolean
  vatExemptReason?: string
  paymentTerms?: string
  paymentTermDays?: number
  orderId?: string
  orderNumber?: string
  subscriptionId?: string
  notes?: string
  internalNotes?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
    taxExempt?: boolean
    discountAmount?: number
    discountPercent?: number
    productId?: string
    productName?: string
    sku?: string
  }>
}

// ============================================================================
// INVOICE SERVICE
// ============================================================================

export class InvoiceService {
  /**
   * Generate invoice number
   * Format: INV-{YYMM}-{XXXXX}
   */
  static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await prisma.bill_invoices.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `INV-${year}${month}-${(count + 1).toString().padStart(5, '0')}`
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(
    tenantId: string,
    input: CreateInvoiceInput,
    createdBy?: string
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId)
    const vatRate = input.vatExempt ? 0 : 7.5 // Nigerian VAT
    const paymentTermDays = input.paymentTermDays || 30

    // Calculate due date
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + paymentTermDays)

    // Calculate line items with tax
    const items = input.items.map((item: any, index) => {
      const itemVatRate = item.taxExempt ? 0 : (item.taxRate ?? vatRate)
      const lineTotal = item.quantity * item.unitPrice - (item.discountAmount || 0)
      
      let taxAmount = 0
      if (!item.taxExempt && !input.vatExempt) {
        if (input.vatInclusive) {
          // VAT already included in price
          taxAmount = VATService.extractVATFromInclusive(lineTotal, itemVatRate)
        } else {
          // VAT added on top
          taxAmount = VATService.calculateVAT(lineTotal, itemVatRate)
        }
      }

      return {
        id: randomUUID(),
        lineNumber: index + 1,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        taxRate: itemVatRate,
        taxAmount,
        taxExempt: item.taxExempt || false,
        discountAmount: item.discountAmount || 0,
        discountPercent: item.discountPercent || 0,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku
      }
    })

    // Calculate totals
    const subtotal = items.reduce((sum: any, item: any) => sum + item.lineTotal, 0)
    const discountTotal = items.reduce((sum: any, item: any) => sum + item.discountAmount, 0)
    const taxTotal = items.reduce((sum: any, item: any) => sum + item.taxAmount, 0)
    
    let grandTotal: number
    if (input.vatInclusive) {
      grandTotal = subtotal // Tax already included
    } else {
      grandTotal = subtotal + taxTotal // Tax added on top
    }

    // Create invoice with items
    const invoiceId = randomUUID()
    const now = new Date()
    const invoice = await prisma.bill_invoices.create({
      data: {
        id: invoiceId,
        tenantId,
        invoiceNumber,
        customerId: input.customerId,
        customerType: input.customerType || 'INDIVIDUAL',
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        customerCity: input.customerCity,
        customerState: input.customerState,
        customerTIN: input.customerTIN,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        amountPaid: 0,
        amountDue: grandTotal,
        currency: input.currency || 'NGN',
        vatRate,
        vatInclusive: input.vatInclusive || false,
        vatExempt: input.vatExempt || false,
        vatExemptReason: input.vatExemptReason,
        dueDate,
        paymentTerms: input.paymentTerms || `Net ${paymentTermDays}`,
        paymentTermDays,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        subscriptionId: input.subscriptionId,
        notes: input.notes,
        internalNotes: input.internalNotes,
        createdBy,
        status: 'DRAFT',
        updatedAt: now,
        items: {
          create: items.map((item: any) => ({
            id: item.id,
            lineNumber: item.lineNumber,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            taxExempt: item.taxExempt,
            discountAmount: item.discountAmount,
            discountPercent: item.discountPercent,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku
          }))
        }
      },
      include: { inv_audit_items: true }
    })

    return this.formatInvoice(invoice)
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(
    tenantId: string,
    invoiceId: string
  ): Promise<Invoice | null> {
    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: invoiceId, tenantId },
      include: { inv_audit_items: true }
    })

    return invoice ? this.formatInvoice(invoice) : null
  }

  /**
   * Get invoice by number
   */
  static async getInvoiceByNumber(
    tenantId: string,
    invoiceNumber: string
  ): Promise<Invoice | null> {
    const invoice = await prisma.bill_invoices.findUnique({
      where: { tenantId_invoiceNumber: { tenantId, invoiceNumber } },
      include: { inv_audit_items: true }
    })

    return invoice ? this.formatInvoice(invoice) : null
  }

  /**
   * Send invoice (DRAFT → SENT)
   */
  static async sendInvoice(
    tenantId: string,
    invoiceId: string
  ): Promise<Invoice> {
    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: invoiceId, tenantId, status: 'DRAFT' }
    })

    if (!invoice) {
      throw new Error('Invoice not found or cannot be sent')
    }

    const updated = await prisma.bill_invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      },
      include: { inv_audit_items: true }
    })

    return this.formatInvoice(updated)
  }

  /**
   * Mark invoice as viewed
   */
  static async markViewed(
    tenantId: string,
    invoiceId: string
  ): Promise<Invoice> {
    const invoice = await prisma.bill_invoices.findFirst({
      where: { id: invoiceId, tenantId }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Only update if not already viewed
    if (!invoice.viewedAt) {
      const updated = await prisma.bill_invoices.update({
        where: { id: invoiceId },
        data: {
          viewedAt: new Date(),
          status: invoice.status === 'SENT' ? 'VIEWED' : invoice.status
        },
        include: { inv_audit_items: true }
      })
      return this.formatInvoice(updated)
    }

    return this.formatInvoice({ ...invoice, items: [] } as any)
  }

  /**
   * Cancel invoice
   */
  static async cancelInvoice(
    tenantId: string,
    invoiceId: string,
    reason: string,
    cancelledBy: string
  ): Promise<Invoice> {
    const invoice = await prisma.bill_invoices.findFirst({
      where: { 
        id: invoiceId, 
        tenantId,
        status: { notIn: ['PAID', 'CANCELLED', 'VOID'] }
      }
    })

    if (!invoice) {
      throw new Error('Invoice not found or cannot be cancelled')
    }

    if (invoice.amountPaid.toNumber() > 0) {
      throw new Error('Cannot cancel invoice with payments. Use void instead.')
    }

    const updated = await prisma.bill_invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason: reason
      },
      include: { inv_audit_items: true }
    })

    return this.formatInvoice(updated)
  }

  /**
   * List invoices
   */
  static async listInvoices(
    tenantId: string,
    options?: {
      customerId?: string
      status?: BillInvoiceStatus[]
      overdue?: boolean
      fromDate?: Date
      toDate?: Date
      page?: number
      limit?: number
    }
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.bill_invoicesWhereInput = {
      tenantId,
      ...(options?.customerId && { customerId: options.customerId }),
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.overdue && {
        dueDate: { lt: new Date() },
        status: { notIn: ['PAID', 'CANCELLED', 'VOID'] }
      }),
      ...(options?.fromDate && { invoiceDate: { gte: options.fromDate } }),
      ...(options?.toDate && { invoiceDate: { lte: options.toDate } })
    }

    const [invoices, total] = await Promise.all([
      prisma.bill_invoices.findMany({
        where,
        include: { inv_audit_items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bill_invoices.count({ where })
    ])

    return {
      invoices: invoices.map((i: any) => this.formatInvoice(i)),
      total
    }
  }

  /**
   * Update overdue invoices
   */
  static async updateOverdueInvoices(tenantId: string): Promise<number> {
    const result = await prisma.bill_invoices.updateMany({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }
      },
      data: { status: 'OVERDUE' }
    })

    return result.count
  }

  /**
   * Get invoice statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, totals, overdue, aging] = await Promise.all([
      // By status
      prisma.bill_invoices.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { grandTotal: true, amountDue: true }
      }),
      // Overall totals
      prisma.bill_invoices.aggregate({
        where: { tenantId },
        _sum: { grandTotal: true, amountPaid: true, amountDue: true },
        _count: { id: true }
      }),
      // Overdue
      prisma.bill_invoices.aggregate({
        where: {
          tenantId,
          dueDate: { lt: new Date() },
          status: { notIn: ['PAID', 'CANCELLED', 'VOID'] }
        },
        _sum: { amountDue: true },
        _count: { id: true }
      }),
      // Aging buckets (0-30, 31-60, 61-90, 90+)
      this.getAgingReport(tenantId)
    ])

    return {
      byStatus: byStatus.reduce((acc: any, s: any) => ({
        ...acc,
        [s.status]: {
          count: s._count.id,
          totalAmount: s._sum.grandTotal?.toNumber() || 0,
          amountDue: s._sum.amountDue?.toNumber() || 0
        }
      }), {}),
      totals: {
        invoiceCount: totals._count.id,
        totalAmount: totals._sum.grandTotal?.toNumber() || 0,
        totalPaid: totals._sum.amountPaid?.toNumber() || 0,
        totalDue: totals._sum.amountDue?.toNumber() || 0
      },
      overdue: {
        count: overdue._count.id,
        amount: overdue._sum.amountDue?.toNumber() || 0
      },
      aging
    }
  }

  /**
   * Get aging report (0-30, 31-60, 61-90, 90+ days)
   */
  static async getAgingReport(tenantId: string): Promise<{
    current: { count: number; amount: number }
    days30: { count: number; amount: number }
    days60: { count: number; amount: number }
    days90: { count: number; amount: number }
    days90Plus: { count: number; amount: number }
  }> {
    const now = new Date()
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const baseWhere = {
      tenantId,
      status: { notIn: ['PAID', 'CANCELLED', 'VOID'] as BillInvoiceStatus[] },
      amountDue: { gt: 0 }
    }

    const [current, days30, days60, days90, days90Plus] = await Promise.all([
      // Current (not yet due)
      prisma.bill_invoices.aggregate({
        where: { ...baseWhere, dueDate: { gte: now } },
        _sum: { amountDue: true },
        _count: { id: true }
      }),
      // 1-30 days overdue
      prisma.bill_invoices.aggregate({
        where: { ...baseWhere, dueDate: { lt: now, gte: days30Ago } },
        _sum: { amountDue: true },
        _count: { id: true }
      }),
      // 31-60 days overdue
      prisma.bill_invoices.aggregate({
        where: { ...baseWhere, dueDate: { lt: days30Ago, gte: days60Ago } },
        _sum: { amountDue: true },
        _count: { id: true }
      }),
      // 61-90 days overdue
      prisma.bill_invoices.aggregate({
        where: { ...baseWhere, dueDate: { lt: days60Ago, gte: days90Ago } },
        _sum: { amountDue: true },
        _count: { id: true }
      }),
      // 90+ days overdue
      prisma.bill_invoices.aggregate({
        where: { ...baseWhere, dueDate: { lt: days90Ago } },
        _sum: { amountDue: true },
        _count: { id: true }
      })
    ])

    return {
      current: { count: current._count.id, amount: current._sum.amountDue?.toNumber() || 0 },
      days30: { count: days30._count.id, amount: days30._sum.amountDue?.toNumber() || 0 },
      days60: { count: days60._count.id, amount: days60._sum.amountDue?.toNumber() || 0 },
      days90: { count: days90._count.id, amount: days90._sum.amountDue?.toNumber() || 0 },
      days90Plus: { count: days90Plus._count.id, amount: days90Plus._sum.amountDue?.toNumber() || 0 }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatInvoice(invoice: any): Invoice {
    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerType: invoice.customerType,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      customerState: invoice.customerState,
      customerTIN: invoice.customerTIN,
      subtotal: invoice.subtotal?.toNumber?.() ?? invoice.subtotal,
      discountTotal: invoice.discountTotal?.toNumber?.() ?? invoice.discountTotal,
      taxTotal: invoice.taxTotal?.toNumber?.() ?? invoice.taxTotal,
      grandTotal: invoice.grandTotal?.toNumber?.() ?? invoice.grandTotal,
      amountPaid: invoice.amountPaid?.toNumber?.() ?? invoice.amountPaid,
      amountDue: invoice.amountDue?.toNumber?.() ?? invoice.amountDue,
      currency: invoice.currency,
      vatRate: invoice.vatRate?.toNumber?.() ?? invoice.vatRate,
      vatInclusive: invoice.vatInclusive,
      vatExempt: invoice.vatExempt,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      sentAt: invoice.sentAt,
      viewedAt: invoice.viewedAt,
      status: invoice.status,
      paymentTerms: invoice.paymentTerms,
      paymentTermDays: invoice.paymentTermDays,
      orderId: invoice.orderId,
      orderNumber: invoice.orderNumber,
      subscriptionId: invoice.subscriptionId,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      items: invoice.items?.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        lineNumber: item.lineNumber,
        description: item.description,
        quantity: item.quantity?.toNumber?.() ?? item.quantity,
        unitPrice: item.unitPrice?.toNumber?.() ?? item.unitPrice,
        lineTotal: item.lineTotal?.toNumber?.() ?? item.lineTotal,
        taxRate: item.taxRate?.toNumber?.() ?? item.taxRate,
        taxAmount: item.taxAmount?.toNumber?.() ?? item.taxAmount,
        taxExempt: item.taxExempt,
        discountAmount: item.discountAmount?.toNumber?.() ?? item.discountAmount,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku
      }))
    }
  }
}
