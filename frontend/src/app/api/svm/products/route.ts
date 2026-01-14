export const dynamic = 'force-dynamic'

/**
 * SVM Products API - Database-backed
 * 
 * GET /api/svm/products - List products from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/svm/products
 * List or search products from database
 */
export async function GET(request: NextRequest) {
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await extractTenantId(request)
    
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
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'

    const where: any = { tenantId }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          ProductCategory: true,
          ProductVariant: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      success: true,
      products,
      total,
      hasMore: offset + products.length < total,
      pagination: {
        limit,
        offset,
        total
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
