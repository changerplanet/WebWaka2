/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Civic Suite - Nigerian Government Bureau Demo Data Seeder
 * 
 * Creates demo data for a Nigerian civic organization:
 * - Agency/department structure
 * - Staff (civil servants)
 * - Citizens
 * - Services offered
 * - Service requests and cases
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-civic-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-civic'

// =============================================================================
// AGENCY STRUCTURE
// =============================================================================

const AGENCY = {
  id: 'agency-001',
  name: 'Lagos State Lands Bureau',
  code: 'LSLB',
  address: '12 Alausa, Ikeja, Lagos State',
  phone: '01-7654321',
  email: 'info@lagoslands.gov.ng',
}

const DEPARTMENTS = [
  { id: 'dept-001', name: 'Land Registration', code: 'LR', description: 'Handles land title registration and transfers' },
  { id: 'dept-002', name: 'Survey & Mapping', code: 'SM', description: 'Land survey and mapping services' },
  { id: 'dept-003', name: 'Building Approval', code: 'BA', description: 'Building plan approval and inspections' },
  { id: 'dept-004', name: 'Land Use & Compliance', code: 'LU', description: 'Land use monitoring and enforcement' },
  { id: 'dept-005', name: 'Revenue & Billing', code: 'RB', description: 'Ground rent and land charges' },
]

const UNITS = [
  { id: 'unit-001', deptId: 'dept-001', name: 'New Registrations', code: 'LR-NR' },
  { id: 'unit-002', deptId: 'dept-001', name: 'Title Transfers', code: 'LR-TT' },
  { id: 'unit-003', deptId: 'dept-002', name: 'Cadastral Survey', code: 'SM-CS' },
  { id: 'unit-004', deptId: 'dept-003', name: 'Residential Approvals', code: 'BA-RA' },
  { id: 'unit-005', deptId: 'dept-003', name: 'Commercial Approvals', code: 'BA-CA' },
]

// =============================================================================
// SERVICES
// =============================================================================

const SERVICES = [
  { id: 'svc-001', name: 'Certificate of Occupancy (C of O)', code: 'COO', deptId: 'dept-001', fee: 250000, processingDays: 90, category: 'REGISTRATION' },
  { id: 'svc-002', name: 'Governor\'s Consent', code: 'GC', deptId: 'dept-001', fee: 150000, processingDays: 60, category: 'REGISTRATION' },
  { id: 'svc-003', name: 'Land Survey Report', code: 'LSR', deptId: 'dept-002', fee: 75000, processingDays: 30, category: 'SURVEY' },
  { id: 'svc-004', name: 'Building Plan Approval', code: 'BPA', deptId: 'dept-003', fee: 100000, processingDays: 45, category: 'APPROVAL' },
  { id: 'svc-005', name: 'Land Use Charge', code: 'LUC', deptId: 'dept-005', fee: 50000, processingDays: 14, category: 'BILLING' },
  { id: 'svc-006', name: 'Ground Rent Renewal', code: 'GRR', deptId: 'dept-005', fee: 25000, processingDays: 7, category: 'BILLING' },
  { id: 'svc-007', name: 'Excision Processing', code: 'EXC', deptId: 'dept-001', fee: 500000, processingDays: 180, category: 'REGISTRATION' },
  { id: 'svc-008', name: 'Change of Name/Transfer', code: 'CNT', deptId: 'dept-001', fee: 100000, processingDays: 45, category: 'REGISTRATION' },
  { id: 'svc-009', name: 'Certified True Copy', code: 'CTC', deptId: 'dept-001', fee: 15000, processingDays: 7, category: 'DOCUMENTATION' },
  { id: 'svc-010', name: 'Property Inspection', code: 'PI', deptId: 'dept-004', fee: 35000, processingDays: 14, category: 'INSPECTION' },
]

// =============================================================================
// STAFF (Nigerian Civil Servants)
// =============================================================================

const STAFF = [
  { id: 'staff-001', name: 'Alhaji Musa Danladi', role: 'Director General', email: 'dg@lagoslands.gov.ng', phone: '08011112222', deptId: null, gradeLevel: 'GL17' },
  { id: 'staff-002', name: 'Mrs. Adaeze Okonkwo', role: 'Director, Land Registration', email: 'dir.lr@lagoslands.gov.ng', phone: '08022223333', deptId: 'dept-001', gradeLevel: 'GL16' },
  { id: 'staff-003', name: 'Engr. Oluwaseun Adeyemi', role: 'Director, Survey', email: 'dir.survey@lagoslands.gov.ng', phone: '08033334444', deptId: 'dept-002', gradeLevel: 'GL16' },
  { id: 'staff-004', name: 'Arc. Fatima Ibrahim', role: 'Director, Building Approval', email: 'dir.ba@lagoslands.gov.ng', phone: '08044445555', deptId: 'dept-003', gradeLevel: 'GL16' },
  { id: 'staff-005', name: 'Mrs. Ngozi Eze', role: 'Case Officer', email: 'n.eze@lagoslands.gov.ng', phone: '08055556666', deptId: 'dept-001', gradeLevel: 'GL12' },
  { id: 'staff-006', name: 'Mr. Chukwuemeka Nnamdi', role: 'Case Officer', email: 'c.nnamdi@lagoslands.gov.ng', phone: '08066667777', deptId: 'dept-001', gradeLevel: 'GL12' },
  { id: 'staff-007', name: 'Mr. Abdullahi Yusuf', role: 'Survey Officer', email: 'a.yusuf@lagoslands.gov.ng', phone: '08077778888', deptId: 'dept-002', gradeLevel: 'GL10' },
  { id: 'staff-008', name: 'Mrs. Blessing Nwosu', role: 'Building Inspector', email: 'b.nwosu@lagoslands.gov.ng', phone: '08088889999', deptId: 'dept-003', gradeLevel: 'GL10' },
  { id: 'staff-009', name: 'Mr. Tunde Bakare', role: 'Compliance Officer', email: 't.bakare@lagoslands.gov.ng', phone: '08099990000', deptId: 'dept-004', gradeLevel: 'GL10' },
  { id: 'staff-010', name: 'Mrs. Halima Bello', role: 'Revenue Officer', email: 'h.bello@lagoslands.gov.ng', phone: '08010101010', deptId: 'dept-005', gradeLevel: 'GL10' },
]

// =============================================================================
// CITIZENS (Nigerian Applicants)
// =============================================================================

const CITIZENS = [
  { id: 'cit-001', firstName: 'Emeka', lastName: 'Okonkwo', email: 'emeka.ok@email.com', phone: '08111222333', nin: '12345678901', address: '45 Victoria Island, Lagos', lga: 'Eti-Osa' },
  { id: 'cit-002', firstName: 'Fatima', lastName: 'Abubakar', email: 'fatima.abu@email.com', phone: '08222333444', nin: '23456789012', address: '12 Ikoyi, Lagos', lga: 'Lagos Island' },
  { id: 'cit-003', firstName: 'Oluwaseun', lastName: 'Adeyemi', email: 'seun.adeyemi@corp.ng', phone: '08333444555', nin: '34567890123', address: '78 Lekki Phase 1, Lagos', lga: 'Eti-Osa' },
  { id: 'cit-004', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@business.ng', phone: '08444555666', nin: '45678901234', address: '23 Magodo, Lagos', lga: 'Kosofe' },
  { id: 'cit-005', firstName: 'Abdullahi', lastName: 'Mohammed', email: 'abdullahi.m@company.ng', phone: '08555666777', nin: '56789012345', address: '56 Ikeja GRA, Lagos', lga: 'Ikeja' },
  { id: 'cit-006', firstName: 'Blessing', lastName: 'Ndu', email: 'blessing.ndu@email.com', phone: '08666777888', nin: '67890123456', address: '34 Yaba, Lagos', lga: 'Yaba' },
  { id: 'cit-007', firstName: 'Chukwuemeka', lastName: 'Agu', email: 'emeka.agu@corp.ng', phone: '08777888999', nin: '78901234567', address: '89 Surulere, Lagos', lga: 'Surulere' },
  { id: 'cit-008', firstName: 'Halima', lastName: 'Ibrahim', email: 'halima.i@email.com', phone: '08888999000', nin: '89012345678', address: '67 Apapa, Lagos', lga: 'Apapa' },
  { id: 'cit-009', firstName: 'Kehinde', lastName: 'Bakare', email: 'kehinde.b@business.ng', phone: '08999000111', nin: '90123456789', address: '12 Ajah, Lagos', lga: 'Eti-Osa' },
  { id: 'cit-010', firstName: 'Adaeze', lastName: 'Okoro', email: 'adaeze.okoro@email.com', phone: '08100111222', nin: '01234567890', address: '45 Maryland, Lagos', lga: 'Kosofe' },
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
        currency: 'NGN',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        workingHoursStart: '08:00',
        workingHoursEnd: '16:00',
        maxCasesPerOfficer: 50,
      }
    })
    console.log('  Created civic configuration')
  }
}

async function seedAgency(tenantId: string) {
  console.log('Creating agency...')
  
  const existing = await prisma.civic_agency.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.civic_agency.create({
      data: {
        id: `${tenantId}-${AGENCY.id}`,
        tenantId,
        name: AGENCY.name,
        code: AGENCY.code,
        address: AGENCY.address,
        phone: AGENCY.phone,
        email: AGENCY.email,
        isActive: true,
      }
    })
    console.log(`  Created agency: ${AGENCY.name}`)
  }
}

async function seedDepartments(tenantId: string) {
  console.log('Creating departments...')
  
  for (const dept of DEPARTMENTS) {
    const existing = await prisma.civic_department.findFirst({
      where: { tenantId, code: dept.code }
    })
    
    if (!existing) {
      await prisma.civic_department.create({
        data: {
          id: `${tenantId}-${dept.id}`,
          tenantId,
          agencyId: `${tenantId}-${AGENCY.id}`,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          isActive: true,
        }
      })
      console.log(`  Created department: ${dept.name}`)
    }
  }
}

async function seedServices(tenantId: string) {
  console.log('Creating services...')
  
  for (const svc of SERVICES) {
    const existing = await prisma.civic_service.findFirst({
      where: { tenantId, code: svc.code }
    })
    
    if (!existing) {
      await prisma.civic_service.create({
        data: {
          id: `${tenantId}-${svc.id}`,
          tenantId,
          departmentId: `${tenantId}-${svc.deptId}`,
          name: svc.name,
          code: svc.code,
          fee: svc.fee,
          currency: 'NGN',
          processingDays: svc.processingDays,
          category: svc.category,
          isActive: true,
        }
      })
      console.log(`  Created service: ${svc.name} - ₦${svc.fee.toLocaleString()}`)
    }
  }
}

async function seedStaff(tenantId: string) {
  console.log('Creating staff...')
  
  for (const staff of STAFF) {
    const existing = await prisma.civic_staff.findFirst({
      where: { tenantId, email: staff.email }
    })
    
    if (!existing) {
      await prisma.civic_staff.create({
        data: {
          id: `${tenantId}-${staff.id}`,
          tenantId,
          name: staff.name,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          departmentId: staff.deptId ? `${tenantId}-${staff.deptId}` : null,
          gradeLevel: staff.gradeLevel,
          isActive: true,
        }
      })
      console.log(`  Created staff: ${staff.name} (${staff.role})`)
    }
  }
}

async function seedCitizens(tenantId: string) {
  console.log('Creating citizens...')
  
  for (const cit of CITIZENS) {
    const existing = await prisma.civic_citizen.findFirst({
      where: { tenantId, email: cit.email }
    })
    
    if (!existing) {
      await prisma.civic_citizen.create({
        data: {
          id: `${tenantId}-${cit.id}`,
          tenantId,
          firstName: cit.firstName,
          lastName: cit.lastName,
          email: cit.email,
          phone: cit.phone,
          nin: cit.nin,
          address: cit.address,
          lga: cit.lga,
          isVerified: true,
        }
      })
      console.log(`  Created citizen: ${cit.firstName} ${cit.lastName}`)
    }
  }
}

async function seedRequests(tenantId: string) {
  console.log('Creating service requests...')
  
  const today = new Date()
  const requests = [
    { citizenId: 'cit-001', serviceId: 'svc-001', status: 'IN_PROGRESS', assignedTo: 'staff-005', submittedAt: new Date(today.getTime() - 86400000 * 30) },
    { citizenId: 'cit-002', serviceId: 'svc-002', status: 'PENDING_REVIEW', assignedTo: 'staff-006', submittedAt: new Date(today.getTime() - 86400000 * 14) },
    { citizenId: 'cit-003', serviceId: 'svc-004', status: 'PENDING_INSPECTION', assignedTo: 'staff-008', submittedAt: new Date(today.getTime() - 86400000 * 7) },
    { citizenId: 'cit-004', serviceId: 'svc-003', status: 'COMPLETED', assignedTo: 'staff-007', submittedAt: new Date(today.getTime() - 86400000 * 45), completedAt: new Date(today.getTime() - 86400000 * 10) },
    { citizenId: 'cit-005', serviceId: 'svc-005', status: 'SUBMITTED', assignedTo: null, submittedAt: new Date(today.getTime() - 86400000 * 2) },
    { citizenId: 'cit-006', serviceId: 'svc-009', status: 'COMPLETED', assignedTo: 'staff-005', submittedAt: new Date(today.getTime() - 86400000 * 20), completedAt: new Date(today.getTime() - 86400000 * 12) },
  ]
  
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i]
    await prisma.civic_request.create({
      data: {
        id: `${tenantId}-req-${i + 1}`,
        tenantId,
        citizenId: `${tenantId}-${req.citizenId}`,
        serviceId: `${tenantId}-${req.serviceId}`,
        status: req.status,
        assignedToId: req.assignedTo ? `${tenantId}-${req.assignedTo}` : null,
        referenceNumber: `LSLB-${Date.now()}-${i + 1}`,
        submittedAt: req.submittedAt,
        completedAt: req.completedAt || null,
      }
    })
    console.log(`  Created request: ${req.status}`)
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
    await seedAgency(tenant.id)
    await seedDepartments(tenant.id)
    
    // Step 3: Seed operational data
    await seedServices(tenant.id)
    await seedStaff(tenant.id)
    await seedCitizens(tenant.id)
    
    // Step 4: Seed transaction data
    await seedRequests(tenant.id)
    
    console.log('='.repeat(60))
    console.log('CIVIC DEMO SEEDING COMPLETE')
    console.log(`  Agency: 1`)
    console.log(`  Departments: ${DEPARTMENTS.length}`)
    console.log(`  Services: ${SERVICES.length}`)
    console.log(`  Staff: ${STAFF.length}`)
    console.log(`  Citizens: ${CITIZENS.length}`)
    console.log(`  Requests: 6`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
