/**
 * LEGAL PRACTICE SUITE — Document Service
 * Phase 7B.1, S3 Core Services
 * 
 * Legal document management with evidence tagging.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface CreateDocumentInput {
  matterId: string;
  title: string;
  description?: string;
  category?: string;
  docType?: string;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isEvidence?: boolean;
  exhibitNumber?: string;
  exhibitLabel?: string;
  isConfidential?: boolean;
  accessRestricted?: boolean;
  authorId?: string;
  authorName?: string;
  notes?: string;
}

export interface UpdateDocumentInput extends Partial<Omit<CreateDocumentInput, 'matterId'>> {
  status?: string;
  filedDate?: Date;
  filingId?: string;
  version?: number;
}

export interface DocumentFilters {
  matterId?: string;
  category?: string;
  isEvidence?: boolean;
  isConfidential?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// DOCUMENT CRUD OPERATIONS
// ============================================================================

export async function createDocument(tenantId: string, data: CreateDocumentInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const document = await prisma.leg_document.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      title: data.title,
      description: data.description,
      category: data.category,
      docType: data.docType,
      fileId: data.fileId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      isEvidence: data.isEvidence ?? false,
      exhibitNumber: data.exhibitNumber,
      exhibitLabel: data.exhibitLabel,
      isConfidential: data.isConfidential ?? false,
      accessRestricted: data.accessRestricted ?? false,
      authorId: data.authorId,
      authorName: data.authorName,
      notes: data.notes,
    }),
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true },
      },
    },
  });

  return document;
}

export async function getDocumentById(tenantId: string, documentId: string) {
  const document = await prisma.leg_document.findFirst({
    where: {
      id: documentId,
      tenantId,
    },
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return document;
}

export async function getDocuments(tenantId: string, filters: DocumentFilters = {}) {
  const {
    matterId,
    category,
    isEvidence,
    isConfidential,
    search,
    page = 1,
    limit = 50,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_documentWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(category && { category }),
    ...(isEvidence !== undefined && { isEvidence }),
    ...(isConfidential !== undefined && { isConfidential }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [documents, total] = await Promise.all([
    prisma.leg_document.findMany({
      where,
      include: {
        leg_matters: {
          select: { id: true, matterNumber: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_document.count({ where }),
  ]);

  return {
    documents,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDocumentsByMatter(tenantId: string, matterId: string) {
  const documents = await prisma.leg_document.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: [
      { isEvidence: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return documents;
}

export async function getEvidenceByMatter(tenantId: string, matterId: string) {
  const evidence = await prisma.leg_document.findMany({
    where: {
      tenantId,
      matterId,
      isEvidence: true,
    },
    orderBy: { exhibitNumber: 'asc' },
  });

  return evidence;
}

export async function updateDocument(tenantId: string, documentId: string, data: UpdateDocumentInput) {
  const result = await prisma.leg_document.updateMany({
    where: {
      id: documentId,
      tenantId,
    },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.docType !== undefined && { docType: data.docType }),
      ...(data.fileId !== undefined && { fileId: data.fileId }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.fileName !== undefined && { fileName: data.fileName }),
      ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
      ...(data.mimeType !== undefined && { mimeType: data.mimeType }),
      ...(data.isEvidence !== undefined && { isEvidence: data.isEvidence }),
      ...(data.exhibitNumber !== undefined && { exhibitNumber: data.exhibitNumber }),
      ...(data.exhibitLabel !== undefined && { exhibitLabel: data.exhibitLabel }),
      ...(data.isConfidential !== undefined && { isConfidential: data.isConfidential }),
      ...(data.accessRestricted !== undefined && { accessRestricted: data.accessRestricted }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.filedDate !== undefined && { filedDate: data.filedDate }),
      ...(data.filingId !== undefined && { filingId: data.filingId }),
      ...(data.version !== undefined && { version: data.version }),
      ...(data.authorId !== undefined && { authorId: data.authorId }),
      ...(data.authorName !== undefined && { authorName: data.authorName }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getDocumentById(tenantId, documentId);
}

export async function markAsEvidence(
  tenantId: string,
  documentId: string,
  exhibitNumber: string,
  exhibitLabel?: string
) {
  const result = await prisma.leg_document.updateMany({
    where: {
      id: documentId,
      tenantId,
    },
    data: {
      isEvidence: true,
      exhibitNumber,
      exhibitLabel,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getDocumentById(tenantId, documentId);
}

export async function deleteDocument(tenantId: string, documentId: string) {
  const result = await prisma.leg_document.deleteMany({
    where: {
      id: documentId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// DOCUMENT STATISTICS
// ============================================================================

export async function getDocumentStats(tenantId: string, matterId?: string) {
  const baseWhere = { tenantId, ...(matterId && { matterId }) };

  const [
    totalDocuments,
    evidenceDocuments,
    confidentialDocuments,
  ] = await Promise.all([
    prisma.leg_document.count({ where: baseWhere }),
    prisma.leg_document.count({ where: { ...baseWhere, isEvidence: true } }),
    prisma.leg_document.count({ where: { ...baseWhere, isConfidential: true } }),
  ]);

  // Documents by category
  const byCategory = await prisma.leg_document.groupBy({
    by: ['category'],
    where: baseWhere,
    _count: true,
  });

  return {
    totalDocuments,
    evidenceDocuments,
    confidentialDocuments,
    byCategory,
  };
}

// ============================================================================
// DOCUMENT CATEGORIES
// ============================================================================

export const DOCUMENT_CATEGORIES = [
  { value: 'brief', label: 'Brief' },
  { value: 'motion', label: 'Motion' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'contract', label: 'Contract' },
  { value: 'court_order', label: 'Court Order' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'notice', label: 'Notice' },
  { value: 'research', label: 'Research' },
  { value: 'draft', label: 'Draft' },
  { value: 'other', label: 'Other' },
];
