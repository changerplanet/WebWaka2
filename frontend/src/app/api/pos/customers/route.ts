/**
 * POS Customers API
 * 
 * READ-ONLY endpoints for POS module to access Core customers.
 * POS associates sales with Core customers but does NOT create them.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreCustomerService } from '@/lib/core-services'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/pos/customers
 * Search customers for POS
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const query = searchParams.get('query') || ''
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Get single customer by ID
    if (customerId) {
      const customer = await coreCustomerService.getCustomer(tenantId, customerId)
      
      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        customer,
        source: 'CORE'
      })
    }
    
    // Search customers
    const customers = await coreCustomerService.searchCustomers(tenantId, query, limit)
    
    return NextResponse.json({
      success: true,
      customers,
      count: customers.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[POS] Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
