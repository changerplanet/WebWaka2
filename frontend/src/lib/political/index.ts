/**
 * Political Suite - Service Index
 * Phase 1: Party & Campaign Operations
 * Phase 2: Fundraising (Facts Only)
 * Phase 3: Internal Elections & Primaries
 * Phase 4: Governance & Post-Election
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

// Types
export * from './types';

// Phase 1 Services
export * from './audit-service';
export * from './party-service';
export * from './membership-service';
export * from './campaign-service';
export * from './event-service';
export * from './volunteer-service';

// Phase 2 Services (Fundraising - FACTS ONLY)
export * from './donation-service';
export * from './expense-service';
export * from './disclosure-service';

// Phase 3 Services (Internal Elections - UNOFFICIAL / PARTY-LEVEL ONLY)
export * from './primary-service';
export * from './voting-service';
export * from './results-service';

// Phase 4 Services (Governance & Post-Election)
export * from './petition-service';
export * from './evidence-service';
export * from './engagement-service';
export * from './regulator-service';
export * from './governance-audit-service';
export * from './transparency-service';

// Suite Info
export const POLITICAL_SUITE_INFO = {
  id: 'political',
  name: 'Political Suite',
  version: '1.0.0',
  phase: 'Phase 4: Governance & Post-Election',
  classification: 'HIGH-RISK VERTICAL',
  authorization: 'January 8, 2026',
  
  // Compliance Posture
  compliance: {
    electoralActCompliant: true,
    inecSafe: true,
    nonPartisan: true,
    auditFirst: true,
  },
  
  // Commerce Boundary
  commerceBoundary: {
    recordsFactsOnly: true,
    noPaymentProcessing: true,
    noWalletManagement: true,
    noInvoiceGeneration: true,
  },
  
  // All Capabilities (Phases 1-4)
  capabilities: [
    // Phase 1: Party & Campaign Operations
    'party_registry',
    'party_structure',
    'membership_management',
    'campaign_lifecycle',
    'candidate_management',
    'event_scheduling',
    'volunteer_coordination',
    'audit_logging',
    // Phase 2: Fundraising (FACTS ONLY)
    'donation_facts',
    'expense_facts',
    'disclosure_generation',
    // Phase 3: Internal Elections (INTERNAL PARTY ONLY)
    'primary_setup',
    'primary_manage',
    'nomination_manage',
    'vote_capture',
    'results_view',
    'results_declare',
    // Phase 4: Governance & Post-Election
    'petition_management',
    'evidence_collection',
    'community_engagement',
    'regulator_access',
    'audit_trail',
    'transparency_reporting',
  ],
  
  // Disclaimers
  disclaimers: {
    notOfficialElection: 'This platform is NOT an official election management system.',
    notVoterRegistry: 'This platform does NOT maintain voter registration data.',
    notINEC: 'This platform is NOT affiliated with INEC or any electoral body.',
    unofficialResults: 'All election/primary results are UNOFFICIAL and for internal party use only.',
    internalGrievance: 'Petitions are INTERNAL PARTY GRIEVANCES with no legal standing.',
    nonPartisan: 'All transparency reports are NON-PARTISAN and for informational purposes.',
  },
};
