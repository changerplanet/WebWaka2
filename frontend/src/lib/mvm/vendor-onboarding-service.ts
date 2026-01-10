/**
 * MVM Vendor Onboarding Service
 * 
 * Manages vendor onboarding workflow and step progression.
 * 
 * @module lib/mvm/vendor-onboarding-service
 * @canonical PC-SCP Phase S3
 */

import { prisma } from '../prisma'
import { MvmOnboardingStep } from '@prisma/client'

// ============================================================================
// ONBOARDING STEP ORDER
// ============================================================================

const STEP_ORDER: MvmOnboardingStep[] = [
  'REGISTERED',
  'PROFILE_COMPLETED',
  'BANK_INFO_ADDED',
  'PRODUCTS_ADDED',
  'AGREEMENT_SIGNED',
  'COMPLETED'
]

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStatus {
  currentStep: MvmOnboardingStep
  completedSteps: MvmOnboardingStep[]
  nextStep: MvmOnboardingStep | null
  progress: number // 0-100
  requirements: StepRequirements
}

export interface StepRequirements {
  profileComplete: boolean
  bankInfoAdded: boolean
  productsAdded: boolean
  agreementSigned: boolean
}

// ============================================================================
// VENDOR ONBOARDING SERVICE
// ============================================================================

export const VendorOnboardingService = {
  /**
   * Get step index
   */
  getStepIndex(step: MvmOnboardingStep): number {
    return STEP_ORDER.indexOf(step)
  },
  
  /**
   * Get next step
   */
  getNextStep(currentStep: MvmOnboardingStep): MvmOnboardingStep | null {
    const currentIndex = this.getStepIndex(currentStep)
    if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
      return null
    }
    return STEP_ORDER[currentIndex + 1]
  },
  
  /**
   * Get completed steps (all steps before current)
   */
  getCompletedSteps(currentStep: MvmOnboardingStep): MvmOnboardingStep[] {
    const currentIndex = this.getStepIndex(currentStep)
    if (currentIndex <= 0) return []
    return STEP_ORDER.slice(0, currentIndex)
  },
  
  /**
   * Calculate progress percentage
   */
  calculateProgress(currentStep: MvmOnboardingStep): number {
    const currentIndex = this.getStepIndex(currentStep)
    if (currentIndex === -1) return 0
    // COMPLETED = 100%, last step before COMPLETED = 83%, etc.
    return Math.round((currentIndex / (STEP_ORDER.length - 1)) * 100)
  },
  
  /**
   * Check if vendor has completed profile requirements
   */
  async checkProfileComplete(vendorId: string): Promise<boolean> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: {
        name: true,
        email: true,
        phone: true,
        description: true,
        businessType: true,
        city: true,
        state: true
      }
    })
    
    if (!vendor) return false
    
    return !!(
      vendor.name &&
      vendor.email &&
      vendor.phone &&
      vendor.description &&
      vendor.businessType &&
      vendor.city &&
      vendor.state
    )
  },
  
  /**
   * Check if vendor has bank information
   */
  async checkBankInfoAdded(vendorId: string): Promise<boolean> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: {
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true
      }
    })
    
    if (!vendor) return false
    
    return !!(
      vendor.bankName &&
      vendor.bankCode &&
      vendor.accountNumber &&
      vendor.accountName
    )
  },
  
  /**
   * Check if vendor has added products
   */
  async checkProductsAdded(vendorId: string): Promise<boolean> {
    const count = await prisma.mvm_product_mapping.count({
      where: { vendorId, isActive: true }
    })
    
    return count > 0
  },
  
  /**
   * Check if vendor has signed agreement (stored in metadata)
   */
  async checkAgreementSigned(vendorId: string): Promise<boolean> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { metadata: true }
    })
    
    if (!vendor?.metadata) return false
    
    const metadata = vendor.metadata as Record<string, unknown>
    return !!(metadata.agreementSignedAt)
  },
  
  /**
   * Get full onboarding status for a vendor
   */
  async getStatus(vendorId: string): Promise<OnboardingStatus | null> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { onboardingStep: true }
    })
    
    if (!vendor) return null
    
    const [profileComplete, bankInfoAdded, productsAdded, agreementSigned] = await Promise.all([
      this.checkProfileComplete(vendorId),
      this.checkBankInfoAdded(vendorId),
      this.checkProductsAdded(vendorId),
      this.checkAgreementSigned(vendorId)
    ])
    
    return {
      currentStep: vendor.onboardingStep,
      completedSteps: this.getCompletedSteps(vendor.onboardingStep),
      nextStep: this.getNextStep(vendor.onboardingStep),
      progress: this.calculateProgress(vendor.onboardingStep),
      requirements: {
        profileComplete,
        bankInfoAdded,
        productsAdded,
        agreementSigned
      }
    }
  },
  
  /**
   * Advance to next onboarding step if requirements met
   */
  async advanceStep(vendorId: string): Promise<{
    success: boolean
    previousStep?: MvmOnboardingStep
    newStep?: MvmOnboardingStep
    error?: string
  }> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { onboardingStep: true }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    const currentStep = vendor.onboardingStep
    const nextStep = this.getNextStep(currentStep)
    
    if (!nextStep) {
      return { success: false, error: 'Already completed onboarding' }
    }
    
    // Check requirements for advancing to next step
    let canAdvance = false
    
    switch (nextStep) {
      case 'PROFILE_COMPLETED':
        canAdvance = await this.checkProfileComplete(vendorId)
        break
      case 'BANK_INFO_ADDED':
        canAdvance = await this.checkBankInfoAdded(vendorId)
        break
      case 'PRODUCTS_ADDED':
        canAdvance = await this.checkProductsAdded(vendorId)
        break
      case 'AGREEMENT_SIGNED':
        canAdvance = await this.checkAgreementSigned(vendorId)
        break
      case 'COMPLETED':
        // All previous requirements must be met
        const status = await this.getStatus(vendorId)
        canAdvance = !!(
          status?.requirements.profileComplete &&
          status?.requirements.bankInfoAdded &&
          status?.requirements.productsAdded &&
          status?.requirements.agreementSigned
        )
        break
      default:
        canAdvance = true
    }
    
    if (!canAdvance) {
      return { 
        success: false, 
        error: `Requirements not met for step: ${nextStep}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: nextStep }
    })
    
    return {
      success: true,
      previousStep: currentStep,
      newStep: nextStep
    }
  },
  
  /**
   * Mark profile as complete and advance
   */
  async completeProfile(vendorId: string): Promise<{ success: boolean; error?: string }> {
    const isComplete = await this.checkProfileComplete(vendorId)
    
    if (!isComplete) {
      return { success: false, error: 'Profile is incomplete. Ensure name, email, phone, description, businessType, city, and state are provided.' }
    }
    
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { onboardingStep: true }
    })
    
    if (vendor?.onboardingStep === 'REGISTERED') {
      await prisma.mvm_vendor.update({
        where: { id: vendorId },
        data: { onboardingStep: 'PROFILE_COMPLETED' }
      })
    }
    
    return { success: true }
  },
  
  /**
   * Mark bank info as added and advance
   */
  async completeBankInfo(vendorId: string): Promise<{ success: boolean; error?: string }> {
    const isComplete = await this.checkBankInfoAdded(vendorId)
    
    if (!isComplete) {
      return { success: false, error: 'Bank information incomplete. Ensure bankName, bankCode, accountNumber, and accountName are provided.' }
    }
    
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { onboardingStep: true }
    })
    
    if (vendor?.onboardingStep === 'PROFILE_COMPLETED') {
      await prisma.mvm_vendor.update({
        where: { id: vendorId },
        data: { onboardingStep: 'BANK_INFO_ADDED' }
      })
    }
    
    return { success: true }
  },
  
  /**
   * Mark products as added and advance
   */
  async completeProducts(vendorId: string): Promise<{ success: boolean; error?: string }> {
    const hasProducts = await this.checkProductsAdded(vendorId)
    
    if (!hasProducts) {
      return { success: false, error: 'No active products mapped. Add at least one product.' }
    }
    
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { onboardingStep: true }
    })
    
    if (vendor?.onboardingStep === 'BANK_INFO_ADDED') {
      await prisma.mvm_vendor.update({
        where: { id: vendorId },
        data: { onboardingStep: 'PRODUCTS_ADDED' }
      })
    }
    
    return { success: true }
  },
  
  /**
   * Sign agreement and advance
   */
  async signAgreement(vendorId: string, signedBy: string): Promise<{ success: boolean; error?: string }> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { metadata: true, onboardingStep: true }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    const metadata = (vendor.metadata as Record<string, unknown>) || {}
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        onboardingStep: vendor.onboardingStep === 'PRODUCTS_ADDED' ? 'AGREEMENT_SIGNED' : vendor.onboardingStep,
        metadata: {
          ...metadata,
          agreementSignedAt: new Date().toISOString(),
          agreementSignedBy: signedBy
        }
      }
    })
    
    return { success: true }
  },
  
  /**
   * Complete onboarding (final step)
   */
  async completeOnboarding(vendorId: string): Promise<{ success: boolean; error?: string }> {
    const status = await this.getStatus(vendorId)
    
    if (!status) {
      return { success: false, error: 'Vendor not found' }
    }
    
    const { requirements } = status
    
    if (!requirements.profileComplete) {
      return { success: false, error: 'Profile incomplete' }
    }
    if (!requirements.bankInfoAdded) {
      return { success: false, error: 'Bank info not added' }
    }
    if (!requirements.productsAdded) {
      return { success: false, error: 'No products added' }
    }
    if (!requirements.agreementSigned) {
      return { success: false, error: 'Agreement not signed' }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 'COMPLETED' }
    })
    
    return { success: true }
  }
}
