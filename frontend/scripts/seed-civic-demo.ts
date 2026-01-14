/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Civic Suite - Nigerian Government Bureau Demo Data Seeder
 * 
 * Creates demo data for a Nigerian government agency:
 * - Configuration
 * - Agency and departments
 * - Citizens
 * - Services
 * 
 * Run: npx tsx scripts/seed-civic-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-civic'

// =============================================================================
// AGENCY
// =============================================================================

const AGENCY = {
  id: 'agency-001',
  code: 'LASG-LANDS',
  name: 'Lagos State Lands Bureau',
  description: 'Government agency responsible for land administration in Lagos State',
  jurisdiction: 'Lagos State',
  phone: '01-2345678',
  email: 'info@lagoslands.gov.ng',
  address: {
    street: 'Block 13, The Secretariat',
    area: 'Alausa',
    lga: 'Ikeja',
    state: 'Lagos',
    country: 'Nigeria'
  },
  headName: 'Surveyor General Adeleke Fashola',
  headTitle: 'Surveyor General'
}

// =============================================================================
// SERVICES (Nigerian Government Services)
// =============================================================================

const SERVICES = [
  { id: 'svc-001', code: 'C-OF-O', name: 'Certificate of Occupancy', category: 'CERTIFICATES', baseFee: 250000, sla: 90 },
  { id: 'svc-002', code: 'GOV-CONSENT', name: 'Governor\'s Consent', category: 'APPROVALS', baseFee: 350000, sla: 60 },
  { id: 'svc-003', code: 'SURVEY-PLAN', name: 'Survey Plan Approval', category: 'APPROVALS', baseFee: 75000, sla: 30 },
  { id: 'svc-004', code: 'BLDG-PERMIT', name: 'Building Plan Approval', category: 'PERMITS', baseFee: 150000, sla: 45 },
  { id: 'svc-005', code: 'EXCISION', name: 'Excision Certificate', category: 'CERTIFICATES', baseFee: 500000, sla: 180 },
  { id: 'svc-006', code: 'LAND-SEARCH', name: 'Land Title Verification', category: 'INQUIRIES', baseFee: 25000, sla: 7 },
  { id: 'svc-007', code: 'RATIFICATION', name: 'Ratification of Title', category: 'APPROVALS', baseFee: 200000, sla: 60 },
  { id: 'svc-008', code: 'RENEWAL', name: 'Certificate Renewal', category: 'RENEWALS', baseFee: 50000, sla: 30 },
]

// =============================================================================
// CITIZENS (Nigerian Demographics)
// =============================================================================

const CITIZENS = [
  { id: 'cit-001', citizenNumber: 'CIT-2026-00001', firstName: 'Chukwuemeka', lastName: 'Okonkwo', title: 'Chief', phone: '08111222333', email: 'chief.okonkwo@email.com', occupation: 'Business Executive' },
  { id: 'cit-002', citizenNumber: 'CIT-2026-00002', firstName: 'Fatima', lastName: 'Ibrahim', title: 'Mrs.', phone: '08222333444', email: 'fatima.ibrahim@email.com', occupation: 'Civil Servant' },
  { id: 'cit-003', citizenNumber: 'CIT-2026-00003', firstName: 'Oluwaseun', lastName: 'Adeyemi', title: 'Mr.', phone: '08333444555', email: 'seun.adeyemi@email.com', occupation: 'Architect' },
  { id: 'cit-004', citizenNumber: 'CIT-2026-00004', firstName: 'Ngozi', lastName: 'Eze', title: 'Dr.', phone: '08444555666', email: 'dr.ngozi@email.com', occupation: 'Medical Doctor' },
  { id: 'cit-005', citizenNumber: 'CIT-2026-00005', firstName: 'Abdullahi', lastName: 'Yusuf', title: 'Alhaji', phone: '08555666777', email: 'alhaji.yusuf@email.com', occupation: 'Property Developer' },
  { id: 'cit-006', citizenNumber: 'CIT-2026-00006', firstName: 'Blessing', lastName: 'Okafor', title: 'Mrs.', phone: '08666777888', email: 'blessing.okafor@email.com', occupation: 'Lawyer' },
  { id: 'cit-007', citizenNumber: 'CIT-2026-00007', firstName: 'Tunde', lastName: 'Bakare', title: 'Engr.', phone: '08777888999', email: 'tunde.bakare@email.com', occupation: 'Civil Engineer' },
  { id: 'cit-008', citizenNumber: 'CIT-2026-00008', firstName: 'Amaka', lastName: 'Nwosu', title: 'Miss', phone: '08888999000', email: 'amaka.nwosu@email.com', occupation: 'Real Estate Agent' },
  { id: 'cit-009', citizenNumber: 'CIT-2026-00009', firstName: 'Gbenga', lastName: 'Adeola', title: 'Mr.', phone: '08999000111', email: 'gbenga.adeola@email.com', occupation: 'Contractor' },
  { id: 'cit-010', citizenNumber: 'CIT-2026-00010', firstName: 'Halima', lastName: 'Mohammed', title: 'Hajia', phone: '08100111222', email: 'halima.m@email.com', occupation: 'Businesswoman' },
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
  console.log('Creating civic configuration...')
  
  const existing = await prisma.civic_config.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.civic_config.create({
      data: {
        tenantId,
        agencyName: AGENCY.name,
        agencyCode: AGENCY.code,
        jurisdiction: AGENCY.jurisdiction,
        defaultSlaBusinessDays: 14,
        workingHoursStart: '08:00',
        workingHoursEnd: '16:00',
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        requirePaymentBeforeProcessing: true,
        autoAssignCases: false,
        allowAnonymousComplaints: false,
        enablePublicTracking: true,
      }
    })
    console.log('  Created civic configuration')
  } else {
    console.log('  Config exists')
  }
}

async function seedAgency(tenantId: string) {
  console.log('Creating agency...')
  
  const agencyId = `${tenantId}-${AGENCY.id}`
  
  const existing = await prisma.civic_agency.findFirst({
    where: { id: agencyId }
  })
  
  if (!existing) {
    await prisma.civic_agency.create({
      data: {
        id: agencyId,
        tenantId,
        code: AGENCY.code,
        name: AGENCY.name,
        description: AGENCY.description,
        jurisdiction: AGENCY.jurisdiction,
        phone: AGENCY.phone,
        email: AGENCY.email,
        address: AGENCY.address,
        headName: AGENCY.headName,
        headTitle: AGENCY.headTitle,
        isActive: true,
      }
    })
    console.log(`  Created agency: ${AGENCY.name}`)
  } else {
    console.log(`  Agency exists: ${AGENCY.name}`)
  }
  
  return agencyId
}

async function seedServices(tenantId: string, agencyId: string) {
  console.log('Creating services...')
  
  for (const svc of SERVICES) {
    const serviceId = `${tenantId}-${svc.id}`
    
    const existing = await prisma.civic_service.findFirst({
      where: { id: serviceId }
    })
    
    if (!existing) {
      await prisma.civic_service.create({
        data: {
          id: serviceId,
          tenantId,
          agencyId,
          code: svc.code,
          name: svc.name,
          description: `Government service: ${svc.name}`,
          category: svc.category as any,
          baseFee: svc.baseFee,
          slaBusinessDays: svc.sla,
          isActive: true,
        }
      })
      console.log(`  Created service: ${svc.name}`)
    } else {
      console.log(`  Service exists: ${svc.name}`)
    }
  }
}

async function seedCitizens(tenantId: string) {
  console.log('Creating citizens...')
  
  for (const cit of CITIZENS) {
    const citizenId = `${tenantId}-${cit.id}`
    
    const existing = await prisma.civic_citizen.findFirst({
      where: { citizenNumber: cit.citizenNumber }
    })
    
    if (!existing) {
      await prisma.civic_citizen.create({
        data: {
          id: citizenId,
          tenantId,
          citizenNumber: cit.citizenNumber,
          firstName: cit.firstName,
          lastName: cit.lastName,
          title: cit.title,
          phone: cit.phone,
          email: cit.email,
          occupation: cit.occupation,
          isActive: true,
        }
      })
      console.log(`  Created citizen: ${cit.title} ${cit.firstName} ${cit.lastName}`)
    } else {
      console.log(`  Citizen exists: ${cit.firstName} ${cit.lastName}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('CIVIC SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Government Bureau')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    const agencyId = await seedAgency(tenant.id)
    
    // Step 3: Seed operational data
    await seedServices(tenant.id, agencyId)
    await seedCitizens(tenant.id)
    
    console.log('='.repeat(60))
    console.log('CIVIC DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Agency: 1`)
    console.log(`  Services: ${SERVICES.length}`)
    console.log(`  Citizens: ${CITIZENS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
