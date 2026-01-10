/**
 * HOSPITALITY SUITE: Demo Data API
 * 
 * POST - Seed demo data for the hospitality suite
 * 
 * @module api/hospitality/demo
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// Nigerian demo data constants
const DEMO_VENUE_NAME = 'PalmView Suites'
const DEMO_VENUE_ADDRESS = '15 Admiralty Way, Lekki Phase 1, Lagos'

// ============================================================================
// POST - Seed demo data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const { action } = body

    if (action !== 'seed') {
      return NextResponse.json({ error: 'Invalid action. Use action: "seed"' }, { status: 400 })
    }

    // Check if already seeded
    const existingVenue = await prisma.hospitality_venue.findFirst({
      where: { tenantId, name: DEMO_VENUE_NAME }
    })

    if (existingVenue) {
      return NextResponse.json({
        success: true,
        message: 'Demo data already exists',
        action: 'exists',
        venueId: existingVenue.id
      })
    }

    // Create config
    const config = await prisma.hospitality_config.upsert({
      where: { tenantId },
      create: {
        tenantId,
        venueName: DEMO_VENUE_NAME,
        venueType: 'HOTEL',
        defaultTableReservationDuration: 120,
        defaultCheckInTime: '14:00',
        defaultCheckOutTime: '12:00',
        allowWalkIns: true,
        allowSplitBills: true,
        defaultServiceChargePercent: 10,
        autoCreateChargeFacts: true
      },
      update: {}
    })

    // Create venue
    const venue = await prisma.hospitality_venue.create({
      data: {
        tenantId,
        name: DEMO_VENUE_NAME,
        code: 'PVS',
        type: 'HOTEL',
        description: 'A boutique hotel and restaurant in the heart of Lekki',
        phone: '+234 812 345 6789',
        email: 'reservations@palmviewsuites.ng',
        address: {
          street: '15 Admiralty Way',
          area: 'Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        },
        operatingHours: {
          monday: { open: '06:00', close: '23:00' },
          tuesday: { open: '06:00', close: '23:00' },
          wednesday: { open: '06:00', close: '23:00' },
          thursday: { open: '06:00', close: '23:00' },
          friday: { open: '06:00', close: '00:00' },
          saturday: { open: '06:00', close: '00:00' },
          sunday: { open: '06:00', close: '23:00' }
        },
        isActive: true
      }
    })

    // Create floors
    const floors = await Promise.all([
      prisma.hospitality_floor.create({
        data: { tenantId, venueId: venue.id, name: 'Ground Floor', code: 'GF', floorNumber: 0, description: 'Restaurant & Reception' }
      }),
      prisma.hospitality_floor.create({
        data: { tenantId, venueId: venue.id, name: 'First Floor', code: '1F', floorNumber: 1, description: 'Standard Rooms' }
      }),
      prisma.hospitality_floor.create({
        data: { tenantId, venueId: venue.id, name: 'Second Floor', code: '2F', floorNumber: 2, description: 'Deluxe & Suites' }
      })
    ])

    // Create tables (restaurant on ground floor)
    const tables = await Promise.all([
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T1', capacity: 2, minCapacity: 1, location: 'Window', status: 'AVAILABLE' } }),
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T2', capacity: 2, minCapacity: 1, location: 'Window', status: 'AVAILABLE' } }),
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T3', capacity: 4, minCapacity: 2, location: 'Center', status: 'OCCUPIED' } }),
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T4', capacity: 4, minCapacity: 2, location: 'Center', status: 'AVAILABLE' } }),
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T5', capacity: 6, minCapacity: 3, location: 'Corner', status: 'RESERVED' } }),
      prisma.hospitality_table.create({ data: { tenantId, venueId: venue.id, floorId: floors[0].id, tableNumber: 'T6', capacity: 8, minCapacity: 4, location: 'VIP Section', status: 'AVAILABLE' } }),
    ])

    // Create rooms
    const rooms = await Promise.all([
      // First floor - Standard rooms
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[1].id, roomNumber: '101', roomType: 'STANDARD', bedCount: 1, bedType: 'Queen', maxOccupancy: 2, baseRate: 35000, status: 'AVAILABLE', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'] } }),
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[1].id, roomNumber: '102', roomType: 'STANDARD', bedCount: 1, bedType: 'Queen', maxOccupancy: 2, baseRate: 35000, status: 'OCCUPIED', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'] } }),
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[1].id, roomNumber: '103', roomType: 'STANDARD', bedCount: 2, bedType: 'Twin', maxOccupancy: 2, baseRate: 35000, status: 'AVAILABLE', amenities: ['WiFi', 'AC', 'TV'] } }),
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[1].id, roomNumber: '104', roomType: 'DELUXE', bedCount: 1, bedType: 'King', maxOccupancy: 2, baseRate: 50000, status: 'DIRTY', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'] } }),
      // Second floor - Deluxe & Suites
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[2].id, roomNumber: '201', roomType: 'DELUXE', bedCount: 1, bedType: 'King', maxOccupancy: 3, baseRate: 55000, status: 'AVAILABLE', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Room Service'] } }),
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[2].id, roomNumber: '202', roomType: 'EXECUTIVE', bedCount: 1, bedType: 'King', maxOccupancy: 3, baseRate: 75000, status: 'OCCUPIED', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Room Service', 'Work Desk'] } }),
      prisma.hospitality_room.create({ data: { tenantId, venueId: venue.id, floorId: floors[2].id, roomNumber: '203', roomType: 'SUITE', bedCount: 2, bedType: 'King + Sofa Bed', maxOccupancy: 4, baseRate: 120000, status: 'AVAILABLE', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Room Service', 'Living Room', 'Kitchenette'] } }),
    ])

    // Update venue counts
    await prisma.hospitality_venue.update({
      where: { id: venue.id },
      data: {
        totalTables: tables.length,
        totalRooms: rooms.length,
        totalSeats: tables.reduce((sum: any, t: any) => sum + t.capacity, 0)
      }
    })

    // Create guests
    const guests = await Promise.all([
      prisma.hospitality_guest.create({ data: { tenantId, guestNumber: 'GST-2026-00001', firstName: 'Chinedu', lastName: 'Okonkwo', title: 'Mr.', phone: '+234 803 456 7890', email: 'chinedu.okonkwo@email.com', nationality: 'Nigerian', isVip: true, vipNotes: 'Regular corporate guest' } }),
      prisma.hospitality_guest.create({ data: { tenantId, guestNumber: 'GST-2026-00002', firstName: 'Aisha', lastName: 'Mohammed', title: 'Mrs.', phone: '+234 806 123 4567', email: 'aisha.m@email.com', nationality: 'Nigerian' } }),
      prisma.hospitality_guest.create({ data: { tenantId, guestNumber: 'GST-2026-00003', firstName: 'Oluwaseun', lastName: 'Adeyemi', title: 'Dr.', phone: '+234 701 234 5678', email: 'dr.adeyemi@hospital.ng', nationality: 'Nigerian', isVip: true } }),
      prisma.hospitality_guest.create({ data: { tenantId, guestNumber: 'GST-2026-00004', firstName: 'Jennifer', lastName: 'Smith', phone: '+1 555 123 4567', email: 'jsmith@company.com', nationality: 'American', preferences: { dietary: 'Vegetarian', room: 'High floor' } } }),
    ])

    // Create staff
    const staff = await Promise.all([
      prisma.hospitality_staff.create({ data: { tenantId, venueId: venue.id, firstName: 'Adebayo', lastName: 'Oluwole', phone: '+234 812 000 0001', role: 'MANAGER', department: 'Operations', employeeId: 'EMP001' } }),
      prisma.hospitality_staff.create({ data: { tenantId, venueId: venue.id, firstName: 'Ngozi', lastName: 'Eze', phone: '+234 812 000 0002', role: 'RECEPTIONIST', department: 'Front Office', employeeId: 'EMP002' } }),
      prisma.hospitality_staff.create({ data: { tenantId, venueId: venue.id, firstName: 'Ibrahim', lastName: 'Musa', phone: '+234 812 000 0003', role: 'WAITER', department: 'F&B', employeeId: 'EMP003' } }),
      prisma.hospitality_staff.create({ data: { tenantId, venueId: venue.id, firstName: 'Grace', lastName: 'Obi', phone: '+234 812 000 0004', role: 'HOUSEKEEPING', department: 'Housekeeping', employeeId: 'EMP004' } }),
      prisma.hospitality_staff.create({ data: { tenantId, venueId: venue.id, firstName: 'Emeka', lastName: 'Nwosu', phone: '+234 812 000 0005', role: 'CHEF', department: 'Kitchen', employeeId: 'EMP005' } }),
    ])

    // Create a stay (guest in room)
    const today = new Date()
    const checkIn = new Date(today)
    checkIn.setDate(checkIn.getDate() - 1)
    const checkOut = new Date(today)
    checkOut.setDate(checkOut.getDate() + 2)

    const stay = await prisma.hospitality_stay.create({
      data: {
        tenantId,
        venueId: venue.id,
        stayNumber: 'STY-20260107-0001',
        guestId: guests[0].id,
        roomId: rooms[1].id, // Room 102 (OCCUPIED)
        checkInDate: checkIn,
        checkOutDate: checkOut,
        actualCheckIn: checkIn,
        nights: 3,
        nightlyRate: 35000,
        guestCount: 1,
        adults: 1,
        children: 0,
        status: 'CHECKED_IN'
      }
    })

    // Create a second stay
    const stay2 = await prisma.hospitality_stay.create({
      data: {
        tenantId,
        venueId: venue.id,
        stayNumber: 'STY-20260107-0002',
        guestId: guests[2].id,
        roomId: rooms[5].id, // Room 202 (OCCUPIED)
        checkInDate: today,
        checkOutDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        actualCheckIn: today,
        nights: 1,
        nightlyRate: 75000,
        guestCount: 1,
        adults: 1,
        children: 0,
        status: 'CHECKED_IN'
      }
    })

    // Create an active order
    const order = await prisma.hospitality_order.create({
      data: {
        tenantId,
        venueId: venue.id,
        orderNumber: 'ORD-20260107-0001',
        orderType: 'DINE_IN',
        tableId: tables[2].id, // T3 (OCCUPIED)
        guestName: 'Walk-in Guest',
        covers: 2,
        serverId: staff[2].id,
        serverName: 'Ibrahim Musa',
        status: 'PREPARING',
        placedAt: new Date()
      }
    })

    // Add order items
    await Promise.all([
      prisma.hospitality_order_item.create({ data: { tenantId, orderId: order.id, itemName: 'Jollof Rice', category: 'Main Course', quantity: 2, unitPrice: 3500, status: 'PREPARING', prepStation: 'Hot Kitchen' } }),
      prisma.hospitality_order_item.create({ data: { tenantId, orderId: order.id, itemName: 'Grilled Chicken', category: 'Main Course', quantity: 2, unitPrice: 4000, status: 'PREPARING', prepStation: 'Grill' } }),
      prisma.hospitality_order_item.create({ data: { tenantId, orderId: order.id, itemName: 'Chapman', category: 'Beverage', quantity: 2, unitPrice: 1500, status: 'READY', prepStation: 'Bar' } }),
    ])

    // Create charge facts for the stay
    await Promise.all([
      prisma.hospitality_charge_fact.create({ data: { tenantId, guestId: guests[0].id, stayId: stay.id, factType: 'ROOM_NIGHT', description: 'Room 102 - Night 1', quantity: 1, unitAmount: 35000, amount: 35000, serviceDate: checkIn, status: 'PENDING' } }),
      prisma.hospitality_charge_fact.create({ data: { tenantId, guestId: guests[0].id, stayId: stay.id, factType: 'MINIBAR', description: 'Minibar - Water, Soft Drinks', quantity: 1, unitAmount: 2500, amount: 2500, serviceDate: today, status: 'PENDING' } }),
    ])

    // Create today's shifts
    const shiftDate = new Date()
    shiftDate.setHours(0, 0, 0, 0)
    await Promise.all([
      prisma.hospitality_shift.create({ data: { tenantId, staffId: staff[1].id, shiftType: 'MORNING', shiftDate, scheduledStart: new Date(shiftDate.getTime() + 6 * 60 * 60 * 1000), scheduledEnd: new Date(shiftDate.getTime() + 14 * 60 * 60 * 1000), actualStart: new Date(shiftDate.getTime() + 6 * 60 * 60 * 1000), status: 'ACTIVE', station: 'Reception' } }),
      prisma.hospitality_shift.create({ data: { tenantId, staffId: staff[2].id, shiftType: 'AFTERNOON', shiftDate, scheduledStart: new Date(shiftDate.getTime() + 11 * 60 * 60 * 1000), scheduledEnd: new Date(shiftDate.getTime() + 19 * 60 * 60 * 1000), actualStart: new Date(shiftDate.getTime() + 11 * 60 * 60 * 1000), status: 'ACTIVE', station: 'Restaurant' } }),
      prisma.hospitality_shift.create({ data: { tenantId, staffId: staff[4].id, shiftType: 'SPLIT', shiftDate, scheduledStart: new Date(shiftDate.getTime() + 10 * 60 * 60 * 1000), scheduledEnd: new Date(shiftDate.getTime() + 22 * 60 * 60 * 1000), actualStart: new Date(shiftDate.getTime() + 10 * 60 * 60 * 1000), status: 'ACTIVE', station: 'Kitchen' } }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      action: 'created',
      data: {
        config: config.id,
        venue: venue.id,
        floors: floors.length,
        tables: tables.length,
        rooms: rooms.length,
        guests: guests.length,
        staff: staff.length,
        stays: 2,
        orders: 1
      }
    })
  } catch (error) {
    console.error('Demo seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
