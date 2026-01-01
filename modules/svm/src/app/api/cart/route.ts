/**
 * SVM Cart API
 * 
 * POST /api/svm/cart - Create or update cart
 * GET /api/svm/cart - Get cart contents
 * DELETE /api/svm/cart - Clear cart
 * 
 * Cart is identified by either customerId (logged in) or sessionId (guest)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  SVMInventoryService,
  type CoreInventoryService,
  type CoreInventoryLevel,
  type ReservationItem,
  type ReservationResult,
  type AvailabilityCheckItem,
  type AvailabilityResult
} from '../../../lib'

// In-memory cart storage (in production, use database)
interface CartData {
  id: string
  tenantId: string
  customerId?: string
  sessionId?: string
  items: CartItemData[]
  promotionCode?: string
  subtotal: number
  discountTotal: number
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

interface CartItemData {
  productId: string
  variantId?: string
  productName: string
  unitPrice: number
  quantity: number
}

// Simple in-memory storage (would be database in production)
const cartStorage = new Map<string, CartData>()

/**
 * Generate cart key from customer or session
 */
function getCartKey(tenantId: string, customerId?: string, sessionId?: string): string {
  if (customerId) {
    return `${tenantId}:customer:${customerId}`
  }
  if (sessionId) {
    return `${tenantId}:session:${sessionId}`
  }
  throw new Error('Either customerId or sessionId is required')
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Mock Core Inventory Service
 */
const mockCoreInventoryService: CoreInventoryService = {
  async getInventory(tenantId: string, productId: string, variantId?: string): Promise<CoreInventoryLevel | null> {
    return null
  },
  async checkAvailability(tenantId: string, items: AvailabilityCheckItem[]): Promise<AvailabilityResult[]> {
    // Mock: return all items as available
    return items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      available: item.requestedQty,
      status: 'IN_STOCK' as const,
      canPurchase: true
    }))
  },
  async reserveInventory(tenantId: string, orderId: string, items: ReservationItem[]): Promise<ReservationResult> {
    return {
      success: true,
      reservationId: `res_${Date.now()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    }
  },
  async releaseReservation(tenantId: string, reservationId: string): Promise<{ success: boolean }> {
    return { success: true }
  }
}

const inventoryService = new SVMInventoryService(mockCoreInventoryService)

/**
 * POST /api/svm/cart
 * Create or update cart
 * 
 * Actions:
 * - ADD_ITEM: Add item to cart
 * - UPDATE_QUANTITY: Update item quantity
 * - REMOVE_ITEM: Remove item from cart
 * - APPLY_PROMO: Apply promotion code
 * - REMOVE_PROMO: Remove promotion code
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

    // Create cart if doesn't exist
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
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    }

    // Execute action
    switch (action) {
      case 'ADD_ITEM': {
        const { productId, variantId, productName, unitPrice, quantity } = body
        
        if (!productId || !productName || unitPrice === undefined || !quantity) {
          return NextResponse.json(
            { success: false, error: 'productId, productName, unitPrice, and quantity are required for ADD_ITEM' },
            { status: 400 }
          )
        }

        // Check if item already exists
        const existingIndex = cart.items.findIndex(
          item => item.productId === productId && item.variantId === variantId
        )

        if (existingIndex >= 0) {
          // Update quantity
          cart.items[existingIndex].quantity += quantity
        } else {
          // Add new item
          cart.items.push({
            productId,
            variantId,
            productName,
            unitPrice,
            quantity
          })
        }
        break
      }

      case 'UPDATE_QUANTITY': {
        const { productId, variantId, quantity } = body
        
        if (!productId || quantity === undefined) {
          return NextResponse.json(
            { success: false, error: 'productId and quantity are required for UPDATE_QUANTITY' },
            { status: 400 }
          )
        }

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
          // Remove item
          cart.items.splice(itemIndex, 1)
        } else {
          cart.items[itemIndex].quantity = quantity
        }
        break
      }

      case 'REMOVE_ITEM': {
        const { productId, variantId } = body
        
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId is required for REMOVE_ITEM' },
            { status: 400 }
          )
        }

        cart.items = cart.items.filter(
          item => !(item.productId === productId && item.variantId === variantId)
        )
        break
      }

      case 'APPLY_PROMO': {
        const { promotionCode } = body
        
        if (!promotionCode) {
          return NextResponse.json(
            { success: false, error: 'promotionCode is required for APPLY_PROMO' },
            { status: 400 }
          )
        }

        // In production, validate promo code with SVM promotions
        cart.promotionCode = promotionCode
        // Mock: 10% discount
        cart.discountTotal = cart.subtotal * 0.1
        break
      }

      case 'REMOVE_PROMO': {
        cart.promotionCode = undefined
        cart.discountTotal = 0
        break
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}`,
            validActions: ['ADD_ITEM', 'UPDATE_QUANTITY', 'REMOVE_ITEM', 'APPLY_PROMO', 'REMOVE_PROMO']
          },
          { status: 400 }
        )
    }

    // Recalculate subtotal
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity),
      0
    )
    cart.updatedAt = new Date()

    // Save cart
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
 * Get cart contents with availability check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const sessionId = searchParams.get('sessionId')
    const checkAvailability = searchParams.get('checkAvailability') === 'true'

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

    // Check availability if requested
    let availabilityResults: AvailabilityResult[] = []
    if (checkAvailability && cart.items.length > 0) {
      const checkResult = await inventoryService.checkCartAvailability(
        tenantId,
        cart.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          productName: item.productName
        }))
      )
      availabilityResults = checkResult.items
    }

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        tenantId: cart.tenantId,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        items: cart.items.map((item, index) => ({
          ...item,
          lineTotal: item.unitPrice * item.quantity,
          availability: availabilityResults[index] || null
        })),
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.subtotal,
        promotionCode: cart.promotionCode,
        discountTotal: cart.discountTotal,
        total: cart.subtotal - cart.discountTotal,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString()
      },
      availability: checkAvailability ? {
        allAvailable: availabilityResults.every(r => r.canPurchase),
        results: availabilityResults
      } : null
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
 * Clear cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, customerId, sessionId } = body

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
    cartStorage.delete(cartKey)

    return NextResponse.json({
      success: true,
      message: 'Cart cleared'
    })

  } catch (error) {
    console.error('[SVM] Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
