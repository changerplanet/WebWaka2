/**
 * HEALTH SUITE: Appointments API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  getTodayAppointments,
  getAppointmentStats,
  getDoctorAvailableSlots,
} from '@/lib/health/appointment-service';
import { AppointmentStatus, AppointmentType } from '@/lib/health/config';

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
  const appointmentId = searchParams.get('id');

  try {
    if (appointmentId) {
      const appointment = await getAppointment(tenantId, appointmentId);
      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, appointment });
    }

    switch (action) {
      case 'today': {
        const doctorId = searchParams.get('doctorId') || undefined;
        const appointments = await getTodayAppointments(tenantId, doctorId);
        return NextResponse.json({ success: true, appointments });
      }

      case 'stats': {
        const date = searchParams.get('date') || undefined;
        const stats = await getAppointmentStats(tenantId, date);
        return NextResponse.json({ success: true, stats });
      }

      case 'available-slots': {
        const doctorId = searchParams.get('doctorId');
        const date = searchParams.get('date');
        if (!doctorId || !date) {
          return NextResponse.json({ success: false, error: 'Doctor ID and date required' }, { status: 400 });
        }
        const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : 30;
        const slots = await getDoctorAvailableSlots(tenantId, doctorId, date, duration);
        return NextResponse.json({ success: true, slots });
      }

      default: {
        // List appointments
        const filters = {
          date: searchParams.get('date') || undefined,
          doctorId: searchParams.get('doctorId') || undefined,
          patientId: searchParams.get('patientId') || undefined,
          status: searchParams.get('status') as AppointmentStatus | undefined,
          dateFrom: searchParams.get('dateFrom') || undefined,
          dateTo: searchParams.get('dateTo') || undefined,
        };
        const appointments = await listAppointments(tenantId, filters);
        return NextResponse.json({ success: true, appointments });
      }
    }

  } catch (error: any) {
    console.error('[Health Appointments API] GET error:', error);
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
        const { patientId, patientName, doctorId, doctorName, appointmentDate, startTime, type, reason, notes } = body;

        if (!patientId || !patientName || !doctorId || !doctorName || !appointmentDate || !startTime || !type) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: patientId, patientName, doctorId, doctorName, appointmentDate, startTime, type' 
          }, { status: 400 });
        }

        const result = await createAppointment(tenantId, {
          patientId, patientName, doctorId, doctorName, appointmentDate, startTime,
          type: type as AppointmentType,
          reason, notes,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, appointmentId: result.appointmentId });
      }

      case 'reschedule': {
        const { appointmentId, newDate, newTime } = body;
        if (!appointmentId || !newDate || !newTime) {
          return NextResponse.json({ success: false, error: 'Appointment ID, new date and time required' }, { status: 400 });
        }
        const result = await rescheduleAppointment(tenantId, appointmentId, newDate, newTime);
        return NextResponse.json(result);
      }

      case 'cancel': {
        const { appointmentId, reason } = body;
        if (!appointmentId) {
          return NextResponse.json({ success: false, error: 'Appointment ID required' }, { status: 400 });
        }
        const result = await cancelAppointment(tenantId, appointmentId, reason);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Health Appointments API] POST error:', error);
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
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ success: false, error: 'Appointment ID and status required' }, { status: 400 });
    }

    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const result = await updateAppointmentStatus(tenantId, appointmentId, status as AppointmentStatus);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Health Appointments API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
