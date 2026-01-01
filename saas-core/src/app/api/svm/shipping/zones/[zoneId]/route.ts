/**
 * SVM Shipping Zone by ID API
 * 
 * GET /api/svm/shipping/zones/:zoneId - Get zone details
 * PUT /api/svm/shipping/zones/:zoneId - Update zone
 * DELETE /api/svm/shipping/zones/:zoneId - Delete zone
 */

import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ zoneId: string }>
}

// In-memory storage (shared with parent route in production)
const zonesStorage = new Map<string, any[]>()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

/**
 * GET /api/svm/shipping/zones/:zoneId
 * Get zone details with all rates
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { zoneId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: 'zoneId is required' },
        { status: 400 }
      )
    }
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      )
    }
    
    const zones = zonesStorage.get(tenantId) || []
    const zone = zones.find(z => z.id === zoneId)
    
    if (!zone) {
      return NextResponse.json(
        { success: false, error: `Shipping zone ${zoneId} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      zone
    })
    
  } catch (error) {
    console.error('[SVM] Error fetching shipping zone:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/svm/shipping/zones/:zoneId
 * Update zone or add/update rates
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { zoneId } = await context.params
    const body = await request.json()
    const { tenantId, action } = body
    
    if (!zoneId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'zoneId and tenantId are required' },
        { status: 400 }
      )
    }
    
    const zones = zonesStorage.get(tenantId) || []
    const zoneIndex = zones.findIndex(z => z.id === zoneId)
    
    if (zoneIndex < 0) {
      return NextResponse.json(
        { success: false, error: `Shipping zone ${zoneId} not found` },
        { status: 404 }
      )
    }
    
    const zone = zones[zoneIndex]
    
    switch (action) {
      case 'UPDATE_ZONE': {
        // Update zone properties
        const { name, description, countries, states, postalCodes, cities, isDefault, isActive, priority } = body
        
        if (name !== undefined) zone.name = name
        if (description !== undefined) zone.description = description
        if (countries !== undefined) zone.countries = countries
        if (states !== undefined) zone.states = states
        if (postalCodes !== undefined) zone.postalCodes = postalCodes
        if (cities !== undefined) zone.cities = cities
        if (isDefault !== undefined) zone.isDefault = isDefault
        if (isActive !== undefined) zone.isActive = isActive
        if (priority !== undefined) zone.priority = priority
        
        break
      }
      
      case 'ADD_RATE': {
        // Add a new rate to the zone
        const { rate } = body
        if (!rate || !rate.name || !rate.rateType) {
          return NextResponse.json(
            { success: false, error: 'rate with name and rateType is required' },
            { status: 400 }
          )
        }
        
        const newRate = {
          id: generateId('rate'),
          zoneId,
          name: rate.name,
          description: rate.description,
          carrier: rate.carrier,
          rateType: rate.rateType,
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
          isActive: rate.isActive ?? true,
          priority: zone.rates.length
        }
        
        zone.rates.push(newRate)
        
        return NextResponse.json({
          success: true,
          message: 'Rate added',
          rate: newRate,
          zone
        })
      }
      
      case 'UPDATE_RATE': {
        // Update an existing rate
        const { rateId, rate } = body
        if (!rateId) {
          return NextResponse.json(
            { success: false, error: 'rateId is required' },
            { status: 400 }
          )
        }
        
        const rateIndex = zone.rates.findIndex((r: any) => r.id === rateId)
        if (rateIndex < 0) {
          return NextResponse.json(
            { success: false, error: `Rate ${rateId} not found` },
            { status: 404 }
          )
        }
        
        // Update rate properties
        const existingRate = zone.rates[rateIndex]
        if (rate.name !== undefined) existingRate.name = rate.name
        if (rate.description !== undefined) existingRate.description = rate.description
        if (rate.carrier !== undefined) existingRate.carrier = rate.carrier
        if (rate.rateType !== undefined) existingRate.rateType = rate.rateType
        if (rate.flatRate !== undefined) existingRate.flatRate = rate.flatRate
        if (rate.weightRate !== undefined) existingRate.weightRate = rate.weightRate
        if (rate.baseWeightFee !== undefined) existingRate.baseWeightFee = rate.baseWeightFee
        if (rate.percentageRate !== undefined) existingRate.percentageRate = rate.percentageRate
        if (rate.perItemRate !== undefined) existingRate.perItemRate = rate.perItemRate
        if (rate.freeAbove !== undefined) existingRate.freeAbove = rate.freeAbove
        if (rate.minDays !== undefined) existingRate.minDays = rate.minDays
        if (rate.maxDays !== undefined) existingRate.maxDays = rate.maxDays
        if (rate.isActive !== undefined) existingRate.isActive = rate.isActive
        
        return NextResponse.json({
          success: true,
          message: 'Rate updated',
          rate: existingRate,
          zone
        })
      }
      
      case 'DELETE_RATE': {
        // Delete a rate
        const { rateId } = body
        if (!rateId) {
          return NextResponse.json(
            { success: false, error: 'rateId is required' },
            { status: 400 }
          )
        }
        
        const rateIndex = zone.rates.findIndex((r: any) => r.id === rateId)
        if (rateIndex < 0) {
          return NextResponse.json(
            { success: false, error: `Rate ${rateId} not found` },
            { status: 404 }
          )
        }
        
        zone.rates.splice(rateIndex, 1)
        
        return NextResponse.json({
          success: true,
          message: 'Rate deleted',
          zone
        })
      }
      
      default:
        // Default: update zone properties
        const { name, description, countries, states, postalCodes, cities, isDefault, isActive, priority } = body
        
        if (name !== undefined) zone.name = name
        if (description !== undefined) zone.description = description
        if (countries !== undefined) zone.countries = countries
        if (states !== undefined) zone.states = states
        if (postalCodes !== undefined) zone.postalCodes = postalCodes
        if (cities !== undefined) zone.cities = cities
        if (isDefault !== undefined) zone.isDefault = isDefault
        if (isActive !== undefined) zone.isActive = isActive
        if (priority !== undefined) zone.priority = priority
    }
    
    return NextResponse.json({
      success: true,
      message: `Shipping zone ${zoneId} updated`,
      zone
    })
    
  } catch (error) {
    console.error('[SVM] Error updating shipping zone:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/svm/shipping/zones/:zoneId
 * Delete a shipping zone
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { zoneId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!zoneId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'zoneId and tenantId are required' },
        { status: 400 }
      )
    }
    
    const zones = zonesStorage.get(tenantId) || []
    const zoneIndex = zones.findIndex(z => z.id === zoneId)
    
    if (zoneIndex < 0) {
      return NextResponse.json(
        { success: false, error: `Shipping zone ${zoneId} not found` },
        { status: 404 }
      )
    }
    
    const deletedZone = zones[zoneIndex]
    zones.splice(zoneIndex, 1)
    
    return NextResponse.json({
      success: true,
      message: `Shipping zone ${deletedZone.name} deleted`,
      deletedZoneId: zoneId
    })
    
  } catch (error) {
    console.error('[SVM] Error deleting shipping zone:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
