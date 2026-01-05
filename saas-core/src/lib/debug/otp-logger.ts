/**
 * DEBUG OTP LOGGER UTILITY
 * 
 * ⚠️ WARNING: This is for DEVELOPMENT/TESTING ONLY
 * MUST be disabled in production
 */

// Store recent OTPs in memory (last 10 minutes)
interface OtpLogEntry {
  identifier: string
  code: string
  type: string
  createdAt: Date
  expiresAt: Date
}

// Global in-memory store for debug OTPs
declare global {
  var __debugOtpLogs: OtpLogEntry[]
}

if (!global.__debugOtpLogs) {
  global.__debugOtpLogs = []
}

/**
 * Add OTP to debug log (called from OTP service)
 * Only works in development/preview environments
 */
export function logOtpForDebug(identifier: string, code: string, type: string, expiresAt: Date) {
  // Only in development/preview
  if (process.env.NODE_ENV === 'production') return
  
  // Add to log
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
    entry => entry.expiresAt > now
  )
}

/**
 * Get all debug OTP logs
 */
export function getDebugOtpLogs(): OtpLogEntry[] {
  // Clean up expired entries
  const now = new Date()
  global.__debugOtpLogs = global.__debugOtpLogs.filter(
    entry => entry.expiresAt > now
  )
  return global.__debugOtpLogs
}

/**
 * Get debug OTP logs filtered by identifier
 */
export function getDebugOtpLogsForIdentifier(identifier: string): OtpLogEntry[] {
  return getDebugOtpLogs().filter(entry => 
    entry.identifier.includes(identifier) || 
    identifier.includes(entry.identifier)
  )
}
