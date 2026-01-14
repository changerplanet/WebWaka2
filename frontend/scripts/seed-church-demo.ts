/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Church Suite - Nigerian Church Demo Data Seeder
 * 
 * Creates demo data for a Nigerian church:
 * - Church configuration
 * - Ministries and departments
 * - Cell groups
 * - Members with Nigerian names
 * - Giving/tithe records
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-church-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-church'

// =============================================================================
// CHURCH CONFIGURATION
// =============================================================================

const CHURCH = {
  id: 'church-001',
  name: 'GraceLife Community Church',
  address: '15 Covenant Avenue, Lekki, Lagos',
  phone: '08001234567',
  email: 'info@gracelifechurch.ng',
  website: 'www.gracelifechurch.ng',
  denomination: 'Pentecostal',
  foundedYear: 2010,
}

// =============================================================================
// CHURCH UNITS (Services/Campuses)
// =============================================================================

const UNITS = [
  { id: 'unit-001', name: 'Main Sanctuary', type: 'MAIN', capacity: 2000 },
  { id: 'unit-002', name: 'Youth Chapel', type: 'YOUTH', capacity: 500 },
  { id: 'unit-003', name: 'Children Church', type: 'CHILDREN', capacity: 300 },
  { id: 'unit-004', name: 'Overflow Hall', type: 'OVERFLOW', capacity: 500 },
]

// =============================================================================
// MINISTRIES
// =============================================================================

const MINISTRIES = [
  { id: 'min-001', name: 'Worship Ministry', code: 'WOR', description: 'Leads worship and music' },
  { id: 'min-002', name: 'Ushering Ministry', code: 'USH', description: 'Ushering and protocol' },
  { id: 'min-003', name: 'Children Ministry', code: 'CHI', description: 'Children\'s education and care' },
  { id: 'min-004', name: 'Youth Ministry', code: 'YTH', description: 'Youth programs and discipleship' },
  { id: 'min-005', name: 'Men\'s Fellowship', code: 'MEN', description: 'Men\'s activities and mentorship' },
  { id: 'min-006', name: 'Women\'s Ministry', code: 'WOM', description: 'Women\'s programs and support' },
  { id: 'min-007', name: 'Welfare Ministry', code: 'WEL', description: 'Member welfare and support' },
  { id: 'min-008', name: 'Media Ministry', code: 'MED', description: 'Audio, video, and online streaming' },
  { id: 'min-009', name: 'Prayer Ministry', code: 'PRA', description: 'Prayer coordination and intercession' },
  { id: 'min-010', name: 'Evangelism Ministry', code: 'EVA', description: 'Outreach and evangelism' },
]

// =============================================================================
// CELL GROUPS
// =============================================================================

const CELL_GROUPS = [
  { id: 'cell-001', name: 'Lekki Phase 1 Cell', zone: 'Lekki', leader: 'Bro. Emeka Okonkwo', meetingDay: 'WEDNESDAY' },
  { id: 'cell-002', name: 'Victoria Island Cell', zone: 'VI', leader: 'Sis. Adaeze Eze', meetingDay: 'THURSDAY' },
  { id: 'cell-003', name: 'Ajah Cell', zone: 'Ajah', leader: 'Bro. Chukwudi Nnamdi', meetingDay: 'WEDNESDAY' },
  { id: 'cell-004', name: 'Ikoyi Cell', zone: 'Ikoyi', leader: 'Sis. Ngozi Okafor', meetingDay: 'TUESDAY' },
  { id: 'cell-005', name: 'Ikeja GRA Cell', zone: 'Ikeja', leader: 'Bro. Oluwaseun Adeyemi', meetingDay: 'WEDNESDAY' },
  { id: 'cell-006', name: 'Surulere Cell', zone: 'Surulere', leader: 'Sis. Blessing Nwosu', meetingDay: 'THURSDAY' },
  { id: 'cell-007', name: 'Yaba Cell', zone: 'Yaba', leader: 'Bro. Tunde Bakare', meetingDay: 'WEDNESDAY' },
  { id: 'cell-008', name: 'Maryland Cell', zone: 'Maryland', leader: 'Sis. Funke Adegoke', meetingDay: 'TUESDAY' },
]

// =============================================================================
// ROLES
// =============================================================================

const ROLES = [
  { id: 'role-001', name: 'Senior Pastor', level: 'LEADERSHIP', permissions: ['ALL'] },
  { id: 'role-002', name: 'Associate Pastor', level: 'LEADERSHIP', permissions: ['MEMBERS', 'MINISTRIES', 'REPORTS'] },
  { id: 'role-003', name: 'Deacon', level: 'ORDAINED', permissions: ['MEMBERS', 'WELFARE'] },
  { id: 'role-004', name: 'Deaconess', level: 'ORDAINED', permissions: ['MEMBERS', 'WELFARE'] },
  { id: 'role-005', name: 'Ministry Head', level: 'LEADER', permissions: ['MINISTRY_MEMBERS'] },
  { id: 'role-006', name: 'Cell Leader', level: 'LEADER', permissions: ['CELL_MEMBERS'] },
  { id: 'role-007', name: 'Worker', level: 'WORKER', permissions: ['ATTENDANCE'] },
  { id: 'role-008', name: 'Member', level: 'MEMBER', permissions: ['SELF'] },
]

// =============================================================================
// MEMBERS (Nigerian Names)
// =============================================================================

const MEMBERS = [
  { id: 'mem-001', firstName: 'Pastor', lastName: 'Adebayo Johnson', gender: 'M', roleId: 'role-001', phone: '08011112222', email: 'pastor@gracelifechurch.ng', memberSince: '2010-01-01', status: 'ACTIVE' },
  { id: 'mem-002', firstName: 'Pastor', lastName: 'Folake Johnson', gender: 'F', roleId: 'role-002', phone: '08022223333', email: 'pastorfolake@gracelifechurch.ng', memberSince: '2010-01-01', status: 'ACTIVE' },
  { id: 'mem-003', firstName: 'Deacon', lastName: 'Emeka Okonkwo', gender: 'M', roleId: 'role-003', phone: '08033334444', email: 'deacon.emeka@email.com', memberSince: '2012-03-15', status: 'ACTIVE' },
  { id: 'mem-004', firstName: 'Deaconess', lastName: 'Adaeze Eze', gender: 'F', roleId: 'role-004', phone: '08044445555', email: 'deaconess.adaeze@email.com', memberSince: '2011-06-20', status: 'ACTIVE' },
  { id: 'mem-005', firstName: 'Chukwudi', lastName: 'Nnamdi', gender: 'M', roleId: 'role-006', phone: '08055556666', email: 'chukwudi.n@email.com', memberSince: '2014-01-10', status: 'ACTIVE' },
  { id: 'mem-006', firstName: 'Ngozi', lastName: 'Okafor', gender: 'F', roleId: 'role-006', phone: '08066667777', email: 'ngozi.okafor@email.com', memberSince: '2013-09-05', status: 'ACTIVE' },
  { id: 'mem-007', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'M', roleId: 'role-007', phone: '08077778888', email: 'seun.adeyemi@email.com', memberSince: '2015-02-28', status: 'ACTIVE' },
  { id: 'mem-008', firstName: 'Blessing', lastName: 'Nwosu', gender: 'F', roleId: 'role-007', phone: '08088889999', email: 'blessing.nwosu@email.com', memberSince: '2016-07-14', status: 'ACTIVE' },
  { id: 'mem-009', firstName: 'Fatima', lastName: 'Ibrahim', gender: 'F', roleId: 'role-008', phone: '08099990000', email: 'fatima.ibrahim@email.com', memberSince: '2018-04-22', status: 'ACTIVE' },
  { id: 'mem-010', firstName: 'Tunde', lastName: 'Bakare', gender: 'M', roleId: 'role-008', phone: '08010101010', email: 'tunde.bakare@email.com', memberSince: '2017-11-30', status: 'ACTIVE' },
  { id: 'mem-011', firstName: 'Chidinma', lastName: 'Obi', gender: 'F', roleId: 'role-008', phone: '08011111111', email: 'chidinma.obi@email.com', memberSince: '2019-03-18', status: 'ACTIVE' },
  { id: 'mem-012', firstName: 'Abdullahi', lastName: 'Yusuf', gender: 'M', roleId: 'role-008', phone: '08012121212', email: 'abdullahi.y@email.com', memberSince: '2020-08-10', status: 'ACTIVE' },
  { id: 'mem-013', firstName: 'Funke', lastName: 'Adegoke', gender: 'F', roleId: 'role-006', phone: '08013131313', email: 'funke.adegoke@email.com', memberSince: '2015-05-25', status: 'ACTIVE' },
  { id: 'mem-014', firstName: 'Kehinde', lastName: 'Olawale', gender: 'M', roleId: 'role-007', phone: '08014141414', email: 'kehinde.o@email.com', memberSince: '2018-12-01', status: 'ACTIVE' },
  { id: 'mem-015', firstName: 'Amaka', lastName: 'Uzoma', gender: 'F', roleId: 'role-008', phone: '08015151515', email: 'amaka.uzoma@email.com', memberSince: '2021-01-15', status: 'NEW_MEMBER' },
  { id: 'mem-016', firstName: 'Gbenga', lastName: 'Afolabi', gender: 'M', roleId: 'role-008', phone: '08016161616', email: 'gbenga.afolabi@email.com', memberSince: '2022-06-08', status: 'ACTIVE' },
  { id: 'mem-017', firstName: 'Halima', lastName: 'Bello', gender: 'F', roleId: 'role-008', phone: '08017171717', email: 'halima.bello@email.com', memberSince: '2023-02-20', status: 'ACTIVE' },
  { id: 'mem-018', firstName: 'Obinna', lastName: 'Chidi', gender: 'M', roleId: 'role-008', phone: '08018181818', email: 'obinna.chidi@email.com', memberSince: '2023-09-14', status: 'NEW_MEMBER' },
  { id: 'mem-019', firstName: 'Zainab', lastName: 'Usman', gender: 'F', roleId: 'role-008', phone: '08019191919', email: 'zainab.usman@email.com', memberSince: '2024-01-05', status: 'FIRST_TIMER' },
  { id: 'mem-020', firstName: 'Nkechi', lastName: 'Ezeani', gender: 'F', roleId: 'role-008', phone: '08020202020', email: 'nkechi.ezeani@email.com', memberSince: '2024-03-12', status: 'ACTIVE' },
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

async function seedChurch(tenantId: string) {
  console.log('Creating church...')
  
  const existing = await prisma.chu_church.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.chu_church.create({
      data: {
        id: `${tenantId}-${CHURCH.id}`,
        tenantId,
        name: CHURCH.name,
        address: CHURCH.address,
        phone: CHURCH.phone,
        email: CHURCH.email,
        website: CHURCH.website,
        denomination: CHURCH.denomination,
        foundedYear: CHURCH.foundedYear,
        isActive: true,
      }
    })
    console.log(`  Created church: ${CHURCH.name}`)
  }
}

async function seedUnits(tenantId: string) {
  console.log('Creating church units...')
  
  for (const unit of UNITS) {
    const existing = await prisma.chu_church_unit.findFirst({
      where: { tenantId, name: unit.name }
    })
    
    if (!existing) {
      await prisma.chu_church_unit.create({
        data: {
          id: `${tenantId}-${unit.id}`,
          tenantId,
          churchId: `${tenantId}-${CHURCH.id}`,
          name: unit.name,
          type: unit.type,
          capacity: unit.capacity,
          isActive: true,
        }
      })
      console.log(`  Created unit: ${unit.name}`)
    }
  }
}

async function seedMinistries(tenantId: string) {
  console.log('Creating ministries...')
  
  for (const min of MINISTRIES) {
    const existing = await prisma.chu_ministry.findFirst({
      where: { tenantId, code: min.code }
    })
    
    if (!existing) {
      await prisma.chu_ministry.create({
        data: {
          id: `${tenantId}-${min.id}`,
          tenantId,
          name: min.name,
          code: min.code,
          description: min.description,
          isActive: true,
        }
      })
      console.log(`  Created ministry: ${min.name}`)
    }
  }
}

async function seedCellGroups(tenantId: string) {
  console.log('Creating cell groups...')
  
  for (const cell of CELL_GROUPS) {
    const existing = await prisma.chu_cell_group.findFirst({
      where: { tenantId, name: cell.name }
    })
    
    if (!existing) {
      await prisma.chu_cell_group.create({
        data: {
          id: `${tenantId}-${cell.id}`,
          tenantId,
          name: cell.name,
          zone: cell.zone,
          leaderName: cell.leader,
          meetingDay: cell.meetingDay,
          isActive: true,
        }
      })
      console.log(`  Created cell: ${cell.name}`)
    }
  }
}

async function seedRoles(tenantId: string) {
  console.log('Creating roles...')
  
  for (const role of ROLES) {
    const existing = await prisma.chu_role.findFirst({
      where: { tenantId, name: role.name }
    })
    
    if (!existing) {
      await prisma.chu_role.create({
        data: {
          id: `${tenantId}-${role.id}`,
          tenantId,
          name: role.name,
          level: role.level,
          permissions: role.permissions,
          isActive: true,
        }
      })
      console.log(`  Created role: ${role.name}`)
    }
  }
}

async function seedMembers(tenantId: string) {
  console.log('Creating members...')
  
  for (const mem of MEMBERS) {
    const existing = await prisma.chu_member.findFirst({
      where: { tenantId, email: mem.email }
    })
    
    if (!existing) {
      await prisma.chu_member.create({
        data: {
          id: `${tenantId}-${mem.id}`,
          tenantId,
          firstName: mem.firstName,
          lastName: mem.lastName,
          gender: mem.gender,
          phone: mem.phone,
          email: mem.email,
          memberSince: new Date(mem.memberSince),
          status: mem.status,
          isActive: true,
        }
      })
      console.log(`  Created member: ${mem.firstName} ${mem.lastName}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('CHURCH SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Church')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedChurch(tenant.id)
    await seedUnits(tenant.id)
    await seedRoles(tenant.id)
    
    // Step 3: Seed organizational structure
    await seedMinistries(tenant.id)
    await seedCellGroups(tenant.id)
    
    // Step 4: Seed members
    await seedMembers(tenant.id)
    
    console.log('='.repeat(60))
    console.log('CHURCH DEMO SEEDING COMPLETE')
    console.log(`  Church: 1`)
    console.log(`  Units: ${UNITS.length}`)
    console.log(`  Ministries: ${MINISTRIES.length}`)
    console.log(`  Cell Groups: ${CELL_GROUPS.length}`)
    console.log(`  Roles: ${ROLES.length}`)
    console.log(`  Members: ${MEMBERS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
