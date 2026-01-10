/**
 * Get Current User's Partner Info
 * 
 * GET /api/partners/me - Get the partner ID for the current user
 */

import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find partner membership for this user
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: session.user.id },
      include: {
        Partner: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            tier: true
          }
        }
      }
    })

    if (!partnerUser) {
      return NextResponse.json(
        { success: false, error: 'Not a partner user' },
        { status: 403 }
      )
    }

    if (!partnerUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'Partner membership is disabled' },
        { status: 403 }
      )
    }

    if (partnerUser.partner.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Partner organization is not active' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      partnerId: partnerUser.partnerId,
      partner: partnerUser.partner,
      role: partnerUser.role
    })

  } catch (error) {
    console.error('Error fetching partner info:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
