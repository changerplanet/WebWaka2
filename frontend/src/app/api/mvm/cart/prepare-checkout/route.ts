/**
 * MVM Cart Prepare Checkout API (Wave K.1)
 * 
 * Validate cart and prepare for checkout.
 * NO payment execution - only validation and conflict detection.
 * 
 * @route POST /api/mvm/cart/prepare-checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { MultiVendorCartService } from '@/lib/mvm/cart'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantSlug } = body

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
    const cartKey = getCartKey()

    if (!cartKey) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const result = await MultiVendorCartService.prepareForCheckout(ctx, cartKey)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }

    const { success: _unused, ...checkoutData } = result.data
    return NextResponse.json({
      success: true,
      ...checkoutData,
      isDemo: ctx.isDemo
    })
  } catch (error) {
    console.error('[MVM Cart API] Prepare checkout error:', error)
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
