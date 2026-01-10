/**
 * HEALTH SUITE: Patient Service
 * 
 * Manages patients using CRM Contact patterns.
 * SIMPLIFIED IMPLEMENTATION: Demo data for UI demonstration.
 */

import { PatientMetadata, generateMRN, BloodGroup, Genotype } from './config';

// ============================================================================
// TYPES
// ============================================================================

export interface PatientProfile {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  medicalRecordNumber: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  allergies: string[];
  chronicConditions: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  primaryPhysicianId?: string;
  primaryPhysicianName?: string;
  lastVisitDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED';
  createdAt: string;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// ============================================================================
// IN-MEMORY STORAGE (Demo)
// ============================================================================

const patientStorage: Map<string, PatientProfile[]> = new Map();

// ============================================================================
// PATIENT MANAGEMENT
// ============================================================================

export async function createPatient(
  tenantId: string,
  input: CreatePatientInput,
  createdBy: string
): Promise<{ success: boolean; patientId?: string; mrn?: string; error?: string }> {
  const patients = patientStorage.get(tenantId) || [];
  
  const patientId = `patient_${Date.now().toString(36)}`;
  const mrn = generateMRN(tenantId);
  
  const newPatient: PatientProfile = {
    id: patientId,
    tenantId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: `${input.firstName} ${input.lastName}`,
    email: input.email,
    phone: input.phone,
    medicalRecordNumber: mrn,
    dateOfBirth: input.dateOfBirth,
    age: input.dateOfBirth ? calculateAge(input.dateOfBirth) : undefined,
    gender: input.gender,
    address: input.address,
    bloodGroup: input.bloodGroup,
    genotype: input.genotype,
    allergies: input.allergies || [],
    chronicConditions: input.chronicConditions || [],
    insuranceProvider: input.insuranceProvider,
    insurancePolicyNumber: input.insurancePolicyNumber,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  
  patients.push(newPatient);
  patientStorage.set(tenantId, patients);
  
  console.log(`[Health Demo] Created patient: ${mrn} - ${newPatient.fullName}`);
  return { success: true, patientId, mrn };
}

export async function getPatient(
  tenantId: string,
  patientId: string
): Promise<PatientProfile | null> {
  const patients = patientStorage.get(tenantId) || [];
  return patients.find((p: any) => p.id === patientId) || null;
}

export async function getPatientByMRN(
  tenantId: string,
  mrn: string
): Promise<PatientProfile | null> {
  const patients = patientStorage.get(tenantId) || [];
  return patients.find((p: any) => p.medicalRecordNumber === mrn) || null;
}

export async function listPatients(
  tenantId: string,
  filters?: {
    search?: string;
    status?: string;
    hasInsurance?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{ patients: PatientProfile[]; total: number; page: number; limit: number }> {
  let patients = patientStorage.get(tenantId) || [];
  
  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    patients = patients.filter((p: any) => 
      p.fullName.toLowerCase().includes(search) ||
      p.medicalRecordNumber.toLowerCase().includes(search) ||
      p.phone?.includes(search)
    );
  }
  
  if (filters?.status) {
    patients = patients.filter((p: any) => p.status === filters.status);
  }
  
  if (filters?.hasInsurance !== undefined) {
    patients = patients.filter((p: any) => 
      filters.hasInsurance ? !!p.insuranceProvider : !p.insuranceProvider
    );
  }
  
  const total = patients.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const start = (page - 1) * limit;
  
  return {
    patients: patients.slice(start, start + limit),
    total,
    page,
    limit,
  };
}

export async function updatePatient(
  tenantId: string,
  patientId: string,
  updates: Partial<CreatePatientInput>
): Promise<{ success: boolean; error?: string }> {
  const patients = patientStorage.get(tenantId) || [];
  const index = patients.findIndex(p => p.id === patientId);
  
  if (index === -1) {
    return { success: false, error: 'Patient not found' };
  }
  
  patients[index] = {
    ...patients[index],
    ...updates,
    fullName: updates.firstName || updates.lastName 
      ? `${updates.firstName || patients[index].firstName} ${updates.lastName || patients[index].lastName}`
      : patients[index].fullName,
  };
  
  patientStorage.set(tenantId, patients);
  return { success: true };
}

export async function updatePatientStatus(
  tenantId: string,
  patientId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED'
): Promise<{ success: boolean; error?: string }> {
  const patients = patientStorage.get(tenantId) || [];
  const index = patients.findIndex(p => p.id === patientId);
  
  if (index === -1) {
    return { success: false, error: 'Patient not found' };
  }
  
  patients[index].status = status;
  patientStorage.set(tenantId, patients);
  return { success: true };
}

export async function addAllergy(
  tenantId: string,
  patientId: string,
  allergy: string
): Promise<{ success: boolean; error?: string }> {
  const patients = patientStorage.get(tenantId) || [];
  const patient = patients.find((p: any) => p.id === patientId);
  
  if (!patient) {
    return { success: false, error: 'Patient not found' };
  }
  
  if (!patient.allergies.includes(allergy)) {
    patient.allergies.push(allergy);
  }
  
  return { success: true };
}

export async function getPatientStats(tenantId: string): Promise<{
  total: number;
  active: number;
  withInsurance: number;
  newThisMonth: number;
}> {
  const patients = patientStorage.get(tenantId) || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    total: patients.length,
    active: patients.filter((p: any) => p.status === 'ACTIVE').length,
    withInsurance: patients.filter((p: any) => !!p.insuranceProvider).length,
    newThisMonth: patients.filter((p: any) => new Date(p.createdAt) >= monthStart).length,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
