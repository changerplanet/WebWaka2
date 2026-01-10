/**
 * HEALTH SUITE: Clinical Encounter Service
 * 
 * APPEND-ONLY clinical documentation.
 * All clinical records are immutable after creation.
 * Corrections are made via amendments, not overwrites.
 * 
 * @module lib/health/encounter-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { PrismaClient, HealthEncounterStatus, HealthNoteType, HealthDiagnosisType, HealthDiagnosisStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface VitalsInput {
  bloodPressure?: string // e.g., "120/80"
  temperature?: number   // Celsius
  pulse?: number         // bpm
  weight?: number        // kg
  height?: number        // cm
  spo2?: number          // %
  respiratoryRate?: number // breaths/min
  [key: string]: string | number | undefined // Index signature for JSON compatibility
}

export interface CreateEncounterInput {
  visitId: string
  patientId: string
  providerId: string
  facilityId?: string
  vitals?: VitalsInput
}

export interface AddNoteInput {
  noteType: HealthNoteType
  content: string
  authorId: string
  authorName: string
  amendsNoteId?: string // If this is an amendment
}

export interface AddDiagnosisInput {
  icdCode?: string
  description: string
  type?: HealthDiagnosisType
  diagnosedBy: string
  diagnosedByName: string
  onsetDate?: Date
}

// ============================================================================
// ENCOUNTER MANAGEMENT (APPEND-ONLY)
// ============================================================================

/**
 * Create a clinical encounter
 */
export async function createEncounter(
  tenantId: string,
  input: CreateEncounterInput,
  platformInstanceId?: string
) {
  const encounter = await prisma.health_encounter.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      visitId: input.visitId,
      patientId: input.patientId,
      providerId: input.providerId,
      facilityId: input.facilityId,
      vitals: input.vitals || undefined,
      status: 'IN_PROGRESS',
    }),
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true } },
    },
  })
  
  // Update visit status
  await prisma.health_visit.update({
    where: { id: input.visitId },
    data: { status: 'IN_CONSULTATION' },
  })
  
  return { success: true, encounter }
}

/**
 * Get encounter by ID
 */
export async function getEncounter(tenantId: string, encounterId: string) {
  return prisma.health_encounter.findFirst({
    where: { id: encounterId, tenantId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, allergies: true, conditions: true } },
      provider: { select: { id: true, firstName: true, lastName: true, title: true, specialty: true } },
      facility: { select: { id: true, name: true } },
      visit: true,
      notes: { orderBy: { createdAt: 'asc' } },
      diagnoses: { orderBy: { createdAt: 'asc' } },
      prescriptions: { orderBy: { createdAt: 'desc' } },
      labOrders: { include: { results: true }, orderBy: { createdAt: 'desc' } },
      billingFacts: true,
    },
  })
}

/**
 * List encounters for a patient
 */
export async function listPatientEncounters(
  tenantId: string,
  patientId: string,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = options
  
  const [encounters, total] = await Promise.all([
    prisma.health_encounter.findMany({
      where: { tenantId, patientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { encounterDate: 'desc' },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        diagnoses: { where: { type: 'PRIMARY' } },
      },
    }),
    prisma.health_encounter.count({ where: { tenantId, patientId } }),
  ])
  
  return { encounters, total, page, limit }
}

/**
 * Record vitals for an encounter
 */
export async function recordVitals(
  tenantId: string,
  encounterId: string,
  vitals: VitalsInput
) {
  const encounter = await prisma.health_encounter.update({
    where: { id: encounterId, tenantId },
    data: { vitals },
  })
  
  return { success: true, encounter }
}

/**
 * Complete an encounter (NO GOING BACK)
 */
export async function completeEncounter(
  tenantId: string,
  encounterId: string,
  completedBy: string
) {
  const encounter = await prisma.health_encounter.update({
    where: { id: encounterId, tenantId, status: 'IN_PROGRESS' },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
    },
  })
  
  return { success: true, encounter }
}

/**
 * Amend a completed encounter (creates audit trail)
 */
export async function amendEncounter(
  tenantId: string,
  encounterId: string,
  amendedBy: string,
  reason: string
) {
  const encounter = await prisma.health_encounter.update({
    where: { id: encounterId, tenantId, status: 'COMPLETED' },
    data: {
      status: 'AMENDED',
      amendedAt: new Date(),
      amendedBy,
      amendmentReason: reason,
    },
  })
  
  return { success: true, encounter }
}

// ============================================================================
// CLINICAL NOTES (APPEND-ONLY, IMMUTABLE)
// ============================================================================

/**
 * Add a clinical note (IMMUTABLE after creation)
 */
export async function addNote(
  tenantId: string,
  encounterId: string,
  input: AddNoteInput,
  platformInstanceId?: string
) {
  // Notes are IMMUTABLE - they cannot be edited or deleted
  const note = await prisma.health_note.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      encounterId,
      noteType: input.noteType,
      content: input.content,
      authorId: input.authorId,
      authorName: input.authorName,
      amendsNoteId: input.amendsNoteId,
    }),
  })
  
  return { success: true, note }
}

/**
 * Get notes for an encounter
 */
export async function getEncounterNotes(tenantId: string, encounterId: string) {
  return prisma.health_note.findMany({
    where: { tenantId, encounterId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Amend a note (creates new note referencing the old one)
 */
export async function amendNote(
  tenantId: string,
  originalNoteId: string,
  newContent: string,
  authorId: string,
  authorName: string
) {
  const originalNote = await prisma.health_note.findFirst({
    where: { id: originalNoteId, tenantId },
  })
  
  if (!originalNote) {
    return { success: false, error: 'Original note not found' }
  }
  
  // Create amendment note (original is preserved)
  const amendmentNote = await prisma.health_note.create({
    data: withPrismaDefaults({
      tenantId,
      encounterId: originalNote.encounterId,
      noteType: 'AMENDMENT',
      content: newContent,
      authorId,
      authorName,
      amendsNoteId: originalNoteId,
    }),
  })
  
  return { success: true, note: amendmentNote }
}

// ============================================================================
// DIAGNOSES (APPEND-ONLY)
// ============================================================================

/**
 * Add a diagnosis (IMMUTABLE after creation)
 */
export async function addDiagnosis(
  tenantId: string,
  encounterId: string,
  input: AddDiagnosisInput,
  platformInstanceId?: string
) {
  const diagnosis = await prisma.health_diagnosis.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      encounterId,
      icdCode: input.icdCode,
      description: input.description,
      type: input.type || 'PRIMARY',
      status: 'ACTIVE',
      onsetDate: input.onsetDate,
      diagnosedBy: input.diagnosedBy,
      diagnosedByName: input.diagnosedByName,
    }),
  })
  
  return { success: true, diagnosis }
}

/**
 * Get diagnoses for an encounter
 */
export async function getEncounterDiagnoses(tenantId: string, encounterId: string) {
  return prisma.health_diagnosis.findMany({
    where: { tenantId, encounterId },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  })
}

/**
 * Resolve a diagnosis (append resolution, don't delete)
 */
export async function resolveDiagnosis(
  tenantId: string,
  diagnosisId: string,
  resolvedBy: string,
  resolutionNote?: string
) {
  const diagnosis = await prisma.health_diagnosis.update({
    where: { id: diagnosisId, tenantId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNote,
    },
  })
  
  return { success: true, diagnosis }
}

/**
 * Get patient diagnosis history
 */
export async function getPatientDiagnosisHistory(tenantId: string, patientId: string) {
  return prisma.health_diagnosis.findMany({
    where: {
      tenantId,
      encounter: { patientId },
    },
    orderBy: { diagnosedAt: 'desc' },
    include: {
      encounter: {
        select: { encounterDate: true, providerId: true },
        include: {
          provider: { select: { firstName: true, lastName: true, title: true } },
        },
      },
    },
  })
}
