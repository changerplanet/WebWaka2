/**
 * HEALTH SUITE: Demo Data Seeding
 * 
 * Creates sample data for demonstrating the Health Suite.
 */

import { createPatient } from './patient-service';
import { createAppointment } from './appointment-service';
import { createConsultation, recordVitalSigns, completeConsultation } from './consultation-service';
import { createPrescription, COMMON_MEDICATIONS } from './prescription-service';
import { BloodGroup, Genotype, AppointmentType } from './config';

// Demo Nigerian names
const PATIENT_NAMES = [
  { firstName: 'Adaeze', lastName: 'Okonkwo', gender: 'FEMALE' as const },
  { firstName: 'Chukwuemeka', lastName: 'Eze', gender: 'MALE' as const },
  { firstName: 'Fatima', lastName: 'Ibrahim', gender: 'FEMALE' as const },
  { firstName: 'Oluwaseun', lastName: 'Adeleke', gender: 'MALE' as const },
  { firstName: 'Ngozi', lastName: 'Okafor', gender: 'FEMALE' as const },
  { firstName: 'Babatunde', lastName: 'Ogundimu', gender: 'MALE' as const },
  { firstName: 'Amina', lastName: 'Mohammed', gender: 'FEMALE' as const },
  { firstName: 'Emeka', lastName: 'Nwachukwu', gender: 'MALE' as const },
  { firstName: 'Chioma', lastName: 'Obiora', gender: 'FEMALE' as const },
  { firstName: 'Yusuf', lastName: 'Abubakar', gender: 'MALE' as const },
];

const DOCTOR_NAMES = [
  { firstName: 'Dr. Olumide', lastName: 'Adeyemi', specialization: 'General Practice' },
  { firstName: 'Dr. Ngozi', lastName: 'Onyekachi', specialization: 'Pediatrics' },
  { firstName: 'Dr. Ibrahim', lastName: 'Suleiman', specialization: 'Internal Medicine' },
  { firstName: 'Dr. Funke', lastName: 'Adebayo', specialization: 'Obstetrics & Gynecology' },
];

const COMMON_COMPLAINTS = [
  'Fever and body pain',
  'Persistent headache',
  'Cough and cold',
  'Stomach pain',
  'Body weakness',
  'Back pain',
  'High blood pressure checkup',
  'Diabetes follow-up',
  'Malaria symptoms',
  'General checkup',
];

/**
 * Seed demo data for Health Suite
 */
export async function seedHealthDemoData(tenantId: string): Promise<{
  success: boolean;
  summary: {
    patientsCreated: number;
    appointmentsCreated: number;
    consultationsCreated: number;
    prescriptionsCreated: number;
  };
}> {
  console.log('[Health Demo] Starting demo data seeding for tenant:', tenantId);
  
  let patientsCreated = 0;
  let appointmentsCreated = 0;
  let consultationsCreated = 0;
  let prescriptionsCreated = 0;
  
  const createdPatients: { id: string; name: string }[] = [];
  
  // 1. Create demo patients
  for (const patient of PATIENT_NAMES) {
    const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genotypes: Genotype[] = ['AA', 'AS', 'SS'];
    
    const result = await createPatient(tenantId, {
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender,
      phone: `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}@demo.clinic`,
      dateOfBirth: `${1960 + Math.floor(Math.random() * 50)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`,
      bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
      genotype: genotypes[Math.floor(Math.random() * genotypes.length)],
      allergies: Math.random() > 0.7 ? ['Penicillin'] : [],
      chronicConditions: Math.random() > 0.6 ? ['Hypertension'] : [],
      insuranceProvider: Math.random() > 0.5 ? 'HMO Nigeria' : undefined,
      insurancePolicyNumber: Math.random() > 0.5 ? `HMO-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      emergencyContactName: `${patient.lastName} Family`,
      emergencyContactPhone: `+234 81${Math.floor(10000000 + Math.random() * 90000000)}`,
    }, 'demo_seeder');
    
    if (result.success && result.patientId) {
      patientsCreated++;
      createdPatients.push({ 
        id: result.patientId, 
        name: `${patient.firstName} ${patient.lastName}` 
      });
    }
  }
  
  // 2. Create demo appointments for today and tomorrow
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const appointmentTypes: AppointmentType[] = ['CONSULTATION', 'FOLLOW_UP', 'LAB_TEST'];
  
  for (let i = 0; i < Math.min(6, createdPatients.length); i++) {
    const patient = createdPatients[i];
    const doctor = DOCTOR_NAMES[i % DOCTOR_NAMES.length];
    const date = i < 3 ? today : tomorrow;
    const hour = 9 + i;
    
    const result = await createAppointment(tenantId, {
      patientId: patient.id,
      patientName: patient.name,
      doctorId: `doctor_${i % DOCTOR_NAMES.length + 1}`,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      appointmentDate: date,
      startTime: `${String(hour).padStart(2, '0')}:00`,
      type: appointmentTypes[i % appointmentTypes.length],
      reason: COMMON_COMPLAINTS[i % COMMON_COMPLAINTS.length],
    });
    
    if (result.success) {
      appointmentsCreated++;
      
      // Create consultations for some appointments
      if (i < 3) {
        const consultResult = await createConsultation(tenantId, {
          patientId: patient.id,
          doctorId: `doctor_${i % DOCTOR_NAMES.length + 1}`,
          appointmentId: result.appointmentId,
          chiefComplaint: COMMON_COMPLAINTS[i % COMMON_COMPLAINTS.length],
        });
        
        if (consultResult.success && consultResult.consultationId) {
          consultationsCreated++;
          
          // Record vitals for some
          if (i < 2) {
            await recordVitalSigns(tenantId, consultResult.consultationId, {
              bloodPressure: '120/80',
              pulse: 72 + Math.floor(Math.random() * 10),
              temperature: 36.5 + Math.random(),
              weight: 65 + Math.floor(Math.random() * 20),
              height: 160 + Math.floor(Math.random() * 20),
              oxygenSaturation: 97 + Math.floor(Math.random() * 3),
              recordedBy: 'nurse_1',
            }, 'nurse_1');
            
            // Complete some consultations
            if (i < 1) {
              await completeConsultation(tenantId, consultResult.consultationId, {
                diagnosis: [
                  { code: 'R51', description: 'Headache', type: 'PRIMARY' },
                ],
                treatmentPlan: 'Rest and hydration. Pain relief as needed.',
                followUpDate: tomorrow,
              });
              
              // Create prescription
              const rxResult = await createPrescription(tenantId, {
                consultationId: consultResult.consultationId,
                patientId: patient.id,
                patientName: patient.name,
                doctorId: `doctor_${i % DOCTOR_NAMES.length + 1}`,
                doctorName: `${doctor.firstName} ${doctor.lastName}`,
                items: [
                  {
                    drugName: COMMON_MEDICATIONS[0].name,
                    dosage: COMMON_MEDICATIONS[0].dosage,
                    frequency: COMMON_MEDICATIONS[0].frequency,
                    duration: '5 days',
                    quantity: COMMON_MEDICATIONS[0].defaultQuantity,
                    instructions: 'Take after meals',
                  },
                  {
                    drugName: COMMON_MEDICATIONS[9].name,
                    dosage: COMMON_MEDICATIONS[9].dosage,
                    frequency: COMMON_MEDICATIONS[9].frequency,
                    duration: '30 days',
                    quantity: COMMON_MEDICATIONS[9].defaultQuantity,
                  },
                ],
              });
              
              if (rxResult.success) {
                prescriptionsCreated++;
              }
            }
          }
        }
      }
    }
  }
  
  console.log('[Health Demo] Seeding complete:', {
    patientsCreated,
    appointmentsCreated,
    consultationsCreated,
    prescriptionsCreated,
  });
  
  return {
    success: true,
    summary: {
      patientsCreated,
      appointmentsCreated,
      consultationsCreated,
      prescriptionsCreated,
    },
  };
}

/**
 * Demo doctors (returned as static data)
 */
export function getDemoDoctors() {
  return DOCTOR_NAMES.map((doc, index) => ({
    id: `doctor_${index + 1}`,
    firstName: doc.firstName,
    lastName: doc.lastName,
    fullName: `${doc.firstName} ${doc.lastName}`,
    specialization: doc.specialization,
    consultationFee: 5000 + (index * 2500),
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  }));
}
