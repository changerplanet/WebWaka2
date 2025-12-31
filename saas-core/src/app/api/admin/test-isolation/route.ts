import { NextRequest, NextResponse } from 'next/server'
import { prisma, withTenantContextAsync, TenantIsolationError, getViolationLogs, clearViolationLogs } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'

/**
 * Test endpoint for verifying tenant isolation
 * Only accessible by Super Admins
 * 
 * GET /api/admin/test-isolation - Get violation logs
 * POST /api/admin/test-isolation - Run isolation tests
 * DELETE /api/admin/test-isolation - Clear violation logs
 */

// GET - Retrieve violation logs
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const logs = getViolationLogs()
    
    return NextResponse.json({
      success: true,
      violationCount: logs.length,
      violations: logs.slice(-50) // Return last 50
    })
    
  } catch (error) {
    console.error('Failed to get violation logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get violation logs' },
      { status: 500 }
    )
  }
}

// POST - Run isolation tests
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { testType } = body
    
    const results: { test: string; passed: boolean; error?: string }[] = []
    
    // Clear previous logs
    clearViolationLogs()
    
    // Get two different tenants for testing
    const tenants = await prisma.tenant.findMany({ take: 2 })
    
    if (tenants.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Need at least 2 tenants for isolation testing'
      }, { status: 400 })
    }
    
    const tenant1 = tenants[0]
    const tenant2 = tenants[1]
    
    // Test 1: Query without tenant context (should fail)
    try {
      await withTenantContextAsync(
        { tenantId: null, userId: null, isSuperAdmin: false },
        async () => {
          await prisma.tenantMembership.findMany()
        }
      )
      results.push({ test: 'Query without tenant context', passed: false, error: 'Should have thrown' })
    } catch (e) {
      if (e instanceof TenantIsolationError) {
        results.push({ test: 'Query without tenant context', passed: true })
      } else {
        results.push({ test: 'Query without tenant context', passed: false, error: String(e) })
      }
    }
    
    // Test 2: Query with wrong tenantId filter (should fail)
    try {
      await withTenantContextAsync(
        { tenantId: tenant1.id, userId: 'test', isSuperAdmin: false },
        async () => {
          // Trying to query tenant2's data while context is tenant1
          await prisma.tenantMembership.findMany({
            where: { tenantId: tenant2.id }
          })
        }
      )
      results.push({ test: 'Cross-tenant query attempt', passed: false, error: 'Should have thrown' })
    } catch (e) {
      if (e instanceof TenantIsolationError) {
        results.push({ test: 'Cross-tenant query attempt', passed: true })
      } else {
        results.push({ test: 'Cross-tenant query attempt', passed: false, error: String(e) })
      }
    }
    
    // Test 3: Query with correct tenantId (should succeed)
    try {
      await withTenantContextAsync(
        { tenantId: tenant1.id, userId: 'test', isSuperAdmin: false },
        async () => {
          await prisma.tenantMembership.findMany({
            where: { tenantId: tenant1.id }
          })
        }
      )
      results.push({ test: 'Valid tenant-scoped query', passed: true })
    } catch (e) {
      results.push({ test: 'Valid tenant-scoped query', passed: false, error: String(e) })
    }
    
    // Test 4: Super admin can query across tenants
    try {
      await withTenantContextAsync(
        { tenantId: null, userId: authResult.user.id, isSuperAdmin: true },
        async () => {
          await prisma.tenantMembership.findMany()
        }
      )
      results.push({ test: 'Super admin cross-tenant query', passed: true })
    } catch (e) {
      results.push({ test: 'Super admin cross-tenant query', passed: false, error: String(e) })
    }
    
    // Test 5: Bypass without super admin (should fail)
    try {
      await withTenantContextAsync(
        { tenantId: tenant1.id, userId: 'test', isSuperAdmin: false, bypassIsolation: true },
        async () => {
          await prisma.tenantMembership.findMany()
        }
      )
      results.push({ test: 'Non-admin bypass attempt', passed: false, error: 'Should have thrown' })
    } catch (e) {
      if (e instanceof TenantIsolationError) {
        results.push({ test: 'Non-admin bypass attempt', passed: true })
      } else {
        results.push({ test: 'Non-admin bypass attempt', passed: false, error: String(e) })
      }
    }
    
    // Test 6: Super admin explicit bypass (should succeed)
    try {
      await withTenantContextAsync(
        { tenantId: null, userId: authResult.user.id, isSuperAdmin: true, bypassIsolation: true },
        async () => {
          await prisma.tenantMembership.findMany()
        }
      )
      results.push({ test: 'Super admin explicit bypass', passed: true })
    } catch (e) {
      results.push({ test: 'Super admin explicit bypass', passed: false, error: String(e) })
    }
    
    // Test 7: Global model (User) should work without tenant context
    try {
      await withTenantContextAsync(
        { tenantId: null, userId: null, isSuperAdmin: false },
        async () => {
          await prisma.user.findMany({ take: 1 })
        }
      )
      results.push({ test: 'Global model query without context', passed: true })
    } catch (e) {
      results.push({ test: 'Global model query without context', passed: false, error: String(e) })
    }
    
    const violations = getViolationLogs()
    const allPassed = results.every(r => r.passed)
    
    return NextResponse.json({
      success: true,
      allPassed,
      results,
      violationsLogged: violations.length,
      violations: violations.slice(-10)
    })
    
  } catch (error) {
    console.error('Failed to run isolation tests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to run isolation tests' },
      { status: 500 }
    )
  }
}

// DELETE - Clear violation logs
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    clearViolationLogs()
    
    return NextResponse.json({
      success: true,
      message: 'Violation logs cleared'
    })
    
  } catch (error) {
    console.error('Failed to clear violation logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear violation logs' },
      { status: 500 }
    )
  }
}
