/**
 * CANONICAL ORDER RESOLVERS
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * 
 * Resolver functions that transform existing order data into canonical format.
 * These are pure read-only operations with no side effects.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes
 * - ❌ No mutations
 * - ❌ No business logic changes
 * - ✅ Read-only Prisma queries
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/commerce/canonical-order/resolvers
 */

import { prisma } from '../../prisma'
import { 
  CanonicalOrder, 
  CanonicalOrderItem, 
  CanonicalCustomer,
  CanonicalOrderStatus 
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

export type ResolverResult<T> = 
  | { success: true; data: T }
  | { success: false; reason: 'not_found' | 'tenant_mismatch' }

/**
 * Resolves an SVM order to canonical format
 * 
 * Data source: svm_orders + svm_order_items
 */
export async function resolveSvmOrderToCanonical(
  orderId: string,
  tenantId: string
): Promise<ResolverResult<CanonicalOrder>> {
  const order = await prisma.svm_orders.findUnique({
    where: { id: orderId },
    include: { svm_order_items: true },
  })

  if (!order) {
    return { success: false, reason: 'not_found' }
  }

  if (order.tenantId !== tenantId) {
    return { success: false, reason: 'tenant_mismatch' }
  }

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

  const canonical: CanonicalOrder = {
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
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
    },
  }

  return { success: true, data: canonical }
}

/**
 * Resolves an MVM parent order to canonical format
 * 
 * Data source: mvm_parent_order + mvm_parent_order_item
 * 
 * GAP: MVM orders split into sub-orders per vendor. This resolver returns
 * the PARENT order only. Sub-order details are in metadata.
 */
export async function resolveMvmParentOrderToCanonical(
  orderId: string,
  tenantId: string
): Promise<ResolverResult<CanonicalOrder>> {
  const order = await prisma.mvm_parent_order.findUnique({
    where: { id: orderId },
    include: { 
      items: true,
      subOrders: {
        select: {
          id: true,
          vendorId: true,
          status: true,
          subtotal: true,
        }
      }
    },
  })

  if (!order) {
    return { success: false, reason: 'not_found' }
  }

  if (order.tenantId !== tenantId) {
    return { success: false, reason: 'tenant_mismatch' }
  }

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

  const canonical: CanonicalOrder = {
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
      shippingAddress: order.shippingAddress,
      subOrderCount: order.subOrders.length,
      subOrders: order.subOrders.map(so => ({
        id: so.id,
        vendorId: so.vendorId,
        status: so.status,
        subtotal: Number(so.subtotal),
      })),
    },
  }

  return { success: true, data: canonical }
}

/**
 * Resolves a ParkHub ticket to canonical order format
 * 
 * Data source: park_ticket
 * 
 * GAP: ParkHub tickets are fundamentally different from commerce orders.
 * - No "items" in the traditional sense (single ticket = single item)
 * - Customer is "passenger" with different identity model
 * - Status lifecycle is travel-based, not fulfillment-based
 */
export async function resolveParkTicketToCanonical(
  ticketId: string,
  tenantId: string
): Promise<ResolverResult<CanonicalOrder>> {
  const ticket = await prisma.park_ticket.findUnique({
    where: { id: ticketId },
  })

  if (!ticket) {
    return { success: false, reason: 'not_found' }
  }

  if (ticket.tenantId !== tenantId) {
    return { success: false, reason: 'tenant_mismatch' }
  }

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

  const canonical: CanonicalOrder = {
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
      saleChannel: ticket.saleChannel,
      soldById: ticket.soldById,
      soldByName: ticket.soldByName,
      roundingAmount: Number(ticket.roundingAmount),
      roundingMode: ticket.roundingMode,
    },
  }

  return { success: true, data: canonical }
}

/**
 * Resolves an order by reference (order number) across all order types
 * 
 * Attempts resolution in order: SVM → MVM → ParkHub
 */
export async function resolveOrderByReference(
  reference: string,
  tenantId: string
): Promise<ResolverResult<CanonicalOrder>> {
  const svmOrder = await prisma.svm_orders.findFirst({
    where: { tenantId, orderNumber: reference },
  })
  if (svmOrder) {
    return resolveSvmOrderToCanonical(svmOrder.id, tenantId)
  }

  const mvmOrder = await prisma.mvm_parent_order.findFirst({
    where: { tenantId, orderNumber: reference },
  })
  if (mvmOrder) {
    return resolveMvmParentOrderToCanonical(mvmOrder.id, tenantId)
  }

  const ticket = await prisma.park_ticket.findFirst({
    where: { tenantId, ticketNumber: reference },
  })
  if (ticket) {
    return resolveParkTicketToCanonical(ticket.id, tenantId)
  }

  return { success: false, reason: 'not_found' }
}
