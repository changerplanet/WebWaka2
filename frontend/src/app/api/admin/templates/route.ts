/**
 * Super Admin Template API (Phase H1)
 * 
 * POST /api/admin/templates - Create template
 * GET /api/admin/templates - List templates
 * 
 * SUPER_ADMIN role enforced on all endpoints.
 * No partner access allowed.
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

export async function GET(request: NextRequest) {
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
    const templateType = searchParams.get('templateType') as 'SITE_TEMPLATE' | 'FUNNEL_TEMPLATE' | 'PAGE_TEMPLATE' | null
    const status = searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | null
    const categoryId = searchParams.get('categoryId')
    const industry = searchParams.get('industry')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const service = createSuperAdminTemplateService()
    const result = await service.listTemplates(adminUser, {
      templateType: templateType || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      industry: industry || undefined,
      search: search || undefined,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Admin Templates API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const adminUser = getAdminUser(session)

    if (!adminUser || adminUser.role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { error: 'Access denied: SUPER_ADMIN role required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...params } = body

    const service = createSuperAdminTemplateService()

    switch (action) {
      case 'create': {
        const result = await service.createTemplate(adminUser, params)
        return NextResponse.json(result)
      }

      case 'upload': {
        const result = await service.uploadTemplateDefinition(adminUser, params)
        return NextResponse.json(result)
      }

      case 'addPage': {
        const { templateId, ...pageParams } = params
        const result = await service.addTemplatePage(adminUser, templateId, pageParams)
        return NextResponse.json(result)
      }

      case 'updateBlocks': {
        const { templateId, pageId, blocks } = params
        if (pageId) {
          const result = await service.updateTemplatePageBlocks(adminUser, templateId, pageId, blocks)
          return NextResponse.json(result)
        } else {
          const result = await service.updatePageTemplateBlocks(adminUser, templateId, blocks)
          return NextResponse.json(result)
        }
      }

      case 'validate': {
        const { templateId } = params
        const result = await service.validateTemplateSchema(adminUser, templateId)
        return NextResponse.json(result)
      }

      case 'publish': {
        const { templateId } = params
        const result = await service.publishTemplate(adminUser, templateId)
        return NextResponse.json(result)
      }

      case 'unpublish': {
        const { templateId } = params
        const result = await service.unpublishTemplate(adminUser, templateId)
        return NextResponse.json(result)
      }

      case 'deprecate': {
        const { templateId } = params
        const result = await service.deprecateTemplate(adminUser, templateId)
        return NextResponse.json(result)
      }

      case 'update': {
        const { templateId, ...updateParams } = params
        const result = await service.updateTemplate(adminUser, templateId, updateParams)
        return NextResponse.json(result)
      }

      case 'delete': {
        const { templateId } = params
        const result = await service.deleteTemplate(adminUser, templateId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Admin Templates API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process template action' },
      { status: 500 }
    )
  }
}
