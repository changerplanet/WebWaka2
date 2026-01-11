/**
 * POS Sale Service
 * 
 * Manages individual sales: create, finalize, void.
 * Integrates with shift management and tax configuration.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { 
  POS_CONFIG, 
  generateSaleNumber, 
  generateReceiptNumber,
  calculateTax,
  calculateChange,
  type POSSale,
  type POSSaleItem,
  type POSSaleStatus,
  type POSPaymentMethod,
  type SplitPayment
} from './config'
import { updateShiftTotals } from './shift-service'
import { recordCashIn, recordCashOut } from './drawer-service'

// =============================================================================
// SALE SERVICE
// =============================================================================

export interface CreateSaleInput {
  tenantId: string
  platformInstanceId?: string
  locationId: string
  shiftId?: string
  staffId: string
  staffName: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  offlineId?: string
}

export interface SaleItemInput {
  productId: string
  variantId?: string
  productName: string
  sku?: string
  quantity: number
  unitPrice: number
  unitCost?: number
  discount?: number
  discountReason?: string
}

export interface FinalizeSaleInput {
  paymentMethod: POSPaymentMethod
  amountTendered?: number // For cash
  transferReference?: string // For bank transfer
  transferBank?: string
  splitPayments?: SplitPayment[]
  notes?: string
}

// In-memory cart for building sales
const activeSales = new Map<string, {
  sale: Partial<POSSale>
  items: SaleItemInput[]
}>()

/**
 * Create a new sale (starts a cart)
 */
export async function createSale(input: CreateSaleInput): Promise<string> {
  const saleId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  activeSales.set(saleId, {
    sale: {
      tenantId: input.tenantId,
      platformInstanceId: input.platformInstanceId,
      locationId: input.locationId,
      shiftId: input.shiftId,
      staffId: input.staffId,
      staffName: input.staffName,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      offlineId: input.offlineId,
      currency: POS_CONFIG.currency,
    },
    items: [],
  })

  return saleId
}

/**
 * Add item to pending sale
 */
export function addItem(saleId: string, item: SaleItemInput): void {
  const pending = activeSales.get(saleId)
  if (!pending) {
    throw new Error('Sale not found')
  }

  // Check if item already exists
  const existingIndex = pending.items.findIndex(
    (i: any) => i.productId === item.productId && i.variantId === item.variantId
  )

  if (existingIndex >= 0) {
    // Update quantity
    pending.items[existingIndex].quantity += item.quantity
  } else {
    pending.items.push(item)
  }
}

/**
 * Remove item from pending sale
 */
export function removeItem(saleId: string, productId: string, variantId?: string): void {
  const pending = activeSales.get(saleId)
  if (!pending) {
    throw new Error('Sale not found')
  }

  pending.items = pending.items.filter(
    (i: any) => !(i.productId === productId && i.variantId === variantId)
  )
}

/**
 * Update item quantity
 */
export function updateItemQuantity(saleId: string, productId: string, quantity: number, variantId?: string): void {
  const pending = activeSales.get(saleId)
  if (!pending) {
    throw new Error('Sale not found')
  }

  if (quantity <= 0) {
    removeItem(saleId, productId, variantId)
    return
  }

  const item = pending.items.find(
    (i: any) => i.productId === productId && i.variantId === variantId
  )

  if (item) {
    item.quantity = quantity
  }
}

/**
 * Apply discount to an item
 */
export function applyItemDiscount(saleId: string, productId: string, discount: number, reason?: string, variantId?: string): void {
  const pending = activeSales.get(saleId)
  if (!pending) {
    throw new Error('Sale not found')
  }

  const item = pending.items.find(
    (i: any) => i.productId === productId && i.variantId === variantId
  )

  if (item) {
    item.discount = discount
    item.discountReason = reason
  }
}

/**
 * Get pending sale cart
 */
export function getCart(saleId: string): { sale: Partial<POSSale>; items: SaleItemInput[] } | null {
  return activeSales.get(saleId) || null
}

/**
 * Calculate sale totals
 */
export function calculateSaleTotals(
  items: SaleItemInput[],
  taxRate: number = POS_CONFIG.defaultTaxRate
): {
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  itemTotals: { lineTotal: number; tax: number }[]
} {
  let subtotal = 0
  let discountTotal = 0
  const itemTotals: { lineTotal: number; tax: number }[] = []

  for (const item of items) {
    const lineSubtotal = item.unitPrice * item.quantity
    const lineDiscount = item.discount || 0
    const lineAfterDiscount = lineSubtotal - lineDiscount
    const lineTax = calculateTax(lineAfterDiscount, taxRate)
    const lineTotal = lineAfterDiscount + lineTax

    subtotal += lineSubtotal
    discountTotal += lineDiscount
    itemTotals.push({ lineTotal, tax: lineTax })
  }

  const taxableAmount = subtotal - discountTotal
  const taxTotal = calculateTax(taxableAmount, taxRate)
  const grandTotal = taxableAmount + taxTotal

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    itemTotals,
  }
}

/**
 * Apply tax rate to sale
 */
export async function applyTax(
  tenantId: string,
  saleId: string
): Promise<number> {
  // Try to get tenant-specific tax rate from TaxRule
  const taxRule = await prisma.taxRule.findFirst({
    where: {
      tenantId,
      isActive: true,
      country: 'NG', // Nigeria
    },
    orderBy: { priority: 'desc' },
  })

  const taxRate = taxRule ? Number(taxRule.rate) : POS_CONFIG.defaultTaxRate
  
  const pending = activeSales.get(saleId)
  if (pending) {
    (pending.sale as any).taxRate = taxRate
  }

  return taxRate
}

/**
 * Finalize and persist a sale
 */
export async function finalizeSale(
  saleId: string,
  input: FinalizeSaleInput
): Promise<POSSale> {
  const pending = activeSales.get(saleId)
  if (!pending) {
    throw new Error('Sale not found')
  }

  if (pending.items.length === 0) {
    throw new Error('Cannot finalize sale with no items')
  }

  const { sale, items } = pending
  const taxRate = (sale as any).taxRate ?? POS_CONFIG.defaultTaxRate
  const totals = calculateSaleTotals(items, taxRate)

  // Get next sale number
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todaySales = await prisma.pos_sale.count({
    where: {
      tenantId: sale.tenantId!,
      saleDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  const saleNumber = generateSaleNumber(todaySales + 1)
  const receiptNumber = generateReceiptNumber(todaySales + 1)

  // Calculate change for cash payments
  let changeGiven: number | undefined
  if (input.paymentMethod === 'CASH' && input.amountTendered) {
    changeGiven = calculateChange(totals.grandTotal, input.amountTendered)
  }

  // Create sale record
  const createdSale = await prisma.pos_sale.create({
    data: withPrismaDefaults({
      tenantId: sale.tenantId!,
      platformInstanceId: sale.platformInstanceId,
      locationId: sale.locationId!,
      shiftId: sale.shiftId,
      saleNumber,
      receiptNumber,
      staffId: sale.staffId!,
      staffName: sale.staffName!,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      status: 'COMPLETED',
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      taxRate,
      grandTotal: totals.grandTotal,
      currency: POS_CONFIG.currency,
      paymentMethod: input.paymentMethod,
      amountTendered: input.amountTendered,
      changeGiven,
      transferReference: input.transferReference,
      transferBank: input.transferBank,
      splitPayments: input.splitPayments as any,
      offlineId: sale.offlineId,
      syncedAt: sale.offlineId ? new Date() : undefined,
      notes: input.notes,
      completedAt: new Date(),
      items: {
        create: items.map((item: any, index) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          discount: item.discount || 0,
          discountReason: item.discountReason,
          tax: totals.itemTotals[index].tax,
          lineTotal: totals.itemTotals[index].lineTotal,
        })),
      },
    }),
    include: { items: true },
  })

  // Update shift totals if in a shift
  if (sale.shiftId) {
    await updateShiftTotals(sale.shiftId, totals.grandTotal, input.paymentMethod)

    // Record cash movement for cash payments
    if (input.paymentMethod === 'CASH') {
      await recordCashIn({
        tenantId: sale.tenantId!,
        shiftId: sale.shiftId,
        amount: totals.grandTotal,
        referenceType: 'SALE',
        referenceId: createdSale.id,
        referenceNumber: saleNumber,
        performedById: sale.staffId!,
        performedByName: sale.staffName!,
      })
    }
  }

  // Clean up pending sale
  activeSales.delete(saleId)

  return mapSaleToInterface(createdSale)
}

/**
 * Cancel/void a sale before payment
 */
export function cancelSale(saleId: string): void {
  if (!activeSales.has(saleId)) {
    throw new Error('Sale not found')
  }
  activeSales.delete(saleId)
}

/**
 * Void a completed sale
 */
export async function voidSale(data: {
  tenantId: string
  saleId: string
  voidedById: string
  voidedByName: string
  voidReason: string
}): Promise<POSSale> {
  const sale = await prisma.pos_sale.findFirst({
    where: {
      tenantId: data.tenantId,
      id: data.saleId,
      status: 'COMPLETED',
    },
    include: { items: true },
  })

  if (!sale) {
    throw new Error('Sale not found or cannot be voided')
  }

  const updatedSale = await prisma.pos_sale.update({
    where: { id: data.saleId },
    data: {
      status: 'VOIDED',
      voidedById: data.voidedById,
      voidedByName: data.voidedByName,
      voidedAt: new Date(),
      voidReason: data.voidReason,
    },
    include: { items: true },
  })

  // Update shift totals if in a shift (reverse the sale)
  if (sale.shiftId) {
    await updateShiftTotals(sale.shiftId, Number(sale.grandTotal), sale.paymentMethod as POSPaymentMethod, true)

    // Record cash refund for cash payments
    if (sale.paymentMethod === 'CASH') {
      await recordCashOut({
        tenantId: data.tenantId,
        shiftId: sale.shiftId,
        amount: Number(sale.grandTotal),
        movementType: 'REFUND',
        referenceType: 'VOID',
        referenceId: sale.id,
        referenceNumber: sale.saleNumber,
        performedById: data.voidedById,
        performedByName: data.voidedByName,
        reason: data.voidReason,
      })
    }
  }

  return mapSaleToInterface(updatedSale)
}

/**
 * Get sale by ID
 */
export async function getSale(
  tenantId: string,
  saleId: string
): Promise<POSSale | null> {
  const sale = await prisma.pos_sale.findFirst({
    where: { tenantId, id: saleId },
    include: { items: true },
  })

  return sale ? mapSaleToInterface(sale) : null
}

/**
 * Get sale by sale number
 */
export async function getSaleBySaleNumber(
  tenantId: string,
  saleNumber: string
): Promise<POSSale | null> {
  const sale = await prisma.pos_sale.findFirst({
    where: { tenantId, saleNumber },
    include: { items: true },
  })

  return sale ? mapSaleToInterface(sale) : null
}

/**
 * List sales for a tenant
 */
export async function listSales(
  tenantId: string,
  options?: {
    locationId?: string
    shiftId?: string
    staffId?: string
    status?: POSSaleStatus
    paymentMethod?: POSPaymentMethod
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{ sales: POSSale[]; total: number }> {
  const where: any = { tenantId }

  if (options?.locationId) where.locationId = options.locationId
  if (options?.shiftId) where.shiftId = options.shiftId
  if (options?.staffId) where.staffId = options.staffId
  if (options?.status) where.status = options.status
  if (options?.paymentMethod) where.paymentMethod = options.paymentMethod
  if (options?.startDate || options?.endDate) {
    where.saleDate = {}
    if (options.startDate) where.saleDate.gte = options.startDate
    if (options.endDate) where.saleDate.lte = options.endDate
  }

  const [sales, total] = await Promise.all([
    prisma.pos_sale.findMany({
      where,
      include: { items: true },
      orderBy: { saleDate: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.pos_sale.count({ where }),
  ])

  return {
    sales: sales.map(mapSaleToInterface),
    total,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function mapSaleToInterface(sale: any): POSSale {
  return {
    id: sale.id,
    tenantId: sale.tenantId,
    platformInstanceId: sale.platformInstanceId,
    locationId: sale.locationId,
    shiftId: sale.shiftId,
    saleNumber: sale.saleNumber,
    receiptNumber: sale.receiptNumber,
    staffId: sale.staffId,
    staffName: sale.staffName,
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    saleDate: sale.saleDate,
    completedAt: sale.completedAt,
    status: sale.status as POSSaleStatus,
    voidedById: sale.voidedById,
    voidedByName: sale.voidedByName,
    voidedAt: sale.voidedAt,
    voidReason: sale.voidReason,
    subtotal: Number(sale.subtotal),
    discountTotal: Number(sale.discountTotal),
    discountReason: sale.discountReason,
    taxTotal: Number(sale.taxTotal),
    taxRate: sale.taxRate ? Number(sale.taxRate) : undefined,
    grandTotal: Number(sale.grandTotal),
    currency: sale.currency,
    paymentMethod: sale.paymentMethod as POSPaymentMethod,
    amountTendered: sale.amountTendered ? Number(sale.amountTendered) : undefined,
    changeGiven: sale.changeGiven ? Number(sale.changeGiven) : undefined,
    transferReference: sale.transferReference,
    transferBank: sale.transferBank,
    splitPayments: sale.splitPayments as SplitPayment[] | undefined,
    offlineId: sale.offlineId,
    syncedAt: sale.syncedAt,
    notes: sale.notes,
    items: sale.items?.map(mapSaleItemToInterface) || [],
  }
}

function mapSaleItemToInterface(item: any): POSSaleItem {
  return {
    id: item.id,
    saleId: item.saleId,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    discountReason: item.discountReason,
    tax: Number(item.tax),
    lineTotal: Number(item.lineTotal),
    unitCost: item.unitCost ? Number(item.unitCost) : undefined,
    returnedQuantity: item.returnedQuantity,
    refundedAmount: Number(item.refundedAmount),
    notes: item.notes,
  }
}
