/**
 * HOSPITALITY SUITE: Reservation Service
 * 
 * Manages table and room reservations.
 * 
 * @module lib/hospitality/services/reservation-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityReservationType, HospitalityReservationStatus, HospitalityRoomType } from '@prisma/client'

// Phase 13: Room type validator
const VALID_ROOM_TYPES: HospitalityRoomType[] = ['STANDARD', 'DELUXE', 'EXECUTIVE', 'SUITE', 'PRESIDENTIAL', 'STUDIO', 'APARTMENT', 'DORMITORY'];
function validateRoomType(roomType: string | undefined): HospitalityRoomType | undefined {
  if (!roomType) return undefined;
  if (VALID_ROOM_TYPES.includes(roomType as HospitalityRoomType)) {
    return roomType as HospitalityRoomType;
  }
  console.warn(`[Hospitality Reservation] Invalid roomType '${roomType}'`);
  return undefined;
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTableReservationInput {
  tenantId: string
  venueId: string
  guestId?: string
  guestName: string
  guestPhone?: string
  guestEmail?: string
  tableId?: string
  partySize: number
  reservationDate: Date
  reservationTime: string
  duration?: number
  specialRequests?: string
  occasion?: string
  source?: string
}

export interface CreateRoomReservationInput {
  tenantId: string
  venueId: string
  guestId?: string
  guestName: string
  guestPhone?: string
  guestEmail?: string
  roomId?: string
  checkInDate: Date
  checkOutDate: Date
  adults?: number
  children?: number
  specialRequests?: string
  source?: string
  depositRequired?: boolean
  depositAmount?: number
}

export interface ReservationSearchOptions {
  venueId?: string
  guestId?: string
  reservationType?: HospitalityReservationType
  status?: HospitalityReservationStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

// ============================================================================
// RESERVATION NUMBER GENERATION
// ============================================================================

async function generateReservationNumber(tenantId: string): Promise<string> {
  const config = await prisma.hospitality_config.findUnique({
    where: { tenantId }
  })

  const prefix = config?.reservationPrefix || 'RES'
  const nextSeq = config?.reservationNextSeq || 1

  // Update sequence
  await prisma.hospitality_config.upsert({
    where: { tenantId },
    create: withPrismaDefaults({ tenantId, reservationPrefix: prefix, reservationNextSeq: nextSeq + 1 }),
    update: { reservationNextSeq: nextSeq + 1 }
  })

  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `${prefix}-${dateStr}-${String(nextSeq).padStart(4, '0')}`
}

// ============================================================================
// TABLE RESERVATION OPERATIONS
// ============================================================================

export async function createTableReservation(input: CreateTableReservationInput) {
  const reservationNumber = await generateReservationNumber(input.tenantId)

  return prisma.hospitality_reservation.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      reservationNumber,
      reservationType: 'TABLE',
      guestId: input.guestId,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail,
      tableId: input.tableId,
      partySize: input.partySize,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      duration: input.duration || 120,
      specialRequests: input.specialRequests,
      occasion: input.occasion,
      source: input.source || 'Walk-in',
      status: 'PENDING'
    }),
    include: { guest: true, table: true, venue: true }
  })
}

// ============================================================================
// ROOM RESERVATION OPERATIONS
// ============================================================================

export async function createRoomReservation(input: CreateRoomReservationInput) {
  const reservationNumber = await generateReservationNumber(input.tenantId)
  
  const checkIn = new Date(input.checkInDate)
  const checkOut = new Date(input.checkOutDate)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  return prisma.hospitality_reservation.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      reservationNumber,
      reservationType: 'ROOM',
      guestId: input.guestId,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail,
      roomId: input.roomId,
      partySize: (input.adults || 1) + (input.children || 0),
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      nights,
      specialRequests: input.specialRequests,
      source: input.source || 'Walk-in',
      depositRequired: input.depositRequired || false,
      depositAmount: input.depositAmount || 0,
      status: 'PENDING'
    }),
    include: { guest: true, room: true, venue: true }
  })
}

// ============================================================================
// COMMON RESERVATION OPERATIONS
// ============================================================================

export async function getReservation(tenantId: string, reservationId: string) {
  return prisma.hospitality_reservation.findFirst({
    where: { id: reservationId, tenantId },
    include: { guest: true, table: true, room: true, venue: true, stay: true }
  })
}

export async function getReservationByNumber(tenantId: string, reservationNumber: string) {
  return prisma.hospitality_reservation.findFirst({
    where: { reservationNumber, tenantId },
    include: { guest: true, table: true, room: true, venue: true }
  })
}

export async function listReservations(tenantId: string, options?: ReservationSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.venueId && { venueId: options.venueId }),
    ...(options?.guestId && { guestId: options.guestId }),
    ...(options?.reservationType && { reservationType: options.reservationType }),
    ...(options?.status && { status: options.status }),
    ...(options?.dateFrom && options?.dateTo && {
      OR: [
        { reservationDate: { gte: options.dateFrom, lte: options.dateTo } },
        { checkInDate: { gte: options.dateFrom, lte: options.dateTo } }
      ]
    })
  }

  const [reservations, total] = await Promise.all([
    prisma.hospitality_reservation.findMany({
      where,
      include: { guest: true, table: true, room: true, venue: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.hospitality_reservation.count({ where })
  ])

  return { reservations, total, page, limit }
}

export async function confirmReservation(tenantId: string, reservationId: string) {
  return prisma.hospitality_reservation.update({
    where: { id: reservationId },
    data: { status: 'CONFIRMED', updatedAt: new Date() },
    include: { guest: true, table: true, room: true }
  })
}

export async function cancelReservation(tenantId: string, reservationId: string, reason?: string) {
  return prisma.hospitality_reservation.update({
    where: { id: reservationId },
    data: { 
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    }
  })
}

export async function markNoShow(tenantId: string, reservationId: string) {
  return prisma.hospitality_reservation.update({
    where: { id: reservationId },
    data: { status: 'NO_SHOW', updatedAt: new Date() }
  })
}

export async function markDepositPaid(tenantId: string, reservationId: string) {
  return prisma.hospitality_reservation.update({
    where: { id: reservationId },
    data: { depositPaid: true, updatedAt: new Date() }
  })
}

// ============================================================================
// TODAY'S RESERVATIONS
// ============================================================================

export async function getTodayTableReservations(tenantId: string, venueId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.hospitality_reservation.findMany({
    where: {
      tenantId,
      venueId,
      reservationType: 'TABLE',
      reservationDate: { gte: today, lt: tomorrow },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: { guest: true, table: true },
    orderBy: { reservationTime: 'asc' }
  })
}

export async function getTodayArrivals(tenantId: string, venueId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.hospitality_reservation.findMany({
    where: {
      tenantId,
      venueId,
      reservationType: 'ROOM',
      checkInDate: { gte: today, lt: tomorrow },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: { guest: true, room: true },
    orderBy: { checkInDate: 'asc' }
  })
}

export async function getTodayDepartures(tenantId: string, venueId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.hospitality_stay.findMany({
    where: {
      tenantId,
      venueId,
      checkOutDate: { gte: today, lt: tomorrow },
      status: { in: ['CHECKED_IN', 'IN_HOUSE'] }
    },
    include: { guest: true, room: true },
    orderBy: { checkOutDate: 'asc' }
  })
}

// ============================================================================
// AVAILABILITY CHECK
// ============================================================================

export async function checkTableAvailability(
  tenantId: string,
  venueId: string,
  date: Date,
  time: string,
  partySize: number
) {
  // Get reservations for the time slot (considering duration overlap)
  const reservations = await prisma.hospitality_reservation.findMany({
    where: {
      tenantId,
      venueId,
      reservationType: 'TABLE',
      reservationDate: date,
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    select: { tableId: true, reservationTime: true, duration: true }
  })

  // Get all suitable tables
  const tables = await prisma.hospitality_table.findMany({
    where: {
      tenantId,
      venueId,
      capacity: { gte: partySize },
      status: 'AVAILABLE',
      isActive: true
    }
  })

  // Filter out tables with overlapping reservations
  const requestedTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
  
  const availableTables = tables.filter(table => {
    const tableReservations = reservations.filter((r: any) => r.tableId === table.id)
    
    for (const res of tableReservations) {
      if (!res.reservationTime) continue
      const resTimeMinutes = parseInt(res.reservationTime.split(':')[0]) * 60 + parseInt(res.reservationTime.split(':')[1])
      const resDuration = res.duration || 120
      
      // Check for overlap
      if (requestedTimeMinutes >= resTimeMinutes && requestedTimeMinutes < resTimeMinutes + resDuration) {
        return false
      }
      if (requestedTimeMinutes + 120 > resTimeMinutes && requestedTimeMinutes < resTimeMinutes) {
        return false
      }
    }
    
    return true
  })

  return {
    available: availableTables.length > 0,
    tables: availableTables,
    totalTables: tables.length,
    availableCount: availableTables.length
  }
}

export async function checkRoomAvailability(
  tenantId: string,
  venueId: string,
  checkInDate: Date,
  checkOutDate: Date,
  roomType?: string,
  guests?: number
) {
  // Get rooms with overlapping stays
  const occupiedRoomIds = await prisma.hospitality_stay.findMany({
    where: {
      tenantId,
      venueId,
      status: { in: ['RESERVED', 'CHECKED_IN', 'IN_HOUSE'] },
      OR: [
        { checkInDate: { lte: checkOutDate }, checkOutDate: { gte: checkInDate } }
      ]
    },
    select: { roomId: true }
  })

  const occupiedIds = new Set(occupiedRoomIds.map((r: any) => r.roomId))

  // Get all suitable rooms
  const rooms = await prisma.hospitality_room.findMany({
    where: {
      tenantId,
      venueId,
      ...(roomType && { roomType: roomType as any }),
      ...(guests && { maxOccupancy: { gte: guests } }),
      status: 'AVAILABLE',
      isActive: true
    },
    include: { floor: true }
  })

  const availableRooms = rooms.filter(room => !occupiedIds.has(room.id))

  return {
    available: availableRooms.length > 0,
    rooms: availableRooms,
    totalRooms: rooms.length,
    availableCount: availableRooms.length
  }
}
