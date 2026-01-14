/**
 * Demo Seed Script — PHASE D3-C
 * EXECUTION APPROVED
 * 
 * Political Suite - Nigerian Political Campaign Demo Data Seeder
 * 
 * Creates demo data for a Nigerian political campaign:
 * - Party and campaign configuration
 * - Candidates
 * - Party members
 * - Donations
 * - Campaign events
 * 
 * Run: npx tsx scripts/seed-political-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-political'
const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'

const PARTY = {
  id: 'party-001',
  name: 'All Progressive Movement',
  abbreviation: 'APM',
  slogan: 'Progress for All',
  ideology: 'Progressive',
  foundedDate: '2022-03-15',
  headquarters: '15 Campaign Road, Alausa, Ikeja, Lagos',
  phone: '01-7654321',
  email: 'info@apm-lagos.ng',
  website: 'https://apm-lagos.ng'
}

const CAMPAIGN = {
  id: 'camp-001',
  name: 'Lagos State 2027 Gubernatorial Campaign',
  electionType: 'GUBERNATORIAL',
  position: 'Governor of Lagos State',
  constituency: 'Lagos State',
  electionDate: '2027-03-15',
  campaignStart: '2026-09-01',
  campaignEnd: '2027-03-12',
  budgetTarget: 5000000000,
  manifesto: 'A new Lagos: Infrastructure, Security, Healthcare, Education, and Economic Empowerment for all Lagosians.'
}

const CANDIDATES = [
  { id: 'cand-001', firstName: 'Oluwasegun', lastName: 'Adeyemi', position: 'Governor', gender: 'MALE', education: 'MBA, Harvard Business School', experience: 'Former Commissioner for Finance', status: 'ACTIVE' },
  { id: 'cand-002', firstName: 'Fatima', lastName: 'Ibrahim', position: 'Deputy Governor', gender: 'FEMALE', education: 'LLM, University of Lagos', experience: 'Senior Advocate of Nigeria', status: 'ACTIVE' },
  { id: 'cand-003', firstName: 'Chukwuemeka', lastName: 'Okonkwo', position: 'Senator - Lagos Central', gender: 'MALE', education: 'PhD Economics, Oxford', experience: 'Former CEO, Access Bank', status: 'ACTIVE' }
]

const MEMBERS = [
  { id: 'pmem-001', firstName: 'Abubakar', lastName: 'Yusuf', phone: '08033445566', ward: 'Eti-Osa Ward 1', lga: 'Eti-Osa', state: 'Lagos', membershipType: 'EXECUTIVE', occupation: 'Businessman' },
  { id: 'pmem-002', firstName: 'Blessing', lastName: 'Okafor', phone: '08044556677', ward: 'Ikeja Ward 3', lga: 'Ikeja', state: 'Lagos', membershipType: 'ORDINARY', occupation: 'Civil Servant' },
  { id: 'pmem-003', firstName: 'Tunde', lastName: 'Bakare', phone: '08055667788', ward: 'Surulere Ward 5', lga: 'Surulere', state: 'Lagos', membershipType: 'PATRON', occupation: 'Industrialist' },
  { id: 'pmem-004', firstName: 'Ngozi', lastName: 'Eze', phone: '08066778899', ward: 'Lekki Ward 2', lga: 'Eti-Osa', state: 'Lagos', membershipType: 'EXECUTIVE', occupation: 'Lawyer' },
  { id: 'pmem-005', firstName: 'Abdulrahman', lastName: 'Mohammed', phone: '08077889900', ward: 'Kosofe Ward 4', lga: 'Kosofe', state: 'Lagos', membershipType: 'ORDINARY', occupation: 'Teacher' },
  { id: 'pmem-006', firstName: 'Chioma', lastName: 'Nwosu', phone: '08088990011', ward: 'Yaba Ward 1', lga: 'Mainland', state: 'Lagos', membershipType: 'ORDINARY', occupation: 'Nurse' },
  { id: 'pmem-007', firstName: 'Olumide', lastName: 'Adebayo', phone: '08099001122', ward: 'Ikorodu Ward 6', lga: 'Ikorodu', state: 'Lagos', membershipType: 'EXECUTIVE', occupation: 'Contractor' },
  { id: 'pmem-008', firstName: 'Halima', lastName: 'Suleiman', phone: '08011223344', ward: 'Badagry Ward 2', lga: 'Badagry', state: 'Lagos', membershipType: 'ORDINARY', occupation: 'Trader' }
]

const DONATIONS = [
  { id: 'don-001', memberId: 'pmem-003', amount: 50000000, paymentDate: '2026-01-05', purpose: 'CAMPAIGN', status: 'RECEIVED', paymentMethod: 'BANK_TRANSFER' },
  { id: 'don-002', memberId: 'pmem-001', amount: 25000000, paymentDate: '2026-01-08', purpose: 'CAMPAIGN', status: 'RECEIVED', paymentMethod: 'BANK_TRANSFER' },
  { id: 'don-003', memberId: 'pmem-004', amount: 10000000, paymentDate: '2026-01-10', purpose: 'MEDIA', status: 'RECEIVED', paymentMethod: 'BANK_TRANSFER' },
  { id: 'don-004', memberId: 'pmem-007', amount: 15000000, paymentDate: '2026-01-12', purpose: 'RALLY', status: 'RECEIVED', paymentMethod: 'CASH' },
  { id: 'don-005', donorName: 'Lagos Business Coalition', donorPhone: '01-8765432', amount: 100000000, purpose: 'GENERAL', status: 'PLEDGED' },
  { id: 'don-006', memberId: 'pmem-002', amount: 500000, paymentDate: '2026-01-15', purpose: 'GENERAL', status: 'RECEIVED', paymentMethod: 'USSD' }
]

const EVENTS = [
  { id: 'pevt-001', name: 'Campaign Flag-Off Rally', eventType: 'RALLY', venue: 'Tafawa Balewa Square', city: 'Lagos', state: 'Lagos', startDate: '2026-09-15T10:00:00', expectedAttendance: 50000, budgetAllocated: 150000000, status: 'PLANNED' },
  { id: 'pevt-002', name: 'Gubernatorial Debate', eventType: 'DEBATE', venue: 'Eko Hotel Convention Center', city: 'Lagos', state: 'Lagos', startDate: '2027-01-20T18:00:00', expectedAttendance: 2000, budgetAllocated: 25000000, status: 'PLANNED' },
  { id: 'pevt-003', name: 'Town Hall Meeting - Ikeja', eventType: 'TOWN_HALL', venue: 'Ikeja City Mall Event Center', city: 'Ikeja', state: 'Lagos', startDate: '2026-10-05T14:00:00', expectedAttendance: 500, budgetAllocated: 5000000, status: 'PLANNED' },
  { id: 'pevt-004', name: 'Women\'s Forum', eventType: 'MEETING', venue: 'Lagos Women Development Center', city: 'Lagos', state: 'Lagos', startDate: '2026-11-12T10:00:00', expectedAttendance: 300, budgetAllocated: 3000000, status: 'PLANNED' },
  { id: 'pevt-005', name: 'Youth Empowerment Summit', eventType: 'MEETING', venue: 'University of Lagos Main Hall', city: 'Lagos', state: 'Lagos', startDate: '2026-12-01T09:00:00', expectedAttendance: 1000, budgetAllocated: 10000000, status: 'PLANNED' },
  { id: 'pevt-006', name: 'Press Conference - Manifesto Launch', eventType: 'PRESS_CONFERENCE', venue: 'Radisson Blu Hotel', city: 'Lagos', state: 'Lagos', startDate: '2026-09-20T11:00:00', expectedAttendance: 200, budgetAllocated: 8000000, status: 'PLANNED' }
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
  console.log('Creating political configuration...')
  
  const existing = await prisma.political_config.findFirst({ where: { tenantId } })
  if (existing) {
    console.log('  Config already exists, skipping...')
    return
  }
  
  await prisma.political_config.create({
    data: {
      tenantId,
      partnerId: DEMO_PARTNER_ID,
      organizationName: 'Lagos Campaign HQ',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      donationMinimum: 1000,
      enableAnonymousDonations: false,
      headquarters: '15 Campaign Road, Alausa, Ikeja, Lagos',
      phone: '01-7654321',
      email: 'hq@lagos-campaign.ng',
      website: 'https://lagos-campaign.ng'
    }
  })
  console.log('  Config created')
}

async function seedParty(tenantId: string) {
  console.log('Creating party...')
  
  const existing = await prisma.political_party.findFirst({ where: { id: PARTY.id } })
  if (existing) {
    console.log('  Party already exists, returning existing...')
    return PARTY.id
  }
  
  await prisma.political_party.create({
    data: {
      id: PARTY.id,
      tenantId,
      partnerId: DEMO_PARTNER_ID,
      name: PARTY.name,
      abbreviation: PARTY.abbreviation,
      slogan: PARTY.slogan,
      ideology: PARTY.ideology,
      foundedDate: new Date(PARTY.foundedDate),
      headquarters: PARTY.headquarters,
      phone: PARTY.phone,
      email: PARTY.email,
      website: PARTY.website,
      status: 'ACTIVE'
    }
  })
  console.log('  Party created')
  return PARTY.id
}

async function seedCampaign(tenantId: string, partyId: string) {
  console.log('Creating campaign...')
  
  const existing = await prisma.political_campaign.findFirst({ where: { id: CAMPAIGN.id } })
  if (existing) {
    console.log('  Campaign already exists, returning existing...')
    return CAMPAIGN.id
  }
  
  await prisma.political_campaign.create({
    data: {
      id: CAMPAIGN.id,
      tenantId,
      partnerId: DEMO_PARTNER_ID,
      partyId,
      name: CAMPAIGN.name,
      electionType: CAMPAIGN.electionType,
      position: CAMPAIGN.position,
      constituency: CAMPAIGN.constituency,
      electionDate: new Date(CAMPAIGN.electionDate),
      campaignStart: new Date(CAMPAIGN.campaignStart),
      campaignEnd: new Date(CAMPAIGN.campaignEnd),
      budgetTarget: CAMPAIGN.budgetTarget,
      manifesto: CAMPAIGN.manifesto,
      status: 'PLANNING'
    }
  })
  console.log('  Campaign created')
  return CAMPAIGN.id
}

async function seedCandidates(tenantId: string, partyId: string, campaignId: string) {
  console.log('Creating candidates...')
  let created = 0
  
  for (const cand of CANDIDATES) {
    const existing = await prisma.political_candidate.findFirst({ where: { id: cand.id } })
    if (existing) continue
    
    await prisma.political_candidate.create({
      data: {
        id: cand.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        partyId,
        campaignId,
        firstName: cand.firstName,
        lastName: cand.lastName,
        gender: cand.gender,
        position: cand.position,
        education: cand.education,
        experience: cand.experience,
        status: cand.status
      }
    })
    created++
  }
  console.log(`  Candidates created: ${created}`)
  return created
}

async function seedMembers(tenantId: string, partyId: string) {
  console.log('Creating party members...')
  let created = 0
  
  for (const mem of MEMBERS) {
    const existing = await prisma.political_member.findFirst({ where: { id: mem.id } })
    if (existing) continue
    
    await prisma.political_member.create({
      data: {
        id: mem.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        partyId,
        firstName: mem.firstName,
        lastName: mem.lastName,
        phone: mem.phone,
        ward: mem.ward,
        lga: mem.lga,
        state: mem.state,
        membershipType: mem.membershipType,
        occupation: mem.occupation,
        status: 'ACTIVE'
      }
    })
    created++
  }
  console.log(`  Members created: ${created}`)
  return created
}

async function seedDonations(tenantId: string, campaignId: string) {
  console.log('Creating donations...')
  let created = 0
  
  for (const don of DONATIONS) {
    const existing = await prisma.political_donation.findFirst({ where: { id: don.id } })
    if (existing) continue
    
    await prisma.political_donation.create({
      data: {
        id: don.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        campaignId,
        memberId: don.memberId || null,
        donorName: don.donorName || null,
        donorPhone: don.donorPhone || null,
        amount: don.amount,
        currency: 'NGN',
        donationType: 'CASH',
        paymentDate: don.paymentDate ? new Date(don.paymentDate) : null,
        paymentMethod: don.paymentMethod || null,
        purpose: don.purpose,
        status: don.status
      }
    })
    created++
  }
  console.log(`  Donations created: ${created}`)
  return created
}

async function seedEvents(tenantId: string, campaignId: string) {
  console.log('Creating events...')
  let created = 0
  
  for (const evt of EVENTS) {
    const existing = await prisma.political_event.findFirst({ where: { id: evt.id } })
    if (existing) continue
    
    await prisma.political_event.create({
      data: {
        id: evt.id,
        tenantId,
        partnerId: DEMO_PARTNER_ID,
        campaignId,
        name: evt.name,
        eventType: evt.eventType,
        venue: evt.venue,
        city: evt.city,
        state: evt.state,
        startDate: new Date(evt.startDate),
        expectedAttendance: evt.expectedAttendance,
        budgetAllocated: evt.budgetAllocated,
        status: evt.status
      }
    })
    created++
  }
  console.log(`  Events created: ${created}`)
  return created
}

async function main() {
  console.log('='.repeat(60))
  console.log('POLITICAL SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Political Campaign')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    
    await seedConfig(tenant.id)
    const partyId = await seedParty(tenant.id)
    const campaignId = await seedCampaign(tenant.id, partyId)
    const candidates = await seedCandidates(tenant.id, partyId, campaignId)
    const members = await seedMembers(tenant.id, partyId)
    const donations = await seedDonations(tenant.id, campaignId)
    const events = await seedEvents(tenant.id, campaignId)
    
    console.log('='.repeat(60))
    console.log('POLITICAL DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Party: 1`)
    console.log(`  Campaign: 1`)
    console.log(`  Candidates: ${candidates}`)
    console.log(`  Members: ${members}`)
    console.log(`  Donations: ${donations}`)
    console.log(`  Events: ${events}`)
    console.log(`  TOTAL: ${3 + candidates + members + donations + events}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
