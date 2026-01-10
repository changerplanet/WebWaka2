/**
 * MVM Vendor Status Service
 * 
 * Handles vendor status transitions with validation.
 * Enforces valid state machine transitions.
 * 
 * @module lib/mvm/vendor-status-service
 * @canonical PC-SCP Phase S3
 */

import { prisma } from '../prisma'
import { MvmVendorStatus } from '@prisma/client'

// ============================================================================
// STATUS TRANSITION RULES
// ============================================================================

/**
 * Valid status transitions
 * 
 * PENDING_APPROVAL → APPROVED, REJECTED
 * APPROVED → SUSPENDED, CHURNED
 * SUSPENDED → APPROVED, CHURNED
 * REJECTED → PENDING_APPROVAL (re-apply)
 * CHURNED → (terminal - no transitions)
 */
const VALID_TRANSITIONS: Record<MvmVendorStatus, MvmVendorStatus[]> = {
  PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
  APPROVED: ['SUSPENDED', 'CHURNED'],
  SUSPENDED: ['APPROVED', 'CHURNED'],
  REJECTED: ['PENDING_APPROVAL'],
  CHURNED: [] // Terminal state
}

// ============================================================================
// TYPES
// ============================================================================

export interface StatusTransitionResult {
  success: boolean
  previousStatus?: MvmVendorStatus
  newStatus?: MvmVendorStatus
  error?: string
}

// ============================================================================
// VENDOR STATUS SERVICE
// ============================================================================

export const VendorStatusService = {
  /**
   * Check if a status transition is valid
   */
  isValidTransition(from: MvmVendorStatus, to: MvmVendorStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  },
  
  /**
   * Get valid next statuses for a vendor
   */
  getValidNextStatuses(currentStatus: MvmVendorStatus): MvmVendorStatus[] {
    return VALID_TRANSITIONS[currentStatus] || []
  },
  
  /**
   * Approve a pending vendor
   */
  async approve(
    tenantId: string, 
    vendorId: string, 
    approvedBy: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (!this.isValidTransition(vendor.status, 'APPROVED')) {
      return { 
        success: false, 
        error: `Cannot approve vendor with status ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy,
        // Clear any previous rejection
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        // Clear any suspension
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null
      }
    })
    
    return {
      success: true,
      previousStatus: vendor.status,
      newStatus: 'APPROVED'
    }
  },
  
  /**
   * Reject a pending vendor
   */
  async reject(
    tenantId: string,
    vendorId: string,
    rejectedBy: string,
    reason: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (!this.isValidTransition(vendor.status, 'REJECTED')) {
      return { 
        success: false, 
        error: `Cannot reject vendor with status ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason
      }
    })
    
    return {
      success: true,
      previousStatus: vendor.status,
      newStatus: 'REJECTED'
    }
  },
  
  /**
   * Suspend an approved vendor
   */
  async suspend(
    tenantId: string,
    vendorId: string,
    suspendedBy: string,
    reason: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (!this.isValidTransition(vendor.status, 'SUSPENDED')) {
      return { 
        success: false, 
        error: `Cannot suspend vendor with status ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy,
        suspensionReason: reason
      }
    })
    
    return {
      success: true,
      previousStatus: vendor.status,
      newStatus: 'SUSPENDED'
    }
  },
  
  /**
   * Reinstate a suspended vendor
   */
  async reinstate(
    tenantId: string,
    vendorId: string,
    reinstatedBy: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (vendor.status !== 'SUSPENDED') {
      return { 
        success: false, 
        error: `Can only reinstate suspended vendors, current status: ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: reinstatedBy,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null
      }
    })
    
    return {
      success: true,
      previousStatus: 'SUSPENDED',
      newStatus: 'APPROVED'
    }
  },
  
  /**
   * Mark vendor as churned (permanently inactive)
   */
  async markChurned(
    tenantId: string,
    vendorId: string,
    reason?: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (!this.isValidTransition(vendor.status, 'CHURNED')) {
      return { 
        success: false, 
        error: `Cannot mark vendor as churned with status ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'CHURNED',
        metadata: {
          ...(vendor.metadata as object || {}),
          churnedAt: new Date().toISOString(),
          churnReason: reason
        }
      }
    })
    
    return {
      success: true,
      previousStatus: vendor.status,
      newStatus: 'CHURNED'
    }
  },
  
  /**
   * Allow rejected vendor to re-apply
   */
  async reapply(
    tenantId: string,
    vendorId: string
  ): Promise<StatusTransitionResult> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    if (vendor.status !== 'REJECTED') {
      return { 
        success: false, 
        error: `Only rejected vendors can re-apply, current status: ${vendor.status}` 
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        status: 'PENDING_APPROVAL',
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        onboardingStep: 'REGISTERED'
      }
    })
    
    return {
      success: true,
      previousStatus: 'REJECTED',
      newStatus: 'PENDING_APPROVAL'
    }
  },
  
  /**
   * Verify a vendor (mark as verified regardless of status)
   */
  async verify(
    tenantId: string,
    vendorId: string,
    verifiedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy
      }
    })
    
    return { success: true }
  },
  
  /**
   * Unverify a vendor
   */
  async unverify(
    tenantId: string,
    vendorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId }
    })
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null
      }
    })
    
    return { success: true }
  }
}
