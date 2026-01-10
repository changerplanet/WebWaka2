/**
 * HEALTH SUITE: Main API Routes
 * 
 * Entry point for Health Suite configuration and activation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  HEALTH_LABELS,
  HEALTH_CAPABILITY_BUNDLE,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  CONSULTATION_STATUS,
  PRESCRIPTION_STATUS,
  BLOOD_GROUPS,
  GENOTYPES,
  COMMON_ALLERGIES,
  COMMON_CONDITIONS,
  DOCTOR_SPECIALIZATIONS,
  COMMON_LAB_TESTS,
} from '@/lib/health/config';
import { seedHealthDemoData, getDemoDoctors } from '@/lib/health/demo-data';

/**
 * GET /api/health-suite
 * Get Health Suite configuration and status
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
        return NextResponse.json({
          success: true,
          config: {
            labels: HEALTH_LABELS,
            capabilityBundle: HEALTH_CAPABILITY_BUNDLE,
            appointmentStatus: APPOINTMENT_STATUS,
            appointmentTypes: APPOINTMENT_TYPES,
            consultationStatus: CONSULTATION_STATUS,
            prescriptionStatus: PRESCRIPTION_STATUS,
            bloodGroups: BLOOD_GROUPS,
            genotypes: GENOTYPES,
            commonAllergies: COMMON_ALLERGIES,
            commonConditions: COMMON_CONDITIONS,
            doctorSpecializations: DOCTOR_SPECIALIZATIONS,
            commonLabTests: COMMON_LAB_TESTS,
          },
        });

      case 'solution-package':
        return NextResponse.json({
          success: true,
          solution: {
            key: 'health',
            name: 'Health Suite',
            tagline: 'Complete Clinic & Hospital Management',
            description: 'End-to-end healthcare management solution.',
            targetCustomers: [
              'Clinics & Medical Centers',
              'Hospitals',
              'Diagnostic Centers',
              'Pharmacies',
            ],
            keyFeatures: [
              'Patient Registration',
              'Appointment Scheduling',
              'Consultation & Diagnosis',
              'Prescription Management',
              'Pharmacy/Dispensing',
              'Healthcare Billing',
            ],
          },
        });

      case 'doctors':
        return NextResponse.json({ success: true, doctors: getDemoDoctors() });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'seed-demo-data': {
        const tenantId = body.tenantId || session.activeTenantId;
        if (!tenantId) {
          return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
        }
        const result = await seedHealthDemoData(tenantId);
        return NextResponse.json({ success: true, ...(result as any) });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
