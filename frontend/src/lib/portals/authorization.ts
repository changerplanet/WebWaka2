/**
 * PORTAL AUTHORIZATION HELPERS
 * 
 * Verify user access to student/patient records within a tenant.
 * 
 * SECURITY LIMITATION (E2.2):
 * The current Prisma schema does not link guardians/patients to user accounts
 * (edu_guardian, edu_student, health_patient lack userId fields).
 * 
 * Current implementation provides TENANT-LEVEL authorization:
 * - Verifies user is a member of the tenant
 * - Verifies the requested record exists in that tenant
 * 
 * For ENTITY-LEVEL authorization (guardian viewing only their children,
 * patient viewing only their own records), the schema would need:
 * - edu_guardian.userId linking guardian to user account
 * - health_patient.userId linking patient to user account
 * 
 * This is acceptable for internal tenant staff access but should be
 * enhanced before exposing to public end-users.
 */

import { prisma } from '@/lib/prisma';

export async function canAccessStudent(
  userId: string,
  tenantId: string,
  studentId: string
): Promise<boolean> {
  const tenantMembership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      tenantId,
    },
  });

  if (!tenantMembership) return false;

  const student = await prisma.edu_student.findFirst({
    where: {
      tenantId,
      id: studentId,
    },
  });

  return !!student;
}

export async function canAccessPatient(
  userId: string,
  tenantId: string,
  patientId: string
): Promise<boolean> {
  const tenantMembership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      tenantId,
    },
  });

  if (!tenantMembership) return false;

  const patient = await prisma.health_patient.findFirst({
    where: {
      tenantId,
      id: patientId,
    },
  });

  return !!patient;
}
