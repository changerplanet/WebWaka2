export const dynamic = 'force-dynamic'

/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Main API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing - Get billing configuration and suite status
 * POST /api/commerce/billing - Initialize billing configuration
 * 
 * @module api/commerce/billing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoiceService, CreditNoteService, NIGERIAN_VAT_RATE } from '@/lib/billing'

/**
 * GET /api/commerce/billing
 * Get billing suite status and statistics for tenant
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

    // Get invoice and credit note statistics
    const [invoiceStats, creditNoteStats] = await Promise.all([
      InvoiceService.getStatistics(tenantId),
      CreditNoteService.getStatistics(tenantId)
    ])

    return NextResponse.json({
      suite: 'billing',
      status: 'active',
      config: {
        defaultCurrency: 'NGN',
        vatRate: NIGERIAN_VAT_RATE,
        defaultPaymentTermDays: 30,
        partialPaymentsEnabled: true,
        creditNotesEnabled: true
      },
      statistics: {
        invoices: invoiceStats,
        creditNotes: creditNoteStats
      }
    })
  } catch (error) {
    console.error('[Billing API] Get status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing
 * Initialize or refresh billing suite for tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId

    // Update overdue invoices
    const overdueCount = await InvoiceService.updateOverdueInvoices(tenantId)

    return NextResponse.json({
      success: true,
      message: 'Billing suite refreshed',
      overdueInvoicesUpdated: overdueCount
    })
  } catch (error) {
    console.error('[Billing API] Refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
