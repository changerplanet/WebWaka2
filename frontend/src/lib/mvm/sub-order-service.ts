/**
 * MVM Sub-Order Service
 * 
 * Manages vendor sub-order lifecycle and status transitions.
 * 
 * @module lib/mvm/sub-order-service
 * @canonical PC-SCP Phase S3
 */

import { prisma } from '../prisma'
import { MvmSubOrderStatus } from '@prisma/client'
import { OrderSplitService } from './order-split-service'
import { CommissionService } from './commission-service'

// ============================================================================
// STATUS TRANSITION RULES
// ============================================================================

/**
 * Valid sub-order status transitions
 * 
 * PENDING → CONFIRMED, CANCELLED
 * CONFIRMED → PROCESSING, CANCELLED
 * PROCESSING → SHIPPED, CANCELLED
 * SHIPPED → DELIVERED, CANCELLED
 * DELIVERED → REFUNDED (terminal otherwise)
 * CANCELLED → (terminal)
 * REFUNDED → (terminal)
 */
const VALID_TRANSITIONS: Record<MvmSubOrderStatus, MvmSubOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: []
}

// ============================================================================
// TYPES
// ============================================================================

export interface StatusUpdateResult {
  success: boolean
  previousStatus?: MvmSubOrderStatus
  newStatus?: MvmSubOrderStatus
  error?: string
}

export interface ShippingInfo {
  carrier: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery?: Date
  shippingMethod?: string
}

// ============================================================================
// SUB-ORDER SERVICE
// ============================================================================

export const SubOrderService = {
  /**
   * Check if status transition is valid
   */
  isValidTransition(from: MvmSubOrderStatus, to: MvmSubOrderStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  },
  
  /**
   * Get valid next statuses
   */
  getValidNextStatuses(currentStatus: MvmSubOrderStatus): MvmSubOrderStatus[] {
    return VALID_TRANSITIONS[currentStatus] || []
  },
  
  /**
   * Confirm a pending sub-order (vendor accepts)
   */
  async confirm(
    subOrderId: string,
    confirmedBy: string
  ): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'CONFIRMED')) {
      return { 
        success: false, 
        error: `Cannot confirm sub-order with status ${subOrder.status}` 
      }
    }
    
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy
      }
    })
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'CONFIRMED'
    }
  },
  
  /**
   * Start processing (vendor preparing order)
   */
  async startProcessing(subOrderId: string): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'PROCESSING')) {
      return { 
        success: false, 
        error: `Cannot start processing sub-order with status ${subOrder.status}` 
      }
    }
    
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'PROCESSING',
        processingAt: new Date()
      }
    })
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'PROCESSING'
    }
  },
  
  /**
   * Mark as shipped with tracking info
   */
  async markShipped(
    subOrderId: string,
    shippingInfo: ShippingInfo
  ): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'SHIPPED')) {
      return { 
        success: false, 
        error: `Cannot ship sub-order with status ${subOrder.status}` 
      }
    }
    
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        shippingCarrier: shippingInfo.carrier,
        trackingNumber: shippingInfo.trackingNumber,
        trackingUrl: shippingInfo.trackingUrl,
        estimatedDelivery: shippingInfo.estimatedDelivery,
        shippingMethod: shippingInfo.shippingMethod
      }
    })
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'SHIPPED'
    }
  },
  
  /**
   * Mark as delivered
   * This triggers commission clearing
   */
  async markDelivered(subOrderId: string): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      include: { commission: true }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'DELIVERED')) {
      return { 
        success: false, 
        error: `Cannot mark delivered sub-order with status ${subOrder.status}` 
      }
    }
    
    // Update sub-order
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      }
    })
    
    // Create commission record if not exists
    if (!subOrder.commission) {
      await CommissionService.createFromSubOrder(subOrderId)
    }
    
    // Mark commission as cleared (after clearance period it becomes payable)
    await CommissionService.markCleared(subOrder.commission?.id || '')
    
    // Try to complete parent order
    await OrderSplitService.tryCompleteParentOrder(subOrder.parentOrderId)
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'DELIVERED'
    }
  },
  
  /**
   * Cancel a sub-order
   */
  async cancel(
    subOrderId: string,
    cancelledBy: string,
    reason: string
  ): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'CANCELLED')) {
      return { 
        success: false, 
        error: `Cannot cancel sub-order with status ${subOrder.status}` 
      }
    }
    
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy,
        cancelReason: reason
      }
    })
    
    // Reverse commission if exists
    await CommissionService.reverse(subOrder.id, cancelledBy, reason)
    
    // Check if parent order should be cancelled too
    await OrderSplitService.tryCompleteParentOrder(subOrder.parentOrderId)
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'CANCELLED'
    }
  },
  
  /**
   * Process refund for a delivered order
   */
  async refund(
    subOrderId: string,
    refundedBy: string,
    reason: string
  ): Promise<StatusUpdateResult> {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    })
    
    if (!subOrder) {
      return { success: false, error: 'Sub-order not found' }
    }
    
    if (!this.isValidTransition(subOrder.status, 'REFUNDED')) {
      return { 
        success: false, 
        error: `Cannot refund sub-order with status ${subOrder.status}` 
      }
    }
    
    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: 'REFUNDED'
      }
    })
    
    // Reverse commission
    await CommissionService.reverse(subOrder.id, refundedBy, `Refund: ${reason}`)
    
    return {
      success: true,
      previousStatus: subOrder.status,
      newStatus: 'REFUNDED'
    }
  },
  
  /**
   * Update tracking info
   */
  async updateTracking(
    subOrderId: string,
    trackingNumber: string,
    trackingUrl?: string,
    estimatedDelivery?: Date
  ) {
    return prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        trackingNumber,
        trackingUrl,
        estimatedDelivery
      }
    })
  },
  
  /**
   * Add vendor notes
   */
  async addVendorNotes(subOrderId: string, notes: string) {
    return prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: { vendorNotes: notes }
    })
  },
  
  /**
   * Get sub-order timeline (status history)
   */
  async getTimeline(subOrderId: string) {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      select: {
        status: true,
        createdAt: true,
        confirmedAt: true,
        confirmedBy: true,
        processingAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        cancelledBy: true,
        cancelReason: true
      }
    })
    
    if (!subOrder) return null
    
    const timeline: {
      status: string
      timestamp: Date
      actor?: string
      notes?: string
    }[] = []
    
    // Always add created
    timeline.push({
      status: 'CREATED',
      timestamp: subOrder.createdAt
    })
    
    // Add confirmed if present
    if (subOrder.confirmedAt) {
      timeline.push({
        status: 'CONFIRMED',
        timestamp: subOrder.confirmedAt,
        actor: subOrder.confirmedBy || undefined
      })
    }
    
    // Add processing if present
    if (subOrder.processingAt) {
      timeline.push({
        status: 'PROCESSING',
        timestamp: subOrder.processingAt
      })
    }
    
    // Add shipped if present
    if (subOrder.shippedAt) {
      timeline.push({
        status: 'SHIPPED',
        timestamp: subOrder.shippedAt
      })
    }
    
    // Add delivered if present
    if (subOrder.deliveredAt) {
      timeline.push({
        status: 'DELIVERED',
        timestamp: subOrder.deliveredAt
      })
    }
    
    // Add cancelled if present
    if (subOrder.cancelledAt) {
      timeline.push({
        status: 'CANCELLED',
        timestamp: subOrder.cancelledAt,
        actor: subOrder.cancelledBy || undefined,
        notes: subOrder.cancelReason || undefined
      })
    }
    
    return timeline.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())
  },
  
  /**
   * Bulk confirm pending orders for a vendor
   */
  async bulkConfirm(vendorId: string, confirmedBy: string) {
    const pending = await prisma.mvm_sub_order.findMany({
      where: { vendorId, status: 'PENDING' },
      select: { id: true }
    })
    
    const results = await Promise.all(
      pending.map(so => this.confirm(so.id, confirmedBy))
    )
    
    return {
      total: pending.length,
      confirmed: results.filter((r: any) => r.success).length,
      failed: results.filter((r: any) => !r.success).length
    }
  }
}
