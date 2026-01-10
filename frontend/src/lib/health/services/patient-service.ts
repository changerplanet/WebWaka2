/**
 * HEALTH SUITE: Patient Service
 * 
 * Patient registry management using Prisma ORM.
 * Privacy-first, Nigeria-First design.
 * 
 * @module lib/health/patient-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthPatientStatus, HealthGender, HealthBloodGroup, HealthGenotype } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePatientInput {
  mrn?: string // Auto-generated if not provided
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth?: Date
  gender?: HealthGender
  bloodGroup?: HealthBloodGroup
  genotype?: HealthGenotype
  phone?: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    lga?: string
    country?: string
  }
  nationalId?: string
  nextOfKin?: {
    name: string
    relationship: string
    phone: string
    address?: string
  }
  allergies?: string[]
  conditions?: string[]
}

export interface UpdatePatientInput {
  firstName?: string
  lastName?: string
  middleName?: string
  dateOfBirth?: Date
  gender?: HealthGender
  bloodGroup?: HealthBloodGroup
  genotype?: HealthGenotype
  phone?: string
  email?: string
  address?: Prisma.InputJsonValue
  nationalId?: string
  nextOfKin?: Prisma.InputJsonValue
  allergies?: Prisma.InputJsonValue
  conditions?: Prisma.InputJsonValue
}

export interface PatientFilters {
  search?: string
  status?: HealthPatientStatus
  gender?: HealthGender
  bloodGroup?: HealthBloodGroup
  page?: number
  limit?: number
}

// ============================================================================
// PATIENT CRUD
// ============================================================================

/**
 * Create a new patient
 */
export async function createPatient(
  tenantId: string,
  input: CreatePatientInput,
  platformInstanceId?: string
) {
  // Generate MRN if not provided
  const mrn = input.mrn || await generateMRN(tenantId)
  
  const patient = await prisma.health_patient.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      mrn,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      bloodGroup: input.bloodGroup || 'UNKNOWN',
      genotype: input.genotype || 'UNKNOWN',
      phone: input.phone,
      email: input.email,
      address: input.address || undefined,
      nationalId: input.nationalId,
      nextOfKin: input.nextOfKin || undefined,
      allergies: input.allergies || undefined,
      conditions: input.conditions || undefined,
      status: 'ACTIVE',
    }),
  })
  
  return {
    success: true,
    patient: sanitizePatient(patient),
    mrn: patient.mrn,
  }
}

/**
 * Get patient by ID
 */
export async function getPatient(tenantId: string, patientId: string) {
  const patient = await prisma.health_patient.findFirst({
    where: {
      id: patientId,
      tenantId,
    },
    include: {
      guardians: true,
    },
  })
  
  if (!patient) return null
  return sanitizePatient(patient)
}

/**
 * Get patient by MRN
 */
export async function getPatientByMRN(tenantId: string, mrn: string) {
  const patient = await prisma.health_patient.findFirst({
    where: {
      mrn,
      tenantId,
    },
    include: {
      guardians: true,
    },
  })
  
  if (!patient) return null
  return sanitizePatient(patient)
}

/**
 * List patients with filters
 */
export async function listPatients(tenantId: string, filters: PatientFilters = {}) {
  const { search, status, gender, bloodGroup, page = 1, limit = 20 } = filters
  
  const where: Record<string, unknown> = { tenantId }
  
  if (status) where.status = status
  if (gender) where.gender = gender
  if (bloodGroup) where.bloodGroup = bloodGroup
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { mrn: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }
  
  const [patients, total] = await Promise.all([
    prisma.health_patient.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.health_patient.count({ where }),
  ])
  
  return {
    patients: patients.map(sanitizePatient),
    total,
    page,
    limit,
  }
}

/**
 * Update patient (non-clinical fields only)
 */
export async function updatePatient(
  tenantId: string,
  patientId: string,
  input: UpdatePatientInput
) {
  const patient = await prisma.health_patient.update({
    where: {
      id: patientId,
      tenantId,
    },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  })
  
  return {
    success: true,
    patient: sanitizePatient(patient),
  }
}

/**
 * Update patient status
 */
export async function updatePatientStatus(
  tenantId: string,
  patientId: string,
  status: HealthPatientStatus
) {
  const patient = await prisma.health_patient.update({
    where: {
      id: patientId,
      tenantId,
    },
    data: {
      status,
      isActive: status === 'ACTIVE',
      updatedAt: new Date(),
    },
  })
  
  return {
    success: true,
    patient: sanitizePatient(patient),
  }
}

/**
 * Add allergy to patient (append-only)
 */
export async function addPatientAllergy(
  tenantId: string,
  patientId: string,
  allergy: string
) {
  const patient = await prisma.health_patient.findFirst({
    where: { id: patientId, tenantId },
  })
  
  if (!patient) {
    return { success: false, error: 'Patient not found' }
  }
  
  const allergies = (patient.allergies as string[]) || []
  if (!allergies.includes(allergy)) {
    allergies.push(allergy)
  }
  
  await prisma.health_patient.update({
    where: { id: patientId },
    data: { allergies, updatedAt: new Date() },
  })
  
  return { success: true }
}

/**
 * Add chronic condition to patient (append-only)
 */
export async function addPatientCondition(
  tenantId: string,
  patientId: string,
  condition: string
) {
  const patient = await prisma.health_patient.findFirst({
    where: { id: patientId, tenantId },
  })
  
  if (!patient) {
    return { success: false, error: 'Patient not found' }
  }
  
  const conditions = (patient.conditions as string[]) || []
  if (!conditions.includes(condition)) {
    conditions.push(condition)
  }
  
  await prisma.health_patient.update({
    where: { id: patientId },
    data: { conditions, updatedAt: new Date() },
  })
  
  return { success: true }
}

// ============================================================================
// GUARDIAN MANAGEMENT
// ============================================================================

/**
 * Add guardian to patient
 */
export async function addPatientGuardian(
  tenantId: string,
  patientId: string,
  guardian: {
    fullName: string
    relationship: string
    phone: string
    email?: string
    address?: Prisma.InputJsonValue
    isPrimaryContact?: boolean
    canAuthorize?: boolean
  }
) {
  const created = await prisma.health_patient_guardian.create({
    data: withPrismaDefaults({
      tenantId,
      patientId,
      fullName: guardian.fullName,
      relationship: guardian.relationship,
      phone: guardian.phone,
      email: guardian.email,
      address: guardian.address,
      isPrimaryContact: guardian.isPrimaryContact || false,
      canAuthorize: guardian.canAuthorize ?? true,
    }),
  })
  
  return { success: true, guardianId: created.id }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get patient statistics
 */
export async function getPatientStats(tenantId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const [total, active, newThisMonth] = await Promise.all([
    prisma.health_patient.count({ where: { tenantId } }),
    prisma.health_patient.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.health_patient.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    }),
  ])
  
  return { total, active, newThisMonth }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique MRN
 */
async function generateMRN(tenantId: string): Promise<string> {
  // Get or create config
  let config = await prisma.health_config.findUnique({
    where: { tenantId },
  })
  
  if (!config) {
    config = await prisma.health_config.create({
      data: withPrismaDefaults({ tenantId }),
    })
  }
  
  const prefix = config.patientMrnPrefix || 'MRN'
  const seq = config.patientMrnNextSeq || 1
  
  // Update sequence
  await prisma.health_config.update({
    where: { tenantId },
    data: { patientMrnNextSeq: seq + 1 },
  })
  
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`
}

/**
 * Sanitize patient for API response (remove _id)
 */
function sanitizePatient(patient: Record<string, unknown>) {
  const { ...rest } = patient
  return rest
}
