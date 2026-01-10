/**
 * Political Suite - Transparency Service (Phase 4)
 * TRANSPARENCY PUBLISHING (NON-PARTISAN)
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * MANDATORY LABELS:
 * - TRANSPARENCY REPORT
 * - NON-PARTISAN - FOR PUBLIC INFORMATION
 * - UNOFFICIAL - NOT GOVERNMENT CERTIFIED
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { createGovernanceAudit } from './governance-audit-service';

// Re-export enums
export {
  PolTransparencyType,
} from '@prisma/client';

import type {
  PolTransparencyType,
} from '@prisma/client';

// MANDATORY DISCLAIMERS
const DISCLAIMER_1 = 'TRANSPARENCY REPORT';
const DISCLAIMER_2 = 'NON-PARTISAN - FOR PUBLIC INFORMATION';
const DISCLAIMER_3 = 'UNOFFICIAL - NOT GOVERNMENT CERTIFIED';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateReportInput {
  partyId: string;
  type: PolTransparencyType;
  title: string;
  period: string;
  summary: string;
  content?: string;
  dataSnapshot?: string;
}

export interface UpdateReportInput {
  title?: string;
  summary?: string;
  content?: string;
  dataSnapshot?: string;
}

export interface ReportFilters {
  partyId?: string;
  type?: PolTransparencyType;
  isPublished?: boolean;
  period?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// TRANSPARENCY REPORT CRUD
// ----------------------------------------------------------------------------

/**
 * Create a transparency report.
 */
export async function createReport(
  tenantId: string,
  input: CreateReportInput,
  createdBy: string
) {
  // Validate party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  const report = await prisma.pol_transparency_report.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      type: input.type,
      title: input.title,
      period: input.period,
      summary: input.summary,
      content: input.content,
      dataSnapshot: input.dataSnapshot,
      disclaimer1: DISCLAIMER_1,
      disclaimer2: DISCLAIMER_2,
      disclaimer3: DISCLAIMER_3,
      createdBy,
    }),
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'transparency_report',
    entityId: report.id,
    action: 'CREATE',
    actorId: createdBy,
    partyId: input.partyId,
    changeNote: `Transparency report created: ${input.title}`,
  });

  return formatReport(report);
}

/**
 * Update a report (only if not published).
 */
export async function updateReport(
  tenantId: string,
  reportId: string,
  input: UpdateReportInput,
  actorId: string
) {
  const existing = await prisma.pol_transparency_report.findFirst({
    where: { id: reportId, tenantId },
  });

  if (!existing) {
    throw new Error('Report not found');
  }

  if (existing.isPublished) {
    throw new Error('Published reports cannot be modified');
  }

  const report = await prisma.pol_transparency_report.update({
    where: { id: reportId },
    data: input,
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'transparency_report',
    entityId: reportId,
    action: 'UPDATE',
    actorId,
    partyId: existing.partyId,
    changeNote: 'Report updated',
  });

  return formatReport(report);
}

/**
 * Publish a transparency report.
 */
export async function publishReport(
  tenantId: string,
  reportId: string,
  publishedBy: string
) {
  const existing = await prisma.pol_transparency_report.findFirst({
    where: { id: reportId, tenantId },
  });

  if (!existing) {
    throw new Error('Report not found');
  }

  if (existing.isPublished) {
    throw new Error('Report is already published');
  }

  const report = await prisma.pol_transparency_report.update({
    where: { id: reportId },
    data: {
      isDraft: false,
      isPublished: true,
      publishedAt: new Date(),
      publishedBy,
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'transparency_report',
    entityId: reportId,
    action: 'PUBLISH',
    actorId: publishedBy,
    partyId: existing.partyId,
    changeNote: `Report published: ${existing.title}`,
  });

  return formatReport(report);
}

/**
 * Get a report by ID.
 */
export async function getReport(tenantId: string, reportId: string) {
  const report = await prisma.pol_transparency_report.findFirst({
    where: { id: reportId, tenantId },
    include: {
      party: { select: { id: true, name: true, acronym: true } },
    },
  });

  if (!report) return null;

  return formatReport(report);
}

/**
 * List transparency reports.
 */
export async function listReports(
  tenantId: string,
  filters: ReportFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
  if (filters.period) where.period = filters.period;

  if (filters.fromDate || filters.toDate) {
    where.publishedAt = {};
    if (filters.fromDate) (where.publishedAt as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.publishedAt as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_transparency_report.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_transparency_report.count({ where }),
  ]);

  return {
    data: data.map(formatReport),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
  };
}

/**
 * Get public reports (published only).
 */
export async function getPublicReports(
  tenantId: string,
  partyId?: string,
  limit: number = 10
) {
  const where: Record<string, unknown> = {
    tenantId,
    isPublished: true,
  };

  if (partyId) where.partyId = partyId;

  const reports = await prisma.pol_transparency_report.findMany({
    where,
    include: {
      party: { select: { id: true, name: true, acronym: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  return {
    data: reports.map(formatReport),
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _notice: 'Public transparency reports - Non-partisan information',
  };
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatReport(report: Record<string, unknown>) {
  return {
    ...report,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'TRANSPARENCY REPORT - NON-PARTISAN - FOR PUBLIC INFORMATION - UNOFFICIAL',
  };
}
