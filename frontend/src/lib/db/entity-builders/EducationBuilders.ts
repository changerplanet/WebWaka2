/**
 * Phase 16B - Education Entity Builders
 * 
 * Pure, deterministic functions that transform service-layer inputs
 * into Prisma-compliant create/update input objects.
 * 
 * NO side effects, NO I/O, NO business logic.
 */

import { Prisma, EduAssessmentType, EduGuardianRelation } from '@prisma/client';

// ============================================================================
// ASSESSMENTS
// ============================================================================

export interface AssessmentInput {
  tenantId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  termId: string;
  assessmentType: EduAssessmentType | 'CLASSWORK' | 'HOMEWORK' | 'QUIZ' | 'TEST' | 'CA' | 'EXAM' | 'PROJECT' | 'PRACTICAL';
  assessmentName?: string | null;
  maxScore?: number;
  score: number;
  gradedById?: string | null;
  gradedAt?: Date | null;
  teacherComment?: string | null;
}

export function buildAssessmentCreate(
  input: AssessmentInput
): Prisma.edu_assessmentCreateInput {
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    subjectId: input.subjectId,
    termId: input.termId,
    assessmentType: input.assessmentType as EduAssessmentType,
    assessmentName: input.assessmentName ?? null,
    maxScore: input.maxScore ?? 100,
    score: input.score,
    gradedById: input.gradedById ?? null,
    gradedAt: input.gradedAt ?? null,
    teacherComment: input.teacherComment ?? null,
  };
}

// ============================================================================
// GUARDIANS
// ============================================================================

export interface GuardianInput {
  tenantId: string;
  platformInstanceId?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone: string;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
}

export function buildGuardianCreate(
  input: GuardianInput
): Prisma.edu_guardianCreateInput {
  const fullName = input.fullName ?? 
    `${input.firstName}${input.middleName ? ' ' + input.middleName : ''} ${input.lastName}`;
  
  return {
    tenantId: input.tenantId,
    platformInstanceId: input.platformInstanceId ?? null,
    firstName: input.firstName,
    lastName: input.lastName,
    middleName: input.middleName ?? null,
    fullName,
    email: input.email ?? null,
    phone: input.phone,
    whatsapp: input.whatsapp ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    occupation: input.occupation ?? null,
  };
}

export function buildGuardianUpdate(
  input: Partial<GuardianInput>
): Prisma.edu_guardianUpdateInput {
  const update: Prisma.edu_guardianUpdateInput = {};
  
  if (input.firstName !== undefined) update.firstName = input.firstName;
  if (input.lastName !== undefined) update.lastName = input.lastName;
  if (input.middleName !== undefined) update.middleName = input.middleName;
  if (input.email !== undefined) update.email = input.email;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.whatsapp !== undefined) update.whatsapp = input.whatsapp;
  if (input.address !== undefined) update.address = input.address;
  if (input.city !== undefined) update.city = input.city;
  if (input.state !== undefined) update.state = input.state;
  if (input.occupation !== undefined) update.occupation = input.occupation;
  
  // Recompute fullName if name parts changed
  if (input.firstName !== undefined || input.lastName !== undefined || input.middleName !== undefined) {
    // Note: Caller should provide complete fullName or we use partial update
    if (input.fullName) {
      update.fullName = input.fullName;
    }
  }
  
  return update;
}

// ============================================================================
// ATTENDANCE (for bulk creates)
// ============================================================================

export interface AttendanceInput {
  tenantId: string;
  studentId: string;
  classId: string;
  termId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedById?: string | null;
  notes?: string | null;
}

export function buildAttendanceCreate(
  input: AttendanceInput
): Prisma.edu_attendanceCreateInput {
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    termId: input.termId,
    date: input.date,
    status: input.status,
    markedById: input.markedById ?? null,
    notes: input.notes ?? null,
  };
}

export function buildAttendanceCreateMany(
  inputs: AttendanceInput[]
): Prisma.edu_attendanceCreateManyInput[] {
  return inputs.map(input => ({
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    termId: input.termId,
    date: input.date,
    status: input.status,
    markedById: input.markedById ?? null,
    notes: input.notes ?? null,
  }));
}

// ============================================================================
// FEE STRUCTURES
// ============================================================================

export interface FeeStructureInput {
  tenantId: string;
  termId: string;
  classId?: string | null;
  feeType: string;
  feeName: string;
  amount: number;
  currency?: string;
  isOptional?: boolean;
  dueDate?: Date | null;
  description?: string | null;
}

export function buildFeeStructureCreate(
  input: FeeStructureInput
): Prisma.edu_fee_structureCreateInput {
  return {
    tenantId: input.tenantId,
    termId: input.termId,
    classId: input.classId ?? null,
    feeType: input.feeType,
    feeName: input.feeName,
    amount: input.amount,
    currency: input.currency ?? 'NGN',
    isOptional: input.isOptional ?? false,
    dueDate: input.dueDate ?? null,
    description: input.description ?? null,
  };
}

// ============================================================================
// FEE ASSIGNMENTS
// ============================================================================

export interface FeeAssignmentInput {
  tenantId: string;
  studentId: string;
  feeStructureId: string;
  termId: string;
  amount: number;
  amountPaid?: number;
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'OVERDUE';
  dueDate?: Date | null;
  notes?: string | null;
}

export function buildFeeAssignmentCreate(
  input: FeeAssignmentInput
): Prisma.edu_fee_assignmentCreateInput {
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    feeStructureId: input.feeStructureId,
    termId: input.termId,
    amount: input.amount,
    amountPaid: input.amountPaid ?? 0,
    status: input.status ?? 'PENDING',
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
  };
}

export function buildFeeAssignmentCreateMany(
  inputs: FeeAssignmentInput[]
): Prisma.edu_fee_assignmentCreateManyInput[] {
  return inputs.map(input => ({
    tenantId: input.tenantId,
    studentId: input.studentId,
    feeStructureId: input.feeStructureId,
    termId: input.termId,
    amount: input.amount,
    amountPaid: input.amountPaid ?? 0,
    status: input.status ?? 'PENDING',
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
  }));
}

// ============================================================================
// RESULTS
// ============================================================================

export interface ResultInput {
  tenantId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  termId: string;
  sessionId: string;
  caScore?: number | null;
  examScore?: number | null;
  totalScore?: number | null;
  grade?: string | null;
  gradePoint?: number | null;
  position?: number | null;
  teacherComment?: string | null;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';
  submittedAt?: Date | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

export function buildResultCreate(
  input: ResultInput
): Prisma.edu_resultCreateInput {
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    subjectId: input.subjectId,
    termId: input.termId,
    sessionId: input.sessionId,
    caScore: input.caScore ?? null,
    examScore: input.examScore ?? null,
    totalScore: input.totalScore ?? null,
    grade: input.grade ?? null,
    gradePoint: input.gradePoint ?? null,
    position: input.position ?? null,
    teacherComment: input.teacherComment ?? null,
    status: input.status ?? 'DRAFT',
    submittedAt: input.submittedAt ?? null,
    approvedById: input.approvedById ?? null,
    approvedAt: input.approvedAt ?? null,
  };
}

export function buildResultUpsert(
  input: ResultInput
): {
  where: Prisma.edu_resultWhereUniqueInput;
  create: Prisma.edu_resultCreateInput;
  update: Prisma.edu_resultUpdateInput;
} {
  return {
    where: {
      tenantId_studentId_subjectId_termId: {
        tenantId: input.tenantId,
        studentId: input.studentId,
        subjectId: input.subjectId,
        termId: input.termId,
      },
    },
    create: buildResultCreate(input),
    update: {
      caScore: input.caScore,
      examScore: input.examScore,
      totalScore: input.totalScore,
      grade: input.grade,
      gradePoint: input.gradePoint,
      position: input.position,
      teacherComment: input.teacherComment,
      status: input.status,
      submittedAt: input.submittedAt,
      approvedById: input.approvedById,
      approvedAt: input.approvedAt,
    },
  };
}
