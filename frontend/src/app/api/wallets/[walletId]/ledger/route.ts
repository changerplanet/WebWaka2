export const dynamic = 'force-dynamic'

/**
 * Wallet Ledger Entries API
 * 
 * GET /api/wallets/:walletId/ledger - Get ledger entries for wallet
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLedgerEntries } from '@/lib/commerce-wallet-service'
import { LedgerEntryType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ walletId: string }>
}

/**
 * GET /api/wallets/:walletId/ledger
 * Get paginated ledger entries with filters
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { walletId } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const entryType = searchParams.get('entryType')
    const referenceType = searchParams.get('referenceType')
    const referenceId = searchParams.get('referenceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Verify wallet belongs to tenant
    const wallet = await prisma.commerce_wallets.findUnique({
      where: { id: walletId }
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      )
    }

    if (wallet.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Wallet does not belong to this tenant' },
        { status: 403 }
      )
    }

    const options: {
      limit?: number;
      offset?: number;
      entryType?: LedgerEntryType;
      referenceType?: string;
      referenceId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {
      limit,
      offset,
      entryType: entryType as LedgerEntryType | undefined,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    }

    const result = await getLedgerEntries(walletId, options)

    return NextResponse.json({
      success: true,
      entries: result.entries.map(e => ({
        id: e.id,
        entryType: e.entryType,
        status: e.status,
        amount: Number(e.amount),
        currency: e.currency,
        balanceAfter: Number(e.balanceAfter),
        pendingBalanceAfter: Number(e.pendingBalanceAfter),
        availableBalanceAfter: Number(e.availableBalanceAfter),
        referenceType: e.referenceType,
        referenceId: e.referenceId,
        counterpartyWalletId: e.counterpartyWalletId,
        holdId: e.holdId,
        description: e.description,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
        createdBy: e.createdBy
      })),
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      },
      wallet: {
        id: wallet.id,
        balance: Number(wallet.balance),
        pendingBalance: Number(wallet.pendingBalance),
        availableBalance: Number(wallet.availableBalance)
      }
    })

  } catch (error) {
    console.error('[Wallets] Error fetching ledger:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
