/**
 * MVM Checkout API (Wave K.2)
 * 
 * Single canonical checkout endpoint for multi-vendor marketplace.
 * Creates parent order + vendor sub-orders, initiates payment.
 * 
 * @route POST /api/mvm/checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { MultiVendorCartService } from '@/lib/mvm/cart'
import { OrderSplitService, type CreateParentOrderInput, type ParentOrderItemInput } from '@/lib/mvm/order-split-service'
import { PaymentExecutionService } from '@/lib/payment-execution'
import { InventorySyncEngine } from '@/lib/commerce/inventory-engine/inventory-sync-engine'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

interface CheckoutRequestBody {
  tenantSlug: string
  customerEmail: string
  customerPhone?: string
  customerName?: string
  shippingAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode?: string
    country: string
    landmark?: string
  }
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'COD'
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequestBody = await request.json()
    const { 
      tenantSlug, 
      customerEmail, 
      customerPhone, 
      customerName, 
      shippingAddress, 
      paymentMethod, 
      notes 
    } = body

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug is required' },
        { status: 400 }
      )
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'customerEmail is required' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'paymentMethod is required' },
        { status: 400 }
      )
    }

    const tenantResult = await TenantContextResolver.resolveForMVM(tenantSlug)
    if (!tenantResult.success) {
      return NextResponse.json(
        { error: 'Tenant not found or MVM not enabled' },
        { status: 404 }
      )
    }

    const ctx = tenantResult.context
    const cartKey = getCartKey()

    if (!cartKey) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const prepResult = await MultiVendorCartService.prepareForCheckout(ctx, cartKey)

    if (!prepResult.success) {
      return NextResponse.json(
        { error: prepResult.error, code: prepResult.code },
        { status: 400 }
      )
    }

    const checkoutData = prepResult.data
    if (!checkoutData.cart || checkoutData.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (checkoutData.hasBlockingConflicts) {
      return NextResponse.json(
        { 
          error: 'Cart has blocking conflicts that must be resolved',
          conflicts: checkoutData.conflicts
        },
        { status: 400 }
      )
    }

    const inventorySufficiency = await validateInventorySufficiency(
      ctx.tenantId,
      checkoutData.cart.items
    )

    if (!inventorySufficiency.success) {
      return NextResponse.json(
        { 
          error: 'Some items are out of stock',
          insufficientItems: inventorySufficiency.insufficientItems
        },
        { status: 400 }
      )
    }

    let partnerId: string | null = null
    
    if (paymentMethod !== 'COD') {
      const partnerReferral = await prisma.partnerReferral.findUnique({
        where: { tenantId: ctx.tenantId },
        select: { partnerId: true }
      })

      if (!partnerReferral) {
        return NextResponse.json(
          { error: 'Partner configuration not found. Please contact support.' },
          { status: 400 }
        )
      }

      partnerId = partnerReferral.partnerId

      const paymentAvailability = await PaymentExecutionService.isAvailable(partnerId)
      if (!paymentAvailability.available && !ctx.isDemo) {
        return NextResponse.json(
          { error: 'Payment processing is not available. Please try Cash on Delivery or contact support.' },
          { status: 400 }
        )
      }
    }

    const orderItems: ParentOrderItemInput[] = checkoutData.cart.items.map(item => ({
      vendorId: item.vendorId,
      productId: item.productId,
      variantId: item.variantId || undefined,
      productName: item.productName,
      variantName: item.variantName || undefined,
      sku: undefined,
      imageUrl: item.productImage || undefined,
      quantity: item.quantity,
      unitPrice: item.priceSnapshot,
      discount: 0
    }))

    const orderInput: CreateParentOrderInput = {
      tenantId: ctx.tenantId,
      customerEmail,
      customerPhone,
      customerName,
      shippingAddress: {
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'NG'
      },
      items: orderItems,
      paymentMethod,
      customerNotes: notes,
      channel: 'WEB',
      sourceCartId: checkoutData.cart.id
    }

    let paymentResult: {
      success: boolean
      transactionId?: string
      reference?: string
      authorizationUrl?: string
      isDemo: boolean
      error?: string
    }

    if (paymentMethod === 'COD') {
      const orderResult = await OrderSplitService.createAndSplit(orderInput)
      await deductInventory(ctx.tenantId, checkoutData.cart.items)
      await OrderSplitService.updatePaymentStatus(orderResult.parentOrderId, 'PENDING')
      await MultiVendorCartService.clearCart(ctx, cartKey)

      return NextResponse.json({
        success: true,
        orderNumber: orderResult.orderNumber,
        parentOrderId: orderResult.parentOrderId,
        subOrders: orderResult.subOrders.map(so => ({
          id: so.id,
          subOrderNumber: so.subOrderNumber,
          vendorName: so.vendorName,
          status: so.status,
          itemCount: so.itemCount,
          subtotal: so.subtotal
        })),
        payment: {
          method: 'COD',
          status: 'DEFERRED',
          isDemo: ctx.isDemo
        },
        isDemo: ctx.isDemo
      })
    }

    const orderResult = await OrderSplitService.createAndSplit(orderInput)

    try {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/${tenantSlug}/orders?ref=${orderResult.orderNumber}`

      const paymentResponse = await PaymentExecutionService.initiatePayment({
        tenantId: ctx.tenantId,
        partnerId: partnerId!,
        amount: checkoutData.cart.totalAmount,
        currency: 'NGN',
        customerEmail,
        customerName,
        sourceModule: 'mvm',
        sourceType: 'mvm_order',
        sourceId: orderResult.parentOrderId,
        callbackUrl,
        metadata: {
          orderNumber: orderResult.orderNumber,
          vendorCount: orderResult.subOrders.length,
          paymentMethod
        }
      })

      if (!paymentResponse.success) {
        await OrderSplitService.cancelOrder(orderResult.parentOrderId, 'Payment initiation failed')
        
        return NextResponse.json(
          { 
            error: paymentResponse.error || 'Payment initiation failed. Please try again.',
            code: 'PAYMENT_FAILED'
          },
          { status: 400 }
        )
      }

      // P0-1 FIX: Inventory deduction moved to webhook success handler
      // Inventory is no longer deducted here - it will be deducted atomically
      // when payment is confirmed via webhook (see webhook-processor.ts)

      await OrderSplitService.updatePaymentStatus(
        orderResult.parentOrderId, 
        'PENDING',
        paymentResponse.reference
      )
      
      paymentResult = {
        success: true,
        transactionId: paymentResponse.transactionId,
        reference: paymentResponse.reference,
        authorizationUrl: paymentResponse.authorizationUrl,
        isDemo: paymentResponse.isDemo
      }

      await MultiVendorCartService.clearCart(ctx, cartKey)

      return NextResponse.json({
        success: true,
        orderNumber: orderResult.orderNumber,
        parentOrderId: orderResult.parentOrderId,
        subOrders: orderResult.subOrders.map(so => ({
          id: so.id,
          subOrderNumber: so.subOrderNumber,
          vendorName: so.vendorName,
          status: so.status,
          itemCount: so.itemCount,
          subtotal: so.subtotal
        })),
        payment: {
          method: paymentMethod,
          status: 'PENDING',
          reference: paymentResult.reference,
          authorizationUrl: paymentResult.authorizationUrl,
          isDemo: paymentResult.isDemo
        },
        isDemo: ctx.isDemo
      })
    } catch (paymentError) {
      console.error('[MVM Checkout API] Payment error, cancelling order:', paymentError)
      try {
        await OrderSplitService.cancelOrder(orderResult.parentOrderId, 'Payment processing error')
      } catch (cancelError) {
        console.error('[MVM Checkout API] Failed to cancel order after payment error:', cancelError)
      }
      
      return NextResponse.json(
        { error: 'Payment processing failed. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[MVM Checkout API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getCartKey(): string | null {
  const cookieStore = cookies()
  return cookieStore.get('mvm_cart_key')?.value || null
}

async function validateInventorySufficiency(
  tenantId: string,
  items: Array<{ productId: string; variantId: string | null; quantity: number; productName: string }>
): Promise<{
  success: boolean
  insufficientItems: Array<{ productId: string; productName: string; requested: number; available: number }>
}> {
  const insufficientItems: Array<{ productId: string; productName: string; requested: number; available: number }> = []
  
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId },
      include: {
        InventoryLevel: true,
        ProductChannelConfig: {
          where: { channel: 'MVM' }
        }
      }
    })

    if (!product) continue

    if (!product.trackInventory) continue

    const channelConfig = product.ProductChannelConfig[0]
    
    if (channelConfig?.inventoryMode === 'UNLIMITED') continue

    const totalAvailable = product.InventoryLevel.reduce(
      (sum, inv) => sum + inv.quantityAvailable, 
      0
    )

    let effectiveAvailable = totalAvailable

    if (channelConfig?.inventoryMode === 'ALLOCATED' && channelConfig.allocatedQuantity !== null) {
      effectiveAvailable = Math.min(channelConfig.allocatedQuantity, totalAvailable)
    }

    if (item.quantity > effectiveAvailable) {
      insufficientItems.push({
        productId: item.productId,
        productName: item.productName,
        requested: item.quantity,
        available: effectiveAvailable
      })
    }
  }

  return {
    success: insufficientItems.length === 0,
    insufficientItems
  }
}

async function deductInventory(
  tenantId: string,
  items: Array<{ productId: string; variantId: string | null; quantity: number }>
): Promise<void> {
  const engine = new InventorySyncEngine(tenantId)

  for (const item of items) {
    await engine.processEvent({
      id: `mvm_checkout_${Date.now()}_${item.productId}`,
      tenantId,
      channel: 'MVM',
      eventType: 'SALE',
      productId: item.productId,
      variantId: item.variantId,
      quantity: -item.quantity,
      referenceType: 'mvm_order',
      referenceId: `checkout_${Date.now()}`,
      serverTimestamp: new Date(),
      isOffline: false
    })
  }
}
