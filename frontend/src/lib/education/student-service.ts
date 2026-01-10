/**
 * EDUCATION SUITE: Student Service
 * 
 * Manages students and guardians.
 * SIMPLIFIED IMPLEMENTATION: Demo data for UI demonstration.
 */

import { StudentMetadata, EDUCATION_CONTACT_TYPES } from './config';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStudentServiceInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  admissionNumber: string;
  enrollmentDate: string;
  classId: string;
  className: string;
  section?: string;
  rollNumber?: string;
  gradeLevel: number;
  stream?: string;
  guardians?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    relationship: string;
    isPrimary?: boolean;
  }[];
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  admissionNumber: string;
  enrollmentNumber: string;
  enrollmentDate: string;
  classId: string;
  className: string;
  section?: string;
  rollNumber?: string;
  gradeLevel: number;
  stream?: string;
  status: string;
  guardians: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
  }[];
  createdAt: string;
}

// ============================================================================
// IN-MEMORY STORAGE (Demo)
// ============================================================================

const studentStorage: Map<string, StudentProfile[]> = new Map();

// ============================================================================
// STUDENT MANAGEMENT
// ============================================================================

export async function createStudent(
  tenantId: string,
  input: CreateStudentServiceInput,
  createdBy: string
): Promise<{ success: boolean; studentId?: string; error?: string }> {
  console.log(`[Education Demo] Creating student: ${input.firstName} ${input.lastName}`);
  const studentId = `student_${Date.now().toString(36)}`;
  return { success: true, studentId };
}

export async function getStudent(
  tenantId: string,
  studentId: string
): Promise<StudentProfile | null> {
  return null;
}

export async function listStudents(
  tenantId: string,
  filters?: {
    classId?: string;
    section?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ students: StudentProfile[]; total: number; page: number; limit: number }> {
  return { students: [], total: 0, page: filters?.page || 1, limit: filters?.limit || 20 };
}

export async function updateStudent(
  tenantId: string,
  studentId: string,
  updates: Partial<CreateStudentServiceInput>
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Education Demo] Updating student: ${studentId}`);
  return { success: true };
}

export async function updateStudentStatus(
  tenantId: string,
  studentId: string,
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN' | 'SUSPENDED'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Education Demo] Updating student status: ${studentId} -> ${status}`);
  return { success: true };
}

// ============================================================================
// GUARDIAN MANAGEMENT
// ============================================================================

export async function createGuardian(
  tenantId: string,
  input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    relationship: string;
    studentId: string;
    isPrimary?: boolean;
  }
): Promise<{ success: boolean; guardianId?: string; error?: string }> {
  console.log(`[Education Demo] Creating guardian: ${input.firstName} ${input.lastName}`);
  return { success: true, guardianId: `guardian_${Date.now().toString(36)}` };
}

export async function getStudentGuardians(
  tenantId: string,
  studentId: string
): Promise<{ id: string; name: string; relationship: string; phone: string; email?: string; isPrimary: boolean }[]> {
  return [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function getStudentCountByClass(tenantId: string): Promise<{ classId: string; className: string; count: number }[]> {
  return [];
}

// ============================================================================
// GUARDIAN ENTITY HELPERS (for API routes)
// ============================================================================

export function validateGuardianInput(input: {
  tenantId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  [key: string]: unknown;
}): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!input.firstName?.trim()) errors.push('First name is required');
  if (!input.lastName?.trim()) errors.push('Last name is required');
  if (!input.phone?.trim()) errors.push('Phone number is required');
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export function createGuardianEntity(input: {
  tenantId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  occupation?: string;
  employer?: string;
  [key: string]: unknown;
}): Record<string, unknown> {
  return {
    tenantId: input.tenantId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    middleName: input.middleName?.trim() || null,
    fullName: `${input.firstName} ${input.lastName}`.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    occupation: input.occupation?.trim() || null,
    employer: input.employer?.trim() || null,
    isActive: true,
  };
}
