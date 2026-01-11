export const dynamic = 'force-dynamic'

/**
 * SVM Shipping Zone by ID API
 * 
 * GET /api/svm/shipping/zones/:zoneId - Get zone details
 * PUT /api/svm/shipping/zones/:zoneId - Update zone
 * DELETE /api/svm/shipping/zones/:zoneId - Delete zone
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getZone,
  updateZone,
  deleteZone,
  addRate,
  updateRate,
  deleteRate,
  generateId,
  type ShippingRate
} from '@/lib/shipping-storage'

interface RouteParams {
  params: Promise<{ zoneId: string }>
}

/**
 * GET /api/svm/shipping/zones/:zoneId
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
    
    const zone = await getZone(tenantId, zoneId)
    
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
    
    const zone = await getZone(tenantId, zoneId)
    
    if (!zone) {
      return NextResponse.json(
        { success: false, error: `Shipping zone ${zoneId} not found` },
        { status: 404 }
      )
    }
    
    switch (action) {
      case 'UPDATE_ZONE': {
        const { name, description, countries, states, postalCodes, cities, isDefault, isActive, priority } = body
        
        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (countries !== undefined) updates.countries = countries
        if (states !== undefined) updates.states = states
        if (postalCodes !== undefined) updates.postalCodes = postalCodes
        if (cities !== undefined) updates.cities = cities
        if (isDefault !== undefined) updates.isDefault = isDefault
        if (isActive !== undefined) updates.isActive = isActive
        if (priority !== undefined) updates.priority = priority
        
        const updated = await updateZone(tenantId, zoneId, updates)
        
        return NextResponse.json({
          success: true,
          message: 'Zone updated',
          zone: updated
        })
      }
      
      case 'ADD_RATE': {
        const { rate } = body
        if (!rate || !rate.name || !rate.rateType) {
          return NextResponse.json(
            { success: false, error: 'rate with name and rateType is required' },
            { status: 400 }
          )
        }
        
        const newRate: ShippingRate = {
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
          allowedProductIds: rate.allowedProductIds || [],
          excludedProductIds: rate.excludedProductIds || [],
          allowedCategoryIds: rate.allowedCategoryIds || [],
          excludedCategoryIds: rate.excludedCategoryIds || [],
          isActive: rate.isActive ?? true,
          priority: zone.rates.length
        }
        
        await addRate(tenantId, zoneId, newRate)
        const updatedZone = await getZone(tenantId, zoneId)
        
        return NextResponse.json({
          success: true,
          message: 'Rate added',
          rate: newRate,
          zone: updatedZone
        })
      }
      
      case 'UPDATE_RATE': {
        const { rateId, rate } = body
        if (!rateId) {
          return NextResponse.json(
            { success: false, error: 'rateId is required' },
            { status: 400 }
          )
        }
        
        const updated = await updateRate(tenantId, zoneId, rateId, rate)
        if (!updated) {
          return NextResponse.json(
            { success: false, error: `Rate ${rateId} not found` },
            { status: 404 }
          )
        }
        
        const updatedZone = await getZone(tenantId, zoneId)
        
        return NextResponse.json({
          success: true,
          message: 'Rate updated',
          rate: updated,
          zone: updatedZone
        })
      }
      
      case 'DELETE_RATE': {
        const { rateId } = body
        if (!rateId) {
          return NextResponse.json(
            { success: false, error: 'rateId is required' },
            { status: 400 }
          )
        }
        
        const deleted = await deleteRate(tenantId, zoneId, rateId)
        if (!deleted) {
          return NextResponse.json(
            { success: false, error: `Rate ${rateId} not found` },
            { status: 404 }
          )
        }
        
        const updatedZone = await getZone(tenantId, zoneId)
        
        return NextResponse.json({
          success: true,
          message: 'Rate deleted',
          zone: updatedZone
        })
      }
      
      default: {
        // Default: update zone properties
        const { name, description, countries, states, postalCodes, cities, isDefault, isActive, priority } = body
        
        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (countries !== undefined) updates.countries = countries
        if (states !== undefined) updates.states = states
        if (postalCodes !== undefined) updates.postalCodes = postalCodes
        if (cities !== undefined) updates.cities = cities
        if (isDefault !== undefined) updates.isDefault = isDefault
        if (isActive !== undefined) updates.isActive = isActive
        if (priority !== undefined) updates.priority = priority
        
        const updated = await updateZone(tenantId, zoneId, updates)
        
        return NextResponse.json({
          success: true,
          message: `Shipping zone ${zoneId} updated`,
          zone: updated
        })
      }
    }
    
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
    
    const deleted = await deleteZone(tenantId, zoneId)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Shipping zone ${zoneId} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Shipping zone ${deleted.name} deleted`,
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
