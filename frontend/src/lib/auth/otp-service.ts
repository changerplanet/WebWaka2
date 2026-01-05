/**
 * OTP Service
 * 
 * Handles OTP generation, verification, and rate limiting.
 * Nigeria-first design with:
 * - Phone as primary identifier
 * - Rate limiting for security
 * - Retry handling for poor connectivity
 * - Provider abstraction for flexibility
 */

import { prisma } from '../prisma'
import { OtpChannel, OtpPurpose, OtpStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { sendOtp, normalizePhoneNumber, isValidNigerianPhone, maskPhoneNumber, maskEmail } from './otp-provider'

// ============================================================================
// CONFIGURATION
// ============================================================================

const OTP_CONFIG = {
  // OTP settings
  codeLength: 6,                    // 6-digit code
  expiryMinutes: 5,                 // OTP expires in 5 minutes
  maxAttempts: 3,                   // Max verification attempts
  maxResends: 3,                    // Max resends per session
  
  // Rate limiting
  minResendIntervalSeconds: 60,     // Min 60 seconds between resends
  maxOtpsPerHourPerRecipient: 5,    // Max OTPs per hour to same recipient
  maxOtpsPerHourPerIp: 10,          // Max OTPs per hour from same IP
  
  // Lockout settings
  lockoutMinutes: 15,               // Lockout after max failures
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOtpRequest {
  phone?: string
  email?: string
  purpose: OtpPurpose
  channel?: OtpChannel
  userId?: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  language?: string
}

export interface CreateOtpResult {
  success: boolean
  otpId?: string
  expiresAt?: Date
  maskedRecipient?: string     // For UI display
  error?: string
  errorCode?: string
  canResendAt?: Date           // When user can request resend
  attemptsRemaining?: number
}

export interface VerifyOtpRequest {
  otpId: string
  code: string
  ipAddress?: string
  userAgent?: string
}

export interface VerifyOtpResult {
  success: boolean
  userId?: string
  phone?: string
  email?: string
  error?: string
  errorCode?: string
  attemptsRemaining?: number
  isLocked?: boolean
}

export interface ResendOtpRequest {
  otpId: string
  channel?: OtpChannel          // Optionally switch channel
  ipAddress?: string
  userAgent?: string
}

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generate a random 6-digit OTP code
 */
function generateOtpCode(length: number = OTP_CONFIG.codeLength): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(min + Math.random() * (max - min + 1)).toString()
}

/**
 * Hash OTP code for secure storage
 */
async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verify OTP code against hash
 */
async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if recipient is rate limited
 */
async function isRecipientRateLimited(recipient: string): Promise<{ limited: boolean; retryAfter?: Date }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const recentOtps = await prisma.otpCode.count({
    where: {
      OR: [
        { phone: recipient },
        { email: recipient },
      ],
      createdAt: { gte: oneHourAgo },
    },
  })
  
  if (recentOtps >= OTP_CONFIG.maxOtpsPerHourPerRecipient) {
    // Find earliest OTP to calculate retry time
    const earliestOtp = await prisma.otpCode.findFirst({
      where: {
        OR: [
          { phone: recipient },
          { email: recipient },
        ],
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'asc' },
    })
    
    const retryAfter = earliestOtp 
      ? new Date(earliestOtp.createdAt.getTime() + 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000)
    
    return { limited: true, retryAfter }
  }
  
  return { limited: false }
}

/**
 * Check if IP is rate limited
 */
async function isIpRateLimited(ipAddress: string): Promise<{ limited: boolean; retryAfter?: Date }> {
  if (!ipAddress) return { limited: false }
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const recentOtps = await prisma.otpCode.count({
    where: {
      ipAddress,
      createdAt: { gte: oneHourAgo },
    },
  })
  
  if (recentOtps >= OTP_CONFIG.maxOtpsPerHourPerIp) {
    return { 
      limited: true, 
      retryAfter: new Date(Date.now() + 60 * 60 * 1000) 
    }
  }
  
  return { limited: false }
}

/**
 * Check if recipient has a recent valid OTP that can be resent
 */
async function findActiveOtp(recipient: string, purpose: OtpPurpose): Promise<{ id: string; canResendAt: Date } | null> {
  const now = new Date()
  
  const activeOtp = await prisma.otpCode.findFirst({
    where: {
      OR: [
        { phone: recipient },
        { email: recipient },
      ],
      purpose,
      status: 'PENDING',
      expiresAt: { gt: now },
      resendCount: { lt: OTP_CONFIG.maxResends },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  if (activeOtp) {
    const canResendAt = activeOtp.lastResentAt 
      ? new Date(activeOtp.lastResentAt.getTime() + OTP_CONFIG.minResendIntervalSeconds * 1000)
      : new Date(activeOtp.createdAt.getTime() + OTP_CONFIG.minResendIntervalSeconds * 1000)
    
    return { id: activeOtp.id, canResendAt }
  }
  
  return null
}

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Create and send a new OTP
 */
export async function createOtp(request: CreateOtpRequest): Promise<CreateOtpResult> {
  // Validate input
  if (!request.phone && !request.email) {
    return {
      success: false,
      error: 'Phone number or email is required',
      errorCode: 'MISSING_RECIPIENT',
    }
  }
  
  // Normalize phone number for Nigerian numbers
  let normalizedPhone: string | undefined
  if (request.phone) {
    normalizedPhone = normalizePhoneNumber(request.phone, 'NG')
    
    // Validate Nigerian phone
    if (!isValidNigerianPhone(normalizedPhone)) {
      return {
        success: false,
        error: 'Invalid Nigerian phone number',
        errorCode: 'INVALID_PHONE',
      }
    }
  }
  
  const recipient = normalizedPhone || request.email!
  const channel = request.channel || (request.phone ? 'SMS' : 'EMAIL')
  
  // Check rate limits
  const recipientLimit = await isRecipientRateLimited(recipient)
  if (recipientLimit.limited) {
    return {
      success: false,
      error: 'Too many OTP requests. Please try again later.',
      errorCode: 'RATE_LIMITED',
      canResendAt: recipientLimit.retryAfter,
    }
  }
  
  if (request.ipAddress) {
    const ipLimit = await isIpRateLimited(request.ipAddress)
    if (ipLimit.limited) {
      return {
        success: false,
        error: 'Too many OTP requests from this device. Please try again later.',
        errorCode: 'IP_RATE_LIMITED',
        canResendAt: ipLimit.retryAfter,
      }
    }
  }
  
  // Check for existing active OTP
  const existingOtp = await findActiveOtp(recipient, request.purpose)
  if (existingOtp && existingOtp.canResendAt > new Date()) {
    return {
      success: false,
      error: 'An OTP was recently sent. Please wait before requesting another.',
      errorCode: 'OTP_COOLDOWN',
      otpId: existingOtp.id,
      canResendAt: existingOtp.canResendAt,
    }
  }
  
  // If existing OTP can be resent, invalidate it first
  if (existingOtp) {
    await prisma.otpCode.update({
      where: { id: existingOtp.id },
      data: { status: 'EXPIRED' },
    })
  }
  
  // Generate new OTP
  const code = generateOtpCode()
  const codeHash = await hashOtpCode(code)
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000)
  
  // Create OTP record
  const otpRecord = await prisma.otpCode.create({
    data: {
      id: uuidv4(),
      phone: normalizedPhone,
      email: request.email?.toLowerCase(),
      userId: request.userId,
      code: code.substring(0, 2) + '****', // Partial for debugging (remove in production)
      codeHash,
      purpose: request.purpose,
      channel: channel as OtpChannel,
      status: 'PENDING',
      expiresAt,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceFingerprint: request.deviceFingerprint,
    },
  })
  
  // Send OTP via provider
  const sendResult = await sendOtp({
    recipient,
    code,
    channel: channel as OtpChannel,
    purpose: request.purpose,
    language: request.language,
  })
  
  if (!sendResult.success) {
    // Mark OTP as failed
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { status: 'FAILED' },
    })
    
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
      errorCode: 'SEND_FAILED',
    }
  }
  
  // Update with provider info
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      provider: sendResult.provider,
      providerMsgId: sendResult.messageId,
    },
  })
  
  // Calculate when user can resend
  const canResendAt = new Date(Date.now() + OTP_CONFIG.minResendIntervalSeconds * 1000)
  
  return {
    success: true,
    otpId: otpRecord.id,
    expiresAt,
    maskedRecipient: normalizedPhone 
      ? maskPhoneNumber(normalizedPhone) 
      : maskEmail(request.email!),
    canResendAt,
    attemptsRemaining: OTP_CONFIG.maxAttempts,
  }
}

/**
 * Verify an OTP code
 */
export async function verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResult> {
  // Find the OTP record
  const otpRecord = await prisma.otpCode.findUnique({
    where: { id: request.otpId },
  })
  
  if (!otpRecord) {
    return {
      success: false,
      error: 'Invalid verification code',
      errorCode: 'OTP_NOT_FOUND',
    }
  }
  
  // Check if already verified
  if (otpRecord.status === 'VERIFIED') {
    return {
      success: false,
      error: 'This code has already been used',
      errorCode: 'OTP_ALREADY_USED',
    }
  }
  
  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { status: 'EXPIRED' },
    })
    
    return {
      success: false,
      error: 'Verification code has expired. Please request a new one.',
      errorCode: 'OTP_EXPIRED',
    }
  }
  
  // Check if max attempts exceeded
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { status: 'FAILED' },
    })
    
    return {
      success: false,
      error: 'Too many failed attempts. Please request a new code.',
      errorCode: 'MAX_ATTEMPTS_EXCEEDED',
      isLocked: true,
    }
  }
  
  // Verify the code
  const isValid = await verifyOtpCode(request.code, otpRecord.codeHash)
  
  if (!isValid) {
    // Increment attempts
    const updatedOtp = await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    })
    
    const attemptsRemaining = updatedOtp.maxAttempts - updatedOtp.attempts
    
    return {
      success: false,
      error: `Incorrect code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      errorCode: 'INVALID_CODE',
      attemptsRemaining,
    }
  }
  
  // Mark as verified
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedIp: request.ipAddress,
      verifiedUserAgent: request.userAgent,
    },
  })
  
  return {
    success: true,
    userId: otpRecord.userId || undefined,
    phone: otpRecord.phone || undefined,
    email: otpRecord.email || undefined,
  }
}

/**
 * Resend an OTP (with optional channel switch)
 */
export async function resendOtp(request: ResendOtpRequest): Promise<CreateOtpResult> {
  // Find the original OTP
  const otpRecord = await prisma.otpCode.findUnique({
    where: { id: request.otpId },
  })
  
  if (!otpRecord) {
    return {
      success: false,
      error: 'Original OTP not found',
      errorCode: 'OTP_NOT_FOUND',
    }
  }
  
  // Check if can resend
  if (otpRecord.resendCount >= otpRecord.maxResends) {
    return {
      success: false,
      error: 'Maximum resend limit reached. Please request a new code.',
      errorCode: 'MAX_RESENDS_EXCEEDED',
    }
  }
  
  // Check cooldown
  const now = new Date()
  const lastSentAt = otpRecord.lastResentAt || otpRecord.createdAt
  const cooldownEnd = new Date(lastSentAt.getTime() + OTP_CONFIG.minResendIntervalSeconds * 1000)
  
  if (now < cooldownEnd) {
    return {
      success: false,
      error: 'Please wait before requesting another code',
      errorCode: 'RESEND_COOLDOWN',
      canResendAt: cooldownEnd,
    }
  }
  
  // Generate new code and update record
  const code = generateOtpCode()
  const codeHash = await hashOtpCode(code)
  const newChannel = request.channel || otpRecord.channel
  const recipient = otpRecord.phone || otpRecord.email!
  
  // Update OTP record with new code
  const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000)
  
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      code: code.substring(0, 2) + '****',
      codeHash,
      channel: newChannel,
      expiresAt,
      resendCount: { increment: 1 },
      lastResentAt: now,
      attempts: 0, // Reset attempts on resend
      status: 'PENDING',
    },
  })
  
  // Send OTP
  const sendResult = await sendOtp({
    recipient,
    code,
    channel: newChannel,
    purpose: otpRecord.purpose,
  })
  
  if (!sendResult.success) {
    return {
      success: false,
      error: 'Failed to resend OTP. Please try again.',
      errorCode: 'RESEND_FAILED',
    }
  }
  
  // Update provider info
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: {
      provider: sendResult.provider,
      providerMsgId: sendResult.messageId,
    },
  })
  
  const canResendAt = new Date(Date.now() + OTP_CONFIG.minResendIntervalSeconds * 1000)
  const resendsRemaining = otpRecord.maxResends - otpRecord.resendCount - 1
  
  return {
    success: true,
    otpId: otpRecord.id,
    expiresAt,
    maskedRecipient: otpRecord.phone 
      ? maskPhoneNumber(otpRecord.phone) 
      : maskEmail(otpRecord.email!),
    canResendAt,
    attemptsRemaining: OTP_CONFIG.maxAttempts,
  }
}

/**
 * Clean up expired OTPs (call periodically)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpCode.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  })
  
  return result.count
}
