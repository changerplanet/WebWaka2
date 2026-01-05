/**
 * WebWaka Suites & Solutions Registry
 * 
 * Brand Architecture Layer:
 * - Suites: Vertical/Industry groupings
 * - Solutions: Concrete products within suites
 * - Module Mapping: Links suites to capability registry
 * 
 * This is a CONFIGURATION layer - does NOT change module internals.
 * Future suites can be added without code changes.
 */

// ============================================================================
// SUITES - Vertical Industry Groupings
// ============================================================================

export enum SuiteId {
  COMMERCE = 'commerce',
  EDUCATION = 'education',
  HEALTH = 'health',
  CIVIC = 'civic',
  HOSPITALITY = 'hospitality',
  LOGISTICS = 'logistics',
  COMMUNITY = 'community',
}

export interface Suite {
  id: SuiteId
  name: string
  shortName: string
  description: string
  tagline: string
  icon: string // lucide-react icon name
  color: string // Tailwind color class
  status: 'active' | 'coming_soon' | 'beta'
  modules: string[] // Capability keys from registry
  targetAudience: string[]
  regions: string[] // Supported regions (future multi-region support)
}

export const SUITES: Record<SuiteId, Suite> = {
  [SuiteId.COMMERCE]: {
    id: SuiteId.COMMERCE,
    name: 'WebWaka Commerce Suite',
    shortName: 'Commerce',
    description: 'Complete business management for retail, wholesale, and e-commerce businesses',
    tagline: 'Sell Anywhere, Manage Everything',
    icon: 'Store',
    color: 'green',
    status: 'active',
    modules: [
      'pos',
      'inventory',
      'accounting',
      'svm', // Single Vendor Marketplace (Online Store)
      'mvm', // Multi Vendor Marketplace
      'payments_wallets',
      'crm',
      'loyalty_program',
      'partner_reseller',
      'order_fulfillment',
      'ai_assistant',
      'integrations_hub',
    ],
    targetAudience: [
      'Retail shops',
      'Supermarkets',
      'Wholesale distributors',
      'Online sellers',
      'Marketplace operators',
    ],
    regions: ['NG', 'GH', 'KE', 'ZA'],
  },
  
  [SuiteId.EDUCATION]: {
    id: SuiteId.EDUCATION,
    name: 'WebWaka Education Suite',
    shortName: 'Education',
    description: 'School management and learning administration tools',
    tagline: 'Empowering African Education',
    icon: 'GraduationCap',
    color: 'blue',
    status: 'coming_soon',
    modules: [
      // Future modules
      'school_attendance',
      'school_grading',
      'fee_management',
      'student_records',
      'timetable',
    ],
    targetAudience: [
      'Primary schools',
      'Secondary schools',
      'Tutorial centers',
      'Vocational training',
    ],
    regions: ['NG', 'GH', 'KE'],
  },
  
  [SuiteId.HEALTH]: {
    id: SuiteId.HEALTH,
    name: 'WebWaka Health Suite',
    shortName: 'Health',
    description: 'Healthcare practice management and patient care tools',
    tagline: 'Better Care, Better Records',
    icon: 'Heart',
    color: 'red',
    status: 'coming_soon',
    modules: [
      // Future modules
      'patient_records',
      'appointment_scheduling',
      'pharmacy_pos',
      'lab_management',
    ],
    targetAudience: [
      'Clinics',
      'Pharmacies',
      'Labs',
      'Private hospitals',
    ],
    regions: ['NG'],
  },
  
  [SuiteId.CIVIC]: {
    id: SuiteId.CIVIC,
    name: 'WebWaka Civic Suite',
    shortName: 'Civic',
    description: 'Tools for community organizations and local governance',
    tagline: 'Transparent, Accountable, Connected',
    icon: 'Landmark',
    color: 'purple',
    status: 'coming_soon',
    modules: [
      // Future modules
      'community_finance',
      'member_management',
      'voting_polls',
      'project_tracking',
    ],
    targetAudience: [
      'Trade associations',
      'Market unions',
      'Community groups',
      'Religious organizations',
    ],
    regions: ['NG', 'GH'],
  },
  
  [SuiteId.HOSPITALITY]: {
    id: SuiteId.HOSPITALITY,
    name: 'WebWaka Hospitality Suite',
    shortName: 'Hospitality',
    description: 'Hotel, restaurant, and event management tools',
    tagline: 'Exceptional Guest Experiences',
    icon: 'Hotel',
    color: 'amber',
    status: 'coming_soon',
    modules: [
      // Future modules
      'hotel_rooms',
      'hotel_reservations',
      'restaurant_pos',
      'event_booking',
    ],
    targetAudience: [
      'Hotels',
      'Guest houses',
      'Restaurants',
      'Event centers',
    ],
    regions: ['NG'],
  },
  
  [SuiteId.LOGISTICS]: {
    id: SuiteId.LOGISTICS,
    name: 'WebWaka Logistics Suite',
    shortName: 'Logistics',
    description: 'Fleet management and delivery operations',
    tagline: 'Move Faster, Deliver Better',
    icon: 'Truck',
    color: 'orange',
    status: 'coming_soon',
    modules: [
      'order_fulfillment',
      // Future modules
      'fleet_management',
      'driver_app',
      'route_optimization',
    ],
    targetAudience: [
      'Logistics companies',
      'Delivery services',
      'E-commerce fulfillment',
    ],
    regions: ['NG'],
  },
  
  [SuiteId.COMMUNITY]: {
    id: SuiteId.COMMUNITY,
    name: 'WebWaka Community Suite',
    shortName: 'Community',
    description: 'Neighborhood and residential community management',
    tagline: 'Connected Communities',
    icon: 'Users',
    color: 'teal',
    status: 'coming_soon',
    modules: [
      // Future modules
      'resident_management',
      'facility_booking',
      'dues_collection',
      'announcements',
    ],
    targetAudience: [
      'Estates',
      'Residential communities',
      'Cooperative societies',
    ],
    regions: ['NG'],
  },
}

// ============================================================================
// SOLUTIONS - Concrete Products
// ============================================================================

export interface Solution {
  key: string
  name: string
  shortName: string
  description: string
  suite: SuiteId
  requiredModules: string[] // Capabilities that must be activated
  optionalModules: string[] // Additional capabilities
  pricing: {
    model: 'free' | 'freemium' | 'paid' | 'custom'
    startingPrice?: number // In NGN
    currency?: string
  }
  status: 'active' | 'coming_soon' | 'beta'
}

export const SOLUTIONS: Record<string, Solution> = {
  // Commerce Suite Solutions
  webwaka_pos: {
    key: 'webwaka_pos',
    name: 'WebWaka POS',
    shortName: 'POS',
    description: 'Point of sale system for retail shops and businesses',
    suite: SuiteId.COMMERCE,
    requiredModules: ['pos'],
    optionalModules: ['inventory', 'accounting', 'crm'],
    pricing: { model: 'freemium', startingPrice: 0, currency: 'NGN' },
    status: 'active',
  },
  
  webwaka_store: {
    key: 'webwaka_store',
    name: 'WebWaka Store',
    shortName: 'Online Store',
    description: 'E-commerce storefront for single sellers',
    suite: SuiteId.COMMERCE,
    requiredModules: ['svm'],
    optionalModules: ['inventory', 'payments_wallets', 'crm'],
    pricing: { model: 'freemium', startingPrice: 0, currency: 'NGN' },
    status: 'active',
  },
  
  webwaka_market: {
    key: 'webwaka_market',
    name: 'WebWaka Market',
    shortName: 'Marketplace',
    description: 'Multi-vendor marketplace platform',
    suite: SuiteId.COMMERCE,
    requiredModules: ['mvm'],
    optionalModules: ['payments_wallets', 'order_fulfillment', 'partner_reseller'],
    pricing: { model: 'paid', startingPrice: 50000, currency: 'NGN' },
    status: 'active',
  },
  
  webwaka_inventory: {
    key: 'webwaka_inventory',
    name: 'WebWaka Inventory',
    shortName: 'Inventory',
    description: 'Stock management and warehouse tracking',
    suite: SuiteId.COMMERCE,
    requiredModules: ['inventory'],
    optionalModules: ['procurement', 'accounting'],
    pricing: { model: 'freemium', startingPrice: 0, currency: 'NGN' },
    status: 'active',
  },
  
  webwaka_accounts: {
    key: 'webwaka_accounts',
    name: 'WebWaka Accounts',
    shortName: 'Accounting',
    description: 'Financial management and reporting',
    suite: SuiteId.COMMERCE,
    requiredModules: ['accounting'],
    optionalModules: ['hr_payroll', 'compliance'],
    pricing: { model: 'freemium', startingPrice: 0, currency: 'NGN' },
    status: 'active',
  },
  
  // Future solutions (coming soon)
  webwaka_school: {
    key: 'webwaka_school',
    name: 'WebWaka School',
    shortName: 'School',
    description: 'Complete school management system',
    suite: SuiteId.EDUCATION,
    requiredModules: ['school_attendance', 'school_grading'],
    optionalModules: ['fee_management', 'student_records'],
    pricing: { model: 'paid', startingPrice: 20000, currency: 'NGN' },
    status: 'coming_soon',
  },
  
  webwaka_clinic: {
    key: 'webwaka_clinic',
    name: 'WebWaka Clinic',
    shortName: 'Clinic',
    description: 'Clinic and practice management',
    suite: SuiteId.HEALTH,
    requiredModules: ['patient_records', 'appointment_scheduling'],
    optionalModules: ['pharmacy_pos'],
    pricing: { model: 'paid', startingPrice: 30000, currency: 'NGN' },
    status: 'coming_soon',
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all active suites
 */
export function getActiveSuites(): Suite[] {
  return Object.values(SUITES).filter(s => s.status === 'active')
}

/**
 * Get all suites (including coming soon)
 */
export function getAllSuites(): Suite[] {
  return Object.values(SUITES)
}

/**
 * Get suite by ID
 */
export function getSuiteById(id: SuiteId): Suite | undefined {
  return SUITES[id]
}

/**
 * Get solutions for a suite
 */
export function getSolutionsForSuite(suiteId: SuiteId): Solution[] {
  return Object.values(SOLUTIONS).filter(s => s.suite === suiteId)
}

/**
 * Get active solutions
 */
export function getActiveSolutions(): Solution[] {
  return Object.values(SOLUTIONS).filter(s => s.status === 'active')
}

/**
 * Get solution by key
 */
export function getSolutionByKey(key: string): Solution | undefined {
  return SOLUTIONS[key]
}

/**
 * Get suite for a module/capability
 */
export function getSuiteForModule(moduleKey: string): Suite | undefined {
  return Object.values(SUITES).find(s => s.modules.includes(moduleKey))
}

/**
 * Check if a suite is available in a region
 */
export function isSuiteAvailableInRegion(suiteId: SuiteId, regionCode: string): boolean {
  const suite = SUITES[suiteId]
  return suite?.regions.includes(regionCode) ?? false
}
