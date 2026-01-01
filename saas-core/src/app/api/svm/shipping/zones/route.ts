/**
 * SVM Shipping Zones API
 * 
 * POST /api/svm/shipping/zones - Create a new shipping zone
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory storage
const zonesStorage = new Map<string, any[]>()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

/**
 * POST /api/svm/shipping/zones
 * Create a new shipping zone
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, description, countries, states, postalCodes, cities, isDefault, isActive, priority, rates } = body
    
    if (!tenantId || !name) {
      return NextResponse.json(
        { success: false, error: 'tenantId and name are required' },
        { status: 400 }
      )
    }
    
    // Create zone
    const zoneId = generateId('zone')
    const newZone = {
      id: zoneId,
      tenantId,
      name,
      description: description || '',
      countries: countries || [],
      states: states || [],
      postalCodes: postalCodes || [],
      cities: cities || [],
      isDefault: isDefault || false,
      isActive: isActive !== false,
      priority: priority || 0,
      rates: (rates || []).map((rate: any, index: number) => ({
        id: generateId('rate'),
        zoneId,
        name: rate.name,
        description: rate.description,
        carrier: rate.carrier,
        rateType: rate.rateType || 'FLAT',
        flatRate: rate.flatRate,
        weightRate: rate.weightRate,
        baseWeightFee: rate.baseWeightFee,
        percentageRate: rate.percentageRate,
        perItemRate: rate.perItemRate,
        minWeight: rate.minWeight,
        maxWeight: rate.maxWeight,
        minOrderTotal: rate.minOrderTotal,
        maxOrderTotal: rate.maxOrderTotal,
        freeAbove: rate.freeAbove,
        minDays: rate.minDays,
        maxDays: rate.maxDays,
        allowedProductIds: rate.allowedProductIds,
        excludedProductIds: rate.excludedProductIds,
        allowedCategoryIds: rate.allowedCategoryIds,
        excludedCategoryIds: rate.excludedCategoryIds,
        isActive: rate.isActive !== false,
        priority: index
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Store zone
    const zones = zonesStorage.get(tenantId) || []
    zones.push(newZone)
    zonesStorage.set(tenantId, zones)
    
    return NextResponse.json({
      success: true,
      zone: newZone
    }, { status: 201 })
    
  } catch (error) {
    console.error('[SVM] Error creating shipping zone:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
