/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Political Suite - Nigerian Political Organization Demo Data Seeder
 * 
 * Creates demo data for a Nigerian political organization:
 * - Party structure
 * - Party organs
 * - Members with Nigerian names
 * - Campaigns and candidates
 * - Donations
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-political-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-political'

// =============================================================================
// PARTY CONFIGURATION
// =============================================================================

const PARTY = {
  id: 'party-001',
  name: 'Progressive Democratic Alliance',
  acronym: 'PDA',
  motto: 'Unity, Progress, Prosperity',
  founded: '2018-03-15',
  headquarters: '25 Political Avenue, Ikeja, Lagos',
  phone: '08001234567',
  email: 'info@pdanigeria.org',
  website: 'www.pdanigeria.org',
}

// =============================================================================
// PARTY ORGANS (ORGANIZATIONAL STRUCTURE)
// =============================================================================

const ORGANS = [
  { id: 'organ-001', name: 'National Executive Committee', code: 'NEC', level: 'NATIONAL', description: 'Highest decision-making body' },
  { id: 'organ-002', name: 'National Working Committee', code: 'NWC', level: 'NATIONAL', description: 'Day-to-day party administration' },
  { id: 'organ-003', name: 'Lagos State Executive', code: 'LAG-SEC', level: 'STATE', description: 'Lagos State party leadership' },
  { id: 'organ-004', name: 'Ikeja LGA Executive', code: 'IKJ-LGA', level: 'LGA', description: 'Ikeja Local Government chapter' },
  { id: 'organ-005', name: 'Lekki Ward Executive', code: 'LKK-WRD', level: 'WARD', description: 'Lekki Ward chapter' },
  { id: 'organ-006', name: 'Youth Wing', code: 'YOUTH', level: 'WING', description: 'Youth mobilization and engagement' },
  { id: 'organ-007', name: 'Women Wing', code: 'WOMEN', level: 'WING', description: 'Women participation and empowerment' },
]

// =============================================================================
// MEMBERS (Nigerian Political Actors)
// =============================================================================

const MEMBERS = [
  { id: 'mem-001', firstName: 'Chief', lastName: 'Emeka Amadi', gender: 'M', role: 'National Chairman', organId: 'organ-002', phone: '08011112222', email: 'chairman@pdanigeria.org', memberSince: '2018-03-15', status: 'ACTIVE' },
  { id: 'mem-002', firstName: 'Alhaji', lastName: 'Musa Danladi', gender: 'M', role: 'National Secretary', organId: 'organ-002', phone: '08022223333', email: 'secretary@pdanigeria.org', memberSince: '2018-03-15', status: 'ACTIVE' },
  { id: 'mem-003', firstName: 'Mrs.', lastName: 'Adaeze Okonkwo', gender: 'F', role: 'National Treasurer', organId: 'organ-002', phone: '08033334444', email: 'treasurer@pdanigeria.org', memberSince: '2018-04-20', status: 'ACTIVE' },
  { id: 'mem-004', firstName: 'Chief', lastName: 'Oluwaseun Adeyemi', gender: 'M', role: 'Lagos State Chairman', organId: 'organ-003', phone: '08044445555', email: 'lagos.chair@pdanigeria.org', memberSince: '2018-06-10', status: 'ACTIVE' },
  { id: 'mem-005', firstName: 'Dr.', lastName: 'Ngozi Eze', gender: 'F', role: 'Lagos State Secretary', organId: 'organ-003', phone: '08055556666', email: 'lagos.sec@pdanigeria.org', memberSince: '2018-06-10', status: 'ACTIVE' },
  { id: 'mem-006', firstName: 'Hon.', lastName: 'Chukwuemeka Nnamdi', gender: 'M', role: 'Youth Leader', organId: 'organ-006', phone: '08066667777', email: 'youth@pdanigeria.org', memberSince: '2019-01-15', status: 'ACTIVE' },
  { id: 'mem-007', firstName: 'Mrs.', lastName: 'Blessing Nwosu', gender: 'F', role: 'Women Leader', organId: 'organ-007', phone: '08077778888', email: 'women@pdanigeria.org', memberSince: '2019-02-20', status: 'ACTIVE' },
  { id: 'mem-008', firstName: 'Barr.', lastName: 'Tunde Bakare', gender: 'M', role: 'Legal Adviser', organId: 'organ-002', phone: '08088889999', email: 'legal@pdanigeria.org', memberSince: '2018-05-12', status: 'ACTIVE' },
  { id: 'mem-009', firstName: 'Engr.', lastName: 'Abdullahi Yusuf', gender: 'M', role: 'Ward Chairman', organId: 'organ-005', phone: '08099990000', email: 'abdullahi.y@email.com', memberSince: '2019-08-10', status: 'ACTIVE' },
  { id: 'mem-010', firstName: 'Mr.', lastName: 'Kehinde Olawale', gender: 'M', role: 'Publicity Secretary', organId: 'organ-003', phone: '08010101010', email: 'kehinde.o@email.com', memberSince: '2020-03-05', status: 'ACTIVE' },
  { id: 'mem-011', firstName: 'Mrs.', lastName: 'Fatima Ibrahim', gender: 'F', role: 'Financial Secretary', organId: 'organ-003', phone: '08011111111', email: 'fatima.i@email.com', memberSince: '2020-06-18', status: 'ACTIVE' },
  { id: 'mem-012', firstName: 'Mr.', lastName: 'Gbenga Afolabi', gender: 'M', role: 'Member', organId: null, phone: '08012121212', email: 'gbenga.a@email.com', memberSince: '2021-01-10', status: 'ACTIVE' },
  { id: 'mem-013', firstName: 'Miss', lastName: 'Chidinma Obi', gender: 'F', role: 'Member', organId: null, phone: '08013131313', email: 'chidinma.o@email.com', memberSince: '2021-05-22', status: 'ACTIVE' },
  { id: 'mem-014', firstName: 'Mr.', lastName: 'Obinna Chidi', gender: 'M', role: 'Member', organId: null, phone: '08014141414', email: 'obinna.c@email.com', memberSince: '2022-02-14', status: 'ACTIVE' },
  { id: 'mem-015', firstName: 'Mrs.', lastName: 'Zainab Usman', gender: 'F', role: 'Member', organId: null, phone: '08015151515', email: 'zainab.u@email.com', memberSince: '2023-03-28', status: 'ACTIVE' },
]

// =============================================================================
// CAMPAIGNS
// =============================================================================

const CAMPAIGNS = [
  { id: 'camp-001', name: '2027 Gubernatorial Campaign', type: 'GUBERNATORIAL', state: 'Lagos', startDate: '2026-06-01', endDate: '2027-03-15', status: 'PLANNING', budget: 500000000 },
  { id: 'camp-002', name: '2027 House of Assembly Campaign', type: 'STATE_ASSEMBLY', state: 'Lagos', startDate: '2026-08-01', endDate: '2027-03-15', status: 'PLANNING', budget: 50000000 },
  { id: 'camp-003', name: '2025 Local Government Election', type: 'LGA', state: 'Lagos', startDate: '2025-03-01', endDate: '2025-07-15', status: 'ACTIVE', budget: 25000000 },
  { id: 'camp-004', name: 'Voter Registration Drive 2025', type: 'REGISTRATION', state: 'Lagos', startDate: '2025-01-01', endDate: '2025-06-30', status: 'ACTIVE', budget: 10000000 },
]

// =============================================================================
// CANDIDATES
// =============================================================================

const CANDIDATES = [
  { id: 'cand-001', memberId: 'mem-004', campaignId: 'camp-001', position: 'Governor', constituency: 'Lagos State', status: 'ASPIRANT' },
  { id: 'cand-002', memberId: 'mem-006', campaignId: 'camp-002', position: 'House of Assembly', constituency: 'Ikeja I', status: 'NOMINATED' },
  { id: 'cand-003', memberId: 'mem-009', campaignId: 'camp-003', position: 'LGA Chairman', constituency: 'Ikeja LGA', status: 'NOMINATED' },
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

async function seedParty(tenantId: string) {
  console.log('Creating party...')
  
  const existing = await prisma.pol_party.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.pol_party.create({
      data: {
        id: `${tenantId}-${PARTY.id}`,
        tenantId,
        name: PARTY.name,
        acronym: PARTY.acronym,
        motto: PARTY.motto,
        founded: new Date(PARTY.founded),
        headquarters: PARTY.headquarters,
        phone: PARTY.phone,
        email: PARTY.email,
        website: PARTY.website,
        isActive: true,
      }
    })
    console.log(`  Created party: ${PARTY.name} (${PARTY.acronym})`)
  }
}

async function seedOrgans(tenantId: string) {
  console.log('Creating party organs...')
  
  for (const organ of ORGANS) {
    const existing = await prisma.pol_party_organ.findFirst({
      where: { tenantId, code: organ.code }
    })
    
    if (!existing) {
      await prisma.pol_party_organ.create({
        data: {
          id: `${tenantId}-${organ.id}`,
          tenantId,
          partyId: `${tenantId}-${PARTY.id}`,
          name: organ.name,
          code: organ.code,
          level: organ.level,
          description: organ.description,
          isActive: true,
        }
      })
      console.log(`  Created organ: ${organ.name}`)
    }
  }
}

async function seedMembers(tenantId: string) {
  console.log('Creating members...')
  
  for (const mem of MEMBERS) {
    const existing = await prisma.pol_member.findFirst({
      where: { tenantId, email: mem.email }
    })
    
    if (!existing) {
      await prisma.pol_member.create({
        data: {
          id: `${tenantId}-${mem.id}`,
          tenantId,
          partyId: `${tenantId}-${PARTY.id}`,
          firstName: mem.firstName,
          lastName: mem.lastName,
          gender: mem.gender,
          role: mem.role,
          organId: mem.organId ? `${tenantId}-${mem.organId}` : null,
          phone: mem.phone,
          email: mem.email,
          memberSince: new Date(mem.memberSince),
          status: mem.status,
          isActive: true,
        }
      })
      console.log(`  Created member: ${mem.firstName} ${mem.lastName} (${mem.role})`)
    }
  }
}

async function seedCampaigns(tenantId: string) {
  console.log('Creating campaigns...')
  
  for (const camp of CAMPAIGNS) {
    const existing = await prisma.pol_campaign.findFirst({
      where: { tenantId, name: camp.name }
    })
    
    if (!existing) {
      await prisma.pol_campaign.create({
        data: {
          id: `${tenantId}-${camp.id}`,
          tenantId,
          partyId: `${tenantId}-${PARTY.id}`,
          name: camp.name,
          type: camp.type,
          state: camp.state,
          startDate: new Date(camp.startDate),
          endDate: new Date(camp.endDate),
          status: camp.status,
          budget: camp.budget,
          currency: 'NGN',
        }
      })
      console.log(`  Created campaign: ${camp.name}`)
    }
  }
}

async function seedCandidates(tenantId: string) {
  console.log('Creating candidates...')
  
  for (const cand of CANDIDATES) {
    const existing = await prisma.pol_candidate.findFirst({
      where: { 
        tenantId, 
        memberId: `${tenantId}-${cand.memberId}`,
        campaignId: `${tenantId}-${cand.campaignId}`
      }
    })
    
    if (!existing) {
      await prisma.pol_candidate.create({
        data: {
          id: `${tenantId}-${cand.id}`,
          tenantId,
          memberId: `${tenantId}-${cand.memberId}`,
          campaignId: `${tenantId}-${cand.campaignId}`,
          position: cand.position,
          constituency: cand.constituency,
          status: cand.status,
        }
      })
      console.log(`  Created candidate: ${cand.position} - ${cand.constituency}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('POLITICAL SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Political Organization')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedParty(tenant.id)
    await seedOrgans(tenant.id)
    
    // Step 3: Seed members
    await seedMembers(tenant.id)
    
    // Step 4: Seed campaigns and candidates
    await seedCampaigns(tenant.id)
    await seedCandidates(tenant.id)
    
    console.log('='.repeat(60))
    console.log('POLITICAL DEMO SEEDING COMPLETE')
    console.log(`  Party: 1`)
    console.log(`  Organs: ${ORGANS.length}`)
    console.log(`  Members: ${MEMBERS.length}`)
    console.log(`  Campaigns: ${CAMPAIGNS.length}`)
    console.log(`  Candidates: ${CANDIDATES.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
