/**
 * STRUCTURED ERROR LOGGING SERVICE
 * 
 * Provides consistent error logging across the platform with:
 * - Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
 * - Structured metadata
 * - PII masking
 * - Grouping and deduplication
 * 
 * Part of: Platform Safety Hardening
 * Created: January 5, 2026
 */

// Severity levels
export type ErrorSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Error categories
export type ErrorCategory = 
  | 'AUTH'           // Authentication errors
  | 'DATABASE'       // Database/Prisma errors
  | 'API'            // API endpoint errors
  | 'VALIDATION'     // Input validation errors
  | 'BUSINESS'       // Business logic errors
  | 'INTEGRATION'    // External service errors
  | 'PERMISSION'     // Authorization errors
  | 'SYSTEM';        // System-level errors

// Structured error entry
export interface StructuredError {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  service: string;
  endpoint?: string;
  method?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string; // Only in development
  fingerprint: string; // For deduplication
}

// Error aggregation entry
export interface AggregatedError {
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  service: string;
  samples: StructuredError[];
}

// In-memory error buffer (production would use Redis/DB)
const errorBuffer: StructuredError[] = [];
const MAX_BUFFER_SIZE = 1000;

// PII patterns to mask
const PII_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b0[789]\d{9}\b/g, replacement: '[PHONE]' },
  { pattern: /\+234\d{10}/g, replacement: '[PHONE]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
  { pattern: /\b(?:password|passwd|pwd|secret|token|api_key|apikey)["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: '[REDACTED]' },
];

/**
 * Mask PII in a string
 */
function maskPII(text: string): string {
  let masked = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    masked = masked.replace(pattern, replacement);
  }
  return masked;
}

/**
 * Generate error fingerprint for deduplication
 */
function generateFingerprint(error: Partial<StructuredError>): string {
  const parts = [
    error.category || 'UNKNOWN',
    error.code || 'UNKNOWN',
    error.service || 'unknown',
    error.endpoint || '',
    error.method || '',
  ];
  return Buffer.from(parts.join('|')).toString('base64').substring(0, 16);
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Determine severity based on error characteristics
 */
function determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
  // Critical: System failures, database errors
  if (category === 'DATABASE' || category === 'SYSTEM') {
    return 'CRITICAL';
  }
  
  // High: Auth failures, permission denied
  if (category === 'AUTH' || category === 'PERMISSION') {
    return 'HIGH';
  }
  
  // Medium: API errors, business logic errors
  if (category === 'API' || category === 'BUSINESS') {
    return 'MEDIUM';
  }
  
  // Low: Validation errors
  return 'LOW';
}

/**
 * Map error to category based on error characteristics
 */
function categorizeError(error: Error, context?: string): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  if (name.includes('prisma') || message.includes('prisma') || message.includes('database')) {
    return 'DATABASE';
  }
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 'AUTH';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'PERMISSION';
  }
  if (message.includes('validation') || name === 'validationerror') {
    return 'VALIDATION';
  }
  if (context?.includes('/api/')) {
    return 'API';
  }
  
  return 'SYSTEM';
}

/**
 * Extract error code from error
 */
function extractErrorCode(error: any): string {
  if (error.code) return String(error.code);
  if (error.name) return error.name.toUpperCase().replace(/ERROR$/i, '');
  return 'UNKNOWN';
}

/**
 * Log a structured error
 */
export function logError(
  error: Error | string,
  options: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    service?: string;
    endpoint?: string;
    method?: string;
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  } = {}
): StructuredError {
  const errorObj = error instanceof Error ? error : new Error(error);
  const category = options.category || categorizeError(errorObj, options.endpoint);
  const severity = options.severity || determineSeverity(errorObj, category);
  
  const structuredError: StructuredError = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    severity,
    category,
    code: extractErrorCode(errorObj),
    message: maskPII(errorObj.message),
    service: options.service || 'unknown',
    endpoint: options.endpoint,
    method: options.method,
    tenantId: options.tenantId,
    userId: options.userId ? maskPII(options.userId) : undefined,
    metadata: options.metadata ? JSON.parse(maskPII(JSON.stringify(options.metadata))) : undefined,
    stackTrace: process.env.NODE_ENV === 'development' ? maskPII(errorObj.stack || '') : undefined,
    fingerprint: generateFingerprint({
      category,
      code: extractErrorCode(errorObj),
      service: options.service,
      endpoint: options.endpoint,
      method: options.method,
    }),
  };
  
  // Add to buffer
  errorBuffer.push(structuredError);
  
  // Maintain buffer size
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }
  
  // Log to console with appropriate level
  const logLevel = severity === 'CRITICAL' || severity === 'HIGH' ? 'error' : 'warn';
  console[logLevel](`[${severity}] ${structuredError.service} - ${structuredError.message}`, {
    id: structuredError.id,
    category: structuredError.category,
    code: structuredError.code,
  });
  
  return structuredError;
}

/**
 * Log API error with request context
 */
export function logApiError(
  error: Error | string,
  request: { url?: string; method?: string },
  options: {
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  } = {}
): StructuredError {
  const url = request.url || '';
  const endpoint = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  
  return logError(error, {
    category: 'API',
    service: 'API',
    endpoint,
    method: request.method,
    ...options,
  });
}

/**
 * Get recent errors
 */
export function getRecentErrors(
  options: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    service?: string;
    limit?: number;
    since?: Date;
  } = {}
): StructuredError[] {
  let filtered = [...errorBuffer];
  
  if (options.severity) {
    filtered = filtered.filter(e => e.severity === options.severity);
  }
  if (options.category) {
    filtered = filtered.filter(e => e.category === options.category);
  }
  if (options.service) {
    filtered = filtered.filter(e => e.service === options.service);
  }
  if (options.since) {
    const sinceTime = options.since.getTime();
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= sinceTime);
  }
  
  // Sort by timestamp descending
  filtered.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return filtered.slice(0, options.limit || 100);
}

/**
 * Get aggregated errors (grouped by fingerprint)
 */
export function getAggregatedErrors(
  options: {
    timeRange?: '1h' | '6h' | '24h' | '7d';
    limit?: number;
  } = {}
): AggregatedError[] {
  const now = Date.now();
  const timeRanges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  
  const rangeMs = timeRanges[options.timeRange || '24h'];
  const startTime = now - rangeMs;
  
  // Filter by time range
  const filtered = errorBuffer.filter(
    e => new Date(e.timestamp).getTime() >= startTime
  );
  
  // Group by fingerprint
  const grouped = new Map<string, AggregatedError>();
  
  for (const error of filtered) {
    const existing = grouped.get(error.fingerprint);
    
    if (existing) {
      existing.count++;
      if (error.timestamp > existing.lastSeen) {
        existing.lastSeen = error.timestamp;
      }
      if (error.timestamp < existing.firstSeen) {
        existing.firstSeen = error.timestamp;
      }
      if (existing.samples.length < 3) {
        existing.samples.push(error);
      }
    } else {
      grouped.set(error.fingerprint, {
        fingerprint: error.fingerprint,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        count: 1,
        severity: error.severity,
        category: error.category,
        code: error.code,
        message: error.message,
        service: error.service,
        samples: [error],
      });
    }
  }
  
  // Sort by count descending
  const aggregated = Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, options.limit || 50);
  
  return aggregated;
}

/**
 * Get error summary statistics
 */
export function getErrorSummary(
  timeRange: '1h' | '6h' | '24h' | '7d' = '24h'
): {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  byService: Record<string, number>;
  topErrors: AggregatedError[];
} {
  const aggregated = getAggregatedErrors({ timeRange });
  const errors = getRecentErrors({
    since: new Date(Date.now() - {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeRange]),
  });
  
  const bySeverity: Record<ErrorSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  
  const byCategory: Record<ErrorCategory, number> = {
    AUTH: 0,
    DATABASE: 0,
    API: 0,
    VALIDATION: 0,
    BUSINESS: 0,
    INTEGRATION: 0,
    PERMISSION: 0,
    SYSTEM: 0,
  };
  
  const byService: Record<string, number> = {};
  
  for (const error of errors) {
    bySeverity[error.severity]++;
    byCategory[error.category]++;
    byService[error.service] = (byService[error.service] || 0) + 1;
  }
  
  return {
    total: errors.length,
    bySeverity,
    byCategory,
    byService,
    topErrors: aggregated.slice(0, 10),
  };
}

/**
 * Clear error buffer (for testing)
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}

/**
 * Export error buffer size
 */
export function getErrorBufferSize(): number {
  return errorBuffer.length;
}
