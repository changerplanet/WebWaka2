/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Configuration Service - Tenant-level procurement settings
 * 
 * PHASE 0: Module Constitution
 * 
 * This module OWNS:
 * - Procurement configuration
 * - Purchase workflows
 * - Supplier performance tracking
 * 
 * This module DOES NOT OWN:
 * - Suppliers (Core owns)
 * - Products (Core owns)
 * - Inventory (Core owns, read-only)
 * - Payments/Wallets (no execution)
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface ProcConfigInput {
  procurementEnabled?: boolean
  purchaseRequestsEnabled?: boolean
  supplierPriceListEnabled?: boolean
  performanceTrackingEnabled?: boolean
  requireApprovalForPR?: boolean
  approvalThresholdAmount?: number
  defaultPaymentTerms?: string
  defaultCurrency?: string
  allowInformalSuppliers?: boolean
  allowCashPurchases?: boolean
  requireReceiptPhotos?: boolean
  poNumberPrefix?: string
  autoConfirmPO?: boolean
  notifyOnPRApproval?: boolean
  notifyOnPOConfirmation?: boolean
  notifyOnGoodsReceipt?: boolean
  metadata?: Record<string, unknown>
}

export interface ProcConfigStatus {
  initialized: boolean
  enabled: boolean
  config: ProcConfigOutput | null
  entitlements: {
    allowed: boolean
    reason?: string
  }
}

export interface ProcConfigOutput {
  id: string
  tenantId: string
  procurementEnabled: boolean
  purchaseRequestsEnabled: boolean
  supplierPriceListEnabled: boolean
  performanceTrackingEnabled: boolean
  requireApprovalForPR: boolean
  approvalThresholdAmount: number | null
  defaultPaymentTerms: string
  defaultCurrency: string
  allowInformalSuppliers: boolean
  allowCashPurchases: boolean
  requireReceiptPhotos: boolean
  poNumberPrefix: string
  poNumberSequence: number
  autoConfirmPO: boolean
  notifyOnPRApproval: boolean
  notifyOnPOConfirmation: boolean
  notifyOnGoodsReceipt: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProcConfigurationService {
  /**
   * Get procurement configuration status
   */
  static async getStatus(tenantId: string): Promise<ProcConfigStatus> {
    const config = await prisma.proc_configurations.findUnique({
      where: { tenantId },
    })

    return {
      initialized: !!config,
      enabled: config?.procurementEnabled ?? false,
      config: config ? this.formatConfig(config) : null,
      entitlements: {
        allowed: true, // Will be enhanced by entitlements service
      },
    }
  }

  /**
   * Get procurement configuration
   */
  static async getConfig(tenantId: string): Promise<ProcConfigOutput | null> {
    const config = await prisma.proc_configurations.findUnique({
      where: { tenantId },
    })

    return config ? this.formatConfig(config) : null
  }

  /**
   * Initialize procurement module for tenant
   */
  static async initialize(tenantId: string, input?: ProcConfigInput): Promise<ProcConfigOutput> {
    const existing = await prisma.proc_configurations.findUnique({
      where: { tenantId },
    })

    if (existing) {
      // Update existing config
      return this.updateConfig(tenantId, input || {})
    }

    // Create new config with Nigeria-first defaults
    const config = await (prisma.proc_configurations.create as any)({
      data: {
        tenantId,
        procurementEnabled: input?.procurementEnabled ?? true,
        purchaseRequestsEnabled: input?.purchaseRequestsEnabled ?? true,
        supplierPriceListEnabled: input?.supplierPriceListEnabled ?? true,
        performanceTrackingEnabled: input?.performanceTrackingEnabled ?? true,
        requireApprovalForPR: input?.requireApprovalForPR ?? true,
        approvalThresholdAmount: input?.approvalThresholdAmount ?? null,
        defaultPaymentTerms: input?.defaultPaymentTerms ?? 'NET30',
        defaultCurrency: input?.defaultCurrency ?? 'NGN',
        allowInformalSuppliers: input?.allowInformalSuppliers ?? true,
        allowCashPurchases: input?.allowCashPurchases ?? true,
        requireReceiptPhotos: input?.requireReceiptPhotos ?? false,
        poNumberPrefix: input?.poNumberPrefix ?? 'PO',
        autoConfirmPO: input?.autoConfirmPO ?? false,
        notifyOnPRApproval: input?.notifyOnPRApproval ?? true,
        notifyOnPOConfirmation: input?.notifyOnPOConfirmation ?? true,
        notifyOnGoodsReceipt: input?.notifyOnGoodsReceipt ?? true,
        metadata: (input?.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    })

    return this.formatConfig(config)
  }

  /**
   * Update procurement configuration
   */
  static async updateConfig(tenantId: string, input: ProcConfigInput): Promise<ProcConfigOutput> {
    const config = await prisma.proc_configurations.update({
      where: { tenantId },
      data: {
        ...(input.procurementEnabled !== undefined && { procurementEnabled: input.procurementEnabled }),
        ...(input.purchaseRequestsEnabled !== undefined && { purchaseRequestsEnabled: input.purchaseRequestsEnabled }),
        ...(input.supplierPriceListEnabled !== undefined && { supplierPriceListEnabled: input.supplierPriceListEnabled }),
        ...(input.performanceTrackingEnabled !== undefined && { performanceTrackingEnabled: input.performanceTrackingEnabled }),
        ...(input.requireApprovalForPR !== undefined && { requireApprovalForPR: input.requireApprovalForPR }),
        ...(input.approvalThresholdAmount !== undefined && { approvalThresholdAmount: input.approvalThresholdAmount }),
        ...(input.defaultPaymentTerms !== undefined && { defaultPaymentTerms: input.defaultPaymentTerms }),
        ...(input.defaultCurrency !== undefined && { defaultCurrency: input.defaultCurrency }),
        ...(input.allowInformalSuppliers !== undefined && { allowInformalSuppliers: input.allowInformalSuppliers }),
        ...(input.allowCashPurchases !== undefined && { allowCashPurchases: input.allowCashPurchases }),
        ...(input.requireReceiptPhotos !== undefined && { requireReceiptPhotos: input.requireReceiptPhotos }),
        ...(input.poNumberPrefix !== undefined && { poNumberPrefix: input.poNumberPrefix }),
        ...(input.autoConfirmPO !== undefined && { autoConfirmPO: input.autoConfirmPO }),
        ...(input.notifyOnPRApproval !== undefined && { notifyOnPRApproval: input.notifyOnPRApproval }),
        ...(input.notifyOnPOConfirmation !== undefined && { notifyOnPOConfirmation: input.notifyOnPOConfirmation }),
        ...(input.notifyOnGoodsReceipt !== undefined && { notifyOnGoodsReceipt: input.notifyOnGoodsReceipt }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })

    return this.formatConfig(config)
  }

  /**
   * Get next PR number
   */
  static async getNextPRNumber(tenantId: string): Promise<string> {
    const config = await this.getConfig(tenantId)
    const year = new Date().getFullYear()
    const sequence = await this.incrementSequence(tenantId, 'pr')
    return `PR-${year}-${String(sequence).padStart(6, '0')}`
  }

  /**
   * Get next PO number
   */
  static async getNextPONumber(tenantId: string): Promise<string> {
    const config = await this.getConfig(tenantId)
    const prefix = config?.poNumberPrefix || 'PO'
    const year = new Date().getFullYear()
    
    // Increment and get sequence
    const updated = await prisma.proc_configurations.update({
      where: { tenantId },
      data: { poNumberSequence: { increment: 1 } },
      select: { poNumberSequence: true },
    })
    
    return `${prefix}-${year}-${String(updated.poNumberSequence).padStart(6, '0')}`
  }

  /**
   * Get next GR number
   */
  static async getNextGRNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const sequence = await this.incrementSequence(tenantId, 'gr')
    return `GR-${year}-${String(sequence).padStart(6, '0')}`
  }

  /**
   * Increment sequence counter
   */
  private static async incrementSequence(tenantId: string, type: 'pr' | 'gr'): Promise<number> {
    // Use a simple counter approach - in production, consider a separate sequence table
    const count = await prisma.proc_purchase_requests.count({ where: { tenantId } })
    return count + 1
  }

  /**
   * Format config for output
   */
  private static formatConfig(config: {
    id: string
    tenantId: string
    procurementEnabled: boolean
    purchaseRequestsEnabled: boolean
    supplierPriceListEnabled: boolean
    performanceTrackingEnabled: boolean
    requireApprovalForPR: boolean
    approvalThresholdAmount: { toNumber(): number } | null
    defaultPaymentTerms: string
    defaultCurrency: string
    allowInformalSuppliers: boolean
    allowCashPurchases: boolean
    requireReceiptPhotos: boolean
    poNumberPrefix: string
    poNumberSequence: number
    autoConfirmPO: boolean
    notifyOnPRApproval: boolean
    notifyOnPOConfirmation: boolean
    notifyOnGoodsReceipt: boolean
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): ProcConfigOutput {
    return {
      id: config.id,
      tenantId: config.tenantId,
      procurementEnabled: config.procurementEnabled,
      purchaseRequestsEnabled: config.purchaseRequestsEnabled,
      supplierPriceListEnabled: config.supplierPriceListEnabled,
      performanceTrackingEnabled: config.performanceTrackingEnabled,
      requireApprovalForPR: config.requireApprovalForPR,
      approvalThresholdAmount: config.approvalThresholdAmount?.toNumber() ?? null,
      defaultPaymentTerms: config.defaultPaymentTerms,
      defaultCurrency: config.defaultCurrency,
      allowInformalSuppliers: config.allowInformalSuppliers,
      allowCashPurchases: config.allowCashPurchases,
      requireReceiptPhotos: config.requireReceiptPhotos,
      poNumberPrefix: config.poNumberPrefix,
      poNumberSequence: config.poNumberSequence,
      autoConfirmPO: config.autoConfirmPO,
      notifyOnPRApproval: config.notifyOnPRApproval,
      notifyOnPOConfirmation: config.notifyOnPOConfirmation,
      notifyOnGoodsReceipt: config.notifyOnGoodsReceipt,
      metadata: config.metadata as Record<string, unknown> | null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  }
}
