/**
 * Partner Template Catalog API (Phase H1)
 * 
 * GET /api/partner/templates - Browse template catalog
 * POST /api/partner/templates - Clone template
 * 
 * Read-only access for Partners.
 * Partners cannot create or modify templates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createPartnerTemplateService } from '@/lib/sites-funnels/partner-template-service'

function getPartnerUser(session: unknown): { 
  id: string
  partnerId: string
  tenantId?: string 
} | null {
  if (!session || typeof session !== 'object') return null
  const s = session as Record<string, unknown>
  const user = s.user as Record<string, unknown> | undefined
  if (!user?.id) return null
  
  return {
    id: user.id as string,
    partnerId: (user.partnerId as string) || (s.activeTenantId as string) || '',
    tenantId: s.activeTenantId as string | undefined,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const partnerUser = getPartnerUser(session)

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('templateType') as 'SITE_TEMPLATE' | 'FUNNEL_TEMPLATE' | 'PAGE_TEMPLATE' | null
    const categoryId = searchParams.get('categoryId')
    const categorySlug = searchParams.get('categorySlug')
    const industry = searchParams.get('industry')
    const useCase = searchParams.get('useCase')
    const search = searchParams.get('search')
    const includeDemo = searchParams.get('includeDemo') !== 'false'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const service = createPartnerTemplateService()
    const result = await service.browseTemplates({
      templateType: templateType || undefined,
      categoryId: categoryId || undefined,
      categorySlug: categorySlug || undefined,
      industry: industry || undefined,
      useCase: useCase || undefined,
      search: search || undefined,
      includeDemo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Partner Templates API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to browse templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const partnerUser = getPartnerUser(session)

    if (!partnerUser || !partnerUser.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required - no active tenant' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, ...params } = body

    const service = createPartnerTemplateService()

    switch (action) {
      case 'cloneSite': {
        const result = await service.cloneSiteTemplate({
          templateId: params.templateId,
          tenantId: partnerUser.tenantId,
          platformInstanceId: params.platformInstanceId,
          partnerId: partnerUser.partnerId,
          siteName: params.siteName,
          siteSlug: params.siteSlug,
          createdBy: partnerUser.id,
          tokenContext: params.tokenContext,
        })
        return NextResponse.json(result)
      }

      case 'cloneFunnel': {
        const result = await service.cloneFunnelTemplate({
          templateId: params.templateId,
          tenantId: partnerUser.tenantId,
          platformInstanceId: params.platformInstanceId,
          partnerId: partnerUser.partnerId,
          siteId: params.siteId,
          funnelName: params.funnelName,
          funnelSlug: params.funnelSlug,
          goalType: params.goalType,
          createdBy: partnerUser.id,
          tokenContext: params.tokenContext,
        })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Partners can only use 'cloneSite' or 'cloneFunnel'.` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Partner Templates API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process template action' },
      { status: 500 }
    )
  }
}
