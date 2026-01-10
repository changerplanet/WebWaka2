/**
 * Commerce Wallets API
 * 
 * GET /api/wallets - List wallets for tenant
 * POST /api/wallets - Create a new wallet
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateWallet } from '@/lib/commerce-wallet-service'

type CommerceWalletType = 'CUSTOMER' | 'VENDOR' | 'PLATFORM'

/**
 * GET /api/wallets
 * List wallets for tenant with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type') as CommerceWalletType | null
    const customerId = searchParams.get('customerId')
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = { tenantId }
    if (type) where.type = type
    if (customerId) where.customerId = customerId
    if (vendorId) where.vendorId = vendorId
    if (status) where.status = status

    const [wallets, total] = await Promise.all([
      prisma.commerce_wallets.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.commerce_wallets.count({ where })
    ])

    return NextResponse.json({
      success: true,
      wallets: wallets.map(w => ({
        id: w.id,
        tenantId: w.tenantId,
        type: w.type,
        customerId: w.customerId,
        vendorId: w.vendorId,
        balance: Number(w.balance),
        pendingBalance: Number(w.pendingBalance),
        availableBalance: Number(w.availableBalance),
        currency: w.currency,
        status: w.status,
        metadata: w.metadata,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString()
      })),
      pagination: { total, limit, offset }
    })

  } catch (error) {
    console.error('[Wallets] Error listing wallets:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wallets
 * Create a new wallet or get existing one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, type, customerId, vendorId, currency, metadata } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!type || !['CUSTOMER', 'VENDOR', 'PLATFORM'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be CUSTOMER, VENDOR, or PLATFORM' },
        { status: 400 }
      )
    }

    // Validate owner based on type
    if (type === 'CUSTOMER' && !customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required for CUSTOMER wallet' },
        { status: 400 }
      )
    }

    if (type === 'VENDOR' && !vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendorId is required for VENDOR wallet' },
        { status: 400 }
      )
    }

    if (type === 'PLATFORM' && (customerId || vendorId)) {
      return NextResponse.json(
        { success: false, error: 'PLATFORM wallet should not have customerId or vendorId' },
        { status: 400 }
      )
    }

    const wallet = await getOrCreateWallet({
      tenantId,
      type,
      customerId,
      vendorId,
      currency,
      metadata
    })

    return NextResponse.json({
      success: true,
      wallet: {
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
    }, { status: 201 })

  } catch (error) {
    console.error('[Wallets] Error creating wallet:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
