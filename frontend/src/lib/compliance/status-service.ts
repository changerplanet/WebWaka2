/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * Status & Alerts Service
 * 
 * Compliance health indicators and gentle nudges.
 * Non-threatening language, informational only.
 */

import { getComplianceProfile } from './config-service';
import { logComplianceEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';
import { prisma } from '@/lib/prisma';

// ============================================================================
// COMPLIANCE STATUS MANAGEMENT
// ============================================================================

interface CreateStatusInput {
  tenantId: string;
  statusType: string;
  severity?: string;
  title: string;
  description: string;
  suggestedAction?: string;
  isDismissable?: boolean;
}

export async function createComplianceStatus(input: CreateStatusInput): Promise<{
  success: boolean;
  status?: any;
  error?: string;
}> {
  try {
    const status = await prisma.compliance_statuses.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        statusType: input.statusType,
        severity: input.severity || 'INFO',
        title: input.title,
        description: input.description,
        suggestedAction: input.suggestedAction,
        isDismissable: input.isDismissable ?? true,
        isResolved: false,
      }),
    });
    
    await logComplianceEvent({
      eventType: 'COMPLIANCE_STATUS_CREATED',
      tenantId: input.tenantId,
      eventData: {
        statusId: status.id,
        statusType: input.statusType,
        severity: input.severity,
      },
    });
    
    return { success: true, status };
  } catch (error: any) {
    console.error('Create compliance status error:', error);
    return { success: false, error: error.message || 'Failed to create status' };
  }
}

export async function resolveComplianceStatus(statusId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.compliance_statuses.update({
      where: { id: statusId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to resolve status' };
  }
}

export async function dismissComplianceStatus(statusId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const status = await prisma.compliance_statuses.findUnique({
      where: { id: statusId },
    });
    
    if (!status) {
      return { success: false, error: 'Status not found' };
    }
    
    if (!status.isDismissable) {
      return { success: false, error: 'This status cannot be dismissed' };
    }
    
    await prisma.compliance_statuses.update({
      where: { id: statusId },
      data: { dismissedAt: new Date() },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to dismiss status' };
  }
}

export async function listComplianceStatuses(params: {
  tenantId: string;
  statusType?: string;
  severity?: string;
  includeResolved?: boolean;
  includeDismissed?: boolean;
}) {
  const {
    tenantId,
    statusType,
    severity,
    includeResolved = false,
    includeDismissed = false,
  } = params;
  
  const where: any = { tenantId };
  
  if (statusType) where.statusType = statusType;
  if (severity) where.severity = severity;
  if (!includeResolved) where.isResolved = false;
  if (!includeDismissed) where.dismissedAt = null;
  
  return prisma.compliance_statuses.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function runComplianceHealthCheck(tenantId: string): Promise<{
  score: number;
  status: 'GOOD' | 'NEEDS_ATTENTION' | 'ACTION_REQUIRED';
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    suggestion?: string;
  }>;
}> {
  const profile = await getComplianceProfile(tenantId);
  const checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    suggestion?: string;
  }> = [];
  
  // Check 1: Profile completeness
  checks.push({
    name: 'Profile Setup',
    passed: true,  // Always passes - just informational
    message: `Your compliance maturity level is: ${profile.maturityLevel}`,
    suggestion: profile.maturityLevel === 'INFORMAL' 
      ? 'Consider updating your profile as your business grows'
      : undefined,
  });
  
  // Check 2: Tax tracking
  checks.push({
    name: 'Tax Tracking',
    passed: profile.taxTrackingEnabled || profile.maturityLevel === 'INFORMAL',
    message: profile.taxTrackingEnabled 
      ? 'Tax tracking is enabled'
      : 'Tax tracking is not enabled',
    suggestion: !profile.taxTrackingEnabled 
      ? 'Enable tax tracking to monitor VAT automatically'
      : undefined,
  });
  
  // Check 3: VAT registration status
  const shouldBeRegistered = profile.maturityLevel !== 'INFORMAL';
  checks.push({
    name: 'VAT Status',
    passed: !shouldBeRegistered || profile.vatRegistered,
    message: profile.vatRegistered 
      ? 'VAT registration recorded'
      : 'VAT registration not recorded',
    suggestion: shouldBeRegistered && !profile.vatRegistered
      ? 'If your turnover exceeds N25M, consider VAT registration'
      : undefined,
  });
  
  // Check 4: Audit trail
  checks.push({
    name: 'Audit Trail',
    passed: profile.auditTrailEnabled,
    message: profile.auditTrailEnabled
      ? 'Audit trail is active'
      : 'Audit trail is not enabled',
    suggestion: !profile.auditTrailEnabled
      ? 'Enable audit trail for better record-keeping'
      : undefined,
  });
  
  // Calculate score
  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  
  // Determine status
  let status: 'GOOD' | 'NEEDS_ATTENTION' | 'ACTION_REQUIRED';
  if (score >= 75) {
    status = 'GOOD';
  } else if (score >= 50) {
    status = 'NEEDS_ATTENTION';
  } else {
    status = 'ACTION_REQUIRED';
  }
  
  return { score, status, checks };
}

// ============================================================================
// AUTO-GENERATED ALERTS (gentle nudges)
// ============================================================================

export async function generatePeriodCloseReminder(tenantId: string): Promise<void> {
  const profile = await getComplianceProfile(tenantId);
  
  if (!profile.taxTrackingEnabled) return;
  
  // Check if reminder already exists for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const existingReminder = await prisma.compliance_statuses.findFirst({
    where: {
      tenantId,
      statusType: 'PERIOD_REMINDER',
      createdAt: { gte: startOfMonth },
      isResolved: false,
    },
  });
  
  if (existingReminder) return;
  
  // Create gentle reminder
  await createComplianceStatus({
    tenantId,
    statusType: 'PERIOD_REMINDER',
    severity: 'INFO',
    title: 'Monthly Tax Summary Available',
    description: 'Your tax computation for last month is ready for review.',
    suggestedAction: 'Review your VAT summary to ensure accuracy',
    isDismissable: true,
  });
}
