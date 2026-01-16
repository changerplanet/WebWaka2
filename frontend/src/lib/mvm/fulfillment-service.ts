/**
 * MVM Fulfillment Service
 * 
 * Wave K.3: Handles partial vendor fulfillment and state aggregation
 * 
 * Parent order statuses:
 * - PENDING: Initial state, awaiting payment
 * - CONFIRMED: Payment received, awaiting fulfillment
 * - PARTIALLY_FULFILLED: Some sub-orders fulfilled, others pending
 * - COMPLETED: All sub-orders fulfilled/cancelled/refunded
 * - CANCELLED: Order cancelled
 * - EXPIRED: Order expired (payment not received)
 * 
 * Sub-order statuses (enum MvmSubOrderStatus):
 * - PENDING: Awaiting confirmation
 * - CONFIRMED: Ready for processing
 * - PROCESSING: Being prepared
 * - SHIPPED: In transit
 * - DELIVERED: Successfully delivered
 * - CANCELLED: Cancelled by vendor/admin
 * - REFUNDED: Refunded to customer
 */

import { prisma } from '@/lib/prisma'
import { MvmSubOrderStatus } from '@prisma/client'

export type ParentOrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PARTIALLY_FULFILLED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

const TERMINAL_STATUSES: MvmSubOrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED']
const FULFILLED_STATUSES: MvmSubOrderStatus[] = ['DELIVERED']

export interface FulfillmentState {
  parentOrderId: string
  currentStatus: ParentOrderStatus
  subOrderStatuses: {
    id: string
    subOrderNumber: string
    vendorName: string
    status: MvmSubOrderStatus
    isFulfilled: boolean
    isTerminal: boolean
  }[]
  totalSubOrders: number
  fulfilledCount: number
  pendingCount: number
  cancelledCount: number
  refundedCount: number
}

export class FulfillmentService {
  /**
   * Get fulfillment state for a parent order
   */
  static async getFulfillmentState(parentOrderId: string): Promise<FulfillmentState | null> {
    const parentOrder = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      include: {
        subOrders: {
          include: {
            vendor: { select: { name: true } }
          }
        }
      }
    })

    if (!parentOrder) {
      return null
    }

    const subOrderStatuses = parentOrder.subOrders.map(so => ({
      id: so.id,
      subOrderNumber: so.subOrderNumber,
      vendorName: so.vendor?.name || 'Unknown Vendor',
      status: so.status,
      isFulfilled: FULFILLED_STATUSES.includes(so.status),
      isTerminal: TERMINAL_STATUSES.includes(so.status)
    }))

    const fulfilledCount = subOrderStatuses.filter(s => s.isFulfilled).length
    const pendingCount = subOrderStatuses.filter(s => !s.isTerminal).length
    const cancelledCount = subOrderStatuses.filter(s => s.status === 'CANCELLED').length
    const refundedCount = subOrderStatuses.filter(s => s.status === 'REFUNDED').length

    return {
      parentOrderId,
      currentStatus: parentOrder.status as ParentOrderStatus,
      subOrderStatuses,
      totalSubOrders: subOrderStatuses.length,
      fulfilledCount,
      pendingCount,
      cancelledCount,
      refundedCount
    }
  }

  /**
   * Update sub-order status and recalculate parent order status
   */
  static async updateSubOrderStatus(
    subOrderId: string,
    newStatus: MvmSubOrderStatus,
    notes?: string
  ): Promise<{ success: boolean; parentStatus: ParentOrderStatus; error?: string }> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      select: { parentOrderId: true, status: true }
    })

    if (!subOrder) {
      return { success: false, parentStatus: 'PENDING', error: 'Sub-order not found' }
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date()
    }

    if (newStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    } else if (newStatus === 'SHIPPED') {
      updateData.shippedAt = new Date()
    } else if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date()
      updateData.cancelReason = notes
    }

    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: updateData
    })

    const newParentStatus = await this.recalculateParentStatus(subOrder.parentOrderId)

    return { success: true, parentStatus: newParentStatus }
  }

  /**
   * Recalculate parent order status based on sub-order states
   * 
   * Logic:
   * - If ALL sub-orders are terminal (delivered/cancelled/refunded) → COMPLETED
   * - If SOME sub-orders are delivered but others are not terminal → PARTIALLY_FULFILLED
   * - If parent was CONFIRMED and no sub-orders are delivered yet → CONFIRMED
   * - If parent was PENDING → PENDING (awaiting payment)
   */
  static async recalculateParentStatus(parentOrderId: string): Promise<ParentOrderStatus> {
    const parentOrder = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      include: {
        subOrders: { select: { status: true } }
      }
    })

    if (!parentOrder) {
      return 'PENDING'
    }

    if (parentOrder.status === 'CANCELLED' || parentOrder.status === 'EXPIRED') {
      return parentOrder.status as ParentOrderStatus
    }

    const subOrders = parentOrder.subOrders
    
    if (subOrders.length === 0) {
      return parentOrder.status as ParentOrderStatus
    }

    const allTerminal = subOrders.every(so => TERMINAL_STATUSES.includes(so.status))
    const anyDelivered = subOrders.some(so => so.status === 'DELIVERED')
    const allCancelled = subOrders.every(so => so.status === 'CANCELLED')

    let newStatus: ParentOrderStatus

    if (allCancelled) {
      newStatus = 'CANCELLED'
    } else if (allTerminal) {
      newStatus = 'COMPLETED'
    } else if (anyDelivered) {
      newStatus = 'PARTIALLY_FULFILLED'
    } else if (parentOrder.paymentStatus === 'CAPTURED' || parentOrder.paymentStatus === 'PAID') {
      newStatus = 'CONFIRMED'
    } else {
      newStatus = parentOrder.status as ParentOrderStatus
    }

    if (newStatus !== parentOrder.status) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date()
      }

      if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date()
      }

      await prisma.mvm_parent_order.update({
        where: { id: parentOrderId },
        data: updateData
      })
    }

    return newStatus
  }

  /**
   * Get customer-facing fulfillment summary
   */
  static async getCustomerFulfillmentSummary(parentOrderId: string): Promise<{
    orderNumber: string
    status: ParentOrderStatus
    statusLabel: string
    subOrders: {
      vendorName: string
      status: string
      statusLabel: string
      isFulfilled: boolean
    }[]
  } | null> {
    const state = await this.getFulfillmentState(parentOrderId)
    
    if (!state) {
      return null
    }

    const parentOrder = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      select: { orderNumber: true }
    })

    if (!parentOrder) {
      return null
    }

    const statusLabels: Record<ParentOrderStatus, string> = {
      PENDING: 'Awaiting Payment',
      CONFIRMED: 'Order Confirmed',
      PARTIALLY_FULFILLED: 'Partially Fulfilled',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired'
    }

    const subOrderStatusLabels: Record<MvmSubOrderStatus, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded'
    }

    return {
      orderNumber: parentOrder.orderNumber,
      status: state.currentStatus,
      statusLabel: statusLabels[state.currentStatus] || state.currentStatus,
      subOrders: state.subOrderStatuses.map(so => ({
        vendorName: so.vendorName,
        status: so.status,
        statusLabel: subOrderStatusLabels[so.status] || so.status,
        isFulfilled: so.isFulfilled
      }))
    }
  }
}
