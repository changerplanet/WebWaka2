/**
 * SVM Orders API - Database Persistent
 * 
 * POST /api/svm/orders - Create a new order from cart or items
 * GET /api/svm/orders - List orders for tenant/customer
 * 
 * Uses Prisma for database persistence.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface OrderItemInput {
  productId: string
  variantId?: string
  productName: string
  sku?: string
  variantName?: string
  imageUrl?: string
  unitPrice: number
  quantity: number
}

function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `ORD-${year}${month}${day}-${seq}`
}

/**
 * POST /api/svm/orders
 * Create a new order - can be from cart or direct items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantId, 
      customerId, 
      cartId, // Optional: create from existing cart
      customerEmail,
      customerPhone,
      customerName,
      items, // Optional if cartId provided
      shippingAddress, 
      billingAddress,
      shippingMethod,
      shippingCarrier,
      channel = 'WEB',
      currency = 'USD',
      shippingTotal = 0,
      taxTotal = 0,
      discountTotal = 0,
      promotionCode,
      promotionId,
      customerNotes,
      ipAddress,
      userAgent
    } = body

    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'shippingAddress is required' },
        { status: 400 }
      )
    }

    let orderItems: OrderItemInput[] = items || []
    let sourceCartId: string | null = null
    let resolvedEmail = customerEmail

    // If cartId provided, get items from cart
    if (cartId) {
      const cart = await prisma.svmCart.findUnique({
        where: { id: cartId },
        include: { items: true }
      })

      if (!cart) {
        return NextResponse.json(
          { success: false, error: 'Cart not found' },
          { status: 404 }
        )
      }

      if (cart.tenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: 'Cart does not belong to this tenant' },
          { status: 403 }
        )
      }

      if (cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Cart is empty' },
          { status: 400 }
        )
      }

      orderItems = cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        productName: item.productName,
        sku: item.sku || undefined,
        variantName: item.variantName || undefined,
        imageUrl: item.imageUrl || undefined,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity
      }))
      
      sourceCartId = cartId
      
      // Use cart email if not provided
      if (!resolvedEmail && cart.email) {
        resolvedEmail = cart.email
      }
    }

    // Validate items
    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required (provide items array or cartId)' },
        { status: 400 }
      )
    }

    // Email is required
    if (!resolvedEmail) {
      return NextResponse.json(
        { success: false, error: 'customerEmail is required' },
        { status: 400 }
      )
    }

    for (const item of orderItems) {
      if (!item.productId || !item.productName || item.unitPrice === undefined || !item.quantity) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId, productName, unitPrice, and quantity' },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const grandTotal = subtotal + shippingTotal + taxTotal - discountTotal

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.svmOrder.create({
        data: {
          tenantId,
          orderNumber: generateOrderNumber(),
          customerId: customerId || null,
          customerEmail: resolvedEmail,
          customerPhone: customerPhone || null,
          customerName: customerName || null,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'UNFULFILLED',
          sourceCartId: sourceCartId,
          channel,
          currency,
          subtotal,
          shippingTotal,
          taxTotal,
          discountTotal,
          grandTotal,
          promotionCode: promotionCode || null,
          promotionId: promotionId || null,
          shippingAddress,
          billingAddress: billingAddress || null,
          shippingMethod: shippingMethod || null,
          shippingCarrier: shippingCarrier || null,
          customerNotes: customerNotes || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              productName: item.productName,
              sku: item.sku || null,
              variantName: item.variantName || null,
              imageUrl: item.imageUrl || null,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.unitPrice * item.quantity,
              discountAmount: 0,
              taxAmount: 0
            }))
          }
        },
        include: { items: true }
      })

      // If created from cart, mark cart as converted
      if (sourceCartId) {
        await tx.svmCart.update({
          where: { id: sourceCartId },
          data: { 
            status: 'CONVERTED',
            convertedOrderId: newOrder.id
          }
        })
      }

      return newOrder
    })

    // Emit order created event (logged)
    console.log('[SVM] Order Event: svm.order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tenantId,
      customerEmail: order.customerEmail,
      itemCount: order.items.length,
      grandTotal: Number(order.grandTotal)
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        tenantId: order.tenantId,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        channel: order.channel,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount)
        })),
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        taxTotal: Number(order.taxTotal),
        discountTotal: Number(order.discountTotal),
        grandTotal: Number(order.grandTotal),
        promotionCode: order.promotionCode,
        currency: order.currency,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        shippingMethod: order.shippingMethod,
        customerNotes: order.customerNotes,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      },
      events: [{
        eventId: `evt_${Date.now().toString(36)}`,
        eventType: 'svm.order.created',
        timestamp: new Date().toISOString()
      }]
    }, { status: 201 })

  } catch (error) {
    console.error('[SVM] Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/orders
 * List orders for the tenant, optionally filtered by customer/status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const customerEmail = searchParams.get('customerEmail')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const fulfillmentStatus = searchParams.get('fulfillmentStatus')
    const orderNumber = searchParams.get('orderNumber')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = { tenantId }
    
    if (customerId) where.customerId = customerId
    if (customerEmail) where.customerEmail = customerEmail
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus
    if (orderNumber) where.orderNumber = { contains: orderNumber, mode: 'insensitive' }

    // Get total count
    const total = await prisma.svmOrder.count({ where })

    // Get orders with items
    const orders = await prisma.svmOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        tenantId: order.tenantId,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        channel: order.channel,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount),
          fulfilledQuantity: item.fulfilledQuantity,
          refundedQuantity: item.refundedQuantity
        })),
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        taxTotal: Number(order.taxTotal),
        discountTotal: Number(order.discountTotal),
        grandTotal: Number(order.grandTotal),
        refundedAmount: Number(order.refundedAmount),
        promotionCode: order.promotionCode,
        currency: order.currency,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        shippingMethod: order.shippingMethod,
        shippingCarrier: order.shippingCarrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        paidAt: order.paidAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        refundedAt: order.refundedAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      })),
      pagination: {
        limit,
        offset,
        total
      },
      filters: {
        tenantId,
        customerId: customerId || null,
        customerEmail: customerEmail || null,
        status: status || 'all',
        paymentStatus: paymentStatus || 'all',
        fulfillmentStatus: fulfillmentStatus || 'all',
        orderNumber: orderNumber || null
      }
    })

  } catch (error) {
    console.error('[SVM] Error listing orders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
