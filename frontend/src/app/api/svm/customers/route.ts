export const dynamic = 'force-dynamic'

/**
 * SVM Customers API
 * 
 * READ-ONLY endpoints for SVM module to access Core customers.
 * SVM associates orders with Core customers but does NOT create them.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreCustomerService } from '@/lib/core-services'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/svm/customers
 * Search or get customers for SVM storefront
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const query = searchParams.get('query') || ''
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
        customer: {
          id: customer.id,
          email: customer.email,
          phone: customer.phone,
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: customer.fullName,
          company: customer.company,
          status: customer.status,
          defaultAddressId: customer.defaultAddressId,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent
        },
        source: 'CORE'
      })
    }
    
    // Search customers
    const customers = await coreCustomerService.searchCustomers(tenantId, query, limit)
    
    return NextResponse.json({
      success: true,
      customers: customers.map(c => ({
        id: c.id,
        email: c.email,
        phone: c.phone,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: c.fullName,
        company: c.company,
        status: c.status,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent
      })),
      count: customers.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[SVM] Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
