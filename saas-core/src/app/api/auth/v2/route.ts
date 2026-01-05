/**
 * Auth API v2 - Identity Entry Layer
 * 
 * All authentication endpoints for Nigeria-first signup/login.
 * 
 * POST actions:
 * - identify: Detect login method from phone/email
 * - login-otp: Start OTP login
 * - login-otp-verify: Verify OTP and complete login
 * - login-password: Password login
 * - signup-start: Start signup flow
 * - signup-otp-verify: Verify signup OTP
 * - signup-intent: Set user intent
 * - signup-business: Set business basics
 * - signup-discovery: Set discovery choices
 * - signup-complete: Complete signup
 * - password-set: Set/change password
 * - password-reset: Initiate password reset
 * - password-reset-verify: Complete password reset
 * - otp-resend: Resend OTP
 * - session-revoke: Revoke a session
 * 
 * GET actions:
 * - signup-options: Get signup form options
 * - signup-session: Get signup session state
 * - user-sessions: Get user's active sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  identifyUser,
  loginWithOtp,
  verifyLoginOtp,
  loginWithPassword,
  setPassword,
  initiatePasswordReset,
  verifyPasswordReset,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
} from '@/lib/auth/login-service'
import {
  startSignup,
  verifySignupOtp,
  setUserIntent,
  setBusinessBasics,
  setDiscoveryChoices,
  completeSignup,
  getSignupSession,
  getSignupOptions,
} from '@/lib/auth/signup-service'
import { resendOtp } from '@/lib/auth/otp-service'
import { getCurrentSession, setSessionCookie } from '@/lib/auth'

// ============================================================================
// HELPERS
// ============================================================================

function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || undefined
  const userAgent = request.headers.get('user-agent') || undefined
  
  return { ipAddress, userAgent }
}

function jsonResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status })
}

function errorResponse(error: string, errorCode: string, status: number = 400) {
  return NextResponse.json({ success: false, error, errorCode }, { status })
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    switch (action) {
      case 'signup-options': {
        const options = getSignupOptions()
        return jsonResponse({ success: true, ...options })
      }
      
      case 'signup-session': {
        const sessionToken = searchParams.get('sessionToken')
        if (!sessionToken) {
          return errorResponse('Session token required', 'MISSING_SESSION_TOKEN')
        }
        
        const session = await getSignupSession(sessionToken)
        if (!session) {
          return errorResponse('Session not found or expired', 'SESSION_NOT_FOUND', 404)
        }
        
        return jsonResponse({ success: true, session })
      }
      
      case 'user-sessions': {
        const authSession = await getCurrentSession()
        if (!authSession) {
          return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
        }
        
        const sessions = await getUserSessions(authSession.user.id)
        return jsonResponse({ success: true, sessions, currentSessionId: authSession.sessionId })
      }
      
      default:
        return errorResponse('Unknown action', 'UNKNOWN_ACTION')
    }
  } catch (error) {
    console.error('Auth API GET error:', error)
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const body = await request.json()
  const action = body.action
  const clientInfo = getClientInfo(request)
  
  try {
    switch (action) {
      // ======================================================================
      // LOGIN ENDPOINTS
      // ======================================================================
      
      case 'identify': {
        const result = await identifyUser({
          identifier: body.identifier,
          ...clientInfo,
          deviceFingerprint: body.deviceFingerprint,
        })
        return jsonResponse(result)
      }
      
      case 'login-otp': {
        const result = await loginWithOtp({
          identifier: body.identifier,
          ...clientInfo,
          deviceFingerprint: body.deviceFingerprint,
          rememberDevice: body.rememberDevice,
        })
        return jsonResponse(result)
      }
      
      case 'login-otp-verify': {
        const result = await verifyLoginOtp({
          otpId: body.otpId,
          code: body.code,
          identifier: body.identifier,
          rememberDevice: body.rememberDevice,
          ...clientInfo,
          deviceFingerprint: body.deviceFingerprint,
        })
        
        if (result.success && result.sessionToken) {
          await setSessionCookie(result.sessionToken)
        }
        
        return jsonResponse(result)
      }
      
      case 'login-password': {
        const result = await loginWithPassword({
          identifier: body.identifier,
          password: body.password,
          rememberDevice: body.rememberDevice,
          ...clientInfo,
          deviceFingerprint: body.deviceFingerprint,
        })
        
        if (result.success && result.sessionToken) {
          await setSessionCookie(result.sessionToken)
        }
        
        return jsonResponse(result)
      }
      
      // ======================================================================
      // SIGNUP ENDPOINTS
      // ======================================================================
      
      case 'signup-start': {
        const result = await startSignup({
          phone: body.phone,
          email: body.email,
          referralCode: body.referralCode,
          marketingIntent: body.intent,
          marketingSource: body.source,
          ...clientInfo,
          deviceFingerprint: body.deviceFingerprint,
        })
        return jsonResponse(result)
      }
      
      case 'signup-otp-verify': {
        const result = await verifySignupOtp({
          sessionToken: body.sessionToken,
          otpId: body.otpId,
          code: body.code,
          ...clientInfo,
        })
        return jsonResponse(result)
      }
      
      case 'signup-intent': {
        const result = await setUserIntent({
          sessionToken: body.sessionToken,
          intent: body.intent,
        })
        return jsonResponse(result)
      }
      
      case 'signup-business': {
        const result = await setBusinessBasics({
          sessionToken: body.sessionToken,
          businessName: body.businessName,
          businessType: body.businessType,
          country: body.country,
          state: body.state,
          city: body.city,
        })
        return jsonResponse(result)
      }
      
      case 'signup-discovery': {
        const result = await setDiscoveryChoices({
          sessionToken: body.sessionToken,
          choices: body.choices,
        })
        return jsonResponse(result)
      }
      
      case 'signup-complete': {
        const result = await completeSignup({
          sessionToken: body.sessionToken,
          name: body.name,
        })
        return jsonResponse(result)
      }
      
      // ======================================================================
      // PASSWORD ENDPOINTS
      // ======================================================================
      
      case 'password-set': {
        const authSession = await getCurrentSession()
        if (!authSession) {
          return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
        }
        
        const result = await setPassword({
          userId: authSession.user.id,
          newPassword: body.newPassword,
          currentPassword: body.currentPassword,
        })
        return jsonResponse(result)
      }
      
      case 'password-reset': {
        const result = await initiatePasswordReset({
          identifier: body.identifier,
          ...clientInfo,
        })
        return jsonResponse(result)
      }
      
      case 'password-reset-verify': {
        const result = await verifyPasswordReset({
          otpId: body.otpId,
          code: body.code,
          newPassword: body.newPassword,
          identifier: body.identifier,
          ...clientInfo,
        })
        return jsonResponse(result)
      }
      
      // ======================================================================
      // OTP ENDPOINTS
      // ======================================================================
      
      case 'otp-resend': {
        const result = await resendOtp({
          otpId: body.otpId,
          channel: body.channel,
          ...clientInfo,
        })
        return jsonResponse(result)
      }
      
      // ======================================================================
      // SESSION ENDPOINTS
      // ======================================================================
      
      case 'session-revoke': {
        const authSession = await getCurrentSession()
        if (!authSession) {
          return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
        }
        
        const success = await revokeSession(body.sessionId, authSession.user.id)
        return jsonResponse({ success })
      }
      
      case 'session-revoke-others': {
        const authSession = await getCurrentSession()
        if (!authSession) {
          return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
        }
        
        const count = await revokeOtherSessions(authSession.user.id, authSession.sessionId)
        return jsonResponse({ success: true, revokedCount: count })
      }
      
      default:
        return errorResponse('Unknown action', 'UNKNOWN_ACTION')
    }
  } catch (error) {
    console.error('Auth API POST error:', error)
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
