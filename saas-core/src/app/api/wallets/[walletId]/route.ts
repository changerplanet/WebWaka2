/**
 * Commerce Wallet by ID API
 * 
 * GET /api/wallets/:walletId - Get wallet details with ledger
 * PUT /api/wallets/:walletId - Update wallet status
 * POST /api/wallets/:walletId - Perform wallet operations (credit, debit, hold)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getWalletWithLedger,
  creditWallet,
  debitWallet,
  createHold,
  releaseHold,
  captureHold,
  recalculateBalance,
  getLedgerEntries
} from '@/lib/commerce-wallet-service'

type LedgerEntryType = 
  | 'CREDIT_ORDER_PAYMENT' | 'CREDIT_REFUND' | 'CREDIT_SALE_PROCEEDS' 
  | 'CREDIT_PLATFORM_FEE' | 'CREDIT_ADJUSTMENT' | 'CREDIT_TRANSFER_IN' | 'CREDIT_PAYOUT_REVERSAL'
  | 'DEBIT_ORDER_PAYMENT' | 'DEBIT_VENDOR_COMMISSION' | 'DEBIT_PLATFORM_FEE'
  | 'DEBIT_PAYOUT' | 'DEBIT_ADJUSTMENT' | 'DEBIT_TRANSFER_OUT' | 'DEBIT_CHARGEBACK'
  | 'HOLD_CREATED' | 'HOLD_RELEASED' | 'HOLD_CAPTURED'

interface RouteParams {
  params: Promise<{ walletId: string }>
}

/**
 * GET /api/wallets/:walletId
 * Get wallet details with recent ledger entries
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { walletId } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const includeLedger = searchParams.get('includeLedger') !== 'false'
    const ledgerLimit = parseInt(searchParams.get('ledgerLimit') || '20')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const wallet = includeLedger 
      ? await getWalletWithLedger(walletId, ledgerLimit)
      : await prisma.commerceWallet.findUnique({ where: { id: walletId } })

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

    const response: Record<string, unknown> = {
      id: wallet.id,
      tenantId: wallet.tenantId,
      type: wallet.type,
      customerId: wallet.customerId,
      vendorId: wallet.vendorId,
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      availableBalance: Number(wallet.availableBalance),
      currency: wallet.currency,
      status: wallet.status,
      metadata: wallet.metadata,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString()
    }

    if (includeLedger && 'ledgerEntries' in wallet) {
      response.ledgerEntries = wallet.ledgerEntries.map(e => ({
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
        holdId: e.holdId,
        description: e.description,
        createdAt: e.createdAt.toISOString()
      }))
    }

    return NextResponse.json({
      success: true,
      wallet: response
    })

  } catch (error) {
    console.error('[Wallets] Error fetching wallet:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/wallets/:walletId
 * Update wallet status or recalculate balance
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { walletId } = await params
    const body = await request.json()
    const { tenantId, status, recalculate } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const wallet = await prisma.commerceWallet.findUnique({
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

    // Recalculate balance from ledger if requested
    if (recalculate) {
      const result = await recalculateBalance(walletId)
      return NextResponse.json({
        success: true,
        wallet: {
          id: result.wallet.id,
          balance: Number(result.wallet.balance),
          pendingBalance: Number(result.wallet.pendingBalance),
          availableBalance: Number(result.wallet.availableBalance),
          status: result.wallet.status
        },
        reconciliation: {
          calculatedBalance: result.calculatedBalance,
          pendingBalance: result.pendingBalance,
          availableBalance: result.availableBalance,
          entryCount: result.entryCount
        }
      })
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['ACTIVE', 'FROZEN', 'SUSPENDED', 'CLOSED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      const updatedWallet = await prisma.commerceWallet.update({
        where: { id: walletId },
        data: { status }
      })

      return NextResponse.json({
        success: true,
        wallet: {
          id: updatedWallet.id,
          status: updatedWallet.status,
          updatedAt: updatedWallet.updatedAt.toISOString()
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'No valid update parameters provided' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Wallets] Error updating wallet:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wallets/:walletId
 * Perform wallet operations: credit, debit, hold, release, capture
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { walletId } = await params
    const body = await request.json()
    const {
      tenantId,
      action, // 'credit', 'debit', 'hold', 'release', 'capture'
      amount,
      entryType,
      idempotencyKey,
      holdId,
      description,
      referenceType,
      referenceId,
      metadata,
      createdBy
    } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required (credit, debit, hold, release, capture)' },
        { status: 400 }
      )
    }

    if (amount === undefined || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    // Verify wallet belongs to tenant
    const wallet = await prisma.commerceWallet.findUnique({
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

    let result

    switch (action) {
      case 'credit': {
        if (!entryType || !entryType.startsWith('CREDIT_')) {
          return NextResponse.json(
            { success: false, error: 'Valid credit entryType is required (e.g., CREDIT_REFUND, CREDIT_SALE_PROCEEDS)' },
            { status: 400 }
          )
        }
        if (!idempotencyKey) {
          return NextResponse.json(
            { success: false, error: 'idempotencyKey is required' },
            { status: 400 }
          )
        }
        result = await creditWallet(walletId, amount, entryType as LedgerEntryType, idempotencyKey, {
          description,
          referenceType,
          referenceId,
          metadata,
          createdBy
        })
        break
      }

      case 'debit': {
        if (!entryType || !entryType.startsWith('DEBIT_')) {
          return NextResponse.json(
            { success: false, error: 'Valid debit entryType is required (e.g., DEBIT_PAYOUT, DEBIT_PLATFORM_FEE)' },
            { status: 400 }
          )
        }
        if (!idempotencyKey) {
          return NextResponse.json(
            { success: false, error: 'idempotencyKey is required' },
            { status: 400 }
          )
        }
        result = await debitWallet(walletId, amount, entryType as LedgerEntryType, idempotencyKey, {
          description,
          referenceType,
          referenceId,
          metadata,
          createdBy
        })
        break
      }

      case 'hold': {
        if (!holdId) {
          return NextResponse.json(
            { success: false, error: 'holdId is required for hold action' },
            { status: 400 }
          )
        }
        result = await createHold(walletId, amount, holdId, {
          description,
          referenceType,
          referenceId,
          createdBy
        })
        break
      }

      case 'release': {
        if (!holdId) {
          return NextResponse.json(
            { success: false, error: 'holdId is required for release action' },
            { status: 400 }
          )
        }
        result = await releaseHold(walletId, amount, holdId, {
          description,
          createdBy
        })
        break
      }

      case 'capture': {
        if (!holdId) {
          return NextResponse.json(
            { success: false, error: 'holdId is required for capture action' },
            { status: 400 }
          )
        }
        result = await captureHold(walletId, amount, holdId, {
          description,
          referenceType,
          referenceId,
          createdBy
        })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}. Must be credit, debit, hold, release, or capture` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      isDuplicate: result.isDuplicate,
      wallet: {
        id: result.wallet.id,
        balance: Number(result.wallet.balance),
        pendingBalance: Number(result.wallet.pendingBalance),
        availableBalance: Number(result.wallet.availableBalance)
      },
      entry: {
        id: result.entry.id,
        entryType: result.entry.entryType,
        amount: Number(result.entry.amount),
        balanceAfter: Number(result.entry.balanceAfter),
        createdAt: result.entry.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[Wallets] Error performing wallet operation:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
