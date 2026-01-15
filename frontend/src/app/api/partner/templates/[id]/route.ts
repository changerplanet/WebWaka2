/**
 * Partner Template Preview API (Phase H1)
 * 
 * GET /api/partner/templates/[id] - Preview template details
 * 
 * Read-only access for Partners.
 * Only shows published, partner-visible templates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPartnerTemplateService } from '@/lib/sites-funnels/partner-template-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = createPartnerTemplateService()
    const preview = await service.previewTemplate(params.id)

    if (!preview) {
      return NextResponse.json(
        { error: 'Template not found or not available' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, template: preview })
  } catch (error) {
    console.error('[Partner Template Preview API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to preview template' },
      { status: 500 }
    )
  }
}
