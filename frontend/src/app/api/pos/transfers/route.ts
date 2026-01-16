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

const TRANSFER_TYPES = ['DRAWER_TO_DRAWER', 'DRAWER_TO_SAFE', 'SAFE_TO_DRAWER'] as const

function generateTransferNumber(count: number): string {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  return `TRF-${dateStr}-${String(count).padStart(5, '0')}`
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
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    }

    if (shiftId) {
      where.OR = [{ fromShiftId: shiftId }, { toShiftId: shiftId }]
    }
    if (locationId) where.locationId = locationId

    const transfers = await (prisma as any).pos_drawer_transfer.findMany({
      where,
      orderBy: { initiatedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      transfers: transfers.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
      })),
      count: transfers.length,
    })
    
  } catch (error) {
    console.error('[POS] Error fetching transfers:', error)
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
      transferType,
      fromRegisterId,
      fromShiftId,
      toRegisterId,
      toShiftId,
      amount,
      reason,
      notes,
      supervisorApproval,
    } = body

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      )
    }

    if (!transferType || !TRANSFER_TYPES.includes(transferType)) {
      return NextResponse.json(
        { success: false, error: `transferType must be one of: ${TRANSFER_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
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
        error: 'Dual-control: Supervisor approval is required for all cash transfers',
        requiresSupervisorApproval: true,
      }, { status: 403 })
    }

    const isSelfApproval = !supervisorApproval.approvedById || supervisorApproval.approvedById === session.user.id
    
    if (isSelfApproval && !isSupervisorRole(session)) {
      return NextResponse.json({
        success: false,
        error: 'Dual-control required: A supervisor or manager must approve cash transfers. You cannot approve your own transfer.',
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

    if (fromShiftId) {
      const fromShift = await prisma.pos_shift.findFirst({
        where: { id: fromShiftId, tenantId: session.activeTenantId, locationId }
      })
      if (!fromShift) {
        return NextResponse.json({
          success: false,
          error: 'Source shift not found or does not belong to this location',
        }, { status: 400 })
      }
    }

    if (toShiftId) {
      const toShift = await prisma.pos_shift.findFirst({
        where: { id: toShiftId, tenantId: session.activeTenantId, locationId }
      })
      if (!toShift) {
        return NextResponse.json({
          success: false,
          error: 'Destination shift not found or does not belong to this location',
        }, { status: 400 })
      }
    }

    console.log('[POS Audit] Dual-control approval verified:', {
      initiatedBy: session.user.id,
      approvedBy: supervisorApproval.approvedById || session.user.id,
      isSelfApproval,
      isSupervisorRole: isSupervisorRole(session),
    })

    const transferCount = await (prisma as any).pos_drawer_transfer.count({
      where: { tenantId: session.activeTenantId }
    })
    const transferNumber = generateTransferNumber(transferCount + 1)

    const transfer = await (prisma as any).pos_drawer_transfer.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: session.activeTenantId,
        locationId,
        transferNumber,
        transferType,
        fromRegisterId: fromRegisterId || null,
        fromShiftId: fromShiftId || null,
        toRegisterId: toRegisterId || null,
        toShiftId: toShiftId || null,
        amount,
        reason: reason.trim(),
        notes: notes || null,
        initiatedById: session.user.id,
        initiatedByName: session.user.name || 'Unknown',
        initiatedAt: new Date(),
        approvedById: supervisorApproval.approvedById || session.user.id,
        approvedByName: supervisorApproval.approvedByName || session.user.name || 'Unknown',
        approvedAt: new Date(),
        status: 'COMPLETED',
      }
    })

    if (fromShiftId) {
      await prisma.pos_cash_movement.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: session.activeTenantId,
          shiftId: fromShiftId,
          movementType: (transferType === 'DRAWER_TO_SAFE' ? 'SAFE_DROP' : 'DRAWER_TRANSFER') as any,
          amount,
          direction: 'OUT',
          referenceType: 'TRANSFER',
          referenceId: transfer.id,
          referenceNumber: transferNumber,
          performedById: session.user.id,
          performedByName: session.user.name || 'Unknown',
          approvedById: supervisorApproval.approvedById || session.user.id,
          approvedByName: supervisorApproval.approvedByName || session.user.name || 'Unknown',
          reason: reason.trim(),
          notes: notes || null,
        }
      })
    }

    if (toShiftId) {
      await prisma.pos_cash_movement.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: session.activeTenantId,
          shiftId: toShiftId,
          movementType: (transferType === 'SAFE_TO_DRAWER' ? 'SAFE_PICKUP' : 'DRAWER_TRANSFER') as any,
          amount,
          direction: 'IN',
          referenceType: 'TRANSFER',
          referenceId: transfer.id,
          referenceNumber: transferNumber,
          performedById: session.user.id,
          performedByName: session.user.name || 'Unknown',
          approvedById: supervisorApproval.approvedById || session.user.id,
          approvedByName: supervisorApproval.approvedByName || session.user.name || 'Unknown',
          reason: reason.trim(),
          notes: notes || null,
        }
      })
    }

    console.log('[POS Audit] Drawer transfer created:', {
      transferNumber,
      transferType,
      amount,
      fromShiftId,
      toShiftId,
      initiatedBy: session.user.id,
      approvedBy: supervisorApproval.approvedById || session.user.id,
    })

    return NextResponse.json({
      success: true,
      transfer: {
        ...transfer,
        amount: Number(transfer.amount),
      },
    })
    
  } catch (error) {
    console.error('[POS] Error creating transfer:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
