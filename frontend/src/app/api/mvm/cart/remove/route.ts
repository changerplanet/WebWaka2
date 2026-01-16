/**
 * MVM Cart Remove API (Wave K.1)
 * 
 * Remove an item from the cart.
 * 
 * @route POST /api/mvm/cart/remove
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { MultiVendorCartService } from '@/lib/mvm/cart'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantSlug, itemId } = body

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'tenantSlug is required' },
        { status: 400 }
      )
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
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

    const result = await MultiVendorCartService.removeItem(ctx, cartKey, itemId)

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
    console.error('[MVM Cart API] Remove error:', error)
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
