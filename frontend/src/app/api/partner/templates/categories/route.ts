/**
 * Partner Template Categories API (Phase H1)
 * 
 * GET /api/partner/templates/categories - List template categories
 * 
 * Read-only access for Partners.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPartnerTemplateService } from '@/lib/sites-funnels/partner-template-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')

    const service = createPartnerTemplateService()
    const categories = await service.getCategories({
      industry: industry || undefined,
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('[Partner Template Categories API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list categories' },
      { status: 500 }
    )
  }
}
