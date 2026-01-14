/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Hospitality Suite - Nigerian Hotel Demo Data Seeder
 * 
 * Creates demo data for a Nigerian hotel:
 * - Venue and floor configuration
 * - Rooms (Standard, Deluxe, Suite)
 * - Staff (front desk, housekeeping)
 * - Guests with Nigerian names
 * - Reservations and stays
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-hospitality-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-hotel'

// =============================================================================
// VENUE CONFIGURATION
// =============================================================================

const VENUE = {
  id: 'venue-001',
  name: 'PalmView Suites Lagos',
  type: 'HOTEL',
  address: '25 Ozumba Mbadiwe Avenue, Victoria Island, Lagos',
  phone: '01-4567890',
  email: 'reservations@palmviewsuites.ng',
  starRating: 4,
  checkInTime: '14:00',
  checkOutTime: '11:00',
}

const FLOORS = [
  { id: 'floor-g', name: 'Ground Floor', level: 0, roomCount: 0 },
  { id: 'floor-1', name: 'First Floor', level: 1, roomCount: 12 },
  { id: 'floor-2', name: 'Second Floor', level: 2, roomCount: 12 },
  { id: 'floor-3', name: 'Third Floor', level: 3, roomCount: 10 },
  { id: 'floor-4', name: 'Fourth Floor (Executive)', level: 4, roomCount: 8 },
  { id: 'floor-5', name: 'Penthouse Level', level: 5, roomCount: 4 },
]

// =============================================================================
// ROOMS (Nigerian Hotel Standard with NGN Pricing)
// =============================================================================

const ROOMS = [
  // First Floor - Standard Rooms
  { id: 'room-101', number: '101', floorId: 'floor-1', type: 'STANDARD', name: 'Standard Room', bedType: 'DOUBLE', capacity: 2, rate: 35000, status: 'AVAILABLE' },
  { id: 'room-102', number: '102', floorId: 'floor-1', type: 'STANDARD', name: 'Standard Room', bedType: 'TWIN', capacity: 2, rate: 35000, status: 'OCCUPIED' },
  { id: 'room-103', number: '103', floorId: 'floor-1', type: 'STANDARD', name: 'Standard Room', bedType: 'DOUBLE', capacity: 2, rate: 35000, status: 'AVAILABLE' },
  { id: 'room-104', number: '104', floorId: 'floor-1', type: 'STANDARD', name: 'Standard Room', bedType: 'DOUBLE', capacity: 2, rate: 35000, status: 'CLEANING' },
  { id: 'room-105', number: '105', floorId: 'floor-1', type: 'STANDARD', name: 'Standard Room', bedType: 'TWIN', capacity: 2, rate: 35000, status: 'AVAILABLE' },
  
  // Second Floor - Deluxe Rooms
  { id: 'room-201', number: '201', floorId: 'floor-2', type: 'DELUXE', name: 'Deluxe Room', bedType: 'KING', capacity: 2, rate: 55000, status: 'AVAILABLE' },
  { id: 'room-202', number: '202', floorId: 'floor-2', type: 'DELUXE', name: 'Deluxe Room', bedType: 'KING', capacity: 2, rate: 55000, status: 'OCCUPIED' },
  { id: 'room-203', number: '203', floorId: 'floor-2', type: 'DELUXE', name: 'Deluxe Room', bedType: 'KING', capacity: 2, rate: 55000, status: 'RESERVED' },
  { id: 'room-204', number: '204', floorId: 'floor-2', type: 'DELUXE', name: 'Deluxe Family', bedType: 'KING_TWIN', capacity: 4, rate: 75000, status: 'AVAILABLE' },
  
  // Third Floor - Executive Rooms
  { id: 'room-301', number: '301', floorId: 'floor-3', type: 'EXECUTIVE', name: 'Executive Suite', bedType: 'KING', capacity: 2, rate: 95000, status: 'AVAILABLE' },
  { id: 'room-302', number: '302', floorId: 'floor-3', type: 'EXECUTIVE', name: 'Executive Suite', bedType: 'KING', capacity: 2, rate: 95000, status: 'OCCUPIED' },
  { id: 'room-303', number: '303', floorId: 'floor-3', type: 'EXECUTIVE', name: 'Executive Suite', bedType: 'KING', capacity: 2, rate: 95000, status: 'MAINTENANCE' },
  
  // Fourth Floor - Premium Suites
  { id: 'room-401', number: '401', floorId: 'floor-4', type: 'SUITE', name: 'Premium Suite', bedType: 'KING', capacity: 3, rate: 150000, status: 'AVAILABLE' },
  { id: 'room-402', number: '402', floorId: 'floor-4', type: 'SUITE', name: 'Premium Suite', bedType: 'KING', capacity: 3, rate: 150000, status: 'AVAILABLE' },
  
  // Fifth Floor - Penthouse
  { id: 'room-501', number: '501', floorId: 'floor-5', type: 'PENTHOUSE', name: 'Presidential Suite', bedType: 'KING', capacity: 4, rate: 350000, status: 'AVAILABLE' },
  { id: 'room-502', number: '502', floorId: 'floor-5', type: 'PENTHOUSE', name: 'Royal Suite', bedType: 'KING', capacity: 4, rate: 350000, status: 'RESERVED' },
]

// =============================================================================
// STAFF (Nigerian Names)
// =============================================================================

const STAFF = [
  { id: 'staff-001', name: 'Mr. Emeka Okonkwo', role: 'General Manager', email: 'gm@palmviewsuites.ng', phone: '08011112222', department: 'Management' },
  { id: 'staff-002', name: 'Mrs. Adaeze Eze', role: 'Front Desk Manager', email: 'frontdesk@palmviewsuites.ng', phone: '08022223333', department: 'Front Office' },
  { id: 'staff-003', name: 'Mr. Oluwaseun Adeyemi', role: 'Receptionist', email: 'seun.a@palmviewsuites.ng', phone: '08033334444', department: 'Front Office' },
  { id: 'staff-004', name: 'Miss Blessing Nwosu', role: 'Receptionist', email: 'blessing.n@palmviewsuites.ng', phone: '08044445555', department: 'Front Office' },
  { id: 'staff-005', name: 'Mrs. Fatima Ibrahim', role: 'Housekeeping Supervisor', email: 'housekeeping@palmviewsuites.ng', phone: '08055556666', department: 'Housekeeping' },
  { id: 'staff-006', name: 'Mr. Johnson Okafor', role: 'Housekeeper', email: 'johnson.o@palmviewsuites.ng', phone: '08066667777', department: 'Housekeeping' },
  { id: 'staff-007', name: 'Mrs. Ngozi Uzoma', role: 'Housekeeper', email: 'ngozi.u@palmviewsuites.ng', phone: '08077778888', department: 'Housekeeping' },
  { id: 'staff-008', name: 'Mr. Abdullahi Bello', role: 'Concierge', email: 'concierge@palmviewsuites.ng', phone: '08088889999', department: 'Guest Services' },
  { id: 'staff-009', name: 'Mr. Tunde Bakare', role: 'Night Manager', email: 'night@palmviewsuites.ng', phone: '08099990000', department: 'Front Office' },
  { id: 'staff-010', name: 'Chef Chidinma Obi', role: 'Executive Chef', email: 'chef@palmviewsuites.ng', phone: '08010101010', department: 'F&B' },
]

// =============================================================================
// GUESTS (Nigerian and International)
// =============================================================================

const GUESTS = [
  { id: 'guest-001', firstName: 'Chukwuemeka', lastName: 'Nnamdi', email: 'emeka.nnamdi@company.ng', phone: '08111222333', nationality: 'Nigerian', idType: 'NIN', idNumber: '12345678901' },
  { id: 'guest-002', firstName: 'Fatima', lastName: 'Abubakar', email: 'fatima.abu@email.com', phone: '08222333444', nationality: 'Nigerian', idType: 'DRIVERS_LICENSE', idNumber: 'LAG-2020-12345' },
  { id: 'guest-003', firstName: 'James', lastName: 'Chen', email: 'james.chen@corp.cn', phone: '+8613912345678', nationality: 'Chinese', idType: 'PASSPORT', idNumber: 'E12345678' },
  { id: 'guest-004', firstName: 'Oluwaseun', lastName: 'Adeyemi', email: 'seun.adeyemi@business.ng', phone: '08333444555', nationality: 'Nigerian', idType: 'NIN', idNumber: '98765432101' },
  { id: 'guest-005', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@embassy.gov', phone: '+12025551234', nationality: 'American', idType: 'PASSPORT', idNumber: '123456789' },
  { id: 'guest-006', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@corp.ng', phone: '08444555666', nationality: 'Nigerian', idType: 'NIN', idNumber: '11122233344' },
  { id: 'guest-007', firstName: 'Abdullahi', lastName: 'Mohammed', email: 'abdullahi.m@oil.ng', phone: '08555666777', nationality: 'Nigerian', idType: 'NIN', idNumber: '55566677788' },
  { id: 'guest-008', firstName: 'David', lastName: 'Okonkwo', email: 'david.ok@tech.ng', phone: '08666777888', nationality: 'Nigerian', idType: 'INTL_PASSPORT', idNumber: 'A12345678' },
  { id: 'guest-009', firstName: 'Blessing', lastName: 'Ndu', email: 'blessing.ndu@hotel.ng', phone: '08777888999', nationality: 'Nigerian', idType: 'VOTERS_CARD', idNumber: 'FC123456789' },
  { id: 'guest-010', firstName: 'Ahmed', lastName: 'Yusuf', email: 'ahmed.y@trade.ng', phone: '08888999000', nationality: 'Nigerian', idType: 'NIN', idNumber: '99988877766' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoPartner() {
  console.log('Verifying Demo Partner exists...')
  
  const partner = await prisma.partner.findUnique({
    where: { id: DEMO_PARTNER_ID }
  })
  
  if (!partner) {
    throw new Error(`FATAL: Demo Partner not found with ID: ${DEMO_PARTNER_ID}`)
  }
  
  console.log(`  Found Demo Partner: ${partner.name}`)
  return partner
}

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { 
      slug: DEMO_TENANT_SLUG,
      partnerId: DEMO_PARTNER_ID 
    }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  if (tenant.partnerId !== DEMO_PARTNER_ID) {
    throw new Error(`FATAL: Demo Tenant does not belong to Demo Partner`)
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
        checkInTime: VENUE.checkInTime,
        checkOutTime: VENUE.checkOutTime,
        currency: 'NGN',
        taxRate: 7.5,
        serviceChargeRate: 10,
        depositPercent: 50,
        cancellationPolicy: '24 hours before check-in for full refund',
      }
    })
    console.log('  Created hospitality configuration')
  }
}

async function seedVenue(tenantId: string) {
  console.log('Creating venue...')
  
  const existing = await prisma.hospitality_venue.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.hospitality_venue.create({
      data: {
        id: `${tenantId}-${VENUE.id}`,
        tenantId,
        name: VENUE.name,
        type: VENUE.type,
        address: VENUE.address,
        phone: VENUE.phone,
        email: VENUE.email,
        starRating: VENUE.starRating,
        isActive: true,
      }
    })
    console.log(`  Created venue: ${VENUE.name}`)
  }
}

async function seedFloors(tenantId: string) {
  console.log('Creating floors...')
  
  for (const floor of FLOORS) {
    const existing = await prisma.hospitality_floor.findFirst({
      where: { tenantId, name: floor.name }
    })
    
    if (!existing) {
      await prisma.hospitality_floor.create({
        data: {
          id: `${tenantId}-${floor.id}`,
          tenantId,
          venueId: `${tenantId}-${VENUE.id}`,
          name: floor.name,
          level: floor.level,
          isActive: true,
        }
      })
      console.log(`  Created floor: ${floor.name}`)
    }
  }
}

async function seedRooms(tenantId: string) {
  console.log('Creating rooms...')
  
  for (const room of ROOMS) {
    const existing = await prisma.hospitality_room.findFirst({
      where: { tenantId, roomNumber: room.number }
    })
    
    if (!existing) {
      await prisma.hospitality_room.create({
        data: {
          id: `${tenantId}-${room.id}`,
          tenantId,
          venueId: `${tenantId}-${VENUE.id}`,
          floorId: `${tenantId}-${room.floorId}`,
          roomNumber: room.number,
          roomType: room.type,
          name: room.name,
          bedType: room.bedType,
          maxOccupancy: room.capacity,
          baseRate: room.rate,
          currency: 'NGN',
          status: room.status,
          isActive: true,
        }
      })
      console.log(`  Created room: ${room.number} (${room.type}) - ₦${room.rate.toLocaleString()}/night`)
    }
  }
}

async function seedStaff(tenantId: string) {
  console.log('Creating staff...')
  
  for (const staff of STAFF) {
    const existing = await prisma.hospitality_staff.findFirst({
      where: { tenantId, email: staff.email }
    })
    
    if (!existing) {
      await prisma.hospitality_staff.create({
        data: {
          id: `${tenantId}-${staff.id}`,
          tenantId,
          name: staff.name,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          department: staff.department,
          isActive: true,
        }
      })
      console.log(`  Created staff: ${staff.name} (${staff.role})`)
    }
  }
}

async function seedGuests(tenantId: string) {
  console.log('Creating guests...')
  
  for (const guest of GUESTS) {
    const existing = await prisma.hospitality_guest.findFirst({
      where: { tenantId, email: guest.email }
    })
    
    if (!existing) {
      await prisma.hospitality_guest.create({
        data: {
          id: `${tenantId}-${guest.id}`,
          tenantId,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          nationality: guest.nationality,
          idType: guest.idType,
          idNumber: guest.idNumber,
          isVip: false,
          totalStays: 0,
        }
      })
      console.log(`  Created guest: ${guest.firstName} ${guest.lastName}`)
    }
  }
}

async function seedReservations(tenantId: string) {
  console.log('Creating reservations...')
  
  const today = new Date()
  const reservations = [
    { guestId: 'guest-001', roomId: 'room-102', checkIn: new Date(today.getTime() - 86400000 * 2), checkOut: new Date(today.getTime() + 86400000 * 3), status: 'CHECKED_IN', amount: 175000 },
    { guestId: 'guest-002', roomId: 'room-202', checkIn: new Date(today.getTime() - 86400000), checkOut: new Date(today.getTime() + 86400000 * 2), status: 'CHECKED_IN', amount: 165000 },
    { guestId: 'guest-003', roomId: 'room-203', checkIn: new Date(today.getTime() + 86400000), checkOut: new Date(today.getTime() + 86400000 * 4), status: 'CONFIRMED', amount: 165000 },
    { guestId: 'guest-004', roomId: 'room-302', checkIn: new Date(today.getTime() - 86400000 * 3), checkOut: new Date(today.getTime() + 86400000), status: 'CHECKED_IN', amount: 380000 },
    { guestId: 'guest-005', roomId: 'room-502', checkIn: new Date(today.getTime() + 86400000 * 5), checkOut: new Date(today.getTime() + 86400000 * 8), status: 'CONFIRMED', amount: 1050000 },
    { guestId: 'guest-006', roomId: 'room-101', checkIn: new Date(today.getTime() - 86400000 * 10), checkOut: new Date(today.getTime() - 86400000 * 7), status: 'CHECKED_OUT', amount: 105000 },
  ]
  
  for (let i = 0; i < reservations.length; i++) {
    const res = reservations[i]
    await prisma.hospitality_reservation.create({
      data: {
        id: `${tenantId}-res-${i + 1}`,
        tenantId,
        guestId: `${tenantId}-${res.guestId}`,
        roomId: `${tenantId}-${res.roomId}`,
        checkInDate: res.checkIn,
        checkOutDate: res.checkOut,
        status: res.status,
        totalAmount: res.amount,
        currency: 'NGN',
        adults: 2,
        children: 0,
        source: 'DIRECT',
        confirmationNumber: `PVS-${Date.now()}-${i + 1}`,
      }
    })
    console.log(`  Created reservation: ${res.status} (₦${res.amount.toLocaleString()})`)
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
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    await seedVenue(tenant.id)
    await seedFloors(tenant.id)
    
    // Step 3: Seed operational data
    await seedRooms(tenant.id)
    await seedStaff(tenant.id)
    await seedGuests(tenant.id)
    
    // Step 4: Seed transaction data
    await seedReservations(tenant.id)
    
    console.log('='.repeat(60))
    console.log('HOSPITALITY DEMO SEEDING COMPLETE')
    console.log(`  Venue: 1`)
    console.log(`  Floors: ${FLOORS.length}`)
    console.log(`  Rooms: ${ROOMS.length}`)
    console.log(`  Staff: ${STAFF.length}`)
    console.log(`  Guests: ${GUESTS.length}`)
    console.log(`  Reservations: 6`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
