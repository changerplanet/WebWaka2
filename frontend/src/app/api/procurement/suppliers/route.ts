/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Supplier Pricing & Performance API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { SupplierService } from '@/lib/procurement/supplier-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'

/**
 * GET /api/procurement/suppliers
 * Get supplier pricing and performance data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Top suppliers
    if (searchParams.get('top') === 'true') {
      const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'supplierAnalytics')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: entitlement.reason }, { status: 403 })
      }

      const limit = parseInt(searchParams.get('limit') || '10')
      const topSuppliers = await SupplierService.getTopSuppliers(tenantId, limit)
      return NextResponse.json({ suppliers: topSuppliers })
    }

    // Price comparison for a product
    if (searchParams.get('compare') === 'true' && searchParams.get('productId')) {
      const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'supplierPriceList')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: entitlement.reason }, { status: 403 })
      }

      const prices = await SupplierService.comparePrices(tenantId, searchParams.get('productId')!)
      return NextResponse.json({ prices })
    }

    // Price history
    if (searchParams.get('history') === 'true' && searchParams.get('supplierId') && searchParams.get('productId')) {
      const history = await SupplierService.getPriceHistory(
        tenantId,
        searchParams.get('supplierId')!,
        searchParams.get('productId')!
      )
      return NextResponse.json({ history })
    }

    // List all prices
    if (searchParams.get('prices') === 'true') {
      const prices = await SupplierService.listPrices(tenantId, {
        ...(searchParams.get('supplierId') && { supplierId: searchParams.get('supplierId')! }),
        ...(searchParams.get('productId') && { productId: searchParams.get('productId')! }),
        ...(searchParams.get('isActive') && { isActive: searchParams.get('isActive') === 'true' }),
      })
      return NextResponse.json({ prices })
    }

    // List performance records
    const performance = await SupplierService.listPerformance(tenantId, {
      ...(searchParams.get('supplierId') && { supplierId: searchParams.get('supplierId')! }),
      ...(searchParams.get('fromDate') && { fromDate: new Date(searchParams.get('fromDate')!) }),
      ...(searchParams.get('toDate') && { toDate: new Date(searchParams.get('toDate')!) }),
    })

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Error getting supplier data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/suppliers
 * Set supplier price or calculate performance
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Set supplier price
    if (body.action === 'set-price') {
      const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'supplierPriceList')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: entitlement.reason }, { status: 403 })
      }

      const price = await SupplierService.setSupplierPrice(tenantId, {
        supplierId: body.supplierId,
        productId: body.productId,
        unitPrice: body.unitPrice,
        currency: body.currency,
        minOrderQuantity: body.minOrderQuantity,
        unit: body.unit,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validTo: body.validTo ? new Date(body.validTo) : undefined,
        leadTimeDays: body.leadTimeDays,
        notes: body.notes,
      })

      return NextResponse.json({ success: true, price })
    }

    // Calculate performance
    if (body.action === 'calculate-performance') {
      const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'supplierAnalytics')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: entitlement.reason }, { status: 403 })
      }

      if (!body.supplierId || !body.periodStart || !body.periodEnd) {
        return NextResponse.json(
          { error: 'supplierId, periodStart, and periodEnd required' },
          { status: 400 }
        )
      }

      const performance = await SupplierService.calculatePerformance(
        tenantId,
        body.supplierId,
        new Date(body.periodStart),
        new Date(body.periodEnd)
      )

      return NextResponse.json({ success: true, performance })
    }

    // Get current price
    if (body.action === 'get-price') {
      if (!body.supplierId || !body.productId) {
        return NextResponse.json(
          { error: 'supplierId and productId required' },
          { status: 400 }
        )
      }

      const price = await SupplierService.getCurrentPrice(tenantId, body.supplierId, body.productId)
      return NextResponse.json({ price })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: set-price, calculate-performance, get-price' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing supplier action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
