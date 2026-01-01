/**
 * SVM Cart API - Core Proxy
 * 
 * POST /api/svm/cart - Create or update cart
 * GET /api/svm/cart - Get cart contents
 * DELETE /api/svm/cart - Clear cart
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory cart storage (in production, use database)
interface CartItem {
  productId: string
  variantId?: string
  productName: string
  unitPrice: number
  quantity: number
}

interface Cart {
  id: string
  tenantId: string
  customerId?: string
  sessionId?: string
  items: CartItem[]
  promotionCode?: string
  subtotal: number
  discountTotal: number
  createdAt: Date
  updatedAt: Date
}

const cartStorage = new Map<string, Cart>()

function getCartKey(tenantId: string, customerId?: string, sessionId?: string): string {
  if (customerId) return `${tenantId}:customer:${customerId}`
  if (sessionId) return `${tenantId}:session:${sessionId}`
  throw new Error('Either customerId or sessionId is required')
}

function generateId(): string {
  return `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

/**
 * POST /api/svm/cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, customerId, sessionId, action } = body

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

    const cartKey = getCartKey(tenantId, customerId, sessionId)
    let cart = cartStorage.get(cartKey)

    if (!cart) {
      cart = {
        id: generateId(),
        tenantId,
        customerId,
        sessionId,
        items: [],
        subtotal: 0,
        discountTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    switch (action) {
      case 'ADD_ITEM': {
        const { productId, variantId, productName, unitPrice, quantity } = body
        
        if (!productId || !productName || unitPrice === undefined || !quantity) {
          return NextResponse.json(
            { success: false, error: 'productId, productName, unitPrice, and quantity are required' },
            { status: 400 }
          )
        }

        const existingIndex = cart.items.findIndex(
          item => item.productId === productId && item.variantId === variantId
        )

        if (existingIndex >= 0) {
          cart.items[existingIndex].quantity += quantity
        } else {
          cart.items.push({ productId, variantId, productName, unitPrice, quantity })
        }
        break
      }

      case 'UPDATE_QUANTITY': {
        const { productId, variantId, quantity } = body
        
        const itemIndex = cart.items.findIndex(
          item => item.productId === productId && item.variantId === variantId
        )

        if (itemIndex < 0) {
          return NextResponse.json(
            { success: false, error: 'Item not found in cart' },
            { status: 404 }
          )
        }

        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1)
        } else {
          cart.items[itemIndex].quantity = quantity
        }
        break
      }

      case 'REMOVE_ITEM': {
        const { productId, variantId } = body
        cart.items = cart.items.filter(
          item => !(item.productId === productId && item.variantId === variantId)
        )
        break
      }

      case 'APPLY_PROMO': {
        const { promotionCode } = body
        cart.promotionCode = promotionCode
        cart.discountTotal = cart.subtotal * 0.1 // Mock 10% discount
        break
      }

      case 'REMOVE_PROMO': {
        cart.promotionCode = undefined
        cart.discountTotal = 0
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    cart.updatedAt = new Date()
    cartStorage.set(cartKey, cart)

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.subtotal,
        promotionCode: cart.promotionCode,
        discountTotal: cart.discountTotal,
        total: cart.subtotal - cart.discountTotal,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[SVM] Error updating cart:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/cart
 */
export async function GET(request: NextRequest) {
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

    const cartKey = getCartKey(tenantId, customerId || undefined, sessionId || undefined)
    const cart = cartStorage.get(cartKey)

    if (!cart) {
      return NextResponse.json({
        success: true,
        cart: {
          id: null,
          tenantId,
          customerId,
          sessionId,
          items: [],
          itemCount: 0,
          subtotal: 0,
          promotionCode: null,
          discountTotal: 0,
          total: 0
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
        items: cart.items.map(item => ({
          ...item,
          lineTotal: item.unitPrice * item.quantity
        })),
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.subtotal,
        promotionCode: cart.promotionCode,
        discountTotal: cart.discountTotal,
        total: cart.subtotal - cart.discountTotal,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[SVM] Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/svm/cart
 * Supports both query params and JSON body for flexibility
 */
export async function DELETE(request: NextRequest) {
  try {
    // Try to get params from query string first, then body
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId')
    let customerId = searchParams.get('customerId')
    let sessionId = searchParams.get('sessionId')

    // If not in query params, try body
    if (!tenantId) {
      try {
        const body = await request.json()
        tenantId = body.tenantId
        customerId = body.customerId
        sessionId = body.sessionId
      } catch {
        // Body parse failed, use query params only
      }
    }

    if (!tenantId || (!customerId && !sessionId)) {
      return NextResponse.json(
        { success: false, error: 'tenantId and either customerId or sessionId are required' },
        { status: 400 }
      )
    }

    const cartKey = getCartKey(tenantId, customerId || undefined, sessionId || undefined)
    cartStorage.delete(cartKey)

    return NextResponse.json({
      success: true,
      message: 'Cart cleared'
    })

  } catch (error) {
    console.error('[SVM] Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
