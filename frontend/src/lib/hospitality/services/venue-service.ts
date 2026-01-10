/**
 * HOSPITALITY SUITE: Venue Service
 * 
 * Manages venues, floors, tables, and rooms.
 * 
 * @module lib/hospitality/services/venue-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityVenueType, HospitalityRoomType, HospitalityRoomStatus, HospitalityTableStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateVenueInput {
  tenantId: string
  name: string
  code?: string
  type: HospitalityVenueType
  description?: string
  phone?: string
  email?: string
  address?: object
  operatingHours?: object
}

export interface CreateFloorInput {
  tenantId: string
  venueId: string
  name: string
  code?: string
  floorNumber?: number
  description?: string
}

export interface CreateTableInput {
  tenantId: string
  venueId: string
  floorId?: string
  tableNumber: string
  capacity?: number
  minCapacity?: number
  location?: string
}

export interface CreateRoomInput {
  tenantId: string
  venueId: string
  floorId?: string
  roomNumber: string
  roomType?: HospitalityRoomType
  bedCount?: number
  bedType?: string
  maxOccupancy?: number
  maxAdults?: number
  maxChildren?: number
  baseRate?: number
  amenities?: string[]
}

// ============================================================================
// VENUE OPERATIONS
// ============================================================================

export async function createVenue(input: CreateVenueInput) {
  return prisma.hospitality_venue.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address,
      operatingHours: input.operatingHours,
      isActive: true
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function getVenue(tenantId: string, venueId: string) {
  return prisma.hospitality_venue.findFirst({
    where: { id: venueId, tenantId },
    include: {
      floors: { where: { isActive: true }, orderBy: { floorNumber: 'asc' } },
      _count: { select: { tables: true, rooms: true, staff: true } }
    }
  })
}

export async function listVenues(tenantId: string, options?: {
  type?: HospitalityVenueType
  isActive?: boolean
}) {
  return prisma.hospitality_venue.findMany({
    where: {
      tenantId,
      type: options?.type,
      isActive: options?.isActive ?? true
    },
    include: {
      _count: { select: { tables: true, rooms: true, staff: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export async function updateVenue(tenantId: string, venueId: string, data: Partial<CreateVenueInput>) {
  return prisma.hospitality_venue.update({
    where: { id: venueId },
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      description: data.description,
      phone: data.phone,
      email: data.email,
      address: data.address,
      operatingHours: data.operatingHours,
      updatedAt: new Date()
    }
  })
}

// ============================================================================
// FLOOR OPERATIONS
// ============================================================================

export async function createFloor(input: CreateFloorInput) {
  return prisma.hospitality_floor.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      name: input.name,
      code: input.code,
      floorNumber: input.floorNumber,
      description: input.description,
      isActive: true
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function listFloors(tenantId: string, venueId: string) {
  return prisma.hospitality_floor.findMany({
    where: { tenantId, venueId, isActive: true },
    include: {
      _count: { select: { tables: true, rooms: true } }
    },
    orderBy: { floorNumber: 'asc' }
  })
}

// ============================================================================
// TABLE OPERATIONS
// ============================================================================

export async function createTable(input: CreateTableInput) {
  // Update venue table count
  await prisma.hospitality_venue.update({
    where: { id: input.venueId },
    data: { totalTables: { increment: 1 }, totalSeats: { increment: input.capacity || 4 } }
  })

  return prisma.hospitality_table.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      floorId: input.floorId,
      tableNumber: input.tableNumber,
      capacity: input.capacity || 4,
      minCapacity: input.minCapacity || 1,
      location: input.location,
      status: 'AVAILABLE',
      isActive: true
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function getTable(tenantId: string, tableId: string) {
  return prisma.hospitality_table.findFirst({
    where: { id: tableId, tenantId },
    include: { floor: true }
  })
}

export async function listTables(tenantId: string, venueId: string, options?: {
  floorId?: string
  status?: HospitalityTableStatus
  minCapacity?: number
}) {
  return prisma.hospitality_table.findMany({
    where: {
      tenantId,
      venueId,
      floorId: options?.floorId,
      status: options?.status,
      capacity: options?.minCapacity ? { gte: options.minCapacity } : undefined,
      isActive: true
    },
    include: { floor: true },
    orderBy: { tableNumber: 'asc' }
  })
}

export async function updateTableStatus(tenantId: string, tableId: string, status: HospitalityTableStatus) {
  return prisma.hospitality_table.update({
    where: { id: tableId },
    data: { status, updatedAt: new Date() }
  })
}

export async function getAvailableTables(tenantId: string, venueId: string, partySize: number) {
  return prisma.hospitality_table.findMany({
    where: {
      tenantId,
      venueId,
      status: 'AVAILABLE',
      capacity: { gte: partySize },
      isActive: true
    },
    include: { floor: true },
    orderBy: [{ capacity: 'asc' }, { tableNumber: 'asc' }]
  })
}

// ============================================================================
// ROOM OPERATIONS
// ============================================================================

export async function createRoom(input: CreateRoomInput) {
  // Update venue room count
  await prisma.hospitality_venue.update({
    where: { id: input.venueId },
    data: { totalRooms: { increment: 1 } }
  })

  return prisma.hospitality_room.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      venueId: input.venueId,
      floorId: input.floorId,
      roomNumber: input.roomNumber,
      roomType: input.roomType || 'STANDARD',
      bedCount: input.bedCount || 1,
      bedType: input.bedType,
      maxOccupancy: input.maxOccupancy || 2,
      maxAdults: input.maxAdults || 2,
      maxChildren: input.maxChildren || 1,
      baseRate: input.baseRate || 0,
      amenities: input.amenities,
      status: 'AVAILABLE',
      isActive: true
    }) // AUTO-FIX: required by Prisma schema
  })
}

export async function getRoom(tenantId: string, roomId: string) {
  return prisma.hospitality_room.findFirst({
    where: { id: roomId, tenantId },
    include: { floor: true, venue: true }
  })
}

export async function listRooms(tenantId: string, venueId: string, options?: {
  floorId?: string
  roomType?: HospitalityRoomType
  status?: HospitalityRoomStatus
  maxOccupancy?: number
}) {
  return prisma.hospitality_room.findMany({
    where: {
      tenantId,
      venueId,
      floorId: options?.floorId,
      roomType: options?.roomType,
      status: options?.status,
      maxOccupancy: options?.maxOccupancy ? { gte: options.maxOccupancy } : undefined,
      isActive: true
    },
    include: { floor: true },
    orderBy: { roomNumber: 'asc' }
  })
}

export async function updateRoomStatus(tenantId: string, roomId: string, status: HospitalityRoomStatus) {
  return prisma.hospitality_room.update({
    where: { id: roomId },
    data: { status, updatedAt: new Date() }
  })
}

export async function getAvailableRooms(tenantId: string, venueId: string, options?: {
  checkInDate?: Date
  checkOutDate?: Date
  roomType?: HospitalityRoomType
  guests?: number
}) {
  // Get rooms that are available and not reserved for the date range
  const rooms = await prisma.hospitality_room.findMany({
    where: {
      tenantId,
      venueId,
      status: 'AVAILABLE',
      roomType: options?.roomType,
      maxOccupancy: options?.guests ? { gte: options.guests } : undefined,
      isActive: true
    },
    include: { floor: true },
    orderBy: [{ baseRate: 'asc' }, { roomNumber: 'asc' }]
  })

  // If date range provided, filter out rooms with overlapping stays
  if (options?.checkInDate && options?.checkOutDate) {
    const occupiedRoomIds = await prisma.hospitality_stay.findMany({
      where: {
        tenantId,
        venueId,
        status: { in: ['RESERVED', 'CHECKED_IN', 'IN_HOUSE'] },
        OR: [
          { checkInDate: { lte: options.checkOutDate }, checkOutDate: { gte: options.checkInDate } }
        ]
      },
      select: { roomId: true }
    })

    const occupiedIds = new Set(occupiedRoomIds.map((r: any) => r.roomId))
    return rooms.filter(room => !occupiedIds.has(room.id))
  }

  return rooms
}

// ============================================================================
// VENUE STATS
// ============================================================================

export async function getVenueStats(tenantId: string, venueId: string) {
  const [venue, tables, rooms] = await Promise.all([
    prisma.hospitality_venue.findFirst({ where: { id: venueId, tenantId } }),
    prisma.hospitality_table.groupBy({
      by: ['status'],
      where: { tenantId, venueId, isActive: true },
      _count: true
    }),
    prisma.hospitality_room.groupBy({
      by: ['status'],
      where: { tenantId, venueId, isActive: true },
      _count: true
    })
  ])

  const tableStats = Object.fromEntries(tables.map((t: any) => [t.status, t._count]))
  const roomStats = Object.fromEntries(rooms.map((r: any) => [r.status, r._count]))

  const totalRooms = Object.values(roomStats).reduce((a: any, b: any) => a + b, 0)
  const occupiedRooms = (roomStats['OCCUPIED'] || 0)
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

  return {
    venue,
    tables: {
      total: venue?.totalTables || 0,
      available: tableStats['AVAILABLE'] || 0,
      occupied: tableStats['OCCUPIED'] || 0,
      reserved: tableStats['RESERVED'] || 0
    },
    rooms: {
      total: venue?.totalRooms || 0,
      available: roomStats['AVAILABLE'] || 0,
      occupied: roomStats['OCCUPIED'] || 0,
      dirty: roomStats['DIRTY'] || 0,
      maintenance: roomStats['MAINTENANCE'] || 0,
      occupancyRate: Math.round(occupancyRate * 10) / 10
    }
  }
}
