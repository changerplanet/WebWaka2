/**
 * POS Registers API
 * 
 * POST /api/pos/registers - Create a new register
 * GET /api/pos/registers - List registers for tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../lib/permissions'

/**
 * POST /api/pos/registers
 * Create a new register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, staffId, name, code, defaultTaxRate, receiptHeader, receiptFooter } = body

    if (!tenantId || !staffId || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'tenantId, staffId, name, and code are required' },
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

    // Check permission (only managers can create registers)
    const permCheck = hasPermission(staff, 'pos.settings.registers')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Generate register ID
    const registerId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const register = {
      id: registerId,
      tenantId,
      name,
      code,
      isActive: true,
      defaultTaxRate: defaultTaxRate || null,
      receiptHeader: receiptHeader || null,
      receiptFooter: receiptFooter || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      register
    })

  } catch (error) {
    console.error('Error creating register:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/registers
 * List registers for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      registers: [],
      filters: {
        tenantId,
        activeOnly
      }
    })

  } catch (error) {
    console.error('Error listing registers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
