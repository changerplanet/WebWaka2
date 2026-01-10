/**
 * Quick Start Resolver
 * 
 * Parses ?quickstart= parameter and maps roles to storylines.
 * URL-only, no cookies, no tracking, no persistence.
 * 
 * @module lib/demo/quickstart
 * @phase Phase 3.1
 */

import { StorylineId } from './types'

// ============================================================================
// TYPES
// ============================================================================

export type QuickStartRole = 
  | 'partner'    // Sales enablement → Retail or Marketplace
  | 'investor'   // Breadth + defensibility → Full Tour
  | 'cfo'        // Financial correctness → CFO / Finance
  | 'regulator'  // Compliance & audit → Regulator / Auditor
  | 'founder'    // End-to-end ops → SME
  | 'retail'     // Direct storyline access
  | 'marketplace'// Direct storyline access
  | 'school'     // Education: School Owner storyline
  | 'parent'     // Education: Parent / Guardian storyline
  | 'clinic'     // Health: Clinic Owner / Medical Director storyline
  | 'patient'    // Health: Patient / Guardian storyline (NOTE: Different from Education 'parent')
  | 'healthRegulator' // Health: Regulator / Auditor storyline
  | 'owner'      // Hospitality: Hotel Owner / GM storyline
  | 'manager'    // Hospitality: Restaurant Manager storyline
  | 'guest'      // Hospitality: Hotel/Restaurant Guest storyline
  // Civic / GovTech Suite roles
  | 'citizen'    // Civic: Citizen Journey storyline
  | 'agencyStaff'// Civic: Agency Staff Workflow storyline
  | 'civicRegulator' // Civic: Regulator Oversight storyline
  | 'auditor'    // Civic: Auditor Review storyline
  // Logistics Suite roles
  | 'dispatcher' // Logistics: Dispatcher Workflow storyline
  | 'driver'     // Logistics: Driver Journey storyline
  | 'merchant'   // Logistics: Merchant/Shipper Journey storyline
  | 'logisticsAuditor' // Logistics: Auditor Review storyline
  // Real Estate Suite roles
  | 'propertyOwner' // Real Estate: Property Owner storyline
  | 'propertyManager' // Real Estate: Property Manager storyline
  | 'reTenant'   // Real Estate: Tenant storyline (NOTE: 're' prefix to avoid conflict)
  | 'realEstateAuditor' // Real Estate: Auditor storyline
  // Project Management Suite roles
  | 'projectOwner' // Project: Business Owner / Client storyline
  | 'projectManager' // Project: PM / Operations Lead storyline
  | 'teamMember' // Project: Engineer / Staff storyline
  | 'projectAuditor' // Project: Finance / Compliance storyline
  // Recruitment Suite roles
  | 'recruiter'  // Recruitment: Recruiter Workflow storyline
  | 'hiringManager' // Recruitment: Hiring Manager Experience storyline
  | 'candidate'  // Recruitment: Candidate Journey storyline
  | 'recruitmentAuditor' // Recruitment: Auditor Review storyline
  // Legal Practice Suite roles
  | 'legalClient' // Legal Practice: Client Journey storyline
  | 'lawyer'     // Legal Practice: Lawyer Workflow storyline
  | 'firmAdmin'  // Legal Practice: Firm Administrator storyline
  | 'legalAuditor' // Legal Practice: Auditor Review storyline
  // Advanced Warehouse Suite roles
  | 'warehouseManager' // Advanced Warehouse: Manager Overview storyline
  | 'receivingClerk' // Advanced Warehouse: Receiving Clerk storyline
  | 'picker' // Advanced Warehouse: Picker/Packer storyline
  | 'warehouseAuditor' // Advanced Warehouse: Auditor Review storyline
  // ParkHub (Transport) Suite roles
  | 'parkAdmin' // ParkHub: Park Administrator storyline
  | 'operator' // ParkHub: Transport Operator storyline
  | 'parkAgent' // ParkHub: Park Agent (POS) storyline
  | 'passenger' // ParkHub: Passenger storyline
  // Political Suite roles
  | 'politicalCandidate' // Political: Candidate Journey storyline
  | 'partyOfficial' // Political: Party Official storyline
  | 'politicalVolunteer' // Political: Volunteer storyline
  | 'politicalRegulator' // Political: Regulator/Observer storyline
  // Church Suite roles
  | 'pastor' // Church: Senior Pastor Journey storyline
  | 'churchAdmin' // Church: Church Administrator storyline
  | 'ministryLeader' // Church: Ministry Leader storyline
  | 'member' // Church: Member Experience storyline

export interface QuickStartConfig {
  /** The resolved storyline to activate */
  storylineId: StorylineId
  
  /** Human-readable role label for banner */
  roleLabel: string
  
  /** Short description of what this role sees */
  roleDescription: string
}

export interface QuickStartResult {
  /** Whether a valid quickstart param was found */
  isActive: boolean
  
  /** The resolved configuration (null if not active) */
  config: QuickStartConfig | null
  
  /** Original role param (for debugging) */
  originalRole: string | null
}

// ============================================================================
// ROLE → STORYLINE MAPPING
// ============================================================================

const ROLE_MAPPINGS: Record<QuickStartRole, QuickStartConfig> = {
  partner: {
    storylineId: 'retail',
    roleLabel: 'Partner',
    roleDescription: 'Sales enablement demo for retail businesses'
  },
  investor: {
    storylineId: 'full',
    roleLabel: 'Investor',
    roleDescription: 'Complete platform overview with all capabilities'
  },
  cfo: {
    storylineId: 'cfo',
    roleLabel: 'CFO / Finance',
    roleDescription: 'Financial correctness, traceability, and compliance'
  },
  regulator: {
    storylineId: 'regulator',
    roleLabel: 'Regulator / Auditor',
    roleDescription: 'Audit trails, data integrity, and compliance verification'
  },
  founder: {
    storylineId: 'sme',
    roleLabel: 'Founder / SME Owner',
    roleDescription: 'End-to-end operations from invoicing to accounting'
  },
  retail: {
    storylineId: 'retail',
    roleLabel: 'Retail Business',
    roleDescription: 'Point-of-sale, inventory, and payments for retail'
  },
  marketplace: {
    storylineId: 'marketplace',
    roleLabel: 'Marketplace Operator',
    roleDescription: 'Multi-vendor platform with commissions and settlements'
  },
  school: {
    storylineId: 'school',
    roleLabel: 'School Owner',
    roleDescription: 'From enrollment to accounting, without chaos'
  },
  parent: {
    storylineId: 'parent',
    roleLabel: 'Parent / Guardian',
    roleDescription: 'Know what you owe and what your child achieved'
  },
  // Health Suite Quick Start Roles
  clinic: {
    storylineId: 'clinic',
    roleLabel: 'Clinic Owner / Medical Director',
    roleDescription: 'Patient flow → visits → billing facts → accounting boundary'
  },
  patient: {
    storylineId: 'patient',
    roleLabel: 'Patient / Guardian',
    roleDescription: 'Appointments → encounters → prescriptions → transparency'
  },
  healthRegulator: {
    storylineId: 'healthRegulator',
    roleLabel: 'Health Regulator / Auditor',
    roleDescription: 'Append-only encounters → privacy → auditability'
  },
  // Hospitality Suite Quick Start Roles
  owner: {
    storylineId: 'hotelOwner',
    roleLabel: 'Hotel Owner / GM',
    roleDescription: 'Rooms → stays → staff shifts → charge facts → commerce boundary'
  },
  manager: {
    storylineId: 'restaurantManager',
    roleLabel: 'Restaurant Manager',
    roleDescription: 'Tables → orders (POS) → split bills → shifts → charge facts'
  },
  guest: {
    storylineId: 'hospitalityGuest',
    roleLabel: 'Hotel / Restaurant Guest',
    roleDescription: 'Reservation → stay/dining → bill transparency (facts only)'
  },
  // Civic / GovTech Suite Quick Start Roles
  citizen: {
    storylineId: 'civicCitizen',
    roleLabel: 'Citizen',
    roleDescription: 'Application → tracking → inspection → approval (transparency)'
  },
  agencyStaff: {
    storylineId: 'civicAgencyStaff',
    roleLabel: 'Agency Staff',
    roleDescription: 'Case assignment → review → inspection → recommendation → SLA'
  },
  civicRegulator: {
    storylineId: 'civicRegulator',
    roleLabel: 'Civic Regulator',
    roleDescription: 'Agency performance → SLA compliance → approval patterns → FOI'
  },
  auditor: {
    storylineId: 'civicAuditor',
    roleLabel: 'Auditor',
    roleDescription: 'Case reconstruction → decision chains → anomaly detection'
  },
  // Logistics Suite Quick Start Roles
  dispatcher: {
    storylineId: 'logisticsDispatcher',
    roleLabel: 'Dispatcher',
    roleDescription: 'Job assignment → routing → tracking → completion'
  },
  driver: {
    storylineId: 'logisticsDriver',
    roleLabel: 'Driver / Rider',
    roleDescription: 'Accept job → navigate → deliver → capture POD'
  },
  merchant: {
    storylineId: 'logisticsMerchant',
    roleLabel: 'Merchant / Shipper',
    roleDescription: 'Create shipment → track → receive confirmation'
  },
  logisticsAuditor: {
    storylineId: 'logisticsAuditor',
    roleLabel: 'Logistics Auditor',
    roleDescription: 'Job reconstruction → fee verification → Commerce handoff'
  },
  // Real Estate Suite Quick Start Roles
  propertyOwner: {
    storylineId: 'propertyOwner',
    roleLabel: 'Property Owner',
    roleDescription: 'Portfolio management → leasing → rent visibility → Commerce handoff'
  },
  propertyManager: {
    storylineId: 'propertyManager',
    roleLabel: 'Property Manager',
    roleDescription: 'Tenant management → maintenance → collections → reporting'
  },
  reTenant: {
    storylineId: 'tenant',
    roleLabel: 'Tenant',
    roleDescription: 'Lease terms → rent schedule → payments → maintenance requests'
  },
  realEstateAuditor: {
    storylineId: 'realEstateAuditor',
    roleLabel: 'Real Estate Auditor',
    roleDescription: 'Lease reconstruction → rent reconciliation → Commerce boundary'
  },
  // Project Management Suite Quick Start Roles
  projectOwner: {
    storylineId: 'projectOwner',
    roleLabel: 'Project Owner',
    roleDescription: 'Project visibility → cost control → delivery oversight'
  },
  projectManager: {
    storylineId: 'projectManager',
    roleLabel: 'Project Manager',
    roleDescription: 'Planning → execution → delivery → reporting'
  },
  teamMember: {
    storylineId: 'teamMember',
    roleLabel: 'Team Member',
    roleDescription: 'Tasks → updates → completion → accountability'
  },
  projectAuditor: {
    storylineId: 'projectAuditor',
    roleLabel: 'Project Auditor',
    roleDescription: 'Cost traceability → variance analysis → Commerce boundary'
  },
  // Recruitment Suite Quick Start Roles
  recruiter: {
    storylineId: 'recruiter',
    roleLabel: 'Recruiter',
    roleDescription: 'Source candidates → manage pipeline → close placements'
  },
  hiringManager: {
    storylineId: 'hiringManager',
    roleLabel: 'Hiring Manager',
    roleDescription: 'Review candidates → interview → approve offers'
  },
  candidate: {
    storylineId: 'candidate',
    roleLabel: 'Candidate',
    roleDescription: 'Apply for roles → track progress → receive offers'
  },
  recruitmentAuditor: {
    storylineId: 'recruitmentAuditor',
    roleLabel: 'Recruitment Auditor',
    roleDescription: 'Audit placements → verify fees → check Commerce handoff'
  },
  // Legal Practice Suite Quick Start Roles
  legalClient: {
    storylineId: 'legalClient',
    roleLabel: 'Client',
    roleDescription: 'Track your matters → view billing → monitor deadlines'
  },
  lawyer: {
    storylineId: 'lawyer',
    roleLabel: 'Lawyer',
    roleDescription: 'Manage cases → track time → handle filings'
  },
  firmAdmin: {
    storylineId: 'firmAdmin',
    roleLabel: 'Firm Admin',
    roleDescription: 'Oversee practice → manage team → track retainers'
  },
  legalAuditor: {
    storylineId: 'legalAuditor',
    roleLabel: 'Legal Auditor',
    roleDescription: 'Verify fees → audit compliance → check Commerce boundary'
  },
  // Advanced Warehouse Suite Quick Start Roles
  warehouseManager: {
    storylineId: 'warehouseManager',
    roleLabel: 'Warehouse Manager',
    roleDescription: 'Oversee operations → manage zones → track KPIs'
  },
  receivingClerk: {
    storylineId: 'receivingClerk',
    roleLabel: 'Receiving Clerk',
    roleDescription: 'Process inbound → verify receipts → capture batches'
  },
  picker: {
    storylineId: 'picker',
    roleLabel: 'Picker / Packer',
    roleDescription: 'Execute pick lists → pack orders → dispatch'
  },
  warehouseAuditor: {
    storylineId: 'warehouseAuditor',
    roleLabel: 'Warehouse Auditor',
    roleDescription: 'Audit inventory → verify batches → check Commerce boundary'
  },
  // ParkHub (Transport) Suite Quick Start Roles
  parkAdmin: {
    storylineId: 'parkAdmin',
    roleLabel: 'Park Administrator',
    roleDescription: 'Manage operators → set commissions → view analytics'
  },
  operator: {
    storylineId: 'operator',
    roleLabel: 'Transport Operator',
    roleDescription: 'Manage routes → assign drivers → view earnings'
  },
  parkAgent: {
    storylineId: 'parkAgent',
    roleLabel: 'Park Agent (POS)',
    roleDescription: 'Sell tickets → process payments → offline support'
  },
  passenger: {
    storylineId: 'passenger',
    roleLabel: 'Passenger',
    roleDescription: 'Search routes → book tickets → track trip'
  },
  // Political Suite Quick Start Roles
  politicalCandidate: {
    storylineId: 'politicalCandidate',
    roleLabel: 'Candidate',
    roleDescription: 'Campaign overview → manifesto → engagements'
  },
  partyOfficial: {
    storylineId: 'partyOfficial',
    roleLabel: 'Party Official',
    roleDescription: 'Party operations → primaries → membership'
  },
  politicalVolunteer: {
    storylineId: 'politicalVolunteer',
    roleLabel: 'Volunteer',
    roleDescription: 'Field operations → canvassing → reports'
  },
  politicalRegulator: {
    storylineId: 'politicalRegulator',
    roleLabel: 'Regulator / Observer',
    roleDescription: 'Audit logs → disclosures → compliance'
  },
  // Church Suite Quick Start Roles
  pastor: {
    storylineId: 'churchPastor',
    roleLabel: 'Senior Pastor',
    roleDescription: 'Church overview → leadership → governance → pastoral care'
  },
  churchAdmin: {
    storylineId: 'churchAdmin',
    roleLabel: 'Church Admin',
    roleDescription: 'Members → services → events → reports → giving facts'
  },
  ministryLeader: {
    storylineId: 'ministryLeader',
    roleLabel: 'Ministry Leader',
    roleDescription: 'Department operations → volunteers → events → attendance'
  },
  member: {
    storylineId: 'churchMember',
    roleLabel: 'Church Member',
    roleDescription: 'Services → cell groups → giving → engagement'
  }
}

// ============================================================================
// RESOLVER
// ============================================================================

/**
 * Resolves a quickstart parameter to a storyline configuration.
 * 
 * @param quickstartParam - The ?quickstart= parameter value
 * @returns QuickStartResult with resolved config or inactive state
 */
export function resolveQuickStart(quickstartParam: string | null): QuickStartResult {
  // No param → not active
  if (!quickstartParam) {
    return {
      isActive: false,
      config: null,
      originalRole: null
    }
  }

  // Normalize to lowercase and map to canonical role names
  const normalizedLower = quickstartParam.toLowerCase().trim()
  
  // Map lowercase to canonical role names
  const roleNormalizationMap: Record<string, QuickStartRole> = {
    'partner': 'partner',
    'investor': 'investor',
    'cfo': 'cfo',
    'regulator': 'regulator',
    'founder': 'founder',
    'retail': 'retail',
    'marketplace': 'marketplace',
    'school': 'school',
    'parent': 'parent',
    'clinic': 'clinic',
    'patient': 'patient',
    'healthregulator': 'healthRegulator', // Handle lowercase URL param
    // Hospitality Suite roles
    'owner': 'owner',
    'manager': 'manager',
    'guest': 'guest',
    // Civic / GovTech Suite roles
    'citizen': 'citizen',
    'agencystaff': 'agencyStaff', // Handle lowercase URL param
    'civicregulator': 'civicRegulator', // Handle lowercase URL param
    'auditor': 'auditor',
    // Logistics Suite roles
    'dispatcher': 'dispatcher',
    'driver': 'driver',
    'merchant': 'merchant',
    'logisticsauditor': 'logisticsAuditor', // Handle lowercase URL param
    // Real Estate Suite roles
    'propertyowner': 'propertyOwner', // Handle lowercase URL param
    'propertymanager': 'propertyManager', // Handle lowercase URL param
    'retenant': 'reTenant', // Handle lowercase URL param
    'realestateauditor': 'realEstateAuditor', // Handle lowercase URL param
    // Project Management Suite roles
    'projectowner': 'projectOwner', // Handle lowercase URL param
    'projectmanager': 'projectManager', // Handle lowercase URL param
    'teammember': 'teamMember', // Handle lowercase URL param
    'projectauditor': 'projectAuditor', // Handle lowercase URL param
    // Recruitment Suite roles
    'recruiter': 'recruiter',
    'hiringmanager': 'hiringManager', // Handle lowercase URL param
    'candidate': 'candidate',
    'recruitmentauditor': 'recruitmentAuditor', // Handle lowercase URL param
    // Legal Practice Suite roles
    'legalclient': 'legalClient', // Handle lowercase URL param
    'lawyer': 'lawyer',
    'firmadmin': 'firmAdmin', // Handle lowercase URL param
    'legalauditor': 'legalAuditor', // Handle lowercase URL param
    // Advanced Warehouse Suite roles
    'warehousemanager': 'warehouseManager', // Handle lowercase URL param
    'receivingclerk': 'receivingClerk', // Handle lowercase URL param
    'picker': 'picker',
    'warehouseauditor': 'warehouseAuditor', // Handle lowercase URL param
    // ParkHub (Transport) Suite roles
    'parkadmin': 'parkAdmin', // Handle lowercase URL param
    'operator': 'operator',
    'parkagent': 'parkAgent', // Handle lowercase URL param
    'passenger': 'passenger',
    // Political Suite roles
    'polcandidate': 'politicalCandidate', // Handle shorthand (different from recruitment candidate)
    'politicalcandidate': 'politicalCandidate', // Handle lowercase URL param
    'partyofficial': 'partyOfficial', // Handle lowercase URL param
    'volunteer': 'politicalVolunteer', // Handle shorthand
    'politicalvolunteer': 'politicalVolunteer', // Handle lowercase URL param
    'polregulator': 'politicalRegulator', // Handle shorthand (different from compliance regulator)
    'politicalregulator': 'politicalRegulator', // Handle lowercase URL param
    // Church Suite roles
    'pastor': 'pastor',
    'churchadmin': 'churchAdmin', // Handle lowercase URL param
    'ministryleader': 'ministryLeader', // Handle lowercase URL param
    'member': 'member'
  }
  
  const normalizedRole = roleNormalizationMap[normalizedLower]

  // Check if valid role
  const config = normalizedRole ? ROLE_MAPPINGS[normalizedRole] : undefined

  if (!config) {
    // Unknown role → not active, falls back to selector
    return {
      isActive: false,
      config: null,
      originalRole: quickstartParam
    }
  }

  return {
    isActive: true,
    config,
    originalRole: quickstartParam
  }
}

/**
 * Get all available quick start roles with their configurations.
 * Useful for documentation or debugging.
 */
export function getAvailableRoles(): Array<{ role: QuickStartRole; config: QuickStartConfig }> {
  return Object.entries(ROLE_MAPPINGS).map(([role, config]) => ({
    role: role as QuickStartRole,
    config
  }))
}

/**
 * Build a quick start URL for a given role.
 * 
 * @param role - The role to build URL for
 * @param basePath - Base path (default: /commerce-demo)
 * @returns Full URL with quickstart parameter
 */
export function buildQuickStartUrl(role: QuickStartRole, basePath: string = '/commerce-demo'): string {
  return `${basePath}?quickstart=${role}`
}
