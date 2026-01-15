/**
 * MVM ORDER SPLITTING SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * Splits marketplace parent orders into vendor-specific sub-orders
 * with isolated fulfillment and unified customer view.
 */

import { prisma } from '@/lib/prisma';

export interface ParentOrderInput {
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    landmark?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    vendorId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: string;
  notes?: string;
}

export interface SubOrderSummary {
  id: string;
  vendorId: string;
  vendorName: string;
  status: string;
  itemCount: number;
  subtotal: number;
  commission: number;
  vendorPayout: number;
}

export class OrderSplittingService {
  /**
   * Create parent order and split into vendor sub-orders
   */
  static async createAndSplitOrder(
    tenantId: string,
    input: ParentOrderInput
  ) {
    const orderNumber = await this.generateOrderNumber(tenantId, 'MKT');

    const itemsByVendor = this.groupItemsByVendor(input.items);

    const result = await prisma.$transaction(async (tx) => {
      const parentOrder = await tx.mvm_parent_order.create({
        data: {
          tenantId,
          orderNumber,
          customerId: input.customerId,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          currency: 'NGN',
          subtotal: input.subtotal,
          shippingTotal: input.shippingTotal,
          taxTotal: input.taxTotal,
          discountTotal: input.discountTotal,
          grandTotal: input.grandTotal,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PENDING',
          status: 'PENDING',
          customerNotes: input.notes,
        }
      });

      for (const item of input.items) {
        await tx.mvm_parent_order_item.create({
          data: {
            parentOrderId: parentOrder.id,
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId || null,
            vendorId: item.vendorId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            lineTotal: item.quantity * item.unitPrice - (item.discount || 0),
          }
        });
      }

      const subOrders: SubOrderSummary[] = [];
      let subOrderIndex = 1;

      for (const [vendorId, vendorItems] of Object.entries(itemsByVendor)) {
        const vendor = await tx.mvm_vendor.findUnique({
          where: { id: vendorId },
          select: { name: true, commissionOverride: true, tierId: true }
        });

        const subOrderNumber = `${orderNumber}-V${String(subOrderIndex).padStart(2, '0')}`;
        
        const vendorSubtotal = vendorItems.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice - (item.discount || 0)),
          0
        );

        const commissionRate = vendor?.commissionOverride 
          ? Number(vendor.commissionOverride) 
          : 10;
        const commissionAmount = vendorSubtotal * (commissionRate / 100);
        const vendorPayout = vendorSubtotal - commissionAmount;

        const subOrder = await tx.mvm_sub_order.create({
          data: {
            tenantId,
            parentOrderId: parentOrder.id,
            vendorId,
            subOrderNumber,
            status: 'PENDING',
            customerName: input.customerName,
            shippingCity: input.shippingAddress.city,
            shippingState: input.shippingAddress.state,
            shippingCountry: input.shippingAddress.country,
            currency: 'NGN',
            subtotal: vendorSubtotal,
            shippingTotal: 0,
            taxTotal: 0,
            discountTotal: vendorItems.reduce((sum, i) => sum + (i.discount || 0), 0),
            grandTotal: vendorSubtotal,
            commissionRate,
            commissionAmount,
            vendorPayout,
          }
        });

        for (const item of vendorItems) {
          await tx.mvm_sub_order_item.create({
            data: {
              subOrderId: subOrder.id,
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              lineTotal: item.quantity * item.unitPrice - (item.discount || 0),
            }
          });
        }

        subOrders.push({
          id: subOrder.id,
          vendorId,
          vendorName: vendor?.name || 'Unknown Vendor',
          status: subOrder.status,
          itemCount: vendorItems.length,
          subtotal: vendorSubtotal,
          commission: commissionAmount,
          vendorPayout,
        });

        subOrderIndex++;
      }

      return {
        parentOrder,
        subOrders
      };
    });

    return result;
  }

  /**
   * Get parent order with all sub-orders (customer view)
   */
  static async getParentOrder(orderId: string) {
    return prisma.mvm_parent_order.findUnique({
      where: { id: orderId },
    });
  }

  /**
   * Get sub-orders for a parent order
   */
  static async getSubOrdersForParent(parentOrderId: string) {
    return prisma.mvm_sub_order.findMany({
      where: { parentOrderId },
    });
  }

  /**
   * Get vendor's sub-orders (vendor view - isolated)
   */
  static async getVendorSubOrders(
    tenantId: string,
    vendorId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { status, limit = 50, offset = 0 } = options || {};

    return prisma.mvm_sub_order.findMany({
      where: {
        tenantId,
        vendorId,
        ...(status && { status: status as never })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get sub-order items
   */
  static async getSubOrderItems(subOrderId: string) {
    return prisma.mvm_sub_order_item.findMany({
      where: { subOrderId }
    });
  }

  /**
   * Update sub-order status (vendor action)
   */
  static async updateSubOrderStatus(
    subOrderId: string,
    vendorId: string,
    newStatus: 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ) {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId }
    });

    if (!subOrder || subOrder.vendorId !== vendorId) {
      throw new Error('Sub-order not found or access denied');
    }

    const updated = await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: {
        status: newStatus,
        ...(newStatus === 'SHIPPED' && { shippedAt: new Date() }),
        ...(newStatus === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(newStatus === 'CONFIRMED' && { confirmedAt: new Date() }),
      }
    });

    await this.updateParentOrderStatus(subOrder.parentOrderId);

    return updated;
  }

  /**
   * Update parent order status based on sub-orders
   */
  private static async updateParentOrderStatus(parentOrderId: string) {
    const subOrders = await prisma.mvm_sub_order.findMany({
      where: { parentOrderId },
      select: { status: true }
    });

    const statuses = subOrders.map(so => so.status);
    
    let newStatus: string;

    if (statuses.every(s => s === 'DELIVERED')) {
      newStatus = 'COMPLETED';
    } else if (statuses.every(s => s === 'CANCELLED')) {
      newStatus = 'CANCELLED';
    } else if (statuses.some(s => ['DELIVERED', 'SHIPPED'].includes(s))) {
      newStatus = 'SPLIT';
    } else if (statuses.some(s => ['CONFIRMED', 'PROCESSING'].includes(s))) {
      newStatus = 'SPLIT';
    } else {
      newStatus = 'PENDING';
    }

    await prisma.mvm_parent_order.update({
      where: { id: parentOrderId },
      data: { status: newStatus }
    });
  }

  /**
   * Get order summary for customer
   */
  static async getCustomerOrderSummary(parentOrderId: string) {
    const order = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
    });

    if (!order) return null;

    const subOrders = await prisma.mvm_sub_order.findMany({
      where: { parentOrderId },
      select: {
        id: true,
        vendorId: true,
        subOrderNumber: true,
        status: true,
        shippedAt: true,
        deliveredAt: true,
      }
    });

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      grandTotal: order.grandTotal,
      currency: order.currency,
      vendorOrders: subOrders.map(so => ({
        subOrderNumber: so.subOrderNumber,
        status: so.status,
        shippedAt: so.shippedAt,
        deliveredAt: so.deliveredAt,
      })),
      createdAt: order.createdAt,
    };
  }

  private static groupItemsByVendor(items: ParentOrderInput['items']) {
    const grouped: Record<string, typeof items> = {};
    
    for (const item of items) {
      if (!grouped[item.vendorId]) {
        grouped[item.vendorId] = [];
      }
      grouped[item.vendorId].push(item);
    }

    return grouped;
  }

  private static async generateOrderNumber(
    tenantId: string,
    prefix: string
  ): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.mvm_parent_order.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    return `${prefix}-${today}-${String(count + 1).padStart(5, '0')}`;
  }
}
