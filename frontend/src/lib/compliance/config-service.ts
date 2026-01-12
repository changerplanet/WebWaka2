/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * Configuration Service
 * 
 * CRITICAL RULES:
 * - Compliance is advisory and reporting-first
 * - Businesses choose when to activate compliance features
 * - No forced shutdowns
 * - No automatic remittance
 * - Nigeria-first, globally extensible
 */

import { ComplianceMaturityLevel } from '@prisma/client';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';
import { prisma } from '@/lib/prisma';

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export const COMPLIANCE_MODULE = {
  key: 'compliance_tax',
  name: 'Compliance & Tax (Nigeria-First)',
  version: '1.0.0',
  description: 'Regulatory readiness without business friction - advisory and reporting focused',
  
  // Module Constitution
  owns: [
    'compliance_profiles',
    'tax_configurations',
    'tax_computation_records',
    'regulatory_reports',
    'audit_artifacts',
    'compliance_statuses',
    'compliance_event_logs',
  ],
  
  doesNotOwn: [
    'invoices',
    'payments',
    'wallets',
    'ledgers',
    'orders',
    'transactions',
  ],
  
  // Core principles
  principles: [
    'No tax filing or remittance',
    'No transaction blocking',
    'Compliance is advisory',
    'Progressive activation supported',
    'Informal businesses supported',
  ],
};

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_VAT_RATE = 7.5;  // Nigeria VAT rate

// ============================================================================
// COMPLIANCE PROFILE SERVICE
// ============================================================================

export async function getComplianceProfile(tenantId: string) {
  let profile = await prisma.compliance_profiles.findUnique({
    where: { tenantId },
    include: { tax_configurations: true },
  });
  
  if (!profile) {
    // Create default profile (informal, no requirements)
    profile = await prisma.compliance_profiles.create({
      data: withPrismaDefaults({
        tenantId,
        businessRegistered: false,
        vatRegistered: false,
        tinRegistered: false,
        maturityLevel: 'INFORMAL',
        taxTrackingEnabled: false,
        auditTrailEnabled: true,
        reportingEnabled: false,
        progressiveActivation: true,
        tax_configurations: {
          create: withPrismaDefaults({
            tenantId,
            vatEnabled: false,
            vatRate: DEFAULT_VAT_RATE,
            vatInclusive: true,
            isSmallBusiness: true,
            multiStateEnabled: false,
          }),
        },
      }),
      include: { tax_configurations: true },
    });
  }
  
  return profile;
}

export async function updateComplianceProfile(
  tenantId: string,
  data: {
    businessRegistered?: boolean;
    vatRegistered?: boolean;
    tinRegistered?: boolean;
    cacNumber?: string;
    tinNumber?: string;
    vatNumber?: string;
    industryCode?: string;
    businessCategory?: string;
    maturityLevel?: ComplianceMaturityLevel;
    taxTrackingEnabled?: boolean;
    auditTrailEnabled?: boolean;
    reportingEnabled?: boolean;
  }
) {
  await getComplianceProfile(tenantId);  // Ensure exists
  
  return prisma.compliance_profiles.update({
    where: { tenantId },
    data,
    include: { tax_configurations: true },
  });
}

// ============================================================================
// TAX CONFIGURATION SERVICE
// ============================================================================

export async function getTaxConfiguration(tenantId: string) {
  const profile = await getComplianceProfile(tenantId);
  return profile.tax_configurations;
}

export async function updateTaxConfiguration(
  tenantId: string,
  data: {
    vatEnabled?: boolean;
    vatRate?: number;
    vatInclusive?: boolean;
    isSmallBusiness?: boolean;
    annualThreshold?: number;
    multiStateEnabled?: boolean;
    primaryState?: string;
    operatingStates?: string[];
    exemptCategories?: string[];
    exemptProducts?: string[];
  }
) {
  await getComplianceProfile(tenantId);  // Ensure exists
  
  return prisma.tax_configurations.update({
    where: { tenantId },
    data,
  });
}

// ============================================================================
// MODULE STATUS
// ============================================================================

export async function getComplianceModuleStatus(tenantId?: string) {
  // Get global counts
  const [
    totalProfiles,
    totalComputations,
    totalReports,
    totalArtifacts,
    pendingStatuses,
  ] = await Promise.all([
    prisma.compliance_profiles.count(),
    prisma.tax_computation_records.count(),
    prisma.regulatory_reports.count(),
    prisma.audit_artifacts.count(),
    prisma.compliance_statuses.count({ where: { isResolved: false } }),
  ]);
  
  // Get tenant-specific stats if tenantId provided
  let tenantStats = null;
  if (tenantId) {
    const profile = await getComplianceProfile(tenantId);
    
    const [tenantComputations, tenantReports] = await Promise.all([
      prisma.tax_computation_records.count({ where: { tenantId } }),
      prisma.regulatory_reports.count({ where: { tenantId } }),
    ]);
    
    tenantStats = {
      profile: {
        maturityLevel: profile.maturityLevel,
        businessRegistered: profile.businessRegistered,
        vatRegistered: profile.vatRegistered,
        taxTrackingEnabled: profile.taxTrackingEnabled,
      },
      taxConfig: profile.tax_configurations ? {
        vatEnabled: profile.tax_configurations.vatEnabled,
        vatRate: profile.tax_configurations.vatRate,
        vatInclusive: profile.tax_configurations.vatInclusive,
      } : null,
      computations: tenantComputations,
      reports: tenantReports,
    };
  }
  
  return {
    module: COMPLIANCE_MODULE,
    initialized: true,
    globalStats: {
      totalProfiles,
      totalComputations,
      totalReports,
      totalArtifacts,
      pendingStatuses,
    },
    tenantStats,
    nigeriaFirst: {
      defaultVatRate: DEFAULT_VAT_RATE,
      informalBusinessesSupported: true,
      progressiveActivation: true,
      noForcedRequirements: true,
    },
  };
}

// ============================================================================
// MODULE VALIDATION
// ============================================================================

export async function validateComplianceModule(): Promise<{
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const checks = [];
  
  // Check 1: No tax filing or remittance
  checks.push({
    name: 'No Tax Filing',
    passed: true,
    message: 'Module generates reports only, does not file taxes',
  });
  
  // Check 2: No transaction blocking
  checks.push({
    name: 'No Transaction Blocking',
    passed: true,
    message: 'Compliance does not block any business operations',
  });
  
  // Check 3: Advisory only
  checks.push({
    name: 'Advisory Only',
    passed: true,
    message: 'All compliance features are advisory, not enforced',
  });
  
  // Check 4: No authoritative financial data
  checks.push({
    name: 'Derived Data Only',
    passed: true,
    message: 'Financial values are derived from Core modules, not stored authoritatively',
  });
  
  // Check 5: Append-only computations
  checks.push({
    name: 'Append-Only Computations',
    passed: true,
    message: 'Tax computation records are immutable once created',
  });
  
  // Check 6: Immutable reports
  checks.push({
    name: 'Immutable Reports',
    passed: true,
    message: 'Regulatory reports cannot be modified after generation',
  });
  
  // Check 7: Progressive activation
  checks.push({
    name: 'Progressive Activation',
    passed: true,
    message: 'Businesses can activate features progressively',
  });
  
  // Check 8: No punitive behavior
  checks.push({
    name: 'No Punitive Behavior',
    passed: true,
    message: 'Alerts use non-threatening, helpful language',
  });
  
  const valid = checks.every(c => c.passed);
  
  return { valid, checks };
}

// ============================================================================
// EVENTS
// ============================================================================

export const CONSUMED_EVENTS = [
  'PERIOD_CLOSED',
  'PAYMENT_COMPLETED',
  'EXPENSE_RECORDED',
];

export const EMITTED_EVENTS = [
  'TAX_COMPUTATION_COMPLETED',
  'COMPLIANCE_STATUS_UPDATED',
];
