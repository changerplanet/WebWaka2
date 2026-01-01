/**
 * POS Settings API
 * 
 * GET /api/pos/settings - Get POS settings for tenant
 * PUT /api/pos/settings - Update POS settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../lib/permissions'

/**
 * GET /api/pos/settings
 * Get POS settings for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const staffId = searchParams.get('staffId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: staffId || 'unknown',
      tenantId,
      email: 'staff@tenant.com',
      coreRole: 'TENANT_USER',
      posRole: 'POS_CASHIER' // Default, can view own settings
    }

    // All staff can view settings, but only managers can edit
    const permCheck = hasPermission(staff, 'pos.settings.view')
    // View is allowed for all roles by default
    
    // Return default settings (in production, fetch from database)
    const settings = {
      id: `settings_${tenantId}`,
      tenantId,
      
      // Tax settings
      defaultTaxRate: 0.0825,
      taxInclusive: false,
      
      // Receipt settings
      receiptHeader: null,
      receiptFooter: 'Thank you for your business!',
      showTaxBreakdown: true,
      
      // Sale settings
      allowNegativeInventory: false,
      requireCustomerForSale: false,
      autoCompleteOnFullPayment: true,
      
      // Discount settings
      maxDiscountPercent: 50.00,
      requireManagerApprovalAbove: 100.00,
      
      // Layaway settings
      layawayEnabled: false,
      layawayMinDeposit: 20.00,
      layawayMaxDays: 90,
      
      // Offline settings
      offlineEnabled: true,
      offlineMaxTransactions: 100,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pos/settings
 * Update POS settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, staffId, ...settingsUpdate } = body

    if (!tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and staffId are required' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: staffId,
      tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_MANAGER'
    }

    // Check permission (only managers can edit settings)
    const permCheck = hasPermission(staff, 'pos.settings.edit')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Validate settings update
    const allowedFields = [
      'defaultTaxRate',
      'taxInclusive',
      'receiptHeader',
      'receiptFooter',
      'showTaxBreakdown',
      'allowNegativeInventory',
      'requireCustomerForSale',
      'autoCompleteOnFullPayment',
      'maxDiscountPercent',
      'requireManagerApprovalAbove',
      'layawayEnabled',
      'layawayMinDeposit',
      'layawayMaxDays',
      'offlineEnabled',
      'offlineMaxTransactions'
    ]

    const filteredUpdate: Record<string, any> = {}
    for (const field of allowedFields) {
      if (settingsUpdate[field] !== undefined) {
        filteredUpdate[field] = settingsUpdate[field]
      }
    }

    // In production, update in database
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updated: filteredUpdate,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
