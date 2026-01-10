/**
 * Unified Auth Login Route (FOUNDATION)
 * 
 * Single auth endpoint that handles ALL authentication modes:
 * - Password login (for users with passwords AND demo accounts)
 * - OTP login (phone/email)
 * - Magic link fallback
 * 
 * Demo accounts are NOT a fork - they authenticate through the same flow.
 * The only difference is that demo accounts always have password auth enabled.
 * 
 * @module api/auth/login
 * @foundation Phase 3.1
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { 
  identifyUser, 
  loginWithPassword, 
  detectIdentifierType,
  normalizeIdentifier 
} from '@/lib/auth/login-service'
import { DEMO_PASSWORD, isDemoTenant, DEMO_SUITES, PARTNER_CREDENTIALS } from '@/lib/demo/credentials'

// ============================================================================
// CONFIGURATION
// ============================================================================

const SESSION_EXPIRY_DAYS = 7
const DEMO_SESSION_EXPIRY_DAYS = 1 // Shorter for demo accounts

// ============================================================================
// DEMO ACCOUNT DETECTION (Foundation Logic)
// ============================================================================

/**
 * Check if an email belongs to a demo account
 * This is foundation logic - used for ALL users, not just demo mode
 */
function isDemoEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check partner demo accounts
  if (PARTNER_CREDENTIALS.some((c: any) => c.email.toLowerCase() === normalizedEmail)) {
    return true
  }
  
  // Check suite demo accounts
  for (const suite of DEMO_SUITES) {
    for (const tenant of suite.tenants) {
      if (tenant.credentials.some((c: any) => c.email.toLowerCase() === normalizedEmail)) {
        return true
      }
    }
  }
  
  // Pattern match: ends with .demo domain
  if (normalizedEmail.endsWith('.demo')) {
    return true
  }
  
  // Pattern match: demo. prefix at webwaka.com
  if (normalizedEmail.includes('demo.') && normalizedEmail.endsWith('@webwaka.com')) {
    return true
  }
  
  return false
}

/**
 * Get demo account metadata for role resolution
 */
function getDemoAccountMetadata(email: string): { 
  role: string; 
  tenantSlug: string | null;
  suiteName: string | null;
  isPartnerAccount: boolean;
} | null {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check partner accounts first
  const partnerCred = PARTNER_CREDENTIALS.find((c: any) => c.email.toLowerCase() === normalizedEmail)
  if (partnerCred) {
    return {
      role: partnerCred.role,
      tenantSlug: null,
      suiteName: null,
      isPartnerAccount: true
    }
  }
  
  // Check suite accounts
  for (const suite of DEMO_SUITES) {
    for (const tenant of suite.tenants) {
      const cred = tenant.credentials.find((c: any) => c.email.toLowerCase() === normalizedEmail)
      if (cred) {
        return {
          role: cred.role,
          tenantSlug: tenant.slug,
          suiteName: suite.name,
          isPartnerAccount: false
        }
      }
    }
  }
  
  return null
}

// ============================================================================
// UNIFIED LOGIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password,
      identifier,  // Alternative to email (can be phone)
      method = 'auto',  // 'password', 'otp', 'magic-link', 'auto'
      rememberDevice = false,
      tenantSlug
    } = body
    
    // Determine the login identifier
    const loginIdentifier = email || identifier
    
    if (!loginIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number is required' },
        { status: 400 }
      )
    }
    
    // Detect identifier type
    const identifierType = detectIdentifierType(loginIdentifier)
    const isEmailLogin = identifierType === 'email'
    const normalizedEmail = isEmailLogin ? loginIdentifier.toLowerCase().trim() : null
    
    // Check if this is a demo account
    const isDemoAccount = normalizedEmail ? isDemoEmail(normalizedEmail) : false
    const demoMetadata = isDemoAccount && normalizedEmail ? getDemoAccountMetadata(normalizedEmail) : null
    
    // ========================================================================
    // PASSWORD LOGIN PATH
    // Works for: Regular users with passwords + Demo accounts
    // ========================================================================
    
    if (password || (method === 'password') || (isDemoAccount && method === 'auto')) {
      // For demo accounts, use the master demo password
      const passwordToVerify = isDemoAccount ? DEMO_PASSWORD : password
      
      if (!passwordToVerify) {
        return NextResponse.json(
          { success: false, error: 'Password is required' },
          { status: 400 }
        )
      }
      
      // Demo accounts: Verify against master password, then find/create session
      if (isDemoAccount) {
        // Verify demo password
        if (password !== DEMO_PASSWORD) {
          return NextResponse.json(
            { success: false, error: 'Invalid demo password' },
            { status: 401 }
          )
        }
        
        // Find or conceptually "get" the demo user
        // In foundation architecture, demo users exist in the system
        // For now, create a demo session without requiring DB user
        const sessionToken = uuidv4()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + DEMO_SESSION_EXPIRY_DAYS)
        
        // Set session cookie
        const cookieStore = await cookies()
        cookieStore.set('session_token', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          expires: expiresAt
        })
        
        // Also set demo metadata cookie for client-side role context
        cookieStore.set('demo_session', JSON.stringify({
          email: normalizedEmail,
          role: demoMetadata?.role || 'Demo User',
          tenantSlug: demoMetadata?.tenantSlug || tenantSlug,
          suiteName: demoMetadata?.suiteName,
          isPartnerAccount: demoMetadata?.isPartnerAccount || false,
          isDemoMode: true,
          expiresAt: expiresAt.toISOString()
        }), {
          httpOnly: false,  // Readable by client for role context
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          expires: expiresAt
        })
        
        // Determine redirect URL based on account type
        let redirectUrl = '/dashboard?demo=true'
        if (demoMetadata?.tenantSlug) {
          // Suite-specific demo account
          const suiteRedirects: Record<string, string> = {
            'Commerce': '/commerce-demo',
            'Education': '/education-demo',
            'Health': '/health-demo',
            'Hospitality': '/hospitality-demo',
            'Civic / GovTech': '/civic-demo',
            'Logistics': '/logistics-demo',
            'Real Estate': '/real-estate-demo',
            'Recruitment': '/recruitment-demo',
            'Project Management': '/project-demo',
            'Legal Practice': '/legal-demo',
            'Warehouse': '/warehouse-demo',
            'ParkHub (Transport)': '/parkhub-demo',
            'Political': '/political-demo',
            'Church': '/church-demo',
          }
          redirectUrl = suiteRedirects[demoMetadata.suiteName || ''] || '/commerce-demo'
          redirectUrl += `?demo=true&role=${encodeURIComponent(demoMetadata.role)}`
        } else if (demoMetadata?.isPartnerAccount) {
          // Partner demo account
          redirectUrl = '/partners/dashboard?demo=true'
        }
        
        return NextResponse.json({
          success: true,
          message: 'Demo login successful',
          isDemoAccount: true,
          role: demoMetadata?.role || 'Demo User',
          tenantSlug: demoMetadata?.tenantSlug,
          redirectUrl,
          sessionToken
        })
      }
      
      // Regular password login for non-demo accounts
      // Uses existing login service
      if (!normalizedEmail) {
        return NextResponse.json(
          { success: false, error: 'Email is required for password login' },
          { status: 400 }
        )
      }
      
      const result = await loginWithPassword({
        identifier: normalizedEmail,
        password: passwordToVerify,
        rememberDevice,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error || 'Invalid credentials',
            attemptsRemaining: result.attemptsRemaining,
            isLocked: result.isLocked,
            lockedUntil: result.lockedUntil
          },
          { status: 401 }
        )
      }
      
      // Set session cookie for regular login
      if (result.sessionToken) {
        const cookieStore = await cookies()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (rememberDevice ? 30 : SESSION_EXPIRY_DAYS))
        
        cookieStore.set('session_token', result.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          expires: expiresAt
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        isDemoAccount: false,
        userId: result.userId,
        tenantSlug: result.tenantSlug,
        redirectUrl: result.tenantSlug ? `/${result.tenantSlug}/dashboard` : '/dashboard'
      })
    }
    
    // ========================================================================
    // OTP / MAGIC-LINK PATH (for non-password login)
    // ========================================================================
    
    // For demo accounts trying to use OTP, redirect them to password
    if (isDemoAccount && (method === 'otp' || method === 'magic-link')) {
      return NextResponse.json({
        success: false,
        error: 'Demo accounts use password authentication. Please use the demo password.',
        suggestedMethod: 'password',
        isDemoAccount: true
      }, { status: 400 })
    }
    
    // Identify user and available methods
    const identification = await identifyUser({
      identifier: loginIdentifier,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })
    
    if (!identification.success) {
      return NextResponse.json({
        success: false,
        error: identification.error || 'User not found',
        errorCode: identification.errorCode
      }, { status: identification.errorCode === 'USER_NOT_FOUND' ? 404 : 400 })
    }
    
    // Return available methods for the user to choose
    return NextResponse.json({
      success: true,
      action: 'choose_method',
      availableMethods: identification.availableMethods,
      recommendedMethod: identification.method,
      hasPassword: identification.hasPassword,
      maskedIdentifier: identification.maskedIdentifier,
      isDemoAccount: false
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Check auth status and available methods
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ 
      success: false, 
      error: 'Email parameter required' 
    }, { status: 400 })
  }
  
  const isDemoAccount = isDemoEmail(email)
  const demoMetadata = isDemoAccount ? getDemoAccountMetadata(email) : null
  
  // For demo accounts, password is always available
  if (isDemoAccount) {
    return NextResponse.json({
      success: true,
      isDemoAccount: true,
      availableMethods: ['password'],
      recommendedMethod: 'password',
      role: demoMetadata?.role,
      tenantSlug: demoMetadata?.tenantSlug,
      suiteName: demoMetadata?.suiteName
    })
  }
  
  // For regular accounts, check database
  const identification = await identifyUser({
    identifier: email,
  })
  
  return NextResponse.json({
    success: identification.success,
    isDemoAccount: false,
    availableMethods: identification.availableMethods,
    recommendedMethod: identification.method,
    hasPassword: identification.hasPassword,
    error: identification.error
  })
}
