export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sale = await prisma.pos_sale.findFirst({
      where: {
        id: params.id,
        tenantId: session.activeTenantId,
      },
      include: {
        items: true,
      }
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    const receipt = await prisma.receipt.findFirst({
      where: { 
        sourceType: 'POS_SALE',
        sourceId: sale.id 
      },
      include: { items: true }
    })

    return NextResponse.json({
      success: true,
      sale: {
        ...sale,
        subtotal: Number(sale.subtotal),
        discountTotal: Number(sale.discountTotal),
        taxTotal: Number(sale.taxTotal),
        grandTotal: Number(sale.grandTotal),
        amountTendered: sale.amountTendered ? Number(sale.amountTendered) : null,
        changeGiven: sale.changeGiven ? Number(sale.changeGiven) : null,
        taxRate: sale.taxRate ? Number(sale.taxRate) : null,
        items: sale.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          tax: Number(item.tax),
          lineTotal: Number(item.lineTotal),
        })),
        receipt: receipt ? {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          verificationQrCode: receipt.verificationQrCode,
          items: receipt.items,
        } : null,
      },
    })
    
  } catch (error) {
    console.error('Sale fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}
