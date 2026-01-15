/**
 * PORTAL AUTHORIZATION HELPERS
 * 
 * Entity-level authorization for Education and Health portals.
 * Ensures users can only access records they are linked to.
 * 
 * Authorization levels:
 * 1. Guardian viewing student: Guardian must be linked to user account
 * 2. Patient viewing own data: Patient must be linked to user account  
 * 3. Staff access: Tenant membership allows broader access (for admin use)
 */

import { prisma } from '@/lib/prisma';

/**
 * Check if user can access a specific student's data.
 * 
 * Access is granted if:
 * - User is linked to a guardian of the student (entity-level)
 * - User is a tenant admin/staff (tenant-level fallback)
 */
export async function canAccessStudent(
  userId: string,
  tenantId: string,
  studentId: string
): Promise<boolean> {
  // Check 1: Is user linked to a guardian of this student?
  const guardianLink = await prisma.edu_student_guardian.findFirst({
    where: {
      tenantId,
      studentId,
      guardian: {
        is: {
          userId,
        },
      },
    },
  });

  if (guardianLink) return true;

  // Check 2: Fallback to tenant membership (for staff/admin access)
  // Staff with any admin role can access for administrative purposes
  const tenantMembership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      tenantId,
      isActive: true,
      role: { in: ['TENANT_ADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'STAFF'] },
    },
  });

  if (tenantMembership) return true;

  // No access
  return false;
}

/**
 * Check if user can access a specific patient's data.
 * 
 * Access is granted if:
 * - User is linked directly to the patient record (entity-level)
 * - User is a tenant admin/staff (tenant-level fallback)
 */
export async function canAccessPatient(
  userId: string,
  tenantId: string,
  patientId: string
): Promise<boolean> {
  // Check 1: Is user linked directly to this patient?
  const patientLink = await prisma.health_patient.findFirst({
    where: {
      tenantId,
      id: patientId,
      userId,
    },
  });

  if (patientLink) return true;

  // Check 2: Fallback to tenant membership (for staff/admin access)
  // Staff with any admin role can access for administrative purposes
  const tenantMembership = await prisma.tenantMembership.findFirst({
    where: {
      userId,
      tenantId,
      isActive: true,
      role: { in: ['TENANT_ADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'STAFF'] },
    },
  });

  if (tenantMembership) return true;

  // No access
  return false;
}

/**
 * Get all students accessible by a guardian user.
 * Useful for guardian portal home page showing all children.
 */
export async function getAccessibleStudents(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const guardianLinks = await prisma.edu_student_guardian.findMany({
    where: {
      tenantId,
      guardian: {
        is: {
          userId,
        },
      },
    },
    select: {
      studentId: true,
    },
  });

  return guardianLinks.map(link => link.studentId);
}

/**
 * Get all patient records accessible by a user.
 * Useful for patient portal home page.
 */
export async function getAccessiblePatients(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const patients = await prisma.health_patient.findMany({
    where: {
      tenantId,
      userId,
    },
    select: {
      id: true,
    },
  });

  return patients.map(p => p.id);
}
