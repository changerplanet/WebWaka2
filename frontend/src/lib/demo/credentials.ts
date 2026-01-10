/**
 * Demo Credentials Data
 * 
 * Structured adapter for DEMO_CREDENTIALS_MASTER_INDEX.md
 * This is the SINGLE SOURCE for demo credential display.
 * 
 * @module lib/demo/credentials
 * @readonly - DO NOT modify credentials here
 */

export interface DemoCredential {
  role: string
  email: string
  description: string
}

export interface DemoTenant {
  name: string
  slug: string
  type: string
  location: string
  credentials: DemoCredential[]
}

export interface DemoSuite {
  name: string
  tenants: DemoTenant[]
}

// Default password for ALL demo accounts
export const DEMO_PASSWORD = 'Demo2026!'

// Partner-level demo accounts
export const PARTNER_CREDENTIALS: DemoCredential[] = [
  { role: 'Partner Owner', email: 'demo.owner@webwaka.com', description: 'Full partner dashboard access' },
  { role: 'Partner Admin', email: 'demo.admin@webwaka.com', description: 'Admin operations' },
  { role: 'Partner Sales', email: 'demo.sales@webwaka.com', description: 'Sales workflows' },
  { role: 'Partner Support', email: 'demo.support@webwaka.com', description: 'Support operations' },
  { role: 'Partner Staff', email: 'demo.staff@webwaka.com', description: 'General staff access' },
]

// Suite-specific demo credentials grouped by vertical
export const DEMO_SUITES: DemoSuite[] = [
  {
    name: 'Commerce',
    tenants: [
      {
        name: 'Lagos Retail Store',
        slug: 'demo-retail-store',
        type: 'RETAIL',
        location: 'Ikeja, Lagos',
        credentials: [
          { role: 'Store Owner', email: 'owner@demo-retail-store.demo', description: 'POS & inventory management' },
          { role: 'Store Manager', email: 'manager@demo-retail-store.demo', description: 'Daily operations' },
          { role: 'Cashier', email: 'cashier@demo-retail-store.demo', description: 'Point of sale' },
          { role: 'Auditor', email: 'auditor@demo-retail-store.demo', description: 'Read-only audit access' },
        ]
      },
      {
        name: 'Naija Market Hub',
        slug: 'demo-marketplace',
        type: 'MARKETPLACE',
        location: 'Victoria Island, Lagos',
        credentials: [
          { role: 'Platform Owner', email: 'owner@demo-marketplace.demo', description: 'Marketplace management' },
          { role: 'Vendor Manager', email: 'vendors@demo-marketplace.demo', description: 'Vendor operations' },
          { role: 'Auditor', email: 'auditor@demo-marketplace.demo', description: 'Read-only audit access' },
        ]
      },
    ]
  },
  {
    name: 'Education',
    tenants: [
      {
        name: 'Bright Future Academy',
        slug: 'demo-school',
        type: 'EDUCATION',
        location: 'Surulere, Lagos',
        credentials: [
          { role: 'School Owner', email: 'proprietor@demo-school.demo', description: 'School administration' },
          { role: 'Principal', email: 'principal@demo-school.demo', description: 'Academic management' },
          { role: 'Teacher', email: 'teacher@demo-school.demo', description: 'Attendance & grading' },
          { role: 'Parent', email: 'parent@demo-school.demo', description: 'Parent portal access' },
          { role: 'Auditor', email: 'auditor@demo-school.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Health',
    tenants: [
      {
        name: 'HealthFirst Clinic',
        slug: 'demo-clinic',
        type: 'HEALTHCARE',
        location: 'Lekki, Lagos',
        credentials: [
          { role: 'Medical Director', email: 'director@demo-clinic.demo', description: 'Clinic oversight' },
          { role: 'Doctor', email: 'doctor@demo-clinic.demo', description: 'Patient encounters' },
          { role: 'Nurse', email: 'nurse@demo-clinic.demo', description: 'Clinical support' },
          { role: 'Patient', email: 'patient@demo-clinic.demo', description: 'Patient portal' },
          { role: 'Health Auditor', email: 'auditor@demo-clinic.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Hospitality',
    tenants: [
      {
        name: 'PalmView Suites Lagos',
        slug: 'demo-hotel',
        type: 'HOSPITALITY',
        location: 'Victoria Island, Lagos',
        credentials: [
          { role: 'Hotel Owner', email: 'owner@demo-hotel.demo', description: 'Full hotel management' },
          { role: 'General Manager', email: 'gm@demo-hotel.demo', description: 'Operations oversight' },
          { role: 'Front Desk', email: 'frontdesk@demo-hotel.demo', description: 'Reservations & check-in' },
          { role: 'Restaurant Manager', email: 'restaurant@demo-hotel.demo', description: 'F&B operations' },
          { role: 'Guest', email: 'guest@demo-hotel.demo', description: 'Guest portal' },
          { role: 'Auditor', email: 'auditor@demo-hotel.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Civic / GovTech',
    tenants: [
      {
        name: 'Lagos State Lands Bureau',
        slug: 'demo-civic',
        type: 'CIVIC',
        location: 'Alausa, Ikeja, Lagos',
        credentials: [
          { role: 'Director', email: 'director@demo-civic.demo', description: 'Agency oversight' },
          { role: 'Case Officer', email: 'officer@demo-civic.demo', description: 'Case management' },
          { role: 'Inspector', email: 'inspector@demo-civic.demo', description: 'Field inspections' },
          { role: 'Citizen', email: 'citizen@demo-civic.demo', description: 'Citizen portal' },
          { role: 'Auditor', email: 'auditor@demo-civic.demo', description: 'FOI & audit access' },
        ]
      }
    ]
  },
  {
    name: 'Logistics',
    tenants: [
      {
        name: 'Swift Logistics',
        slug: 'demo-logistics',
        type: 'LOGISTICS',
        location: 'Ojuelegba, Lagos',
        credentials: [
          { role: 'Logistics Owner', email: 'owner@demo-logistics.demo', description: 'Fleet management' },
          { role: 'Dispatch Manager', email: 'dispatch@demo-logistics.demo', description: 'Dispatch operations' },
          { role: 'Driver', email: 'driver@demo-logistics.demo', description: 'Driver app' },
          { role: 'Auditor', email: 'auditor@demo-logistics.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Real Estate',
    tenants: [
      {
        name: 'Lagos Property Managers',
        slug: 'demo-real-estate',
        type: 'REAL_ESTATE',
        location: 'Ikoyi, Lagos',
        credentials: [
          { role: 'Property Owner', email: 'owner@demo-real-estate.demo', description: 'Property management' },
          { role: 'Facility Manager', email: 'facility@demo-real-estate.demo', description: 'Maintenance ops' },
          { role: 'Tenant', email: 'tenant@demo-real-estate.demo', description: 'Tenant portal' },
          { role: 'Auditor', email: 'auditor@demo-real-estate.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Recruitment',
    tenants: [
      {
        name: 'Swift HR Solutions',
        slug: 'demo-recruitment',
        type: 'RECRUITMENT',
        location: 'Yaba, Lagos',
        credentials: [
          { role: 'HR Director', email: 'director@demo-recruitment.demo', description: 'HR management' },
          { role: 'Recruiter', email: 'recruiter@demo-recruitment.demo', description: 'Hiring workflows' },
          { role: 'Candidate', email: 'candidate@demo-recruitment.demo', description: 'Applicant portal' },
          { role: 'Auditor', email: 'auditor@demo-recruitment.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Project Management',
    tenants: [
      {
        name: 'BuildRight Projects Ltd',
        slug: 'demo-project',
        type: 'PROJECT_MANAGEMENT',
        location: 'Lekki, Lagos',
        credentials: [
          { role: 'Project Owner', email: 'owner@demo-project.demo', description: 'Project oversight' },
          { role: 'Project Manager', email: 'pm@demo-project.demo', description: 'Task management' },
          { role: 'Team Member', email: 'member@demo-project.demo', description: 'Task execution' },
          { role: 'Auditor', email: 'auditor@demo-project.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Legal Practice',
    tenants: [
      {
        name: 'Nwosu & Associates Chambers',
        slug: 'demo-legal',
        type: 'LEGAL_PRACTICE',
        location: 'Marina, Lagos',
        credentials: [
          { role: 'Senior Partner', email: 'partner@demo-legal.demo', description: 'Law firm management' },
          { role: 'Associate', email: 'associate@demo-legal.demo', description: 'Case work' },
          { role: 'Client', email: 'client@demo-legal.demo', description: 'Client portal' },
          { role: 'Auditor', email: 'auditor@demo-legal.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Warehouse',
    tenants: [
      {
        name: 'Lagos Fulfillment Center',
        slug: 'demo-warehouse',
        type: 'WAREHOUSE',
        location: 'Ikeja, Lagos',
        credentials: [
          { role: 'Warehouse Owner', email: 'owner@demo-warehouse.demo', description: 'Warehouse management' },
          { role: 'Warehouse Manager', email: 'manager@demo-warehouse.demo', description: 'Operations' },
          { role: 'Picker', email: 'picker@demo-warehouse.demo', description: 'Order picking' },
          { role: 'Auditor', email: 'auditor@demo-warehouse.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'ParkHub (Transport)',
    tenants: [
      {
        name: 'Ojota Motor Park',
        slug: 'demo-parkhub',
        type: 'TRANSPORT',
        location: 'Ojota, Lagos',
        credentials: [
          { role: 'Park Chairman', email: 'chairman@demo-parkhub.demo', description: 'Park management' },
          { role: 'Ticket Agent', email: 'agent@demo-parkhub.demo', description: 'Ticketing' },
          { role: 'Driver', email: 'driver@demo-parkhub.demo', description: 'Driver operations' },
          { role: 'Customer', email: 'customer@demo-parkhub.demo', description: 'Passenger portal' },
          { role: 'Auditor', email: 'auditor@demo-parkhub.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Political',
    tenants: [
      {
        name: 'Lagos Campaign HQ',
        slug: 'demo-political',
        type: 'POLITICAL',
        location: 'Surulere, Lagos',
        credentials: [
          { role: 'Campaign Manager', email: 'manager@demo-political.demo', description: 'Campaign oversight' },
          { role: 'Party Official', email: 'official@demo-political.demo', description: 'Party operations' },
          { role: 'Volunteer Coordinator', email: 'volunteers@demo-political.demo', description: 'Volunteer management' },
          { role: 'Finance Officer', email: 'finance@demo-political.demo', description: 'Campaign finance' },
          { role: 'Auditor', email: 'auditor@demo-political.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
  {
    name: 'Church',
    tenants: [
      {
        name: 'GraceLife Community Church',
        slug: 'demo-church',
        type: 'CHURCH',
        location: 'Ikeja, Lagos',
        credentials: [
          { role: 'Senior Pastor', email: 'pastor@demo-church.demo', description: 'Church leadership' },
          { role: 'Church Admin', email: 'admin@demo-church.demo', description: 'Administration' },
          { role: 'Ministry Head', email: 'ministry@demo-church.demo', description: 'Ministry management' },
          { role: 'Finance Secretary', email: 'finance@demo-church.demo', description: 'Church finances' },
          { role: 'Member', email: 'member@demo-church.demo', description: 'Member portal' },
          { role: 'Auditor', email: 'auditor@demo-church.demo', description: 'Read-only audit access' },
        ]
      }
    ]
  },
]

/**
 * Get credentials for a specific suite by name
 */
export function getCredentialsForSuite(suiteName: string): DemoSuite | undefined {
  return DEMO_SUITES.find((s: any) => s.name.toLowerCase() === suiteName.toLowerCase())
}

/**
 * Get credentials for a specific tenant by slug
 */
export function getCredentialsForTenant(tenantSlug: string): DemoTenant | undefined {
  for (const suite of DEMO_SUITES) {
    const tenant = suite.tenants.find((t: any) => t.slug === tenantSlug)
    if (tenant) return tenant
  }
  return undefined
}

/**
 * Check if a tenant slug is a demo tenant
 */
export function isDemoTenant(tenantSlug: string | null): boolean {
  if (!tenantSlug) return false
  return tenantSlug.startsWith('demo-') || DEMO_SUITES.some((s: any) => 
    s.tenants.some((t: any) => t.slug === tenantSlug)
  )
}
