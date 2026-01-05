/**
 * PHASE 4A: Partner Me API
 * 
 * GET /api/partner/me - Get current user's partner info
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getCurrentSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Find user's partner membership
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: {
          status: 'ACTIVE'
        }
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            email: true,
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
    
    return NextResponse.json({
      success: true,
      partner: partnerUser.partner,
      role: partnerUser.role,
    })
  } catch (error) {
    console.error('Failed to get partner info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get partner info' },
      { status: 500 }
    )
  }
}
