/**
 * MVM VENDOR REGISTRATION SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * Phone-first vendor onboarding with optional KYC (BVN/CAC),
 * admin approval workflow, and vendor lifecycle management.
 */

import { prisma } from '@/lib/prisma';
import { MvmVendorStatus, MvmOnboardingStep } from '@prisma/client';

export interface VendorRegistrationInput {
  phone: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
}

export interface VendorProfileUpdate {
  businessName?: string;
  contactName?: string;
  email?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
  bvn?: string;
  cacNumber?: string;
  taxId?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export class VendorRegistrationService {
  /**
   * Start phone-first registration
   */
  static async startRegistration(
    tenantId: string,
    phone: string,
    partnerId?: string
  ) {
    const existing = await prisma.mvm_vendor_registration.findUnique({
      where: { tenantId_phone: { tenantId, phone } }
    });

    if (existing) {
      if (existing.status === 'REJECTED') {
        return prisma.mvm_vendor_registration.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING_APPROVAL',
            onboardingStep: 'REGISTERED',
            rejectionReason: null,
            reviewedAt: null,
            reviewedById: null,
            reviewedByName: null,
          }
        });
      }
      return existing;
    }

    const slug = await this.generateSlug(tenantId, phone);

    return prisma.mvm_vendor_registration.create({
      data: {
        tenantId,
        partnerId,
        phone,
        slug,
        status: 'PENDING_APPROVAL',
        onboardingStep: 'REGISTERED',
      }
    });
  }

  /**
   * Verify phone number (called after OTP verification)
   */
  static async verifyPhone(registrationId: string) {
    return prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      }
    });
  }

  /**
   * Update vendor profile
   */
  static async updateProfile(
    registrationId: string,
    updates: VendorProfileUpdate
  ) {
    const registration = await prisma.mvm_vendor_registration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    let newStep: MvmOnboardingStep = registration.onboardingStep;

    if (updates.businessName && updates.contactName) {
      newStep = 'PROFILE_COMPLETED';
    }

    if (updates.bankName && updates.accountNumber && updates.accountName) {
      newStep = 'BANK_INFO_ADDED';
    }

    let newSlug = registration.slug;
    if (updates.businessName && updates.businessName !== registration.businessName) {
      newSlug = await this.generateSlug(registration.tenantId, updates.businessName);
    }

    return prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: {
        ...updates,
        slug: newSlug,
        onboardingStep: newStep,
      }
    });
  }

  /**
   * Submit for approval
   */
  static async submitForApproval(registrationId: string) {
    const registration = await prisma.mvm_vendor_registration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (!registration.businessName || !registration.contactName) {
      throw new Error('Business name and contact name required');
    }

    return prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: {
        status: 'PENDING_APPROVAL',
      }
    });
  }

  /**
   * Admin: Get pending registrations
   */
  static async getPendingRegistrations(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const { limit = 50, offset = 0 } = options || {};

    return prisma.mvm_vendor_registration.findMany({
      where: {
        tenantId,
        status: 'PENDING_APPROVAL'
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Admin: Approve vendor
   */
  static async approveVendor(
    registrationId: string,
    reviewerId: string,
    reviewerName: string
  ) {
    const registration = await prisma.mvm_vendor_registration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    const vendor = await prisma.mvm_vendor.create({
      data: {
        tenantId: registration.tenantId,
        name: registration.businessName || 'Unnamed Vendor',
        slug: registration.slug || `vendor-${Date.now()}`,
        email: registration.email || `${registration.phone}@placeholder.local`,
        phone: registration.phone,
        description: registration.description,
        addressLine1: registration.address,
        city: registration.city,
        state: registration.state,
        status: 'APPROVED',
        onboardingStep: 'COMPLETED',
        bankName: registration.bankName,
        accountNumber: registration.accountNumber,
        accountName: registration.accountName,
      }
    });

    await prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: {
        status: 'APPROVED',
        onboardingStep: 'COMPLETED',
        reviewedById: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: new Date(),
        approvedVendorId: vendor.id,
      }
    });

    return vendor;
  }

  /**
   * Admin: Reject vendor
   */
  static async rejectVendor(
    registrationId: string,
    reviewerId: string,
    reviewerName: string,
    reason: string
  ) {
    return prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: {
        status: 'REJECTED',
        reviewedById: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: new Date(),
        rejectionReason: reason,
      }
    });
  }

  /**
   * Admin: Suspend vendor
   */
  static async suspendVendor(registrationId: string, reason: string) {
    const registration = await prisma.mvm_vendor_registration.findUnique({
      where: { id: registrationId }
    });

    if (!registration?.approvedVendorId) {
      throw new Error('Vendor not approved yet');
    }

    await prisma.mvm_vendor.update({
      where: { id: registration.approvedVendorId },
      data: { status: 'SUSPENDED' }
    });

    return prisma.mvm_vendor_registration.update({
      where: { id: registrationId },
      data: { status: 'SUSPENDED' }
    });
  }

  /**
   * Get registration by phone
   */
  static async getByPhone(tenantId: string, phone: string) {
    return prisma.mvm_vendor_registration.findUnique({
      where: { tenantId_phone: { tenantId, phone } }
    });
  }

  /**
   * Get registration status
   */
  static async getRegistrationStatus(registrationId: string) {
    const registration = await prisma.mvm_vendor_registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        status: true,
        onboardingStep: true,
        phoneVerified: true,
        businessName: true,
        bankName: true,
        rejectionReason: true,
        approvedVendorId: true,
      }
    });

    if (!registration) return null;

    return {
      ...registration,
      nextSteps: this.getNextSteps(registration),
    };
  }

  private static getNextSteps(registration: {
    status: MvmVendorStatus;
    onboardingStep: MvmOnboardingStep;
    phoneVerified: boolean;
    businessName: string | null;
    bankName: string | null;
  }): string[] {
    const steps: string[] = [];

    if (!registration.phoneVerified) {
      steps.push('Verify your phone number');
    }

    if (!registration.businessName) {
      steps.push('Add your business name');
    }

    if (!registration.bankName) {
      steps.push('Add bank details for payouts');
    }

    if (registration.status === 'PENDING_APPROVAL') {
      steps.push('Wait for admin approval');
    }

    if (registration.status === 'REJECTED') {
      steps.push('Address rejection feedback and resubmit');
    }

    return steps;
  }

  private static async generateSlug(
    tenantId: string,
    source: string
  ): Promise<string> {
    const base = source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    let slug = base || 'vendor';
    let counter = 1;

    while (true) {
      const existing = await prisma.mvm_vendor_registration.findUnique({
        where: { tenantId_slug: { tenantId, slug } }
      });

      if (!existing) break;
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }
}
