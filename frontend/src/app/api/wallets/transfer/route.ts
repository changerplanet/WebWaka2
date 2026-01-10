/**
 * Wallet Transfer API
 * 
 * POST /api/wallets/transfer - Transfer funds between wallets
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transferFunds } from '@/lib/commerce-wallet-service'

/**
 * POST /api/wallets/transfer
 * Transfer funds from one wallet to another
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId,
      fromWalletId,
      toWalletId,
      amount,
      description,
      referenceType,
      referenceId,
      idempotencyKey,
      createdBy
    } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!fromWalletId || !toWalletId) {
      return NextResponse.json(
        { success: false, error: 'fromWalletId and toWalletId are required' },
        { status: 400 }
      )
    }

    if (fromWalletId === toWalletId) {
      return NextResponse.json(
        { success: false, error: 'Cannot transfer to the same wallet' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, error: 'idempotencyKey is required' },
        { status: 400 }
      )
    }

    // Verify both wallets belong to tenant
    const [fromWallet, toWallet] = await Promise.all([
      prisma.commerce_wallets.findUnique({ where: { id: fromWalletId } }),
      prisma.commerce_wallets.findUnique({ where: { id: toWalletId } })
    ])

    if (!fromWallet) {
      return NextResponse.json(
        { success: false, error: 'Source wallet not found' },
        { status: 404 }
      )
    }

    if (!toWallet) {
      return NextResponse.json(
        { success: false, error: 'Destination wallet not found' },
        { status: 404 }
      )
    }

    if (fromWallet.tenantId !== tenantId || toWallet.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Both wallets must belong to the same tenant' },
        { status: 403 }
      )
    }

    const result = await transferFunds({
      fromWalletId,
      toWalletId,
      amount,
      description,
      referenceType,
      referenceId,
      idempotencyKey,
      createdBy
    })

    // Get updated wallet balances
    const [updatedFrom, updatedTo] = await Promise.all([
      prisma.commerce_wallets.findUnique({ where: { id: fromWalletId } }),
      prisma.commerce_wallets.findUnique({ where: { id: toWalletId } })
    ])

    return NextResponse.json({
      success: true,
      isDuplicate: result.isDuplicate,
      transfer: {
        fromWalletId,
        toWalletId,
        amount,
        idempotencyKey
      },
      fromWallet: updatedFrom ? {
        id: updatedFrom.id,
        balance: Number(updatedFrom.balance),
        availableBalance: Number(updatedFrom.availableBalance)
      } : null,
      toWallet: updatedTo ? {
        id: updatedTo.id,
        balance: Number(updatedTo.balance),
        availableBalance: Number(updatedTo.availableBalance)
      } : null
    })

  } catch (error) {
    console.error('[Wallets] Error transferring funds:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
