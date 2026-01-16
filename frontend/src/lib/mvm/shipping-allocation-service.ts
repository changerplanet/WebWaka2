/**
 * MVM Shipping Allocation Service
 * 
 * Wave K.3: Per-vendor shipping fee allocation for multi-vendor orders
 * 
 * Allocation strategies:
 * 1. Weight-based (if weight data available)
 * 2. Proportional by subtotal (fallback)
 * 
 * Constraints:
 * - No carrier integrations
 * - No dynamic pricing engines
 * - Deterministic allocation logic only
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface ShippingAllocation {
  vendorId: string
  vendorName: string
  subOrderId: string
  subOrderNumber: string
  subtotal: number
  shippingAmount: number
  shippingPercentage: number
  allocationMethod: 'WEIGHT_BASED' | 'PROPORTIONAL'
}

export interface OrderShippingSummary {
  parentOrderId: string
  orderNumber: string
  totalShipping: number
  allocations: ShippingAllocation[]
  allocationMethod: 'WEIGHT_BASED' | 'PROPORTIONAL'
}

export class ShippingAllocationService {
  /**
   * Calculate shipping allocation for an order at creation time
   * 
   * @param parentOrderId - The parent order ID
   * @param totalShipping - Total shipping amount for the order
   */
  static async allocateShipping(
    parentOrderId: string,
    totalShipping: number
  ): Promise<OrderShippingSummary> {
    const parentOrder = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      include: {
        subOrders: {
          include: {
            vendor: { select: { name: true } },
            items: true
          }
        }
      }
    })

    if (!parentOrder) {
      throw new Error('Parent order not found')
    }

    if (parentOrder.subOrders.length === 0) {
      return {
        parentOrderId,
        orderNumber: parentOrder.orderNumber,
        totalShipping,
        allocations: [],
        allocationMethod: 'PROPORTIONAL'
      }
    }

    const allocations = await this.calculateAllocations(
      parentOrder.subOrders,
      totalShipping
    )

    await this.persistAllocations(allocations)

    await prisma.mvm_parent_order.update({
      where: { id: parentOrderId },
      data: { shippingTotal: totalShipping }
    })

    return {
      parentOrderId,
      orderNumber: parentOrder.orderNumber,
      totalShipping,
      allocations,
      allocationMethod: allocations[0]?.allocationMethod || 'PROPORTIONAL'
    }
  }

  /**
   * Calculate shipping allocations for sub-orders
   */
  private static async calculateAllocations(
    subOrders: Array<{
      id: string
      subOrderNumber: string
      vendorId: string
      subtotal: Prisma.Decimal
      vendor: { name: string } | null
      items: Array<{ productId: string; quantity: number }>
    }>,
    totalShipping: number
  ): Promise<ShippingAllocation[]> {
    const hasWeightData = await this.checkWeightDataAvailable(subOrders)

    if (hasWeightData) {
      return this.allocateByWeight(subOrders, totalShipping)
    }

    return this.allocateProportionally(subOrders, totalShipping)
  }

  /**
   * Check if weight data is available for products in sub-orders
   */
  private static async checkWeightDataAvailable(
    subOrders: Array<{ items: Array<{ productId: string }> }>
  ): Promise<boolean> {
    const productIds = subOrders.flatMap(so => so.items.map(i => i.productId))
    
    if (productIds.length === 0) return false

    const productsWithWeight = await prisma.product.count({
      where: {
        id: { in: productIds },
        weight: { not: null, gt: 0 }
      }
    })

    return productsWithWeight === productIds.length
  }

  /**
   * Allocate shipping by weight (bulk fetch for N+1 prevention)
   */
  private static async allocateByWeight(
    subOrders: Array<{
      id: string
      subOrderNumber: string
      vendorId: string
      subtotal: Prisma.Decimal
      vendor: { name: string } | null
      items: Array<{ productId: string; quantity: number }>
    }>,
    totalShipping: number
  ): Promise<ShippingAllocation[]> {
    const allProductIds = subOrders.flatMap(so => so.items.map(i => i.productId))
    
    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, weight: true }
    })

    const productWeightMap = new Map<string, number>()
    for (const product of products) {
      if (product.weight && Number(product.weight) > 0) {
        productWeightMap.set(product.id, Number(product.weight))
      }
    }

    if (productWeightMap.size !== allProductIds.length) {
      return this.allocateProportionally(subOrders, totalShipping)
    }

    const vendorWeights: Map<string, { 
      subOrder: typeof subOrders[0]
      totalWeight: number 
    }> = new Map()

    for (const subOrder of subOrders) {
      let totalWeight = 0

      for (const item of subOrder.items) {
        const weight = productWeightMap.get(item.productId) || 0
        totalWeight += weight * item.quantity
      }

      vendorWeights.set(subOrder.id, { subOrder, totalWeight })
    }

    const grandTotalWeight = Array.from(vendorWeights.values())
      .reduce((sum, v) => sum + v.totalWeight, 0)

    if (grandTotalWeight === 0) {
      return this.allocateProportionally(subOrders, totalShipping)
    }

    return Array.from(vendorWeights.entries()).map(([_, data]) => {
      const percentage = grandTotalWeight > 0 
        ? data.totalWeight / grandTotalWeight 
        : 1 / subOrders.length
      const shippingAmount = Math.round(totalShipping * percentage * 100) / 100

      return {
        vendorId: data.subOrder.vendorId,
        vendorName: data.subOrder.vendor?.name || 'Unknown Vendor',
        subOrderId: data.subOrder.id,
        subOrderNumber: data.subOrder.subOrderNumber,
        subtotal: Number(data.subOrder.subtotal),
        shippingAmount,
        shippingPercentage: percentage * 100,
        allocationMethod: 'WEIGHT_BASED' as const
      }
    })
  }

  /**
   * Allocate shipping proportionally by subtotal (fallback)
   */
  private static allocateProportionally(
    subOrders: Array<{
      id: string
      subOrderNumber: string
      vendorId: string
      subtotal: Prisma.Decimal
      vendor: { name: string } | null
    }>,
    totalShipping: number
  ): ShippingAllocation[] {
    const grandTotal = subOrders.reduce(
      (sum, so) => sum + Number(so.subtotal),
      0
    )

    return subOrders.map(so => {
      const subtotal = Number(so.subtotal)
      const percentage = grandTotal > 0 ? subtotal / grandTotal : 1 / subOrders.length
      const shippingAmount = Math.round(totalShipping * percentage * 100) / 100

      return {
        vendorId: so.vendorId,
        vendorName: so.vendor?.name || 'Unknown Vendor',
        subOrderId: so.id,
        subOrderNumber: so.subOrderNumber,
        subtotal,
        shippingAmount,
        shippingPercentage: percentage * 100,
        allocationMethod: 'PROPORTIONAL' as const
      }
    })
  }

  /**
   * Persist shipping allocations to sub-orders
   */
  private static async persistAllocations(
    allocations: ShippingAllocation[]
  ): Promise<void> {
    for (const allocation of allocations) {
      await prisma.mvm_sub_order.update({
        where: { id: allocation.subOrderId },
        data: { shippingTotal: allocation.shippingAmount }
      })
    }
  }

  /**
   * Get shipping allocation summary for a parent order
   */
  static async getShippingSummary(
    parentOrderId: string
  ): Promise<OrderShippingSummary | null> {
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

    const totalShipping = Number(parentOrder.shippingTotal)
    const allocations: ShippingAllocation[] = parentOrder.subOrders.map(so => ({
      vendorId: so.vendorId,
      vendorName: so.vendor?.name || 'Unknown Vendor',
      subOrderId: so.id,
      subOrderNumber: so.subOrderNumber,
      subtotal: Number(so.subtotal),
      shippingAmount: Number(so.shippingTotal),
      shippingPercentage: totalShipping > 0 
        ? (Number(so.shippingTotal) / totalShipping) * 100 
        : 0,
      allocationMethod: 'PROPORTIONAL'
    }))

    return {
      parentOrderId,
      orderNumber: parentOrder.orderNumber,
      totalShipping,
      allocations,
      allocationMethod: 'PROPORTIONAL'
    }
  }
}
