/**
 * Health Full Demo Seed Script
 * 
 * Seeds clinical demo data for demo-clinic tenant (slug: 'demo-clinic'):
 * - Health visits
 * - Health encounters (12)
 * - Health prescriptions (15) with Nigerian medications
 * - Health diagnoses (8) with common conditions
 * 
 * Prerequisites: Run seed-health-demo.ts first to create patients, providers, and appointments.
 * 
 * Run: npx tsx scripts/seed-health-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-clinic'

const NIGERIAN_MEDICATIONS = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '3 times daily', duration: '5 days', route: 'Oral', instructions: 'Take after meals' },
  { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily', duration: '7 days', route: 'Oral', instructions: 'Complete the full course' },
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', route: 'Oral', instructions: 'Take with food' },
  { name: 'Artemether-Lumefantrine (Coartem)', dosage: '80/480mg', frequency: 'Twice daily', duration: '3 days', route: 'Oral', instructions: 'Take with fatty food' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take in the morning' },
  { name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days', route: 'Oral', instructions: 'Avoid dairy products' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', duration: '14 days', route: 'Oral', instructions: 'Take before breakfast' },
  { name: 'Vitamin B Complex', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take with food' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Monitor blood pressure' },
  { name: 'Chloroquine Phosphate', dosage: '250mg', frequency: 'Once daily', duration: '3 days', route: 'Oral', instructions: 'Take after meals' },
  { name: 'Ibuprofen', dosage: '400mg', frequency: '3 times daily', duration: '5 days', route: 'Oral', instructions: 'Take with food' },
  { name: 'Flagyl (Metronidazole)', dosage: '400mg', frequency: '3 times daily', duration: '7 days', route: 'Oral', instructions: 'Avoid alcohol' },
  { name: 'Folic Acid', dosage: '5mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take before breakfast' },
  { name: 'Glibenclamide', dosage: '5mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take before meals' },
  { name: 'Hydrochlorothiazide', dosage: '25mg', frequency: 'Once daily', duration: '30 days', route: 'Oral', instructions: 'Take in the morning' },
]

const COMMON_DIAGNOSES = [
  { icdCode: 'B50', description: 'Malaria (Plasmodium falciparum)', type: 'PRIMARY' },
  { icdCode: 'A01.0', description: 'Typhoid fever', type: 'PRIMARY' },
  { icdCode: 'I10', description: 'Essential (primary) hypertension', type: 'PRIMARY' },
  { icdCode: 'E11', description: 'Type 2 diabetes mellitus', type: 'PRIMARY' },
  { icdCode: 'J06.9', description: 'Acute upper respiratory infection', type: 'PRIMARY' },
  { icdCode: 'A09', description: 'Gastroenteritis and colitis', type: 'SECONDARY' },
  { icdCode: 'K29.7', description: 'Gastritis, unspecified', type: 'SECONDARY' },
  { icdCode: 'D50.9', description: 'Iron deficiency anaemia, unspecified', type: 'SECONDARY' },
]

const CHIEF_COMPLAINTS = [
  'Fever and body aches for 3 days',
  'Persistent headache and weakness',
  'Abdominal pain and diarrhea',
  'Cough and difficulty breathing',
  'High blood pressure follow-up',
  'Diabetes management review',
  'General body weakness and fatigue',
  'Joint pain and swelling',
  'Chest pain on exertion',
  'Dizziness and blurred vision',
  'Routine checkup',
  'Fever with chills and rigors',
]

async function verifyDemoTenant() {
  console.log('Verifying demo-clinic tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}. Run seed-demo-environment.ts and seed-health-demo.ts first.`)
  }
  
  console.log(`  Found tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function getExistingData(tenantId: string) {
  console.log('Fetching existing patients, providers, and appointments...')
  
  const patients = await prisma.health_patient.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  })
  
  const providers = await prisma.health_provider.findMany({
    where: { tenantId, role: 'DOCTOR' },
    orderBy: { createdAt: 'asc' }
  })
  
  const appointments = await prisma.health_appointment.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  })
  
  const facility = await prisma.health_facility.findFirst({
    where: { tenantId }
  })
  
  if (patients.length === 0) {
    throw new Error('No patients found. Run seed-health-demo.ts first.')
  }
  
  if (providers.length === 0) {
    throw new Error('No providers found. Run seed-health-demo.ts first.')
  }
  
  console.log(`  Found ${patients.length} patients, ${providers.length} doctors, ${appointments.length} appointments`)
  
  return { patients, providers, appointments, facility }
}

async function seedVisitsAndEncounters(
  tenantId: string,
  patients: any[],
  providers: any[],
  appointments: any[],
  facilityId: string | null
) {
  console.log('Creating visits and encounters...')
  
  let visitCount = 0
  let encounterCount = 0
  const createdEncounters: any[] = []
  
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length]
    const provider = providers[i % providers.length]
    const appointment = appointments[i] || null
    
    const visitId = `${tenantId}-visit-full-${i + 1}`
    const encounterId = `${tenantId}-enc-full-${i + 1}`
    
    const existingVisit = await prisma.health_visit.findFirst({
      where: { id: visitId }
    })
    
    if (!existingVisit) {
      const visitDate = new Date()
      visitDate.setDate(visitDate.getDate() - (12 - i))
      
      await prisma.health_visit.create({
        data: {
          id: visitId,
          tenantId,
          patientId: patient.id,
          providerId: provider.id,
          facilityId: facilityId || undefined,
          appointmentId: appointment?.id || undefined,
          visitNumber: `VST-${1000 + i}`,
          visitDate,
          isWalkIn: !appointment,
          chiefComplaint: CHIEF_COMPLAINTS[i % CHIEF_COMPLAINTS.length],
          status: i < 10 ? 'COMPLETED' : 'IN_CONSULTATION',
          registeredAt: visitDate,
          consultStartAt: visitDate,
          consultEndAt: i < 10 ? new Date(visitDate.getTime() + 30 * 60000) : undefined,
          dischargedAt: i < 10 ? new Date(visitDate.getTime() + 45 * 60000) : undefined,
        }
      })
      visitCount++
      console.log(`  Created visit: VST-${1000 + i} for ${patient.firstName} ${patient.lastName}`)
    }
    
    const existingEncounter = await prisma.health_encounter.findFirst({
      where: { id: encounterId }
    })
    
    if (!existingEncounter) {
      const encounterDate = new Date()
      encounterDate.setDate(encounterDate.getDate() - (12 - i))
      
      const encounter = await prisma.health_encounter.create({
        data: {
          id: encounterId,
          tenantId,
          patientId: patient.id,
          visitId: visitId,
          providerId: provider.id,
          facilityId: facilityId || undefined,
          encounterDate,
          vitals: {
            bloodPressure: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 20)}`,
            temperature: (36.5 + Math.random() * 2).toFixed(1),
            pulse: 60 + Math.floor(Math.random() * 40),
            weight: 55 + Math.floor(Math.random() * 35),
            height: 155 + Math.floor(Math.random() * 30),
            spo2: 95 + Math.floor(Math.random() * 5),
            respiratoryRate: 14 + Math.floor(Math.random() * 8),
          },
          status: i < 10 ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: i < 10 ? new Date(encounterDate.getTime() + 30 * 60000) : undefined,
          completedBy: i < 10 ? provider.id : undefined,
        }
      })
      encounterCount++
      createdEncounters.push(encounter)
      console.log(`  Created encounter for ${patient.firstName} ${patient.lastName}`)
    } else {
      createdEncounters.push(existingEncounter)
    }
  }
  
  console.log(`  Created ${visitCount} visits and ${encounterCount} encounters`)
  return createdEncounters
}

async function seedDiagnoses(tenantId: string, encounters: any[], providers: any[]) {
  console.log('Creating diagnoses...')
  
  let diagnosisCount = 0
  
  for (let i = 0; i < 8; i++) {
    const encounter = encounters[i % encounters.length]
    const provider = providers[i % providers.length]
    const diagnosis = COMMON_DIAGNOSES[i]
    
    const diagnosisId = `${tenantId}-diag-full-${i + 1}`
    
    const existing = await prisma.health_diagnosis.findFirst({
      where: { id: diagnosisId }
    })
    
    if (!existing) {
      const diagnosedDate = new Date()
      diagnosedDate.setDate(diagnosedDate.getDate() - (8 - i))
      
      await prisma.health_diagnosis.create({
        data: {
          id: diagnosisId,
          tenantId,
          encounterId: encounter.id,
          icdCode: diagnosis.icdCode,
          description: diagnosis.description,
          type: diagnosis.type as any,
          status: 'ACTIVE',
          diagnosedAt: diagnosedDate,
          diagnosedBy: provider.id,
          diagnosedByName: `Dr. ${provider.firstName} ${provider.lastName}`,
        }
      })
      diagnosisCount++
      console.log(`  Created diagnosis: ${diagnosis.description}`)
    }
  }
  
  console.log(`  Created ${diagnosisCount} diagnoses`)
}

async function seedPrescriptions(tenantId: string, encounters: any[], patients: any[], providers: any[]) {
  console.log('Creating prescriptions...')
  
  let prescriptionCount = 0
  
  for (let i = 0; i < 15; i++) {
    const encounter = encounters[i % encounters.length]
    const patient = patients[i % patients.length]
    const provider = providers[i % providers.length]
    const medication = NIGERIAN_MEDICATIONS[i]
    
    const prescriptionId = `${tenantId}-rx-full-${i + 1}`
    
    const existing = await prisma.health_prescription.findFirst({
      where: { id: prescriptionId }
    })
    
    if (!existing) {
      const prescribedDate = new Date()
      prescribedDate.setDate(prescribedDate.getDate() - (15 - i))
      
      const expiresAt = new Date(prescribedDate)
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      await prisma.health_prescription.create({
        data: {
          id: prescriptionId,
          tenantId,
          patientId: patient.id,
          encounterId: encounter.id,
          prescriberId: provider.id,
          medication: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          duration: medication.duration,
          quantity: Math.floor(Math.random() * 30) + 10,
          route: medication.route,
          instructions: medication.instructions,
          status: i < 10 ? 'DISPENSED' : 'ACTIVE',
          prescribedAt: prescribedDate,
          expiresAt,
          dispensedAt: i < 10 ? new Date(prescribedDate.getTime() + 60 * 60000) : undefined,
          dispensedBy: i < 10 ? `${tenantId}-prov-010` : undefined,
        }
      })
      prescriptionCount++
      console.log(`  Created prescription: ${medication.name} for patient ${patient.firstName}`)
    }
  }
  
  console.log(`  Created ${prescriptionCount} prescriptions`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('HEALTH FULL DEMO SEEDER')
  console.log('Demo Clinic - Visits, Encounters, Diagnoses, Prescriptions')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    
    const { patients, providers, appointments, facility } = await getExistingData(tenant.id)
    
    const encounters = await seedVisitsAndEncounters(
      tenant.id,
      patients,
      providers,
      appointments,
      facility?.id || null
    )
    
    await seedDiagnoses(tenant.id, encounters, providers)
    
    await seedPrescriptions(tenant.id, encounters, patients, providers)
    
    console.log('='.repeat(60))
    console.log('HEALTH FULL DEMO SEEDING COMPLETE')
    console.log(`  Visits: 12`)
    console.log(`  Encounters: 12`)
    console.log(`  Diagnoses: 8`)
    console.log(`  Prescriptions: 15`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
