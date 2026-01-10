/**
 * HEALTH SUITE: Encounters API (APPEND-ONLY)
 * 
 * Clinical encounter management with append-only guarantees.
 * No destructive updates allowed.
 * 
 * GET - List encounters or get by ID
 * POST - Create encounter, add notes, add diagnoses
 * PATCH - Complete encounter, amend (creates audit trail)
 * 
 * @module api/health/encounters
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthEncounterStatus, HealthNoteType, HealthDiagnosisType, HealthDiagnosisStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const entity = searchParams.get('entity') // notes, diagnoses

    if (id) {
      const encounter = await prisma.health_encounter.findFirst({
        where: { id, tenantId },
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
      if (!encounter) {
        return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, encounter })
    }

    // Get notes for an encounter
    if (entity === 'notes' && searchParams.get('encounterId')) {
      const notes = await prisma.health_note.findMany({
        where: { tenantId, encounterId: searchParams.get('encounterId')! },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ success: true, notes })
    }

    // Get diagnoses for an encounter
    if (entity === 'diagnoses' && searchParams.get('encounterId')) {
      const diagnoses = await prisma.health_diagnosis.findMany({
        where: { tenantId, encounterId: searchParams.get('encounterId')! },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
      })
      return NextResponse.json({ success: true, diagnoses })
    }

    // Get patient encounter history
    if (searchParams.get('patientId')) {
      const patientId = searchParams.get('patientId')!
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

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

      return NextResponse.json({ success: true, encounters, total, page, limit })
    }

    // List recent encounters
    const visitId = searchParams.get('visitId')
    const providerId = searchParams.get('providerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (visitId) where.visitId = visitId
    if (providerId) where.providerId = providerId

    const [encounters, total] = await Promise.all([
      prisma.health_encounter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { encounterDate: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        },
      }),
      prisma.health_encounter.count({ where }),
    ])

    return NextResponse.json({ success: true, encounters, total, page, limit })
  } catch (error) {
    console.error('Encounters GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const action = body.action || 'create'

    switch (action) {
      case 'create': {
        if (!body.visitId || !body.patientId || !body.providerId) {
          return NextResponse.json({ error: 'visitId, patientId, and providerId are required' }, { status: 400 })
        }

        const encounter = await prisma.health_encounter.create({
          data: {
            tenantId,
            visitId: body.visitId,
            patientId: body.patientId,
            providerId: body.providerId,
            facilityId: body.facilityId,
            vitals: body.vitals,
            status: 'IN_PROGRESS',
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
            provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        })

        // Update visit status
        await prisma.health_visit.update({
          where: { id: body.visitId },
          data: { status: 'IN_CONSULTATION' },
        })

        return NextResponse.json({ success: true, encounter })
      }

      case 'add_note': {
        // APPEND-ONLY: Notes cannot be edited or deleted
        if (!body.encounterId || !body.noteType || !body.content) {
          return NextResponse.json({ error: 'encounterId, noteType, and content are required' }, { status: 400 })
        }

        const note = await prisma.health_note.create({
          data: {
            tenantId,
            encounterId: body.encounterId,
            noteType: body.noteType as HealthNoteType,
            content: body.content,
            authorId: session.user.id,
            authorName: session.user.name || 'Unknown',
            amendsNoteId: body.amendsNoteId, // If amending another note
          },
        })

        return NextResponse.json({ success: true, note, message: 'Note created (immutable)' })
      }

      case 'add_diagnosis': {
        // APPEND-ONLY: Diagnoses cannot be edited
        if (!body.encounterId || !body.description) {
          return NextResponse.json({ error: 'encounterId and description are required' }, { status: 400 })
        }

        const diagnosis = await prisma.health_diagnosis.create({
          data: {
            tenantId,
            encounterId: body.encounterId,
            icdCode: body.icdCode,
            description: body.description,
            type: (body.type as HealthDiagnosisType) || 'PRIMARY',
            status: 'ACTIVE',
            onsetDate: body.onsetDate ? new Date(body.onsetDate) : undefined,
            diagnosedBy: session.user.id,
            diagnosedByName: session.user.name || 'Unknown',
          },
        })

        return NextResponse.json({ success: true, diagnosis, message: 'Diagnosis created (append-only)' })
      }

      case 'record_vitals': {
        if (!body.encounterId || !body.vitals) {
          return NextResponse.json({ error: 'encounterId and vitals are required' }, { status: 400 })
        }

        const encounter = await prisma.health_encounter.update({
          where: { id: body.encounterId, tenantId },
          data: { vitals: body.vitals },
        })

        return NextResponse.json({ success: true, encounter })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Encounters POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const action = body.action || 'update_status'

    switch (action) {
      case 'complete': {
        // Complete encounter (NO GOING BACK)
        if (!body.id) {
          return NextResponse.json({ error: 'Encounter ID is required' }, { status: 400 })
        }

        const encounter = await prisma.health_encounter.update({
          where: { id: body.id, tenantId, status: 'IN_PROGRESS' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedBy: session.user.id,
          },
        })

        return NextResponse.json({ success: true, encounter, message: 'Encounter completed (final)' })
      }

      case 'amend': {
        // Amend a completed encounter (creates audit trail)
        if (!body.id || !body.reason) {
          return NextResponse.json({ error: 'Encounter ID and reason are required' }, { status: 400 })
        }

        const encounter = await prisma.health_encounter.update({
          where: { id: body.id, tenantId, status: 'COMPLETED' },
          data: {
            status: 'AMENDED',
            amendedAt: new Date(),
            amendedBy: session.user.id,
            amendmentReason: body.reason,
          },
        })

        return NextResponse.json({ success: true, encounter, message: 'Encounter amended (audit trail created)' })
      }

      case 'resolve_diagnosis': {
        // Resolve a diagnosis (don't delete)
        if (!body.diagnosisId) {
          return NextResponse.json({ error: 'diagnosisId is required' }, { status: 400 })
        }

        const diagnosis = await prisma.health_diagnosis.update({
          where: { id: body.diagnosisId, tenantId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: session.user.id,
            resolutionNote: body.resolutionNote,
          },
        })

        return NextResponse.json({ success: true, diagnosis, message: 'Diagnosis resolved (not deleted)' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: complete, amend, resolve_diagnosis' }, { status: 400 })
    }
  } catch (error) {
    console.error('Encounters PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
