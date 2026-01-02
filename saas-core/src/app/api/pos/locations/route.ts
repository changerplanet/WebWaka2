/**
 * POS Locations API
 * 
 * READ-ONLY endpoints for POS module to access Core locations.
 * POS associates sales with Core locations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreLocationService } from '@/lib/core-services'

/**
 * GET /api/pos/locations
 * Get locations for POS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const locationId = searchParams.get('locationId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Get single location by ID
    if (locationId) {
      const location = await coreLocationService.getLocation(tenantId, locationId)
      
      if (!location) {
        return NextResponse.json(
          { success: false, error: 'Location not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        location,
        source: 'CORE'
      })
    }
    
    // Get all locations
    const locations = await coreLocationService.getLocations(tenantId, activeOnly)
    
    // Also get default location
    const defaultLocation = await coreLocationService.getDefaultLocation(tenantId)
    
    return NextResponse.json({
      success: true,
      locations,
      defaultLocation,
      count: locations.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[POS] Error fetching locations:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
