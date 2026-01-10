/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Configuration Service - Tenant logistics configuration
 */

import { prisma } from '@/lib/prisma'
import { LogisticsDeliveryPriority, Prisma } from '@prisma/client'
import { ZoneService } from './zone-service'

// ============================================================================
// TYPES
// ============================================================================

export interface InitializeLogisticsInput {
  createDefaultZones?: boolean
  deliveryEnabled?: boolean
  autoAssignmentEnabled?: boolean
  proofOfDeliveryRequired?: boolean
  photoProofRequired?: boolean
  signatureProofRequired?: boolean
  pinVerificationEnabled?: boolean
  otpVerificationEnabled?: boolean
  defaultPriority?: LogisticsDeliveryPriority
  defaultCurrency?: string
  assignmentAlgorithm?: 'NEAREST' | 'ROUND_ROBIN' | 'LEAST_BUSY'
  maxConcurrentDeliveries?: number
  maxDeliveryAttempts?: number
  operatingHours?: object
  metadata?: Record<string, unknown>
}

export interface UpdateConfigInput {
  deliveryEnabled?: boolean
  autoAssignmentEnabled?: boolean
  realTimeTrackingEnabled?: boolean
  proofOfDeliveryRequired?: boolean
  photoProofRequired?: boolean
  signatureProofRequired?: boolean
  pinVerificationEnabled?: boolean
  otpVerificationEnabled?: boolean
  defaultPriority?: LogisticsDeliveryPriority
  defaultCurrency?: string
  assignmentAlgorithm?: string
  maxConcurrentDeliveries?: number
  defaultDeliveryWindowHours?: number
  expressDeliveryWindowHours?: number
  sameDayDeliveryWindowHours?: number
  operatingHours?: object
  maxDeliveryAttempts?: number
  retryDelayHours?: number
  notifyCustomerOnAssignment?: boolean
  notifyCustomerOnPickup?: boolean
  notifyCustomerOnTransit?: boolean
  notifyCustomerOnArrival?: boolean
  notifyCustomerOnDelivery?: boolean
  notifyCustomerOnFailure?: boolean
  supportInformalAddresses?: boolean
  landmarkRequired?: boolean
  metadata?: Record<string, unknown>
}

// ============================================================================
// CONFIGURATION SERVICE
// ============================================================================

export class ConfigurationService {
  /**
   * Initialize logistics for a tenant
   */
  static async initialize(tenantId: string, input: InitializeLogisticsInput = {}) {
    // Check if already initialized
    const existing = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
    })

    if (existing) {
      throw new Error('Logistics already initialized for this tenant')
    }

    // Create configuration
    const config = await prisma.logistics_configurations.create({
      data: {
        tenantId,
        deliveryEnabled: input.deliveryEnabled ?? true,
        autoAssignmentEnabled: input.autoAssignmentEnabled ?? false,
        proofOfDeliveryRequired: input.proofOfDeliveryRequired ?? true,
        photoProofRequired: input.photoProofRequired ?? true,
        signatureProofRequired: input.signatureProofRequired ?? false,
        pinVerificationEnabled: input.pinVerificationEnabled ?? false,
        otpVerificationEnabled: input.otpVerificationEnabled ?? false,
        defaultPriority: input.defaultPriority || 'STANDARD',
        defaultCurrency: input.defaultCurrency || 'NGN',
        assignmentAlgorithm: input.assignmentAlgorithm || 'NEAREST',
        maxConcurrentDeliveries: input.maxConcurrentDeliveries || 5,
        maxDeliveryAttempts: input.maxDeliveryAttempts || 3,
        operatingHours: input.operatingHours,
        metadata: input.metadata as any,
      },
    })

    // Create default Nigerian zones if requested
    if (input.createDefaultZones) {
      await ZoneService.createDefaultNigerianZones(tenantId)
    }

    return config
  }

  /**
   * Get logistics configuration
   */
  static async getConfiguration(tenantId: string) {
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
    })

    return {
      initialized: !!config,
      config,
    }
  }

  /**
   * Update logistics configuration
   */
  static async updateConfiguration(tenantId: string, input: UpdateConfigInput) {
    return prisma.logistics_configurations.update({
      where: { tenantId },
      data: {
        ...(input.deliveryEnabled !== undefined && { deliveryEnabled: input.deliveryEnabled }),
        ...(input.autoAssignmentEnabled !== undefined && { autoAssignmentEnabled: input.autoAssignmentEnabled }),
        ...(input.realTimeTrackingEnabled !== undefined && { realTimeTrackingEnabled: input.realTimeTrackingEnabled }),
        ...(input.proofOfDeliveryRequired !== undefined && { proofOfDeliveryRequired: input.proofOfDeliveryRequired }),
        ...(input.photoProofRequired !== undefined && { photoProofRequired: input.photoProofRequired }),
        ...(input.signatureProofRequired !== undefined && { signatureProofRequired: input.signatureProofRequired }),
        ...(input.pinVerificationEnabled !== undefined && { pinVerificationEnabled: input.pinVerificationEnabled }),
        ...(input.otpVerificationEnabled !== undefined && { otpVerificationEnabled: input.otpVerificationEnabled }),
        ...(input.defaultPriority && { defaultPriority: input.defaultPriority }),
        ...(input.defaultCurrency && { defaultCurrency: input.defaultCurrency }),
        ...(input.assignmentAlgorithm && { assignmentAlgorithm: input.assignmentAlgorithm }),
        ...(input.maxConcurrentDeliveries !== undefined && { maxConcurrentDeliveries: input.maxConcurrentDeliveries }),
        ...(input.defaultDeliveryWindowHours !== undefined && { defaultDeliveryWindowHours: input.defaultDeliveryWindowHours }),
        ...(input.expressDeliveryWindowHours !== undefined && { expressDeliveryWindowHours: input.expressDeliveryWindowHours }),
        ...(input.sameDayDeliveryWindowHours !== undefined && { sameDayDeliveryWindowHours: input.sameDayDeliveryWindowHours }),
        ...(input.operatingHours !== undefined && { operatingHours: input.operatingHours }),
        ...(input.maxDeliveryAttempts !== undefined && { maxDeliveryAttempts: input.maxDeliveryAttempts }),
        ...(input.retryDelayHours !== undefined && { retryDelayHours: input.retryDelayHours }),
        ...(input.notifyCustomerOnAssignment !== undefined && { notifyCustomerOnAssignment: input.notifyCustomerOnAssignment }),
        ...(input.notifyCustomerOnPickup !== undefined && { notifyCustomerOnPickup: input.notifyCustomerOnPickup }),
        ...(input.notifyCustomerOnTransit !== undefined && { notifyCustomerOnTransit: input.notifyCustomerOnTransit }),
        ...(input.notifyCustomerOnArrival !== undefined && { notifyCustomerOnArrival: input.notifyCustomerOnArrival }),
        ...(input.notifyCustomerOnDelivery !== undefined && { notifyCustomerOnDelivery: input.notifyCustomerOnDelivery }),
        ...(input.notifyCustomerOnFailure !== undefined && { notifyCustomerOnFailure: input.notifyCustomerOnFailure }),
        ...(input.supportInformalAddresses !== undefined && { supportInformalAddresses: input.supportInformalAddresses }),
        ...(input.landmarkRequired !== undefined && { landmarkRequired: input.landmarkRequired }),
        ...(input.metadata !== undefined && { metadata: input.metadata ?? undefined }),
      },
    })
  }

  /**
   * Check if logistics is initialized and enabled
   */
  static async isEnabled(tenantId: string): Promise<boolean> {
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
      select: { deliveryEnabled: true },
    })

    return config?.deliveryEnabled ?? false
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(tenantId: string) {
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
      select: {
        notifyCustomerOnAssignment: true,
        notifyCustomerOnPickup: true,
        notifyCustomerOnTransit: true,
        notifyCustomerOnArrival: true,
        notifyCustomerOnDelivery: true,
        notifyCustomerOnFailure: true,
      },
    })

    return config || {
      notifyCustomerOnAssignment: true,
      notifyCustomerOnPickup: true,
      notifyCustomerOnTransit: true,
      notifyCustomerOnArrival: true,
      notifyCustomerOnDelivery: true,
      notifyCustomerOnFailure: true,
    }
  }
}
