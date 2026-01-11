export const dynamic = 'force-dynamic'

/**
 * PHASE 4B: Partner Packages API
 * 
 * GET /api/partner/packages - List all packages
 * POST /api/partner/packages - Create new package
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPartnerPackages,
  createPartnerPackage,
  calculatePackageMargin,
} from '@/lib/phase-4b/partner-packages'
import { hasPermission } from '@/lib/phase-4b/partner-staff'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    // Get partner for this user
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id },
      include: { partner: true }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'
    
    const packages = await getPartnerPackages(partnerUser.partnerId, {
      includeInactive,
    })
    
    // Add margin calculation for admin view
    const packagesWithMargin = packages.map(pkg => ({
      ...pkg,
      margin: calculatePackageMargin(pkg),
    }))
    
    return NextResponse.json({
      success: true,
      packages: packagesWithMargin,
    })
  } catch (error) {
    console.error('Packages GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    // Get partner and check permissions
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    if (!hasPermission(partnerUser.role, 'canManagePackages')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage packages' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    const result = await createPartnerPackage({
      partnerId: partnerUser.partnerId,
      name: body.name,
      slug: body.slug,
      description: body.description,
      includedInstances: body.includedInstances,
      includedSuiteKeys: body.includedSuiteKeys,
      priceMonthly: body.priceMonthly,
      priceYearly: body.priceYearly,
      setupFee: body.setupFee,
      trialDays: body.trialDays,
      currency: body.currency,
      wholesaleCostMonthly: body.wholesaleCostMonthly,
      features: body.features,
      isPublic: body.isPublic,
      sortOrder: body.sortOrder,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      package: result.package,
    })
  } catch (error) {
    console.error('Package create error:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
