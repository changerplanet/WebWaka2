/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Outbound API Connector Service
 * 
 * Handles secure outbound API calls to integrated services.
 * Features:
 * - Token refresh management
 * - Failure retries with exponential backoff
 * - Tenant-level isolation
 * - Resilient for unreliable internet (Nigeria-first)
 */

import { IntegrationInstanceStatus } from '@prisma/client'
import { getDecryptedCredentials } from './instance-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'

interface ApiCallOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: any
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  timeout?: number
  retries?: number
}

interface ApiCallResult {
  success: boolean
  status?: number
  data?: any
  error?: string
  retryCount: number
  durationMs: number
}

/**
 * Make an API call through an integration instance
 */
export async function makeApiCall(
  instanceId: string,
  options: ApiCallOptions
): Promise<ApiCallResult> {
  const startTime = Date.now()
  let retryCount = 0
  const maxRetries = options.retries ?? 3
  
  const instance = await prisma.integration_instances.findUnique({
    where: { id: instanceId },
    include: { integration_providers: true },
  })
  
  if (!instance) {
    return {
      success: false,
      error: 'Integration instance not found',
      retryCount: 0,
      durationMs: Date.now() - startTime,
    }
  }
  
  if (instance.status !== IntegrationInstanceStatus.ACTIVE) {
    return {
      success: false,
      error: `Integration is not active (status: ${instance.status})`,
      retryCount: 0,
      durationMs: Date.now() - startTime,
    }
  }
  
  // Get credentials
  const credentials = await getDecryptedCredentials(instanceId)
  
  // Build URL
  const baseUrl = instance.integration_providers.apiBaseUrl || ''
  let url = `${baseUrl}${options.path}`
  
  if (options.queryParams) {
    const params = new URLSearchParams(options.queryParams)
    url += `?${params.toString()}`
  }
  
  // Build headers with authentication
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(instance.integration_providers.key, credentials),
    ...options.headers,
  }
  
  // Make the request with retries
  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 30000
      )
      
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const durationMs = Date.now() - startTime
      
      let data: any
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
      
      // Log the API call
      await logApiCall(instance.tenantId, instanceId, {
        method: options.method,
        url,
        requestBody: options.body,
        responseStatus: response.status,
        responseBody: data,
        success: response.ok,
        durationMs,
        retryCount,
      })
      
      if (response.ok) {
        return {
          success: true,
          status: response.status,
          data,
          retryCount,
          durationMs,
        }
      }
      
      // Handle specific error codes
      if (response.status === 401) {
        // Try token refresh for supported providers
        const refreshed = await tryTokenRefresh(instanceId, instance.integration_providers.key, credentials)
        if (refreshed && retryCount < maxRetries) {
          retryCount++
          continue
        }
      }
      
      // Don't retry for client errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return {
          success: false,
          status: response.status,
          data,
          error: `API error: ${response.status} ${response.statusText}`,
          retryCount,
          durationMs,
        }
      }
      
      // Retry for server errors and rate limits
      retryCount++
      if (retryCount <= maxRetries) {
        await delay(getRetryDelay(retryCount))
      }
    } catch (error) {
      const durationMs = Date.now() - startTime
      
      // Log the error
      await logApiCall(instance.tenantId, instanceId, {
        method: options.method,
        url,
        requestBody: options.body,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
        retryCount,
      })
      
      retryCount++
      if (retryCount <= maxRetries) {
        await delay(getRetryDelay(retryCount))
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: retryCount - 1,
          durationMs,
        }
      }
    }
  }
  
  return {
    success: false,
    error: 'Max retries exceeded',
    retryCount: maxRetries,
    durationMs: Date.now() - startTime,
  }
}

/**
 * Build authentication headers based on provider
 */
function buildAuthHeaders(
  providerKey: string,
  credentials: Record<string, string>
): Record<string, string> {
  switch (providerKey) {
    case 'paystack':
      return {
        'Authorization': `Bearer ${credentials.secret_key}`,
      }
    
    case 'flutterwave':
      return {
        'Authorization': `Bearer ${credentials.secret_key}`,
      }
    
    case 'moniepoint':
      return {
        'X-API-Key': credentials.api_key,
        'X-Secret-Key': credentials.secret_key,
      }
    
    case 'remita':
      return {
        'Authorization': `remitaConsumerKey=${credentials.merchant_id}&remitaConsumerToken=${credentials.api_key}`,
      }
    
    case 'nibss':
      return {
        'X-Institution-Code': credentials.institution_code,
        'Authorization': `Bearer ${credentials.api_key}`,
      }
    
    case 'gig_logistics':
      return {
        'X-API-Key': credentials.api_key,
        'X-Customer-Code': credentials.customer_code,
      }
    
    case 'termii':
      return {
        'api_key': credentials.api_key,
      }
    
    case 'africas_talking':
      return {
        'apiKey': credentials.api_key,
        'Accept': 'application/json',
      }
    
    default:
      // Generic API key header
      if (credentials.api_key) {
        return { 'Authorization': `Bearer ${credentials.api_key}` }
      }
      return {}
  }
}

/**
 * Try to refresh OAuth token
 */
async function tryTokenRefresh(
  instanceId: string,
  providerKey: string,
  credentials: Record<string, string>
): Promise<boolean> {
  // Most Nigerian payment APIs don't use OAuth refresh tokens
  // This is a placeholder for providers that do support it
  return false
}

/**
 * Log API call to database
 */
async function logApiCall(
  tenantId: string,
  instanceId: string,
  data: {
    method: string
    url: string
    requestBody?: any
    responseStatus?: number
    responseBody?: any
    success: boolean
    errorMessage?: string
    durationMs: number
    retryCount: number
  }
) {
  await prisma.integration_logs.create({
    data: withPrismaDefaults({
      tenantId,
      instanceId,
      logType: 'api_call',
      direction: 'outbound',
      method: data.method,
      url: data.url,
      requestBody: data.requestBody ? sanitizePayload(data.requestBody) : undefined,
      responseStatus: data.responseStatus,
      responseBody: data.responseBody ? truncatePayload(data.responseBody) : undefined,
      startedAt: new Date(Date.now() - data.durationMs),
      completedAt: new Date(),
      durationMs: data.durationMs,
      success: data.success,
      errorMessage: data.errorMessage,
      retryCount: data.retryCount,
      isRetry: data.retryCount > 0,
    }),
  })
}

/**
 * Get exponential backoff delay
 */
function getRetryDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  // With jitter to prevent thundering herd
  const baseDelay = 1000 * Math.pow(2, retryCount - 1)
  const jitter = Math.random() * 1000
  return baseDelay + jitter
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sanitize sensitive data from payload before logging
 */
function sanitizePayload(payload: any): any {
  if (typeof payload !== 'object' || payload === null) {
    return payload
  }
  
  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'authorization',
    'card_number', 'cvv', 'pin', 'bvn', 'nin',
  ]
  
  const sanitized: any = Array.isArray(payload) ? [] : {}
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Truncate large payloads for storage
 */
function truncatePayload(payload: any, maxSize: number = 10000): any {
  const stringified = JSON.stringify(payload)
  if (stringified.length <= maxSize) {
    return payload
  }
  
  return {
    _truncated: true,
    _originalSize: stringified.length,
    _preview: stringified.slice(0, maxSize) + '...',
  }
}

// ============================================================================
// Provider-specific API helpers
// ============================================================================

/**
 * Paystack: Verify transaction
 */
export async function paystackVerifyTransaction(
  instanceId: string,
  reference: string
) {
  return makeApiCall(instanceId, {
    method: 'GET',
    path: `/transaction/verify/${reference}`,
  })
}

/**
 * Paystack: Initialize transaction
 */
export async function paystackInitializeTransaction(
  instanceId: string,
  data: {
    email: string
    amount: number // in kobo
    reference?: string
    callback_url?: string
    metadata?: Record<string, any>
  }
) {
  return makeApiCall(instanceId, {
    method: 'POST',
    path: '/transaction/initialize',
    body: data,
  })
}

/**
 * Flutterwave: Verify transaction
 */
export async function flutterwaveVerifyTransaction(
  instanceId: string,
  transactionId: string
) {
  return makeApiCall(instanceId, {
    method: 'GET',
    path: `/transactions/${transactionId}/verify`,
  })
}

/**
 * GIG Logistics: Get shipping rates
 */
export async function gigLogisticsGetRates(
  instanceId: string,
  data: {
    origin: string
    destination: string
    weight: number
    type: 'regular' | 'express'
  }
) {
  return makeApiCall(instanceId, {
    method: 'POST',
    path: '/shipments/rates',
    body: data,
  })
}

/**
 * Termii: Send SMS
 */
export async function termiiSendSms(
  instanceId: string,
  data: {
    to: string
    sms: string
    type?: 'plain' | 'unicode'
    channel?: 'generic' | 'dnd' | 'whatsapp'
  }
) {
  return makeApiCall(instanceId, {
    method: 'POST',
    path: '/sms/send',
    body: {
      ...data,
      type: data.type || 'plain',
      channel: data.channel || 'generic',
    },
  })
}
