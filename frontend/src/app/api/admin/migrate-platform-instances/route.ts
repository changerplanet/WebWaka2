export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/migrate-platform-instances
 * 
 * Admin endpoint to migrate existing tenants to have default platform instances.
 * Safe to run multiple times (idempotent).
 * 
 * Phase 2: Ensures backward compatibility with existing tenants.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ensureAllTenantsHaveDefaultInstance } from '@/lib/platform-instance/default-instance'

export async function POST(request: NextRequest) {
  try {
    const result = await ensureAllTenantsHaveDefaultInstance()
    
    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      ...result
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}

// GET to check migration status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/migrate-platform-instances',
    method: 'POST',
    description: 'Ensures all existing tenants have a default platform instance. Safe to run multiple times.',
    phase: 'Phase 2 - Platform Instances'
  })
}
