/**
 * Security Middleware Utilities
 * Common security functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitHeaders, getRateLimitStats } from '@/lib/rate-limiter'
import { logRateLimitExceeded, logSecurityViolation } from '@/lib/audit-logger'

/**
 * Extract client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  // Check for real IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to connection info or default
  return request.headers.get('x-client-ip') || 'unknown'
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  tenantId?: string
): { allowed: boolean; response?: NextResponse } {
  const clientIp = getClientIdentifier(request)
  const path = new URL(request.url).pathname
  
  // Use tenant + IP for more granular limiting if tenant is known
  const identifier = tenantId ? `${tenantId}:${clientIp}` : clientIp
  
  const result = checkRateLimit(identifier, path)
  
  if (!result.allowed) {
    // Log rate limit exceeded
    logRateLimitExceeded(tenantId || 'unknown', path, clientIp)
    
    return {
      allowed: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            ...getRateLimitHeaders(result.remaining, result.resetTime),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }
  
  return { allowed: true }
}

/**
 * Validate tenant access
 */
export function validateTenantAccess(
  requestTenantId: string | null,
  resourceTenantId: string,
  request: NextRequest
): { valid: boolean; response?: NextResponse } {
  if (!requestTenantId) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
  }
  
  if (requestTenantId !== resourceTenantId) {
    // Log security violation
    logSecurityViolation(
      requestTenantId,
      'CROSS_TENANT_ACCESS',
      { 
        attemptedResource: resourceTenantId,
        path: new URL(request.url).pathname 
      },
      getClientIdentifier(request)
    )
    
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize input string to prevent injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return input
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000)
  }
  
  return sanitized
}

/**
 * Validate request body size
 */
export function validateBodySize(
  body: unknown,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): boolean {
  const size = JSON.stringify(body).length
  return size <= maxSizeBytes
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}

/**
 * Create error response with security headers
 */
export function createErrorResponse(
  error: string,
  status: number = 400
): NextResponse {
  const response = NextResponse.json(
    { success: false, error },
    { status }
  )
  return addSecurityHeaders(response)
}

/**
 * Create success response with security headers
 */
export function createSuccessResponse(
  data: unknown,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(
    { success: true, ...data as object },
    { status }
  )
  return addSecurityHeaders(response)
}

/**
 * Security check summary
 */
export interface SecurityCheckResult {
  passed: boolean
  checks: {
    rateLimit: boolean
    tenantAccess: boolean
    inputValidation: boolean
  }
  response?: NextResponse
}

/**
 * Run all security checks
 */
export function runSecurityChecks(
  request: NextRequest,
  tenantId: string | null,
  resourceTenantId?: string,
  body?: unknown
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    passed: true,
    checks: {
      rateLimit: true,
      tenantAccess: true,
      inputValidation: true
    }
  }

  // Rate limit check
  const rateLimitResult = applyRateLimit(request, tenantId || undefined)
  if (!rateLimitResult.allowed) {
    result.passed = false
    result.checks.rateLimit = false
    result.response = rateLimitResult.response
    return result
  }

  // Tenant access check (if resource tenant provided)
  if (resourceTenantId) {
    const tenantResult = validateTenantAccess(tenantId, resourceTenantId, request)
    if (!tenantResult.valid) {
      result.passed = false
      result.checks.tenantAccess = false
      result.response = tenantResult.response
      return result
    }
  }

  // Body size check
  if (body && !validateBodySize(body)) {
    result.passed = false
    result.checks.inputValidation = false
    result.response = createErrorResponse('Request body too large', 413)
    return result
  }

  return result
}
