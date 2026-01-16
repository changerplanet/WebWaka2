/**
 * MVM Cart API - GET endpoint (Wave K.1)
 * 
 * Get the current cart for the tenant/session.
 * 
 * @route GET /api/mvm/cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { MultiVendorCartService } from '@/lib/mvm/cart'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get('tenantSlug')
    
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug is required' },
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
    const cartKey = getCartKey(request)

    const result = await MultiVendorCartService.getCart(ctx, cartKey)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cart: result.data,
      isDemo: ctx.isDemo
    })
  } catch (error) {
    console.error('[MVM Cart API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getCartKey(request: NextRequest): string {
  const cookieStore = cookies()
  let cartKey = cookieStore.get('mvm_cart_key')?.value
  
  if (!cartKey) {
    cartKey = `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
  }
  
  return cartKey
}
