/**
 * SVM Offline Cart Sync API (Wave G2)
 * 
 * POST /api/svm/cart/offline - Save cart to server (for backup)
 * GET /api/svm/cart/offline - Check for server-side cart backup
 * PUT /api/svm/cart/offline - Check product availability for merge
 * 
 * Security: All endpoints enforce tenant isolation via session.activeTenantId
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

interface CartItemInput {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  imageUrl?: string
  unitPrice: number
  quantity: number
}

function getTenantIdFromSession(session: { activeTenantId?: string | null } | null): string | null {
  return session?.activeTenantId ?? null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const body = await request.json()
    const { tenantId, sessionId, items, shippingAddress, promotionCode } = body
    
    if (!tenantId || !sessionId || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (activeTenantId && activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const effectiveTenantId = activeTenantId || tenantId
    
    const cartId = body.cartId || `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
    const itemsArray = items as CartItemInput[]
    
    const subtotal = itemsArray.reduce((sum, item) => 
      sum + (item.unitPrice * item.quantity), 0)
    const itemCount = itemsArray.reduce((sum, item) => sum + item.quantity, 0)
    
    const result = await prisma.$transaction(async (tx) => {
      const existingCart = await tx.svm_carts.findFirst({
        where: { tenantId: effectiveTenantId, sessionId }
      })
      
      if (existingCart) {
        await tx.svm_cart_items.deleteMany({
          where: { cartId: existingCart.id }
        })
      }
      
      const cart = await tx.svm_carts.upsert({
        where: {
          tenantId_sessionId: { tenantId: effectiveTenantId, sessionId }
        },
        create: {
          id: cartId,
          tenantId: effectiveTenantId,
          sessionId,
          customerId: session?.user?.id || null,
          status: 'ACTIVE',
          currency: 'NGN',
          subtotal,
          itemCount,
          promotionCode: promotionCode || null,
          shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          updatedAt: new Date()
        },
        update: {
          status: 'ACTIVE',
          subtotal,
          itemCount,
          promotionCode: promotionCode || null,
          shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          updatedAt: new Date()
        }
      })
      
      if (itemsArray.length > 0) {
        await tx.svm_cart_items.createMany({
          data: itemsArray.map((item) => ({
            id: `item_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`,
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.productName,
            variantName: item.variantName || null,
            sku: item.sku || null,
            imageUrl: item.imageUrl || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.unitPrice * item.quantity,
            updatedAt: new Date()
          }))
        })
      }
      
      return cart
    })
    
    return NextResponse.json({
      success: true,
      cartId: result.id,
      message: 'Cart saved to server'
    })
  } catch (error) {
    console.error('[OfflineCart API] Failed to save cart:', error)
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const sessionId = searchParams.get('sessionId')
    
    if (!tenantId || !sessionId) {
      return NextResponse.json(
        { error: 'tenantId and sessionId are required' },
        { status: 400 }
      )
    }
    
    if (activeTenantId && activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const effectiveTenantId = activeTenantId || tenantId
    
    const cart = await prisma.svm_carts.findFirst({
      where: {
        tenantId: effectiveTenantId,
        sessionId,
        status: 'ACTIVE'
      },
      include: {
        svm_cart_items: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!cart) {
      return NextResponse.json({
        hasCart: false,
        cart: null
      })
    }
    
    return NextResponse.json({
      hasCart: true,
      cart: {
        id: cart.id,
        tenantId: cart.tenantId,
        sessionId: cart.sessionId,
        itemCount: cart.itemCount,
        subtotal: Number(cart.subtotal),
        shippingAddress: cart.shippingAddress,
        promotionCode: cart.promotionCode,
        items: cart.svm_cart_items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity
        })),
        updatedAt: cart.updatedAt
      }
    })
  } catch (error) {
    console.error('[OfflineCart API] Failed to get cart:', error)
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const body = await request.json()
    const { tenantId, productIds } = body
    
    if (!tenantId || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'tenantId and productIds array are required' },
        { status: 400 }
      )
    }
    
    if (activeTenantId && activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const effectiveTenantId = activeTenantId || tenantId
    
    const products = await prisma.product.findMany({
      where: {
        tenantId: effectiveTenantId,
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        price: true,
        compareAtPrice: true,
        status: true,
        trackInventory: true,
        InventoryLevel: {
          select: {
            quantityAvailable: true
          }
        }
      }
    })
    
    type ProductWithInventory = typeof products[number]
    const productMap = new Map<string, ProductWithInventory>(products.map(p => [p.id, p]))
    
    const results = productIds.map((productId: string) => {
      const product = productMap.get(productId)
      
      if (!product) {
        return {
          productId,
          exists: false,
          available: false,
          currentPrice: 0,
          currentStock: 0,
          name: 'Unknown'
        }
      }
      
      const isAvailable = product.status === 'ACTIVE'
      const totalStock = product.InventoryLevel.reduce((sum: number, inv) => sum + inv.quantityAvailable, 0)
      const currentStock = product.trackInventory ? totalStock : 999
      
      return {
        productId: product.id,
        exists: true,
        available: isAvailable,
        currentPrice: Number(product.price),
        currentStock,
        name: product.name
      }
    })
    
    return NextResponse.json({
      success: true,
      products: results,
      checkedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[OfflineCart API] Failed to check products:', error)
    return NextResponse.json(
      { error: 'Failed to check product availability' },
      { status: 500 }
    )
  }
}
