/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Hospitality Suite - Nigerian Hotel Full Demo Data Seeder
 * 
 * Creates demo data for a Nigerian hotel:
 * - 10 hospitality_reservation records with various statuses
 * - 8 hospitality_stay records (completed stays)
 * - Links reservations to existing rooms and guests
 * 
 * Run: npx tsx scripts/seed-hospitality-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-hotel'

// =============================================================================
// RESERVATIONS (January 2026 - Nigerian Context)
// =============================================================================

const RESERVATIONS = [
  {
    id: 'res-2026-0001',
    reservationNumber: 'RES-2026-0001',
    guestIndex: 0, // Chief Chukwuemeka Okonkwo
    roomIndex: 8, // Room 301 (Executive)
    status: 'CONFIRMED',
    checkInDate: new Date('2026-01-05'),
    checkOutDate: new Date('2026-01-08'),
    nights: 3,
    partySize: 2,
    source: 'Phone',
    depositRequired: true,
    depositAmount: 127500,
    depositPaid: true,
    specialRequests: 'Airport pickup required. Quiet room preferred.',
    occasion: 'Business',
  },
  {
    id: 'res-2026-0002',
    reservationNumber: 'RES-2026-0002',
    guestIndex: 1, // Mrs. Fatima Ibrahim
    roomIndex: 4, // Room 201 (Deluxe)
    status: 'CHECKED_IN',
    checkInDate: new Date('2026-01-10'),
    checkOutDate: new Date('2026-01-14'),
    nights: 4,
    partySize: 1,
    source: 'Online',
    depositRequired: true,
    depositAmount: 110000,
    depositPaid: true,
    specialRequests: 'Halal meals only.',
    occasion: null,
  },
  {
    id: 'res-2026-0003',
    reservationNumber: 'RES-2026-0003',
    guestIndex: 2, // Mr. Oluwaseun Adeyemi
    roomIndex: 0, // Room 101 (Standard)
    status: 'COMPLETED',
    checkInDate: new Date('2026-01-02'),
    checkOutDate: new Date('2026-01-04'),
    nights: 2,
    partySize: 2,
    source: 'Walk-in',
    depositRequired: false,
    depositAmount: 0,
    depositPaid: false,
    specialRequests: null,
    occasion: 'Anniversary',
  },
  {
    id: 'res-2026-0004',
    reservationNumber: 'RES-2026-0004',
    guestIndex: 3, // Dr. Ngozi Eze
    roomIndex: 11, // Room 401 (Suite)
    status: 'CONFIRMED',
    checkInDate: new Date('2026-01-15'),
    checkOutDate: new Date('2026-01-18'),
    nights: 3,
    partySize: 2,
    source: 'Online',
    depositRequired: true,
    depositAmount: 180000,
    depositPaid: true,
    specialRequests: 'Medical conference attendee. Early check-in if possible.',
    occasion: 'Business',
  },
  {
    id: 'res-2026-0005',
    reservationNumber: 'RES-2026-0005',
    guestIndex: 4, // Alhaji Abdullahi Yusuf
    roomIndex: 13, // Room 501 (Presidential)
    status: 'CONFIRMED',
    checkInDate: new Date('2026-01-20'),
    checkOutDate: new Date('2026-01-25'),
    nights: 5,
    partySize: 4,
    source: 'Phone',
    depositRequired: true,
    depositAmount: 625000,
    depositPaid: true,
    specialRequests: 'VIP guest. Full privacy required. Prayer mat in room.',
    occasion: null,
  },
  {
    id: 'res-2026-0006',
    reservationNumber: 'RES-2026-0006',
    guestIndex: 5, // Mrs. Blessing Okafor
    roomIndex: 5, // Room 202 (Deluxe)
    status: 'CANCELLED',
    checkInDate: new Date('2026-01-08'),
    checkOutDate: new Date('2026-01-10'),
    nights: 2,
    partySize: 1,
    source: 'Online',
    depositRequired: true,
    depositAmount: 55000,
    depositPaid: false,
    specialRequests: null,
    occasion: null,
    cancelledAt: new Date('2026-01-06'),
    cancellationReason: 'Change of travel plans',
  },
  {
    id: 'res-2026-0007',
    reservationNumber: 'RES-2026-0007',
    guestIndex: 6, // Mr. Tunde Bakare
    roomIndex: 1, // Room 102 (Standard)
    status: 'COMPLETED',
    checkInDate: new Date('2026-01-03'),
    checkOutDate: new Date('2026-01-05'),
    nights: 2,
    partySize: 1,
    source: 'OTA',
    depositRequired: true,
    depositAmount: 35000,
    depositPaid: true,
    specialRequests: 'Late check-out requested.',
    occasion: 'Business',
  },
  {
    id: 'res-2026-0008',
    reservationNumber: 'RES-2026-0008',
    guestIndex: 7, // Miss Amaka Nwosu
    roomIndex: 6, // Room 203 (Deluxe)
    status: 'CHECKED_IN',
    checkInDate: new Date('2026-01-12'),
    checkOutDate: new Date('2026-01-15'),
    nights: 3,
    partySize: 2,
    source: 'Phone',
    depositRequired: true,
    depositAmount: 82500,
    depositPaid: true,
    specialRequests: 'Birthday celebration - champagne on arrival.',
    occasion: 'Birthday',
  },
  {
    id: 'res-2026-0009',
    reservationNumber: 'RES-2026-0009',
    guestIndex: 8, // Mr. John Smith (British)
    roomIndex: 9, // Room 302 (Executive)
    status: 'CONFIRMED',
    checkInDate: new Date('2026-01-18'),
    checkOutDate: new Date('2026-01-22'),
    nights: 4,
    partySize: 1,
    source: 'OTA',
    depositRequired: true,
    depositAmount: 170000,
    depositPaid: true,
    specialRequests: 'Business traveler. Requires fast WiFi and work desk.',
    occasion: 'Business',
  },
  {
    id: 'res-2026-0010',
    reservationNumber: 'RES-2026-0010',
    guestIndex: 9, // Ms. Sarah Johnson (American)
    roomIndex: 10, // Room 303 (Executive)
    status: 'CANCELLED',
    checkInDate: new Date('2026-01-25'),
    checkOutDate: new Date('2026-01-28'),
    nights: 3,
    partySize: 2,
    source: 'Online',
    depositRequired: true,
    depositAmount: 127500,
    depositPaid: true,
    specialRequests: 'Connecting rooms if possible.',
    occasion: null,
    cancelledAt: new Date('2026-01-20'),
    cancellationReason: 'Flight cancelled due to weather',
  },
]

// =============================================================================
// STAYS (Completed and In-Progress Stays)
// =============================================================================

const STAYS = [
  {
    id: 'stay-2026-0001',
    stayNumber: 'STY-2026-0001',
    guestIndex: 2, // Mr. Oluwaseun Adeyemi
    roomIndex: 0, // Room 101
    reservationId: 'res-2026-0003',
    checkInDate: new Date('2026-01-02'),
    checkOutDate: new Date('2026-01-04'),
    actualCheckIn: new Date('2026-01-02T14:30:00'),
    actualCheckOut: new Date('2026-01-04T11:45:00'),
    nights: 2,
    guestCount: 2,
    adults: 2,
    children: 0,
    nightlyRate: 35000,
    status: 'CHECKED_OUT',
    notes: 'Smooth stay. Guest celebrated wedding anniversary.',
  },
  {
    id: 'stay-2026-0002',
    stayNumber: 'STY-2026-0002',
    guestIndex: 6, // Mr. Tunde Bakare
    roomIndex: 1, // Room 102
    reservationId: 'res-2026-0007',
    checkInDate: new Date('2026-01-03'),
    checkOutDate: new Date('2026-01-05'),
    actualCheckIn: new Date('2026-01-03T15:00:00'),
    actualCheckOut: new Date('2026-01-05T13:30:00'),
    nights: 2,
    guestCount: 1,
    adults: 1,
    children: 0,
    nightlyRate: 35000,
    status: 'CHECKED_OUT',
    notes: 'Late checkout granted (paid). Business guest - positive feedback.',
  },
  {
    id: 'stay-2026-0003',
    stayNumber: 'STY-2026-0003',
    guestIndex: 1, // Mrs. Fatima Ibrahim
    roomIndex: 4, // Room 201
    reservationId: 'res-2026-0002',
    checkInDate: new Date('2026-01-10'),
    checkOutDate: new Date('2026-01-14'),
    actualCheckIn: new Date('2026-01-10T14:00:00'),
    actualCheckOut: null,
    nights: 4,
    guestCount: 1,
    adults: 1,
    children: 0,
    nightlyRate: 55000,
    status: 'IN_HOUSE',
    notes: 'Currently in-house. Halal meals arranged with kitchen.',
  },
  {
    id: 'stay-2026-0004',
    stayNumber: 'STY-2026-0004',
    guestIndex: 7, // Miss Amaka Nwosu
    roomIndex: 6, // Room 203
    reservationId: 'res-2026-0008',
    checkInDate: new Date('2026-01-12'),
    checkOutDate: new Date('2026-01-15'),
    actualCheckIn: new Date('2026-01-12T14:15:00'),
    actualCheckOut: null,
    nights: 3,
    guestCount: 2,
    adults: 2,
    children: 0,
    nightlyRate: 55000,
    status: 'IN_HOUSE',
    notes: 'Birthday celebration guest. Champagne delivered on arrival.',
  },
  {
    id: 'stay-2026-0005',
    stayNumber: 'STY-2026-0005',
    guestIndex: 0, // Chief Chukwuemeka Okonkwo
    roomIndex: 2, // Room 103 (previous stay)
    reservationId: null,
    checkInDate: new Date('2025-12-28'),
    checkOutDate: new Date('2025-12-31'),
    actualCheckIn: new Date('2025-12-28T13:00:00'),
    actualCheckOut: new Date('2025-12-31T12:00:00'),
    nights: 3,
    guestCount: 2,
    adults: 2,
    children: 0,
    nightlyRate: 35000,
    status: 'CHECKED_OUT',
    notes: 'End of year stay. VIP treatment provided.',
  },
  {
    id: 'stay-2026-0006',
    stayNumber: 'STY-2026-0006',
    guestIndex: 4, // Alhaji Abdullahi Yusuf
    roomIndex: 12, // Room 402 (previous stay)
    reservationId: null,
    checkInDate: new Date('2025-12-20'),
    checkOutDate: new Date('2025-12-25'),
    actualCheckIn: new Date('2025-12-20T14:00:00'),
    actualCheckOut: new Date('2025-12-25T10:00:00'),
    nights: 5,
    guestCount: 3,
    adults: 2,
    children: 1,
    nightlyRate: 120000,
    status: 'CHECKED_OUT',
    notes: 'Family holiday stay. Suite upgrade provided for repeat guest.',
  },
  {
    id: 'stay-2026-0007',
    stayNumber: 'STY-2026-0007',
    guestIndex: 3, // Dr. Ngozi Eze
    roomIndex: 7, // Room 204 (previous stay)
    reservationId: null,
    checkInDate: new Date('2025-12-15'),
    checkOutDate: new Date('2025-12-17'),
    actualCheckIn: new Date('2025-12-15T16:30:00'),
    actualCheckOut: new Date('2025-12-17T11:00:00'),
    nights: 2,
    guestCount: 1,
    adults: 1,
    children: 0,
    nightlyRate: 55000,
    status: 'CHECKED_OUT',
    notes: 'Medical conference visit. Quick business stay.',
  },
  {
    id: 'stay-2026-0008',
    stayNumber: 'STY-2026-0008',
    guestIndex: 8, // Mr. John Smith
    roomIndex: 3, // Room 104 (previous stay)
    reservationId: null,
    checkInDate: new Date('2025-12-10'),
    checkOutDate: new Date('2025-12-14'),
    actualCheckIn: new Date('2025-12-10T15:00:00'),
    actualCheckOut: new Date('2025-12-14T08:30:00'),
    nights: 4,
    guestCount: 1,
    adults: 1,
    children: 0,
    nightlyRate: 35000,
    status: 'CHECKED_OUT',
    notes: 'International guest. Early checkout for flight. Positive review on OTA.',
  },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function getVenueId(tenantId: string) {
  const venue = await prisma.hospitality_venue.findFirst({
    where: { tenantId }
  })
  
  if (!venue) {
    throw new Error('FATAL: No venue found. Run seed-hospitality-demo.ts first.')
  }
  
  console.log(`  Found Venue: ${venue.name} (${venue.id})`)
  return venue.id
}

async function getRooms(tenantId: string) {
  const rooms = await prisma.hospitality_room.findMany({
    where: { tenantId },
    orderBy: { roomNumber: 'asc' }
  })
  
  if (rooms.length === 0) {
    throw new Error('FATAL: No rooms found. Run seed-hospitality-demo.ts first.')
  }
  
  console.log(`  Found ${rooms.length} rooms`)
  return rooms
}

async function getGuests(tenantId: string) {
  const guests = await prisma.hospitality_guest.findMany({
    where: { tenantId },
    orderBy: { guestNumber: 'asc' }
  })
  
  if (guests.length === 0) {
    throw new Error('FATAL: No guests found. Run seed-hospitality-demo.ts first.')
  }
  
  console.log(`  Found ${guests.length} guests`)
  return guests
}

async function seedReservations(
  tenantId: string, 
  venueId: string, 
  rooms: any[], 
  guests: any[]
) {
  console.log('Creating reservations...')
  
  let created = 0
  let skipped = 0
  
  for (const res of RESERVATIONS) {
    const reservationId = `${tenantId}-${res.id}`
    const guest = guests[res.guestIndex]
    const room = rooms[res.roomIndex]
    
    if (!guest || !room) {
      console.log(`  SKIP: Missing guest or room for ${res.reservationNumber}`)
      skipped++
      continue
    }
    
    const existing = await prisma.hospitality_reservation.findFirst({
      where: { reservationNumber: `${tenantId}-${res.reservationNumber}` }
    })
    
    if (!existing) {
      await prisma.hospitality_reservation.create({
        data: {
          id: reservationId,
          tenantId,
          venueId,
          reservationNumber: `${tenantId}-${res.reservationNumber}`,
          reservationType: 'ROOM',
          guestId: guest.id,
          guestName: `${guest.title || ''} ${guest.firstName} ${guest.lastName}`.trim(),
          guestPhone: guest.phone,
          guestEmail: guest.email,
          partySize: res.partySize,
          roomId: room.id,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          nights: res.nights,
          status: res.status as any,
          source: res.source,
          depositRequired: res.depositRequired,
          depositAmount: res.depositAmount,
          depositPaid: res.depositPaid,
          specialRequests: res.specialRequests,
          occasion: res.occasion,
          cancelledAt: (res as any).cancelledAt || null,
          cancellationReason: (res as any).cancellationReason || null,
        }
      })
      console.log(`  Created: ${res.reservationNumber} (${res.status})`)
      created++
    } else {
      console.log(`  Exists: ${res.reservationNumber}`)
      skipped++
    }
  }
  
  return { created, skipped }
}

async function seedStays(
  tenantId: string, 
  venueId: string, 
  rooms: any[], 
  guests: any[]
) {
  console.log('Creating stays...')
  
  let created = 0
  let skipped = 0
  
  for (const stay of STAYS) {
    const stayId = `${tenantId}-${stay.id}`
    const guest = guests[stay.guestIndex]
    const room = rooms[stay.roomIndex]
    
    if (!guest || !room) {
      console.log(`  SKIP: Missing guest or room for ${stay.stayNumber}`)
      skipped++
      continue
    }
    
    const existing = await prisma.hospitality_stay.findFirst({
      where: { stayNumber: `${tenantId}-${stay.stayNumber}` }
    })
    
    if (!existing) {
      const reservationId = stay.reservationId 
        ? `${tenantId}-${stay.reservationId}` 
        : null
      
      await prisma.hospitality_stay.create({
        data: {
          id: stayId,
          tenantId,
          venueId,
          stayNumber: `${tenantId}-${stay.stayNumber}`,
          guestId: guest.id,
          guestCount: stay.guestCount,
          adults: stay.adults,
          children: stay.children,
          roomId: room.id,
          reservationId,
          checkInDate: stay.checkInDate,
          checkOutDate: stay.checkOutDate,
          actualCheckIn: stay.actualCheckIn,
          actualCheckOut: stay.actualCheckOut,
          nights: stay.nights,
          nightlyRate: stay.nightlyRate,
          status: stay.status as any,
          notes: stay.notes,
        }
      })
      console.log(`  Created: ${stay.stayNumber} (${stay.status})`)
      created++
    } else {
      console.log(`  Exists: ${stay.stayNumber}`)
      skipped++
    }
  }
  
  return { created, skipped }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('HOSPITALITY SUITE FULL DEMO SEEDER')
  console.log('Reservations & Stays - Nigerian Hotel')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    const tenant = await verifyDemoTenant()
    const venueId = await getVenueId(tenant.id)
    const rooms = await getRooms(tenant.id)
    const guests = await getGuests(tenant.id)
    
    // Step 2: Seed reservations
    const resStats = await seedReservations(tenant.id, venueId, rooms, guests)
    
    // Step 3: Seed stays
    const stayStats = await seedStays(tenant.id, venueId, rooms, guests)
    
    console.log('='.repeat(60))
    console.log('HOSPITALITY FULL DEMO SEEDING COMPLETE')
    console.log(`  Reservations: ${resStats.created} created, ${resStats.skipped} skipped`)
    console.log(`  Stays: ${stayStats.created} created, ${stayStats.skipped} skipped`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
