import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'
import { getAuditLogs } from '@/lib/audit'

// GET /api/admin/audit-logs - Get audit logs
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || undefined
    const actorId = searchParams.get('actorId') || undefined
    const action = searchParams.get('action') as any || undefined
    const targetType = searchParams.get('targetType') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const { logs, total } = await getAuditLogs({
      tenantId,
      actorId,
      action,
      targetType,
      limit,
      offset
    })
    
    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
