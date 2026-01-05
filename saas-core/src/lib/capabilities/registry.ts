/**
 * SAAS CORE: Capability Registry
 * 
 * Static, extensible registry of all capabilities in the system.
 * This is NOT tied to billing or UI - it's purely a definition of what exists.
 * 
 * DESIGN PRINCIPLES:
 * - Industry-agnostic (commerce, education, hospitality, healthcare)
 * - No hardcoded assumptions about domain
 * - Extensible without refactoring Core
 * - Multiple verticals can coexist
 */

// ============================================================================
// CAPABILITY DOMAINS
// ============================================================================

export const CAPABILITY_DOMAINS = {
  CORE: 'core',           // Platform infrastructure (cannot be disabled)
  COMMERCE: 'commerce',   // E-commerce, retail, marketplace
  EDUCATION: 'education', // Schools, universities, training
  HOSPITALITY: 'hospitality', // Hotels, restaurants, tourism
  HEALTHCARE: 'healthcare', // Hospitals, clinics, pharmacies
  FINANCE: 'finance',     // Banking, insurance, investments
  LOGISTICS: 'logistics', // Shipping, delivery, fleet management
  HR: 'hr',               // Human resources, payroll
  CRM: 'crm',             // Customer relationship management
  GENERAL: 'general',     // Cross-industry utilities
} as const;

export type CapabilityDomain = typeof CAPABILITY_DOMAINS[keyof typeof CAPABILITY_DOMAINS];

// ============================================================================
// CAPABILITY DEFINITION
// ============================================================================

export interface CapabilityDefinition {
  key: string;
  displayName: string;
  domain: CapabilityDomain;
  description: string;
  dependencies?: string[];  // Keys of required capabilities
  isCore?: boolean;         // Cannot be deactivated
  icon?: string;            // Icon identifier for UI
  sortOrder?: number;       // Display order within domain
  metadata?: {
    version?: string;
    releaseDate?: string;
    documentationUrl?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// CAPABILITY REGISTRY
// Central registry of all known capabilities
// ============================================================================

export const CAPABILITY_REGISTRY: Record<string, CapabilityDefinition> = {
  // =========================================================================
  // CORE CAPABILITIES (Cannot be deactivated)
  // =========================================================================
  
  tenant_management: {
    key: 'tenant_management',
    displayName: 'Tenant Management',
    domain: CAPABILITY_DOMAINS.CORE,
    description: 'Core tenant configuration, settings, and administration',
    isCore: true,
    icon: 'building',
    sortOrder: 1,
  },
  
  user_management: {
    key: 'user_management',
    displayName: 'User Management',
    domain: CAPABILITY_DOMAINS.CORE,
    description: 'User accounts, authentication, and role management',
    isCore: true,
    icon: 'users',
    sortOrder: 2,
  },
  
  // =========================================================================
  // COMMERCE CAPABILITIES
  // =========================================================================
  
  pos: {
    key: 'pos',
    displayName: 'Point of Sale (POS)',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'In-store sales, receipts, cash drawer management, and walk-in customer transactions',
    icon: 'shopping-cart',
    sortOrder: 1,
    metadata: {
      version: '1.0.0',
    },
  },
  
  svm: {
    key: 'svm',
    displayName: 'Single Vendor Marketplace',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Online storefront for a single seller with product catalog, cart, and checkout',
    icon: 'store',
    sortOrder: 2,
    metadata: {
      version: '1.0.0',
    },
  },
  
  mvm: {
    key: 'mvm',
    displayName: 'Multi-Vendor Marketplace',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Platform for multiple vendors with vendor management, commissions, and payouts',
    dependencies: ['svm'],
    icon: 'store-alt',
    sortOrder: 3,
    metadata: {
      version: '1.0.0',
    },
  },
  
  inventory: {
    key: 'inventory',
    displayName: 'Inventory & Warehouse Management',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Advanced inventory workflows, multi-warehouse transfers, stock audits, and reorder intelligence',
    icon: 'warehouse',
    sortOrder: 4,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-02',
    },
  },
  
  // =========================================================================
  // FUTURE COMMERCE CAPABILITIES (Modules 2-15)
  // =========================================================================
  
  accounting: {
    key: 'accounting',
    displayName: 'Accounting & Finance',
    domain: CAPABILITY_DOMAINS.FINANCE,
    description: 'Double-entry accounting, expense tracking, financial reporting, and Nigeria VAT compliance',
    icon: 'calculator',
    sortOrder: 1,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-02',
      nigeriaFirst: true,
    },
  },
  
  crm: {
    key: 'crm',
    displayName: 'CRM & Customer Engagement',
    domain: CAPABILITY_DOMAINS.CRM,
    description: 'Customer segmentation, loyalty programs, campaigns, and engagement tracking for Nigerian SMEs',
    icon: 'user-friends',
    sortOrder: 1,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-02',
      nigeriaFirst: true,
    },
  },
  
  logistics: {
    key: 'logistics',
    displayName: 'Logistics & Delivery',
    domain: CAPABILITY_DOMAINS.LOGISTICS,
    description: 'Route optimization, driver management, and real-time tracking',
    icon: 'truck',
    sortOrder: 1,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  hr_payroll: {
    key: 'hr_payroll',
    displayName: 'HR & Payroll',
    domain: CAPABILITY_DOMAINS.HR,
    description: 'Employee management, payroll processing, and leave tracking',
    icon: 'id-card',
    sortOrder: 1,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  procurement: {
    key: 'procurement',
    displayName: 'Procurement & Supplier Management',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Purchase orders, supplier scorecards, and contract management',
    dependencies: ['inventory'],
    icon: 'handshake',
    sortOrder: 6,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  analytics: {
    key: 'analytics',
    displayName: 'Analytics & Business Intelligence',
    domain: CAPABILITY_DOMAINS.GENERAL,
    description: 'Nigeria-first insights, dashboards, reports, and basic forecasting. Read-only module for business decision support.',
    icon: 'chart-line',
    sortOrder: 1,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      nigeriaFirst: true,
    },
  },
  
  marketing: {
    key: 'marketing',
    displayName: 'Marketing Automation',
    domain: CAPABILITY_DOMAINS.CRM,
    description: 'Nigeria-first growth automation with SMS-first workflows, templates, and event-driven triggers. Delegates messaging to Core.',
    dependencies: ['crm'],
    icon: 'bullhorn',
    sortOrder: 2,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      nigeriaFirst: true,
    },
  },
  
  b2b: {
    key: 'b2b',
    displayName: 'B2B & Wholesale',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Nigeria-first bulk trading, credit terms, negotiated pricing. Supports distributor→retailer workflows.',
    dependencies: ['svm'],
    icon: 'building',
    sortOrder: 7,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      nigeriaFirst: true,
    },
  },
  
  payments: {
    key: 'payments',
    displayName: 'Payments & Wallets',
    domain: CAPABILITY_DOMAINS.FINANCE,
    description: 'Nigeria-first auditable money layer. Cash + digital payments, wallets, settlements, refunds. THE ONLY place where money moves.',
    icon: 'wallet',
    sortOrder: 1,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      nigeriaFirst: true,
      critical: true,
    },
  },
  
  partner_reseller: {
    key: 'partner_reseller',
    displayName: 'Partner & Reseller Platform',
    domain: CAPABILITY_DOMAINS.COMMERCE,
    description: 'Digital Transformation Partners for WebWaka - resell, onboard, support, and earn commissions without accessing tenant data',
    icon: 'handshake',
    sortOrder: 8,
    metadata: {
      version: '1.0.0',
      status: 'active',
      nigeriaFirst: true,
      owns: [
        'partner_configurations',
        'partner_profiles_ext',
        'partner_verifications',
        'partner_referral_links_ext',
        'partner_attributions_ext',
        'partner_commission_rules_ext',
        'partner_commission_records_ext',
        'partner_event_logs_ext',
      ],
      doesNotOwn: ['tenants', 'subscriptions', 'wallets', 'payments', 'invoices'],
    },
  },
  
  subscriptions_billing: {
    key: 'subscriptions_billing',
    displayName: 'Subscriptions & Billing Extensions',
    domain: CAPABILITY_DOMAINS.FINANCE,
    description: 'Flexible pricing, bundles, add-ons, usage-based billing, and grace periods - extends SaaS Core subscription engine',
    icon: 'file-invoice-dollar',
    sortOrder: 2,
    metadata: {
      version: '1.0.0',
      status: 'active',
      nigeriaFirst: true,
      owns: [
        'billing_configurations',
        'billing_bundles',
        'billing_bundle_items',
        'billing_addons',
        'billing_addon_subscriptions',
        'billing_usage_metrics',
        'billing_usage_records',
        'billing_adjustments',
        'billing_discount_rules',
        'billing_grace_policies',
        'billing_event_logs',
      ],
      doesNotOwn: ['subscriptions', 'tenants', 'wallets', 'payments', 'invoices'],
    },
  },
  
  compliance_tax: {
    key: 'compliance_tax',
    displayName: 'Compliance & Tax (Nigeria-First)',
    domain: CAPABILITY_DOMAINS.FINANCE,
    description: 'Advisory VAT compliance, tax computation, regulatory reporting, and audit trails. No enforcement, no remittance.',
    icon: 'file-contract',
    sortOrder: 3,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      status: 'active',
      nigeriaFirst: true,
      owns: [
        'compliance_profiles',
        'tax_configurations',
        'tax_computation_records',
        'regulatory_reports',
        'audit_artifacts',
        'compliance_statuses',
      ],
      doesNotOwn: ['invoices', 'payments', 'wallets', 'ledgers', 'orders'],
      principles: [
        'Advisory and reporting-first',
        'No tax filing or remittance',
        'No transaction blocking',
        'Progressive activation supported',
      ],
    },
  },
  
  ai_automation: {
    key: 'ai_automation',
    displayName: 'AI & Automation',
    domain: CAPABILITY_DOMAINS.GENERAL,
    description: 'Explainable AI insights, recommendations, and rule-based automation. Human-in-the-loop by default.',
    icon: 'robot',
    sortOrder: 2,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      status: 'active',
      nigeriaFirst: true,
      owns: [
        'ai_insights',
        'recommendations',
        'automation_rules',
        'automation_runs',
        'explanations',
      ],
      doesNotOwn: ['orders', 'payments', 'wallets', 'inventory', 'customers'],
      principles: [
        'AI suggestions are advisory by default',
        'Automation must be opt-in',
        'All AI outputs must be explainable',
        'No autonomous money movement',
        'No silent system actions',
      ],
    },
  },
  
  integrations_hub: {
    key: 'integrations_hub',
    displayName: 'Ecosystem & Integrations Hub',
    domain: CAPABILITY_DOMAINS.GENERAL,
    description: 'Nigeria-first integration platform for external APIs, webhooks, and developer ecosystem',
    icon: 'plug',
    sortOrder: 3,
    metadata: {
      version: '1.0.0',
      releaseDate: '2026-01-03',
      status: 'active',
      nigeriaFirst: true,
      owns: [
        'integration_providers',
        'integration_instances',
        'integration_credentials',
        'integration_webhooks',
        'integration_logs',
        'developer_apps',
        'api_keys',
        'access_scopes',
      ],
      doesNotOwn: ['tenants', 'subscriptions', 'wallets', 'products', 'orders', 'payments'],
      principles: [
        'No direct database writes by integrations',
        'Tenant approval mandatory for activation',
        'All integrations log every request',
        'External APIs cannot modify tenant data directly',
        'Credentials encrypted at rest',
        'Event-driven architecture only',
      ],
      nigeriaFirstProviders: ['paystack', 'flutterwave', 'moniepoint', 'remita', 'nibss', 'gig_logistics', 'termii'],
    },
  },
  
  // =========================================================================
  // FUTURE NON-COMMERCE CAPABILITIES (Examples for future verticals)
  // =========================================================================
  
  // Education domain examples
  school_attendance: {
    key: 'school_attendance',
    displayName: 'Student Attendance',
    domain: CAPABILITY_DOMAINS.EDUCATION,
    description: 'Track student attendance, generate reports, and notify parents',
    icon: 'user-check',
    sortOrder: 1,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  school_grading: {
    key: 'school_grading',
    displayName: 'Grading & Report Cards',
    domain: CAPABILITY_DOMAINS.EDUCATION,
    description: 'Manage grades, generate report cards, and track academic progress',
    icon: 'graduation-cap',
    sortOrder: 2,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  // Hospitality domain examples
  hotel_rooms: {
    key: 'hotel_rooms',
    displayName: 'Room Management',
    domain: CAPABILITY_DOMAINS.HOSPITALITY,
    description: 'Room inventory, housekeeping, and maintenance tracking',
    icon: 'bed',
    sortOrder: 1,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  hotel_reservations: {
    key: 'hotel_reservations',
    displayName: 'Reservations',
    domain: CAPABILITY_DOMAINS.HOSPITALITY,
    description: 'Booking management, availability calendar, and guest services',
    dependencies: ['hotel_rooms'],
    icon: 'calendar-check',
    sortOrder: 2,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  // Healthcare domain examples
  patient_records: {
    key: 'patient_records',
    displayName: 'Patient Records',
    domain: CAPABILITY_DOMAINS.HEALTHCARE,
    description: 'Electronic health records, medical history, and patient profiles',
    icon: 'file-medical',
    sortOrder: 1,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
  
  appointment_scheduling: {
    key: 'appointment_scheduling',
    displayName: 'Appointment Scheduling',
    domain: CAPABILITY_DOMAINS.HEALTHCARE,
    description: 'Doctor appointments, clinic scheduling, and patient reminders',
    icon: 'calendar-alt',
    sortOrder: 2,
    metadata: {
      version: '0.0.0',
      status: 'planned',
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all capabilities for a specific domain
 */
export function getCapabilitiesByDomain(domain: CapabilityDomain): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY)
    .filter(cap => cap.domain === domain)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

/**
 * Get all available domains
 */
export function getAvailableDomains(): { key: CapabilityDomain; label: string }[] {
  const domainLabels: Record<CapabilityDomain, string> = {
    core: 'Core Platform',
    commerce: 'Commerce & Retail',
    education: 'Education',
    hospitality: 'Hospitality',
    healthcare: 'Healthcare',
    finance: 'Finance',
    logistics: 'Logistics',
    hr: 'Human Resources',
    crm: 'Customer Relations',
    general: 'General',
  };

  return Object.entries(CAPABILITY_DOMAINS).map(([_, value]) => ({
    key: value,
    label: domainLabels[value] || value,
  }));
}

/**
 * Get a capability definition by key
 */
export function getCapabilityDefinition(key: string): CapabilityDefinition | undefined {
  return CAPABILITY_REGISTRY[key];
}

/**
 * Check if a capability exists in the registry
 */
export function isCapabilityRegistered(key: string): boolean {
  return key in CAPABILITY_REGISTRY;
}

/**
 * Get all capability keys
 */
export function getAllCapabilityKeys(): string[] {
  return Object.keys(CAPABILITY_REGISTRY);
}

/**
 * Get core capabilities (cannot be deactivated)
 */
export function getCoreCapabilities(): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter(cap => cap.isCore);
}

/**
 * Get non-core capabilities (can be activated/deactivated)
 */
export function getNonCoreCapabilities(): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter(cap => !cap.isCore);
}

/**
 * Get dependencies for a capability
 */
export function getCapabilityDependencies(key: string): CapabilityDefinition[] {
  const capability = CAPABILITY_REGISTRY[key];
  if (!capability?.dependencies) return [];
  
  return capability.dependencies
    .map(depKey => CAPABILITY_REGISTRY[depKey])
    .filter(Boolean);
}

/**
 * Get capabilities that depend on a given capability
 */
export function getDependentCapabilities(key: string): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY)
    .filter(cap => cap.dependencies?.includes(key));
}
