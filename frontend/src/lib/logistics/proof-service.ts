/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Proof Service - Proof of delivery management
 * 
 * Handles delivery proof capture (photos, signatures, PINs, OTPs).
 */

import { prisma } from '@/lib/prisma'
import { LogisticsProofType, Prisma } from '@prisma/client'
import crypto from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface CaptureProofInput {
  assignmentId: string
  proofType: LogisticsProofType
  
  // Proof data (varies by type)
  imageUrl?: string
  signatureData?: string  // Base64
  pinCode?: string
  otpCode?: string
  recipientName?: string
  notes?: string
  
  // Location
  latitude?: number
  longitude?: number
  
  // Capture metadata
  capturedBy?: string
  capturedByType?: 'AGENT' | 'CUSTOMER'
  capturedAt?: Date
  
  // Offline support
  offlineId?: string
  
  metadata?: object
}

export interface VerifyPinInput {
  assignmentId: string
  pinCode: string
}

export interface VerifyOtpInput {
  assignmentId: string
  otpCode: string
}

// ============================================================================
// PROOF SERVICE
// ============================================================================

export class ProofService {
  /**
   * Capture proof of delivery
   */
  static async captureProof(tenantId: string, input: CaptureProofInput) {
    // Verify assignment exists and is in appropriate status
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { 
        id: input.assignmentId, 
        tenantId,
        status: { in: ['IN_TRANSIT', 'ARRIVING', 'DELIVERED'] },
      },
    })

    if (!assignment) {
      throw new Error('Assignment not found or not in delivery status')
    }

    // Check for duplicate offline IDs
    if (input.offlineId) {
      const existing = await prisma.logistics_delivery_proofs.findFirst({
        where: { offlineId: input.offlineId },
      })
      if (existing) {
        return existing // Idempotent - return existing
      }
    }

    // Hash sensitive data
    const hashedPin = input.pinCode ? this.hashCode(input.pinCode) : undefined
    const hashedOtp = input.otpCode ? this.hashCode(input.otpCode) : undefined

    return prisma.logistics_delivery_proofs.create({
      data: {
        assignmentId: input.assignmentId,
        proofType: input.proofType,
        imageUrl: input.imageUrl,
        signatureData: input.signatureData,
        pinCode: hashedPin,
        otpCode: hashedOtp,
        recipientName: input.recipientName,
        notes: input.notes,
        latitude: input.latitude,
        longitude: input.longitude,
        capturedBy: input.capturedBy,
        capturedByType: input.capturedByType,
        capturedAt: input.capturedAt || new Date(),
        offlineId: input.offlineId,
        syncedAt: input.offlineId ? new Date() : null,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Get proofs for an assignment
   */
  static async getProofs(assignmentId: string) {
    return prisma.logistics_delivery_proofs.findMany({
      where: { assignmentId },
      orderBy: { capturedAt: 'desc' },
    })
  }

  /**
   * Verify PIN code
   */
  static async verifyPin(tenantId: string, input: VerifyPinInput): Promise<boolean> {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: input.assignmentId, tenantId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Look for existing PIN proof
    const pinProof = await prisma.logistics_delivery_proofs.findFirst({
      where: { 
        assignmentId: input.assignmentId, 
        proofType: 'PIN_CODE',
      },
    })

    if (!pinProof?.pinCode) {
      throw new Error('No PIN set for this delivery')
    }

    return this.verifyHash(input.pinCode, pinProof.pinCode)
  }

  /**
   * Verify OTP code
   */
  static async verifyOtp(tenantId: string, input: VerifyOtpInput): Promise<boolean> {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: input.assignmentId, tenantId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Look for existing OTP proof
    const otpProof = await prisma.logistics_delivery_proofs.findFirst({
      where: { 
        assignmentId: input.assignmentId, 
        proofType: 'OTP',
      },
      orderBy: { capturedAt: 'desc' },
    })

    if (!otpProof?.otpCode) {
      throw new Error('No OTP set for this delivery')
    }

    return this.verifyHash(input.otpCode, otpProof.otpCode)
  }

  /**
   * Generate delivery PIN for customer
   */
  static async generateDeliveryPin(tenantId: string, assignmentId: string): Promise<string> {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Generate 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    
    // Store hashed PIN
    await this.captureProof(tenantId, {
      assignmentId,
      proofType: 'PIN_CODE',
      pinCode: pin,
      capturedByType: 'CUSTOMER',
      notes: 'System-generated delivery PIN',
    })

    return pin
  }

  /**
   * Generate delivery OTP for customer
   */
  static async generateDeliveryOtp(tenantId: string, assignmentId: string): Promise<string> {
    const assignment = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId, tenantId },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store hashed OTP
    await this.captureProof(tenantId, {
      assignmentId,
      proofType: 'OTP',
      otpCode: otp,
      capturedByType: 'CUSTOMER',
      notes: 'System-generated delivery OTP',
    })

    return otp
  }

  /**
   * Check if delivery has required proofs
   */
  static async hasRequiredProofs(tenantId: string, assignmentId: string): Promise<{
    complete: boolean
    missing: LogisticsProofType[]
    captured: LogisticsProofType[]
  }> {
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
    })

    const proofs = await prisma.logistics_delivery_proofs.findMany({
      where: { assignmentId },
      select: { proofType: true },
    })

    const capturedTypes = proofs.map(p => p.proofType)
    const requiredTypes: LogisticsProofType[] = []
    const missing: LogisticsProofType[] = []

    if (config?.photoProofRequired) requiredTypes.push('PHOTO')
    if (config?.signatureProofRequired) requiredTypes.push('SIGNATURE')
    if (config?.pinVerificationEnabled) requiredTypes.push('PIN_CODE')
    if (config?.otpVerificationEnabled) requiredTypes.push('OTP')

    // Default: at least require photo
    if (requiredTypes.length === 0) requiredTypes.push('PHOTO')

    for (const type of requiredTypes) {
      if (!capturedTypes.includes(type)) {
        missing.push(type)
      }
    }

    return {
      complete: missing.length === 0,
      missing,
      captured: capturedTypes,
    }
  }

  /**
   * Hash a code (PIN/OTP)
   */
  private static hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
  }

  /**
   * Verify a hash
   */
  private static verifyHash(code: string, hash: string): boolean {
    return this.hashCode(code) === hash
  }

  /**
   * Sync offline proofs
   */
  static async syncOfflineProofs(tenantId: string, logistics_delivery_proofs: CaptureProofInput[]) {
    const results = []
    
    for (const proof of proofs) {
      try {
        const result = await this.captureProof(tenantId, proof)
        results.push({ offlineId: proof.offlineId, success: true, id: result.id })
      } catch (error) {
        results.push({ 
          offlineId: proof.offlineId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return results
  }
}
