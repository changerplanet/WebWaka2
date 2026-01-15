/**
 * CANONICAL ORDER SERVICE
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * 
 * High-level service for accessing canonical orders across all order types.
 * Aggregates SVM, MVM, and ParkHub orders into a unified view.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes
 * - ❌ No mutations
 * - ❌ No caching
 * - ❌ No background jobs
 * - ✅ Read-only aggregation
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/commerce/canonical-order/canonical-order-service
 */

import { prisma } from '../../prisma'
import { 
  CanonicalOrder, 
  CanonicalOrderItem, 
  CanonicalCustomer,
  CanonicalOrderListResult 
} from './types'
import {
  mapSvmOrderStatus,
  mapSvmPaymentStatus,
  mapMvmOrderStatus,
  mapMvmPaymentStatus,
  mapParkTicketStatus,
  mapParkPaymentStatus,
  deriveCanonicalStatus,
} from './status-mapping'
import { resolveOrderByReference } from './resolvers'

const DEFAULT_LIMIT = 50

interface CustomerIdentifier {
  email?: string
  phone?: string
}

interface ListOptions {
  limit?: number
}

/**
 * Lists canonical orders for a customer identifier (email or phone)
 * 
 * Aggregates across SVM, MVM, and ParkHub, sorted by creation date descending.
 * 
 * GAP: Customer identity is not unified. We query each system separately
 * using email/phone as the linking identifier. This may miss orders if
 * customer used different contact info across purchases.
 */
export async function listByCustomerIdentifier(
  tenantId: string,
  identifier: CustomerIdentifier,
  options: ListOptions = {}
): Promise<CanonicalOrderListResult> {
  const limit = options.limit ?? DEFAULT_LIMIT
  const orders: CanonicalOrder[] = []

  if (!identifier.email && !identifier.phone) {
    return { orders: [], total: 0 }
  }

  const svmOrders = await prisma.svm_orders.findMany({
    where: {
      tenantId,
      ...(identifier.email && { customerEmail: identifier.email }),
      ...(identifier.phone && { customerPhone: identifier.phone }),
    },
    include: { svm_order_items: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  for (const order of svmOrders) {
    const orderStatusMapped = mapSvmOrderStatus(order.status)
    const paymentStatusMapped = mapSvmPaymentStatus(order.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(orderStatusMapped, paymentStatusMapped)

    const items: CanonicalOrderItem[] = order.svm_order_items.map(item => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.lineTotal),
      imageUrl: item.imageUrl ?? undefined,
      sku: item.sku ?? undefined,
    }))

    const customer: CanonicalCustomer = {
      email: order.customerEmail,
      phone: order.customerPhone ?? undefined,
      name: order.customerName ?? undefined,
      source: 'SVM',
    }

    orders.push({
      id: `svm_${order.id}`,
      tenantId: order.tenantId,
      type: 'SVM',
      reference: order.orderNumber,
      status: effectiveStatus,
      paymentStatus: order.paymentStatus,
      amount: {
        subtotal: Number(order.subtotal),
        total: Number(order.grandTotal),
        currency: 'NGN',
      },
      items,
      customer,
      createdAt: order.createdAt,
      sourceId: order.id,
      metadata: {
        originalStatus: order.status,
        originalPaymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentMethod: order.paymentMethod,
      },
    })
  }

  const mvmOrders = await prisma.mvm_parent_order.findMany({
    where: {
      tenantId,
      ...(identifier.email && { customerEmail: identifier.email }),
      ...(identifier.phone && { customerPhone: identifier.phone }),
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  for (const order of mvmOrders) {
    const orderStatusMapped = mapMvmOrderStatus(order.status)
    const paymentStatusMapped = mapMvmPaymentStatus(order.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(orderStatusMapped, paymentStatusMapped)

    const items: CanonicalOrderItem[] = order.items.map(item => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.lineTotal),
      imageUrl: item.imageUrl ?? undefined,
      vendorId: item.vendorId,
      sku: item.sku ?? undefined,
    }))

    const customer: CanonicalCustomer = {
      email: order.customerEmail,
      phone: order.customerPhone ?? undefined,
      name: order.customerName ?? undefined,
      source: 'MVM',
    }

    orders.push({
      id: `mvm_${order.id}`,
      tenantId: order.tenantId,
      type: 'MVM',
      reference: order.orderNumber,
      status: effectiveStatus,
      paymentStatus: order.paymentStatus,
      amount: {
        subtotal: Number(order.subtotal),
        total: Number(order.grandTotal),
        currency: 'NGN',
      },
      items,
      customer,
      createdAt: order.createdAt,
      sourceId: order.id,
      metadata: {
        originalStatus: order.status,
        originalPaymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      },
    })
  }

  const tickets = await prisma.park_ticket.findMany({
    where: {
      tenantId,
      ...(identifier.phone && { passengerPhone: identifier.phone }),
    },
    orderBy: { soldAt: 'desc' },
    take: limit,
  })

  for (const ticket of tickets) {
    const ticketStatusMapped = mapParkTicketStatus(ticket.status)
    const paymentStatusMapped = mapParkPaymentStatus(ticket.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(ticketStatusMapped, paymentStatusMapped)

    const items: CanonicalOrderItem[] = [{
      id: ticket.id,
      name: `Transport Ticket - Seat ${ticket.seatNumber || 'Unassigned'}`,
      quantity: 1,
      unitPrice: Number(ticket.price),
      totalPrice: Number(ticket.totalPaid),
    }]

    const customer: CanonicalCustomer = {
      phone: ticket.passengerPhone ?? undefined,
      name: ticket.passengerName,
      source: 'PARKHUB',
    }

    orders.push({
      id: `park_${ticket.id}`,
      tenantId: ticket.tenantId,
      type: 'PARKHUB',
      reference: ticket.ticketNumber,
      status: effectiveStatus,
      paymentStatus: ticket.paymentStatus,
      amount: {
        subtotal: Number(ticket.price),
        total: Number(ticket.totalPaid),
        currency: 'NGN',
      },
      items,
      customer,
      createdAt: ticket.soldAt,
      sourceId: ticket.id,
      metadata: {
        originalStatus: ticket.status,
        originalPaymentStatus: ticket.paymentStatus,
        paymentMethod: ticket.paymentMethod,
        seatNumber: ticket.seatNumber,
        tripId: ticket.tripId,
      },
    })
  }

  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const limitedOrders = orders.slice(0, limit)

  return {
    orders: limitedOrders,
    total: orders.length,
  }
}

/**
 * Lists all canonical orders for a tenant (demo mode only)
 * 
 * This should only be used for demo tenants where full visibility is allowed.
 */
export async function listAllForTenant(
  tenantId: string,
  options: ListOptions = {}
): Promise<CanonicalOrderListResult> {
  const limit = options.limit ?? DEFAULT_LIMIT
  const orders: CanonicalOrder[] = []

  const svmOrders = await prisma.svm_orders.findMany({
    where: { tenantId },
    include: { svm_order_items: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  for (const order of svmOrders) {
    const orderStatusMapped = mapSvmOrderStatus(order.status)
    const paymentStatusMapped = mapSvmPaymentStatus(order.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(orderStatusMapped, paymentStatusMapped)

    orders.push({
      id: `svm_${order.id}`,
      tenantId: order.tenantId,
      type: 'SVM',
      reference: order.orderNumber,
      status: effectiveStatus,
      paymentStatus: order.paymentStatus,
      amount: {
        subtotal: Number(order.subtotal),
        total: Number(order.grandTotal),
        currency: 'NGN',
      },
      items: order.svm_order_items.map(item => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal),
        imageUrl: item.imageUrl ?? undefined,
      })),
      customer: {
        email: order.customerEmail,
        phone: order.customerPhone ?? undefined,
        name: order.customerName ?? undefined,
        source: 'SVM',
      },
      createdAt: order.createdAt,
      sourceId: order.id,
      metadata: {
        originalStatus: order.status,
        originalPaymentStatus: order.paymentStatus,
      },
    })
  }

  const mvmOrders = await prisma.mvm_parent_order.findMany({
    where: { tenantId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  for (const order of mvmOrders) {
    const orderStatusMapped = mapMvmOrderStatus(order.status)
    const paymentStatusMapped = mapMvmPaymentStatus(order.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(orderStatusMapped, paymentStatusMapped)

    orders.push({
      id: `mvm_${order.id}`,
      tenantId: order.tenantId,
      type: 'MVM',
      reference: order.orderNumber,
      status: effectiveStatus,
      paymentStatus: order.paymentStatus,
      amount: {
        subtotal: Number(order.subtotal),
        total: Number(order.grandTotal),
        currency: 'NGN',
      },
      items: order.items.map(item => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal),
        imageUrl: item.imageUrl ?? undefined,
        vendorId: item.vendorId,
      })),
      customer: {
        email: order.customerEmail,
        phone: order.customerPhone ?? undefined,
        name: order.customerName ?? undefined,
        source: 'MVM',
      },
      createdAt: order.createdAt,
      sourceId: order.id,
      metadata: {
        originalStatus: order.status,
        originalPaymentStatus: order.paymentStatus,
      },
    })
  }

  const tickets = await prisma.park_ticket.findMany({
    where: { tenantId },
    orderBy: { soldAt: 'desc' },
    take: limit,
  })

  for (const ticket of tickets) {
    const ticketStatusMapped = mapParkTicketStatus(ticket.status)
    const paymentStatusMapped = mapParkPaymentStatus(ticket.paymentStatus)
    const effectiveStatus = deriveCanonicalStatus(ticketStatusMapped, paymentStatusMapped)

    orders.push({
      id: `park_${ticket.id}`,
      tenantId: ticket.tenantId,
      type: 'PARKHUB',
      reference: ticket.ticketNumber,
      status: effectiveStatus,
      paymentStatus: ticket.paymentStatus,
      amount: {
        subtotal: Number(ticket.price),
        total: Number(ticket.totalPaid),
        currency: 'NGN',
      },
      items: [{
        id: ticket.id,
        name: `Transport Ticket - Seat ${ticket.seatNumber || 'Unassigned'}`,
        quantity: 1,
        unitPrice: Number(ticket.price),
        totalPrice: Number(ticket.totalPaid),
      }],
      customer: {
        phone: ticket.passengerPhone ?? undefined,
        name: ticket.passengerName,
        source: 'PARKHUB',
      },
      createdAt: ticket.soldAt,
      sourceId: ticket.id,
      metadata: {
        originalStatus: ticket.status,
        originalPaymentStatus: ticket.paymentStatus,
      },
    })
  }

  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const limitedOrders = orders.slice(0, limit)

  return {
    orders: limitedOrders,
    total: orders.length,
  }
}

/**
 * Gets a single canonical order by reference (order number / ticket number)
 */
export async function getByReference(
  tenantId: string,
  reference: string
): Promise<CanonicalOrder | null> {
  const result = await resolveOrderByReference(reference, tenantId)
  if (result.success) {
    return result.data
  }
  return null
}

export const CanonicalOrderService = {
  listByCustomerIdentifier,
  listAllForTenant,
  getByReference,
}
