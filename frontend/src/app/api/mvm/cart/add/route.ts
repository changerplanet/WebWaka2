/**
 * MVM Cart Add API (Wave K.1)
 * 
 * Add an item to the multi-vendor cart.
 * 
 * @route POST /api/mvm/cart/add
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { MultiVendorCartService } from '@/lib/mvm/cart'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantSlug, productId, variantId, quantity, vendorId } = body

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug is required' },
        { status: 400 }
      )
    }

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: 'productId and vendorId are required' },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'quantity must be at least 1' },
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
    const cartKey = getOrCreateCartKey()

    const result = await MultiVendorCartService.addItem(ctx, cartKey, {
      productId,
      variantId: variantId || undefined,
      quantity: Number(quantity),
      vendorId
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      cart: result.data,
      isDemo: ctx.isDemo
    })

    response.cookies.set('mvm_cart_key', cartKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('[MVM Cart API] Add error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getOrCreateCartKey(): string {
  const cookieStore = cookies()
  let cartKey = cookieStore.get('mvm_cart_key')?.value
  
  if (!cartKey) {
    cartKey = `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
  }
  
  return cartKey
}
