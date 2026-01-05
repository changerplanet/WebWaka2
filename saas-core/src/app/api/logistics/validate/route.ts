/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Validation API Route - Module validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ValidationService } from '@/lib/logistics/validation-service'

/**
 * GET /api/logistics/validate
 * Validate module integrity
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId

    const result = await ValidationService.validateModule(tenantId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error validating module:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/validate
 * Get module manifest
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manifest = ValidationService.getModuleManifest()

    return NextResponse.json(manifest)
  } catch (error) {
    console.error('Error getting manifest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
