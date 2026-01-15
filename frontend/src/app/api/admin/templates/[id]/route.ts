/**
 * Super Admin Template Detail API (Phase H1)
 * 
 * GET /api/admin/templates/[id] - Get template details
 * GET /api/admin/templates/[id]?manifest=true - Get template manifest
 * 
 * SUPER_ADMIN role enforced.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createSuperAdminTemplateService } from '@/lib/sites-funnels/super-admin-template-service'

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

function getAdminUser(session: unknown): { id: string; role: string } | null {
  if (!session || typeof session !== 'object') return null
  const s = session as Record<string, unknown>
  const user = s.user as Record<string, unknown> | undefined
  if (!user?.id || !user?.role) return null
  return { id: user.id as string, role: user.role as string }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request)
    const adminUser = getAdminUser(session)

    if (!adminUser || adminUser.role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { error: 'Access denied: SUPER_ADMIN role required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const wantManifest = searchParams.get('manifest') === 'true'

    const service = createSuperAdminTemplateService()

    if (wantManifest) {
      const manifest = await service.getTemplateManifest(adminUser, params.id)
      if (!manifest) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, manifest })
    }

    const template = await service.getTemplate(adminUser, params.id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('[Admin Template Detail API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    )
  }
}
