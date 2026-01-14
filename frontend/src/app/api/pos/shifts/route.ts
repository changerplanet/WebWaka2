export const dynamic = 'force-dynamic'

/**
 * POS Shifts API
 * 
 * Manages shift open/close operations for POS module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/pos/shifts
 * List shifts for a tenant/location
 */
export async function GET(request: NextRequest) {
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const where: any = { tenantId }
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    
    const [shifts, total] = await Promise.all([
      prisma.pos_shift.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.pos_shift.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('[POS Shifts] Error fetching shifts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pos/shifts
 * Open a new shift or close an existing shift
 */
export async function POST(request: NextRequest) {
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { action, tenantId, locationId, userId, userName, shiftId, openingFloat, closingData } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (action === 'open') {
      if (!locationId || !userId || !userName) {
        return NextResponse.json(
          { success: false, error: 'locationId, userId, and userName are required to open a shift' },
          { status: 400 }
        )
      }

      const existingOpenShift = await prisma.pos_shift.findFirst({
        where: {
          tenantId,
          locationId,
          status: 'OPEN'
        }
      })

      if (existingOpenShift) {
        return NextResponse.json(
          { success: false, error: 'A shift is already open for this location', existingShift: existingOpenShift },
          { status: 400 }
        )
      }

      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      const count = await prisma.pos_shift.count({
        where: {
          tenantId,
          shiftNumber: { startsWith: `SHIFT-${dateStr}` }
        }
      })
      const shiftNumber = `SHIFT-${dateStr}-${String(count + 1).padStart(3, '0')}`

      const newShift = await prisma.pos_shift.create({
        data: {
          tenantId,
          locationId,
          shiftNumber,
          openedById: userId,
          openedByName: userName,
          openingFloat: openingFloat || 0,
          status: 'OPEN',
          currency: 'NGN'
        }
      })

      return NextResponse.json({
        success: true,
        shift: newShift,
        message: 'Shift opened successfully'
      })
    }

    if (action === 'close') {
      if (!shiftId) {
        return NextResponse.json(
          { success: false, error: 'shiftId is required to close a shift' },
          { status: 400 }
        )
      }

      const shift = await prisma.pos_shift.findUnique({
        where: { id: shiftId }
      })

      if (!shift) {
        return NextResponse.json(
          { success: false, error: 'Shift not found' },
          { status: 404 }
        )
      }

      if (shift.status !== 'OPEN') {
        return NextResponse.json(
          { success: false, error: 'Shift is not open' },
          { status: 400 }
        )
      }

      const updatedShift = await prisma.pos_shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: closingData?.userId || userId,
          closedByName: closingData?.userName || userName,
          actualCash: closingData?.actualCash,
          expectedCash: closingData?.expectedCash,
          cashVariance: closingData?.actualCash && closingData?.expectedCash 
            ? closingData.actualCash - closingData.expectedCash 
            : null
        }
      })

      return NextResponse.json({
        success: true,
        shift: updatedShift,
        message: 'Shift closed successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "open" or "close"' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('[POS Shifts] Error managing shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
