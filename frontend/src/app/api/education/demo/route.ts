/**
 * EDUCATION SUITE: Demo Data API
 * 
 * Handles seeding and clearing of Nigerian demo data.
 * Protected by session authentication.
 * 
 * @module api/education/demo
 * @phase S4
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { seedEducationDemoData, clearEducationDemoData } from '@/lib/education'

// ============================================================================
// POST - Seed or clear demo data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'seed': {
        const result = await seedEducationDemoData(tenantId)
        return NextResponse.json(result)
      }

      case 'clear': {
        const result = await clearEducationDemoData(tenantId)
        return NextResponse.json(result)
      }

      case 'reset': {
        // Clear then seed
        await clearEducationDemoData(tenantId)
        const result = await seedEducationDemoData(tenantId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Demo API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get demo data status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education')
    if (guardResult) return guardResult

    // Return demo info
    return NextResponse.json({
      success: true,
      demo: {
        school: 'Bright Future Academy',
        location: 'Lagos, Nigeria',
        type: 'Secondary School',
        structure: 'JSS 1-3, SS 1-3',
        calendar: '3-term academic year',
        grading: 'A-F scale (70=A, 40=Pass)',
        currency: 'NGN (Nigerian Naira)',
        vatStatus: 'Exempt (Education)',
      },
      dataTypes: [
        'Students (Nigerian names)',
        'Guardians (Parents/Guardians)',
        'Staff (Teachers, Admin)',
        'Academic Sessions & Terms',
        'Classes (JSS/SSS structure)',
        'Subjects (Nigerian curriculum)',
        'Fee Structures (Tuition, Levies)',
        'Attendance Records',
        'Assessment Results (CA + Exam)',
      ],
    })
  } catch (error) {
    console.error('[Education Demo API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
