/**
 * Demo Seed Script — PHASE D3-C
 * EXECUTION APPROVED
 * 
 * Real Estate Suite - Nigerian Property Management Demo Data Seeder
 * 
 * Creates demo data for a Nigerian property management company:
 * - Configuration
 * - Properties and units
 * - Tenant profiles
 * - Leases and payments
 * 
 * Run: npx tsx scripts/seed-real-estate-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-real-estate'
const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'

const PROPERTIES = [
  {
    id: 'prop-001',
    name: 'Victoria Garden City Estate',
    propertyType: 'RESIDENTIAL',
    address: '15 VGC Boulevard',
    city: 'Lagos',
    state: 'Lagos',
    lga: 'Eti-Osa',
    totalUnits: 8,
    totalFloors: 4,
    yearBuilt: 2019,
    marketValue: 450000000
  },
  {
    id: 'prop-002',
    name: 'Lekki Phase 1 Commercial Plaza',
    propertyType: 'COMMERCIAL',
    address: '25 Admiralty Way',
    city: 'Lagos',
    state: 'Lagos',
    lga: 'Eti-Osa',
    totalUnits: 12,
    totalFloors: 3,
    yearBuilt: 2021,
    marketValue: 680000000
  },
  {
    id: 'prop-003',
    name: 'Ikeja GRA Duplex Complex',
    propertyType: 'RESIDENTIAL',
    address: '42 Joel Ogunnaike Street',
    city: 'Lagos',
    state: 'Lagos',
    lga: 'Ikeja',
    totalUnits: 4,
    totalFloors: 2,
    yearBuilt: 2018,
    marketValue: 320000000
  }
]

const UNITS = [
  { id: 'unit-001', propertyId: 'prop-001', unitNumber: 'A1', unitType: 'FLAT', floor: 1, bedrooms: 3, bathrooms: 3, size: 150, monthlyRent: 2500000, securityDeposit: 5000000, status: 'OCCUPIED' },
  { id: 'unit-002', propertyId: 'prop-001', unitNumber: 'A2', unitType: 'FLAT', floor: 1, bedrooms: 3, bathrooms: 3, size: 150, monthlyRent: 2500000, securityDeposit: 5000000, status: 'VACANT' },
  { id: 'unit-003', propertyId: 'prop-001', unitNumber: 'B1', unitType: 'FLAT', floor: 2, bedrooms: 4, bathrooms: 4, size: 180, monthlyRent: 3200000, securityDeposit: 6400000, status: 'OCCUPIED' },
  { id: 'unit-004', propertyId: 'prop-001', unitNumber: 'B2', unitType: 'FLAT', floor: 2, bedrooms: 4, bathrooms: 4, size: 180, monthlyRent: 3200000, securityDeposit: 6400000, status: 'RESERVED' },
  { id: 'unit-005', propertyId: 'prop-002', unitNumber: 'G1', unitType: 'SHOP', floor: 0, size: 80, monthlyRent: 800000, securityDeposit: 1600000, status: 'OCCUPIED' },
  { id: 'unit-006', propertyId: 'prop-002', unitNumber: 'G2', unitType: 'SHOP', floor: 0, size: 60, monthlyRent: 600000, securityDeposit: 1200000, status: 'OCCUPIED' },
  { id: 'unit-007', propertyId: 'prop-002', unitNumber: '101', unitType: 'OFFICE', floor: 1, size: 120, monthlyRent: 1500000, securityDeposit: 3000000, status: 'VACANT' },
  { id: 'unit-008', propertyId: 'prop-002', unitNumber: '102', unitType: 'OFFICE', floor: 1, size: 100, monthlyRent: 1200000, securityDeposit: 2400000, status: 'OCCUPIED' },
  { id: 'unit-009', propertyId: 'prop-003', unitNumber: 'D1', unitType: 'DUPLEX', floor: 1, bedrooms: 5, bathrooms: 5, size: 350, monthlyRent: 5000000, securityDeposit: 10000000, status: 'OCCUPIED' },
  { id: 'unit-010', propertyId: 'prop-003', unitNumber: 'D2', unitType: 'DUPLEX', floor: 1, bedrooms: 5, bathrooms: 5, size: 350, monthlyRent: 5000000, securityDeposit: 10000000, status: 'VACANT' }
]

const TENANT_PROFILES = [
  { id: 'tp-001', firstName: 'Chukwuemeka', lastName: 'Okonkwo', email: 'chukwuemeka.o@email.com', phone: '08033445566', occupation: 'Managing Director', employer: 'First Bank Nigeria', monthlyIncome: 8500000 },
  { id: 'tp-002', firstName: 'Aisha', lastName: 'Bello', email: 'aisha.bello@email.com', phone: '08044556677', occupation: 'Senior Partner', employer: 'Templars Law Firm', monthlyIncome: 12000000 },
  { id: 'tp-003', firstName: 'Oluwaseun', lastName: 'Adeyemi', email: 'seun.adeyemi@email.com', phone: '08055667788', occupation: 'CEO', employer: 'TechHub Nigeria', monthlyIncome: 15000000 },
  { id: 'tp-004', firstName: 'Fatima', lastName: 'Ibrahim', email: 'fatima.ibrahim@email.com', phone: '08066778899', occupation: 'Business Owner', employer: 'FatiBella Boutique', monthlyIncome: 4500000 },
  { id: 'tp-005', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@email.com', phone: '08077889900', occupation: 'Pharmacist', employer: 'MedPlus Pharmacy', monthlyIncome: 3200000 },
  { id: 'tp-006', firstName: 'Abdulrahman', lastName: 'Yusuf', email: 'abdul.yusuf@email.com', phone: '08088990011', occupation: 'IT Consultant', employer: 'Andela Nigeria', monthlyIncome: 6000000 }
]

const LEASES = [
  { id: 'lease-001', unitId: 'unit-001', tenantProfileId: 'tp-001', startDate: '2024-01-01', endDate: '2025-12-31', monthlyRent: 2500000, securityDeposit: 5000000, status: 'ACTIVE' },
  { id: 'lease-002', unitId: 'unit-003', tenantProfileId: 'tp-002', startDate: '2024-06-01', endDate: '2026-05-31', monthlyRent: 3200000, securityDeposit: 6400000, status: 'ACTIVE' },
  { id: 'lease-003', unitId: 'unit-005', tenantProfileId: 'tp-004', startDate: '2024-03-01', endDate: '2026-02-28', monthlyRent: 800000, securityDeposit: 1600000, status: 'ACTIVE' },
  { id: 'lease-004', unitId: 'unit-006', tenantProfileId: 'tp-005', startDate: '2024-04-01', endDate: '2025-03-31', monthlyRent: 600000, securityDeposit: 1200000, status: 'ACTIVE' },
  { id: 'lease-005', unitId: 'unit-008', tenantProfileId: 'tp-006', startDate: '2024-07-01', endDate: '2026-06-30', monthlyRent: 1200000, securityDeposit: 2400000, status: 'ACTIVE' },
  { id: 'lease-006', unitId: 'unit-009', tenantProfileId: 'tp-003', startDate: '2024-01-01', endDate: '2025-12-31', monthlyRent: 5000000, securityDeposit: 10000000, status: 'ACTIVE' }
]

const PAYMENTS = [
  { id: 'pay-001', leaseId: 'lease-001', tenantProfileId: 'tp-001', paymentType: 'RENT', amount: 2500000, dueDate: '2026-01-01', paymentDate: '2025-12-28', status: 'PAID', paymentMethod: 'BANK_TRANSFER' },
  { id: 'pay-002', leaseId: 'lease-002', tenantProfileId: 'tp-002', paymentType: 'RENT', amount: 3200000, dueDate: '2026-01-01', paymentDate: '2025-12-30', status: 'PAID', paymentMethod: 'BANK_TRANSFER' },
  { id: 'pay-003', leaseId: 'lease-003', tenantProfileId: 'tp-004', paymentType: 'RENT', amount: 800000, dueDate: '2026-01-01', status: 'PENDING' },
  { id: 'pay-004', leaseId: 'lease-004', tenantProfileId: 'tp-005', paymentType: 'RENT', amount: 600000, dueDate: '2026-01-01', paymentDate: '2026-01-02', status: 'PAID', paymentMethod: 'USSD' },
  { id: 'pay-005', leaseId: 'lease-005', tenantProfileId: 'tp-006', paymentType: 'RENT', amount: 1200000, dueDate: '2026-01-01', status: 'OVERDUE' },
  { id: 'pay-006', leaseId: 'lease-006', tenantProfileId: 'tp-003', paymentType: 'RENT', amount: 5000000, dueDate: '2026-01-01', paymentDate: '2025-12-20', status: 'PAID', paymentMethod: 'BANK_TRANSFER' },
  { id: 'pay-007', leaseId: 'lease-001', tenantProfileId: 'tp-001', paymentType: 'SERVICE_CHARGE', amount: 250000, dueDate: '2026-01-15', status: 'PENDING' },
  { id: 'pay-008', leaseId: 'lease-006', tenantProfileId: 'tp-003', paymentType: 'SERVICE_CHARGE', amount: 500000, dueDate: '2026-01-15', paymentDate: '2026-01-10', status: 'PAID', paymentMethod: 'CARD' }
]

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
  console.log('Creating real estate configuration...')
  
  const existing = await prisma.realestate_config.findFirst({ where: { tenantId } })
  if (existing) {
    console.log('  Config already exists, skipping...')
    return
  }
  
  await prisma.realestate_config.create({
    data: {
      tenantId,
      partnerId: DEMO_PARTNER_ID,
      companyName: 'Lagos Property Managers Ltd',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      defaultLeaseTermMonths: 24,
      lateFeePercentage: 5.0,
      gracePeriodDays: 7,
      address: '15 Adeola Odeku Street, Victoria Island, Lagos',
      phone: '01-2908765',
      email: 'info@lagosproperty.ng'
    }
  })
  console.log('  Config created')
}

async function seedProperties(tenantId: string) {
  console.log('Creating properties...')
  let created = 0
  
  for (const prop of PROPERTIES) {
    const existing = await prisma.realestate_property.findFirst({ where: { id: prop.id } })
    if (existing) continue
    
    await prisma.realestate_property.create({
      data: {
        id: prop.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        name: prop.name,
        propertyType: prop.propertyType,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        country: 'Nigeria',
        lga: prop.lga,
        totalUnits: prop.totalUnits,
        totalFloors: prop.totalFloors,
        yearBuilt: prop.yearBuilt,
        marketValue: prop.marketValue,
        status: 'ACTIVE'
      }
    })
    created++
  }
  console.log(`  Properties created: ${created}`)
  return created
}

async function seedUnits(tenantId: string) {
  console.log('Creating units...')
  let created = 0
  
  for (const unit of UNITS) {
    const existing = await prisma.realestate_unit.findFirst({ where: { id: unit.id } })
    if (existing) continue
    
    await prisma.realestate_unit.create({
      data: {
        id: unit.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        propertyId: unit.propertyId,
        unitNumber: unit.unitNumber,
        unitType: unit.unitType,
        floor: unit.floor,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        size: unit.size,
        monthlyRent: unit.monthlyRent,
        securityDeposit: unit.securityDeposit,
        status: unit.status
      }
    })
    created++
  }
  console.log(`  Units created: ${created}`)
  return created
}

async function seedTenantProfiles(tenantId: string) {
  console.log('Creating tenant profiles...')
  let created = 0
  
  for (const tp of TENANT_PROFILES) {
    const existing = await prisma.realestate_tenant_profile.findFirst({ where: { id: tp.id } })
    if (existing) continue
    
    await prisma.realestate_tenant_profile.create({
      data: {
        id: tp.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        firstName: tp.firstName,
        lastName: tp.lastName,
        email: tp.email,
        phone: tp.phone,
        occupation: tp.occupation,
        employer: tp.employer,
        monthlyIncome: tp.monthlyIncome,
        status: 'ACTIVE'
      }
    })
    created++
  }
  console.log(`  Tenant profiles created: ${created}`)
  return created
}

async function seedLeases(tenantId: string) {
  console.log('Creating leases...')
  let created = 0
  
  for (const lease of LEASES) {
    const existing = await prisma.realestate_lease.findFirst({ where: { id: lease.id } })
    if (existing) continue
    
    await prisma.realestate_lease.create({
      data: {
        id: lease.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        unitId: lease.unitId,
        tenantProfileId: lease.tenantProfileId,
        startDate: new Date(lease.startDate),
        endDate: new Date(lease.endDate),
        monthlyRent: lease.monthlyRent,
        securityDeposit: lease.securityDeposit,
        status: lease.status
      }
    })
    created++
  }
  console.log(`  Leases created: ${created}`)
  return created
}

async function seedPayments(tenantId: string) {
  console.log('Creating payments...')
  let created = 0
  
  for (const pay of PAYMENTS) {
    const existing = await prisma.realestate_payment.findFirst({ where: { id: pay.id } })
    if (existing) continue
    
    await prisma.realestate_payment.create({
      data: {
        id: pay.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        leaseId: pay.leaseId,
        tenantProfileId: pay.tenantProfileId,
        paymentType: pay.paymentType,
        amount: pay.amount,
        dueDate: new Date(pay.dueDate),
        paymentDate: pay.paymentDate ? new Date(pay.paymentDate) : null,
        paymentMethod: pay.paymentMethod || null,
        status: pay.status
      }
    })
    created++
  }
  console.log(`  Payments created: ${created}`)
  return created
}

async function main() {
  console.log('='.repeat(60))
  console.log('REAL ESTATE SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Property Management')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    
    await seedConfig(tenant.id)
    const props = await seedProperties(tenant.id)
    const units = await seedUnits(tenant.id)
    const profiles = await seedTenantProfiles(tenant.id)
    const leases = await seedLeases(tenant.id)
    const payments = await seedPayments(tenant.id)
    
    console.log('='.repeat(60))
    console.log('REAL ESTATE DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Properties: ${props}`)
    console.log(`  Units: ${units}`)
    console.log(`  Tenant Profiles: ${profiles}`)
    console.log(`  Leases: ${leases}`)
    console.log(`  Payments: ${payments}`)
    console.log(`  TOTAL: ${1 + props + units + profiles + leases + payments}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
