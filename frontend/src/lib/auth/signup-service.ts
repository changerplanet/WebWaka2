/**
 * Signup Service
 * 
 * Handles multi-step, lightweight signup flow (Nigeria-first).
 * 
 * STEPS:
 * 1. IDENTITY - Phone/Email + OTP verification
 * 2. USER_INTENT - "I run a business" / "Setting up for someone" / "Partner"
 * 3. BUSINESS_BASICS - Business name, type (optional), location
 * 4. DISCOVERY - What do you want to do? (advisory only)
 * 
 * RULES:
 * - No capability activation during signup
 * - No billing requirement
 * - Completion < 2 minutes
 * - Survives network failures
 */

import { prisma } from '../prisma'
import { SignupStep, TenantStatus, GlobalRole, TenantRole } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { createOtp, verifyOtp, CreateOtpResult, VerifyOtpResult } from './otp-service'
import { normalizePhoneNumber } from './otp-provider'
import { validateSignupPartnerContext, PHASE_4A_POLICY } from '../partner-first'

// ============================================================================
// CONFIGURATION
// ============================================================================

const SIGNUP_CONFIG = {
  sessionExpiryMinutes: 30,    // Signup session expires after 30 mins of inactivity
  defaultCountry: 'NG',        // Nigeria default
}

// ============================================================================
// TYPES
// ============================================================================

export interface StartSignupRequest {
  phone?: string
  email?: string
  referralCode?: string
  marketingIntent?: string
  marketingSource?: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}

export interface StartSignupResult {
  success: boolean
  sessionToken?: string
  otpId?: string
  maskedRecipient?: string
  canResendAt?: Date
  error?: string
  errorCode?: string
}

export interface VerifySignupOtpRequest {
  sessionToken: string
  otpId: string
  code: string
  ipAddress?: string
  userAgent?: string
}

export interface SetUserIntentRequest {
  sessionToken: string
  intent: 'run_business' | 'setup_for_other' | 'partner'
}

export interface SetBusinessBasicsRequest {
  sessionToken: string
  businessName: string
  businessType?: string    // Optional, can be 'not_sure'
  country?: string         // Default: NG
  state?: string
  city?: string
}

export interface SetDiscoveryChoicesRequest {
  sessionToken: string
  choices: string[]       // ['sell_in_store', 'sell_online', 'manage_inventory', ...]
}

export interface CompleteSignupRequest {
  sessionToken: string
  name?: string           // User's name (optional)
}

export interface CompleteSignupResult {
  success: boolean
  userId?: string
  tenantId?: string
  tenantSlug?: string
  error?: string
  errorCode?: string
}

export interface SignupSessionState {
  sessionToken: string
  currentStep: SignupStep
  stepsCompleted: string[]
  phone?: string
  email?: string
  userIntent?: string
  businessName?: string
  businessType?: string
  country: string
  state?: string
  city?: string
  discoveryChoices: string[]
  referralCode?: string
  partnerId?: string
  marketingIntent?: string
  marketingSource?: string
  userId?: string
  tenantId?: string
  expiresAt: Date
}

// ============================================================================
// USER INTENT OPTIONS
// ============================================================================

export const USER_INTENTS = [
  {
    key: 'run_business',
    label: 'I run a business',
    description: 'I am setting up my own business or shop',
    icon: 'building',
  },
  {
    key: 'setup_for_other',
    label: 'I am setting this up for someone else',
    description: 'I am helping a friend, family member, or client',
    icon: 'users',
  },
  {
    key: 'partner',
    label: 'I am a partner / consultant',
    description: 'I work with multiple businesses and want to manage them',
    icon: 'briefcase',
  },
]

// ============================================================================
// BUSINESS TYPE OPTIONS (Nigeria-first)
// ============================================================================

export const BUSINESS_TYPES = [
  { key: 'retail_shop', label: 'Retail Shop', category: 'retail' },
  { key: 'supermarket', label: 'Supermarket / Mini-mart', category: 'retail' },
  { key: 'restaurant', label: 'Restaurant / Eatery', category: 'food' },
  { key: 'pharmacy', label: 'Pharmacy', category: 'health' },
  { key: 'fashion', label: 'Fashion / Clothing', category: 'retail' },
  { key: 'electronics', label: 'Electronics / Phone Shop', category: 'retail' },
  { key: 'services', label: 'Services (Salon, Barber, etc.)', category: 'services' },
  { key: 'wholesale', label: 'Wholesale / Distribution', category: 'wholesale' },
  { key: 'school', label: 'School', category: 'education' },
  { key: 'hotel', label: 'Hotel / Guest House', category: 'hospitality' },
  { key: 'other', label: 'Other', category: 'other' },
  { key: 'not_sure', label: 'Not sure yet', category: 'unknown' },
]

// ============================================================================
// DISCOVERY OPTIONS (domain-agnostic, advisory only)
// ============================================================================

export const DISCOVERY_OPTIONS = [
  { key: 'sell_in_store', label: 'Sell in-store', description: 'Use a POS to sell in my shop', domain: 'commerce' },
  { key: 'sell_online', label: 'Sell online', description: 'Sell on WhatsApp or create an online store', domain: 'commerce' },
  { key: 'manage_inventory', label: 'Manage inventory', description: 'Track stock and get low-stock alerts', domain: 'commerce' },
  { key: 'track_finances', label: 'Track finances', description: 'Monitor income, expenses, and profits', domain: 'commerce' },
  { key: 'manage_customers', label: 'Manage customers', description: 'Keep customer records and loyalty', domain: 'commerce' },
  { key: 'manage_team', label: 'Manage my team', description: 'Track attendance and payroll', domain: 'hr' },
  { key: 'manage_deliveries', label: 'Manage deliveries', description: 'Track orders and riders', domain: 'logistics' },
  { key: 'run_school', label: 'Run a school', description: 'Manage students, attendance, and grades', domain: 'education' },
  { key: 'run_hotel', label: 'Run a hotel', description: 'Manage rooms, bookings, and guests', domain: 'hospitality' },
  { key: 'something_else', label: 'Something else', description: 'I want to explore what\'s available', domain: 'general' },
]

// ============================================================================
// NIGERIAN STATES
// ============================================================================

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return uuidv4() + '-' + uuidv4()
}

/**
 * Get signup session by token
 */
export async function getSignupSession(sessionToken: string): Promise<SignupSessionState | null> {
  const session = await prisma.signupSession.findUnique({
    where: { sessionToken },
  })
  
  if (!session) return null
  
  // Check expiry
  if (session.expiresAt < new Date()) {
    await prisma.signupSession.update({
      where: { id: session.id },
      data: { currentStep: 'ABANDONED' },
    })
    return null
  }
  
  // Update last active
  await prisma.signupSession.update({
    where: { id: session.id },
    data: { 
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + SIGNUP_CONFIG.sessionExpiryMinutes * 60 * 1000),
    },
  })
  
  return {
    sessionToken: session.sessionToken,
    currentStep: session.currentStep,
    stepsCompleted: session.stepsCompleted,
    phone: session.phone || undefined,
    email: session.email || undefined,
    userIntent: session.userIntent || undefined,
    businessName: session.businessName || undefined,
    businessType: session.businessType || undefined,
    country: session.country,
    state: session.state || undefined,
    city: session.city || undefined,
    discoveryChoices: session.discoveryChoices,
    referralCode: session.referralCode || undefined,
    partnerId: session.partnerId || undefined,
    marketingIntent: session.marketingIntent || undefined,
    userId: session.userId || undefined,
    tenantId: session.tenantId || undefined,
    expiresAt: session.expiresAt,
  }
}

// ============================================================================
// STEP 1: START SIGNUP (IDENTITY)
// ============================================================================

/**
 * Start a new signup session and send OTP
 */
export async function startSignup(request: StartSignupRequest): Promise<StartSignupResult> {
  // Validate input
  if (!request.phone && !request.email) {
    return {
      success: false,
      error: 'Phone number or email is required',
      errorCode: 'MISSING_IDENTITY',
    }
  }
  
  // Normalize phone number
  let normalizedPhone: string | undefined
  if (request.phone) {
    normalizedPhone = normalizePhoneNumber(request.phone, 'NG')
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        normalizedPhone ? { phone: normalizedPhone } : {},
        request.email ? { email: request.email.toLowerCase() } : {},
      ].filter(c => Object.keys(c).length > 0),
    },
    include: {
      memberships: true,
    },
  })
  
  // If user exists with a tenant, redirect to login
  if (existingUser && existingUser.memberships.length > 0) {
    return {
      success: false,
      error: 'An account with this phone/email already exists. Please login instead.',
      errorCode: 'USER_EXISTS',
    }
  }
  
  // Look up partner from referral code
  let partnerId: string | undefined
  if (request.referralCode) {
    const referralCode = await prisma.partnerReferralCode.findUnique({
      where: { code: request.referralCode },
      include: { Partner: true },
    })
    
    if (referralCode?.isActive && referralCode.partner.status === 'ACTIVE') {
      partnerId = referralCode.partnerId
    }
  }
  
  // Create signup session
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SIGNUP_CONFIG.sessionExpiryMinutes * 60 * 1000)
  
  await prisma.signupSession.create({
    data: {
      id: uuidv4(),
      sessionToken,
      phone: normalizedPhone,
      email: request.email?.toLowerCase(),
      currentStep: 'IDENTITY',
      stepsCompleted: [],
      country: SIGNUP_CONFIG.defaultCountry,
      referralCode: request.referralCode,
      partnerId,
      marketingIntent: request.marketingIntent,
      marketingSource: request.marketingSource,
      expiresAt,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceFingerprint: request.deviceFingerprint,
    },
  })
  
  // Send OTP
  const otpResult = await createOtp({
    phone: normalizedPhone,
    email: request.email?.toLowerCase(),
    purpose: 'SIGNUP',
    channel: normalizedPhone ? 'SMS' : 'EMAIL',
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    deviceFingerprint: request.deviceFingerprint,
  })
  
  if (!otpResult.success) {
    // Clean up session on OTP failure
    await prisma.signupSession.delete({
      where: { sessionToken },
    })
    
    return {
      success: false,
      error: otpResult.error,
      errorCode: otpResult.errorCode,
    }
  }
  
  // Update session to OTP_SENT
  await prisma.signupSession.update({
    where: { sessionToken },
    data: { currentStep: 'OTP_SENT' },
  })
  
  return {
    success: true,
    sessionToken,
    otpId: otpResult.otpId,
    maskedRecipient: otpResult.maskedRecipient,
    canResendAt: otpResult.canResendAt,
  }
}

/**
 * Verify OTP for signup
 */
export async function verifySignupOtp(request: VerifySignupOtpRequest): Promise<VerifyOtpResult & { sessionToken?: string }> {
  // Get session
  const session = await getSignupSession(request.sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired. Please start again.',
      errorCode: 'SESSION_EXPIRED',
    }
  }
  
  // Verify OTP
  const result = await verifyOtp({
    otpId: request.otpId,
    code: request.code,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
  })
  
  if (!result.success) {
    return result
  }
  
  // Update session to OTP_VERIFIED
  await prisma.signupSession.update({
    where: { sessionToken: request.sessionToken },
    data: {
      currentStep: 'OTP_VERIFIED',
      stepsCompleted: { push: 'IDENTITY' },
    },
  })
  
  return {
    ...result,
    sessionToken: request.sessionToken,
  }
}

// ============================================================================
// STEP 2: USER INTENT
// ============================================================================

/**
 * Set user intent
 */
export async function setUserIntent(request: SetUserIntentRequest): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const session = await getSignupSession(request.sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired. Please start again.',
      errorCode: 'SESSION_EXPIRED',
    }
  }
  
  // Validate intent
  const validIntents = USER_INTENTS.map(i => i.key)
  if (!validIntents.includes(request.intent)) {
    return {
      success: false,
      error: 'Invalid user intent',
      errorCode: 'INVALID_INTENT',
    }
  }
  
  // Update session
  await prisma.signupSession.update({
    where: { sessionToken: request.sessionToken },
    data: {
      userIntent: request.intent,
      currentStep: 'USER_INTENT',
      stepsCompleted: { push: 'USER_INTENT' },
    },
  })
  
  return { success: true }
}

// ============================================================================
// STEP 3: BUSINESS BASICS
// ============================================================================

/**
 * Set business basics
 */
export async function setBusinessBasics(request: SetBusinessBasicsRequest): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const session = await getSignupSession(request.sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired. Please start again.',
      errorCode: 'SESSION_EXPIRED',
    }
  }
  
  // Validate business name
  if (!request.businessName || request.businessName.trim().length < 2) {
    return {
      success: false,
      error: 'Business name must be at least 2 characters',
      errorCode: 'INVALID_BUSINESS_NAME',
    }
  }
  
  // Validate state for Nigeria
  const country = request.country || 'NG'
  if (country === 'NG' && request.state && !NIGERIAN_STATES.includes(request.state)) {
    return {
      success: false,
      error: 'Invalid Nigerian state',
      errorCode: 'INVALID_STATE',
    }
  }
  
  // Update session
  await prisma.signupSession.update({
    where: { sessionToken: request.sessionToken },
    data: {
      businessName: request.businessName.trim(),
      businessType: request.businessType || 'not_sure',
      country,
      state: request.state,
      city: request.city,
      currentStep: 'BUSINESS_BASICS',
      stepsCompleted: { push: 'BUSINESS_BASICS' },
    },
  })
  
  return { success: true }
}

// ============================================================================
// STEP 4: DISCOVERY
// ============================================================================

/**
 * Set discovery choices (advisory only, no activation)
 */
export async function setDiscoveryChoices(request: SetDiscoveryChoicesRequest): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const session = await getSignupSession(request.sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired. Please start again.',
      errorCode: 'SESSION_EXPIRED',
    }
  }
  
  // Validate choices
  const validChoices = DISCOVERY_OPTIONS.map(o => o.key)
  const invalidChoices = request.choices.filter(c => !validChoices.includes(c))
  if (invalidChoices.length > 0) {
    return {
      success: false,
      error: `Invalid discovery choices: ${invalidChoices.join(', ')}`,
      errorCode: 'INVALID_CHOICES',
    }
  }
  
  // Update session
  await prisma.signupSession.update({
    where: { sessionToken: request.sessionToken },
    data: {
      discoveryChoices: request.choices,
      currentStep: 'DISCOVERY',
      stepsCompleted: { push: 'DISCOVERY' },
    },
  })
  
  return { success: true }
}

// ============================================================================
// COMPLETE SIGNUP
// ============================================================================

/**
 * Generate URL-safe slug from business name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

/**
 * Complete signup - create user and tenant
 * 
 * RULES:
 * - Tenant starts with ZERO active capabilities (only core)
 * - No billing required
 * - Discovery choices stored as onboarding metadata (advisory only)
 */
export async function completeSignup(request: CompleteSignupRequest): Promise<CompleteSignupResult> {
  const session = await getSignupSession(request.sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired. Please start again.',
      errorCode: 'SESSION_EXPIRED',
    }
  }
  
  // PHASE 4A: Enforce partner requirement for tenant creation
  if (PHASE_4A_POLICY.PUBLIC_SIGNUP_BLOCKED) {
    const partnerGuard = await validateSignupPartnerContext(
      session.referralCode,
      session.partnerId
    )
    
    if (!partnerGuard.allowed) {
      return {
        success: false,
        error: partnerGuard.error || 'Partner referral required to create a business platform',
        errorCode: partnerGuard.errorCode || 'PARTNER_REQUIRED',
      }
    }
    
    // Use validated partner ID
    if (partnerGuard.partnerId && !session.partnerId) {
      // Update session with partner ID from referral code
      await prisma.signupSession.update({
        where: { sessionToken: request.sessionToken },
        data: { partnerId: partnerGuard.partnerId }
      })
      session.partnerId = partnerGuard.partnerId
    }
  }
  
  // Validate required steps completed
  if (!session.stepsCompleted.includes('IDENTITY')) {
    return {
      success: false,
      error: 'Phone/email verification required',
      errorCode: 'IDENTITY_REQUIRED',
    }
  }
  
  if (!session.businessName) {
    return {
      success: false,
      error: 'Business name required',
      errorCode: 'BUSINESS_NAME_REQUIRED',
    }
  }
  
  try {
    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update user
      let user = await tx.user.findFirst({
        where: {
          OR: [
            session.phone ? { phone: session.phone } : {},
            session.email ? { email: session.email } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
      })
      
      if (!user) {
        user = await tx.user.create({
          data: {
            id: uuidv4(),
            phone: session.phone,
            email: session.email,
            name: request.name,
            phoneVerifiedAt: session.phone ? new Date() : undefined,
            emailVerifiedAt: session.email ? new Date() : undefined,
            globalRole: 'USER',
          },
        })
      } else {
        // Update existing user
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            name: request.name || user.name,
            phoneVerifiedAt: session.phone ? new Date() : user.phoneVerifiedAt,
            emailVerifiedAt: session.email ? new Date() : user.emailVerifiedAt,
          },
        })
      }
      
      // 2. Generate unique slug
      let baseSlug = generateSlug(session.businessName!)
      let slug = baseSlug
      let counter = 1
      
      while (await tx.tenant.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      
      // 3. Create tenant with ZERO capabilities
      const tenant = await tx.tenant.create({
        data: {
          id: uuidv4(),
          name: session.businessName!,
          slug,
          status: 'ACTIVE',
          appName: session.businessName!,
          // Store discovery choices as requested modules (advisory only)
          requestedModules: session.discoveryChoices,
          // NO activatedModules - starts with zero
          activatedModules: [],
        },
      })
      
      // 4. Create tenant membership (user is TENANT_ADMIN)
      await tx.tenantMembership.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          tenantId: tenant.id,
          role: 'TENANT_ADMIN',
          isActive: true,
        },
      })
      
      // 5. Create business profile
      await tx.businessProfile.create({
        data: {
          id: uuidv4(),
          tenantId: tenant.id,
          legalName: session.businessName,
          businessType: session.businessType,
          country: session.country,
          state: session.state,
          city: session.city,
          timezone: 'Africa/Lagos',
          currency: 'NGN',
        },
      })
      
      // 6. Store intent if marketing intent present
      if (session.marketingIntent) {
        await tx.userIntent.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            tenantId: tenant.id,
            intentKey: session.marketingIntent,
            intentDomain: 'COMMERCE',
            intentSource: session.marketingSource === 'PARTNER_LINK' ? 'PARTNER_LINK' : 'MARKETING_PAGE',
            referralCode: session.referralCode,
            isProcessed: false,
          },
        })
      }
      
      // 7. Create partner referral if applicable
      if (session.partnerId && session.referralCode) {
        const referralCode = await tx.partnerReferralCode.findUnique({
          where: { code: session.referralCode },
        })
        
        if (referralCode) {
          await tx.partnerReferral.create({
            data: {
              id: uuidv4(),
              partnerId: session.partnerId,
              tenantId: tenant.id,
              referralCodeId: referralCode.id,
              attributionMethod: 'REFERRAL_LINK',
              referralSource: 'signup',
            },
          })
          
          // Increment referral code usage
          await tx.partnerReferralCode.update({
            where: { id: referralCode.id },
            data: { usageCount: { increment: 1 } },
          })
        }
      }
      
      return { user, tenant }
    })
    
    // Update signup session as completed
    await prisma.signupSession.update({
      where: { sessionToken: request.sessionToken },
      data: {
        currentStep: 'COMPLETED',
        stepsCompleted: { push: 'COMPLETED' },
        userId: result.user.id,
        tenantId: result.tenant.id,
        completedAt: new Date(),
      },
    })
    
    return {
      success: true,
      userId: result.user.id,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
    }
    
  } catch (error) {
    console.error('Signup completion error:', error)
    return {
      success: false,
      error: 'Failed to complete signup. Please try again.',
      errorCode: 'SIGNUP_FAILED',
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Skip directly to a step (for resuming or testing)
 */
export async function skipToStep(sessionToken: string, step: SignupStep): Promise<{ success: boolean; error?: string }> {
  const session = await getSignupSession(sessionToken)
  if (!session) {
    return {
      success: false,
      error: 'Signup session expired',
    }
  }
  
  await prisma.signupSession.update({
    where: { sessionToken },
    data: { currentStep: step },
  })
  
  return { success: true }
}

/**
 * Get signup options for UI
 */
export function getSignupOptions() {
  return {
    userIntents: USER_INTENTS,
    businessTypes: BUSINESS_TYPES,
    discoveryOptions: DISCOVERY_OPTIONS,
    nigerianStates: NIGERIAN_STATES,
  }
}
