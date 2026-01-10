/**
 * MVM Order Split Service
 * 
 * Handles splitting customer orders into vendor sub-orders.
 * Core MVM capability for multi-vendor order orchestration.
 * 
 * @module lib/mvm/order-split-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { Prisma, MvmSubOrderStatus } from '@prisma/client'
import { VendorService } from './vendor-service'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateParentOrderInput {
  tenantId: string
  platformInstanceId?: string
  customerId?: string
  customerEmail: string
  customerPhone?: string
  customerName?: string
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  items: ParentOrderItemInput[]
  paymentMethod?: string
  promotionCode?: string
  promotionId?: string
  customerNotes?: string
  channel?: string
  sourceCartId?: string
  ipAddress?: string
  userAgent?: string
}

export interface ShippingAddress {
  firstName?: string
  lastName?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode?: string
  country: string
  phone?: string
}

export interface ParentOrderItemInput {
  vendorId: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  discount?: number
}

export interface SubOrderSummary {
  id: string
  subOrderNumber: string
  vendorId: string
  vendorName: string
  status: MvmSubOrderStatus
  itemCount: number
  subtotal: number
  commissionAmount: number
  vendorPayout: number
}

// ============================================================================
// ORDER NUMBER GENERATION
// ============================================================================

/**
 * Generate unique order number
 * Format: MVM-YYYYMMDD-XXXXX (e.g., MVM-20251215-A3B7K)
 */
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `MVM-${dateStr}-${random}`
}

/**
 * Generate unique sub-order number
 * Format: SUB-XXXXX-V001 (parent suffix + vendor index)
 */
function generateSubOrderNumber(parentSuffix: string, vendorIndex: number): string {
  return `SUB-${parentSuffix}-V${String(vendorIndex + 1).padStart(3, '0')}`
}

// ============================================================================
// TAX CALCULATION (Nigeria-First)
// ============================================================================

const NIGERIA_VAT_RATE = 0.075 // 7.5%

function calculateVAT(amount: number): number {
  return Math.round(amount * NIGERIA_VAT_RATE * 100) / 100
}

// ============================================================================
// ORDER SPLIT SERVICE
// ============================================================================

export const OrderSplitService = {
  /**
   * Create a parent order and split into vendor sub-orders
   */
  async createAndSplit(input: CreateParentOrderInput): Promise<{
    parentOrderId: string
    orderNumber: string
    subOrders: SubOrderSummary[]
  }> {
    const orderNumber = generateOrderNumber()
    const orderSuffix = orderNumber.split('-').pop()!
    
    // Group items by vendor
    const itemsByVendor = new Map<string, ParentOrderItemInput[]>()
    for (const item of input.items) {
      const existing = itemsByVendor.get(item.vendorId) || []
      existing.push(item)
      itemsByVendor.set(item.vendorId, existing)
    }
    
    // Calculate totals
    let subtotal = 0
    let discountTotal = 0
    
    for (const item of input.items) {
      const lineTotal = item.unitPrice * item.quantity
      subtotal += lineTotal
      discountTotal += (item.discount || 0) * item.quantity
    }
    
    const taxTotal = calculateVAT(subtotal - discountTotal)
    const shippingTotal = 0 // Will be calculated by shipping service
    const grandTotal = subtotal - discountTotal + taxTotal + shippingTotal
    
    // Create parent order
    const parentOrder = await prisma.mvm_parent_order.create({
      data: {
        tenantId: input.tenantId,
        platformInstanceId: input.platformInstanceId,
        orderNumber,
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        status: 'PENDING',
        shippingAddress: input.shippingAddress as unknown as object,
        billingAddress: input.billingAddress as unknown as object,
        currency: 'NGN',
        subtotal,
        discountTotal,
        shippingTotal,
        taxTotal,
        grandTotal,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'PENDING',
        promotionCode: input.promotionCode,
        promotionId: input.promotionId,
        channel: input.channel || 'WEB',
        sourceCartId: input.sourceCartId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        customerNotes: input.customerNotes,
        items: {
          create: input.items.map((item: any) => ({
            vendorId: item.vendorId,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: calculateVAT((item.unitPrice - (item.discount || 0)) * item.quantity),
            lineTotal: (item.unitPrice - (item.discount || 0)) * item.quantity
          }))
        }
      }
    })
    
    // Create sub-orders for each vendor
    const subOrders: SubOrderSummary[] = []
    let vendorIndex = 0
    
    for (const [vendorId, items] of Array.from(itemsByVendor.entries())) {
      const vendor = await prisma.mvm_vendor.findUnique({
        where: { id: vendorId },
        select: { name: true }
      })
      
      // Calculate sub-order totals
      let vendorSubtotal = 0
      for (const item of items) {
        vendorSubtotal += (item.unitPrice - (item.discount || 0)) * item.quantity
      }
      
      const vendorTax = calculateVAT(vendorSubtotal)
      const vendorGrandTotal = vendorSubtotal + vendorTax
      
      // Get commission rate for this vendor
      const commissionRate = await VendorService.getEffectiveCommissionRate(input.tenantId, vendorId)
      const commissionAmount = Math.round(vendorSubtotal * (commissionRate / 100) * 100) / 100
      const vendorPayout = vendorGrandTotal - commissionAmount - vendorTax
      
      const subOrderNumber = generateSubOrderNumber(orderSuffix, vendorIndex)
      
      // Sanitize customer info for vendor
      const sanitizedAddress = input.shippingAddress
      
      const subOrder = await prisma.mvm_sub_order.create({
        data: withPrismaDefaults({
          tenantId: input.tenantId,
          parentOrderId: parentOrder.id,
          vendorId,
          subOrderNumber,
          status: 'PENDING',
          customerName: input.customerName,
          shippingCity: sanitizedAddress.city,
          shippingState: sanitizedAddress.state,
          shippingCountry: sanitizedAddress.country,
          currency: 'NGN',
          subtotal: vendorSubtotal,
          shippingTotal: 0,
          taxTotal: vendorTax,
          discountTotal: items.reduce((sum: any, i: any) => sum + ((i.discount || 0) * i.quantity), 0),
          grandTotal: vendorGrandTotal,
          commissionRate,
          commissionAmount,
          vendorPayout,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              tax: calculateVAT((item.unitPrice - (item.discount || 0)) * item.quantity),
              lineTotal: (item.unitPrice - (item.discount || 0)) * item.quantity
            }))
          }
        }),
        include: { items: true }
      })
      
      subOrders.push({
        id: subOrder.id,
        subOrderNumber: subOrder.subOrderNumber,
        vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        status: subOrder.status,
        itemCount: items.length,
        subtotal: vendorSubtotal,
        commissionAmount,
        vendorPayout
      })
      
      vendorIndex++
    }
    
    // Update parent order status to SPLIT
    await prisma.mvm_parent_order.update({
      where: { id: parentOrder.id },
      data: { 
        status: 'SPLIT',
        splitAt: new Date()
      }
    })
    
    return {
      parentOrderId: parentOrder.id,
      orderNumber,
      subOrders
    }
  },
  
  /**
   * Get parent order with sub-orders
   */
  async getParentOrder(orderId: string) {
    return prisma.mvm_parent_order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        subOrders: {
          include: {
            items: true,
            vendor: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    })
  },
  
  /**
   * Get parent order by order number
   */
  async getByOrderNumber(orderNumber: string) {
    return prisma.mvm_parent_order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        subOrders: {
          include: {
            items: true,
            vendor: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    })
  },
  
  /**
   * Get sub-order by ID
   */
  async getSubOrder(subOrderId: string) {
    return prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      include: {
        items: true,
        vendor: { select: { id: true, name: true, slug: true } },
        parentOrder: {
          select: {
            orderNumber: true,
            customerEmail: true,
            customerPhone: true,
            shippingAddress: true
          }
        }
      }
    })
  },
  
  /**
   * Get sub-orders for a vendor
   */
  async getVendorSubOrders(
    vendorId: string,
    filters?: {
      status?: MvmSubOrderStatus
      page?: number
      pageSize?: number
    }
  ) {
    const { status, page = 1, pageSize = 20 } = filters || {}
    
    const where: Prisma.mvm_sub_orderWhereInput = {
      vendorId,
      ...(status && { status })
    }
    
    const [subOrders, total] = await Promise.all([
      prisma.mvm_sub_order.findMany({
        where,
        include: {
          items: true,
          parentOrder: {
            select: {
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              paymentStatus: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_sub_order.count({ where })
    ])
    
    return {
      subOrders: subOrders.map(so => ({
        id: so.id,
        subOrderNumber: so.subOrderNumber,
        parentOrderNumber: so.parentOrder.orderNumber,
        customerName: so.customerName,
        status: so.status,
        itemCount: so.items.length,
        subtotal: so.subtotal.toNumber(),
        grandTotal: so.grandTotal.toNumber(),
        commissionAmount: so.commissionAmount.toNumber(),
        vendorPayout: so.vendorPayout.toNumber(),
        createdAt: so.createdAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Get sub-order counts by status for vendor dashboard
   */
  async getVendorOrderCounts(vendorId: string) {
    const counts = await prisma.mvm_sub_order.groupBy({
      by: ['status'],
      where: { vendorId },
      _count: { status: true }
    })
    
    const result: Record<MvmSubOrderStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    }
    
    for (const count of counts) {
      result[count.status] = count._count.status
    }
    
    return result
  },
  
  /**
   * Update parent order payment status
   */
  async updatePaymentStatus(
    orderId: string,
    status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED',
    paymentRef?: string
  ) {
    const update: Prisma.mvm_parent_orderUpdateInput = {
      paymentStatus: status,
      ...(paymentRef && { paymentRef }),
      ...(status === 'CAPTURED' && { paidAt: new Date() })
    }
    
    return prisma.mvm_parent_order.update({
      where: { id: orderId },
      data: update
    })
  },
  
  /**
   * Cancel parent order and all sub-orders
   */
  async cancelOrder(orderId: string, reason: string) {
    const now = new Date()
    
    // Cancel all sub-orders
    await prisma.mvm_sub_order.updateMany({
      where: { parentOrderId: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelReason: reason
      }
    })
    
    // Cancel parent order
    return prisma.mvm_parent_order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelReason: reason
      }
    })
  },
  
  /**
   * Check if all sub-orders are complete
   */
  async checkAllSubOrdersComplete(parentOrderId: string): Promise<boolean> {
    const subOrders = await prisma.mvm_sub_order.findMany({
      where: { parentOrderId },
      select: { status: true }
    })
    
    return subOrders.every(so => 
      so.status === 'DELIVERED' || so.status === 'CANCELLED' || so.status === 'REFUNDED'
    )
  },
  
  /**
   * Mark parent order as completed if all sub-orders done
   */
  async tryCompleteParentOrder(parentOrderId: string): Promise<boolean> {
    const allComplete = await this.checkAllSubOrdersComplete(parentOrderId)
    
    if (allComplete) {
      await prisma.mvm_parent_order.update({
        where: { id: parentOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
      return true
    }
    
    return false
  }
}
