/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Statistics API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/statistics - Get billing statistics and aging report
 * 
 * @module api/commerce/billing/statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoiceService, CreditNoteService, VATService, NIGERIAN_VAT_RATE } from '@/lib/billing'

/**
 * GET /api/commerce/billing/statistics
 * Get comprehensive billing statistics
 * 
 * Query params:
 * - type: 'summary' | 'aging' | 'all' (default 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    if (type === 'aging') {
      const aging = await InvoiceService.getAgingReport(tenantId)
      return NextResponse.json({ aging })
    }

    if (type === 'summary') {
      const [invoiceStats, creditNoteStats] = await Promise.all([
        InvoiceService.getStatistics(tenantId),
        CreditNoteService.getStatistics(tenantId)
      ])
      return NextResponse.json({
        invoices: invoiceStats,
        creditNotes: creditNoteStats
      })
    }

    // type === 'all'
    const [invoiceStats, creditNoteStats, aging] = await Promise.all([
      InvoiceService.getStatistics(tenantId),
      CreditNoteService.getStatistics(tenantId),
      InvoiceService.getAgingReport(tenantId)
    ])

    return NextResponse.json({
      config: {
        currency: 'NGN',
        vatRate: NIGERIAN_VAT_RATE,
        defaultPaymentTermDays: 30
      },
      invoices: invoiceStats,
      creditNotes: creditNoteStats,
      aging,
      // Summary metrics
      summary: {
        totalOutstanding: invoiceStats.totals.totalDue,
        totalOverdue: invoiceStats.overdue.amount,
        overdueCount: invoiceStats.overdue.count,
        creditsPending: creditNoteStats.byStatus?.DRAFT?.amount || 0 + 
                        creditNoteStats.byStatus?.APPROVED?.amount || 0,
        collectionRate: invoiceStats.totals.totalAmount > 0
          ? Math.round((invoiceStats.totals.totalPaid / invoiceStats.totals.totalAmount) * 100)
          : 0
      }
    })
  } catch (error) {
    console.error('[Billing API] Statistics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
