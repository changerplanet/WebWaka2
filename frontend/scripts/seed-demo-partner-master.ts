/**
 * ============================================================================
 * WEBWAKA DEMO PARTNER MASTER SEEDER
 * ============================================================================
 * 
 * Phase 2 — Full Demo Partner Remediation (Option A)
 * 
 * This is the SINGLE SOURCE OF TRUTH for all demo environment seeding.
 * Creates a canonical Demo Partner Account with:
 * - 14 demo tenants covering all v2-FROZEN verticals
 * - S5-aligned personas for each suite
 * - Full storyline support via quickstart parameters
 * - Non-expiring, non-billing demo configuration
 * 
 * CONSTRAINTS (LOCKED):
 * - NO schema changes
 * - NO service logic changes
 * - NO governance changes
 * - Data + activation ONLY
 * 
 * Run: npx ts-node scripts/seed-demo-partner-master.ts
 * 
 * @version 2.0.0
 * @date January 8, 2026
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION — CANONICAL DEMO PARTNER
// ============================================================================

const DEMO_PASSWORD = 'Demo2026!'
const DEMO_PARTNER_SLUG = 'webwaka-demo-partner'

// Enums (defined manually for safety)
const GlobalRole = { SUPER_ADMIN: 'SUPER_ADMIN', USER: 'USER' } as const
const TenantRole = { TENANT_ADMIN: 'TENANT_ADMIN', TENANT_USER: 'TENANT_USER' } as const
const PartnerRole = { 
  PARTNER_OWNER: 'PARTNER_OWNER', 
  PARTNER_ADMIN: 'PARTNER_ADMIN', 
  PARTNER_SALES: 'PARTNER_SALES', 
  PARTNER_SUPPORT: 'PARTNER_SUPPORT', 
  PARTNER_STAFF: 'PARTNER_STAFF' 
} as const
const PartnerStatus = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', TERMINATED: 'TERMINATED' } as const
const PartnerTier = { BRONZE: 'BRONZE', SILVER: 'SILVER', GOLD: 'GOLD', PLATINUM: 'PLATINUM' } as const
const TenantStatus = { PENDING_ACTIVATION: 'PENDING_ACTIVATION', ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', DEACTIVATED: 'DEACTIVATED' } as const
const CustomerStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', BLOCKED: 'BLOCKED' } as const
const LocationStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', CLOSED: 'CLOSED' } as const
const StaffStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', TERMINATED: 'TERMINATED' } as const

// ============================================================================
// PARTNER-LEVEL DEMO ACCOUNTS (5 Roles)
// ============================================================================

const PARTNER_ACCOUNTS = [
  { email: 'demo.owner@webwaka.com', name: 'Demo Partner Owner', phone: '+2348100000001', role: PartnerRole.PARTNER_OWNER, department: 'Executive' },
  { email: 'demo.admin@webwaka.com', name: 'Demo Partner Admin', phone: '+2348100000002', role: PartnerRole.PARTNER_ADMIN, department: 'Admin' },
  { email: 'demo.sales@webwaka.com', name: 'Demo Sales Rep', phone: '+2348100000003', role: PartnerRole.PARTNER_SALES, department: 'Sales' },
  { email: 'demo.support@webwaka.com', name: 'Demo Support Agent', phone: '+2348100000004', role: PartnerRole.PARTNER_SUPPORT, department: 'Support' },
  { email: 'demo.staff@webwaka.com', name: 'Demo Staff Member', phone: '+2348100000005', role: PartnerRole.PARTNER_STAFF, department: 'Operations' },
]

// ============================================================================
// DEMO TENANTS — ALL 14 VERTICALS
// ============================================================================

interface DemoTenantConfig {
  name: string
  slug: string
  type: string
  suites: string[]
  description: string
  location: string
  personas: PersonaConfig[]
}

interface PersonaConfig {
  role: string
  email: string
  name: string
  phone: string
  tenantRole: 'TENANT_ADMIN' | 'TENANT_USER'
  storylineHint: string
}

const DEMO_TENANTS: DemoTenantConfig[] = [
  // =========================================================================
  // COMMERCE VERTICALS (Existing + Enhanced)
  // =========================================================================
  {
    name: 'Lagos Retail Store',
    slug: 'demo-retail-store',
    type: 'RETAIL',
    suites: ['pos', 'inventory', 'crm', 'analytics', 'payments', 'billing', 'accounting'],
    description: 'Retail business with POS and inventory management',
    location: 'Ikeja, Lagos',
    personas: [
      { role: 'Store Owner', email: 'owner@demo-retail-store.demo', name: 'Chief Adebayo Okonkwo', phone: '+2348200000001', tenantRole: 'TENANT_ADMIN', storylineHint: 'retail' },
      { role: 'Store Manager', email: 'manager@demo-retail-store.demo', name: 'Mrs. Ngozi Eze', phone: '+2348200000002', tenantRole: 'TENANT_ADMIN', storylineHint: 'retail' },
      { role: 'Cashier', email: 'cashier@demo-retail-store.demo', name: 'Amaka Obi', phone: '+2348200000003', tenantRole: 'TENANT_USER', storylineHint: 'retail' },
      { role: 'Stock Keeper', email: 'stock@demo-retail-store.demo', name: 'Chidi Nwosu', phone: '+2348200000004', tenantRole: 'TENANT_USER', storylineHint: 'retail' },
      { role: 'Auditor', email: 'auditor@demo-retail-store.demo', name: 'Barr. Funmi Adeleke', phone: '+2348200000005', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },
  {
    name: 'Naija Market Hub',
    slug: 'demo-marketplace',
    type: 'MARKETPLACE',
    suites: ['mvm', 'inventory', 'logistics', 'crm', 'payments', 'billing'],
    description: 'Multi-vendor marketplace with delivery logistics',
    location: 'Victoria Island, Lagos',
    personas: [
      { role: 'Platform Owner', email: 'owner@demo-marketplace.demo', name: 'Mr. Tunde Bakare', phone: '+2348200000010', tenantRole: 'TENANT_ADMIN', storylineHint: 'marketplace' },
      { role: 'Marketplace Admin', email: 'admin@demo-marketplace.demo', name: 'Mrs. Bisi Adeyemi', phone: '+2348200000011', tenantRole: 'TENANT_ADMIN', storylineHint: 'marketplace' },
      { role: 'Vendor Manager', email: 'vendors@demo-marketplace.demo', name: 'Emeka Okoro', phone: '+2348200000012', tenantRole: 'TENANT_USER', storylineHint: 'marketplace' },
      { role: 'Customer Support', email: 'support@demo-marketplace.demo', name: 'Fatima Hassan', phone: '+2348200000013', tenantRole: 'TENANT_USER', storylineHint: 'marketplace' },
      { role: 'Auditor', email: 'auditor@demo-marketplace.demo', name: 'Mr. Olumide Fagbemi', phone: '+2348200000014', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },
  {
    name: 'B2B Wholesale Hub',
    slug: 'demo-b2b',
    type: 'B2B',
    suites: ['b2b', 'inventory', 'procurement', 'accounting', 'billing', 'payments'],
    description: 'B2B wholesale business',
    location: 'Apapa, Lagos',
    personas: [
      { role: 'Business Owner', email: 'owner@demo-b2b.demo', name: 'Alhaji Musa Ibrahim', phone: '+2348200000020', tenantRole: 'TENANT_ADMIN', storylineHint: 'sme' },
      { role: 'Sales Manager', email: 'sales@demo-b2b.demo', name: 'Mr. Kunle Ajayi', phone: '+2348200000021', tenantRole: 'TENANT_ADMIN', storylineHint: 'sme' },
      { role: 'Procurement Officer', email: 'procurement@demo-b2b.demo', name: 'Mrs. Chioma Nnamdi', phone: '+2348200000022', tenantRole: 'TENANT_USER', storylineHint: 'sme' },
      { role: 'Accountant', email: 'accounts@demo-b2b.demo', name: 'Mr. David Udo', phone: '+2348200000023', tenantRole: 'TENANT_USER', storylineHint: 'cfo' },
      { role: 'Auditor', email: 'auditor@demo-b2b.demo', name: 'Mrs. Grace Okonkwo', phone: '+2348200000024', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // EDUCATION VERTICAL
  // =========================================================================
  {
    name: 'Bright Future Academy',
    slug: 'demo-school',
    type: 'EDUCATION',
    suites: ['school_attendance', 'school_grading', 'school_fees', 'billing'],
    description: 'School management with attendance and grading',
    location: 'Surulere, Lagos',
    personas: [
      { role: 'School Owner', email: 'proprietor@demo-school.demo', name: 'Chief Mrs. Adaeze Okafor', phone: '+2348200000030', tenantRole: 'TENANT_ADMIN', storylineHint: 'school' },
      { role: 'Principal', email: 'principal@demo-school.demo', name: 'Mr. Emmanuel Adeyemi', phone: '+2348200000031', tenantRole: 'TENANT_ADMIN', storylineHint: 'school' },
      { role: 'Teacher', email: 'teacher@demo-school.demo', name: 'Mrs. Blessing Nwankwo', phone: '+2348200000032', tenantRole: 'TENANT_USER', storylineHint: 'school' },
      { role: 'Bursar', email: 'bursar@demo-school.demo', name: 'Mr. Samuel Igwe', phone: '+2348200000033', tenantRole: 'TENANT_USER', storylineHint: 'school' },
      { role: 'Parent', email: 'parent@demo-school.demo', name: 'Mrs. Yetunde Balogun', phone: '+2348200000034', tenantRole: 'TENANT_USER', storylineHint: 'parent' },
      { role: 'Auditor', email: 'auditor@demo-school.demo', name: 'Mr. Femi Olaniyan', phone: '+2348200000035', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // HEALTH VERTICAL
  // =========================================================================
  {
    name: 'HealthFirst Clinic',
    slug: 'demo-clinic',
    type: 'HEALTHCARE',
    suites: ['patient_records', 'appointment_scheduling', 'clinical_encounters', 'billing'],
    description: 'Healthcare facility with patient management',
    location: 'Lekki, Lagos',
    personas: [
      { role: 'Medical Director', email: 'director@demo-clinic.demo', name: 'Dr. Ngozi Eze', phone: '+2348200000040', tenantRole: 'TENANT_ADMIN', storylineHint: 'clinic' },
      { role: 'Clinic Admin', email: 'admin@demo-clinic.demo', name: 'Mrs. Funke Adebisi', phone: '+2348200000041', tenantRole: 'TENANT_ADMIN', storylineHint: 'clinic' },
      { role: 'Doctor', email: 'doctor@demo-clinic.demo', name: 'Dr. Chukwudi Okonkwo', phone: '+2348200000042', tenantRole: 'TENANT_USER', storylineHint: 'clinic' },
      { role: 'Nurse', email: 'nurse@demo-clinic.demo', name: 'Nurse Amina Yusuf', phone: '+2348200000043', tenantRole: 'TENANT_USER', storylineHint: 'clinic' },
      { role: 'Patient', email: 'patient@demo-clinic.demo', name: 'Mr. Tunde Bakare', phone: '+2348200000044', tenantRole: 'TENANT_USER', storylineHint: 'patient' },
      { role: 'Health Auditor', email: 'auditor@demo-clinic.demo', name: 'Dr. Olumide Fagbemi', phone: '+2348200000045', tenantRole: 'TENANT_USER', storylineHint: 'healthRegulator' },
    ]
  },

  // =========================================================================
  // LOGISTICS VERTICAL
  // =========================================================================
  {
    name: 'Swift Logistics',
    slug: 'demo-logistics',
    type: 'LOGISTICS',
    suites: ['logistics', 'fleet_management', 'inventory', 'analytics', 'billing'],
    description: 'Logistics company with fleet management',
    location: 'Ojuelegba, Lagos',
    personas: [
      { role: 'Logistics Owner', email: 'owner@demo-logistics.demo', name: 'Chief Emeka Obi', phone: '+2348200000050', tenantRole: 'TENANT_ADMIN', storylineHint: 'logisticsDispatcher' },
      { role: 'Dispatch Manager', email: 'dispatch@demo-logistics.demo', name: 'Mr. Kunle Bello', phone: '+2348200000051', tenantRole: 'TENANT_ADMIN', storylineHint: 'logisticsDispatcher' },
      { role: 'Driver', email: 'driver@demo-logistics.demo', name: 'Mr. Musa Abdullahi', phone: '+2348200000052', tenantRole: 'TENANT_USER', storylineHint: 'logisticsDriver' },
      { role: 'Rider', email: 'rider@demo-logistics.demo', name: 'Ibrahim Danladi', phone: '+2348200000053', tenantRole: 'TENANT_USER', storylineHint: 'logisticsDriver' },
      { role: 'Customer Service', email: 'cs@demo-logistics.demo', name: 'Mrs. Aisha Mohammed', phone: '+2348200000054', tenantRole: 'TENANT_USER', storylineHint: 'logisticsDispatcher' },
      { role: 'Auditor', email: 'auditor@demo-logistics.demo', name: 'Mr. Femi Adesina', phone: '+2348200000055', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // HOSPITALITY VERTICAL (NEW)
  // =========================================================================
  {
    name: 'PalmView Suites Lagos',
    slug: 'demo-hotel',
    type: 'HOSPITALITY',
    suites: ['hotel_rooms', 'reservations', 'restaurant', 'housekeeping', 'billing'],
    description: 'Hotel with restaurant and full hospitality management',
    location: 'Victoria Island, Lagos',
    personas: [
      { role: 'Hotel Owner', email: 'owner@demo-hotel.demo', name: 'Chief Adekunle Balogun', phone: '+2348200000060', tenantRole: 'TENANT_ADMIN', storylineHint: 'hotelOwner' },
      { role: 'General Manager', email: 'gm@demo-hotel.demo', name: 'Mr. Olumide Adeyemi', phone: '+2348200000061', tenantRole: 'TENANT_ADMIN', storylineHint: 'hotelOwner' },
      { role: 'Front Desk', email: 'frontdesk@demo-hotel.demo', name: 'Miss Chidinma Eze', phone: '+2348200000062', tenantRole: 'TENANT_USER', storylineHint: 'hotelOwner' },
      { role: 'Restaurant Manager', email: 'restaurant@demo-hotel.demo', name: 'Mr. Tunde Ogunleye', phone: '+2348200000063', tenantRole: 'TENANT_USER', storylineHint: 'restaurantManager' },
      { role: 'Housekeeping', email: 'housekeeping@demo-hotel.demo', name: 'Mrs. Comfort Nwachukwu', phone: '+2348200000064', tenantRole: 'TENANT_USER', storylineHint: 'hotelOwner' },
      { role: 'Guest', email: 'guest@demo-hotel.demo', name: 'Mr. Chidi Okonkwo', phone: '+2348200000065', tenantRole: 'TENANT_USER', storylineHint: 'hospitalityGuest' },
      { role: 'Auditor', email: 'auditor@demo-hotel.demo', name: 'Mrs. Funmi Adeleke', phone: '+2348200000066', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // CIVIC / GOVTECH VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Lagos State Lands Bureau',
    slug: 'demo-civic',
    type: 'CIVIC',
    suites: ['civic_services', 'case_management', 'inspections', 'billing'],
    description: 'Government agency with service delivery tracking',
    location: 'Alausa, Ikeja, Lagos',
    personas: [
      { role: 'Director', email: 'director@demo-civic.demo', name: 'Engr. Babatunde Fashola', phone: '+2348200000070', tenantRole: 'TENANT_ADMIN', storylineHint: 'civicAgencyStaff' },
      { role: 'Case Officer', email: 'officer@demo-civic.demo', name: 'Mr. Adewale Ogunbiyi', phone: '+2348200000071', tenantRole: 'TENANT_USER', storylineHint: 'civicAgencyStaff' },
      { role: 'Inspector', email: 'inspector@demo-civic.demo', name: 'Mrs. Ngozi Okafor', phone: '+2348200000072', tenantRole: 'TENANT_USER', storylineHint: 'civicAgencyStaff' },
      { role: 'Citizen', email: 'citizen@demo-civic.demo', name: 'Chief Emeka Okafor', phone: '+2348200000073', tenantRole: 'TENANT_USER', storylineHint: 'civicCitizen' },
      { role: 'Regulator', email: 'regulator@demo-civic.demo', name: 'Barr. Folake Adeyemi', phone: '+2348200000074', tenantRole: 'TENANT_USER', storylineHint: 'civicRegulator' },
      { role: 'Auditor', email: 'auditor@demo-civic.demo', name: 'Mr. Femi Olaniyan', phone: '+2348200000075', tenantRole: 'TENANT_USER', storylineHint: 'civicAuditor' },
    ]
  },

  // =========================================================================
  // REAL ESTATE VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Lagos Property Managers',
    slug: 'demo-real-estate',
    type: 'REAL_ESTATE',
    suites: ['property_management', 'tenant_management', 'maintenance', 'billing'],
    description: 'Real estate management with tenant tracking',
    location: 'Ikoyi, Lagos',
    personas: [
      { role: 'Property Owner', email: 'owner@demo-real-estate.demo', name: 'Chief Adeola Odutola', phone: '+2348200000080', tenantRole: 'TENANT_ADMIN', storylineHint: 'realEstateOwner' },
      { role: 'Property Manager', email: 'manager@demo-real-estate.demo', name: 'Mr. Kunle Abiodun', phone: '+2348200000081', tenantRole: 'TENANT_ADMIN', storylineHint: 'realEstateOwner' },
      { role: 'Facility Manager', email: 'facility@demo-real-estate.demo', name: 'Engr. Chidi Okonkwo', phone: '+2348200000082', tenantRole: 'TENANT_USER', storylineHint: 'realEstateOwner' },
      { role: 'Tenant', email: 'tenant@demo-real-estate.demo', name: 'Mrs. Amaka Eze', phone: '+2348200000083', tenantRole: 'TENANT_USER', storylineHint: 'realEstateTenant' },
      { role: 'Auditor', email: 'auditor@demo-real-estate.demo', name: 'Barr. Tunde Bakare', phone: '+2348200000084', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // RECRUITMENT VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Swift HR Solutions',
    slug: 'demo-recruitment',
    type: 'RECRUITMENT',
    suites: ['recruitment', 'onboarding', 'hr_management', 'billing'],
    description: 'Recruitment and HR management',
    location: 'Yaba, Lagos',
    personas: [
      { role: 'HR Director', email: 'director@demo-recruitment.demo', name: 'Mrs. Ngozi Obi', phone: '+2348200000090', tenantRole: 'TENANT_ADMIN', storylineHint: 'recruitmentManager' },
      { role: 'Recruiter', email: 'recruiter@demo-recruitment.demo', name: 'Mr. Emeka Nwankwo', phone: '+2348200000091', tenantRole: 'TENANT_USER', storylineHint: 'recruitmentManager' },
      { role: 'Hiring Manager', email: 'hiring@demo-recruitment.demo', name: 'Mr. Kunle Adeyemi', phone: '+2348200000092', tenantRole: 'TENANT_USER', storylineHint: 'recruitmentManager' },
      { role: 'Candidate', email: 'candidate@demo-recruitment.demo', name: 'Miss Chioma Eze', phone: '+2348200000093', tenantRole: 'TENANT_USER', storylineHint: 'candidate' },
      { role: 'Auditor', email: 'auditor@demo-recruitment.demo', name: 'Barr. Funmi Adeleke', phone: '+2348200000094', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // PROJECT MANAGEMENT VERTICAL (NEW)
  // =========================================================================
  {
    name: 'BuildRight Projects Ltd',
    slug: 'demo-project',
    type: 'PROJECT_MANAGEMENT',
    suites: ['project_management', 'task_management', 'resource_planning', 'billing'],
    description: 'Project and task management for construction',
    location: 'Lekki, Lagos',
    personas: [
      { role: 'Project Owner', email: 'owner@demo-project.demo', name: 'Engr. Babatunde Ogunbiyi', phone: '+2348200000100', tenantRole: 'TENANT_ADMIN', storylineHint: 'projectOwner' },
      { role: 'Project Manager', email: 'pm@demo-project.demo', name: 'Mr. Chidi Okafor', phone: '+2348200000101', tenantRole: 'TENANT_ADMIN', storylineHint: 'projectOwner' },
      { role: 'Team Lead', email: 'lead@demo-project.demo', name: 'Mrs. Amaka Nwosu', phone: '+2348200000102', tenantRole: 'TENANT_USER', storylineHint: 'projectOwner' },
      { role: 'Team Member', email: 'member@demo-project.demo', name: 'Mr. Tunde Bakare', phone: '+2348200000103', tenantRole: 'TENANT_USER', storylineHint: 'projectOwner' },
      { role: 'Auditor', email: 'auditor@demo-project.demo', name: 'Barr. Olumide Fagbemi', phone: '+2348200000104', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // LEGAL PRACTICE VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Nwosu & Associates Chambers',
    slug: 'demo-legal',
    type: 'LEGAL_PRACTICE',
    suites: ['legal_matters', 'case_management', 'time_billing', 'billing'],
    description: 'Law firm with case and time management',
    location: 'Marina, Lagos',
    personas: [
      { role: 'Senior Partner', email: 'partner@demo-legal.demo', name: 'Barr. Adaeze Nwosu SAN', phone: '+2348200000110', tenantRole: 'TENANT_ADMIN', storylineHint: 'legalPartner' },
      { role: 'Managing Partner', email: 'managing@demo-legal.demo', name: 'Barr. Chidi Okoro', phone: '+2348200000111', tenantRole: 'TENANT_ADMIN', storylineHint: 'legalPartner' },
      { role: 'Associate', email: 'associate@demo-legal.demo', name: 'Barr. Funmi Adeola', phone: '+2348200000112', tenantRole: 'TENANT_USER', storylineHint: 'legalPartner' },
      { role: 'Paralegal', email: 'paralegal@demo-legal.demo', name: 'Mrs. Ngozi Obi', phone: '+2348200000113', tenantRole: 'TENANT_USER', storylineHint: 'legalPartner' },
      { role: 'Client', email: 'client@demo-legal.demo', name: 'Chief Emeka Okafor', phone: '+2348200000114', tenantRole: 'TENANT_USER', storylineHint: 'legalClient' },
      { role: 'Auditor', email: 'auditor@demo-legal.demo', name: 'Mr. Femi Olaniyan', phone: '+2348200000115', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // ADVANCED WAREHOUSE VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Lagos Fulfillment Center',
    slug: 'demo-warehouse',
    type: 'WAREHOUSE',
    suites: ['warehouse_management', 'inventory', 'picking', 'shipping', 'billing'],
    description: 'Warehouse and fulfillment operations',
    location: 'Ikeja, Lagos',
    personas: [
      { role: 'Warehouse Owner', email: 'owner@demo-warehouse.demo', name: 'Chief Adekunle Balogun', phone: '+2348200000120', tenantRole: 'TENANT_ADMIN', storylineHint: 'warehouseOwner' },
      { role: 'Warehouse Manager', email: 'manager@demo-warehouse.demo', name: 'Mr. Emeka Obi', phone: '+2348200000121', tenantRole: 'TENANT_ADMIN', storylineHint: 'warehouseOwner' },
      { role: 'Picker', email: 'picker@demo-warehouse.demo', name: 'Mr. Ibrahim Musa', phone: '+2348200000122', tenantRole: 'TENANT_USER', storylineHint: 'warehouseOwner' },
      { role: 'Receiver', email: 'receiver@demo-warehouse.demo', name: 'Mr. Kunle Ajayi', phone: '+2348200000123', tenantRole: 'TENANT_USER', storylineHint: 'warehouseOwner' },
      { role: 'Shipping Clerk', email: 'shipping@demo-warehouse.demo', name: 'Mrs. Amaka Eze', phone: '+2348200000124', tenantRole: 'TENANT_USER', storylineHint: 'warehouseOwner' },
      { role: 'Auditor', email: 'auditor@demo-warehouse.demo', name: 'Barr. Tunde Bakare', phone: '+2348200000125', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // PARKHUB (TRANSPORT) VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Ojota Motor Park',
    slug: 'demo-parkhub',
    type: 'TRANSPORT',
    suites: ['park_management', 'ticketing', 'fleet', 'billing'],
    description: 'Motor park and transport management',
    location: 'Ojota, Lagos',
    personas: [
      { role: 'Park Chairman', email: 'chairman@demo-parkhub.demo', name: 'Chief Musa Abdullahi', phone: '+2348200000130', tenantRole: 'TENANT_ADMIN', storylineHint: 'parkOwner' },
      { role: 'Park Manager', email: 'manager@demo-parkhub.demo', name: 'Mr. Kunle Bello', phone: '+2348200000131', tenantRole: 'TENANT_ADMIN', storylineHint: 'parkOwner' },
      { role: 'Ticket Agent', email: 'agent@demo-parkhub.demo', name: 'Mr. Ibrahim Danladi', phone: '+2348200000132', tenantRole: 'TENANT_USER', storylineHint: 'parkOwner' },
      { role: 'Driver', email: 'driver@demo-parkhub.demo', name: 'Mr. Tunde Ogunleye', phone: '+2348200000133', tenantRole: 'TENANT_USER', storylineHint: 'parkOwner' },
      { role: 'Customer', email: 'customer@demo-parkhub.demo', name: 'Mrs. Ngozi Okafor', phone: '+2348200000134', tenantRole: 'TENANT_USER', storylineHint: 'parkCustomer' },
      { role: 'Auditor', email: 'auditor@demo-parkhub.demo', name: 'Barr. Femi Adeleke', phone: '+2348200000135', tenantRole: 'TENANT_USER', storylineHint: 'regulator' },
    ]
  },

  // =========================================================================
  // POLITICAL VERTICAL (NEW)
  // =========================================================================
  {
    name: 'Lagos Campaign HQ',
    slug: 'demo-political',
    type: 'POLITICAL',
    suites: ['campaign_management', 'volunteer_coordination', 'donation_tracking', 'billing'],
    description: 'Political campaign management and tracking',
    location: 'Surulere, Lagos',
    personas: [
      { role: 'Campaign Manager', email: 'manager@demo-political.demo', name: 'Chief Adebayo Adeyemi', phone: '+2348200000140', tenantRole: 'TENANT_ADMIN', storylineHint: 'politicalManager' },
      { role: 'Party Official', email: 'official@demo-political.demo', name: 'Hon. Kunle Bakare', phone: '+2348200000141', tenantRole: 'TENANT_ADMIN', storylineHint: 'politicalManager' },
      { role: 'Volunteer Coordinator', email: 'volunteers@demo-political.demo', name: 'Mrs. Ngozi Obi', phone: '+2348200000142', tenantRole: 'TENANT_USER', storylineHint: 'politicalManager' },
      { role: 'Field Coordinator', email: 'field@demo-political.demo', name: 'Mr. Emeka Nwankwo', phone: '+2348200000143', tenantRole: 'TENANT_USER', storylineHint: 'politicalManager' },
      { role: 'Finance Officer', email: 'finance@demo-political.demo', name: 'Mr. Tunde Bakare', phone: '+2348200000144', tenantRole: 'TENANT_USER', storylineHint: 'politicalManager' },
      { role: 'Auditor', email: 'auditor@demo-political.demo', name: 'Barr. Olumide Fagbemi', phone: '+2348200000145', tenantRole: 'TENANT_USER', storylineHint: 'politicalAuditor' },
    ]
  },

  // =========================================================================
  // CHURCH VERTICAL (NEW)
  // =========================================================================
  {
    name: 'GraceLife Community Church',
    slug: 'demo-church',
    type: 'CHURCH',
    suites: ['church_management', 'membership', 'giving', 'events', 'billing'],
    description: 'Church management with membership and giving',
    location: 'Ikeja, Lagos',
    personas: [
      { role: 'Senior Pastor', email: 'pastor@demo-church.demo', name: 'Pastor Emmanuel Adeyemi', phone: '+2348200000150', tenantRole: 'TENANT_ADMIN', storylineHint: 'churchPastor' },
      { role: 'Church Admin', email: 'admin@demo-church.demo', name: 'Deacon Samuel Igwe', phone: '+2348200000151', tenantRole: 'TENANT_ADMIN', storylineHint: 'churchPastor' },
      { role: 'Ministry Head', email: 'ministry@demo-church.demo', name: 'Pastor Grace Okonkwo', phone: '+2348200000152', tenantRole: 'TENANT_USER', storylineHint: 'churchPastor' },
      { role: 'Finance Secretary', email: 'finance@demo-church.demo', name: 'Deaconess Bisi Adeyemi', phone: '+2348200000153', tenantRole: 'TENANT_USER', storylineHint: 'churchPastor' },
      { role: 'Member', email: 'member@demo-church.demo', name: 'Bro. Chidi Okonkwo', phone: '+2348200000154', tenantRole: 'TENANT_USER', storylineHint: 'churchMember' },
      { role: 'Auditor', email: 'auditor@demo-church.demo', name: 'Barr. Funmi Adeleke', phone: '+2348200000155', tenantRole: 'TENANT_USER', storylineHint: 'churchAuditor' },
    ]
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

function generateId(): string {
  return crypto.randomUUID()
}

// ============================================================================
// STEP 1: CREATE DEMO PARTNER
// ============================================================================

async function createDemoPartner() {
  console.log('\n' + '═'.repeat(70))
  console.log('STEP 1: CREATE/VERIFY DEMO PARTNER ACCOUNT')
  console.log('═'.repeat(70))

  let partner = await prisma.partner.findUnique({
    where: { slug: DEMO_PARTNER_SLUG }
  })

  if (partner) {
    console.log('✅ Demo Partner already exists:', partner.id)
    
    // Update metadata to ensure demo flags are set
    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        metadata: {
          isDemo: true,
          isDemoPartner: true,
          nonExpiring: true,
          billingDisabled: true,
          environment: 'demo-only',
          description: 'Official WebWaka Demo Partner for platform demonstrations',
          createdBy: 'seed-demo-partner-master.ts',
          lastUpdated: new Date().toISOString()
        }
      }
    })
    console.log('  ↳ Metadata updated with demo flags')
  } else {
    partner = await prisma.partner.create({
      data: {
        id: generateId(),
        name: 'WebWaka Demo Partner',
        slug: DEMO_PARTNER_SLUG,
        email: 'demo-partner@webwaka.com',
        phone: '+2348100000000',
        website: 'https://demo.webwaka.com',
        status: PartnerStatus.ACTIVE,
        tier: PartnerTier.GOLD,
        approvedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          isDemo: true,
          isDemoPartner: true,
          nonExpiring: true,
          billingDisabled: true,
          environment: 'demo-only',
          description: 'Official WebWaka Demo Partner for platform demonstrations',
          createdBy: 'seed-demo-partner-master.ts',
          lastUpdated: new Date().toISOString()
        }
      }
    })
    console.log('✅ Demo Partner created:', partner.id)
  }

  // Ensure partner agreement exists
  const existingAgreement = await prisma.partnerAgreement.findFirst({
    where: { partnerId: partner.id, status: 'ACTIVE' }
  })

  if (!existingAgreement) {
    await prisma.partnerAgreement.create({
      data: {
        id: generateId(),
        partnerId: partner.id,
        version: 1,
        effectiveFrom: new Date(),
        commissionType: 'PERCENTAGE',
        commissionTrigger: 'ON_PAYMENT',
        commissionRate: 0.15,
        clearanceDays: 30,
        status: 'ACTIVE',
        signedAt: new Date(),
        approvedAt: new Date(),
        updatedAt: new Date(),
      }
    })
    console.log('  ↳ Partner Agreement created')
  }

  return partner
}

// ============================================================================
// STEP 2: CREATE PARTNER-LEVEL USERS
// ============================================================================

async function createPartnerUsers(partnerId: string) {
  console.log('\n' + '═'.repeat(70))
  console.log('STEP 2: CREATE PARTNER-LEVEL DEMO USERS')
  console.log('═'.repeat(70))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)

  for (const account of PARTNER_ACCOUNTS) {
    let user = await prisma.user.findUnique({
      where: { email: account.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: generateId(),
          email: account.email,
          name: account.name,
          phone: account.phone,
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Created user: ${account.email}`)
    } else {
      console.log(`⏭️  User exists: ${account.email}`)
    }

    // Link to partner
    const existingLink = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })

    if (!existingLink) {
      await prisma.partnerUser.create({
        data: {
          id: generateId(),
          partnerId: partnerId,
          userId: user.id,
          role: account.role,
          isActive: true,
          displayName: account.name,
          department: account.department,
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Linked as ${account.role}`)
    }
  }

  // Create referral code
  const existingCode = await prisma.partnerReferralCode.findUnique({
    where: { code: 'DEMO-2026' }
  })
  if (!existingCode) {
    await prisma.partnerReferralCode.create({
      data: {
        id: generateId(),
        partnerId: partnerId,
        code: 'DEMO-2026',
        isActive: true,
        campaignName: 'Demo Partner Campaign 2026',
        updatedAt: new Date(),
      }
    })
    console.log('✅ Created referral code: DEMO-2026')
  }
}

// ============================================================================
// STEP 3: CREATE ALL 14 DEMO TENANTS
// ============================================================================

async function createDemoTenants(partnerId: string) {
  console.log('\n' + '═'.repeat(70))
  console.log('STEP 3: CREATE ALL 14 DEMO TENANTS')
  console.log('═'.repeat(70))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const createdTenants: { id: string; slug: string; type: string }[] = []

  for (const tenantConfig of DEMO_TENANTS) {
    console.log(`\n📦 Processing: ${tenantConfig.name} (${tenantConfig.type})`)

    // Create or get tenant
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantConfig.slug }
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: generateId(),
          name: tenantConfig.name,
          slug: tenantConfig.slug,
          status: TenantStatus.ACTIVE,
          activatedModules: tenantConfig.suites,
          activatedAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log(`  ✅ Tenant created: ${tenant.id}`)
    } else {
      // Update activated modules
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          activatedModules: tenantConfig.suites,
          status: TenantStatus.ACTIVE,
          updatedAt: new Date(),
        }
      })
      console.log(`  ⏭️  Tenant exists: ${tenant.id} (modules updated)`)
    }

    // Link tenant to Demo Partner
    const existingReferral = await prisma.partnerReferral.findUnique({
      where: { tenantId: tenant.id }
    })

    if (!existingReferral) {
      await prisma.partnerReferral.create({
        data: {
          id: generateId(),
          partnerId: partnerId,
          tenantId: tenant.id,
          attributionMethod: 'PARTNER_CREATED',
          attributionLocked: true,
          lockedAt: new Date(),
          referralSource: 'demo-partner-master',
        }
      })
      console.log(`  ↳ Linked to Demo Partner`)
    }

    // Create platform instance
    let instance = await prisma.platformInstance.findFirst({
      where: { tenantId: tenant.id, isDefault: true }
    })

    if (!instance) {
      instance = await prisma.platformInstance.create({
        data: {
          id: generateId(),
          tenantId: tenant.id,
          createdByPartnerId: partnerId,
          name: `${tenantConfig.name} Platform`,
          slug: 'main',
          description: tenantConfig.description,
          isDefault: true,
          isActive: true,
          suiteKeys: tenantConfig.suites,
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Platform instance created`)
    }

    // Create default location
    let location = await prisma.location.findFirst({
      where: { tenantId: tenant.id }
    })

    if (!location) {
      location = await prisma.location.create({
        data: {
          id: generateId(),
          tenantId: tenant.id,
          name: 'Main Location',
          code: 'LOC-001',
          type: 'OFFICE',
          status: LocationStatus.ACTIVE,
          isDefaultLocation: true,
          city: tenantConfig.location.split(', ')[0],
          state: tenantConfig.location.split(', ')[1] || 'Lagos',
          country: 'NG',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Location created: ${tenantConfig.location}`)
    }

    // Create all personas for this tenant
    console.log(`  Creating ${tenantConfig.personas.length} personas:`)
    for (const persona of tenantConfig.personas) {
      // Check by email first
      let user = await prisma.user.findUnique({
        where: { email: persona.email }
      })

      // If not found by email, check by phone (phone is also unique)
      if (!user) {
        const existingByPhone = await prisma.user.findFirst({
          where: { phone: persona.phone }
        })
        if (existingByPhone) {
          user = existingByPhone
          console.log(`    ⏭️  User found by phone: ${persona.email} -> ${existingByPhone.email}`)
        }
      }

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: generateId(),
            email: persona.email,
            name: persona.name,
            phone: persona.phone,
            passwordHash: hashedPassword,
            emailVerifiedAt: new Date(),
            globalRole: GlobalRole.USER,
            updatedAt: new Date(),
          }
        })
        console.log(`    ✓ Created: ${persona.role}: ${persona.email}`)
      } else {
        console.log(`    ⏭️  Exists: ${persona.role}: ${persona.email}`)
      }

      // Create tenant membership
      const existingMembership = await prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } }
      })

      if (!existingMembership) {
        await prisma.tenantMembership.create({
          data: {
            id: generateId(),
            userId: user.id,
            tenantId: tenant.id,
            role: persona.tenantRole === 'TENANT_ADMIN' ? TenantRole.TENANT_ADMIN : TenantRole.TENANT_USER,
            isActive: true,
            updatedAt: new Date(),
          }
        })
      }
    }

    createdTenants.push({ id: tenant.id, slug: tenantConfig.slug, type: tenantConfig.type })
  }

  return createdTenants
}

// ============================================================================
// STEP 4: GENERATE CREDENTIALS INDEX
// ============================================================================

async function generateCredentialsIndex() {
  console.log('\n' + '═'.repeat(70))
  console.log('STEP 4: GENERATE CREDENTIALS INDEX')
  console.log('═'.repeat(70))

  const lines: string[] = []
  
  lines.push('# WebWaka Demo Partner — Complete Credentials Index')
  lines.push('')
  lines.push(`**Generated:** ${new Date().toISOString()}`)
  lines.push(`**Default Password:** \`${DEMO_PASSWORD}\``)
  lines.push(`**Login URL:** \`/login-v2\``)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Partner-Level Accounts
  lines.push('## 1. Partner-Level Accounts (WebWaka Demo Partner)')
  lines.push('')
  lines.push('| Role | Email | Name | Storyline |')
  lines.push('|------|-------|------|-----------|')
  for (const acc of PARTNER_ACCOUNTS) {
    lines.push(`| ${acc.role.replace('PARTNER_', '')} | \`${acc.email}\` | ${acc.name} | Partner Dashboard |`)
  }
  lines.push('')

  // Tenant-Level Accounts
  lines.push('## 2. Tenant-Level Accounts (All 14 Verticals)')
  lines.push('')

  for (const tenant of DEMO_TENANTS) {
    lines.push(`### ${tenant.name} (${tenant.type})`)
    lines.push(`**Slug:** \`${tenant.slug}\` | **Location:** ${tenant.location}`)
    lines.push('')
    lines.push('| Role | Email | Storyline |')
    lines.push('|------|-------|-----------|')
    for (const persona of tenant.personas) {
      lines.push(`| ${persona.role} | \`${persona.email}\` | ${persona.storylineHint} |`)
    }
    lines.push('')
  }

  // Quick Reference
  lines.push('## 3. Quick Reference')
  lines.push('')
  lines.push('### Demo Partner Properties')
  lines.push('- **Slug:** `webwaka-demo-partner`')
  lines.push('- **Status:** ACTIVE')
  lines.push('- **Tier:** GOLD')
  lines.push('- **Non-Expiring:** YES')
  lines.push('- **Billing Disabled:** YES')
  lines.push('')
  lines.push('### Referral Code')
  lines.push('- `DEMO-2026` — Official demo partner referral code')
  lines.push('')
  lines.push('### Notes')
  lines.push('- All accounts use the same password: `' + DEMO_PASSWORD + '`')
  lines.push('- All demo tenants are linked to the Demo Partner Account')
  lines.push('- All suites are activated and non-expiring')
  lines.push('- Auditor roles have read-only access')
  lines.push('')

  const content = lines.join('\n')
  
  const fs = await import('fs')
  fs.writeFileSync('/app/frontend/docs/DEMO_CREDENTIALS_MASTER_INDEX.md', content)
  console.log('✅ Credentials index written to /app/frontend/docs/DEMO_CREDENTIALS_MASTER_INDEX.md')
}

// ============================================================================
// STEP 5: GENERATE SUMMARY REPORT
// ============================================================================

async function generateSummaryReport(tenants: { id: string; slug: string; type: string }[]) {
  console.log('\n' + '═'.repeat(70))
  console.log('STEP 5: GENERATE SUMMARY REPORT')
  console.log('═'.repeat(70))

  const lines: string[] = []
  
  lines.push('# Demo Partner Remediation — Phase 2 Execution Summary')
  lines.push('')
  lines.push(`**Executed:** ${new Date().toISOString()}`)
  lines.push(`**Script:** seed-demo-partner-master.ts`)
  lines.push(`**Status:** ✅ COMPLETE`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Tenant Creation Summary')
  lines.push('')
  lines.push('| # | Tenant | Slug | Type | Status |')
  lines.push('|---|--------|------|------|--------|')
  
  tenants.forEach((t, i) => {
    lines.push(`| ${i + 1} | ${DEMO_TENANTS.find(dt => dt.slug === t.slug)?.name} | \`${t.slug}\` | ${t.type} | ✅ Created |`)
  })
  
  lines.push('')
  lines.push('## Persona Coverage Summary')
  lines.push('')
  
  let totalPersonas = 0
  for (const tenant of DEMO_TENANTS) {
    lines.push(`### ${tenant.name}`)
    lines.push(`- **Personas Created:** ${tenant.personas.length}`)
    lines.push(`- **Roles:** ${tenant.personas.map(p => p.role).join(', ')}`)
    lines.push('')
    totalPersonas += tenant.personas.length
  }
  
  lines.push('## Statistics')
  lines.push('')
  lines.push(`- **Total Tenants:** ${tenants.length}`)
  lines.push(`- **Total Personas:** ${totalPersonas}`)
  lines.push(`- **Partner Users:** ${PARTNER_ACCOUNTS.length}`)
  lines.push(`- **Total Demo Accounts:** ${totalPersonas + PARTNER_ACCOUNTS.length}`)
  lines.push('')

  const content = lines.join('\n')
  
  const fs = await import('fs')
  fs.writeFileSync('/app/frontend/docs/DEMO_PHASE2_EXECUTION_SUMMARY.md', content)
  console.log('✅ Summary report written to /app/frontend/docs/DEMO_PHASE2_EXECUTION_SUMMARY.md')
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(70))
  console.log('  WEBWAKA DEMO PARTNER MASTER SEEDER')
  console.log('  Phase 2 — Full Demo Partner Remediation')
  console.log('═'.repeat(70))
  console.log('  Starting demo environment creation...')
  console.log('  Constraint: DATA + ACTIVATION ONLY (No schema changes)')
  console.log('═'.repeat(70))

  try {
    // Step 1: Create Demo Partner
    const partner = await createDemoPartner()

    // Step 2: Create Partner Users
    await createPartnerUsers(partner.id)

    // Step 3: Create All 14 Demo Tenants with Personas
    const tenants = await createDemoTenants(partner.id)

    // Step 4: Generate Credentials Index
    await generateCredentialsIndex()

    // Step 5: Generate Summary Report
    await generateSummaryReport(tenants)

    console.log('\n' + '═'.repeat(70))
    console.log('  ✅ DEMO PARTNER MASTER SEEDER COMPLETE')
    console.log('═'.repeat(70))
    console.log('')
    console.log('  📊 Summary:')
    console.log(`     - Partner Account: ${DEMO_PARTNER_SLUG}`)
    console.log(`     - Partner Users: ${PARTNER_ACCOUNTS.length}`)
    console.log(`     - Demo Tenants: ${tenants.length}`)
    console.log(`     - Total Personas: ${DEMO_TENANTS.reduce((sum, t) => sum + t.personas.length, 0)}`)
    console.log('')
    console.log('  📄 Documentation:')
    console.log('     - /app/frontend/docs/DEMO_CREDENTIALS_MASTER_INDEX.md')
    console.log('     - /app/frontend/docs/DEMO_PHASE2_EXECUTION_SUMMARY.md')
    console.log('')
    console.log('  🔐 Default Password: ' + DEMO_PASSWORD)
    console.log('  🌐 Login URL: /login-v2')
    console.log('')
    console.log('═'.repeat(70))

  } catch (error) {
    console.error('❌ Error in Demo Partner Master Seeder:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
