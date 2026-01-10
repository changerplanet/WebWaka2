/**
 * HOSPITALITY SUITE: Order Service
 * 
 * Manages food & beverage orders.
 * 
 * @module lib/hospitality/services/order-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityOrderType, HospitalityOrderStatus, HospitalityOrderItemStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOrderInput {
  tenantId: string
  venueId: string
  orderType: HospitalityOrderType
  guestId?: string
  tableId?: string
  stayId?: string
  guestName?: string
  guestPhone?: string
  covers?: number
  serverId?: string
  serverName?: string
  kitchenNotes?: string
  specialRequests?: string
}

export interface AddOrderItemInput {
  tenantId: string
  orderId: string
  itemCode?: string
  itemName: string
  itemDescription?: string
  category?: string
  quantity?: number
  unitPrice: number
  modifiers?: object[]
  specialInstructions?: string
  prepStation?: string
}

export interface OrderSearchOptions {
  venueId?: string
  tableId?: string
  guestId?: string
  stayId?: string
  orderType?: HospitalityOrderType
  status?: HospitalityOrderStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// ORDER NUMBER GENERATION
// ============================================================================

async function generateOrderNumber(tenantId: string): Promise<string> {
  const config = await prisma.hospitality_config.findUnique({
    where: { tenantId }
  })

  const prefix = config?.orderPrefix || 'ORD'
  const nextSeq = config?.orderNextSeq || 1

  // Update sequence
  await prisma.hospitality_config.upsert({
    where: { tenantId },
    create: withPrismaDefaults({ tenantId, orderPrefix: prefix, orderNextSeq: nextSeq + 1 }),
    update: { orderNextSeq: nextSeq + 1 }
  })

  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `${prefix}-${dateStr}-${String(nextSeq).padStart(4, '0')}`
}

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

export async function createOrder(input: CreateOrderInput) {
  const orderNumber = await generateOrderNumber(input.tenantId)

  // If table order, mark table as occupied
  if (input.tableId) {
    await prisma.hospitality_table.update({
      where: { id: input.tableId },
      data: { status: 'OCCUPIED' }
    })
  }

  return prisma.hospitality_order.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      orderNumber,
      orderType: input.orderType,
      guestId: input.guestId,
      tableId: input.tableId,
      stayId: input.stayId,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      covers: input.covers || 1,
      serverId: input.serverId,
      serverName: input.serverName,
      kitchenNotes: input.kitchenNotes,
      specialRequests: input.specialRequests,
      status: 'PLACED',
      placedAt: new Date()
    }),
    include: { guest: true, table: true, venue: true }
  })
}

export async function getOrder(tenantId: string, orderId: string) {
  return prisma.hospitality_order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      guest: true,
      table: true,
      stay: true,
      venue: true,
      inv_audit_items: { orderBy: { createdAt: 'asc' } },
      chargeFacts: true
    }
  })
}

export async function getOrderByNumber(tenantId: string, orderNumber: string) {
  return prisma.hospitality_order.findFirst({
    where: { orderNumber, tenantId },
    include: { guest: true, table: true, inv_audit_items: true }
  })
}

export async function listOrders(tenantId: string, options?: OrderSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.venueId && { venueId: options.venueId }),
    ...(options?.tableId && { tableId: options.tableId }),
    ...(options?.guestId && { guestId: options.guestId }),
    ...(options?.stayId && { stayId: options.stayId }),
    ...(options?.orderType && { orderType: options.orderType }),
    ...(options?.status && { status: options.status }),
    ...(options?.dateFrom && options?.dateTo && {
      placedAt: { gte: options.dateFrom, lte: options.dateTo }
    })
  }

  const [orders, total] = await Promise.all([
    prisma.hospitality_order.findMany({
      where,
      include: {
        guest: true,
        table: true,
        inv_audit_items: true,
        _count: { select: { inv_audit_items: true } }
      },
      skip,
      take: limit,
      orderBy: { placedAt: 'desc' }
    }),
    prisma.hospitality_order.count({ where })
  ])

  return { orders, total, page, limit }
}

// ============================================================================
// ORDER ITEMS
// ============================================================================

export async function addOrderItem(input: AddOrderItemInput) {
  return prisma.hospitality_order_item.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      orderId: input.orderId,
      itemCode: input.itemCode,
      itemName: input.itemName,
      itemDescription: input.itemDescription,
      category: input.category,
      quantity: input.quantity || 1,
      unitPrice: input.unitPrice,
      modifiers: input.modifiers,
      specialInstructions: input.specialInstructions,
      prepStation: input.prepStation,
      status: 'PENDING'
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function updateOrderItemStatus(tenantId: string, itemId: string, status: HospitalityOrderItemStatus) {
  const updates: Record<string, unknown> = { status, updatedAt: new Date() }
  
  if (status === 'PREPARING') {
    updates.sentToKitchenAt = new Date()
  } else if (status === 'READY') {
    updates.preparedAt = new Date()
  } else if (status === 'SERVED') {
    updates.servedAt = new Date()
  }

  return prisma.hospitality_order_item.update({
    where: { id: itemId },
    data: updates
  })
}

export async function removeOrderItem(tenantId: string, itemId: string) {
  const item = await prisma.hospitality_order_item.findFirst({
    where: { id: itemId, tenantId }
  })

  if (!item) throw new Error('Item not found')
  if (item.status !== 'PENDING') throw new Error('Cannot remove item that is already being prepared')

  return prisma.hospitality_order_item.delete({
    where: { id: itemId }
  })
}

// ============================================================================
// ORDER STATUS TRANSITIONS
// ============================================================================

export async function confirmOrder(tenantId: string, orderId: string) {
  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED', confirmedAt: new Date(), updatedAt: new Date() },
    include: { inv_audit_items: true }
  })
}

export async function markOrderPreparing(tenantId: string, orderId: string) {
  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'PREPARING', updatedAt: new Date() }
  })
}

export async function markOrderReady(tenantId: string, orderId: string) {
  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'READY', preparedAt: new Date(), updatedAt: new Date() }
  })
}

export async function markOrderServed(tenantId: string, orderId: string) {
  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'SERVED', servedAt: new Date(), updatedAt: new Date() }
  })
}

export async function completeOrder(tenantId: string, orderId: string) {
  const order = await prisma.hospitality_order.findFirst({
    where: { id: orderId, tenantId }
  })

  if (!order) throw new Error('Order not found')

  // If table order, mark table for cleaning
  if (order.tableId) {
    await prisma.hospitality_table.update({
      where: { id: order.tableId },
      data: { status: 'CLEANING' }
    })
  }

  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() }
  })
}

export async function cancelOrder(tenantId: string, orderId: string) {
  const order = await prisma.hospitality_order.findFirst({
    where: { id: orderId, tenantId }
  })

  if (!order) throw new Error('Order not found')

  // If table order, make table available
  if (order.tableId) {
    await prisma.hospitality_table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' }
    })
  }

  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), updatedAt: new Date() }
  })
}

// ============================================================================
// KITCHEN DISPLAY
// ============================================================================

export async function getKitchenQueue(tenantId: string, venueId: string, prepStation?: string) {
  const items = await prisma.hospitality_order_item.findMany({
    where: {
      tenantId,
      order: { venueId },
      status: { in: ['PENDING', 'PREPARING'] },
      ...(prepStation && { prepStation })
    },
    include: {
      svm_orders: {
        select: {
          orderNumber: true,
          orderType: true,
          tableId: true,
          stayId: true,
          kitchenNotes: true,
          table: { select: { tableNumber: true } }
        }
      }
    },
    orderBy: [
      { status: 'asc' },
      { sentToKitchenAt: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  return items
}

export async function getActiveOrders(tenantId: string, venueId: string) {
  return prisma.hospitality_order.findMany({
    where: {
      tenantId,
      venueId,
      status: { in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'] }
    },
    include: {
      table: true,
      guest: true,
      inv_audit_items: true,
      _count: { select: { inv_audit_items: true } }
    },
    orderBy: { placedAt: 'asc' }
  })
}

// ============================================================================
// ORDER TOTALS (for display only, billing via Commerce)
// ============================================================================

export async function calculateOrderTotal(tenantId: string, orderId: string) {
  const items = await prisma.hospitality_order_item.findMany({
    where: { tenantId, orderId, status: { not: 'CANCELLED' } }
  })

  const subtotal = items.reduce((sum: any, item: any) => {
    const modifierTotal = (item.modifiers as { price?: number }[] || [])
      .reduce((m, mod) => m + (mod.price || 0), 0)
    return sum + (Number(item.unitPrice) + modifierTotal) * item.quantity
  }, 0)

  return {
    itemCount: items.length,
    subtotal,
    // Service charge calculation would be done by Commerce
    // VAT calculation would be done by Commerce
    total: subtotal
  }
}

// ============================================================================
// SPLIT BILLS
// ============================================================================

export async function setSplitBill(tenantId: string, orderId: string, splitCount: number) {
  return prisma.hospitality_order.update({
    where: { id: orderId },
    data: { isSplitBill: true, splitCount, updatedAt: new Date() }
  })
}

export async function assignItemToSplit(tenantId: string, itemId: string, splitNumber: number) {
  return prisma.hospitality_order_item.update({
    where: { id: itemId },
    data: { splitAssignment: splitNumber, updatedAt: new Date() }
  })
}

export async function getSplitBillTotals(tenantId: string, orderId: string) {
  const order = await prisma.hospitality_order.findFirst({
    where: { id: orderId, tenantId },
    include: { inv_audit_items: { where: { status: { not: 'CANCELLED' } } } }
  })

  if (!order) throw new Error('Order not found')

  const splits: Record<number, { items: typeof order.items; total: number }> = {}
  
  for (let i = 1; i <= order.splitCount; i++) {
    const splitItems = order.items.filter((item: any) => item.splitAssignment === i)
    const total = splitItems.reduce((sum: any, item: any) => {
      const modifierTotal = (item.modifiers as { price?: number }[] || [])
        .reduce((m, mod) => m + (mod.price || 0), 0)
      return sum + (Number(item.unitPrice) + modifierTotal) * item.quantity
    }, 0)
    
    splits[i] = { items: splitItems, total }
  }

  return splits
}
