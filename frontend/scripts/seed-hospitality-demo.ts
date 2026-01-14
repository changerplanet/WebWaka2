/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Hospitality Suite - Nigerian Hotel Demo Data Seeder
 * 
 * Creates demo data for a Nigerian hotel:
 * - Hospitality configuration
 * - Venue
 * - Rooms
 * - Guests with Nigerian names
 * - Reservations
 * 
 * Run: npx tsx scripts/seed-hospitality-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-hotel'

// =============================================================================
// VENUE
// =============================================================================

const VENUE = {
  id: 'venue-001',
  name: 'PalmView Suites Lagos',
  code: 'PVS-LAG',
  type: 'HOTEL',
  description: 'Premier boutique hotel in Victoria Island, Lagos',
  phone: '01-2345678',
  email: 'reservations@palmviewsuites.ng',
  address: {
    street: '25 Adeola Odeku Street',
    city: 'Victoria Island',
    state: 'Lagos',
    lga: 'Eti-Osa',
    country: 'Nigeria'
  },
  totalRooms: 20,
}

// =============================================================================
// ROOMS
// =============================================================================

const ROOMS = [
  { id: 'room-101', roomNumber: '101', roomType: 'STANDARD', bedCount: 1, bedType: 'Queen', maxOccupancy: 2, baseRate: 35000 },
  { id: 'room-102', roomNumber: '102', roomType: 'STANDARD', bedCount: 1, bedType: 'Queen', maxOccupancy: 2, baseRate: 35000 },
  { id: 'room-103', roomNumber: '103', roomType: 'STANDARD', bedCount: 2, bedType: 'Twin', maxOccupancy: 2, baseRate: 35000 },
  { id: 'room-104', roomNumber: '104', roomType: 'STANDARD', bedCount: 2, bedType: 'Twin', maxOccupancy: 2, baseRate: 35000 },
  { id: 'room-201', roomNumber: '201', roomType: 'DELUXE', bedCount: 1, bedType: 'King', maxOccupancy: 2, baseRate: 55000 },
  { id: 'room-202', roomNumber: '202', roomType: 'DELUXE', bedCount: 1, bedType: 'King', maxOccupancy: 2, baseRate: 55000 },
  { id: 'room-203', roomNumber: '203', roomType: 'DELUXE', bedCount: 1, bedType: 'King', maxOccupancy: 3, baseRate: 55000 },
  { id: 'room-204', roomNumber: '204', roomType: 'DELUXE', bedCount: 2, bedType: 'Twin', maxOccupancy: 4, baseRate: 55000 },
  { id: 'room-301', roomNumber: '301', roomType: 'EXECUTIVE', bedCount: 1, bedType: 'King', maxOccupancy: 2, baseRate: 85000 },
  { id: 'room-302', roomNumber: '302', roomType: 'EXECUTIVE', bedCount: 1, bedType: 'King', maxOccupancy: 2, baseRate: 85000 },
  { id: 'room-303', roomNumber: '303', roomType: 'EXECUTIVE', bedCount: 1, bedType: 'King', maxOccupancy: 3, baseRate: 85000 },
  { id: 'room-401', roomNumber: '401', roomType: 'SUITE', bedCount: 2, bedType: 'King + Sofa', maxOccupancy: 4, baseRate: 120000 },
  { id: 'room-402', roomNumber: '402', roomType: 'SUITE', bedCount: 2, bedType: 'King + Sofa', maxOccupancy: 4, baseRate: 120000 },
  { id: 'room-501', roomNumber: '501', roomType: 'PRESIDENTIAL', bedCount: 2, bedType: 'King + Living', maxOccupancy: 4, baseRate: 250000 },
]

// =============================================================================
// GUESTS (Nigerian Demographics)
// =============================================================================

const GUESTS = [
  { id: 'guest-001', guestNumber: 'GST-001', firstName: 'Chukwuemeka', lastName: 'Okonkwo', title: 'Chief', phone: '08111222333', email: 'chief.okonkwo@email.com', nationality: 'Nigerian' },
  { id: 'guest-002', guestNumber: 'GST-002', firstName: 'Fatima', lastName: 'Ibrahim', title: 'Mrs.', phone: '08222333444', email: 'fatima.ibrahim@email.com', nationality: 'Nigerian' },
  { id: 'guest-003', guestNumber: 'GST-003', firstName: 'Oluwaseun', lastName: 'Adeyemi', title: 'Mr.', phone: '08333444555', email: 'seun.adeyemi@email.com', nationality: 'Nigerian' },
  { id: 'guest-004', guestNumber: 'GST-004', firstName: 'Ngozi', lastName: 'Eze', title: 'Dr.', phone: '08444555666', email: 'dr.ngozi@email.com', nationality: 'Nigerian' },
  { id: 'guest-005', guestNumber: 'GST-005', firstName: 'Abdullahi', lastName: 'Yusuf', title: 'Alhaji', phone: '08555666777', email: 'alhaji.yusuf@email.com', nationality: 'Nigerian' },
  { id: 'guest-006', guestNumber: 'GST-006', firstName: 'Blessing', lastName: 'Okafor', title: 'Mrs.', phone: '08666777888', email: 'blessing.okafor@email.com', nationality: 'Nigerian' },
  { id: 'guest-007', guestNumber: 'GST-007', firstName: 'Tunde', lastName: 'Bakare', title: 'Mr.', phone: '08777888999', email: 'tunde.bakare@email.com', nationality: 'Nigerian' },
  { id: 'guest-008', guestNumber: 'GST-008', firstName: 'Amaka', lastName: 'Nwosu', title: 'Miss', phone: '08888999000', email: 'amaka.nwosu@email.com', nationality: 'Nigerian' },
  { id: 'guest-009', guestNumber: 'GST-009', firstName: 'John', lastName: 'Smith', title: 'Mr.', phone: '+447123456789', email: 'john.smith@email.co.uk', nationality: 'British' },
  { id: 'guest-010', guestNumber: 'GST-010', firstName: 'Sarah', lastName: 'Johnson', title: 'Ms.', phone: '+12025551234', email: 'sarah.johnson@email.com', nationality: 'American' },
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

async function seedConfig(tenantId: string) {
  console.log('Creating hospitality configuration...')
  
  const existing = await prisma.hospitality_config.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.hospitality_config.create({
      data: {
        tenantId,
        venueName: VENUE.name,
        venueType: 'HOTEL',
        venueCode: VENUE.code,
        guestIdPrefix: 'GST',
        guestIdNextSeq: 11,
        reservationPrefix: 'RES',
        reservationNextSeq: 1,
        stayNumberPrefix: 'STY',
        stayNumberNextSeq: 1,
        defaultCheckInTime: '14:00',
        defaultCheckOutTime: '12:00',
        allowWalkIns: true,
        allowOnlineBooking: true,
        requireDeposit: true,
        depositPercent: 50,
        defaultServiceChargePercent: 10,
        autoAddServiceCharge: true,
        lateCheckoutFee: 5000,
        earlyCheckinFee: 5000,
        cancellationHours: 24,
        isActive: true,
      }
    })
    console.log('  Created hospitality configuration')
  } else {
    console.log('  Config exists')
  }
}

async function seedVenue(tenantId: string) {
  console.log('Creating venue...')
  
  const venueId = `${tenantId}-${VENUE.id}`
  
  const existing = await prisma.hospitality_venue.findFirst({
    where: { id: venueId }
  })
  
  if (!existing) {
    await prisma.hospitality_venue.create({
      data: {
        id: venueId,
        tenantId,
        name: VENUE.name,
        code: VENUE.code,
        type: VENUE.type as any,
        description: VENUE.description,
        phone: VENUE.phone,
        email: VENUE.email,
        address: VENUE.address,
        totalRooms: VENUE.totalRooms,
        isActive: true,
      }
    })
    console.log(`  Created venue: ${VENUE.name}`)
  } else {
    console.log(`  Venue exists: ${VENUE.name}`)
  }
  
  return venueId
}

async function seedRooms(tenantId: string, venueId: string) {
  console.log('Creating rooms...')
  
  for (const room of ROOMS) {
    const roomId = `${tenantId}-${room.id}`
    
    const existing = await prisma.hospitality_room.findFirst({
      where: { id: roomId }
    })
    
    if (!existing) {
      await prisma.hospitality_room.create({
        data: {
          id: roomId,
          tenantId,
          venueId,
          roomNumber: room.roomNumber,
          roomType: room.roomType as any,
          bedCount: room.bedCount,
          bedType: room.bedType,
          maxOccupancy: room.maxOccupancy,
          maxAdults: room.maxOccupancy,
          maxChildren: 1,
          baseRate: room.baseRate,
          amenities: ['AC', 'TV', 'WiFi', 'Minibar'],
          status: 'AVAILABLE',
          isActive: true,
        }
      })
      console.log(`  Created room: ${room.roomNumber} (${room.roomType})`)
    } else {
      console.log(`  Room exists: ${room.roomNumber}`)
    }
  }
}

async function seedGuests(tenantId: string) {
  console.log('Creating guests...')
  
  for (const guest of GUESTS) {
    const guestId = `${tenantId}-${guest.id}`
    
    const existing = await prisma.hospitality_guest.findFirst({
      where: { guestNumber: guest.guestNumber }
    })
    
    if (!existing) {
      await prisma.hospitality_guest.create({
        data: {
          id: guestId,
          tenantId,
          guestNumber: `${tenantId}-${guest.guestNumber}`,
          firstName: guest.firstName,
          lastName: guest.lastName,
          title: guest.title,
          phone: guest.phone,
          email: guest.email,
          nationality: guest.nationality,
        }
      })
      console.log(`  Created guest: ${guest.title} ${guest.firstName} ${guest.lastName}`)
    } else {
      console.log(`  Guest exists: ${guest.firstName} ${guest.lastName}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('HOSPITALITY SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Hotel')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    const venueId = await seedVenue(tenant.id)
    
    // Step 3: Seed operational data
    await seedRooms(tenant.id, venueId)
    await seedGuests(tenant.id)
    
    console.log('='.repeat(60))
    console.log('HOSPITALITY DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Venue: 1`)
    console.log(`  Rooms: ${ROOMS.length}`)
    console.log(`  Guests: ${GUESTS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
