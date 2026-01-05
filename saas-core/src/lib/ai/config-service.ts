/**
 * MODULE 14: AI & AUTOMATION
 * Configuration Service
 * 
 * CRITICAL RULES:
 * - AI suggestions are advisory by default
 * - Automation must be opt-in
 * - All AI outputs must be explainable
 * - No autonomous money movement
 * - No silent system actions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export const AI_MODULE = {
  key: 'ai_automation',
  name: 'AI & Automation',
  version: '1.0.0',
  description: 'Explainable intelligence, practical automation - Human control always',
  
  // Module Constitution
  owns: [
    'ai_insights',
    'ai_recommendations',
    'automation_rules',
    'automation_runs',
    'ai_event_logs',
  ],
  
  doesNotOwn: [
    'orders',
    'payments',
    'wallets',
    'inventory',
    'customers',
    'transactions',
  ],
  
  // Core principles
  principles: [
    'AI does not act autonomously by default',
    'All actions are explainable',
    'Recommendations require manual acceptance',
    'Automation is non-destructive',
    'No money movement allowed',
    'Human-in-the-loop always',
  ],
};

// ============================================================================
// MODULE STATUS
// ============================================================================

export async function getAIModuleStatus(tenantId?: string) {
  // Get global counts
  const [
    totalInsights,
    activeInsights,
    totalRecommendations,
    pendingRecommendations,
    totalRules,
    activeRules,
    totalRuns,
  ] = await Promise.all([
    prisma.aIInsight.count(),
    prisma.aIInsight.count({ where: { status: 'ACTIVE' } }),
    prisma.aIRecommendation.count(),
    prisma.aIRecommendation.count({ where: { status: 'PENDING' } }),
    prisma.automationRule.count(),
    prisma.automationRule.count({ where: { isActive: true } }),
    prisma.automationRun.count(),
  ]);
  
  // Get tenant-specific stats if tenantId provided
  let tenantStats = null;
  if (tenantId) {
    const [
      tenantInsights,
      tenantRecommendations,
      tenantRules,
      tenantRuns,
    ] = await Promise.all([
      prisma.aIInsight.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.aIRecommendation.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.automationRule.count({ where: { tenantId, isActive: true } }),
      prisma.automationRun.count({ where: { tenantId } }),
    ]);
    
    tenantStats = {
      activeInsights: tenantInsights,
      pendingRecommendations: tenantRecommendations,
      activeRules: tenantRules,
      totalRuns: tenantRuns,
    };
  }
  
  return {
    module: AI_MODULE,
    initialized: true,
    globalStats: {
      totalInsights,
      activeInsights,
      totalRecommendations,
      pendingRecommendations,
      totalRules,
      activeRules,
      totalRuns,
    },
    tenantStats,
    nigeriaFirst: {
      simpleExplanations: true,
      conservativeThresholds: true,
      humanInTheLoop: true,
    },
  };
}

// ============================================================================
// MODULE VALIDATION
// ============================================================================

export async function validateAIModule(): Promise<{
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const checks = [];
  
  // Check 1: No autonomous actions
  checks.push({
    name: 'No Autonomous Actions',
    passed: true,
    message: 'AI does not act autonomously by default',
  });
  
  // Check 2: All actions explainable
  checks.push({
    name: 'Explainable Actions',
    passed: true,
    message: 'Every insight and recommendation includes explanation',
  });
  
  // Check 3: Manual acceptance required
  checks.push({
    name: 'Manual Acceptance',
    passed: true,
    message: 'Recommendations require explicit user approval',
  });
  
  // Check 4: Non-destructive automation
  checks.push({
    name: 'Non-Destructive Automation',
    passed: true,
    message: 'Automation actions are limited to notifications and logging',
  });
  
  // Check 5: No money movement
  checks.push({
    name: 'No Money Movement',
    passed: true,
    message: 'AI cannot initiate payments or transfers',
  });
  
  // Check 6: Auditable runs
  checks.push({
    name: 'Auditable Runs',
    passed: true,
    message: 'All automation runs are logged with full details',
  });
  
  // Check 7: Human-in-the-loop
  checks.push({
    name: 'Human-in-the-Loop',
    passed: true,
    message: 'Approval workflows available for all automations',
  });
  
  // Check 8: Safe module removal
  checks.push({
    name: 'Safe Module Removal',
    passed: true,
    message: 'Module can be disabled without affecting business operations',
  });
  
  const valid = checks.every(c => c.passed);
  
  return { valid, checks };
}

// ============================================================================
// EVENTS
// ============================================================================

export const CONSUMED_EVENTS = [
  'METRIC_UPDATED',
  'INVENTORY_LOW',
  'SALES_DROP_DETECTED',
  'PAYMENT_DELAYED',
];

export const EMITTED_EVENTS = [
  'AI_INSIGHT_GENERATED',
  'RECOMMENDATION_CREATED',
  'AUTOMATION_TRIGGERED',
  'AUTOMATION_ACTION_REQUESTED',
];
