/**
 * MVM Customers API
 * 
 * READ-ONLY endpoints for MVM module to access Core customers.
 * Vendors do NOT own customers - customers belong to the tenant.
 * 
 * IMPORTANT:
 * - Customers are owned by Core
 * - Vendors can see customer info for their orders
 * - Vendors cannot create/modify customers
 * - Customer data is shared across all vendors in a tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreCustomerService } from '@/lib/core-services'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/mvm/customers
 * Get customer info (for order display, not customer management)
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const vendorId = searchParams.get('vendorId') // For audit/logging
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      )
    }
    
    const customer = await coreCustomerService.getCustomer(tenantId, customerId)
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Return limited customer info for vendors (not full profile)
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        // Don't expose sensitive info like totalSpent, notes, etc. to vendors
      },
      source: 'CORE',
      accessedBy: vendorId ? `vendor:${vendorId}` : 'tenant'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching customer:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/customers
 * Batch get customer info for order fulfillment
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, customerIds, vendorId } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json(
        { success: false, error: 'customerIds array is required' },
        { status: 400 }
      )
    }
    
    // Fetch customers one by one (coreCustomerService doesn't have batch method)
    const customers = await Promise.all(
      customerIds.map(id => coreCustomerService.getCustomer(tenantId, id))
    )
    
    const validCustomers = customers.filter(Boolean).map(c => ({
      id: c!.id,
      firstName: c!.firstName,
      lastName: c!.lastName,
      fullName: c!.fullName,
      email: c!.email,
      phone: c!.phone,
    }))
    
    return NextResponse.json({
      success: true,
      customers: validCustomers,
      count: validCustomers.length,
      source: 'CORE',
      accessedBy: vendorId ? `vendor:${vendorId}` : 'tenant'
    })
    
  } catch (error) {
    console.error('[MVM] Error batch fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
