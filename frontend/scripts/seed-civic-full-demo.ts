/**
 * Demo Seed Script — Civic Full Demo
 * 
 * Civic Suite - Nigerian Government Bureau Full Demo Data Seeder
 * 
 * Creates comprehensive demo data for the demo-civic tenant:
 * - Staff members for assignments
 * - Service requests (parent records for cases)
 * - 12 civic cases with various statuses
 * - Case assignments linking cases to staff
 * - Case notes with progress updates
 * 
 * Run: npx tsx scripts/seed-civic-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-civic'

const LAGOS_LGAS = [
  'Ikeja', 'Eti-Osa', 'Lagos Island', 'Lekki', 'Victoria Island',
  'Ikoyi', 'Surulere', 'Yaba', 'Apapa', 'Amuwo-Odofin',
  'Alimosho', 'Agege', 'Ifako-Ijaiye'
]

const STAFF_MEMBERS = [
  { id: 'staff-001', staffNumber: 'STAFF-001', firstName: 'Adebayo', lastName: 'Ogundimu', role: 'MANAGER', designation: 'Senior Land Officer', email: 'adebayo.ogundimu@lagoslands.gov.ng' },
  { id: 'staff-002', staffNumber: 'STAFF-002', firstName: 'Chidinma', lastName: 'Nwankwo', role: 'OFFICER', designation: 'Lands Officer', email: 'chidinma.nwankwo@lagoslands.gov.ng' },
  { id: 'staff-003', staffNumber: 'STAFF-003', firstName: 'Ibrahim', lastName: 'Lawal', role: 'OFFICER', designation: 'Survey Officer', email: 'ibrahim.lawal@lagoslands.gov.ng' },
  { id: 'staff-004', staffNumber: 'STAFF-004', firstName: 'Oluwakemi', lastName: 'Adeyinka', role: 'INSPECTOR', designation: 'Field Inspector', email: 'oluwakemi.adeyinka@lagoslands.gov.ng' },
  { id: 'staff-005', staffNumber: 'STAFF-005', firstName: 'Musa', lastName: 'Abdullahi', role: 'CLERK', designation: 'Administrative Clerk', email: 'musa.abdullahi@lagoslands.gov.ng' },
]

const CASE_DATA = [
  { 
    type: 'Land Allocation Request',
    subject: 'Application for Land Allocation in Lekki Scheme 2',
    service: 'EXCISION',
    status: 'OPEN' as const,
    priority: 'HIGH' as const,
    citizenIdx: 0,
    location: { address: 'Plot 45, Lekki Scheme 2', lga: 'Eti-Osa', area: 'Lekki' }
  },
  { 
    type: 'Building Permit',
    subject: 'Building Plan Approval for 3-Story Commercial Complex',
    service: 'BLDG-PERMIT',
    status: 'OPEN' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 1,
    location: { address: '12 Allen Avenue', lga: 'Ikeja', area: 'Ikeja GRA' }
  },
  { 
    type: 'Certificate of Occupancy',
    subject: 'C of O Application for Inherited Family Property',
    service: 'C-OF-O',
    status: 'OPEN' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 2,
    location: { address: '78 Adeniran Ogunsanya Street', lga: 'Surulere', area: 'Surulere' }
  },
  { 
    type: 'Building Permit',
    subject: 'Building Permit for Residential Duplex',
    service: 'BLDG-PERMIT',
    status: 'IN_PROGRESS' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 3,
    location: { address: 'Block 5, Festac Town', lga: 'Amuwo-Odofin', area: 'Festac' }
  },
  { 
    type: 'Property Registration',
    subject: 'Registration of Newly Purchased Property',
    service: 'GOV-CONSENT',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    citizenIdx: 4,
    location: { address: '23 Bourdillon Road', lga: 'Eti-Osa', area: 'Ikoyi' }
  },
  { 
    type: 'Certificate of Occupancy',
    subject: 'C of O Application for Commercial Property',
    service: 'C-OF-O',
    status: 'IN_PROGRESS' as const,
    priority: 'URGENT' as const,
    citizenIdx: 5,
    location: { address: 'Plot 15, Victoria Island', lga: 'Eti-Osa', area: 'Victoria Island' }
  },
  { 
    type: 'Land Allocation Request',
    subject: 'Industrial Land Allocation Request in Oregun',
    service: 'EXCISION',
    status: 'IN_PROGRESS' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 6,
    location: { address: 'Industrial Layout, Oregun', lga: 'Ikeja', area: 'Oregun' }
  },
  { 
    type: 'Boundary Dispute Resolution',
    subject: 'Boundary Dispute Between Adjacent Properties',
    service: 'SURVEY-PLAN',
    status: 'RESOLVED' as const,
    priority: 'HIGH' as const,
    citizenIdx: 7,
    location: { address: '45 Masha Road', lga: 'Surulere', area: 'Masha' }
  },
  { 
    type: 'Building Permit',
    subject: 'Approved Building Plan for Shopping Plaza',
    service: 'BLDG-PERMIT',
    status: 'RESOLVED' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 8,
    location: { address: 'Admiralty Way', lga: 'Eti-Osa', area: 'Lekki Phase 1' }
  },
  { 
    type: 'Certificate of Occupancy',
    subject: 'C of O Issuance for Residential Estate',
    service: 'C-OF-O',
    status: 'RESOLVED' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 9,
    location: { address: 'Magodo GRA Phase 2', lga: 'Ikeja', area: 'Magodo' }
  },
  { 
    type: 'Property Registration',
    subject: 'Completed Title Transfer Registration',
    service: 'RATIFICATION',
    status: 'CLOSED' as const,
    priority: 'LOW' as const,
    citizenIdx: 0,
    location: { address: '8 Marine Road', lga: 'Lagos Island', area: 'Apapa' }
  },
  { 
    type: 'Land Allocation Request',
    subject: 'Completed Land Allocation for Housing Development',
    service: 'EXCISION',
    status: 'CLOSED' as const,
    priority: 'NORMAL' as const,
    citizenIdx: 1,
    location: { address: 'Ibeju-Lekki Free Trade Zone', lga: 'Eti-Osa', area: 'Ibeju-Lekki' }
  }
]

const NOTE_TEMPLATES = {
  OPEN: [
    'Application received and registered. Initial document review pending.',
    'Documents verified. Awaiting assignment to processing officer.',
  ],
  IN_PROGRESS: [
    'Case assigned for processing. Preliminary assessment initiated.',
    'Site inspection scheduled. Awaiting field report.',
    'Technical review in progress. Survey verification ongoing.',
  ],
  RESOLVED: [
    'All requirements satisfied. Documents verified and approved.',
    'Final inspection completed successfully. Certificate prepared for issuance.',
    'Applicant notified of approval. Processing fee confirmed paid.',
  ],
  CLOSED: [
    'Case successfully concluded. All documents issued to applicant.',
    'Certificate of Occupancy issued and collected by applicant.',
    'Case file archived. No pending actions required.',
  ]
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

async function getAgency(tenantId: string) {
  const agency = await prisma.civic_agency.findFirst({
    where: { tenantId }
  })
  
  if (!agency) {
    throw new Error('Agency not found. Please run seed-civic-demo.ts first.')
  }
  
  return agency
}

async function getServices(tenantId: string) {
  const services = await prisma.civic_service.findMany({
    where: { tenantId }
  })
  
  if (services.length === 0) {
    throw new Error('No services found. Please run seed-civic-demo.ts first.')
  }
  
  const serviceMap: Record<string, { id: string, name: string }> = {}
  for (const svc of services) {
    serviceMap[svc.code] = { id: svc.id, name: svc.name }
  }
  
  return serviceMap
}

async function getCitizens(tenantId: string) {
  const citizens = await prisma.civic_citizen.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    take: 10
  })
  
  if (citizens.length === 0) {
    throw new Error('No citizens found. Please run seed-civic-demo.ts first.')
  }
  
  return citizens
}

async function seedStaff(tenantId: string, agencyId: string) {
  console.log('Creating staff members...')
  
  const staffIds: string[] = []
  
  for (const staff of STAFF_MEMBERS) {
    const staffId = `${tenantId}-${staff.id}`
    
    const existing = await prisma.civic_staff.findFirst({
      where: { id: staffId }
    })
    
    if (!existing) {
      await prisma.civic_staff.create({
        data: {
          id: staffId,
          tenantId,
          agencyId,
          staffNumber: staff.staffNumber,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role as any,
          designation: staff.designation,
          email: staff.email,
          isActive: true,
          hireDate: new Date('2023-01-15'),
        }
      })
      console.log(`  Created staff: ${staff.firstName} ${staff.lastName}`)
    } else {
      console.log(`  Staff exists: ${staff.firstName} ${staff.lastName}`)
    }
    
    staffIds.push(staffId)
  }
  
  return staffIds
}

async function seedRequestsAndCases(
  tenantId: string, 
  serviceMap: Record<string, { id: string, name: string }>,
  citizens: { id: string, firstName: string, lastName: string, phone: string | null, email: string | null }[],
  staffIds: string[]
) {
  console.log('Creating service requests and cases...')
  
  const caseIds: { caseId: string, status: string }[] = []
  let requestCounter = 1
  let caseCounter = 1
  
  for (const caseData of CASE_DATA) {
    const requestNumber = `REQ-2026-${String(requestCounter).padStart(5, '0')}`
    const caseNumber = `CASE-2026-${String(caseCounter).padStart(5, '0')}`
    const trackingCode = `TRK${String(Math.random()).slice(2, 10).toUpperCase()}`
    
    const requestId = `${tenantId}-req-${requestCounter}`
    const caseId = `${tenantId}-case-${caseCounter}`
    
    const citizen = citizens[caseData.citizenIdx % citizens.length]
    const service = serviceMap[caseData.service] || serviceMap['C-OF-O']
    
    const existingRequest = await prisma.civic_request.findFirst({
      where: { id: requestId }
    })
    
    if (!existingRequest) {
      const submittedAt = new Date()
      submittedAt.setDate(submittedAt.getDate() - Math.floor(Math.random() * 60) - 7)
      
      let requestStatus = 'UNDER_REVIEW'
      if (caseData.status === 'RESOLVED') requestStatus = 'APPROVED'
      if (caseData.status === 'CLOSED') requestStatus = 'APPROVED'
      
      await prisma.civic_request.create({
        data: {
          id: requestId,
          tenantId,
          requestNumber,
          citizenId: citizen.id,
          applicantName: `${citizen.firstName} ${citizen.lastName}`,
          applicantPhone: citizen.phone,
          applicantEmail: citizen.email,
          serviceId: service.id,
          serviceName: service.name,
          subject: caseData.subject,
          description: `${caseData.type}: ${caseData.subject}. Property located at ${caseData.location.address}, ${caseData.location.area}, ${caseData.location.lga} LGA, Lagos State.`,
          location: caseData.location,
          status: requestStatus as any,
          submittedAt,
          acknowledgedAt: new Date(submittedAt.getTime() + 86400000),
          trackingCode,
          isPaid: true,
          paidAt: new Date(submittedAt.getTime() + 172800000),
          totalAmount: 150000 + Math.floor(Math.random() * 300000),
        }
      })
      console.log(`  Created request: ${requestNumber}`)
    } else {
      console.log(`  Request exists: ${requestNumber}`)
    }
    
    const existingCase = await prisma.civic_case.findFirst({
      where: { id: caseId }
    })
    
    if (!existingCase) {
      const slaDeadline = new Date()
      slaDeadline.setDate(slaDeadline.getDate() + 30 + Math.floor(Math.random() * 60))
      
      const assigneeId = staffIds[Math.floor(Math.random() * staffIds.length)]
      
      let resolvedAt = null
      let closedAt = null
      let resolution = null
      
      if (caseData.status === 'RESOLVED' || caseData.status === 'CLOSED') {
        resolvedAt = new Date()
        resolvedAt.setDate(resolvedAt.getDate() - Math.floor(Math.random() * 14))
        resolution = 'Application processed successfully. All requirements met and verified.'
      }
      
      if (caseData.status === 'CLOSED') {
        closedAt = new Date()
        closedAt.setDate(closedAt.getDate() - Math.floor(Math.random() * 7))
      }
      
      await prisma.civic_case.create({
        data: {
          id: caseId,
          tenantId,
          requestId,
          caseNumber,
          status: caseData.status,
          priority: caseData.priority,
          currentAssigneeId: assigneeId,
          slaDeadline,
          slaBreached: false,
          resolvedAt,
          closedAt,
          resolution,
          isEscalated: caseData.priority === 'URGENT',
          escalatedAt: caseData.priority === 'URGENT' ? new Date() : null,
          escalationNote: caseData.priority === 'URGENT' ? 'Urgent case requiring immediate attention per director\'s instruction.' : null,
        }
      })
      console.log(`  Created case: ${caseNumber} (${caseData.status})`)
      
      caseIds.push({ caseId, status: caseData.status })
    } else {
      console.log(`  Case exists: ${caseNumber}`)
      caseIds.push({ caseId, status: caseData.status })
    }
    
    requestCounter++
    caseCounter++
  }
  
  return caseIds
}

async function seedCaseAssignments(tenantId: string, caseIds: { caseId: string, status: string }[], staffIds: string[]) {
  console.log('Creating case assignments...')
  
  for (const { caseId } of caseIds) {
    const assignmentId = `${caseId}-assign-1`
    const staffId = staffIds[Math.floor(Math.random() * staffIds.length)]
    
    const existing = await prisma.civic_case_assignment.findFirst({
      where: { id: assignmentId }
    })
    
    if (!existing) {
      const assignedAt = new Date()
      assignedAt.setDate(assignedAt.getDate() - Math.floor(Math.random() * 30) - 1)
      
      await prisma.civic_case_assignment.create({
        data: {
          id: assignmentId,
          tenantId,
          caseId,
          staffId,
          assignedAt,
          assignedBy: staffIds[0],
          assignerNote: 'Assigned for processing per standard workflow.',
          isActive: true,
        }
      })
      console.log(`  Created assignment for case: ${caseId.split('-').pop()}`)
    } else {
      console.log(`  Assignment exists for case: ${caseId.split('-').pop()}`)
    }
  }
}

async function seedCaseNotes(tenantId: string, caseIds: { caseId: string, status: string }[], staffIds: string[]) {
  console.log('Creating case notes...')
  
  for (const { caseId, status } of caseIds) {
    const notes = NOTE_TEMPLATES[status as keyof typeof NOTE_TEMPLATES] || NOTE_TEMPLATES.OPEN
    
    for (let i = 0; i < notes.length; i++) {
      const noteId = `${caseId}-note-${i + 1}`
      
      const existing = await prisma.civic_case_note.findFirst({
        where: { id: noteId }
      })
      
      if (!existing) {
        const staffId = staffIds[Math.floor(Math.random() * staffIds.length)]
        const staff = STAFF_MEMBERS.find(s => staffId.endsWith(s.id))
        const authorName = staff ? `${staff.firstName} ${staff.lastName}` : 'System Administrator'
        
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - (notes.length - i) * 3 - Math.floor(Math.random() * 5))
        
        await prisma.civic_case_note.create({
          data: {
            id: noteId,
            tenantId,
            caseId,
            noteType: 'INTERNAL',
            content: notes[i],
            isInternal: true,
            authorId: staffId,
            authorName,
            createdAt,
          }
        })
      }
    }
    console.log(`  Created ${notes.length} notes for case: ${caseId.split('-').pop()}`)
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('CIVIC SUITE FULL DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Government Bureau')
  console.log('Lagos State Lands Bureau Context')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    const agency = await getAgency(tenant.id)
    const serviceMap = await getServices(tenant.id)
    const citizens = await getCitizens(tenant.id)
    
    console.log(`  Agency: ${agency.name}`)
    console.log(`  Services: ${Object.keys(serviceMap).length}`)
    console.log(`  Citizens: ${citizens.length}`)
    
    const staffIds = await seedStaff(tenant.id, agency.id)
    const caseIds = await seedRequestsAndCases(tenant.id, serviceMap, citizens, staffIds)
    await seedCaseAssignments(tenant.id, caseIds, staffIds)
    await seedCaseNotes(tenant.id, caseIds, staffIds)
    
    const openCount = caseIds.filter(c => c.status === 'OPEN').length
    const inProgressCount = caseIds.filter(c => c.status === 'IN_PROGRESS').length
    const resolvedCount = caseIds.filter(c => c.status === 'RESOLVED').length
    const closedCount = caseIds.filter(c => c.status === 'CLOSED').length
    
    console.log('='.repeat(60))
    console.log('CIVIC FULL DEMO SEEDING COMPLETE')
    console.log(`  Staff Members: ${staffIds.length}`)
    console.log(`  Service Requests: ${caseIds.length}`)
    console.log(`  Cases Total: ${caseIds.length}`)
    console.log(`    - OPEN: ${openCount}`)
    console.log(`    - IN_PROGRESS: ${inProgressCount}`)
    console.log(`    - RESOLVED: ${resolvedCount}`)
    console.log(`    - CLOSED: ${closedCount}`)
    console.log(`  Case Assignments: ${caseIds.length}`)
    console.log(`  Case Notes: ~${caseIds.length * 2}-${caseIds.length * 3}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
