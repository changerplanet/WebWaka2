/**
 * MODULE 11: PARTNER & RESELLER PLATFORM
 * Onboarding & Verification Service
 * 
 * Handles partner signup, verification, and approval workflows.
 * 
 * Nigeria-First Considerations:
 * - Individual & company partners
 * - Informal consultants support
 * - Phone-number-first onboarding
 * - Manual verification workflows (NIN, BVN, CAC)
 */

import { PartnerStatus, PartnerType, VerificationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPartnerConfiguration } from './config-service';
import { logPartnerEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

// ============================================================================
// PARTNER SIGNUP
// ============================================================================

interface PartnerSignupInput {
  // Required fields
  name: string;
  email: string;
  
  // Type
  partnerType?: PartnerType;
  
  // Contact
  phone?: string;
  website?: string;
  
  // Company details (for COMPANY type)
  companyNumber?: string;
  taxId?: string;
  
  // Nigeria-specific
  cacNumber?: string;
  tinNumber?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  
  // Banking
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  
  // Profile
  bio?: string;
  industries?: string[];
  specialties?: string[];
  servicesOffered?: string[];
  regionsServed?: string[];
}

export async function createPartnerApplication(input: PartnerSignupInput): Promise<{
  success: boolean;
  partner?: any;
  error?: string;
}> {
  try {
    const config = await getPartnerConfiguration();
    
    // Check if email already exists
    const existing = await prisma.partner.findFirst({
      where: { email: input.email },
    });
    
    if (existing) {
      return { success: false, error: 'A partner with this email already exists' };
    }
    
    // Generate partner code
    const partnerCode = generatePartnerCode(input.name);
    
    // Determine initial status
    const initialStatus: PartnerStatus = config.autoApproval ? 'ACTIVE' : 'PENDING';
    
    // Create partner in existing Core Partner model
    const partner = await prisma.partner.create({
      data: withPrismaDefaults({
        name: input.name,
        slug: partnerCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email: input.email,
        phone: input.phone,
        website: input.website,
        companyNumber: input.companyNumber || input.cacNumber,
        taxId: input.taxId || input.tinNumber,
        address: input.address,
        status: initialStatus,
        metadata: {
          partnerType: input.partnerType || 'INDIVIDUAL',
          signupSource: 'web',
          signupDate: new Date().toISOString(),
        },
      }),
    });
    
    // Create partner profile extension
    await prisma.partner_profiles_ext.create({
      data: withPrismaDefaults({
        partnerId: partner.id,
        partnerType: input.partnerType || 'INDIVIDUAL',
        cacNumber: input.cacNumber,
        tinNumber: input.tinNumber,
        bankName: input.bankName,
        bankCode: input.bankCode,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        bio: input.bio,
        industries: input.industries || [],
        specialties: input.specialties || [],
        servicesOffered: input.servicesOffered || [],
        regionsServed: input.regionsServed || [],
      }),
    });
    
    // Create verification record if required
    if (config.verificationRequired) {
      await prisma.partner_verifications.create({
        data: withPrismaDefaults({
          partnerId: partner.id,
          status: 'PENDING',
        }),
      });
    }
    
    // Log event
    await logPartnerEvent({
      eventType: 'PARTNER_CREATED',
      partnerId: partner.id,
      eventData: {
        email: input.email,
        type: input.partnerType || 'INDIVIDUAL',
        autoApproved: config.autoApproval,
      },
    });
    
    return {
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        partnerCode: partner.slug,
        requiresVerification: config.verificationRequired,
      },
    };
  } catch (error: any) {
    console.error('Partner signup error:', error);
    return { success: false, error: error.message || 'Failed to create partner application' };
  }
}

// ============================================================================
// VERIFICATION WORKFLOW
// ============================================================================

interface VerificationSubmission {
  partnerId: string;
  documentType: string;  // 'NIN', 'BVN', 'CAC', 'PASSPORT'
  documentNumber: string;
  documentUrl?: string;
}

export async function submitVerificationDocuments(input: VerificationSubmission): Promise<{
  success: boolean;
  verification?: any;
  error?: string;
}> {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: input.partnerId },
    });
    
    if (!partner) {
      return { success: false, error: 'Partner not found' };
    }
    
    // Update or create verification record
    const verification = await prisma.partner_verifications.upsert({
      where: { partnerId: input.partnerId },
      create: withPrismaDefaults({
        partnerId: input.partnerId,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        documentUrl: input.documentUrl,
        status: 'IN_REVIEW',
        attempts: 1,
        lastAttemptAt: new Date(),
      }),
      update: {
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        documentUrl: input.documentUrl,
        status: 'IN_REVIEW',
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'VERIFICATION_SUBMITTED',
      partnerId: input.partnerId,
      eventData: {
        documentType: input.documentType,
        attemptNumber: verification.attempts,
      },
    });
    
    return {
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        documentType: verification.documentType,
        attempts: verification.attempts,
      },
    };
  } catch (error: any) {
    console.error('Verification submission error:', error);
    return { success: false, error: error.message || 'Failed to submit verification' };
  }
}

export async function approveVerification(
  partnerId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update verification record
    await prisma.partner_verifications.update({
      where: { partnerId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: approvedBy,
      },
    });
    
    // Update partner status
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'PARTNER_VERIFIED',
      partnerId,
      actorId: approvedBy,
      eventData: { status: 'VERIFIED' },
    });
    
    await logPartnerEvent({
      eventType: 'PARTNER_ACTIVATED',
      partnerId,
      actorId: approvedBy,
      eventData: { previousStatus: 'PENDING' },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Verification approval error:', error);
    return { success: false, error: error.message || 'Failed to approve verification' };
  }
}

export async function rejectVerification(
  partnerId: string,
  rejectedBy: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update verification record
    await prisma.partner_verifications.update({
      where: { partnerId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason,
      },
    });
    
    // Update partner status
    await prisma.partner.update({
      where: { id: partnerId },
      data: { status: 'SUSPENDED' },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'VERIFICATION_REJECTED',
      partnerId,
      actorId: rejectedBy,
      eventData: { reason },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Verification rejection error:', error);
    return { success: false, error: error.message || 'Failed to reject verification' };
  }
}

// ============================================================================
// PARTNER QUERIES
// ============================================================================

export async function getPartner(partnerId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      users: { include: { user: true } },
      agreements: { where: { status: 'ACTIVE' }, take: 1 },
    },
  });
  
  if (!partner) return null;
  
  // Try to get extension data (may not exist in all schemas)
  let profile = null;
  let verification = null;
  
  try {
    // These models may not exist in all schema versions
    const extModels = prisma as any;
    if (extModels.partnerProfileExt) {
      profile = await extModels.partnerProfileExt.findUnique({ where: { partnerId } });
    }
    if (extModels.partnerVerificationRecord) {
      verification = await extModels.partnerVerificationRecord.findUnique({ where: { partnerId } });
    }
  } catch (e) {
    // Extension models not available, continue without them
  }
  
  return {
    ...partner,
    profile,
    verification,
  };
}

export async function listPartners(params: {
  status?: PartnerStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { status, search, page = 1, limit = 20 } = params;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partner.count({ where }),
  ]);
  
  return {
    partners,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPendingVerifications(page: number = 1, limit: number = 20) {
  const where = { status: 'IN_REVIEW' as VerificationStatus };
  
  const [verifications, total] = await Promise.all([
    prisma.partner_verifications.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partner_verifications.count({ where }),
  ]);
  
  // Get partner details for each verification
  const partnerIds = verifications.map(v => v.partnerId);
  const partners = await prisma.partner.findMany({
    where: { id: { in: partnerIds } },
  });
  
  const partnerMap = new Map(partners.map(p => [p.id, p]));
  
  const results = verifications.map(v => ({
    ...v,
    partner: partnerMap.get(v.partnerId),
  }));
  
  return {
    verifications: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function generatePartnerCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
