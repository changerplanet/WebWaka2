export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession, AuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isSupervisorRole(session: AuthSession): boolean {
  if (session.user.globalRole === 'SUPER_ADMIN') return true
  const membership = session.user.memberships?.find(m => m.tenantId === session.activeTenantId)
  if (membership?.role === 'TENANT_ADMIN') return true
  return false
}

const ADJUSTMENT_TYPES = [
  'ADJUST_UP',
  'ADJUST_DOWN',
  'DAMAGE',
  'THEFT',
  'COUNTING_ERROR',
  'SYSTEM_ERROR',
] as const

type AdjustmentType = typeof ADJUSTMENT_TYPES[number]

function generateAdjustmentNumber(count: number): string {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  return `ADJ-${dateStr}-${String(count).padStart(5, '0')}`
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
    const shiftId = searchParams.get('shiftId')
    const locationId = searchParams.get('locationId')
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    }

    if (shiftId) where.shiftId = shiftId
    if (locationId) where.locationId = locationId
    if (productId) where.productId = productId

    const adjustments = await (prisma as any).pos_inventory_adjustment.findMany({
      where,
      orderBy: { performedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      adjustments: adjustments.map((adj: any) => ({
        ...adj,
        quantityBefore: Number(adj.quantityBefore),
        quantityAfter: Number(adj.quantityAfter),
        quantityChange: Number(adj.quantityChange),
      })),
      count: adjustments.length,
    })
    
  } catch (error) {
    console.error('[POS] Error fetching adjustments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
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

    const body = await request.json()
    const {
      locationId,
      registerId,
      shiftId,
      productId,
      variantId,
      productName,
      sku,
      quantityBefore,
      quantityAfter,
      adjustmentType,
      reason,
      notes,
      supervisorApproval,
    } = body

    if (!locationId || !productId || !productName) {
      return NextResponse.json(
        { success: false, error: 'locationId, productId, and productName are required' },
        { status: 400 }
      )
    }

    if (quantityBefore === undefined || quantityAfter === undefined) {
      return NextResponse.json(
        { success: false, error: 'quantityBefore and quantityAfter are required' },
        { status: 400 }
      )
    }

    if (!adjustmentType || !ADJUSTMENT_TYPES.includes(adjustmentType)) {
      return NextResponse.json(
        { success: false, error: `adjustmentType must be one of: ${ADJUSTMENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A reason of at least 5 characters is required' },
        { status: 400 }
      )
    }

    if (!supervisorApproval) {
      return NextResponse.json({
        success: false,
        error: 'Supervisor approval is required for all inventory adjustments',
        requiresSupervisorApproval: true,
      }, { status: 403 })
    }

    const isSelfApproval = !supervisorApproval.approvedById || supervisorApproval.approvedById === session.user.id
    
    if (isSelfApproval && !isSupervisorRole(session)) {
      return NextResponse.json({
        success: false,
        error: 'Dual-control required: A supervisor or manager must approve inventory adjustments. You cannot approve your own adjustment.',
        requiresSupervisorApproval: true,
      }, { status: 403 })
    }

    const isValidSupervisor = 
      isSupervisorRole(session) ||
      (supervisorApproval.pin && supervisorApproval.pin.length >= 4 && supervisorApproval.approvedById && supervisorApproval.approvedById !== session.user.id)
    
    if (!isValidSupervisor) {
      return NextResponse.json({
        success: false,
        error: 'Invalid supervisor credentials. A different supervisor must approve, or provide valid supervisor PIN.',
      }, { status: 403 })
    }

    console.log('[POS Audit] Supervisor approval verified:', {
      performedBy: session.user.id,
      approvedBy: supervisorApproval.approvedById || session.user.id,
      isSelfApproval,
      isSupervisorRole: isSupervisorRole(session),
    })

    const quantityChange = quantityAfter - quantityBefore

    const adjCount = await (prisma as any).pos_inventory_adjustment.count({
      where: { tenantId: session.activeTenantId }
    })
    const adjustmentNumber = generateAdjustmentNumber(adjCount + 1)

    const adjustment = await (prisma as any).pos_inventory_adjustment.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: session.activeTenantId,
        locationId,
        registerId: registerId || null,
        shiftId: shiftId || null,
        adjustmentNumber,
        adjustmentType: adjustmentType as AdjustmentType,
        productId,
        variantId: variantId || null,
        productName,
        sku: sku || null,
        quantityBefore,
        quantityAfter,
        quantityChange,
        reason: reason.trim(),
        notes: notes || null,
        performedById: session.user.id,
        performedByName: session.user.name || 'Unknown',
        performedAt: new Date(),
        approvedById: supervisorApproval.approvedById || session.user.id,
        approvedByName: supervisorApproval.approvedByName || session.user.name || 'Unknown',
        approvedAt: new Date(),
      }
    })

    console.log('[POS Audit] Inventory adjustment created:', {
      adjustmentNumber,
      adjustmentType,
      productId,
      productName,
      quantityBefore,
      quantityAfter,
      quantityChange,
      performedBy: session.user.id,
      approvedBy: supervisorApproval.approvedById || session.user.id,
    })

    return NextResponse.json({
      success: true,
      adjustment: {
        ...adjustment,
        quantityBefore: Number(adjustment.quantityBefore),
        quantityAfter: Number(adjustment.quantityAfter),
        quantityChange: Number(adjustment.quantityChange),
      },
    })
    
  } catch (error) {
    console.error('[POS] Error creating adjustment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
