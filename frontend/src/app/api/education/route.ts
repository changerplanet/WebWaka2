/**
 * EDUCATION SUITE: Main API Routes
 * 
 * Entry point for Education Suite configuration and activation.
 * Partner-First model: Partners activate this suite for their tenants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  EDUCATION_LABELS,
  EDUCATION_CAPABILITY_BUNDLE,
  GRADE_SCALES,
  ASSESSMENT_TYPES,
  TERM_TYPES,
  ATTENDANCE_STATUS,
} from '@/lib/education/config';
import { seedDefaultSchoolStructure } from '@/lib/education/academic-service';

/**
 * GET /api/education
 * Get Education Suite configuration and status
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'config';

  try {
    switch (action) {
      case 'config':
        // Get Education Suite configuration
        return NextResponse.json({
          success: true,
          config: {
            labels: EDUCATION_LABELS,
            capabilityBundle: EDUCATION_CAPABILITY_BUNDLE,
            gradeScales: GRADE_SCALES,
            assessmentTypes: ASSESSMENT_TYPES,
            termTypes: TERM_TYPES,
            attendanceStatus: ATTENDANCE_STATUS,
          },
        });

      case 'solution-package':
        // Get solution package details for partners
        return NextResponse.json({
          success: true,
          solution: {
            key: 'education',
            name: 'Education Suite',
            tagline: 'Complete School & University Management',
            description: 'End-to-end solution for educational institutions including student management, grading, attendance, and fee collection.',
            targetCustomers: [
              'Primary & Secondary Schools',
              'Universities & Colleges',
              'Training Centers',
              'Tutoring Services',
              'Vocational Institutes',
            ],
            keyFeatures: [
              'Student & Parent Management',
              'Academic Records & Grading',
              'Attendance Tracking',
              'Fee Management & Invoicing',
              'Report Card Generation',
              'Staff & Teacher Management',
            ],
            pricing: {
              starter: { price: 5000, currency: 'NGN', period: 'monthly', maxStudents: 200 },
              professional: { price: 15000, currency: 'NGN', period: 'monthly', maxStudents: 1000 },
              enterprise: { price: 'custom', currency: 'NGN', period: 'monthly', maxStudents: -1 },
            },
          },
          activationChecklist: [
            { step: 1, title: 'Configure School Profile', description: 'Set up school name, address, and contact details' },
            { step: 2, title: 'Set Up Academic Structure', description: 'Define classes, sections, and subjects' },
            { step: 3, title: 'Import/Add Students', description: 'Add students and link guardians' },
            { step: 4, title: 'Configure Fee Structure', description: 'Set up tuition and other fee categories' },
            { step: 5, title: 'Add Teachers & Staff', description: 'Assign teachers to classes and subjects' },
            { step: 6, title: 'Go Live', description: 'Activate the suite for daily operations' },
          ],
        });

      case 'activation-status':
        // Check Education Suite activation status for a tenant
        const tenantId = searchParams.get('tenantId') || session.activeTenantId;
        if (!tenantId) {
          return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
        }
        
        // In production: check tenant capabilities
        return NextResponse.json({
          success: true,
          status: {
            isActivated: false, // Will check actual tenant metadata
            requiredCapabilities: EDUCATION_CAPABILITY_BUNDLE.requiredCapabilities,
            missingCapabilities: [], // Will compute based on tenant
          },
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/education
 * Activate Education Suite or seed default data
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'activate': {
        // Activate Education Suite for a tenant (Partner-only)
        const tenantId = body.tenantId || session.activeTenantId;
        
        if (!tenantId) {
          return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
        }

        // In production: verify partner permissions and activate capabilities
        return NextResponse.json({
          success: true,
          message: 'Education Suite activated successfully',
          tenantId,
        });
      }

      case 'seed-structure': {
        // Seed default Nigerian school structure
        const tenantId = body.tenantId || session.activeTenantId;
        
        if (!tenantId) {
          return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
        }

        await seedDefaultSchoolStructure(tenantId);
        
        return NextResponse.json({
          success: true,
          message: 'Default school structure seeded successfully',
          tenantId,
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
