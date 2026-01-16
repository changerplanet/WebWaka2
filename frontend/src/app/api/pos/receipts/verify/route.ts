export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatNGNShort } from '@/lib/pos/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qrCode = searchParams.get('qr') || searchParams.get('code')

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'Verification code is required' },
        { status: 400 }
      )
    }

    const receipt = await prisma.receipt.findFirst({
      where: { verificationQrCode: qrCode },
      select: {
        receiptNumber: true,
        businessName: true,
        transactionDate: true,
        grandTotal: true,
        currency: true,
        paymentMethod: true,
        isVerified: true,
        isRevoked: true,
        revokedReason: true,
        syncStatus: true,
      }
    })

    if (!receipt) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Receipt not found. This code may be invalid or the receipt has been removed.',
      })
    }

    if (receipt.isRevoked) {
      return NextResponse.json({
        success: true,
        verified: false,
        status: 'REVOKED',
        message: 'This receipt has been voided.',
        reason: receipt.revokedReason,
        receipt: {
          receiptNumber: receipt.receiptNumber,
          businessName: receipt.businessName,
        }
      })
    }

    if (receipt.syncStatus === 'PENDING_SYNC') {
      return NextResponse.json({
        success: true,
        verified: false,
        status: 'PENDING',
        message: 'This receipt is pending verification. It was created offline and has not been synchronized yet.',
        receipt: {
          receiptNumber: receipt.receiptNumber,
          businessName: receipt.businessName,
        }
      })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      status: 'VERIFIED',
      message: 'This is a valid receipt.',
      receipt: {
        receiptNumber: receipt.receiptNumber,
        businessName: receipt.businessName,
        date: receipt.transactionDate,
        total: formatNGNShort(Number(receipt.grandTotal)),
        paymentMethod: receipt.paymentMethod,
      }
    })
    
  } catch (error) {
    console.error('Receipt verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify receipt' },
      { status: 500 }
    )
  }
}
