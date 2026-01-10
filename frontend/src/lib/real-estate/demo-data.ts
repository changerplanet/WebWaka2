/**
 * REAL ESTATE MANAGEMENT — Demo Data Seeder
 * Phase 7A, S5 Demo Data
 * 
 * Nigerian landlord + tenants, annual rent examples,
 * partial payments & arrears, maintenance tickets.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';

// Demo tenant ID (from existing demo account)
const DEMO_TENANT_ID = 'demo-tenant-001';

// Nigerian Names
const LANDLORDS = [
  { name: 'Chief Adewale Johnson', phone: '08033445566', email: 'chief.johnson@example.com' },
  { name: 'Mrs. Ngozi Okonkwo', phone: '08055667788', email: 'ngozi.okonkwo@example.com' },
  { name: 'Alhaji Musa Ibrahim', phone: '08077889900', email: 'musa.ibrahim@example.com' },
];

const TENANTS = [
  { name: 'Mr. Chukwuma Eze', phone: '08012345678', email: 'chukwuma.eze@example.com' },
  { name: 'Mrs. Funke Williams', phone: '08098765432', email: 'funke.williams@example.com' },
  { name: 'Dr. Amaka Nwachukwu', phone: '08055667788', email: 'amaka.nwachukwu@example.com' },
  { name: 'Elegance Fashion Store', phone: '07011223344', email: 'elegance.fashion@example.com' },
  { name: 'TechHub Solutions Ltd', phone: '09012345678', email: 'info@techhub.ng' },
  { name: 'Mr. Emeka Obi', phone: '08123456789', email: 'emeka.obi@example.com' },
  { name: 'Mrs. Aisha Mohammed', phone: '08045678901', email: 'aisha.mohammed@example.com' },
];

export async function seedRealEstateDemo(tenantId: string, platformInstanceId?: string) {
  console.log('🏠 Seeding Real Estate demo data...');

  // Create Properties
  const properties = await Promise.all([
    prisma.re_property.create({
      data: withPrismaDefaults({
        tenantId,
        platformInstanceId,
        name: 'Harmony Estate Phase 2',
        propertyType: 'RESIDENTIAL',
        status: 'OCCUPIED',
        address: '15 Harmony Close, Off Admiralty Way',
        city: 'Lekki',
        state: 'Lagos',
        lga: 'Eti-Osa',
        landmark: 'Near Lekki Phase 1 Roundabout',
        description: 'Modern residential estate with 24/7 security, swimming pool, and gym facilities.',
        yearBuilt: 2020,
        totalUnits: 12,
        amenities: { pool: true, gym: true, security: '24/7', parking: true },
        ownerName: LANDLORDS[0].name,
        ownerPhone: LANDLORDS[0].phone,
        ownerEmail: LANDLORDS[0].email,
      }),
    }),
    prisma.re_property.create({
      data: withPrismaDefaults({
        tenantId,
        platformInstanceId,
        name: 'Victoria Plaza',
        propertyType: 'COMMERCIAL',
        status: 'OCCUPIED',
        address: '42 Broad Street',
        city: 'Lagos Island',
        state: 'Lagos',
        lga: 'Lagos Island',
        landmark: 'Opposite GTBank Head Office',
        description: 'Premium commercial complex in the heart of Lagos business district.',
        yearBuilt: 2015,
        totalUnits: 8,
        amenities: { elevator: true, security: '24/7', parking: true, generator: true },
        ownerName: LANDLORDS[1].name,
        ownerPhone: LANDLORDS[1].phone,
        ownerEmail: LANDLORDS[1].email,
      }),
    }),
    prisma.re_property.create({
      data: withPrismaDefaults({
        tenantId,
        platformInstanceId,
        name: 'Green Gardens Apartments',
        propertyType: 'RESIDENTIAL',
        status: 'AVAILABLE',
        address: '7 Green Estate Road',
        city: 'Ikeja',
        state: 'Lagos',
        lga: 'Ikeja',
        landmark: 'Behind Computer Village',
        description: 'Affordable residential apartments in serene Ikeja environment.',
        yearBuilt: 2018,
        totalUnits: 6,
        amenities: { security: 'gate', parking: true },
        ownerName: LANDLORDS[2].name,
        ownerPhone: LANDLORDS[2].phone,
        ownerEmail: LANDLORDS[2].email,
      }),
    }),
  ]);

  console.log(`✅ Created ${properties.length} properties`);

  // Create Units for Harmony Estate
  const harmonyUnits = await Promise.all([
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[0].id,
        unitNumber: 'Flat 1A',
        unitType: 'FLAT',
        status: 'OCCUPIED',
        bedrooms: 3,
        bathrooms: 2,
        sizeSqm: 120,
        floor: 1,
        monthlyRent: 250000,
        serviceCharge: 30000,
        cautionDeposit: 500000,
        features: ['AC', 'Fitted Kitchen', 'Balcony'],
      }),
    }),
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[0].id,
        unitNumber: 'Flat 1B',
        unitType: 'FLAT',
        status: 'OCCUPIED',
        bedrooms: 3,
        bathrooms: 2,
        sizeSqm: 120,
        floor: 1,
        monthlyRent: 250000,
        serviceCharge: 30000,
        cautionDeposit: 500000,
        features: ['AC', 'Fitted Kitchen', 'Balcony'],
      }),
    }),
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[0].id,
        unitNumber: 'Flat 2A',
        unitType: 'FLAT',
        status: 'VACANT',
        bedrooms: 2,
        bathrooms: 1,
        sizeSqm: 85,
        floor: 2,
        monthlyRent: 180000,
        serviceCharge: 25000,
        cautionDeposit: 400000,
        features: ['AC', 'Fitted Kitchen'],
      }),
    }),
  ]);

  // Create Units for Victoria Plaza
  const victoriaUnits = await Promise.all([
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[1].id,
        unitNumber: 'Shop A1',
        unitType: 'SHOP',
        status: 'OCCUPIED',
        bathrooms: 1,
        sizeSqm: 50,
        floor: 0,
        monthlyRent: 500000,
        serviceCharge: 50000,
        cautionDeposit: 1000000,
        features: ['Display Window', 'Storage Room'],
      }),
    }),
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[1].id,
        unitNumber: 'Office 201',
        unitType: 'OFFICE',
        status: 'RESERVED',
        bathrooms: 1,
        sizeSqm: 75,
        floor: 2,
        monthlyRent: 350000,
        serviceCharge: 40000,
        cautionDeposit: 700000,
        features: ['AC', 'Reception Area', 'Conference Room Access'],
      }),
    }),
  ]);

  // Create Units for Green Gardens
  const greenUnits = await Promise.all([
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[2].id,
        unitNumber: 'Flat 3A',
        unitType: 'FLAT',
        status: 'OCCUPIED',
        bedrooms: 2,
        bathrooms: 1,
        sizeSqm: 70,
        floor: 3,
        monthlyRent: 150000,
        serviceCharge: 20000,
        cautionDeposit: 300000,
        features: ['AC', 'POP Ceiling'],
      }),
    }),
    prisma.re_unit.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[2].id,
        unitNumber: 'Room 5',
        unitType: 'ROOM',
        status: 'MAINTENANCE',
        bedrooms: 1,
        bathrooms: 1,
        sizeSqm: 25,
        floor: 1,
        monthlyRent: 60000,
        serviceCharge: 10000,
        cautionDeposit: 120000,
        features: ['Shared Kitchen'],
      }),
    }),
  ]);

  const allUnits = [...harmonyUnits, ...victoriaUnits, ...greenUnits];
  console.log(`✅ Created ${allUnits.length} units`);

  // Create Leases (with rent schedules)
  const leases = await Promise.all([
    // Annual lease - Flat 1A
    prisma.re_lease.create({
      data: withPrismaDefaults({
        tenantId,
        unitId: harmonyUnits[0].id,
        leaseNumber: 'LSE-2026-0001',
        tenantName: TENANTS[0].name,
        tenantPhone: TENANTS[0].phone,
        tenantEmail: TENANTS[0].email,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'ACTIVE',
        monthlyRent: 250000,
        serviceCharge: 30000,
        securityDeposit: 500000,
        depositPaid: true,
        rentFrequency: 'ANNUALLY',
        noticePeriodDays: 90,
      }),
    }),
    // Annual lease - Flat 1B
    prisma.re_lease.create({
      data: withPrismaDefaults({
        tenantId,
        unitId: harmonyUnits[1].id,
        leaseNumber: 'LSE-2026-0002',
        tenantName: TENANTS[1].name,
        tenantPhone: TENANTS[1].phone,
        tenantEmail: TENANTS[1].email,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-05-31'),
        status: 'ACTIVE',
        monthlyRent: 250000,
        serviceCharge: 30000,
        securityDeposit: 500000,
        depositPaid: true,
        rentFrequency: 'ANNUALLY',
        noticePeriodDays: 90,
      }),
    }),
    // Commercial lease - Shop A1
    prisma.re_lease.create({
      data: withPrismaDefaults({
        tenantId,
        unitId: victoriaUnits[0].id,
        leaseNumber: 'LSE-2026-0003',
        tenantName: TENANTS[3].name,
        tenantPhone: TENANTS[3].phone,
        tenantEmail: TENANTS[3].email,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2027-02-28'),
        status: 'ACTIVE',
        monthlyRent: 500000,
        serviceCharge: 50000,
        securityDeposit: 1000000,
        depositPaid: true,
        rentFrequency: 'ANNUALLY',
        noticePeriodDays: 180,
      }),
    }),
    // Residential lease - Flat 3A
    prisma.re_lease.create({
      data: withPrismaDefaults({
        tenantId,
        unitId: greenUnits[0].id,
        leaseNumber: 'LSE-2026-0004',
        tenantName: TENANTS[2].name,
        tenantPhone: TENANTS[2].phone,
        tenantEmail: TENANTS[2].email,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2026-02-28'),
        status: 'ACTIVE',
        monthlyRent: 150000,
        serviceCharge: 20000,
        securityDeposit: 300000,
        depositPaid: true,
        rentFrequency: 'ANNUALLY',
        noticePeriodDays: 30,
      }),
    }),
  ]);

  console.log(`✅ Created ${leases.length} leases`);

  // Create Rent Schedules
  const rentSchedules = await Promise.all([
    // Flat 1A - Paid
    prisma.re_rent_schedule.create({
      data: withPrismaDefaults({
        tenantId,
        leaseId: leases[0].id,
        dueDate: new Date('2025-01-01'),
        amount: 3360000, // Annual (250000 + 30000) * 12
        description: 'Annual Rent 2025',
        status: 'PAID',
        paidAmount: 3360000,
        paidDate: new Date('2025-01-03'),
        paymentReference: 'PAY-2025-0001',
        receiptNumber: 'RCP-2025-0001',
      }),
    }),
    // Flat 1B - Partial payment
    prisma.re_rent_schedule.create({
      data: withPrismaDefaults({
        tenantId,
        leaseId: leases[1].id,
        dueDate: new Date('2025-06-01'),
        amount: 3360000,
        description: 'Annual Rent 2025-2026',
        status: 'PARTIAL',
        paidAmount: 2000000,
        paidDate: new Date('2025-06-05'),
        paymentReference: 'PAY-2025-0002',
      }),
    }),
    // Shop A1 - Overdue
    prisma.re_rent_schedule.create({
      data: withPrismaDefaults({
        tenantId,
        leaseId: leases[2].id,
        dueDate: new Date('2025-12-01'),
        amount: 6600000, // Annual (500000 + 50000) * 12
        description: 'Annual Rent 2025-2026',
        status: 'OVERDUE',
        paidAmount: 0,
        lateFee: 660000, // 10%
        lateFeeApplied: true,
      }),
    }),
    // Flat 3A - Pending
    prisma.re_rent_schedule.create({
      data: withPrismaDefaults({
        tenantId,
        leaseId: leases[3].id,
        dueDate: new Date('2026-03-01'),
        amount: 2040000, // Annual (150000 + 20000) * 12
        description: 'Annual Rent 2026-2027',
        status: 'PENDING',
        paidAmount: 0,
      }),
    }),
  ]);

  console.log(`✅ Created ${rentSchedules.length} rent schedules`);

  // Create Maintenance Requests
  const maintenanceRequests = await Promise.all([
    // High priority - in progress
    prisma.re_maintenance_request.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[0].id,
        unitId: harmonyUnits[0].id,
        requestNumber: 'MNT-2026-00001',
        category: 'PLUMBING',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        title: 'Leaking Pipe in Kitchen',
        description: 'Water is leaking from the pipe under the kitchen sink. It started yesterday evening and has caused water damage to the cabinet.',
        requesterName: TENANTS[0].name,
        requesterPhone: TENANTS[0].phone,
        requesterEmail: TENANTS[0].email,
        assignedTo: 'vendor-001',
        assignedName: 'Plumbing Solutions Ltd',
        scheduledDate: new Date('2026-01-07'),
        estimatedCost: 25000,
      }),
    }),
    // Medium priority - open
    prisma.re_maintenance_request.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[1].id,
        unitId: victoriaUnits[0].id,
        requestNumber: 'MNT-2026-00002',
        category: 'ELECTRICAL',
        priority: 'MEDIUM',
        status: 'OPEN',
        title: 'Power Outlet Not Working',
        description: 'The power outlet near the display window is not working. Tried different appliances but none work.',
        requesterName: TENANTS[3].name,
        requesterPhone: TENANTS[3].phone,
        requesterEmail: TENANTS[3].email,
      }),
    }),
    // Emergency - assigned
    prisma.re_maintenance_request.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[2].id,
        unitId: greenUnits[0].id,
        requestNumber: 'MNT-2026-00003',
        category: 'SECURITY',
        priority: 'EMERGENCY',
        status: 'ASSIGNED',
        title: 'Broken Window Lock',
        description: 'The lock on the bedroom window is broken and cannot be secured. This is a security concern.',
        requesterName: TENANTS[2].name,
        requesterPhone: TENANTS[2].phone,
        requesterEmail: TENANTS[2].email,
        assignedTo: 'vendor-002',
        assignedName: 'SecureFix Services',
        scheduledDate: new Date('2026-01-06'),
        estimatedCost: 15000,
      }),
    }),
    // Completed request
    prisma.re_maintenance_request.create({
      data: withPrismaDefaults({
        tenantId,
        propertyId: properties[1].id,
        unitId: victoriaUnits[1].id,
        requestNumber: 'MNT-2025-00045',
        category: 'HVAC',
        priority: 'LOW',
        status: 'COMPLETED',
        title: 'AC Unit Maintenance',
        description: 'Annual AC maintenance and filter replacement.',
        requesterName: 'Building Management',
        requesterPhone: '09012345678',
        assignedTo: 'vendor-003',
        assignedName: 'CoolTech HVAC',
        completedDate: new Date('2025-12-22'),
        estimatedCost: 35000,
        actualCost: 32000,
        resolutionNotes: 'Completed annual maintenance. Replaced filters and cleaned coils. AC functioning optimally.',
      }),
    }),
  ]);

  console.log(`✅ Created ${maintenanceRequests.length} maintenance requests`);

  console.log('🎉 Real Estate demo data seeding complete!');

  return {
    properties,
    units: allUnits,
    leases,
    rentSchedules,
    maintenanceRequests,
  };
}

// Cleanup function
export async function cleanupRealEstateDemo(tenantId: string) {
  console.log('🧹 Cleaning up Real Estate demo data...');

  await prisma.re_rent_schedule.deleteMany({ where: { tenantId } });
  await prisma.re_lease.deleteMany({ where: { tenantId } });
  await prisma.re_maintenance_request.deleteMany({ where: { tenantId } });
  await prisma.re_unit.deleteMany({ where: { tenantId } });
  await prisma.re_property.deleteMany({ where: { tenantId } });

  console.log('✅ Cleanup complete');
}
