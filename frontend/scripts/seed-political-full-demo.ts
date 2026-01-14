/**
 * Political Suite - Full Demo Data Seeder
 * Nigerian Context - Lagos Progressive Alliance
 * 
 * Creates comprehensive demo data for political party management:
 * - 1 Party (Lagos Progressive Alliance)
 * - 2 Campaigns (Governorship, Local Government)
 * - 35 Members (Nigerian names, various wards)
 * - 25 Volunteers (linked to campaigns/members)
 * - 6 Events (rallies, town halls, canvassing)
 * - 25 Donations (various amounts in NGN)
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-political-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-political'

const LAGOS_LGAS = [
  'Ikeja', 'Eti-Osa', 'Surulere', 'Alimosho', 'Kosofe',
  'Lagos Island', 'Lagos Mainland', 'Mushin', 'Oshodi-Isolo', 'Agege',
  'Ifako-Ijaiye', 'Ajeromi-Ifelodun', 'Amuwo-Odofin', 'Apapa', 'Badagry',
  'Epe', 'Ibeju-Lekki', 'Ikorodu', 'Ojo', 'Somolu'
]

const LAGOS_WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  'Ward 11', 'Ward 12', 'Ward 13', 'Ward 14', 'Ward 15'
]

const NIGERIAN_FIRST_NAMES_MALE = [
  'Adebayo', 'Chukwuemeka', 'Olumide', 'Obinna', 'Tunde', 'Yusuf', 'Ibrahim',
  'Emeka', 'Segun', 'Kola', 'Femi', 'Dayo', 'Chidi', 'Uche', 'Obi',
  'Taiwo', 'Kehinde', 'Babatunde', 'Adekunle', 'Gbenga', 'Wale', 'Sola',
  'Nnamdi', 'Kingsley', 'Chijioke', 'Ikenna', 'Nnanna', 'Aminu', 'Abdullahi'
]

const NIGERIAN_FIRST_NAMES_FEMALE = [
  'Adaeze', 'Ngozi', 'Funke', 'Bisi', 'Yetunde', 'Amina', 'Fatima',
  'Chidinma', 'Nneka', 'Oluchi', 'Adebimpe', 'Folake', 'Titilayo', 'Bukola',
  'Ebere', 'Ifeoma', 'Chiamaka', 'Zainab', 'Hadiza', 'Aisha'
]

const NIGERIAN_LAST_NAMES = [
  'Adeyemi', 'Okonkwo', 'Okafor', 'Ibrahim', 'Mohammed', 'Balogun', 'Akinwale',
  'Eze', 'Nwosu', 'Okoro', 'Adeleke', 'Fashola', 'Sanusi', 'Ogundimu',
  'Nnamdi', 'Uzoma', 'Chukwu', 'Lawal', 'Abubakar', 'Danjuma', 'Ogundele',
  'Oyelaran', 'Oyedeji', 'Akintola', 'Afolabi', 'Oladipo', 'Adekoya', 'Bamgbose',
  'Osagie', 'Ezeala', 'Igwe', 'Onwueme', 'Achebe', 'Ikemefuna', 'Okorie'
]

const VOLUNTEER_ROLES = [
  'CANVASSER', 'COORDINATOR', 'POLL_AGENT', 'DRIVER', 'SECURITY', 'MEDIA', 'LOGISTICS', 'ADMIN'
] as const

const EVENT_TYPES = [
  'RALLY', 'TOWN_HALL', 'DOOR_TO_DOOR', 'STAKEHOLDER_MEETING', 'MEDIA_APPEARANCE', 'FUNDRAISER'
] as const

const DONATION_SOURCES = [
  'INDIVIDUAL', 'CORPORATE', 'PARTY_FUND', 'SELF_FUNDING', 'IN_KIND'
] as const

function generateNigerianPhone(): string {
  const prefixes = ['0803', '0805', '0806', '0807', '0808', '0809', '0810', '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `${prefix}${number}`
}

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateMembershipNo(index: number): string {
  return `LPA-${new Date().getFullYear()}-${String(index + 1).padStart(5, '0')}`
}

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

async function seedParty(tenantId: string): Promise<string> {
  console.log('Creating political party...')
  
  const partyId = `${tenantId}-party-lpa`
  
  const existing = await prisma.pol_party.findUnique({
    where: { id: partyId }
  })
  
  if (!existing) {
    await prisma.pol_party.create({
      data: {
        id: partyId,
        tenantId,
        name: 'Lagos Progressive Alliance',
        acronym: 'LPA',
        registrationNo: 'INEC/REG/2024/LPA-001',
        motto: 'Progress for All',
        slogan: 'Building Lagos Together',
        primaryColor: '#1E40AF',
        secondaryColor: '#10B981',
        status: 'ACTIVE',
        foundedDate: new Date('2020-03-15'),
        registeredDate: new Date('2020-06-20'),
        headquarters: '45 Awolowo Road, Ikoyi, Lagos',
        phone: '08012345678',
        email: 'info@lagosprogressive.org',
        website: 'https://lagosprogressive.org',
        country: 'NG',
        createdBy: 'system-seed'
      }
    })
    console.log('  Created party: Lagos Progressive Alliance (LPA)')
  } else {
    console.log('  Party exists: Lagos Progressive Alliance')
  }
  
  return partyId
}

async function seedCampaigns(tenantId: string, partyId: string): Promise<{ govCampaignId: string; lgCampaignId: string }> {
  console.log('Creating campaigns...')
  
  const govCampaignId = `${tenantId}-campaign-gov-2027`
  const lgCampaignId = `${tenantId}-campaign-lg-2026`
  
  const existingGov = await prisma.pol_campaign.findUnique({ where: { id: govCampaignId } })
  if (!existingGov) {
    await prisma.pol_campaign.create({
      data: {
        id: govCampaignId,
        tenantId,
        partyId,
        name: 'Lagos 2027 Governorship Campaign',
        description: 'Campaign for the 2027 Lagos State Governorship Election',
        type: 'GUBERNATORIAL',
        country: 'NG',
        state: 'Lagos',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-03-15'),
        electionDate: new Date('2027-03-11'),
        status: 'ACTIVE',
        headquarters: '25 Isaac John Street, GRA Ikeja, Lagos',
        phone: '08023456789',
        email: 'gov2027@lagosprogressive.org',
        createdBy: 'system-seed'
      }
    })
    console.log('  Created campaign: Lagos 2027 Governorship Campaign')
  } else {
    console.log('  Campaign exists: Lagos 2027 Governorship Campaign')
  }
  
  const existingLg = await prisma.pol_campaign.findUnique({ where: { id: lgCampaignId } })
  if (!existingLg) {
    await prisma.pol_campaign.create({
      data: {
        id: lgCampaignId,
        tenantId,
        partyId,
        name: 'Ikeja LG Chairman Campaign 2026',
        description: 'Campaign for Ikeja Local Government Chairmanship Election 2026',
        type: 'LOCAL_GOVERNMENT',
        country: 'NG',
        state: 'Lagos',
        lga: 'Ikeja',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-07-20'),
        electionDate: new Date('2026-07-15'),
        status: 'ACTIVE',
        headquarters: '12 Obafemi Awolowo Way, Ikeja, Lagos',
        phone: '08034567890',
        email: 'ikeja2026@lagosprogressive.org',
        createdBy: 'system-seed'
      }
    })
    console.log('  Created campaign: Ikeja LG Chairman Campaign 2026')
  } else {
    console.log('  Campaign exists: Ikeja LG Chairman Campaign 2026')
  }
  
  return { govCampaignId, lgCampaignId }
}

async function seedMembers(tenantId: string, partyId: string): Promise<string[]> {
  console.log('Creating 35 party members...')
  
  const memberIds: string[] = []
  const allFirstNames = [...NIGERIAN_FIRST_NAMES_MALE, ...NIGERIAN_FIRST_NAMES_FEMALE]
  
  for (let i = 0; i < 35; i++) {
    const memberId = `${tenantId}-member-${String(i + 1).padStart(3, '0')}`
    const isMale = i < 20
    const firstName = isMale 
      ? NIGERIAN_FIRST_NAMES_MALE[i % NIGERIAN_FIRST_NAMES_MALE.length]
      : NIGERIAN_FIRST_NAMES_FEMALE[(i - 20) % NIGERIAN_FIRST_NAMES_FEMALE.length]
    const lastName = NIGERIAN_LAST_NAMES[i % NIGERIAN_LAST_NAMES.length]
    const lga = LAGOS_LGAS[i % LAGOS_LGAS.length]
    const ward = LAGOS_WARDS[i % LAGOS_WARDS.length]
    const phone = generateNigerianPhone()
    
    const existing = await prisma.pol_member.findUnique({ where: { id: memberId } })
    
    if (!existing) {
      const roles: Array<'MEMBER' | 'EXECUTIVE' | 'DELEGATE' | 'AGENT' | 'CANDIDATE'> = ['MEMBER', 'EXECUTIVE', 'DELEGATE', 'AGENT', 'CANDIDATE']
      const statuses: Array<'PENDING' | 'VERIFIED'> = ['PENDING', 'VERIFIED']
      
      await prisma.pol_member.create({
        data: {
          id: memberId,
          tenantId,
          partyId,
          firstName,
          lastName,
          otherNames: i % 5 === 0 ? randomItem(allFirstNames) : null,
          dateOfBirth: randomDate(new Date('1960-01-01'), new Date('2000-12-31')),
          gender: isMale ? 'Male' : 'Female',
          phone,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
          address: `${Math.floor(Math.random() * 200) + 1} ${randomItem(['Adeola Odeku', 'Awolowo', 'Allen Avenue', 'Toyin Street', 'Opebi Road', 'Herbert Macaulay'])}, ${lga}, Lagos`,
          state: 'Lagos',
          lga,
          ward,
          pollingUnit: `PU-${lga.substring(0, 3).toUpperCase()}-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
          membershipNo: generateMembershipNo(i),
          registrationDate: randomDate(new Date('2020-06-01'), new Date('2025-12-31')),
          role: i < 5 ? 'EXECUTIVE' : i < 10 ? 'DELEGATE' : i < 15 ? 'AGENT' : 'MEMBER',
          status: i < 30 ? 'VERIFIED' : 'PENDING',
          isVerified: i < 30,
          verifiedAt: i < 30 ? randomDate(new Date('2020-07-01'), new Date('2026-01-01')) : null,
          voterCardNo: `VN${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
          createdBy: 'system-seed'
        }
      })
      console.log(`  Created member ${i + 1}/35: ${firstName} ${lastName} (${lga})`)
    } else {
      console.log(`  Member exists: ${memberId}`)
    }
    
    memberIds.push(memberId)
  }
  
  return memberIds
}

async function seedVolunteers(
  tenantId: string, 
  govCampaignId: string, 
  lgCampaignId: string, 
  memberIds: string[]
): Promise<string[]> {
  console.log('Creating 25 volunteers...')
  
  const volunteerIds: string[] = []
  
  for (let i = 0; i < 25; i++) {
    const volunteerId = `${tenantId}-volunteer-${String(i + 1).padStart(3, '0')}`
    const isMale = i < 15
    const firstName = isMale 
      ? NIGERIAN_FIRST_NAMES_MALE[i % NIGERIAN_FIRST_NAMES_MALE.length]
      : NIGERIAN_FIRST_NAMES_FEMALE[(i - 15) % NIGERIAN_FIRST_NAMES_FEMALE.length]
    const lastName = NIGERIAN_LAST_NAMES[(i + 10) % NIGERIAN_LAST_NAMES.length]
    const campaignId = i < 15 ? govCampaignId : lgCampaignId
    const memberId = i < 20 ? memberIds[i % memberIds.length] : null
    const lga = LAGOS_LGAS[i % LAGOS_LGAS.length]
    const ward = LAGOS_WARDS[i % LAGOS_WARDS.length]
    
    const existing = await prisma.pol_volunteer.findUnique({ where: { id: volunteerId } })
    
    if (!existing) {
      await prisma.pol_volunteer.create({
        data: {
          id: volunteerId,
          tenantId,
          campaignId,
          memberId,
          firstName,
          lastName,
          phone: generateNigerianPhone(),
          email: `${firstName.toLowerCase()}.vol${i}@email.com`,
          role: randomItem(VOLUNTEER_ROLES),
          assignment: randomItem([
            'Door-to-door canvassing in assigned ward',
            'Poll monitoring and reporting',
            'Transportation coordination',
            'Event setup and logistics',
            'Social media management',
            'Voter registration assistance',
            'Community outreach coordination'
          ]),
          state: 'Lagos',
          lga,
          ward,
          availableFrom: new Date('2026-01-01'),
          availableTo: new Date('2027-04-01'),
          isFullTime: i < 5,
          status: 'ACTIVE',
          supervisorName: i > 0 ? `${NIGERIAN_FIRST_NAMES_MALE[0]} ${NIGERIAN_LAST_NAMES[0]}` : null,
          isTrainedAgent: i < 10,
          trainedAt: i < 10 ? randomDate(new Date('2025-06-01'), new Date('2026-01-01')) : null,
          hoursLogged: Math.floor(Math.random() * 200),
          tasksCompleted: Math.floor(Math.random() * 50),
          createdBy: 'system-seed'
        }
      })
      console.log(`  Created volunteer ${i + 1}/25: ${firstName} ${lastName}`)
    } else {
      console.log(`  Volunteer exists: ${volunteerId}`)
    }
    
    volunteerIds.push(volunteerId)
  }
  
  return volunteerIds
}

async function seedEvents(tenantId: string, govCampaignId: string, lgCampaignId: string): Promise<string[]> {
  console.log('Creating 6 campaign events...')
  
  const events = [
    {
      id: `${tenantId}-event-001`,
      campaignId: govCampaignId,
      name: 'Lagos Progressive Alliance Grand Rally',
      description: 'Massive rally to kick off the 2027 governorship campaign with party faithful from all 20 LGAs',
      type: 'RALLY' as const,
      venue: 'Tafawa Balewa Square',
      address: 'Race Course, Lagos Island',
      state: 'Lagos',
      lga: 'Lagos Island',
      startDateTime: new Date('2026-10-15T09:00:00'),
      endDateTime: new Date('2026-10-15T16:00:00'),
      expectedAttendance: 50000,
      organizerName: 'Chief Adebayo Ogundimu'
    },
    {
      id: `${tenantId}-event-002`,
      campaignId: govCampaignId,
      name: 'Ikeja Town Hall Meeting',
      description: 'Interactive session with Ikeja residents to discuss infrastructure development plans',
      type: 'TOWN_HALL' as const,
      venue: 'Ikeja City Mall Conference Hall',
      address: 'Alausa, Ikeja, Lagos',
      state: 'Lagos',
      lga: 'Ikeja',
      startDateTime: new Date('2026-11-05T14:00:00'),
      endDateTime: new Date('2026-11-05T18:00:00'),
      expectedAttendance: 500,
      organizerName: 'Engr. Chukwuemeka Okonkwo'
    },
    {
      id: `${tenantId}-event-003`,
      campaignId: govCampaignId,
      name: 'Lekki Business Community Stakeholder Forum',
      description: 'Engagement with business leaders on economic policies and investment climate',
      type: 'STAKEHOLDER_MEETING' as const,
      venue: 'Eko Hotels & Suites',
      address: 'Victoria Island, Lagos',
      state: 'Lagos',
      lga: 'Eti-Osa',
      startDateTime: new Date('2026-11-20T10:00:00'),
      endDateTime: new Date('2026-11-20T14:00:00'),
      expectedAttendance: 200,
      organizerName: 'Mrs. Ngozi Adeleke'
    },
    {
      id: `${tenantId}-event-004`,
      campaignId: lgCampaignId,
      name: 'Ikeja Ward Canvassing Drive',
      description: 'Door-to-door voter engagement across 15 wards in Ikeja LGA',
      type: 'DOOR_TO_DOOR' as const,
      venue: 'Multiple locations - Ikeja LGA',
      address: 'Various wards, Ikeja',
      state: 'Lagos',
      lga: 'Ikeja',
      startDateTime: new Date('2026-06-01T07:00:00'),
      endDateTime: new Date('2026-06-01T17:00:00'),
      expectedAttendance: 150,
      organizerName: 'Alhaji Yusuf Lawal'
    },
    {
      id: `${tenantId}-event-005`,
      campaignId: govCampaignId,
      name: 'Youth Empowerment and Politics Summit',
      description: 'Special event targeting youth voters with focus on education, employment, and technology',
      type: 'TOWN_HALL' as const,
      venue: 'University of Lagos Main Auditorium',
      address: 'Akoka, Yaba, Lagos',
      state: 'Lagos',
      lga: 'Lagos Mainland',
      startDateTime: new Date('2026-12-10T10:00:00'),
      endDateTime: new Date('2026-12-10T15:00:00'),
      expectedAttendance: 2000,
      organizerName: 'Dr. Olumide Fashola'
    },
    {
      id: `${tenantId}-event-006`,
      campaignId: govCampaignId,
      name: 'Campaign Launch Media Event',
      description: 'Official media launch with press conference and candidate introduction',
      type: 'MEDIA_APPEARANCE' as const,
      venue: 'Oriental Hotel',
      address: 'Lekki Phase 1, Lagos',
      state: 'Lagos',
      lga: 'Eti-Osa',
      startDateTime: new Date('2026-09-15T11:00:00'),
      endDateTime: new Date('2026-09-15T14:00:00'),
      expectedAttendance: 300,
      organizerName: 'Hon. Funke Akintola'
    }
  ]
  
  const eventIds: string[] = []
  
  for (const event of events) {
    const existing = await prisma.pol_event.findUnique({ where: { id: event.id } })
    
    if (!existing) {
      await prisma.pol_event.create({
        data: {
          ...event,
          tenantId,
          status: 'SCHEDULED',
          organizerPhone: generateNigerianPhone(),
          createdBy: 'system-seed'
        }
      })
      console.log(`  Created event: ${event.name}`)
    } else {
      console.log(`  Event exists: ${event.name}`)
    }
    
    eventIds.push(event.id)
  }
  
  return eventIds
}

async function seedDonations(
  tenantId: string, 
  partyId: string,
  govCampaignId: string, 
  lgCampaignId: string
): Promise<void> {
  console.log('Creating 25 donation records...')
  
  const donationAmounts = [
    50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000,
    75000, 150000, 300000, 750000, 1500000, 3000000, 25000, 45000,
    125000, 225000, 350000, 450000, 650000, 850000, 1250000, 1750000, 4500000
  ]
  
  for (let i = 0; i < 25; i++) {
    const donationId = `${tenantId}-donation-${String(i + 1).padStart(3, '0')}`
    const isCorporate = i < 8
    const isForCampaign = i < 18
    const campaignId = i < 12 ? govCampaignId : (i < 18 ? lgCampaignId : null)
    const amount = donationAmounts[i]
    const lga = LAGOS_LGAS[i % LAGOS_LGAS.length]
    
    const existing = await prisma.pol_donation_fact.findUnique({ where: { id: donationId } })
    
    if (!existing) {
      const firstName = randomItem(NIGERIAN_FIRST_NAMES_MALE)
      const lastName = randomItem(NIGERIAN_LAST_NAMES)
      
      await prisma.pol_donation_fact.create({
        data: {
          id: donationId,
          tenantId,
          campaignId,
          partyId: isForCampaign ? null : partyId,
          amount,
          currency: 'NGN',
          source: isCorporate ? 'CORPORATE' : randomItem(['INDIVIDUAL', 'SELF_FUNDING', 'PARTY_FUND'] as const),
          donorType: isCorporate ? 'Corporate' : 'Individual',
          donorName: isCorporate 
            ? randomItem([
                'Lagos Industries Ltd',
                'Adeleke Holdings',
                'Okonkwo Ventures',
                'Balogun Enterprises',
                'Fashola Group',
                'Nnamdi Brothers Ltd',
                'Abubakar & Sons Trading',
                'Danjuma Investments'
              ])
            : `${firstName} ${lastName}`,
          donorAddress: `${Math.floor(Math.random() * 100) + 1} ${randomItem(['Marina', 'Broad Street', 'Ozumba Mbadiwe', 'Adeola Hopewell', 'Sanusi Fafunwa'])}, Lagos`,
          donorPhone: generateNigerianPhone(),
          donorEmail: isCorporate 
            ? `donations@${randomItem(['lagosind', 'adeleke', 'okonkwo', 'balogun', 'fashola'])}.com.ng`
            : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          donorOccupation: isCorporate ? null : randomItem(['Businessman', 'Lawyer', 'Doctor', 'Engineer', 'Entrepreneur', 'Banker', 'Consultant']),
          companyName: isCorporate ? `${randomItem(NIGERIAN_LAST_NAMES)} ${randomItem(['Industries', 'Holdings', 'Ventures', 'Enterprises', 'Group'])} Ltd` : null,
          companyRegNo: isCorporate ? `RC${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}` : null,
          state: 'Lagos',
          lga,
          donationDate: randomDate(new Date('2025-01-01'), new Date('2026-06-30')),
          receiptDate: randomDate(new Date('2025-01-02'), new Date('2026-07-01')),
          description: isCorporate 
            ? 'Corporate campaign contribution'
            : 'Individual campaign donation',
          purpose: campaignId ? 'Campaign funding' : 'Party operations support',
          status: randomItem(['RECORDED', 'ACKNOWLEDGED', 'DISCLOSED'] as const),
          isAnonymous: false,
          exceedsThreshold: amount >= 1000000,
          requiresDisclosure: amount >= 500000,
          recordedBy: 'system-seed'
        }
      })
      console.log(`  Created donation ${i + 1}/25: ₦${amount.toLocaleString()} from ${isCorporate ? 'Corporate' : 'Individual'}`)
    } else {
      console.log(`  Donation exists: ${donationId}`)
    }
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log('POLITICAL SUITE - FULL DEMO DATA SEEDER')
  console.log('Lagos Progressive Alliance - Nigerian Context')
  console.log('='.repeat(70))
  
  try {
    const tenant = await verifyDemoTenant()
    
    const partyId = await seedParty(tenant.id)
    
    const { govCampaignId, lgCampaignId } = await seedCampaigns(tenant.id, partyId)
    
    const memberIds = await seedMembers(tenant.id, partyId)
    
    await seedVolunteers(tenant.id, govCampaignId, lgCampaignId, memberIds)
    
    await seedEvents(tenant.id, govCampaignId, lgCampaignId)
    
    await seedDonations(tenant.id, partyId, govCampaignId, lgCampaignId)
    
    console.log('='.repeat(70))
    console.log('POLITICAL DEMO SEEDING COMPLETE')
    console.log('  Party: 1 (Lagos Progressive Alliance)')
    console.log('  Campaigns: 2 (Governorship + LG)')
    console.log('  Members: 35')
    console.log('  Volunteers: 25')
    console.log('  Events: 6')
    console.log('  Donations: 25')
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
