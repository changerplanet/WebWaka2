/**
 * HOSPITALITY SUITE: Stay Service
 * 
 * Manages hotel stays (check-in to check-out).
 * 
 * @module lib/hospitality/services/stay-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityStayStatus, HospitalityRoomStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStayInput {
  tenantId: string
  venueId: string
  guestId: string
  roomId: string
  reservationId?: string
  checkInDate: Date
  checkOutDate: Date
  adults?: number
  children?: number
  nightlyRate?: number
  notes?: string
}

export interface StaySearchOptions {
  venueId?: string
  guestId?: string
  roomId?: string
  status?: HospitalityStayStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// STAY NUMBER GENERATION
// ============================================================================

async function generateStayNumber(tenantId: string): Promise<string> {
  const config = await prisma.hospitality_config.findUnique({
    where: { tenantId }
  })

  const prefix = config?.stayNumberPrefix || 'STY'
  const nextSeq = config?.stayNumberNextSeq || 1

  // Update sequence
  await prisma.hospitality_config.upsert({
    where: { tenantId },
    create: withPrismaDefaults({ tenantId, stayNumberPrefix: prefix, stayNumberNextSeq: nextSeq + 1 }),
    update: { stayNumberNextSeq: nextSeq + 1 }
  })

  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `${prefix}-${dateStr}-${String(nextSeq).padStart(4, '0')}`
}

// ============================================================================
// STAY OPERATIONS
// ============================================================================

export async function createStay(input: CreateStayInput) {
  const stayNumber = await generateStayNumber(input.tenantId)
  
  const checkIn = new Date(input.checkInDate)
  const checkOut = new Date(input.checkOutDate)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  return prisma.hospitality_stay.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      stayNumber,
      guestId: input.guestId,
      roomId: input.roomId,
      reservationId: input.reservationId,
      guestCount: (input.adults || 1) + (input.children || 0),
      adults: input.adults || 1,
      children: input.children || 0,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      nights,
      nightlyRate: input.nightlyRate || 0,
      notes: input.notes,
      status: 'RESERVED'
    }),
    include: { guest: true, room: true, venue: true }
  })
}

export async function getStay(tenantId: string, stayId: string) {
  return prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId },
    include: {
      guest: true,
      room: { include: { floor: true } },
      venue: true,
      reservation: true,
      orders: { include: { items: true } },
      serviceEvents: true,
      chargeFacts: true
    }
  })
}

export async function getStayByNumber(tenantId: string, stayNumber: string) {
  return prisma.hospitality_stay.findFirst({
    where: { stayNumber, tenantId },
    include: { guest: true, room: true, venue: true }
  })
}

export async function listStays(tenantId: string, options?: StaySearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.venueId && { venueId: options.venueId }),
    ...(options?.guestId && { guestId: options.guestId }),
    ...(options?.roomId && { roomId: options.roomId }),
    ...(options?.status && { status: options.status }),
    ...(options?.dateFrom && options?.dateTo && {
      OR: [
        { checkInDate: { gte: options.dateFrom, lte: options.dateTo } },
        { checkOutDate: { gte: options.dateFrom, lte: options.dateTo } }
      ]
    })
  }

  const [stays, total] = await Promise.all([
    prisma.hospitality_stay.findMany({
      where,
      include: { guest: true, room: true, venue: true },
      skip,
      take: limit,
      orderBy: { checkInDate: 'desc' }
    }),
    prisma.hospitality_stay.count({ where })
  ])

  return { stays, total, page, limit }
}

// ============================================================================
// CHECK-IN / CHECK-OUT
// ============================================================================

export async function checkIn(tenantId: string, stayId: string) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId }
  })

  if (!stay) throw new Error('Stay not found')
  if (stay.status !== 'RESERVED') throw new Error('Stay is not in RESERVED status')

  // Update room status to OCCUPIED
  await prisma.hospitality_room.update({
    where: { id: stay.roomId },
    data: { status: 'OCCUPIED' }
  })

  // Update reservation status if linked
  if (stay.reservationId) {
    await prisma.hospitality_reservation.update({
      where: { id: stay.reservationId },
      data: { status: 'CHECKED_IN' }
    })
  }

  return prisma.hospitality_stay.update({
    where: { id: stayId },
    data: {
      status: 'CHECKED_IN',
      actualCheckIn: new Date(),
      updatedAt: new Date()
    },
    include: { guest: true, room: true, venue: true }
  })
}

export async function checkOut(tenantId: string, stayId: string) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId }
  })

  if (!stay) throw new Error('Stay not found')
  if (!['CHECKED_IN', 'IN_HOUSE'].includes(stay.status)) {
    throw new Error('Stay is not checked in')
  }

  // Update room status to DIRTY (needs cleaning)
  await prisma.hospitality_room.update({
    where: { id: stay.roomId },
    data: { status: 'DIRTY' }
  })

  // Update reservation status if linked
  if (stay.reservationId) {
    await prisma.hospitality_reservation.update({
      where: { id: stay.reservationId },
      data: { status: 'COMPLETED' }
    })
  }

  return prisma.hospitality_stay.update({
    where: { id: stayId },
    data: {
      status: 'CHECKED_OUT',
      actualCheckOut: new Date(),
      updatedAt: new Date()
    },
    include: { guest: true, room: true, venue: true }
  })
}

export async function markInHouse(tenantId: string, stayId: string) {
  return prisma.hospitality_stay.update({
    where: { id: stayId },
    data: { status: 'IN_HOUSE', updatedAt: new Date() },
    include: { guest: true, room: true }
  })
}

// ============================================================================
// STAY EXTENSIONS
// ============================================================================

export async function extendStay(tenantId: string, stayId: string, newCheckOutDate: Date) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId }
  })

  if (!stay) throw new Error('Stay not found')

  const newCheckOut = new Date(newCheckOutDate)
  const checkIn = new Date(stay.checkInDate)
  const nights = Math.ceil((newCheckOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  // Check room availability for extended period
  const conflictingStays = await prisma.hospitality_stay.findMany({
    where: {
      tenantId,
      roomId: stay.roomId,
      id: { not: stayId },
      status: { in: ['RESERVED', 'CHECKED_IN', 'IN_HOUSE'] },
      checkInDate: { lte: newCheckOutDate },
      checkOutDate: { gte: stay.checkOutDate }
    }
  })

  if (conflictingStays.length > 0) {
    throw new Error('Room is not available for the extended period')
  }

  return prisma.hospitality_stay.update({
    where: { id: stayId },
    data: {
      checkOutDate: newCheckOutDate,
      extendedTo: newCheckOutDate,
      extensionCount: { increment: 1 },
      nights,
      status: 'EXTENDED',
      updatedAt: new Date()
    },
    include: { guest: true, room: true }
  })
}

// ============================================================================
// ROOM CHANGE
// ============================================================================

export async function changeRoom(tenantId: string, stayId: string, newRoomId: string) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId }
  })

  if (!stay) throw new Error('Stay not found')

  // Check new room availability
  const newRoom = await prisma.hospitality_room.findFirst({
    where: { id: newRoomId, tenantId, status: 'AVAILABLE' }
  })

  if (!newRoom) throw new Error('New room is not available')

  // Update old room status
  if (stay.status === 'CHECKED_IN' || stay.status === 'IN_HOUSE') {
    await prisma.hospitality_room.update({
      where: { id: stay.roomId },
      data: { status: 'DIRTY' }
    })
  }

  // Update new room status
  await prisma.hospitality_room.update({
    where: { id: newRoomId },
    data: { status: 'OCCUPIED' }
  })

  return prisma.hospitality_stay.update({
    where: { id: stayId },
    data: {
      roomId: newRoomId,
      notes: `${stay.notes || ''}\nRoom changed from ${stay.roomId} to ${newRoomId}`,
      updatedAt: new Date()
    },
    include: { guest: true, room: true }
  })
}

// ============================================================================
// IN-HOUSE GUESTS
// ============================================================================

export async function getInHouseGuests(tenantId: string, venueId: string) {
  return prisma.hospitality_stay.findMany({
    where: {
      tenantId,
      venueId,
      status: { in: ['CHECKED_IN', 'IN_HOUSE'] }
    },
    include: {
      guest: true,
      room: { include: { floor: true } }
    },
    orderBy: { room: { roomNumber: 'asc' } }
  })
}

// ============================================================================
// STAY FOLIO (Charge Summary)
// ============================================================================

export async function getStayFolio(tenantId: string, stayId: string) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId },
    include: { guest: true, room: true }
  })

  if (!stay) throw new Error('Stay not found')

  const chargeFacts = await prisma.hospitality_charge_fact.findMany({
    where: { tenantId, stayId },
    orderBy: { serviceDate: 'asc' }
  })

  const totalCharges = chargeFacts.reduce((sum: any, fact) => sum + Number(fact.amount), 0)
  const pendingCharges = chargeFacts
    .filter((f: any) => f.status === 'PENDING')
    .reduce((sum: any, fact) => sum + Number(fact.amount), 0)
  const billedCharges = chargeFacts
    .filter((f: any) => f.status === 'BILLED')
    .reduce((sum: any, fact) => sum + Number(fact.amount), 0)

  return {
    stay,
    chargeFacts,
    summary: {
      roomNights: stay.nights,
      nightlyRate: Number(stay.nightlyRate),
      roomTotal: stay.nights * Number(stay.nightlyRate),
      totalCharges,
      pendingCharges,
      billedCharges
    }
  }
}
