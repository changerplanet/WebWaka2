/**
 * HEALTH SUITE: Consultation Service
 * 
 * Manages patient consultations and medical records.
 * SIMPLIFIED IMPLEMENTATION: In-memory demo storage.
 */

import {
  ConsultationRecord,
  ConsultationStatus,
  VitalSigns,
  Diagnosis,
  CONSULTATION_STATUS,
} from './config';

// ============================================================================
// IN-MEMORY STORAGE (Demo)
// ============================================================================

const consultationStorage: Map<string, ConsultationRecord[]> = new Map();

// ============================================================================
// CONSULTATION MANAGEMENT
// ============================================================================

export async function createConsultation(
  tenantId: string,
  input: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    chiefComplaint?: string;
  }
): Promise<{ success: boolean; consultationId?: string; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  
  const consultationId = `consult_${Date.now().toString(36)}`;
  
  const newConsultation: ConsultationRecord = {
    id: consultationId,
    tenantId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    appointmentId: input.appointmentId,
    status: 'WAITING',
    chiefComplaint: input.chiefComplaint,
    diagnosis: [],
    createdAt: new Date().toISOString(),
  };
  
  consultations.push(newConsultation);
  consultationStorage.set(tenantId, consultations);
  
  console.log(`[Health Demo] Created consultation: ${consultationId}`);
  return { success: true, consultationId };
}

export async function getConsultation(
  tenantId: string,
  consultationId: string
): Promise<ConsultationRecord | null> {
  const consultations = consultationStorage.get(tenantId) || [];
  return consultations.find((c: any) => c.id === consultationId) || null;
}

export async function listConsultations(
  tenantId: string,
  filters?: {
    patientId?: string;
    doctorId?: string;
    status?: ConsultationStatus;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ConsultationRecord[]> {
  let consultations = consultationStorage.get(tenantId) || [];
  
  if (filters?.patientId) {
    consultations = consultations.filter((c: any) => c.patientId === filters.patientId);
  }
  
  if (filters?.doctorId) {
    consultations = consultations.filter((c: any) => c.doctorId === filters.doctorId);
  }
  
  if (filters?.status) {
    consultations = consultations.filter((c: any) => c.status === filters.status);
  }
  
  if (filters?.date) {
    consultations = consultations.filter((c: any) => c.createdAt.startsWith(filters.date!));
  }
  
  if (filters?.dateFrom) {
    consultations = consultations.filter((c: any) => c.createdAt >= filters.dateFrom!);
  }
  
  if (filters?.dateTo) {
    consultations = consultations.filter((c: any) => c.createdAt <= filters.dateTo!);
  }
  
  // Sort by date descending
  consultations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  
  return consultations;
}

export async function recordVitalSigns(
  tenantId: string,
  consultationId: string,
  vitals: Omit<VitalSigns, 'recordedAt'>,
  recordedBy: string
): Promise<{ success: boolean; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  const consultation = consultations.find((c: any) => c.id === consultationId);
  
  if (!consultation) {
    return { success: false, error: 'Consultation not found' };
  }
  
  consultation.vitalSigns = {
    ...vitals,
    recordedAt: new Date().toISOString(),
    recordedBy,
  };
  
  consultation.status = 'VITALS_TAKEN';
  
  consultationStorage.set(tenantId, consultations);
  return { success: true };
}

export async function updateConsultationStatus(
  tenantId: string,
  consultationId: string,
  status: ConsultationStatus
): Promise<{ success: boolean; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  const consultation = consultations.find((c: any) => c.id === consultationId);
  
  if (!consultation) {
    return { success: false, error: 'Consultation not found' };
  }
  
  consultation.status = status;
  if (status === 'COMPLETED') {
    consultation.completedAt = new Date().toISOString();
  }
  
  consultationStorage.set(tenantId, consultations);
  return { success: true };
}

export async function addDiagnosis(
  tenantId: string,
  consultationId: string,
  diagnosis: Diagnosis
): Promise<{ success: boolean; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  const consultation = consultations.find((c: any) => c.id === consultationId);
  
  if (!consultation) {
    return { success: false, error: 'Consultation not found' };
  }
  
  consultation.diagnosis.push(diagnosis);
  consultationStorage.set(tenantId, consultations);
  return { success: true };
}

export async function updateConsultationNotes(
  tenantId: string,
  consultationId: string,
  updates: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    physicalExamination?: string;
    treatmentPlan?: string;
    notes?: string;
    followUpDate?: string;
    labOrders?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  const consultation = consultations.find((c: any) => c.id === consultationId);
  
  if (!consultation) {
    return { success: false, error: 'Consultation not found' };
  }
  
  Object.assign(consultation, updates);
  consultationStorage.set(tenantId, consultations);
  return { success: true };
}

export async function completeConsultation(
  tenantId: string,
  consultationId: string,
  data: {
    diagnosis: Diagnosis[];
    treatmentPlan: string;
    followUpDate?: string;
    labOrders?: string[];
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const consultations = consultationStorage.get(tenantId) || [];
  const consultation = consultations.find((c: any) => c.id === consultationId);
  
  if (!consultation) {
    return { success: false, error: 'Consultation not found' };
  }
  
  consultation.diagnosis = data.diagnosis;
  consultation.treatmentPlan = data.treatmentPlan;
  consultation.followUpDate = data.followUpDate;
  consultation.labOrders = data.labOrders;
  consultation.notes = data.notes;
  consultation.status = 'COMPLETED';
  consultation.completedAt = new Date().toISOString();
  
  consultationStorage.set(tenantId, consultations);
  return { success: true };
}

export async function getPatientHistory(
  tenantId: string,
  patientId: string
): Promise<ConsultationRecord[]> {
  return listConsultations(tenantId, { patientId });
}

export async function getTodayConsultations(
  tenantId: string,
  doctorId?: string
): Promise<ConsultationRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  return listConsultations(tenantId, { date: today, doctorId });
}

export async function getConsultationStats(
  tenantId: string,
  date?: string
): Promise<{
  total: number;
  waiting: number;
  vitalsTaken: number;
  withDoctor: number;
  completed: number;
}> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const consultations = await listConsultations(tenantId, { date: targetDate });
  
  return {
    total: consultations.length,
    waiting: consultations.filter((c: any) => c.status === 'WAITING').length,
    vitalsTaken: consultations.filter((c: any) => c.status === 'VITALS_TAKEN').length,
    withDoctor: consultations.filter((c: any) => c.status === 'WITH_DOCTOR').length,
    completed: consultations.filter((c: any) => c.status === 'COMPLETED').length,
  };
}
