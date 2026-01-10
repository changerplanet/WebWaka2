/**
 * HEALTH SUITE: Appointment Service
 * 
 * Manages patient appointments with doctors.
 * SIMPLIFIED IMPLEMENTATION: In-memory demo storage.
 */

import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  getAppointmentDuration,
} from './config';

// ============================================================================
// IN-MEMORY STORAGE (Demo)
// ============================================================================

const appointmentStorage: Map<string, Appointment[]> = new Map();

// ============================================================================
// APPOINTMENT MANAGEMENT
// ============================================================================

export async function createAppointment(
  tenantId: string,
  input: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: string;
    startTime: string;
    type: AppointmentType;
    reason?: string;
    notes?: string;
  }
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const appointments = appointmentStorage.get(tenantId) || [];
  
  // Calculate end time based on appointment type
  const duration = getAppointmentDuration(input.type);
  const endTime = calculateEndTime(input.startTime, duration);
  
  // Check for conflicts
  const conflict = appointments.find((a: any) => 
    a.doctorId === input.doctorId &&
    a.appointmentDate === input.appointmentDate &&
    a.status !== 'CANCELLED' &&
    hasTimeOverlap(input.startTime, endTime, a.startTime, a.endTime)
  );
  
  if (conflict) {
    return { success: false, error: 'Doctor is not available at this time' };
  }
  
  const appointmentId = `appt_${Date.now().toString(36)}`;
  
  const newAppointment: Appointment = {
    id: appointmentId,
    tenantId,
    patientId: input.patientId,
    patientName: input.patientName,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    endTime,
    status: 'SCHEDULED',
    type: input.type,
    reason: input.reason,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  appointments.push(newAppointment);
  appointmentStorage.set(tenantId, appointments);
  
  console.log(`[Health Demo] Created appointment: ${appointmentId}`);
  return { success: true, appointmentId };
}

export async function getAppointment(
  tenantId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const appointments = appointmentStorage.get(tenantId) || [];
  return appointments.find((a: any) => a.id === appointmentId) || null;
}

export async function listAppointments(
  tenantId: string,
  filters?: {
    date?: string;
    doctorId?: string;
    patientId?: string;
    status?: AppointmentStatus;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Appointment[]> {
  let appointments = appointmentStorage.get(tenantId) || [];
  
  if (filters?.date) {
    appointments = appointments.filter((a: any) => a.appointmentDate === filters.date);
  }
  
  if (filters?.doctorId) {
    appointments = appointments.filter((a: any) => a.doctorId === filters.doctorId);
  }
  
  if (filters?.patientId) {
    appointments = appointments.filter((a: any) => a.patientId === filters.patientId);
  }
  
  if (filters?.status) {
    appointments = appointments.filter((a: any) => a.status === filters.status);
  }
  
  if (filters?.dateFrom) {
    appointments = appointments.filter((a: any) => a.appointmentDate >= filters.dateFrom!);
  }
  
  if (filters?.dateTo) {
    appointments = appointments.filter((a: any) => a.appointmentDate <= filters.dateTo!);
  }
  
  // Sort by date and time
  appointments.sort((a, b) => {
    const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
  
  return appointments;
}

export async function updateAppointmentStatus(
  tenantId: string,
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  const appointments = appointmentStorage.get(tenantId) || [];
  const index = appointments.findIndex(a => a.id === appointmentId);
  
  if (index === -1) {
    return { success: false, error: 'Appointment not found' };
  }
  
  appointments[index].status = status;
  appointments[index].updatedAt = new Date().toISOString();
  
  appointmentStorage.set(tenantId, appointments);
  return { success: true };
}

export async function rescheduleAppointment(
  tenantId: string,
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<{ success: boolean; error?: string }> {
  const appointments = appointmentStorage.get(tenantId) || [];
  const index = appointments.findIndex(a => a.id === appointmentId);
  
  if (index === -1) {
    return { success: false, error: 'Appointment not found' };
  }
  
  const appointment = appointments[index];
  const duration = getAppointmentDuration(appointment.type);
  const endTime = calculateEndTime(newTime, duration);
  
  // Check for conflicts
  const conflict = appointments.find((a: any) => 
    a.id !== appointmentId &&
    a.doctorId === appointment.doctorId &&
    a.appointmentDate === newDate &&
    a.status !== 'CANCELLED' &&
    hasTimeOverlap(newTime, endTime, a.startTime, a.endTime)
  );
  
  if (conflict) {
    return { success: false, error: 'Doctor is not available at this time' };
  }
  
  appointments[index].appointmentDate = newDate;
  appointments[index].startTime = newTime;
  appointments[index].endTime = endTime;
  appointments[index].status = 'RESCHEDULED';
  appointments[index].updatedAt = new Date().toISOString();
  
  appointmentStorage.set(tenantId, appointments);
  return { success: true };
}

export async function cancelAppointment(
  tenantId: string,
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateAppointmentStatus(tenantId, appointmentId, 'CANCELLED');
  if (result.success && reason) {
    const appointments = appointmentStorage.get(tenantId) || [];
    const appointment = appointments.find((a: any) => a.id === appointmentId);
    if (appointment) {
      appointment.notes = `Cancelled: ${reason}`;
    }
  }
  return result;
}

export async function getTodayAppointments(
  tenantId: string,
  doctorId?: string
): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0];
  return listAppointments(tenantId, { date: today, doctorId });
}

export async function getAppointmentStats(
  tenantId: string,
  date?: string
): Promise<{
  total: number;
  scheduled: number;
  confirmed: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  noShow: number;
}> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const appointments = await listAppointments(tenantId, { date: targetDate });
  
  return {
    total: appointments.length,
    scheduled: appointments.filter((a: any) => a.status === 'SCHEDULED').length,
    confirmed: appointments.filter((a: any) => a.status === 'CONFIRMED').length,
    checkedIn: appointments.filter((a: any) => a.status === 'CHECKED_IN').length,
    completed: appointments.filter((a: any) => a.status === 'COMPLETED').length,
    cancelled: appointments.filter((a: any) => a.status === 'CANCELLED').length,
    noShow: appointments.filter((a: any) => a.status === 'NO_SHOW').length,
  };
}

export async function getDoctorAvailableSlots(
  tenantId: string,
  doctorId: string,
  date: string,
  slotDuration: number = 30
): Promise<string[]> {
  const appointments = await listAppointments(tenantId, { date, doctorId });
  const bookedTimes = appointments
    .filter((a: any) => a.status !== 'CANCELLED')
    .map((a: any) => ({ start: a.startTime, end: a.endTime }));
  
  // Generate slots from 8:00 to 17:00
  const slots: string[] = [];
  for (let hour = 8; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const endTime = calculateEndTime(time, slotDuration);
      
      // Check if slot is available
      const isBooked = bookedTimes.some((b: any) => hasTimeOverlap(time, endTime, b.start, b.end));
      if (!isBooked) {
        slots.push(time);
      }
    }
  }
  
  return slots;
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}
