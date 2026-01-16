export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPOSReceiptToCustomer } from '@/lib/notifications/whatsapp/commerce-integration'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiptId, customerPhone } = body

    if (!receiptId) {
      return NextResponse.json(
        { success: false, error: 'receiptId is required' },
        { status: 400 }
      )
    }

    if (!customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Customer phone number is required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizeNigerianPhone(customerPhone)
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number. Use Nigerian format (e.g., 08012345678)' },
        { status: 400 }
      )
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        tenantId: session.activeTenantId,
      },
      include: { items: true }
    })

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }

    const success = await sendPOSReceiptToCustomer(
      session.activeTenantId,
      normalizedPhone,
      receipt.receiptNumber,
      receipt.businessName,
      receipt.items.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        price: Number(item.lineTotal),
      })),
      Number(receipt.subtotal),
      Number(receipt.taxTotal),
      Number(receipt.grandTotal),
      receipt.paymentMethod,
      receipt.staffName || undefined
    )

    await prisma.receipt_delivery.create({
      data: {
        id: crypto.randomUUID(),
        receiptId: receipt.id,
        channel: 'WHATSAPP',
        status: success ? 'SUCCESS' : 'FAILED',
        recipientPhone: normalizedPhone,
        initiatedById: session.user.id,
        initiatedByName: session.user.name || 'Unknown',
      }
    })

    console.log('[POS Audit] Receipt WhatsApp delivery:', {
      receiptNumber: receipt.receiptNumber,
      recipient: normalizedPhone,
      success,
      userId: session.user.id,
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Receipt sent via WhatsApp',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send WhatsApp message. It may have been queued for later delivery.',
      })
    }
    
  } catch (error) {
    console.error('WhatsApp receipt error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send receipt via WhatsApp' },
      { status: 500 }
    )
  }
}

function normalizeNigerianPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `234${cleaned.substring(1)}`
  }
  
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return `234${cleaned}`
  }
  
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return cleaned
  }
  
  if (cleaned.length === 14 && cleaned.startsWith('2340')) {
    return `234${cleaned.substring(4)}`
  }
  
  return null
}
