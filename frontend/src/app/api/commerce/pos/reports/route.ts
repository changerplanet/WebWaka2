export const dynamic = 'force-dynamic'

/**
 * POS Reports API
 * 
 * GET /api/commerce/pos/reports?type=daily     - Daily summary
 * GET /api/commerce/pos/reports?type=shift     - Shift summary (Z-report)
 * GET /api/commerce/pos/reports?type=payments  - Payment breakdown
 * GET /api/commerce/pos/reports?type=staff     - Staff performance
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { 
  generateDailySummary,
  generateShiftSummary,
  generatePaymentBreakdown,
  generateStaffSummary,
  generateHourlySummary,
  generateTopProducts,
  getSalesTrend
} from '@/lib/pos/report-service'

// =============================================================================
// GET /api/commerce/pos/reports - Generate reports
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const locationId = searchParams.get('locationId')
    const shiftId = searchParams.get('shiftId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10')

    // =========================================================================
    // DAILY SUMMARY
    // =========================================================================
    if (type === 'daily') {
      const reportDate = date ? new Date(date) : new Date()
      
      const report = await generateDailySummary(
        tenantId,
        reportDate,
        locationId || undefined
      )

      return NextResponse.json({
        success: true,
        type: 'daily',
        report,
      })
    }

    // =========================================================================
    // SHIFT SUMMARY (Z-REPORT)
    // =========================================================================
    if (type === 'shift') {
      if (!shiftId) {
        return NextResponse.json({ error: 'shiftId is required for shift report' }, { status: 400 })
      }

      const report = await generateShiftSummary(tenantId, shiftId)

      return NextResponse.json({
        success: true,
        type: 'shift',
        report,
      })
    }

    // =========================================================================
    // PAYMENT BREAKDOWN
    // =========================================================================
    if (type === 'payments') {
      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const end = endDate ? new Date(endDate) : new Date()

      const report = await generatePaymentBreakdown(
        tenantId,
        start,
        end,
        locationId || undefined
      )

      return NextResponse.json({
        success: true,
        type: 'payments',
        dateRange: { start, end },
        report,
      })
    }

    // =========================================================================
    // STAFF PERFORMANCE
    // =========================================================================
    if (type === 'staff') {
      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const end = endDate ? new Date(endDate) : new Date()

      const report = await generateStaffSummary(
        tenantId,
        start,
        end,
        locationId || undefined
      )

      return NextResponse.json({
        success: true,
        type: 'staff',
        dateRange: { start, end },
        report,
      })
    }

    // =========================================================================
    // HOURLY BREAKDOWN
    // =========================================================================
    if (type === 'hourly') {
      const reportDate = date ? new Date(date) : new Date()

      const report = await generateHourlySummary(
        tenantId,
        reportDate,
        locationId || undefined
      )

      return NextResponse.json({
        success: true,
        type: 'hourly',
        date: reportDate,
        report,
      })
    }

    // =========================================================================
    // TOP PRODUCTS
    // =========================================================================
    if (type === 'products') {
      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const end = endDate ? new Date(endDate) : new Date()

      const report = await generateTopProducts(
        tenantId,
        start,
        end,
        locationId || undefined,
        limit
      )

      return NextResponse.json({
        success: true,
        type: 'products',
        dateRange: { start, end },
        report,
      })
    }

    // =========================================================================
    // SALES TREND
    // =========================================================================
    if (type === 'trend') {
      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const end = endDate ? new Date(endDate) : new Date()

      const report = await getSalesTrend(
        tenantId,
        start,
        end,
        locationId || undefined
      )

      return NextResponse.json({
        success: true,
        type: 'trend',
        dateRange: { start, end },
        report,
      })
    }

    return NextResponse.json({ 
      error: 'Invalid report type. Use: daily, shift, payments, staff, hourly, products, trend' 
    }, { status: 400 })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/reports error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}
