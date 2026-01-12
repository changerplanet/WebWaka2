export const dynamic = 'force-dynamic'

/**
 * SVM Cart API - Persistent Storage
 * 
 * POST /api/svm/cart - Create or update cart
 * GET /api/svm/cart - Get cart contents
 * DELETE /api/svm/cart - Clear cart
 * 
 * Uses Prisma for persistent cart storage with session recovery support.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SvmCartStatus } from '@prisma/client'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'

function generateCartId(): string {
  return `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

function calculateCartTotals(items: any[], discountRate: number = 0) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0)
  const discountTotal = subtotal * discountRate
  const taxTotal = (subtotal - discountTotal) * 0.08 // 8% tax
  const grandTotal = subtotal - discountTotal + taxTotal

  return {
    itemCount,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal
  }
}

/**
 * POST /api/svm/cart
 * Actions: ADD_ITEM, UPDATE_QUANTITY, REMOVE_ITEM, APPLY_PROMO, REMOVE_PROMO, SET_SHIPPING, MERGE_CART
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, customerId, sessionId, action, email } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!customerId && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Either customerId or sessionId is required' },
        { status: 400 }
      )
    }

    // Find or create cart
    let cart = await prisma.svm_carts.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          { customerId: customerId || undefined },
          { sessionId: sessionId || undefined }
        ].filter(Boolean)
      },
      include: { svm_cart_items: true }
    })

    // If customer has no cart but session does, try to find session cart
    if (!cart && customerId && sessionId) {
      const sessionCart = await prisma.svm_carts.findFirst({
        where: { tenantId, sessionId, status: 'ACTIVE' },
        include: { svm_cart_items: true }
      })
      
      if (sessionCart) {
        // Merge session cart to customer
        cart = await prisma.svm_carts.update({
          where: { id: sessionCart.id },
          data: { customerId, sessionId: null },
          include: { svm_cart_items: true }
        })
      }
    }

    // Create new cart if none exists
    if (!cart) {
      cart = await prisma.svm_carts.create({
        data: withPrismaDefaults({
          tenantId,
          customerId: customerId || null,
          sessionId: customerId ? null : sessionId,
          email: email || null,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }),
        include: { svm_cart_items: true }
      })
    }

    // Handle actions
    switch (action) {
      case 'ADD_ITEM': {
        const { productId, variantId, productName, variantName, sku, imageUrl, unitPrice, quantity = 1 } = body
        
        if (!productId || !productName || unitPrice === undefined) {
          return NextResponse.json(
            { success: false, error: 'productId, productName, and unitPrice are required' },
            { status: 400 }
          )
        }

        // Check if item already exists
        const existingItem = await prisma.svm_cart_items.findFirst({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId || null
          }
        })

        if (existingItem) {
          // Update quantity
          await prisma.svm_cart_items.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + quantity,
              lineTotal: (existingItem.quantity + quantity) * Number(existingItem.unitPrice)
            }
          })
        } else {
          // Add new item
          await prisma.svm_cart_items.create({
            data: withPrismaDefaults({
              cartId: cart.id,
              productId,
              variantId: variantId || null,
              productName,
              variantName: variantName || null,
              sku: sku || null,
              imageUrl: imageUrl || null,
              unitPrice,
              quantity,
              lineTotal: unitPrice * quantity
            })
          })
        }
        break
      }

      case 'UPDATE_QUANTITY': {
        const { productId, variantId, quantity } = body
        
        const item = await prisma.svm_cart_items.findFirst({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId || null
          }
        })

        if (!item) {
          return NextResponse.json(
            { success: false, error: 'Item not found in cart' },
            { status: 404 }
          )
        }

        if (quantity <= 0) {
          await prisma.svm_cart_items.delete({ where: { id: item.id } })
        } else {
          await prisma.svm_cart_items.update({
            where: { id: item.id },
            data: {
              quantity,
              lineTotal: quantity * Number(item.unitPrice)
            }
          })
        }
        break
      }

      case 'REMOVE_ITEM': {
        const { productId, variantId } = body
        
        await prisma.svm_cart_items.deleteMany({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId || null
          }
        })
        break
      }

      case 'APPLY_PROMO': {
        const { promotionCode } = body
        
        if (!promotionCode) {
          return NextResponse.json(
            { success: false, error: 'promotionCode is required' },
            { status: 400 }
          )
        }

        // Validate promotion code
        const promotion = await prisma.svm_promotions.findFirst({
          where: {
            tenantId,
            code: promotionCode.toUpperCase(),
            isActive: true,
            startsAt: { lte: new Date() },
            OR: [
              { endsAt: null },
              { endsAt: { gte: new Date() } }
            ]
          }
        })

        if (!promotion) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired promotion code' },
            { status: 400 }
          )
        }

        await prisma.svm_carts.update({
          where: { id: cart.id },
          data: {
            promotionCode: promotionCode.toUpperCase(),
            promotionId: promotion.id
          }
        })
        break
      }

      case 'REMOVE_PROMO': {
        await prisma.svm_carts.update({
          where: { id: cart.id },
          data: {
            promotionCode: null,
            promotionId: null,
            discountTotal: 0
          }
        })
        break
      }

      case 'SET_SHIPPING': {
        const { shippingAddress, shippingZoneId, shippingRateId, shippingMethod, shippingTotal } = body
        
        await prisma.svm_carts.update({
          where: { id: cart.id },
          data: {
            shippingAddress: shippingAddress || undefined,
            shippingZoneId: shippingZoneId || null,
            shippingRateId: shippingRateId || null,
            shippingMethod: shippingMethod || null,
            shippingTotal: shippingTotal ?? 0
          }
        })
        break
      }

      case 'SET_EMAIL': {
        const { email: cartEmail } = body
        
        await prisma.svm_carts.update({
          where: { id: cart.id },
          data: { email: cartEmail }
        })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Reload cart with updated items
    const updatedCart = await prisma.svm_carts.findUnique({
      where: { id: cart.id },
      include: { svm_cart_items: true }
    })

    if (!updatedCart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found after update' },
        { status: 500 }
      )
    }

    // Calculate totals
    const discountRate = updatedCart.promotionCode ? 0.1 : 0 // 10% for promo codes
    const totals = calculateCartTotals(updatedCart.svm_cart_items, discountRate)

    // Update cart totals
    await prisma.svm_carts.update({
      where: { id: updatedCart.id },
      data: {
        itemCount: totals.itemCount,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal + Number(updatedCart.shippingTotal)
      }
    })

    return NextResponse.json({
      success: true,
      cart: {
        id: updatedCart.id,
        tenantId: updatedCart.tenantId,
        customerId: updatedCart.customerId,
        sessionId: updatedCart.sessionId,
        email: updatedCart.email,
        items: updatedCart.svm_cart_items.map((item: { productId: string; variantId: string | null; productName: string; variantName: string | null; sku: string | null; imageUrl: string | null; unitPrice: { toString: () => string }; quantity: number; lineTotal: { toString: () => string }; discountAmount: { toString: () => string } }) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount)
        })),
        itemCount: totals.itemCount,
        subtotal: totals.subtotal,
        promotionCode: updatedCart.promotionCode,
        discountTotal: totals.discountTotal,
        shippingTotal: Number(updatedCart.shippingTotal),
        shippingMethod: updatedCart.shippingMethod,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal + Number(updatedCart.shippingTotal),
        shippingAddress: updatedCart.shippingAddress,
        createdAt: updatedCart.createdAt.toISOString(),
        updatedAt: updatedCart.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[SVM Cart] Error updating cart:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/cart
 * Retrieve cart by customerId or sessionId
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const sessionId = searchParams.get('sessionId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!customerId && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Either customerId or sessionId is required' },
        { status: 400 }
      )
    }

    // Find active cart
    const cart = await prisma.svm_carts.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          customerId ? { customerId } : {},
          sessionId ? { sessionId } : {}
        ].filter(o => Object.keys(o).length > 0)
      },
      include: { svm_cart_items: true }
    })

    if (!cart) {
      return NextResponse.json({
        success: true,
        cart: {
          id: null,
          tenantId,
          customerId,
          sessionId,
          email: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
          promotionCode: null,
          discountTotal: 0,
          shippingTotal: 0,
          shippingMethod: null,
          taxTotal: 0,
          grandTotal: 0,
          shippingAddress: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        email: cart.email,
        items: cart.svm_cart_items.map((item: { productId: string; variantId: string | null; productName: string; variantName: string | null; sku: string | null; imageUrl: string | null; unitPrice: { toString: () => string }; quantity: number; lineTotal: { toString: () => string }; discountAmount: { toString: () => string } }) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount)
        })),
        itemCount: Number(cart.itemCount),
        subtotal: Number(cart.subtotal),
        promotionCode: cart.promotionCode,
        discountTotal: Number(cart.discountTotal),
        shippingTotal: Number(cart.shippingTotal),
        shippingMethod: cart.shippingMethod,
        taxTotal: Number(cart.taxTotal),
        grandTotal: Number(cart.grandTotal),
        shippingAddress: cart.shippingAddress,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[SVM Cart] Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/svm/cart
 * Clear cart contents or mark as abandoned
 */
export async function DELETE(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId')
    let customerId = searchParams.get('customerId')
    let sessionId = searchParams.get('sessionId')
    let markAbandoned = searchParams.get('markAbandoned') === 'true'

    // If not in query params, try body
    if (!tenantId) {
      try {
        const body = await request.json()
        tenantId = body.tenantId
        customerId = body.customerId
        sessionId = body.sessionId
        markAbandoned = body.markAbandoned || false
      } catch {
        // Body parse failed
      }
    }

    if (!tenantId || (!customerId && !sessionId)) {
      return NextResponse.json(
        { success: false, error: 'tenantId and either customerId or sessionId are required' },
        { status: 400 }
      )
    }

    const cart = await prisma.svm_carts.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          customerId ? { customerId } : {},
          sessionId ? { sessionId } : {}
        ].filter(o => Object.keys(o).length > 0)
      }
    })

    if (cart) {
      if (markAbandoned) {
        // Mark as abandoned for potential recovery
        await prisma.svm_carts.update({
          where: { id: cart.id },
          data: { status: 'ABANDONED' }
        })
      } else {
        // Delete cart and items
        await prisma.svm_cart_items.deleteMany({ where: { cartId: cart.id } })
        await prisma.svm_carts.delete({ where: { id: cart.id } })
      }
    }

    return NextResponse.json({
      success: true,
      message: markAbandoned ? 'Cart marked as abandoned' : 'Cart cleared'
    })

  } catch (error) {
    console.error('[SVM Cart] Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
