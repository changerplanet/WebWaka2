export const dynamic = 'force-dynamic'

/**
 * HEALTH SUITE: Prescriptions API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createPrescription,
  getPrescription,
  listPrescriptions,
  getPendingPrescriptions,
  updatePrescriptionStatus,
  dispensePrescription,
  cancelPrescription,
  getPatientPrescriptions,
  getPrescriptionStats,
  COMMON_MEDICATIONS,
} from '@/lib/health/prescription-service';
import { PrescriptionStatus } from '@/lib/health/config';

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
  const prescriptionId = searchParams.get('id');

  try {
    if (prescriptionId) {
      const prescription = await getPrescription(tenantId, prescriptionId);
      if (!prescription) {
        return NextResponse.json({ success: false, error: 'Prescription not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, prescription });
    }

    switch (action) {
      case 'pending': {
        const prescriptions = await getPendingPrescriptions(tenantId);
        return NextResponse.json({ success: true, prescriptions });
      }

      case 'stats': {
        const date = searchParams.get('date') || undefined;
        const stats = await getPrescriptionStats(tenantId, date);
        return NextResponse.json({ success: true, stats });
      }

      case 'patient': {
        const patientId = searchParams.get('patientId');
        if (!patientId) {
          return NextResponse.json({ success: false, error: 'Patient ID required' }, { status: 400 });
        }
        const prescriptions = await getPatientPrescriptions(tenantId, patientId);
        return NextResponse.json({ success: true, prescriptions });
      }

      case 'medications': {
        return NextResponse.json({ success: true, medications: COMMON_MEDICATIONS });
      }

      default: {
        const filters = {
          patientId: searchParams.get('patientId') || undefined,
          doctorId: searchParams.get('doctorId') || undefined,
          status: searchParams.get('status') as PrescriptionStatus | undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
        };
        const prescriptions = await listPrescriptions(tenantId, filters);
        return NextResponse.json({ success: true, prescriptions });
      }
    }

  } catch (error: any) {
    console.error('[Health Prescriptions API] GET error:', error);
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
        const { consultationId, patientId, patientName, doctorId, doctorName, items, validDays, notes } = body;
        if (!consultationId || !patientId || !patientName || !doctorId || !doctorName || !items) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required: consultationId, patientId, patientName, doctorId, doctorName, items' 
          }, { status: 400 });
        }
        const result = await createPrescription(tenantId, {
          consultationId, patientId, patientName, doctorId, doctorName, items, validDays, notes,
        });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, prescriptionId: result.prescriptionId });
      }

      case 'dispense': {
        const { prescriptionId, itemsDispensed } = body;
        if (!prescriptionId) {
          return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });
        }
        const result = await dispensePrescription(tenantId, prescriptionId, session.user.id, itemsDispensed);
        return NextResponse.json(result);
      }

      case 'cancel': {
        const { prescriptionId, reason } = body;
        if (!prescriptionId) {
          return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });
        }
        const result = await cancelPrescription(tenantId, prescriptionId, reason);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Prescriptions API] POST error:', error);
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
    const { prescriptionId, status } = body;

    if (!prescriptionId || !status) {
      return NextResponse.json({ success: false, error: 'Prescription ID and status required' }, { status: 400 });
    }

    const validStatuses = ['CREATED', 'PENDING_DISPENSING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const result = await updatePrescriptionStatus(tenantId, prescriptionId, status as PrescriptionStatus);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Health Prescriptions API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
