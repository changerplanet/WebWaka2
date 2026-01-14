/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Real Estate Suite - Nigerian Property Management Demo Data Seeder
 * 
 * Creates demo data for a Nigerian property management company:
 * - Properties (residential/commercial)
 * - Units
 * - Leases
 * - Maintenance requests
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-real-estate-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-real-estate'

// =============================================================================
// PROPERTIES (Lagos Real Estate)
// =============================================================================

const PROPERTIES = [
  { 
    id: 'prop-001', 
    name: 'Lekki Phase 1 Apartments', 
    type: 'RESIDENTIAL', 
    address: '45 Admiralty Way, Lekki Phase 1, Lagos',
    lga: 'Eti-Osa',
    totalUnits: 24,
    yearBuilt: 2020,
    amenities: ['Swimming Pool', '24hr Security', 'Gym', 'Generator', 'Water Treatment'],
  },
  { 
    id: 'prop-002', 
    name: 'Victoria Island Office Complex', 
    type: 'COMMERCIAL', 
    address: '12 Akin Adesola Street, Victoria Island, Lagos',
    lga: 'Eti-Osa',
    totalUnits: 30,
    yearBuilt: 2018,
    amenities: ['Elevator', '24hr Security', 'Central AC', 'Generator', 'Parking'],
  },
  { 
    id: 'prop-003', 
    name: 'Ikeja GRA Villas', 
    type: 'RESIDENTIAL', 
    address: '8 Oduduwa Crescent, Ikeja GRA, Lagos',
    lga: 'Ikeja',
    totalUnits: 6,
    yearBuilt: 2015,
    amenities: ['Garden', '24hr Security', 'Generator', 'Boys Quarters'],
  },
  { 
    id: 'prop-004', 
    name: 'Ajah Terrace Homes', 
    type: 'RESIDENTIAL', 
    address: '23 Abraham Adesanya Estate, Ajah, Lagos',
    lga: 'Eti-Osa',
    totalUnits: 16,
    yearBuilt: 2022,
    amenities: ['Estate Security', 'Street Lights', 'Paved Roads', 'Drainage'],
  },
  { 
    id: 'prop-005', 
    name: 'Ikoyi Luxury Flats', 
    type: 'RESIDENTIAL', 
    address: '5 Bourdillon Road, Ikoyi, Lagos',
    lga: 'Lagos Island',
    totalUnits: 12,
    yearBuilt: 2019,
    amenities: ['Swimming Pool', 'Gym', 'Concierge', 'Underground Parking', 'Smart Home'],
  },
]

// =============================================================================
// UNITS (Sample Units per Property)
// =============================================================================

const UNITS = [
  // Lekki Phase 1 Apartments
  { id: 'unit-001', propertyId: 'prop-001', unitNumber: 'A101', type: '3 Bedroom Flat', size: 150, rent: 4500000, status: 'OCCUPIED' },
  { id: 'unit-002', propertyId: 'prop-001', unitNumber: 'A102', type: '3 Bedroom Flat', size: 150, rent: 4500000, status: 'OCCUPIED' },
  { id: 'unit-003', propertyId: 'prop-001', unitNumber: 'A201', type: '2 Bedroom Flat', size: 100, rent: 3000000, status: 'VACANT' },
  { id: 'unit-004', propertyId: 'prop-001', unitNumber: 'A202', type: '2 Bedroom Flat', size: 100, rent: 3000000, status: 'OCCUPIED' },
  { id: 'unit-005', propertyId: 'prop-001', unitNumber: 'B101', type: '4 Bedroom Penthouse', size: 250, rent: 8000000, status: 'VACANT' },
  
  // Victoria Island Office Complex
  { id: 'unit-006', propertyId: 'prop-002', unitNumber: 'G01', type: 'Ground Floor Office', size: 200, rent: 15000000, status: 'OCCUPIED' },
  { id: 'unit-007', propertyId: 'prop-002', unitNumber: '101', type: 'First Floor Office', size: 150, rent: 12000000, status: 'OCCUPIED' },
  { id: 'unit-008', propertyId: 'prop-002', unitNumber: '201', type: 'Second Floor Office', size: 150, rent: 12000000, status: 'VACANT' },
  { id: 'unit-009', propertyId: 'prop-002', unitNumber: '301', type: 'Third Floor Office', size: 180, rent: 14000000, status: 'OCCUPIED' },
  
  // Ikeja GRA Villas
  { id: 'unit-010', propertyId: 'prop-003', unitNumber: 'Villa 1', type: '5 Bedroom Detached', size: 400, rent: 12000000, status: 'OCCUPIED' },
  { id: 'unit-011', propertyId: 'prop-003', unitNumber: 'Villa 2', type: '5 Bedroom Detached', size: 400, rent: 12000000, status: 'VACANT' },
  { id: 'unit-012', propertyId: 'prop-003', unitNumber: 'Villa 3', type: '4 Bedroom Semi-Detached', size: 300, rent: 8000000, status: 'OCCUPIED' },
  
  // Ajah Terrace Homes
  { id: 'unit-013', propertyId: 'prop-004', unitNumber: 'T1', type: '4 Bedroom Terrace', size: 200, rent: 3500000, status: 'OCCUPIED' },
  { id: 'unit-014', propertyId: 'prop-004', unitNumber: 'T2', type: '4 Bedroom Terrace', size: 200, rent: 3500000, status: 'OCCUPIED' },
  { id: 'unit-015', propertyId: 'prop-004', unitNumber: 'T3', type: '4 Bedroom Terrace', size: 200, rent: 3500000, status: 'VACANT' },
  
  // Ikoyi Luxury Flats
  { id: 'unit-016', propertyId: 'prop-005', unitNumber: 'PH1', type: '4 Bedroom Penthouse', size: 350, rent: 25000000, status: 'OCCUPIED' },
  { id: 'unit-017', propertyId: 'prop-005', unitNumber: '301', type: '3 Bedroom Luxury Flat', size: 180, rent: 15000000, status: 'VACANT' },
  { id: 'unit-018', propertyId: 'prop-005', unitNumber: '201', type: '3 Bedroom Luxury Flat', size: 180, rent: 15000000, status: 'OCCUPIED' },
]

// =============================================================================
// TENANTS (Nigerian Tenants)
// =============================================================================

const TENANTS = [
  { id: 'tenant-001', firstName: 'Emeka', lastName: 'Okonkwo', email: 'emeka.okonkwo@email.com', phone: '08011112222', company: 'Tech Solutions Ltd' },
  { id: 'tenant-002', firstName: 'Fatima', lastName: 'Abubakar', email: 'fatima.abu@email.com', phone: '08022223333', company: null },
  { id: 'tenant-003', firstName: 'Oluwaseun', lastName: 'Adeyemi', email: 'seun.adeyemi@corp.ng', phone: '08033334444', company: 'Adeyemi & Sons' },
  { id: 'tenant-004', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@business.ng', phone: '08044445555', company: 'Eze Ventures' },
  { id: 'tenant-005', firstName: 'Abdullahi', lastName: 'Mohammed', email: 'abdullahi.m@oil.ng', phone: '08055556666', company: 'Petroserve Nigeria' },
  { id: 'tenant-006', firstName: 'Blessing', lastName: 'Ndu', email: 'blessing.ndu@email.com', phone: '08066667777', company: null },
  { id: 'tenant-007', firstName: 'Chukwuemeka', lastName: 'Agu', email: 'emeka.agu@law.ng', phone: '08077778888', company: 'Agu & Partners' },
  { id: 'tenant-008', firstName: 'Halima', lastName: 'Ibrahim', email: 'halima.i@fashion.ng', phone: '08088889999', company: 'Halima Couture' },
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

async function seedProperties(tenantId: string) {
  console.log('Creating properties...')
  
  for (const prop of PROPERTIES) {
    const existing = await prisma.re_property.findFirst({
      where: { tenantId, name: prop.name }
    })
    
    if (!existing) {
      await prisma.re_property.create({
        data: {
          id: `${tenantId}-${prop.id}`,
          tenantId,
          name: prop.name,
          type: prop.type,
          address: prop.address,
          lga: prop.lga,
          state: 'Lagos',
          country: 'Nigeria',
          totalUnits: prop.totalUnits,
          yearBuilt: prop.yearBuilt,
          amenities: prop.amenities,
          isActive: true,
        }
      })
      console.log(`  Created property: ${prop.name}`)
    }
  }
}

async function seedUnits(tenantId: string) {
  console.log('Creating units...')
  
  for (const unit of UNITS) {
    const existing = await prisma.re_unit.findFirst({
      where: { tenantId, unitNumber: unit.unitNumber, propertyId: `${tenantId}-${unit.propertyId}` }
    })
    
    if (!existing) {
      await prisma.re_unit.create({
        data: {
          id: `${tenantId}-${unit.id}`,
          tenantId,
          propertyId: `${tenantId}-${unit.propertyId}`,
          unitNumber: unit.unitNumber,
          type: unit.type,
          size: unit.size,
          sizeUnit: 'sqm',
          monthlyRent: unit.rent,
          currency: 'NGN',
          status: unit.status,
          isActive: true,
        }
      })
      console.log(`  Created unit: ${unit.unitNumber} (${unit.type}) - ₦${unit.rent.toLocaleString()}/yr`)
    }
  }
}

async function seedLeases(tenantId: string) {
  console.log('Creating leases...')
  
  const today = new Date()
  const leases = [
    { unitId: 'unit-001', tenantRefId: 'tenant-001', startDate: new Date(today.getTime() - 86400000 * 180), endDate: new Date(today.getTime() + 86400000 * 185), status: 'ACTIVE' },
    { unitId: 'unit-002', tenantRefId: 'tenant-002', startDate: new Date(today.getTime() - 86400000 * 90), endDate: new Date(today.getTime() + 86400000 * 275), status: 'ACTIVE' },
    { unitId: 'unit-004', tenantRefId: 'tenant-003', startDate: new Date(today.getTime() - 86400000 * 365), endDate: new Date(today.getTime() + 86400000 * 1), status: 'EXPIRING_SOON' },
    { unitId: 'unit-006', tenantRefId: 'tenant-004', startDate: new Date(today.getTime() - 86400000 * 730), endDate: new Date(today.getTime() + 86400000 * 365), status: 'ACTIVE' },
    { unitId: 'unit-007', tenantRefId: 'tenant-005', startDate: new Date(today.getTime() - 86400000 * 180), endDate: new Date(today.getTime() + 86400000 * 185), status: 'ACTIVE' },
    { unitId: 'unit-009', tenantRefId: 'tenant-007', startDate: new Date(today.getTime() - 86400000 * 60), endDate: new Date(today.getTime() + 86400000 * 305), status: 'ACTIVE' },
    { unitId: 'unit-010', tenantRefId: 'tenant-006', startDate: new Date(today.getTime() - 86400000 * 400), endDate: new Date(today.getTime() - 86400000 * 35), status: 'EXPIRED' },
    { unitId: 'unit-016', tenantRefId: 'tenant-008', startDate: new Date(today.getTime() - 86400000 * 30), endDate: new Date(today.getTime() + 86400000 * 335), status: 'ACTIVE' },
  ]
  
  for (let i = 0; i < leases.length; i++) {
    const lease = leases[i]
    await prisma.re_lease.create({
      data: {
        id: `${tenantId}-lease-${i + 1}`,
        tenantId,
        unitId: `${tenantId}-${lease.unitId}`,
        tenantRefId: `${tenantId}-${lease.tenantRefId}`,
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.status,
        leaseNumber: `LSE-${Date.now()}-${i + 1}`,
      }
    })
    console.log(`  Created lease: ${lease.status}`)
  }
}

async function seedMaintenanceRequests(tenantId: string) {
  console.log('Creating maintenance requests...')
  
  const today = new Date()
  const requests = [
    { unitId: 'unit-001', category: 'PLUMBING', description: 'Leaking pipe in kitchen', priority: 'HIGH', status: 'IN_PROGRESS' },
    { unitId: 'unit-006', category: 'ELECTRICAL', description: 'AC unit not cooling properly', priority: 'MEDIUM', status: 'PENDING' },
    { unitId: 'unit-010', category: 'STRUCTURAL', description: 'Crack in living room wall', priority: 'LOW', status: 'SCHEDULED' },
    { unitId: 'unit-004', category: 'PLUMBING', description: 'Blocked drain in bathroom', priority: 'HIGH', status: 'COMPLETED' },
    { unitId: 'unit-016', category: 'HVAC', description: 'Smart home system not responding', priority: 'MEDIUM', status: 'PENDING' },
  ]
  
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i]
    await prisma.re_maintenance_request.create({
      data: {
        id: `${tenantId}-maint-${i + 1}`,
        tenantId,
        unitId: `${tenantId}-${req.unitId}`,
        category: req.category,
        description: req.description,
        priority: req.priority,
        status: req.status,
        requestNumber: `MNT-${Date.now()}-${i + 1}`,
        reportedAt: new Date(today.getTime() - 86400000 * (i * 3)),
      }
    })
    console.log(`  Created maintenance request: ${req.category} - ${req.status}`)
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('REAL ESTATE SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Property Management')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed properties and units
    await seedProperties(tenant.id)
    await seedUnits(tenant.id)
    
    // Step 3: Seed leases
    await seedLeases(tenant.id)
    
    // Step 4: Seed maintenance
    await seedMaintenanceRequests(tenant.id)
    
    console.log('='.repeat(60))
    console.log('REAL ESTATE DEMO SEEDING COMPLETE')
    console.log(`  Properties: ${PROPERTIES.length}`)
    console.log(`  Units: ${UNITS.length}`)
    console.log(`  Leases: 8`)
    console.log(`  Maintenance Requests: 5`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
