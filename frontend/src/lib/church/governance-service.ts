/**
 * Church Suite — Governance & Transparency Service
 * Phase 4: Governance, Audit & Transparency
 *
 * Authorization: January 8, 2026
 * Classification: LOW RISK (read-heavy, append-only)
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logCreate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateGovernanceRecordInput {
  churchId: string;
  unitId?: string;
  recordType: string;
  title: string;
  summary?: string;
  fullText?: string;
  referenceNo?: string;
  meetingDate?: Date;
  meetingType?: string;
  votesFor?: number;
  votesAgainst?: number;
  votesAbstain?: number;
  proposedBy?: string;
  secondedBy?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  attachmentUrls?: string[];
}

export interface CreateEvidenceBundleInput {
  churchId: string;
  bundleType: string;
  title: string;
  description?: string;
  periodStart?: Date;
  periodEnd?: Date;
  evidenceItems?: Array<{ type: string; description: string; url: string; hash: string }>;
  accessLevel?: string;
  authorizedViewers?: string[];
  notes?: string;
}

export interface CreateComplianceRecordInput {
  churchId: string;
  complianceType: string;
  description: string;
  requirement?: string;
  dueDate?: Date;
  expiryDate?: Date;
  renewalRequired?: boolean;
  renewalDate?: Date;
  documentUrl?: string;
  referenceNo?: string;
  notes?: string;
}

export interface CreateTransparencyReportInput {
  churchId: string;
  reportPeriod: string;
  reportType: string;
  membershipStats?: object;
  ministryHighlights?: object;
  governanceActions?: object;
  financialSummary?: object;
  complianceStatus?: object;
  preparedBy: string;
}

export interface LogRegulatorAccessInput {
  churchId: string;
  regulatorId: string;
  regulatorName?: string;
  regulatorType?: string;
  accessType: string;
  resourceType: string;
  resourceId?: string;
  requestReason?: string;
  authorizationRef?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ----------------------------------------------------------------------------
// GOVERNANCE RECORDS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function createGovernanceRecord(
  tenantId: string,
  input: CreateGovernanceRecordInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const meetingDate = input.meetingDate ? new Date(input.meetingDate) : null;
  const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : null;
  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;

  const record = await prisma.chu_governance_record.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      recordType: input.recordType,
      title: input.title,
      summary: input.summary,
      fullText: input.fullText,
      referenceNo: input.referenceNo,
      meetingDate,
      meetingType: input.meetingType,
      votesFor: input.votesFor,
      votesAgainst: input.votesAgainst,
      votesAbstain: input.votesAbstain,
      proposedBy: input.proposedBy,
      secondedBy: input.secondedBy,
      effectiveDate,
      expiryDate,
      attachmentUrls: input.attachmentUrls ? JSON.stringify(input.attachmentUrls) : null,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'governance_record', record.id, actorId, input.unitId, {
    recordType: record.recordType,
    title: record.title,
  });

  return record;
}

export async function approveGovernanceRecord(
  tenantId: string,
  recordId: string,
  actorId: string
) {
  const record = await prisma.chu_governance_record.findFirst({
    where: { id: recordId, tenantId },
  });

  if (!record) throw new Error('Governance record not found');

  const updated = await prisma.chu_governance_record.update({
    where: { id: recordId },
    data: {
      status: 'APPROVED',
      approvedBy: actorId,
      approvalDate: new Date(),
    },
  });

  await logStatusChange(
    tenantId,
    record.churchId,
    'governance_record',
    recordId,
    actorId,
    record.status,
    'APPROVED'
  );

  return updated;
}

export async function getGovernanceRecords(
  tenantId: string,
  churchId: string,
  recordType?: string,
  status?: string,
  limit: number = 50
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (recordType) where.recordType = recordType;
  if (status) where.status = status;

  return prisma.chu_governance_record.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
}

export async function getGovernanceRecord(
  tenantId: string,
  recordId: string
) {
  const record = await prisma.chu_governance_record.findFirst({
    where: { id: recordId, tenantId },
  });

  if (record && record.attachmentUrls) {
    return {
      ...record,
      attachmentUrls: JSON.parse(record.attachmentUrls),
    };
  }

  return record;
}

// ----------------------------------------------------------------------------
// EVIDENCE BUNDLES (APPEND-ONLY, WITH INTEGRITY HASHING)
// ----------------------------------------------------------------------------

function computeBundleHash(items: Array<{ hash: string }>): string {
  const allHashes = items.map((i: any) => i.hash).sort().join('');
  return crypto.createHash('sha256').update(allHashes).digest('hex');
}

export async function createEvidenceBundle(
  tenantId: string,
  input: CreateEvidenceBundleInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const periodStart = input.periodStart ? new Date(input.periodStart) : null;
  const periodEnd = input.periodEnd ? new Date(input.periodEnd) : null;

  // Compute bundle hash if evidence items provided
  const bundleHash = input.evidenceItems && input.evidenceItems.length > 0
    ? computeBundleHash(input.evidenceItems)
    : null;

  const bundle = await prisma.chu_evidence_bundle.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      bundleType: input.bundleType,
      title: input.title,
      description: input.description,
      periodStart,
      periodEnd,
      evidenceItems: input.evidenceItems ? JSON.stringify(input.evidenceItems) : null,
      bundleHash,
      accessLevel: input.accessLevel || 'INTERNAL',
      authorizedViewers: input.authorizedViewers ? JSON.stringify(input.authorizedViewers) : null,
      notes: input.notes,
      preparedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'evidence_bundle', bundle.id, actorId, undefined, {
    bundleType: bundle.bundleType,
    title: bundle.title,
  });

  return bundle;
}

export async function sealEvidenceBundle(
  tenantId: string,
  bundleId: string,
  actorId: string
) {
  const bundle = await prisma.chu_evidence_bundle.findFirst({
    where: { id: bundleId, tenantId },
  });

  if (!bundle) throw new Error('Evidence bundle not found');
  if (bundle.status === 'SEALED') throw new Error('Bundle is already sealed');

  const updated = await prisma.chu_evidence_bundle.update({
    where: { id: bundleId },
    data: {
      status: 'SEALED',
      sealedBy: actorId,
      sealedAt: new Date(),
    },
  });

  await logStatusChange(
    tenantId,
    bundle.churchId,
    'evidence_bundle',
    bundleId,
    actorId,
    'OPEN',
    'SEALED'
  );

  return updated;
}

export async function getEvidenceBundles(
  tenantId: string,
  churchId: string,
  bundleType?: string,
  status?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (bundleType) where.bundleType = bundleType;
  if (status) where.status = status;

  const bundles = await prisma.chu_evidence_bundle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return bundles.map((b: any) => ({
    ...b,
    evidenceItems: b.evidenceItems ? JSON.parse(b.evidenceItems) : null,
    authorizedViewers: b.authorizedViewers ? JSON.parse(b.authorizedViewers) : null,
  }));
}

export async function verifyBundleIntegrity(
  tenantId: string,
  bundleId: string
) {
  const bundle = await prisma.chu_evidence_bundle.findFirst({
    where: { id: bundleId, tenantId },
  });

  if (!bundle) return { valid: false, error: 'Bundle not found' };

  if (!bundle.evidenceItems || !bundle.bundleHash) {
    return { valid: true, message: 'No evidence items to verify' };
  }

  const items = JSON.parse(bundle.evidenceItems);
  const computedHash = computeBundleHash(items);

  return {
    valid: bundle.bundleHash === computedHash,
    storedHash: bundle.bundleHash,
    computedHash,
  };
}

// ----------------------------------------------------------------------------
// COMPLIANCE RECORDS
// ----------------------------------------------------------------------------

export async function createComplianceRecord(
  tenantId: string,
  input: CreateComplianceRecordInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
  const renewalDate = input.renewalDate ? new Date(input.renewalDate) : null;

  const record = await prisma.chu_compliance_record.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      complianceType: input.complianceType,
      description: input.description,
      requirement: input.requirement,
      dueDate,
      expiryDate,
      renewalRequired: input.renewalRequired || false,
      renewalDate,
      documentUrl: input.documentUrl,
      referenceNo: input.referenceNo,
      notes: input.notes,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'compliance_record', record.id, actorId, undefined, {
    complianceType: record.complianceType,
    description: record.description,
  });

  return record;
}

export async function updateComplianceStatus(
  tenantId: string,
  recordId: string,
  status: string,
  verifiedBy: string
) {
  const record = await prisma.chu_compliance_record.findFirst({
    where: { id: recordId, tenantId },
  });

  if (!record) throw new Error('Compliance record not found');

  const updateData: Record<string, unknown> = { status };
  if (status === 'COMPLIANT') {
    updateData.verifiedBy = verifiedBy;
    updateData.verifiedAt = new Date();
    updateData.completedDate = new Date();
  }

  const updated = await prisma.chu_compliance_record.update({
    where: { id: recordId },
    data: updateData,
  });

  await logStatusChange(
    tenantId,
    record.churchId,
    'compliance_record',
    recordId,
    verifiedBy,
    record.status,
    status
  );

  return updated;
}

export async function getComplianceRecords(
  tenantId: string,
  churchId: string,
  complianceType?: string,
  status?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (complianceType) where.complianceType = complianceType;
  if (status) where.status = status;

  return prisma.chu_compliance_record.findMany({
    where,
    orderBy: [{ status: 'asc' }, { expiryDate: 'asc' }],
  });
}

export async function getUpcomingCompliance(
  tenantId: string,
  churchId: string,
  days: number = 30
) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return prisma.chu_compliance_record.findMany({
    where: {
      tenantId,
      churchId,
      OR: [
        {
          expiryDate: { gte: new Date(), lte: endDate },
        },
        {
          dueDate: { gte: new Date(), lte: endDate },
        },
      ],
    },
    orderBy: { expiryDate: 'asc' },
  });
}

// ----------------------------------------------------------------------------
// REGULATOR ACCESS LOG (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function logRegulatorAccess(
  tenantId: string,
  input: LogRegulatorAccessInput
) {
  return prisma.chu_regulator_access_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      regulatorId: input.regulatorId,
      regulatorName: input.regulatorName,
      regulatorType: input.regulatorType,
      accessType: input.accessType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      requestReason: input.requestReason,
      authorizationRef: input.authorizationRef,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    }),
  });
}

export async function getRegulatorAccessLogs(
  tenantId: string,
  churchId: string,
  regulatorId?: string,
  limit: number = 100
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (regulatorId) where.regulatorId = regulatorId;

  return prisma.chu_regulator_access_log.findMany({
    where,
    orderBy: { accessedAt: 'desc' },
    take: limit,
  });
}

// ----------------------------------------------------------------------------
// TRANSPARENCY REPORTS
// ----------------------------------------------------------------------------

export async function createTransparencyReport(
  tenantId: string,
  input: CreateTransparencyReportInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const report = await prisma.chu_transparency_report.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      reportPeriod: input.reportPeriod,
      reportType: input.reportType,
      membershipStats: input.membershipStats ? JSON.stringify(input.membershipStats) : null,
      ministryHighlights: input.ministryHighlights ? JSON.stringify(input.ministryHighlights) : null,
      governanceActions: input.governanceActions ? JSON.stringify(input.governanceActions) : null,
      InstanceFinancialSummary: input.financialSummary ? JSON.stringify(input.financialSummary) : null,
      complianceStatus: input.complianceStatus ? JSON.stringify(input.complianceStatus) : null,
      preparedBy: input.preparedBy,
    }),
  });

  await logCreate(tenantId, input.churchId, 'transparency_report', report.id, actorId, undefined, {
    reportPeriod: report.reportPeriod,
    reportType: report.reportType,
  });

  return report;
}

export async function publishTransparencyReport(
  tenantId: string,
  reportId: string,
  publicUrl: string,
  actorId: string
) {
  const report = await prisma.chu_transparency_report.findFirst({
    where: { id: reportId, tenantId },
  });

  if (!report) throw new Error('Report not found');

  const updated = await prisma.chu_transparency_report.update({
    where: { id: reportId },
    data: {
      status: 'PUBLISHED',
      approvedBy: actorId,
      approvalDate: new Date(),
      publishedAt: new Date(),
      publicUrl,
    },
  });

  await logStatusChange(
    tenantId,
    report.churchId,
    'transparency_report',
    reportId,
    actorId,
    report.status,
    'PUBLISHED'
  );

  return updated;
}

export async function getTransparencyReports(
  tenantId: string,
  churchId: string,
  status?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (status) where.status = status;

  const reports = await prisma.chu_transparency_report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return reports.map((r: any) => ({
    ...r,
    membershipStats: r.membershipStats ? JSON.parse(r.membershipStats) : null,
    ministryHighlights: r.ministryHighlights ? JSON.parse(r.ministryHighlights) : null,
    governanceActions: r.governanceActions ? JSON.parse(r.governanceActions) : null,
    InstanceFinancialSummary: r.financialSummary ? JSON.parse(r.financialSummary) : null,
    complianceStatus: r.complianceStatus ? JSON.parse(r.complianceStatus) : null,
  }));
}
