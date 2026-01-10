/**
 * POS Receipts API
 * 
 * GET /api/commerce/pos/receipts/[saleId] - Get receipt for sale
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { getSale } from '@/lib/pos/sale-service'
import { 
  generateReceiptData, 
  generatePrintableReceipt,
  generateSMSReceipt
} from '@/lib/pos/receipt-service'

// =============================================================================
// GET /api/commerce/pos/receipts/[saleId] - Get receipt
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const saleId = params.saleId
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json, html, text, sms

    // Get sale
    const sale = await getSale(tenantId, saleId)
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Get business info (simplified - would come from tenant settings)
    const businessInfo = {
      name: 'WebWaka Store',
      address: undefined,
      phone: undefined,
      email: undefined,
      rcNumber: undefined,
      tinNumber: undefined,
      locationName: sale.locationId,
      footerMessage: 'Thank you for your patronage!',
      returnPolicy: 'Returns accepted within 7 days with receipt.',
    }

    // Generate receipt data
    const receiptData = generateReceiptData(sale, businessInfo)

    // Return based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        receipt: receiptData,
      })
    }

    if (format === 'sms') {
      const smsText = generateSMSReceipt(receiptData)
      return NextResponse.json({
        success: true,
        smsText,
        characterCount: smsText.length,
      })
    }

    const printable = generatePrintableReceipt(receiptData)

    if (format === 'text') {
      return new NextResponse(printable.text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `inline; filename="receipt-${sale.receiptNumber}.txt"`,
        },
      })
    }

    if (format === 'html') {
      return new NextResponse(printable.html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    return NextResponse.json({
      success: true,
      receipt: receiptData,
      printable,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/receipts/[saleId] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}
