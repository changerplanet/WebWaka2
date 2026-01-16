export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptNumber, POS_CONFIG } from '@/lib/pos/config'

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
    const { saleId } = body

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId is required' },
        { status: 400 }
      )
    }

    const sale = await prisma.pos_sale.findFirst({
      where: {
        id: saleId,
        tenantId: session.activeTenantId,
      },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    const existingReceipt = await prisma.receipt.findFirst({
      where: { 
        tenantId: session.activeTenantId,
        sourceType: 'POS_SALE',
        sourceId: sale.id 
      },
      include: { items: true }
    })

    if (existingReceipt) {
      return NextResponse.json({
        success: true,
        receipt: existingReceipt,
      })
    }

    const receiptNumber = generateReceiptNumber(Date.now())
    const qrCode = `${receiptNumber}-${Date.now().toString(36).toUpperCase()}`

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.activeTenantId },
      select: { name: true }
    })

    const receipt = await prisma.receipt.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: session.activeTenantId,
        receiptNumber,
        receiptType: 'POS_SALE',
        syncStatus: 'SYNCED',
        sourceType: 'POS_SALE',
        sourceId: sale.id,
        businessName: tenant?.name || 'Store',
        transactionDate: sale.saleDate,
        currency: sale.currency,
        subtotal: sale.subtotal,
        discountTotal: sale.discountTotal,
        taxTotal: sale.taxTotal,
        grandTotal: sale.grandTotal,
        paymentMethod: sale.paymentMethod,
        amountTendered: sale.amountTendered,
        changeGiven: sale.changeGiven,
        paymentReference: sale.transferReference,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        staffId: sale.staffId,
        staffName: sale.staffName,
        verificationQrCode: qrCode,
        updatedAt: new Date(),
        items: {
          create: sale.items.map((item, index) => ({
            id: crypto.randomUUID(),
            itemType: 'PRODUCT',
            productId: item.productId,
            description: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            lineTotal: item.lineTotal,
            displayOrder: index,
          }))
        }
      },
      include: {
        items: true,
      }
    })

    console.log('[POS Audit] Receipt generated:', {
      receiptNumber,
      saleId,
      grandTotal: Number(sale.grandTotal),
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      receipt,
    })
    
  } catch (error) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const receiptId = searchParams.get('id')
    const saleId = searchParams.get('saleId')
    const qrCode = searchParams.get('qr')

    let receipt

    if (qrCode) {
      receipt = await prisma.receipt.findFirst({
        where: { 
          tenantId: session.activeTenantId,
          verificationQrCode: qrCode 
        },
        include: { items: true }
      })
    } else if (receiptId) {
      receipt = await prisma.receipt.findFirst({
        where: {
          id: receiptId,
          tenantId: session.activeTenantId,
        },
        include: { items: true }
      })
    } else if (saleId) {
      receipt = await prisma.receipt.findFirst({
        where: {
          sourceType: 'POS_SALE',
          sourceId: saleId,
          tenantId: session.activeTenantId,
        },
        include: { items: true }
      })
    }

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
    
  } catch (error) {
    console.error('Receipt fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}
