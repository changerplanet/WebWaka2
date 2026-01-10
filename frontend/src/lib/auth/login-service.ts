/**
 * Login Service
 * 
 * Handles Nigeria-first login flows:
 * 1. Phone + OTP (PRIMARY)
 * 2. Email + OTP (SECONDARY)
 * 3. Password (OPTIONAL - if user has set one)
 * 4. Magic Link (LEGACY - for admins/power users)
 * 
 * Features:
 * - Auto-detect phone vs email input
 * - Remember device option
 * - Secure session management
 */

import { prisma } from '../prisma'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { createOtp, verifyOtp, CreateOtpResult, VerifyOtpResult } from './otp-service'
import { normalizePhoneNumber, isValidNigerianPhone, maskPhoneNumber, maskEmail } from './otp-provider'
import { createMagicLink, verifyMagicLink, setSessionCookie, generateToken } from '../auth'

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOGIN_CONFIG = {
  sessionExpiryDays: 7,            // Normal session
  rememberedSessionExpiryDays: 30, // Remembered device session
  maxPasswordAttempts: 5,          // Max password attempts before lockout
  lockoutMinutes: 15,              // Lockout duration
}

// ============================================================================
// TYPES
// ============================================================================

export type LoginMethod = 'otp_phone' | 'otp_email' | 'password' | 'magic_link'

export interface LoginIdentifyRequest {
  identifier: string        // Phone or email
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}

export interface LoginIdentifyResult {
  success: boolean
  method: LoginMethod       // Recommended method
  availableMethods: LoginMethod[]
  hasPassword: boolean
  maskedIdentifier?: string
  userId?: string
  error?: string
  errorCode?: string
}

export interface LoginWithOtpRequest {
  identifier: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  rememberDevice?: boolean
}

export interface LoginWithOtpResult {
  success: boolean
  otpId?: string
  maskedRecipient?: string
  canResendAt?: Date
  error?: string
  errorCode?: string
}

export interface VerifyLoginOtpRequest {
  otpId: string
  code: string
  identifier: string
  rememberDevice?: boolean
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}

export interface LoginWithPasswordRequest {
  identifier: string
  password: string
  rememberDevice?: boolean
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}

export interface LoginResult {
  success: boolean
  sessionToken?: string
  userId?: string
  tenantId?: string
  tenantSlug?: string
  hasMultipleTenants?: boolean
  error?: string
  errorCode?: string
  attemptsRemaining?: number
  isLocked?: boolean
  lockedUntil?: Date
}

export interface SetPasswordRequest {
  userId: string
  newPassword: string
  currentPassword?: string  // Required if already has password
}

export interface ResetPasswordRequest {
  identifier: string        // Phone or email
  ipAddress?: string
  userAgent?: string
}

export interface ResetPasswordVerifyRequest {
  otpId: string
  code: string
  newPassword: string
  identifier: string
  ipAddress?: string
  userAgent?: string
}

// ============================================================================
// INPUT DETECTION
// ============================================================================

/**
 * Detect if input is phone or email
 */
export function detectIdentifierType(identifier: string): 'phone' | 'email' | 'unknown' {
  const cleaned = identifier.trim()
  
  // Email pattern
  if (cleaned.includes('@') && cleaned.includes('.')) {
    return 'email'
  }
  
  // Phone pattern (digits, +, -, spaces)
  const digitsOnly = cleaned.replace(/[\s\-\+\(\)]/g, '')
  if (/^\d{10,15}$/.test(digitsOnly)) {
    return 'phone'
  }
  
  // Nigerian phone starting with 0
  if (/^0[789]\d{9}$/.test(digitsOnly)) {
    return 'phone'
  }
  
  return 'unknown'
}

/**
 * Normalize identifier based on type
 */
export function normalizeIdentifier(identifier: string): { type: 'phone' | 'email'; value: string } | null {
  const type = detectIdentifierType(identifier)
  
  if (type === 'phone') {
    return {
      type: 'phone',
      value: normalizePhoneNumber(identifier, 'NG'),
    }
  }
  
  if (type === 'email') {
    return {
      type: 'email',
      value: identifier.toLowerCase().trim(),
    }
  }
  
  return null
}

// ============================================================================
// LOGIN IDENTIFICATION
// ============================================================================

/**
 * Identify user and available login methods
 */
export async function identifyUser(request: LoginIdentifyRequest): Promise<LoginIdentifyResult> {
  const normalized = normalizeIdentifier(request.identifier)
  
  if (!normalized) {
    return {
      success: false,
      method: 'otp_phone',
      availableMethods: [],
      hasPassword: false,
      error: 'Please enter a valid phone number or email address',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  // Find user
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({ where: { phone: normalized.value } })
    : await prisma.user.findUnique({ where: { email: normalized.value } })
  
  if (!user) {
    // User doesn't exist - suggest signup
    return {
      success: false,
      method: normalized.type === 'phone' ? 'otp_phone' : 'otp_email',
      availableMethods: [],
      hasPassword: false,
      error: 'No account found with this phone/email. Would you like to sign up?',
      errorCode: 'USER_NOT_FOUND',
    }
  }
  
  if (!user.isActive) {
    return {
      success: false,
      method: 'otp_phone',
      availableMethods: [],
      hasPassword: false,
      error: 'This account has been deactivated. Please contact support.',
      errorCode: 'USER_DEACTIVATED',
    }
  }
  
  // Determine available methods
  const availableMethods: LoginMethod[] = []
  
  if (user.phone) {
    availableMethods.push('otp_phone')
  }
  if (user.email) {
    availableMethods.push('otp_email')
    availableMethods.push('magic_link') // Magic link for email users
  }
  if (user.passwordHash) {
    availableMethods.push('password')
  }
  
  // Determine recommended method
  let recommendedMethod: LoginMethod = 'otp_phone'
  if (normalized.type === 'phone' && user.phone) {
    recommendedMethod = 'otp_phone'
  } else if (normalized.type === 'email' && user.email) {
    recommendedMethod = user.passwordHash ? 'password' : 'otp_email'
  }
  
  const maskedIdentifier = normalized.type === 'phone'
    ? maskPhoneNumber(normalized.value)
    : maskEmail(normalized.value)
  
  return {
    success: true,
    method: recommendedMethod,
    availableMethods,
    hasPassword: !!user.passwordHash,
    maskedIdentifier,
    userId: user.id,
  }
}

// ============================================================================
// OTP LOGIN
// ============================================================================

/**
 * Initiate login with OTP
 */
export async function loginWithOtp(request: LoginWithOtpRequest): Promise<LoginWithOtpResult> {
  const normalized = normalizeIdentifier(request.identifier)
  
  if (!normalized) {
    return {
      success: false,
      error: 'Invalid phone number or email',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  // Find user
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({ where: { phone: normalized.value } })
    : await prisma.user.findUnique({ where: { email: normalized.value } })
  
  if (!user) {
    return {
      success: false,
      error: 'No account found',
      errorCode: 'USER_NOT_FOUND',
    }
  }
  
  // Send OTP
  const otpResult = await createOtp({
    phone: normalized.type === 'phone' ? normalized.value : undefined,
    email: normalized.type === 'email' ? normalized.value : undefined,
    purpose: 'LOGIN',
    channel: normalized.type === 'phone' ? 'SMS' : 'EMAIL',
    userId: user.id,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    deviceFingerprint: request.deviceFingerprint,
  })
  
  if (!otpResult.success) {
    return {
      success: false,
      error: otpResult.error,
      errorCode: otpResult.errorCode,
    }
  }
  
  return {
    success: true,
    otpId: otpResult.otpId,
    maskedRecipient: otpResult.maskedRecipient,
    canResendAt: otpResult.canResendAt,
  }
}

/**
 * Verify OTP and complete login
 */
export async function verifyLoginOtp(request: VerifyLoginOtpRequest): Promise<LoginResult> {
  // Verify OTP
  const otpResult = await verifyOtp({
    otpId: request.otpId,
    code: request.code,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
  })
  
  if (!otpResult.success) {
    return {
      success: false,
      error: otpResult.error,
      errorCode: otpResult.errorCode,
      attemptsRemaining: otpResult.attemptsRemaining,
      isLocked: otpResult.isLocked,
    }
  }
  
  // Get user with memberships
  const normalized = normalizeIdentifier(request.identifier)
  if (!normalized) {
    return {
      success: false,
      error: 'Invalid identifier',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({
        where: { phone: normalized.value },
        include: { memberships: { where: { isActive: true }, include: { Tenant: true } } },
      })
    : await prisma.user.findUnique({
        where: { email: normalized.value },
        include: { memberships: { where: { isActive: true }, include: { Tenant: true } } },
      })
  
  if (!user) {
    return {
      success: false,
      error: 'User not found',
      errorCode: 'USER_NOT_FOUND',
    }
  }
  
  // Create session
  const session = await createSession({
    userId: user.id,
    tenantId: user.memberships[0]?.tenantId,
    authMethod: normalized.type === 'phone' ? 'otp_phone' : 'otp_email',
    rememberDevice: request.rememberDevice,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    deviceFingerprint: request.deviceFingerprint,
  })
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  
  return {
    success: true,
    sessionToken: session.token,
    userId: user.id,
    tenantId: user.memberships[0]?.tenantId,
    tenantSlug: user.memberships[0]?.tenant.slug,
    hasMultipleTenants: user.memberships.length > 1,
  }
}

// ============================================================================
// PASSWORD LOGIN
// ============================================================================

/**
 * Login with password
 */
export async function loginWithPassword(request: LoginWithPasswordRequest): Promise<LoginResult> {
  const normalized = normalizeIdentifier(request.identifier)
  
  if (!normalized) {
    return {
      success: false,
      error: 'Invalid phone number or email',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  // Find user
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({
        where: { phone: normalized.value },
        include: { 
          memberships: { where: { isActive: true }, include: { Tenant: true } },
          PartnerUser: true,
        },
      })
    : await prisma.user.findUnique({
        where: { email: normalized.value },
        include: { 
          memberships: { where: { isActive: true }, include: { Tenant: true } },
          PartnerUser: true,
        },
      })
  
  if (!user) {
    return {
      success: false,
      error: 'Invalid credentials',
      errorCode: 'INVALID_CREDENTIALS',
    }
  }
  
  if (!user.passwordHash) {
    return {
      success: false,
      error: 'Password login not set up. Please use OTP.',
      errorCode: 'NO_PASSWORD',
    }
  }
  
  // Verify password
  const isValid = await bcrypt.compare(request.password, user.passwordHash)
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid credentials',
      errorCode: 'INVALID_CREDENTIALS',
    }
  }
  
  // Create session
  const session = await createSession({
    userId: user.id,
    tenantId: user.memberships[0]?.tenantId,
    authMethod: 'password',
    rememberDevice: request.rememberDevice,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    deviceFingerprint: request.deviceFingerprint,
  })
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  
  return {
    success: true,
    sessionToken: session.token,
    userId: user.id,
    globalRole: user.globalRole,
    isPartner: !!user.PartnerUser,
    tenantId: user.memberships[0]?.tenantId,
    tenantSlug: user.memberships[0]?.tenant.slug,
    hasMultipleTenants: user.memberships.length > 1,
  }
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Set or change password
 */
export async function setPassword(request: SetPasswordRequest): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: request.userId },
  })
  
  if (!user) {
    return {
      success: false,
      error: 'User not found',
      errorCode: 'USER_NOT_FOUND',
    }
  }
  
  // If user already has password, require current password
  if (user.passwordHash && request.currentPassword) {
    const isValid = await bcrypt.compare(request.currentPassword, user.passwordHash)
    if (!isValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
        errorCode: 'INVALID_CURRENT_PASSWORD',
      }
    }
  } else if (user.passwordHash && !request.currentPassword) {
    return {
      success: false,
      error: 'Current password required',
      errorCode: 'CURRENT_PASSWORD_REQUIRED',
    }
  }
  
  // Validate new password
  if (request.newPassword.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters',
      errorCode: 'PASSWORD_TOO_SHORT',
    }
  }
  
  // Hash and save
  const passwordHash = await bcrypt.hash(request.newPassword, 10)
  
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
    },
  })
  
  return { success: true }
}

/**
 * Initiate password reset
 */
export async function initiatePasswordReset(request: ResetPasswordRequest): Promise<LoginWithOtpResult> {
  const normalized = normalizeIdentifier(request.identifier)
  
  if (!normalized) {
    return {
      success: false,
      error: 'Invalid phone number or email',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  // Find user
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({ where: { phone: normalized.value } })
    : await prisma.user.findUnique({ where: { email: normalized.value } })
  
  if (!user) {
    // Don't reveal if user exists
    return {
      success: true,
      maskedRecipient: normalized.type === 'phone'
        ? maskPhoneNumber(normalized.value)
        : maskEmail(normalized.value),
    }
  }
  
  // Send OTP
  const otpResult = await createOtp({
    phone: normalized.type === 'phone' ? normalized.value : undefined,
    email: normalized.type === 'email' ? normalized.value : undefined,
    purpose: 'PASSWORD_RESET',
    channel: normalized.type === 'phone' ? 'SMS' : 'EMAIL',
    userId: user.id,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
  })
  
  return {
    success: otpResult.success,
    otpId: otpResult.otpId,
    maskedRecipient: otpResult.maskedRecipient,
    canResendAt: otpResult.canResendAt,
    error: otpResult.error,
    errorCode: otpResult.errorCode,
  }
}

/**
 * Verify OTP and set new password
 */
export async function verifyPasswordReset(request: ResetPasswordVerifyRequest): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  // Verify OTP
  const otpResult = await verifyOtp({
    otpId: request.otpId,
    code: request.code,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
  })
  
  if (!otpResult.success) {
    return {
      success: false,
      error: otpResult.error,
      errorCode: otpResult.errorCode,
    }
  }
  
  // Find user
  const normalized = normalizeIdentifier(request.identifier)
  if (!normalized) {
    return {
      success: false,
      error: 'Invalid identifier',
      errorCode: 'INVALID_IDENTIFIER',
    }
  }
  
  const user = normalized.type === 'phone'
    ? await prisma.user.findUnique({ where: { phone: normalized.value } })
    : await prisma.user.findUnique({ where: { email: normalized.value } })
  
  if (!user) {
    return {
      success: false,
      error: 'User not found',
      errorCode: 'USER_NOT_FOUND',
    }
  }
  
  // Validate and set new password
  if (request.newPassword.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters',
      errorCode: 'PASSWORD_TOO_SHORT',
    }
  }
  
  const passwordHash = await bcrypt.hash(request.newPassword, 10)
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
    },
  })
  
  return { success: true }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

interface CreateSessionRequest {
  userId: string
  tenantId?: string
  authMethod: string
  rememberDevice?: boolean
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}

/**
 * Create a new session
 */
async function createSession(request: CreateSessionRequest): Promise<{ id: string; token: string }> {
  const token = generateToken()
  const expiryDays = request.rememberDevice 
    ? LOGIN_CONFIG.rememberedSessionExpiryDays 
    : LOGIN_CONFIG.sessionExpiryDays
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)
  
  // Parse device name from user agent
  let deviceName: string | undefined
  if (request.userAgent) {
    // Simple device name extraction
    if (request.userAgent.includes('Android')) {
      deviceName = 'Android Device'
    } else if (request.userAgent.includes('iPhone')) {
      deviceName = 'iPhone'
    } else if (request.userAgent.includes('Chrome')) {
      deviceName = 'Chrome Browser'
    } else if (request.userAgent.includes('Firefox')) {
      deviceName = 'Firefox Browser'
    } else if (request.userAgent.includes('Safari')) {
      deviceName = 'Safari Browser'
    }
  }
  
  const session = await prisma.session.create({
    data: {
      id: uuidv4(),
      userId: request.userId,
      token,
      activeTenant: request.tenantId,
      authMethod: request.authMethod,
      isRemembered: request.rememberDevice || false,
      rememberedAt: request.rememberDevice ? new Date() : null,
      expiresAt,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceFingerprint: request.deviceFingerprint,
      deviceName,
    },
  })
  
  return { id: session.id, token }
}

/**
 * Check if device is remembered for user
 */
export async function isDeviceRemembered(userId: string, deviceFingerprint: string): Promise<boolean> {
  if (!deviceFingerprint) return false
  
  const rememberedSession = await prisma.session.findFirst({
    where: {
      userId,
      deviceFingerprint,
      isRemembered: true,
      expiresAt: { gt: new Date() },
    },
  })
  
  return !!rememberedSession
}

/**
 * Get user's active sessions
 */
export async function getUserSessions(userId: string): Promise<Array<{
  id: string
  deviceName?: string
  lastActiveAt: Date
  isRemembered: boolean
  authMethod: string
}>> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
  })
  
  return sessions.map(s => ({
    id: s.id,
    deviceName: s.deviceName || undefined,
    lastActiveAt: s.lastActiveAt,
    isRemembered: s.isRemembered,
    authMethod: s.authMethod,
  }))
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  const result = await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  })
  
  return result.count > 0
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  })
  
  return result.count
}
