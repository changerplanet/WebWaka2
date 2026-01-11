export const dynamic = 'force-dynamic'

/**
 * HEALTH SUITE: Consultations API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createConsultation,
  getConsultation,
  listConsultations,
  recordVitalSigns,
  updateConsultationStatus,
  addDiagnosis,
  updateConsultationNotes,
  completeConsultation,
  getPatientHistory,
  getTodayConsultations,
  getConsultationStats,
} from '@/lib/health/consultation-service';
import { ConsultationStatus } from '@/lib/health/config';

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
  const consultationId = searchParams.get('id');

  try {
    if (consultationId) {
      const consultation = await getConsultation(tenantId, consultationId);
      if (!consultation) {
        return NextResponse.json({ success: false, error: 'Consultation not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, consultation });
    }

    switch (action) {
      case 'today': {
        const doctorId = searchParams.get('doctorId') || undefined;
        const consultations = await getTodayConsultations(tenantId, doctorId);
        return NextResponse.json({ success: true, consultations });
      }

      case 'stats': {
        const date = searchParams.get('date') || undefined;
        const stats = await getConsultationStats(tenantId, date);
        return NextResponse.json({ success: true, stats });
      }

      case 'patient-history': {
        const patientId = searchParams.get('patientId');
        if (!patientId) {
          return NextResponse.json({ success: false, error: 'Patient ID required' }, { status: 400 });
        }
        const history = await getPatientHistory(tenantId, patientId);
        return NextResponse.json({ success: true, consultations: history });
      }

      default: {
        const filters = {
          patientId: searchParams.get('patientId') || undefined,
          doctorId: searchParams.get('doctorId') || undefined,
          status: searchParams.get('status') as ConsultationStatus | undefined,
          date: searchParams.get('date') || undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
        };
        const consultations = await listConsultations(tenantId, filters);
        return NextResponse.json({ success: true, consultations });
      }
    }

  } catch (error: any) {
    console.error('[Health Consultations API] GET error:', error);
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
        const { patientId, doctorId, appointmentId, chiefComplaint } = body;
        if (!patientId || !doctorId) {
          return NextResponse.json({ success: false, error: 'Patient ID and doctor ID required' }, { status: 400 });
        }
        const result = await createConsultation(tenantId, { patientId, doctorId, appointmentId, chiefComplaint });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, consultationId: result.consultationId });
      }

      case 'record-vitals': {
        const { consultationId, vitals } = body;
        if (!consultationId || !vitals) {
          return NextResponse.json({ success: false, error: 'Consultation ID and vitals required' }, { status: 400 });
        }
        const result = await recordVitalSigns(tenantId, consultationId, vitals, session.user.id);
        return NextResponse.json(result);
      }

      case 'add-diagnosis': {
        const { consultationId, diagnosis } = body;
        if (!consultationId || !diagnosis) {
          return NextResponse.json({ success: false, error: 'Consultation ID and diagnosis required' }, { status: 400 });
        }
        const result = await addDiagnosis(tenantId, consultationId, diagnosis);
        return NextResponse.json(result);
      }

      case 'complete': {
        const { consultationId, diagnosis, treatmentPlan, followUpDate, labOrders, notes } = body;
        if (!consultationId || !diagnosis || !treatmentPlan) {
          return NextResponse.json({ success: false, error: 'Consultation ID, diagnosis, and treatment plan required' }, { status: 400 });
        }
        const result = await completeConsultation(tenantId, consultationId, {
          diagnosis,
          treatmentPlan,
          followUpDate,
          labOrders,
          notes,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Consultations API] POST error:', error);
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
    const { consultationId, action = 'update-notes' } = body;

    if (!consultationId) {
      return NextResponse.json({ success: false, error: 'Consultation ID required' }, { status: 400 });
    }

    switch (action) {
      case 'update-status': {
        const { status } = body;
        const validStatuses = ['WAITING', 'VITALS_TAKEN', 'WITH_DOCTOR', 'COMPLETED', 'REFERRED'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }
        const result = await updateConsultationStatus(tenantId, consultationId, status as ConsultationStatus);
        return NextResponse.json(result);
      }

      case 'update-notes': {
        const result = await updateConsultationNotes(tenantId, consultationId, body);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Consultations API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
