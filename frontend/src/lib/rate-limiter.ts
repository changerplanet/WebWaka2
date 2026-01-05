/**
 * Rate Limiting Middleware
 * In-memory rate limiter with configurable limits per endpoint
 */

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  message?: string      // Custom error message
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configurations by endpoint pattern
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Auth endpoints - stricter limits
  '/api/auth': {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // Write operations - moderate limits
  '/api/wallets': {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 60,
    message: 'Too many wallet operations. Please slow down.'
  },
  
  '/api/svm/cart': {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 100,
    message: 'Too many cart operations. Please slow down.'
  },
  
  '/api/svm/orders': {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 30,
    message: 'Too many order operations. Please slow down.'
  },
  
  // Read operations - higher limits
  'default': {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 200,
    message: 'Too many requests. Please slow down.'
  }
}

/**
 * Get rate limit config for a path
 */
function getConfigForPath(path: string): RateLimitConfig {
  for (const [pattern, config] of Object.entries(rateLimitConfigs)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      return config
    }
  }
  return rateLimitConfigs.default
}

/**
 * Generate rate limit key from request
 */
function getRateLimitKey(
  identifier: string,
  path: string
): string {
  // Normalize path (remove dynamic segments)
  const normalizedPath = path.replace(/\/[a-zA-Z0-9_-]{20,}(?=\/|$)/g, '/:id')
  return `ratelimit:${identifier}:${normalizedPath}`
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  identifier: string,  // IP address or user ID
  path: string
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const config = getConfigForPath(path)
  const key = getRateLimitKey(identifier, path)
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    cleanupExpiredEntries()
  }

  // Check if window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const allowed = entry.count <= config.maxRequests

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    message: allowed ? undefined : config.message
  }
}

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Reset rate limit for testing
 */
export function resetRateLimit(identifier: string, path: string): void {
  const key = getRateLimitKey(identifier, path)
  rateLimitStore.delete(key)
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number = 200
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
  }
}

/**
 * Rate limit stats for monitoring
 */
export function getRateLimitStats(): {
  totalKeys: number
  activeKeys: number
} {
  const now = Date.now()
  let activeKeys = 0
  
  for (const entry of rateLimitStore.values()) {
    if (now < entry.resetTime) {
      activeKeys++
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    activeKeys
  }
}
