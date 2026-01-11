export const dynamic = 'force-dynamic'

/**
 * SVM Products API - Core Proxy
 * 
 * GET /api/svm/products - List products (read from Core)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/svm/products
 * List or search products
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const query = searchParams.get('q') || searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '24')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // In production, query Core catalog service
    // For now, return mock structure
    return NextResponse.json({
      success: true,
      products: [],
      total: 0,
      hasMore: false,
      pagination: {
        limit,
        offset,
        total: 0
      },
      filters: {
        tenantId,
        query: query || null,
        categoryId: categoryId || null,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('[SVM] Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
