export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSaleNumber, generateReceiptNumber, POS_CONFIG } from '@/lib/pos/config'

interface SaleItem {
  productId: string
  variantId?: string
  productName: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  lineTotal: number
}

interface CreateSaleInput {
  locationId: string
  locationName?: string
  shiftId?: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  items: SaleItem[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  taxRate?: number
  grandTotal: number
  paymentMethod: string
  amountTendered?: number
  changeGiven?: number
  transferReference?: string
  transferImage?: string
  roundingMode?: 'N5' | 'N10' | null
  roundingAdjustment?: number
  offlineId?: string
  isOffline?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateSaleInput = await request.json()

    if (!body.locationId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Location and items are required' },
        { status: 400 }
      )
    }

    if (body.paymentMethod === 'TRANSFER' && !body.transferReference) {
      return NextResponse.json(
        { success: false, error: 'Transfer reference is required for bank transfer payments' },
        { status: 400 }
      )
    }

    if (body.offlineId) {
      const existingSale = await prisma.pos_sale.findFirst({
        where: {
          tenantId: session.activeTenantId,
          offlineId: body.offlineId,
        }
      })
      
      if (existingSale) {
        const existingReceipt = await prisma.receipt.findFirst({
          where: {
            tenantId: session.activeTenantId,
            sourceType: 'POS_SALE',
            sourceId: existingSale.id,
          }
        })
        
        return NextResponse.json({
          success: true,
          sale: {
            id: existingSale.id,
            saleNumber: existingSale.saleNumber,
            receiptNumber: existingSale.receiptNumber,
            grandTotal: Number(existingSale.grandTotal),
            paymentMethod: existingSale.paymentMethod,
            receiptId: existingReceipt?.id,
            qrVerificationCode: existingReceipt?.verificationQrCode,
          },
        })
      }
    }

    const saleCount = await prisma.pos_sale.count({
      where: { tenantId: session.activeTenantId }
    })
    const saleNumber = generateSaleNumber(saleCount + 1)
    const receiptNumber = generateReceiptNumber(saleCount + 1)

    const sale = await prisma.pos_sale.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: session.activeTenantId,
        locationId: body.locationId,
        shiftId: body.shiftId,
        saleNumber,
        receiptNumber,
        staffId: session.user.id,
        staffName: session.user.name || 'Unknown',
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        saleDate: new Date(),
        completedAt: new Date(),
        status: 'COMPLETED',
        subtotal: body.subtotal,
        discountTotal: body.discountTotal,
        taxTotal: body.taxTotal,
        taxRate: body.taxRate || POS_CONFIG.defaultTaxRate,
        grandTotal: body.grandTotal,
        currency: POS_CONFIG.currency,
        paymentMethod: body.paymentMethod,
        amountTendered: body.amountTendered,
        changeGiven: body.changeGiven,
        transferReference: body.transferReference,
        offlineId: body.offlineId,
        syncedAt: body.isOffline ? null : new Date(),
        updatedAt: new Date(),
        items: {
          create: body.items.map(item => ({
            id: crypto.randomUUID(),
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            lineTotal: item.lineTotal,
            returnedQuantity: 0,
            refundedAmount: 0,
          }))
        }
      },
      include: {
        items: true,
      }
    })

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.activeTenantId },
      select: { name: true }
    })

    const qrCode = `${receiptNumber}-${Date.now().toString(36).toUpperCase()}`
    
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
        transactionDate: new Date(),
        currency: POS_CONFIG.currency,
        subtotal: body.subtotal,
        discountTotal: body.discountTotal,
        taxTotal: body.taxTotal,
        roundingAmount: body.roundingAdjustment || 0,
        roundingMode: body.roundingMode,
        grandTotal: body.grandTotal,
        paymentMethod: body.paymentMethod,
        amountTendered: body.amountTendered,
        changeGiven: body.changeGiven,
        paymentReference: body.transferReference,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        staffId: session.user.id,
        staffName: session.user.name || 'Unknown',
        verificationQrCode: qrCode,
        updatedAt: new Date(),
        items: {
          create: body.items.map((item, index) => ({
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

    console.log('[POS Audit] Sale completed:', {
      saleNumber,
      receiptNumber,
      grandTotal: body.grandTotal,
      paymentMethod: body.paymentMethod,
      itemCount: body.items.length,
      isOffline: body.isOffline || false,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        receiptNumber: sale.receiptNumber,
        grandTotal: Number(sale.grandTotal),
        paymentMethod: sale.paymentMethod,
        receiptId: receipt.id,
        qrVerificationCode: qrCode,
      },
    })
    
  } catch (error) {
    console.error('Sale creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const locationId = searchParams.get('locationId')

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const where: {
      tenantId: string
      saleDate: { gte: Date; lte: Date }
      locationId?: string
    } = {
      tenantId: session.activeTenantId,
      saleDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    }

    if (locationId) {
      where.locationId = locationId
    }

    const sales = await prisma.pos_sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      take: 100,
      select: {
        id: true,
        saleNumber: true,
        receiptNumber: true,
        saleDate: true,
        status: true,
        grandTotal: true,
        paymentMethod: true,
        customerName: true,
        staffName: true,
        currency: true,
      }
    })

    const saleIds = sales.map(s => s.id)
    
    const receipts = await prisma.receipt.findMany({
      where: {
        sourceType: 'POS_SALE',
        sourceId: { in: saleIds }
      },
      select: {
        id: true,
        sourceId: true,
        receiptNumber: true,
      }
    })

    const receiptMap = new Map(receipts.map(r => [r.sourceId, r]))

    const salesWithReceipts = sales.map(sale => ({
      ...sale,
      grandTotal: Number(sale.grandTotal),
      hasReceipt: receiptMap.has(sale.id),
      receiptId: receiptMap.get(sale.id)?.id,
    }))

    return NextResponse.json({
      success: true,
      sales: salesWithReceipts,
      date,
    })
    
  } catch (error) {
    console.error('Sales fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}
