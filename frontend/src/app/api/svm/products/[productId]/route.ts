export const dynamic = 'force-dynamic'

/**
 * SVM Product by ID API - Core Proxy
 * 
 * GET /api/svm/products/:productId - Get product details
 */

import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ productId: string }>
}

/**
 * GET /api/svm/products/:productId
 * Get product details with inventory
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      )
    }

    // In production, fetch from Core catalog service
    return NextResponse.json(
      { success: false, error: `Product ${productId} not found` },
      { status: 404 }
    )

  } catch (error) {
    console.error('[SVM] Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
