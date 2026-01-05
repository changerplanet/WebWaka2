/**
 * Auth Module - Identity Entry Layer v2
 * 
 * Nigeria-first authentication with:
 * - Phone + OTP (PRIMARY)
 * - Email + OTP (SECONDARY)
 * - Password (OPTIONAL)
 * - Magic Link (LEGACY)
 * 
 * Exports all auth services for API routes.
 */

// OTP Provider
export {
  sendOtp,
  getOtpProvider,
  normalizePhoneNumber,
  isValidNigerianPhone,
  maskPhoneNumber,
  maskEmail,
  type IOtpProvider,
  type OtpSendRequest,
  type OtpSendResult,
} from './otp-provider'

// OTP Service
export {
  createOtp,
  verifyOtp,
  resendOtp,
  cleanupExpiredOtps,
  type CreateOtpRequest,
  type CreateOtpResult,
  type VerifyOtpRequest,
  type VerifyOtpResult,
  type ResendOtpRequest,
} from './otp-service'

// Signup Service
export {
  startSignup,
  verifySignupOtp,
  setUserIntent,
  setBusinessBasics,
  setDiscoveryChoices,
  completeSignup,
  getSignupSession,
  getSignupOptions,
  skipToStep,
  USER_INTENTS,
  BUSINESS_TYPES,
  DISCOVERY_OPTIONS,
  NIGERIAN_STATES,
  type StartSignupRequest,
  type StartSignupResult,
  type VerifySignupOtpRequest,
  type SetUserIntentRequest,
  type SetBusinessBasicsRequest,
  type SetDiscoveryChoicesRequest,
  type CompleteSignupRequest,
  type CompleteSignupResult,
  type SignupSessionState,
} from './signup-service'

// Login Service
export {
  identifyUser,
  loginWithOtp,
  verifyLoginOtp,
  loginWithPassword,
  setPassword,
  initiatePasswordReset,
  verifyPasswordReset,
  detectIdentifierType,
  normalizeIdentifier,
  isDeviceRemembered,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  type LoginMethod,
  type LoginIdentifyRequest,
  type LoginIdentifyResult,
  type LoginWithOtpRequest,
  type LoginWithOtpResult,
  type VerifyLoginOtpRequest,
  type LoginWithPasswordRequest,
  type LoginResult,
  type SetPasswordRequest,
  type ResetPasswordRequest,
  type ResetPasswordVerifyRequest,
} from './login-service'

// Re-export legacy auth for backward compatibility
// Note: Import from the original auth.ts file
export * from '../auth'
