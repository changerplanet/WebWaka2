/**
 * HEALTH SUITE: Configuration & Constants
 * 
 * Labels, enums, types, and configuration for the Health Suite.
 * Nigerian healthcare context.
 */

// ============================================================================
// LABELS (UI Display)
// ============================================================================

export const HEALTH_LABELS = {
  patients: 'Patients',
  doctors: 'Doctors',
  nurses: 'Nurses',
  appointments: 'Appointments',
  consultations: 'Consultations',
  prescriptions: 'Prescriptions',
  pharmacy: 'Pharmacy',
  billing: 'Billing',
  vitals: 'Vital Signs',
  diagnosis: 'Diagnosis',
  labTests: 'Lab Tests',
  medicalHistory: 'Medical History',
};

// ============================================================================
// ENUMS
// ============================================================================

export const APPOINTMENT_STATUS = {
  SCHEDULED: { name: 'Scheduled', color: 'blue' },
  CONFIRMED: { name: 'Confirmed', color: 'green' },
  CHECKED_IN: { name: 'Checked In', color: 'purple' },
  IN_PROGRESS: { name: 'In Progress', color: 'orange' },
  COMPLETED: { name: 'Completed', color: 'gray' },
  CANCELLED: { name: 'Cancelled', color: 'red' },
  NO_SHOW: { name: 'No Show', color: 'red' },
  RESCHEDULED: { name: 'Rescheduled', color: 'yellow' },
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

export const APPOINTMENT_TYPES = {
  CONSULTATION: { name: 'General Consultation', duration: 30 },
  FOLLOW_UP: { name: 'Follow-up Visit', duration: 15 },
  PROCEDURE: { name: 'Medical Procedure', duration: 60 },
  LAB_TEST: { name: 'Laboratory Test', duration: 15 },
  SPECIALIST: { name: 'Specialist Consultation', duration: 45 },
  EMERGENCY: { name: 'Emergency', duration: 30 },
  VACCINATION: { name: 'Vaccination', duration: 15 },
  ANTENATAL: { name: 'Antenatal Care', duration: 30 },
} as const;

export type AppointmentType = keyof typeof APPOINTMENT_TYPES;

export const CONSULTATION_STATUS = {
  WAITING: { name: 'Waiting', color: 'yellow' },
  VITALS_TAKEN: { name: 'Vitals Recorded', color: 'blue' },
  WITH_DOCTOR: { name: 'With Doctor', color: 'purple' },
  COMPLETED: { name: 'Completed', color: 'green' },
  REFERRED: { name: 'Referred', color: 'orange' },
} as const;

export type ConsultationStatus = keyof typeof CONSULTATION_STATUS;

export const PRESCRIPTION_STATUS = {
  CREATED: { name: 'Created', color: 'blue' },
  PENDING_DISPENSING: { name: 'Pending Dispensing', color: 'yellow' },
  PARTIALLY_DISPENSED: { name: 'Partially Dispensed', color: 'orange' },
  DISPENSED: { name: 'Dispensed', color: 'green' },
  CANCELLED: { name: 'Cancelled', color: 'red' },
  EXPIRED: { name: 'Expired', color: 'gray' },
} as const;

export type PrescriptionStatus = keyof typeof PRESCRIPTION_STATUS;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = typeof BLOOD_GROUPS[number];

export const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'] as const;
export type Genotype = typeof GENOTYPES[number];

export const PAYMENT_TYPES = {
  CASH: 'Cash',
  CARD: 'Card/POS',
  TRANSFER: 'Bank Transfer',
  HMO: 'HMO/Insurance',
  COMPANY: 'Company Account',
} as const;

export type PaymentType = keyof typeof PAYMENT_TYPES;

// ============================================================================
// TYPES
// ============================================================================

export interface PatientMetadata {
  contactType: 'PATIENT';
  medicalRecordNumber: string;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  primaryPhysicianId?: string;
  emergencyContactId?: string;
  lastVisitDate?: string;
}

export interface DoctorMetadata {
  staffType: 'DOCTOR';
  licenseNumber: string;
  licenseExpiry?: string;
  specializations: string[];
  qualifications: string[];
  consultationFee: number;
  availableDays: string[];
  maxPatientsPerDay: number;
}

export interface VitalSigns {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bloodSugar?: number;
  recordedAt: string;
  recordedBy: string;
}

export interface Diagnosis {
  code: string;  // ICD-10
  description: string;
  type: 'PRIMARY' | 'SECONDARY';
}

export interface ConsultationRecord {
  id: string;
  tenantId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: ConsultationStatus;
  vitalSigns?: VitalSigns;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  diagnosis: Diagnosis[];
  treatmentPlan?: string;
  labOrders?: string[];
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  productId?: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  dispensed?: boolean;
  dispensedQuantity?: number;
}

export interface Prescription {
  id: string;
  tenantId: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  validUntil: string;
  createdAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
  notes?: string;
}

// ============================================================================
// CAPABILITY BUNDLE
// ============================================================================

export const HEALTH_CAPABILITY_BUNDLE = {
  key: 'health',
  name: 'Health Suite',
  description: 'Complete clinic and hospital management solution',
  requiredCapabilities: ['crm', 'hr', 'billing', 'inventory', 'payments', 'pos'],
  optionalCapabilities: ['analytics', 'campaigns'],
};

// ============================================================================
// COMMON MEDICAL DATA
// ============================================================================

export const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa drugs',
  'Aspirin',
  'NSAIDs',
  'Latex',
  'Shellfish',
  'Peanuts',
  'Eggs',
  'Milk',
  'Soy',
];

export const COMMON_CONDITIONS = [
  'Hypertension',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Asthma',
  'Heart Disease',
  'Arthritis',
  'Thyroid Disorder',
  'Epilepsy',
  'HIV/AIDS',
  'Sickle Cell Disease',
];

export const DOCTOR_SPECIALIZATIONS = [
  'General Practice',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Surgery',
  'Orthopedics',
  'Cardiology',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
  'Radiology',
  'Pathology',
  'Emergency Medicine',
];

export const COMMON_LAB_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count' },
  { code: 'FBS', name: 'Fasting Blood Sugar' },
  { code: 'RBS', name: 'Random Blood Sugar' },
  { code: 'LFT', name: 'Liver Function Test' },
  { code: 'RFT', name: 'Renal Function Test' },
  { code: 'LIPID', name: 'Lipid Profile' },
  { code: 'UA', name: 'Urinalysis' },
  { code: 'MP', name: 'Malaria Parasite' },
  { code: 'WIDAL', name: 'Widal Test' },
  { code: 'HIV', name: 'HIV Screening' },
  { code: 'HBsAg', name: 'Hepatitis B' },
  { code: 'PT', name: 'Pregnancy Test' },
];

// ============================================================================
// HELPERS
// ============================================================================

export function generateMRN(tenantId: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MRN-${year}-${random}`;
}

export function generatePrescriptionId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RX-${year}-${random}`;
}

export function getAppointmentDuration(type: AppointmentType): number {
  return APPOINTMENT_TYPES[type]?.duration || 30;
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
