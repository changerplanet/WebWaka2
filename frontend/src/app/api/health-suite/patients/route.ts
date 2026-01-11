export const dynamic = 'force-dynamic'

/**
 * HEALTH SUITE: Patients API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createPatient,
  getPatient,
  getPatientByMRN,
  listPatients,
  updatePatient,
  updatePatientStatus,
  addAllergy,
  getPatientStats,
} from '@/lib/health/patient-service';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const patientId = searchParams.get('id');
  const mrn = searchParams.get('mrn');

  try {
    if (patientId) {
      const patient = await getPatient(tenantId, patientId);
      if (!patient) {
        return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, patient });
    }

    if (mrn) {
      const patient = await getPatientByMRN(tenantId, mrn);
      if (!patient) {
        return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, patient });
    }

    if (action === 'stats') {
      const stats = await getPatientStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }

    // List patients
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      hasInsurance: searchParams.get('hasInsurance') === 'true' ? true : 
                    searchParams.get('hasInsurance') === 'false' ? false : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await listPatients(tenantId, filters);
    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('[Health Patients API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action = 'create' } = body;

    switch (action) {
      case 'create': {
        const { firstName, lastName, phone, email, dateOfBirth, gender, address,
                bloodGroup, genotype, allergies, chronicConditions,
                insuranceProvider, insurancePolicyNumber,
                emergencyContactName, emergencyContactPhone } = body;

        if (!firstName || !lastName) {
          return NextResponse.json({ 
            success: false, 
            error: 'First name and last name are required' 
          }, { status: 400 });
        }

        const result = await createPatient(tenantId, {
          firstName, lastName, phone, email, dateOfBirth, gender, address,
          bloodGroup, genotype, allergies, chronicConditions,
          insuranceProvider, insurancePolicyNumber,
          emergencyContactName, emergencyContactPhone,
        }, session.user.id);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ 
          success: true, 
          patientId: result.patientId,
          mrn: result.mrn,
        });
      }

      case 'add-allergy': {
        const { patientId, allergy } = body;
        if (!patientId || !allergy) {
          return NextResponse.json({ success: false, error: 'Patient ID and allergy required' }, { status: 400 });
        }
        const result = await addAllergy(tenantId, patientId, allergy);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Patients API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { patientId, action = 'update' } = body;

    if (!patientId) {
      return NextResponse.json({ success: false, error: 'Patient ID required' }, { status: 400 });
    }

    switch (action) {
      case 'update': {
        const result = await updatePatient(tenantId, patientId, body);
        return NextResponse.json(result);
      }

      case 'update-status': {
        const { status } = body;
        if (!['ACTIVE', 'INACTIVE', 'DECEASED'].includes(status)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }
        const result = await updatePatientStatus(tenantId, patientId, status);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Patients API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
