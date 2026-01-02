/**
 * MVM Order Splitting Engine
 * 
 * Splits multi-vendor orders into vendor sub-orders.
 * 
 * RULES:
 * - A single checkout may contain items from multiple vendors
 * - Payment is captured ONCE by Core (not duplicated)
 * - Each vendor gets a sub-order for their items
 * - Commission is calculated per sub-order
 * - No money movement happens here - only tracking
 */

// ============================================================================
// TYPES
// ============================================================================

export type VendorSubOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface OrderLineItem {
  id: string
  productId: string
  variantId?: string
  sku?: string
  productName: string
  variantName?: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  discountAmount: number
  // Vendor assignment (from product mapping)
  vendorId?: string
}

export interface ParentOrder {
  id: string
  orderNumber: string
  tenantId: string
  customerId?: string
  customerEmail?: string
  customerName?: string
  items: OrderLineItem[]
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  currency: string
  shippingAddress: ShippingAddress
  shippingMethod?: string
}

export interface ShippingAddress {
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

export interface VendorSubOrder {
  id: string
  tenantId: string
  vendorId: string
  parentOrderId: string
  parentOrderNumber: string
  subOrderNumber: string
  status: VendorSubOrderStatus
  items: VendorSubOrderItem[]
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  commissionRate: number
  commissionAmount: number
  vendorEarnings: number
  customerName?: string
  shippingAddress: ShippingAddress
  shippingMethod?: string
  createdAt: string
}

export interface VendorSubOrderItem {
  id: string
  subOrderId: string
  productId: string
  variantId?: string
  sku?: string
  productName: string
  variantName?: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  discountAmount: number
  commissionRate: number
  commissionAmount: number
}

export interface CommissionConfig {
  vendorId: string
  vendorCommissionRate?: number // Vendor-specific override
  tierCommissionRate?: number   // From vendor tier
  defaultRate: number           // Tenant default
  productOverrides: Map<string, number> // Product-specific rates
  categoryOverrides: Map<string, number> // Category-specific rates
}

export interface SplitResult {
  success: boolean
  parentOrderId: string
  parentOrderNumber: string
  subOrders: VendorSubOrder[]
  events: OrderSplitEvent[]
  errors?: string[]
}

export interface OrderSplitEvent {
  eventType: string
  payload: Record<string, unknown>
  idempotencyKey: string
}

// ============================================================================
// ORDER SPLITTING ENGINE
// ============================================================================

export class OrderSplittingEngine {
  /**
   * Split a parent order into vendor sub-orders
   */
  static splitOrder(
    parentOrder: ParentOrder,
    vendorAssignments: Map<string, string>, // productId -> vendorId
    commissionConfigs: Map<string, CommissionConfig>, // vendorId -> config
    options?: {
      subOrderPrefix?: string
    }
  ): SplitResult {
    const errors: string[] = []
    const events: OrderSplitEvent[] = []
    
    // Group items by vendor
    const vendorItems = this.groupItemsByVendor(parentOrder.items, vendorAssignments)
    
    // Check if order has vendor assignments
    if (vendorItems.size === 0) {
      return {
        success: false,
        parentOrderId: parentOrder.id,
        parentOrderNumber: parentOrder.orderNumber,
        subOrders: [],
        events: [],
        errors: ['No vendor assignments found for order items']
      }
    }
    
    // Create sub-orders for each vendor
    const subOrders: VendorSubOrder[] = []
    let vendorIndex = 1
    
    for (const [vendorId, items] of vendorItems) {
      const config = commissionConfigs.get(vendorId)
      
      if (!config) {
        errors.push(`Missing commission config for vendor ${vendorId}`)
        continue
      }
      
      const subOrder = this.createSubOrder(
        parentOrder,
        vendorId,
        items,
        config,
        vendorIndex,
        options?.subOrderPrefix
      )
      
      subOrders.push(subOrder)
      
      // Create event for sub-order creation
      events.push({
        eventType: 'mvm.suborder.created',
        payload: {
          tenantId: parentOrder.tenantId,
          vendorId,
          parentOrderId: parentOrder.id,
          subOrderId: subOrder.id,
          subOrderNumber: subOrder.subOrderNumber,
          grandTotal: subOrder.grandTotal,
          commissionAmount: subOrder.commissionAmount,
          vendorEarnings: subOrder.vendorEarnings,
          itemCount: items.length
        },
        idempotencyKey: `mvm.suborder.created_${subOrder.id}`
      })
      
      vendorIndex++
    }
    
    // Create order split event
    events.unshift({
      eventType: 'mvm.order.split',
      payload: {
        tenantId: parentOrder.tenantId,
        parentOrderId: parentOrder.id,
        parentOrderNumber: parentOrder.orderNumber,
        subOrderCount: subOrders.length,
        vendorIds: Array.from(vendorItems.keys()),
        totalGrandTotal: parentOrder.grandTotal,
        totalCommission: subOrders.reduce((sum, so) => sum + so.commissionAmount, 0),
        totalVendorEarnings: subOrders.reduce((sum, so) => sum + so.vendorEarnings, 0)
      },
      idempotencyKey: `mvm.order.split_${parentOrder.id}`
    })
    
    return {
      success: errors.length === 0,
      parentOrderId: parentOrder.id,
      parentOrderNumber: parentOrder.orderNumber,
      subOrders,
      events,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  /**
   * Group order items by vendor
   */
  private static groupItemsByVendor(
    items: OrderLineItem[],
    vendorAssignments: Map<string, string>
  ): Map<string, OrderLineItem[]> {
    const grouped = new Map<string, OrderLineItem[]>()
    
    for (const item of items) {
      // Get vendor from item or from assignments map
      const vendorId = item.vendorId || vendorAssignments.get(item.productId)
      
      if (!vendorId) {
        // Item not assigned to any vendor - skip
        continue
      }
      
      if (!grouped.has(vendorId)) {
        grouped.set(vendorId, [])
      }
      
      grouped.get(vendorId)!.push(item)
    }
    
    return grouped
  }
  
  /**
   * Create a sub-order for a vendor
   */
  private static createSubOrder(
    parentOrder: ParentOrder,
    vendorId: string,
    items: OrderLineItem[],
    commissionConfig: CommissionConfig,
    vendorIndex: number,
    subOrderPrefix?: string
  ): VendorSubOrder {
    const subOrderId = this.generateId()
    const prefix = subOrderPrefix || 'V'
    const subOrderNumber = `${parentOrder.orderNumber}-${prefix}${vendorIndex}`
    
    // Calculate sub-order totals
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const discountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0)
    
    // Proportional shipping and tax
    const parentSubtotal = parentOrder.subtotal || 1
    const proportion = subtotal / parentSubtotal
    const shippingTotal = Math.round(parentOrder.shippingTotal * proportion * 100) / 100
    const taxTotal = Math.round(parentOrder.taxTotal * proportion * 100) / 100
    
    const grandTotal = subtotal + shippingTotal + taxTotal - discountTotal
    
    // Calculate commission
    const commissionRate = this.getEffectiveCommissionRate(vendorId, commissionConfig)
    const commissionAmount = Math.round((grandTotal * commissionRate / 100) * 100) / 100
    const vendorEarnings = Math.round((grandTotal - commissionAmount) * 100) / 100
    
    // Create sub-order items with commission
    const subOrderItems: VendorSubOrderItem[] = items.map(item => {
      const itemCommissionRate = this.getItemCommissionRate(item, commissionConfig)
      const itemCommissionAmount = Math.round((item.lineTotal * itemCommissionRate / 100) * 100) / 100
      
      return {
        id: this.generateId(),
        subOrderId,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        discountAmount: item.discountAmount,
        commissionRate: itemCommissionRate,
        commissionAmount: itemCommissionAmount
      }
    })
    
    return {
      id: subOrderId,
      tenantId: parentOrder.tenantId,
      vendorId,
      parentOrderId: parentOrder.id,
      parentOrderNumber: parentOrder.orderNumber,
      subOrderNumber,
      status: 'PENDING',
      items: subOrderItems,
      subtotal,
      shippingTotal,
      taxTotal,
      discountTotal,
      grandTotal,
      commissionRate,
      commissionAmount,
      vendorEarnings,
      customerName: parentOrder.customerName,
      shippingAddress: parentOrder.shippingAddress,
      shippingMethod: parentOrder.shippingMethod,
      createdAt: new Date().toISOString()
    }
  }
  
  /**
   * Get effective commission rate for a vendor
   */
  private static getEffectiveCommissionRate(
    vendorId: string,
    config: CommissionConfig
  ): number {
    // Priority: vendor override > tier rate > default
    if (config.vendorCommissionRate !== undefined) {
      return config.vendorCommissionRate
    }
    if (config.tierCommissionRate !== undefined) {
      return config.tierCommissionRate
    }
    return config.defaultRate
  }
  
  /**
   * Get commission rate for a specific item
   */
  private static getItemCommissionRate(
    item: OrderLineItem,
    config: CommissionConfig
  ): number {
    // Check product-specific override
    if (config.productOverrides.has(item.productId)) {
      return config.productOverrides.get(item.productId)!
    }
    
    // Fall back to vendor rate
    return this.getEffectiveCommissionRate(config.vendorId, config)
  }
  
  /**
   * Generate unique ID
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `${timestamp}${random}`
  }
  
  // ==========================================================================
  // SUB-ORDER STATUS MANAGEMENT
  // ==========================================================================
  
  /**
   * Sub-order status transitions
   */
  static readonly STATUS_TRANSITIONS: Record<VendorSubOrderStatus, VendorSubOrderStatus[]> = {
    'PENDING': ['ACCEPTED', 'CANCELLED'],
    'ACCEPTED': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['READY_TO_SHIP', 'CANCELLED'],
    'READY_TO_SHIP': ['SHIPPED', 'CANCELLED'],
    'SHIPPED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': ['REFUNDED'],
    'CANCELLED': ['REFUNDED'],
    'REFUNDED': []
  }
  
  /**
   * Check if status transition is valid
   */
  static canTransitionStatus(
    from: VendorSubOrderStatus,
    to: VendorSubOrderStatus
  ): { allowed: boolean; reason?: string } {
    if (this.STATUS_TRANSITIONS[from].includes(to)) {
      return { allowed: true }
    }
    
    return {
      allowed: false,
      reason: `Cannot transition sub-order from ${from} to ${to}`
    }
  }
  
  /**
   * Get events for status transition
   */
  static getStatusTransitionEvents(
    subOrder: VendorSubOrder,
    newStatus: VendorSubOrderStatus
  ): OrderSplitEvent[] {
    const events: OrderSplitEvent[] = []
    const timestamp = Date.now().toString(36)
    
    // Base event
    events.push({
      eventType: `mvm.suborder.status_changed`,
      payload: {
        tenantId: subOrder.tenantId,
        vendorId: subOrder.vendorId,
        subOrderId: subOrder.id,
        subOrderNumber: subOrder.subOrderNumber,
        parentOrderId: subOrder.parentOrderId,
        previousStatus: subOrder.status,
        newStatus,
        timestamp: new Date().toISOString()
      },
      idempotencyKey: `mvm.suborder.status_${subOrder.id}_${newStatus}_${timestamp}`
    })
    
    // Status-specific events
    switch (newStatus) {
      case 'ACCEPTED':
        events.push({
          eventType: 'mvm.vendor.order_accepted',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber
          },
          idempotencyKey: `mvm.vendor.order_accepted_${subOrder.id}`
        })
        break
        
      case 'SHIPPED':
        events.push({
          eventType: 'mvm.suborder.shipped',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            parentOrderId: subOrder.parentOrderId
          },
          idempotencyKey: `mvm.suborder.shipped_${subOrder.id}`
        })
        break
        
      case 'DELIVERED':
        events.push({
          eventType: 'mvm.suborder.delivered',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            parentOrderId: subOrder.parentOrderId,
            vendorEarnings: subOrder.vendorEarnings,
            commissionAmount: subOrder.commissionAmount
          },
          idempotencyKey: `mvm.suborder.delivered_${subOrder.id}`
        })
        // Also emit commission earned event
        events.push({
          eventType: 'mvm.commission.earned',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            commissionAmount: subOrder.commissionAmount,
            commissionRate: subOrder.commissionRate,
            orderTotal: subOrder.grandTotal
          },
          idempotencyKey: `mvm.commission.earned_${subOrder.id}`
        })
        break
        
      case 'CANCELLED':
        events.push({
          eventType: 'mvm.suborder.cancelled',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            parentOrderId: subOrder.parentOrderId
          },
          idempotencyKey: `mvm.suborder.cancelled_${subOrder.id}`
        })
        break
        
      case 'REFUNDED':
        events.push({
          eventType: 'mvm.suborder.refunded',
          payload: {
            tenantId: subOrder.tenantId,
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            subOrderNumber: subOrder.subOrderNumber,
            refundAmount: subOrder.grandTotal
          },
          idempotencyKey: `mvm.suborder.refunded_${subOrder.id}`
        })
        break
    }
    
    return events
  }
  
  // ==========================================================================
  // AGGREGATION HELPERS
  // ==========================================================================
  
  /**
   * Check if all sub-orders are fulfilled
   */
  static isOrderFullyFulfilled(subOrders: VendorSubOrder[]): boolean {
    return subOrders.every(so => so.status === 'DELIVERED')
  }
  
  /**
   * Check if any sub-order is cancelled
   */
  static hasAnyCancellation(subOrders: VendorSubOrder[]): boolean {
    return subOrders.some(so => so.status === 'CANCELLED' || so.status === 'REFUNDED')
  }
  
  /**
   * Get parent order fulfillment percentage
   */
  static getOrderFulfillmentPercent(subOrders: VendorSubOrder[]): number {
    if (subOrders.length === 0) return 0
    
    const deliveredCount = subOrders.filter(so => so.status === 'DELIVERED').length
    return Math.round((deliveredCount / subOrders.length) * 100)
  }
  
  /**
   * Calculate total commission across all sub-orders
   */
  static getTotalCommission(subOrders: VendorSubOrder[]): number {
    return subOrders.reduce((sum, so) => sum + so.commissionAmount, 0)
  }
  
  /**
   * Calculate total vendor earnings across all sub-orders
   */
  static getTotalVendorEarnings(subOrders: VendorSubOrder[]): number {
    return subOrders.reduce((sum, so) => sum + so.vendorEarnings, 0)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { OrderSplittingEngine }
