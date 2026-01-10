/**
 * Church Suite — Service Index
 * Phase 1: Registry & Membership
 * Phase 2: Ministries, Services & Events
 * Phase 3: Giving & Financial Facts
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

// Types
export * from './types';

// Phase 1 Services
export * from './audit-service';
export * from './church-registry-service';
export * from './membership-service';
export * from './leadership-service';

// Phase 2 Services
export * from './ministry-service';
export * from './scheduling-service';

// Phase 3 Services
export * from './giving-service';

// Phase 4 Services
export * from './governance-service';

// Disclaimers for API responses
export const CHURCH_SUITE_DISCLAIMERS = {
  _suite: 'Church Suite — Digital Infrastructure for Faith Communities',
  _classification: 'HIGH-RISK VERTICAL (faith, money, minors, trust)',
  _commerce_boundary: 'FACTS_ONLY — Church Suite does NOT process payments',
  _minors_safeguarding: 'Minors data is protected with restricted access',
  _pastoral_confidentiality: 'Pastoral notes are encrypted and access-logged',
  _audit_trail: 'All changes are logged immutably',
} as const;
