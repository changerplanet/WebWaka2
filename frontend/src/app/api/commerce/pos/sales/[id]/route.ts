export const dynamic = 'force-dynamic'

/**
 * POS Sale Detail API
 * 
 * GET    /api/commerce/pos/sales/[id] - Get sale by ID or cart
 * POST   /api/commerce/pos/sales/[id] - Actions on sale (items, finalize, void)
 * DELETE /api/commerce/pos/sales/[id] - Cancel pending sale
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { 
  getSale,
  addItem,
  removeItem,
  updateItemQuantity,
  applyItemDiscount,
  finalizeSale,
  cancelSale,
  voidSale,
  getCart,
  applyTax,
  calculateSaleTotals
} from '@/lib/pos/sale-service'

// =============================================================================
// GET /api/commerce/pos/sales/[id] - Get sale or cart
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const saleId = params.id

    // Check if it's a pending sale (cart)
    if (saleId.startsWith('pending_')) {
      const cart = getCart(saleId)
      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
      }
      
      const totals = calculateSaleTotals(cart.items)
      return NextResponse.json({
        success: true,
        type: 'cart',
        sale: cart.sale,
        items: cart.items,
        totals,
      })
    }

    // Get completed sale
    const sale = await getSale(tenantId, saleId)
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      type: 'completed',
      sale,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/sales/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/commerce/pos/sales/[id] - Actions on sale
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const body = await request.json()
    const { action, tenantId: bodyTenantId, staffId, staffName } = body

    const tenantId = bodyTenantId || request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const userId = staffId || 'system'
    const userName = staffName || 'System'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const saleId = params.id

    // =========================================================================
    // ADD ITEM
    // =========================================================================
    if (action === 'addItem') {
      const { productId, variantId, productName, sku, quantity, unitPrice, unitCost, discount, discountReason } = body

      if (!productId || !productName || !quantity || unitPrice === undefined) {
        return NextResponse.json(
          { error: 'productId, productName, quantity, and unitPrice are required' },
          { status: 400 }
        )
      }

      addItem(saleId, {
        productId,
        variantId,
        productName,
        sku,
        quantity,
        unitPrice,
        unitCost,
        discount,
        discountReason,
      })

      const cart = getCart(saleId)
      const totals = cart ? calculateSaleTotals(cart.items) : null

      return NextResponse.json({
        success: true,
        message: 'Item added',
        items: cart?.items || [],
        totals,
      })
    }

    // =========================================================================
    // REMOVE ITEM
    // =========================================================================
    if (action === 'removeItem') {
      const { productId, variantId } = body

      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }

      removeItem(saleId, productId, variantId)

      const cart = getCart(saleId)
      const totals = cart ? calculateSaleTotals(cart.items) : null

      return NextResponse.json({
        success: true,
        message: 'Item removed',
        items: cart?.items || [],
        totals,
      })
    }

    // =========================================================================
    // UPDATE QUANTITY
    // =========================================================================
    if (action === 'updateQuantity') {
      const { productId, variantId, quantity } = body

      if (!productId || quantity === undefined) {
        return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 })
      }

      updateItemQuantity(saleId, productId, quantity, variantId)

      const cart = getCart(saleId)
      const totals = cart ? calculateSaleTotals(cart.items) : null

      return NextResponse.json({
        success: true,
        message: 'Quantity updated',
        items: cart?.items || [],
        totals,
      })
    }

    // =========================================================================
    // APPLY DISCOUNT
    // =========================================================================
    if (action === 'applyDiscount') {
      const { productId, variantId, discount, discountReason } = body

      if (!productId || discount === undefined) {
        return NextResponse.json({ error: 'productId and discount are required' }, { status: 400 })
      }

      applyItemDiscount(saleId, productId, discount, discountReason, variantId)

      const cart = getCart(saleId)
      const totals = cart ? calculateSaleTotals(cart.items) : null

      return NextResponse.json({
        success: true,
        message: 'Discount applied',
        items: cart?.items || [],
        totals,
      })
    }

    // =========================================================================
    // APPLY TAX
    // =========================================================================
    if (action === 'applyTax') {
      const taxRate = await applyTax(tenantId, saleId)

      const cart = getCart(saleId)
      const totals = cart ? calculateSaleTotals(cart.items, taxRate) : null

      return NextResponse.json({
        success: true,
        message: 'Tax applied',
        taxRate,
        totals,
      })
    }

    // =========================================================================
    // FINALIZE SALE
    // =========================================================================
    if (action === 'finalize') {
      const { paymentMethod, amountTendered, transferReference, transferBank, splitPayments, notes } = body

      if (!paymentMethod) {
        return NextResponse.json({ error: 'paymentMethod is required' }, { status: 400 })
      }

      // Apply tax before finalizing
      await applyTax(tenantId, saleId)

      const sale = await finalizeSale(saleId, {
        paymentMethod,
        amountTendered,
        transferReference,
        transferBank,
        splitPayments,
        notes,
      })

      return NextResponse.json({
        success: true,
        message: `Sale ${sale.saleNumber} completed`,
        sale,
      })
    }

    // =========================================================================
    // CANCEL SALE (before payment)
    // =========================================================================
    if (action === 'cancel') {
      cancelSale(saleId)

      return NextResponse.json({
        success: true,
        message: 'Sale cancelled',
      })
    }

    // =========================================================================
    // VOID SALE (after payment)
    // =========================================================================
    if (action === 'void') {
      const { voidReason } = body

      if (!voidReason) {
        return NextResponse.json({ error: 'voidReason is required' }, { status: 400 })
      }

      const sale = await voidSale({
        tenantId,
        saleId,
        voidedById: userId,
        voidedByName: userName,
        voidReason,
      })

      return NextResponse.json({
        success: true,
        message: `Sale ${sale.saleNumber} voided`,
        sale,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('POST /api/commerce/pos/sales/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process sale action' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE /api/commerce/pos/sales/[id] - Cancel pending sale
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const saleId = params.id

    if (!saleId.startsWith('pending_')) {
      return NextResponse.json(
        { error: 'Can only cancel pending sales. Use void for completed sales.' },
        { status: 400 }
      )
    }

    cancelSale(saleId)

    return NextResponse.json({
      success: true,
      message: 'Sale cancelled',
    })
  } catch (error: any) {
    console.error('DELETE /api/commerce/pos/sales/[id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel sale' },
      { status: 500 }
    )
  }
}
