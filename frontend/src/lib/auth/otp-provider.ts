/**
 * OTP Provider Abstraction Layer
 * 
 * Clean interface for OTP delivery with multiple provider support.
 * Nigeria-first design with easy switching between providers:
 * - Mock (development)
 * - Termii (Nigeria primary)
 * - Africa's Talking (East Africa)
 * - Twilio (Global fallback)
 * 
 * Provider selection is via environment variable: OTP_PROVIDER
 */

import { OtpChannel, OtpPurpose } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface OtpSendRequest {
  recipient: string      // Phone number or email
  code: string           // OTP code to send
  channel: OtpChannel    // SMS, VOICE, EMAIL, WHATSAPP
  purpose: OtpPurpose    // LOGIN, SIGNUP, PASSWORD_RESET, etc.
  language?: string      // Language code (default: 'en')
}

export interface OtpSendResult {
  success: boolean
  messageId?: string     // Provider's message ID
  provider: string       // Provider name for tracking
  error?: string         // Error message if failed
  errorCode?: string     // Error code for handling
  deliveryStatus?: string // 'sent', 'queued', 'failed'
}

export interface OtpProviderConfig {
  name: string
  apiKey?: string
  apiSecret?: string
  senderId?: string
  baseUrl?: string
  timeout?: number
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface IOtpProvider {
  name: string
  
  /**
   * Send OTP via SMS
   */
  sendSms(request: OtpSendRequest): Promise<OtpSendResult>
  
  /**
   * Send OTP via Voice call
   */
  sendVoice(request: OtpSendRequest): Promise<OtpSendResult>
  
  /**
   * Send OTP via Email
   */
  sendEmail(request: OtpSendRequest): Promise<OtpSendResult>
  
  /**
   * Send OTP via WhatsApp (if supported)
   */
  sendWhatsApp?(request: OtpSendRequest): Promise<OtpSendResult>
  
  /**
   * Check if provider supports a channel
   */
  supportsChannel(channel: OtpChannel): boolean
  
  /**
   * Get delivery status (if supported)
   */
  getDeliveryStatus?(messageId: string): Promise<{ status: string; updatedAt: Date }>
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

const MESSAGE_TEMPLATES: Record<OtpPurpose, { en: string; pidgin?: string }> = {
  LOGIN: {
    en: 'Your WebWaka login code is: {code}. Valid for 5 minutes. Do not share.',
    pidgin: 'Your WebWaka login code na: {code}. E go expire for 5 minutes. No tell anybody.',
  },
  SIGNUP: {
    en: 'Welcome to WebWaka! Your verification code is: {code}. Valid for 5 minutes.',
    pidgin: 'Welcome to WebWaka! Your code na: {code}. E go expire for 5 minutes.',
  },
  PASSWORD_RESET: {
    en: 'Your WebWaka password reset code is: {code}. Valid for 5 minutes. If you did not request this, ignore.',
  },
  PHONE_VERIFY: {
    en: 'Your WebWaka phone verification code is: {code}. Valid for 5 minutes.',
  },
  EMAIL_VERIFY: {
    en: 'Your WebWaka email verification code is: {code}. Valid for 5 minutes.',
  },
}

function formatMessage(purpose: OtpPurpose, code: string, language: string = 'en'): string {
  const template = MESSAGE_TEMPLATES[purpose]
  const msg = (language === 'pidgin' && template.pidgin) ? template.pidgin : template.en
  return msg.replace('{code}', code)
}

// ============================================================================
// MOCK PROVIDER (Development & Testing)
// ============================================================================

// ============================================================================
// DEBUG OTP LOGGING (for external reviewers in preview environment)
// ============================================================================

/**
 * Log OTP to the debug endpoint for external reviewer visibility
 * This is only active in non-production environments
 */
async function logOtpForDebug(identifier: string, code: string, type: string, expiresAt: Date) {
  // Only in development/preview - skip in production
  if (process.env.NODE_ENV === 'production') return
  
  try {
    // Store in global debug log (in-memory for same process)
    if (typeof global !== 'undefined') {
      if (!global.__debugOtpLogs) {
        global.__debugOtpLogs = []
      }
      
      global.__debugOtpLogs.push({
        identifier,
        code,
        type,
        createdAt: new Date(),
        expiresAt
      })
      
      // Keep only last 50 entries
      if (global.__debugOtpLogs.length > 50) {
        global.__debugOtpLogs = global.__debugOtpLogs.slice(-50)
      }
      
      // Clean up expired entries
      const now = new Date()
      global.__debugOtpLogs = global.__debugOtpLogs.filter(
        (entry: { expiresAt: Date }) => entry.expiresAt > now
      )
    }
    
    console.log('='.repeat(60))
    console.log('🔐 DEBUG OTP - FOR TESTING ONLY')
    console.log('='.repeat(60))
    console.log(`📱 Recipient: ${identifier}`)
    console.log(`🔢 Code: ${code}`)
    console.log(`📋 Type: ${type}`)
    console.log(`⏰ Expires: ${expiresAt.toISOString()}`)
    console.log('='.repeat(60))
    console.log('ℹ️  View all OTPs at: /api/debug/otp-logs')
    console.log('='.repeat(60))
  } catch (err) {
    console.error('Failed to log OTP for debug:', err)
  }
}

// Declare global type for OTP logs
declare global {
  var __debugOtpLogs: Array<{
    identifier: string
    code: string
    type: string
    createdAt: Date
    expiresAt: Date
  }>
}

export class MockOtpProvider implements IOtpProvider {
  name = 'mock'
  
  // Store sent OTPs for verification in tests
  private sentOtps: Map<string, { code: string; timestamp: Date }> = new Map()
  
  async sendSms(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    // Store for verification
    this.sentOtps.set(request.recipient, { code: request.code, timestamp: new Date() })
    
    // Log to console in development
    console.log(`[MOCK OTP] SMS to ${request.recipient}: ${message}`)
    console.log(`[MOCK OTP] Code: ${request.code}`)
    
    // Log to debug endpoint for external reviewers
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    await logOtpForDebug(request.recipient, request.code, `SMS_${request.purpose}`, expiresAt)
    
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock',
      deliveryStatus: 'sent',
    }
  }
  
  async sendVoice(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    this.sentOtps.set(request.recipient, { code: request.code, timestamp: new Date() })
    
    console.log(`[MOCK OTP] VOICE to ${request.recipient}: ${message}`)
    console.log(`[MOCK OTP] Code: ${request.code}`)
    
    // Log to debug endpoint for external reviewers
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await logOtpForDebug(request.recipient, request.code, `VOICE_${request.purpose}`, expiresAt)
    
    return {
      success: true,
      messageId: `mock_voice_${Date.now()}`,
      provider: 'mock',
      deliveryStatus: 'sent',
    }
  }
  
  async sendEmail(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    this.sentOtps.set(request.recipient, { code: request.code, timestamp: new Date() })
    
    console.log(`[MOCK OTP] EMAIL to ${request.recipient}:`)
    console.log(`  Subject: WebWaka Verification Code`)
    console.log(`  Body: ${message}`)
    console.log(`[MOCK OTP] Code: ${request.code}`)
    
    // Log to debug endpoint for external reviewers
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await logOtpForDebug(request.recipient, request.code, `EMAIL_${request.purpose}`, expiresAt)
    
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
      provider: 'mock',
      deliveryStatus: 'sent',
    }
  }
  
  async sendWhatsApp(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    this.sentOtps.set(request.recipient, { code: request.code, timestamp: new Date() })
    
    console.log(`[MOCK OTP] WHATSAPP to ${request.recipient}: ${message}`)
    console.log(`[MOCK OTP] Code: ${request.code}`)
    
    // Log to debug endpoint for external reviewers
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await logOtpForDebug(request.recipient, request.code, `WHATSAPP_${request.purpose}`, expiresAt)
    
    return {
      success: true,
      messageId: `mock_wa_${Date.now()}`,
      provider: 'mock',
      deliveryStatus: 'sent',
    }
  }
  
  supportsChannel(channel: OtpChannel): boolean {
    return true // Mock supports all channels
  }
  
  // Helper for tests
  getLastSentOtp(recipient: string): { code: string; timestamp: Date } | undefined {
    return this.sentOtps.get(recipient)
  }
}

// ============================================================================
// TERMII OTP PROVIDER (Nigeria-first Production Provider)
// ============================================================================

export class TermiiOtpProvider implements IOtpProvider {
  name = 'termii'
  
  private apiKey: string
  private baseUrl: string
  private senderId: string
  
  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || ''
    this.baseUrl = process.env.TERMII_BASE_URL || 'https://api.ng.termii.com'
    this.senderId = process.env.TERMII_SENDER_ID || 'WebWaka'
    
    if (!this.apiKey) {
      console.warn('[TERMII] API key not configured - OTP delivery will fail')
    }
  }
  
  async sendSms(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    try {
      const payload = {
        api_key: this.apiKey,
        to: request.recipient,
        from: this.senderId,
        sms: message,
        type: 'plain',
        channel: 'dnd', // DND route for transactional OTPs (Nigeria)
      }
      
      const response = await fetch(`${this.baseUrl}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (response.ok && data.message_id) {
        console.log(`[TERMII] SMS sent to ${request.recipient}, messageId: ${data.message_id}`)
        return {
          success: true,
          messageId: data.message_id,
          provider: 'termii',
          deliveryStatus: 'sent',
        }
      } else {
        console.error(`[TERMII] SMS failed: ${data.message || 'Unknown error'}`)
        return {
          success: false,
          provider: 'termii',
          error: data.message || 'SMS delivery failed',
          errorCode: String(response.status),
          deliveryStatus: 'failed',
        }
      }
    } catch (error) {
      console.error('[TERMII] SMS error:', error)
      return {
        success: false,
        provider: 'termii',
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
        deliveryStatus: 'failed',
      }
    }
  }
  
  async sendVoice(request: OtpSendRequest): Promise<OtpSendResult> {
    try {
      const payload = {
        api_key: this.apiKey,
        phone_number: request.recipient,
        code: request.code,
      }
      
      const response = await fetch(`${this.baseUrl}/api/sms/otp/send/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (response.ok && data.pinId) {
        console.log(`[TERMII] Voice OTP sent to ${request.recipient}`)
        return {
          success: true,
          messageId: data.pinId,
          provider: 'termii_voice',
          deliveryStatus: 'sent',
        }
      } else {
        return {
          success: false,
          provider: 'termii_voice',
          error: data.message || 'Voice delivery failed',
          errorCode: String(response.status),
          deliveryStatus: 'failed',
        }
      }
    } catch (error) {
      console.error('[TERMII] Voice error:', error)
      return {
        success: false,
        provider: 'termii_voice',
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
        deliveryStatus: 'failed',
      }
    }
  }
  
  async sendEmail(request: OtpSendRequest): Promise<OtpSendResult> {
    // Termii doesn't provide email OTP - fall back to mock for email
    const message = formatMessage(request.purpose, request.code, request.language)
    console.log(`[TERMII] Email not supported, logging OTP for: ${request.recipient}`)
    console.log(`  Code: ${request.code}`)
    
    return {
      success: true,
      messageId: `termii_email_fallback_${Date.now()}`,
      provider: 'termii_email_fallback',
      deliveryStatus: 'sent',
    }
  }
  
  async sendWhatsApp(request: OtpSendRequest): Promise<OtpSendResult> {
    const message = formatMessage(request.purpose, request.code, request.language)
    
    try {
      const payload = {
        api_key: this.apiKey,
        to: request.recipient,
        from: this.senderId,
        message: message,
        type: 'plain',
        channel: 'whatsapp',
      }
      
      const response = await fetch(`${this.baseUrl}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (response.ok && data.message_id) {
        console.log(`[TERMII] WhatsApp sent to ${request.recipient}`)
        return {
          success: true,
          messageId: data.message_id,
          provider: 'termii_whatsapp',
          deliveryStatus: 'sent',
        }
      } else {
        return {
          success: false,
          provider: 'termii_whatsapp',
          error: data.message || 'WhatsApp delivery failed',
          errorCode: String(response.status),
          deliveryStatus: 'failed',
        }
      }
    } catch (error) {
      console.error('[TERMII] WhatsApp error:', error)
      return {
        success: false,
        provider: 'termii_whatsapp',
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
        deliveryStatus: 'failed',
      }
    }
  }
  
  supportsChannel(channel: OtpChannel): boolean {
    // Termii supports SMS, Voice, and WhatsApp for Nigeria
    return ['SMS', 'VOICE', 'WHATSAPP'].includes(channel)
  }
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

let providerInstance: IOtpProvider | null = null

export function getOtpProvider(): IOtpProvider {
  if (providerInstance) return providerInstance
  
  const providerName = process.env.OTP_PROVIDER || 'mock'
  
  switch (providerName.toLowerCase()) {
    case 'mock':
      providerInstance = new MockOtpProvider()
      break
    
    case 'termii':
      providerInstance = new TermiiOtpProvider()
      break
    
    // Future providers:
    // case 'twilio':
    //   providerInstance = new TwilioOtpProvider()
    //   break
    
    default:
      console.warn(`Unknown OTP provider: ${providerName}, falling back to mock`)
      providerInstance = new MockOtpProvider()
  }
  
  return providerInstance
}

/**
 * Reset provider instance (for testing)
 */
export function resetOtpProvider(): void {
  providerInstance = null
}

// ============================================================================
// HIGH-LEVEL SEND FUNCTION
// ============================================================================

export async function sendOtp(request: OtpSendRequest): Promise<OtpSendResult> {
  const provider = getOtpProvider()
  
  // Check channel support
  if (!provider.supportsChannel(request.channel)) {
    return {
      success: false,
      provider: provider.name,
      error: `Channel ${request.channel} not supported by provider ${provider.name}`,
      errorCode: 'CHANNEL_NOT_SUPPORTED',
    }
  }
  
  // Route to appropriate method based on channel
  switch (request.channel) {
    case 'SMS':
      return provider.sendSms(request)
    case 'VOICE':
      return provider.sendVoice(request)
    case 'EMAIL':
      return provider.sendEmail(request)
    case 'WHATSAPP':
      if (provider.sendWhatsApp) {
        return provider.sendWhatsApp(request)
      }
      return {
        success: false,
        provider: provider.name,
        error: 'WhatsApp not supported by this provider',
        errorCode: 'WHATSAPP_NOT_SUPPORTED',
      }
    default:
      return {
        success: false,
        provider: provider.name,
        error: `Unknown channel: ${request.channel}`,
        errorCode: 'UNKNOWN_CHANNEL',
      }
  }
}

// ============================================================================
// PHONE NUMBER UTILITIES (Nigeria-first)
// ============================================================================

/**
 * Normalize phone number to E.164 format
 * Handles Nigerian phone formats: 0803..., +234803..., 234803...
 */
export function normalizePhoneNumber(phone: string, defaultCountry: string = 'NG'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle Nigerian numbers
  if (defaultCountry === 'NG') {
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }
    
    // If starts with 0, replace with 234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1)
    }
    
    // If doesn't start with country code, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned
    }
    
    // Add + prefix
    return '+' + cleaned
  }
  
  // For other countries, just ensure + prefix
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned
  }
  
  return cleaned
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone, 'NG')
  // Nigerian mobile numbers: +234 followed by 10 digits starting with 7, 8, or 9
  return /^\+234[789]\d{9}$/.test(normalized)
}

/**
 * Mask phone number for display
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone)
  if (normalized.length < 8) return phone
  return normalized.substring(0, 4) + '****' + normalized.substring(normalized.length - 4)
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length > 2 
    ? local.substring(0, 2) + '***' 
    : local.substring(0, 1) + '***'
  return maskedLocal + '@' + domain
}
