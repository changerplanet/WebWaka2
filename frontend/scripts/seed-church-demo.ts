/**
 * Demo Seed Script — PHASE D3-C
 * EXECUTION APPROVED
 * 
 * Church Suite - Nigerian Church Demo Data Seeder
 * 
 * Creates demo data for a Nigerian church:
 * - Church configuration
 * - Ministries
 * - Members and cell groups
 * - Events
 * - Tithes and offerings
 * 
 * Run: npx tsx scripts/seed-church-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-church'
const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'

const MINISTRIES = [
  { id: 'min-001', name: 'Worship Ministry', type: 'CHOIR', description: 'Leads praise and worship during services' },
  { id: 'min-002', name: 'Children Ministry', type: 'CHILDREN', description: 'Sunday school and children programs' },
  { id: 'min-003', name: 'Youth Ministry', type: 'YOUTH', description: 'Youth fellowship and empowerment' },
  { id: 'min-004', name: 'Ushering Ministry', type: 'USHERING', description: 'Welcomes and directs members during services' },
  { id: 'min-005', name: 'Media Ministry', type: 'MEDIA', description: 'Handles sound, video, and online streaming' },
  { id: 'min-006', name: 'Welfare Ministry', type: 'WELFARE', description: 'Outreach and member welfare programs' }
]

const CELL_GROUPS = [
  { id: 'cell-001', name: 'Victoria Island Cell', code: 'VI-001', meetingDay: 'WEDNESDAY', address: '15 Adeola Odeku Street, VI', area: 'Victoria Island', hostName: 'Deacon Chukwuemeka Obi' },
  { id: 'cell-002', name: 'Lekki Phase 1 Cell', code: 'LEK-001', meetingDay: 'THURSDAY', address: '42 Admiralty Way, Lekki', area: 'Lekki', hostName: 'Deaconess Blessing Adeyemi' },
  { id: 'cell-003', name: 'Ikeja GRA Cell', code: 'IKJ-001', meetingDay: 'WEDNESDAY', address: '8 Joel Ogunnaike Street, Ikeja', area: 'Ikeja GRA', hostName: 'Elder Francis Okoro' },
  { id: 'cell-004', name: 'Yaba Cell', code: 'YAB-001', meetingDay: 'FRIDAY', address: '25 Herbert Macaulay Way, Yaba', area: 'Yaba', hostName: 'Pastor Mrs. Ngozi Eze' }
]

const MEMBERS = [
  { id: 'mem-001', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'MALE', phone: '08033445566', email: 'seun.adeyemi@email.com', occupation: 'Banker', status: 'WORKER', joinDate: '2020-03-15' },
  { id: 'mem-002', firstName: 'Blessing', lastName: 'Okonkwo', gender: 'FEMALE', phone: '08044556677', email: 'blessing.o@email.com', occupation: 'Entrepreneur', status: 'WORKER', joinDate: '2019-06-20' },
  { id: 'mem-003', firstName: 'Chukwuemeka', lastName: 'Obi', gender: 'MALE', phone: '08055667788', email: 'chukwuemeka.obi@email.com', occupation: 'Lawyer', status: 'WORKER', joinDate: '2018-01-10' },
  { id: 'mem-004', firstName: 'Fatima', lastName: 'Ibrahim', gender: 'FEMALE', phone: '08066778899', email: 'fatima.i@email.com', occupation: 'Teacher', status: 'MEMBER', joinDate: '2021-09-01' },
  { id: 'mem-005', firstName: 'Francis', lastName: 'Okoro', gender: 'MALE', phone: '08077889900', email: 'francis.okoro@email.com', occupation: 'Retired', status: 'WORKER', joinDate: '2015-04-25' },
  { id: 'mem-006', firstName: 'Ngozi', lastName: 'Eze', gender: 'FEMALE', phone: '08088990011', email: 'ngozi.eze@email.com', occupation: 'Pastor', status: 'WORKER', joinDate: '2016-08-12' },
  { id: 'mem-007', firstName: 'Abdulrahman', lastName: 'Yusuf', gender: 'MALE', phone: '08099001122', email: 'abdul.yusuf@email.com', occupation: 'IT Consultant', status: 'MEMBER', joinDate: '2022-02-28' },
  { id: 'mem-008', firstName: 'Chioma', lastName: 'Nwosu', gender: 'FEMALE', phone: '08011223344', email: 'chioma.nwosu@email.com', occupation: 'Student', status: 'MEMBER', joinDate: '2023-01-08' },
  { id: 'mem-009', firstName: 'Tunde', lastName: 'Bakare', gender: 'MALE', phone: '08022334455', email: 'tunde.bakare@email.com', occupation: 'Engineer', status: 'MEMBER', joinDate: '2020-11-15' },
  { id: 'mem-010', firstName: 'Amaka', lastName: 'Okafor', gender: 'FEMALE', phone: '08033445567', email: 'amaka.okafor@email.com', occupation: 'Nurse', status: 'MEMBER', joinDate: '2021-07-20' }
]

const EVENTS = [
  { id: 'evt-001', title: 'Sunday Service', type: 'SERVICE', startDate: '2026-01-19T09:00:00', endDate: '2026-01-19T12:00:00', venue: 'Main Auditorium', status: 'SCHEDULED' },
  { id: 'evt-002', title: 'Bible Study', type: 'SEMINAR', startDate: '2026-01-21T18:00:00', endDate: '2026-01-21T20:00:00', venue: 'Fellowship Hall', status: 'SCHEDULED' },
  { id: 'evt-003', title: 'Annual Thanksgiving Service', type: 'CONFERENCE', startDate: '2026-01-26T10:00:00', endDate: '2026-01-26T14:00:00', venue: 'Main Auditorium', status: 'SCHEDULED' },
  { id: 'evt-004', title: 'Youth Revival Night', type: 'CRUSADE', startDate: '2026-02-07T18:00:00', endDate: '2026-02-07T22:00:00', venue: 'Youth Hall', status: 'DRAFT' },
  { id: 'evt-005', title: 'Workers Meeting', type: 'RETREAT', startDate: '2026-01-25T14:00:00', endDate: '2026-01-25T16:00:00', venue: 'Conference Room', status: 'SCHEDULED' }
]

const TITHES = [
  { id: 'tithe-001', memberId: 'mem-001', amount: 250000, paymentDate: '2026-01-05', paymentMethod: 'BANK_TRANSFER', reference: 'TIT-2026-001' },
  { id: 'tithe-002', memberId: 'mem-002', amount: 180000, paymentDate: '2026-01-05', paymentMethod: 'BANK_TRANSFER', reference: 'TIT-2026-002' },
  { id: 'tithe-003', memberId: 'mem-003', amount: 350000, paymentDate: '2026-01-06', paymentMethod: 'BANK_TRANSFER', reference: 'TIT-2026-003' },
  { id: 'tithe-004', memberId: 'mem-005', amount: 120000, paymentDate: '2026-01-05', paymentMethod: 'CASH', reference: 'TIT-2026-004' },
  { id: 'tithe-005', memberId: 'mem-006', amount: 200000, paymentDate: '2026-01-05', paymentMethod: 'BANK_TRANSFER', reference: 'TIT-2026-005' },
  { id: 'tithe-006', memberId: 'mem-009', amount: 150000, paymentDate: '2026-01-07', paymentMethod: 'USSD', reference: 'TIT-2026-006' }
]

const OFFERINGS = [
  { id: 'off-001', date: '2026-01-05', offeringType: 'GENERAL', amount: 2500000, serviceType: 'SUNDAY_SERVICE', notes: 'First Sunday offering' },
  { id: 'off-002', date: '2026-01-05', offeringType: 'BUILDING_FUND', amount: 850000, serviceType: 'SUNDAY_SERVICE', notes: 'Building project contribution' },
  { id: 'off-003', date: '2026-01-12', offeringType: 'GENERAL', amount: 2100000, serviceType: 'SUNDAY_SERVICE', notes: 'Second Sunday offering' },
  { id: 'off-004', date: '2026-01-12', offeringType: 'MISSIONS', amount: 450000, serviceType: 'SUNDAY_SERVICE', notes: 'Missions support' }
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

async function seedChurch(tenantId: string) {
  console.log('Creating church record...')
  
  const existing = await prisma.chu_church.findFirst({ where: { tenantId } })
  if (existing) {
    console.log('  Church already exists, returning existing...')
    return existing.id
  }
  
  const church = await prisma.chu_church.create({
    data: {
      tenantId,
      name: 'GraceLife Community Church',
      acronym: 'GLCC',
      motto: 'Grace for Life, Life for Grace',
      vision: 'To be a beacon of hope and transformation in Lagos and beyond',
      mission: 'Raising disciples who impact their world through love, faith, and service',
      registrationNo: 'CAC-IT-123456',
      registeredDate: new Date('2010-05-15'),
      headquarters: 'Lekki Phase 1, Lagos',
      address: '25 Grace Boulevard, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '01-3456789',
      email: 'info@gracelifechurch.ng',
      website: 'https://gracelifechurch.ng',
      status: 'ACTIVE',
      createdBy: 'DEMO_SEED_SCRIPT'
    }
  })
  console.log(`  Church created: ${church.id}`)
  return church.id
}

async function seedMinistries(tenantId: string, churchId: string) {
  console.log('Creating ministries...')
  let created = 0
  
  for (const min of MINISTRIES) {
    const existing = await prisma.chu_ministry.findFirst({ where: { id: min.id } })
    if (existing) continue
    
    await prisma.chu_ministry.create({
      data: {
        id: min.id,
        tenantId,
        churchId,
        name: min.name,
        type: min.type as any,
        description: min.description,
        isActive: true,
        createdBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Ministries created: ${created}`)
  return created
}

async function seedCellGroups(tenantId: string, churchId: string) {
  console.log('Creating cell groups...')
  let created = 0
  
  for (const cell of CELL_GROUPS) {
    const existing = await prisma.chu_cell_group.findFirst({ where: { id: cell.id } })
    if (existing) continue
    
    await prisma.chu_cell_group.create({
      data: {
        id: cell.id,
        tenantId,
        churchId,
        name: cell.name,
        code: cell.code,
        meetingDay: cell.meetingDay,
        address: cell.address,
        area: cell.area,
        hostName: cell.hostName,
        status: 'ACTIVE',
        createdBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Cell groups created: ${created}`)
  return created
}

async function seedMembers(tenantId: string, churchId: string) {
  console.log('Creating members...')
  let created = 0
  
  for (const mem of MEMBERS) {
    const existing = await prisma.chu_member.findFirst({ where: { id: mem.id } })
    if (existing) continue
    
    await prisma.chu_member.create({
      data: {
        id: mem.id,
        tenantId,
        churchId,
        firstName: mem.firstName,
        lastName: mem.lastName,
        gender: mem.gender as any,
        phone: mem.phone,
        email: mem.email,
        occupation: mem.occupation,
        status: mem.status as any,
        joinDate: new Date(mem.joinDate),
        registeredBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Members created: ${created}`)
  return created
}

async function seedEvents(tenantId: string, churchId: string) {
  console.log('Creating events...')
  let created = 0
  
  for (const evt of EVENTS) {
    const existing = await prisma.chu_event.findFirst({ where: { id: evt.id } })
    if (existing) continue
    
    await prisma.chu_event.create({
      data: {
        id: evt.id,
        tenantId,
        churchId,
        title: evt.title,
        type: evt.type,
        startDate: new Date(evt.startDate),
        endDate: new Date(evt.endDate),
        venue: evt.venue,
        status: evt.status as any,
        createdBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Events created: ${created}`)
  return created
}

async function seedTithes(tenantId: string, churchId: string) {
  console.log('Creating tithes...')
  let created = 0
  
  for (const tithe of TITHES) {
    const existing = await prisma.chu_giving_tithe_fact.findFirst({ where: { id: tithe.id } })
    if (existing) continue
    
    await prisma.chu_giving_tithe_fact.create({
      data: {
        id: tithe.id,
        tenantId,
        churchId,
        memberId: tithe.memberId,
        amount: tithe.amount,
        currency: 'NGN',
        givingPeriod: '2026-01',
        givenMethod: tithe.paymentMethod,
        notes: tithe.reference,
        recordedBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Tithes created: ${created}`)
  return created
}

async function seedOfferings(tenantId: string, churchId: string) {
  console.log('Creating offerings...')
  let created = 0
  
  for (const off of OFFERINGS) {
    const existing = await prisma.chu_giving_offering_fact.findFirst({ where: { id: off.id } })
    if (existing) continue
    
    await prisma.chu_giving_offering_fact.create({
      data: {
        id: off.id,
        tenantId,
        churchId,
        offeringType: off.offeringType,
        amount: off.amount,
        currency: 'NGN',
        givenMethod: 'CASH',
        notes: off.notes,
        recordedBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  console.log(`  Offerings created: ${created}`)
  return created
}

async function main() {
  console.log('='.repeat(60))
  console.log('CHURCH SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Church')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    
    const churchId = await seedChurch(tenant.id)
    const ministries = await seedMinistries(tenant.id, churchId)
    const cells = await seedCellGroups(tenant.id, churchId)
    const members = await seedMembers(tenant.id, churchId)
    const events = await seedEvents(tenant.id, churchId)
    const tithes = await seedTithes(tenant.id, churchId)
    const offerings = await seedOfferings(tenant.id, churchId)
    
    console.log('='.repeat(60))
    console.log('CHURCH DEMO SEEDING COMPLETE')
    console.log(`  Church: 1`)
    console.log(`  Ministries: ${ministries}`)
    console.log(`  Cell Groups: ${cells}`)
    console.log(`  Members: ${members}`)
    console.log(`  Events: ${events}`)
    console.log(`  Tithes: ${tithes}`)
    console.log(`  Offerings: ${offerings}`)
    console.log(`  TOTAL: ${1 + ministries + cells + members + events + tithes + offerings}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
