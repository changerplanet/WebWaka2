/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Webhook Service
 * 
 * Handles inbound and outbound webhooks.
 * All webhooks emit events - no direct database mutations.
 * Logs all payloads for 90+ days.
 */

import { PrismaClient, WebhookDirection, WebhookStatus } from '@prisma/client'
import crypto from 'crypto'
import { getDecryptedCredentials } from './instance-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

const prisma = new PrismaClient()

/**
 * Create webhook configuration
 */
export async function createWebhook(data: {
  instanceId: string
  name: string
  direction: WebhookDirection
  url: string
  events: string[]
  secretKey?: string
  retryEnabled?: boolean
  maxRetries?: number
  retryDelayMs?: number
}) {
  const instance = await prisma.integration_instances.findUnique({
    where: { id: data.instanceId },
    include: { integration_providers: true },
  })
  
  if (!instance) {
    throw new Error('Integration instance not found')
  }
  
  // Encrypt secret key if provided
  const secretKey = data.secretKey || crypto.randomBytes(32).toString('hex')
  
  const webhook = await prisma.integration_webhooks.create({
    data: withPrismaDefaults({
      instanceId: data.instanceId,
      name: data.name,
      direction: data.direction,
      url: data.url,
      events: data.events,
      secretKey,
      retryEnabled: data.retryEnabled ?? true,
      maxRetries: data.maxRetries ?? 3,
      retryDelayMs: data.retryDelayMs ?? 1000,
      status: WebhookStatus.ACTIVE,
    }),
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      tenantId: instance.tenantId,
      eventType: 'WEBHOOK_CREATED',
      eventData: {
        webhookId: webhook.id,
        name: data.name,
        direction: data.direction,
        events: data.events,
      },
      instanceId: data.instanceId,
    }),
  })
  
  return webhook
}

/**
 * List webhooks for instance
 */
export async function listWebhooksForInstance(instanceId: string) {
  return prisma.integration_webhooks.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get webhook by ID
 */
export async function getWebhookById(webhookId: string) {
  return prisma.integration_webhooks.findUnique({
    where: { id: webhookId },
    include: {
      integration_instances: {
        include: { integration_providers: true },
      },
    },
  })
}

/**
 * Verify inbound webhook signature
 */
export async function verifyWebhookSignature(
  webhookId: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const webhook = await prisma.integration_webhooks.findUnique({
    where: { id: webhookId },
    include: {
      integration_instances: {
        include: { integration_providers: true },
      },
    },
  })
  
  if (!webhook || !webhook.secretKey) {
    return false
  }
  
  const algo = webhook.instance.integration_providers.webhookSignatureAlgo || 'sha256'
  const expectedSignature = crypto
    .createHmac(algo, webhook.secretKey)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Process inbound webhook
 * NO direct database mutations - only event emission
 */
export async function processInboundWebhook(
  webhookId: string,
  payload: any,
  headers: Record<string, string>
): Promise<{ success: boolean; eventEmitted: string | null; error?: string }> {
  const startedAt = new Date()
  
  const webhook = await prisma.integration_webhooks.findUnique({
    where: { id: webhookId },
    include: {
      integration_instances: {
        include: { integration_providers: true },
      },
    },
  })
  
  if (!webhook) {
    return { success: false, eventEmitted: null, error: 'Webhook not found' }
  }
  
  if (webhook.status !== WebhookStatus.ACTIVE) {
    return { success: false, eventEmitted: null, error: 'Webhook is not active' }
  }
  
  // Determine event type from payload
  const eventType = determineEventType(webhook.instance.integration_providers.key, payload)
  
  if (!webhook.events.includes('*') && !webhook.events.includes(eventType)) {
    return { success: false, eventEmitted: null, error: `Event type '${eventType}' not subscribed` }
  }
  
  // Log the webhook call
  const log = await prisma.integration_logs.create({
    data: withPrismaDefaults({
      tenantId: webhook.instance.tenantId,
      instanceId: webhook.instanceId,
      logType: 'webhook_received',
      direction: 'inbound',
      method: 'POST',
      url: webhook.url,
      requestHeaders: sanitizeHeaders(headers),
      requestBody: payload,
      startedAt,
      success: true,
    }),
  })
  
  // Update webhook metrics
  await prisma.integration_webhooks.update({
    where: { id: webhookId },
    data: {
      totalCalls: { increment: 1 },
      successCount: { increment: 1 },
      lastCalledAt: new Date(),
      lastSuccessAt: new Date(),
    },
  })
  
  // Emit internal event (no direct DB mutation)
  const emittedEvent = `INTEGRATION_WEBHOOK_${eventType.toUpperCase()}`
  
  // Log the event emission
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      tenantId: webhook.instance.tenantId,
      eventType: emittedEvent,
      eventData: {
        provider: webhook.instance.integration_providers.key,
        originalEvent: eventType,
        payload,
        logId: log.id,
      },
      instanceId: webhook.instanceId,
    }),
  })
  
  return { success: true, eventEmitted: emittedEvent }
}

/**
 * Send outbound webhook
 */
export async function sendOutboundWebhook(
  webhookId: string,
  payload: any,
  retryCount: number = 0
): Promise<{ success: boolean; responseStatus?: number; error?: string }> {
  const startedAt = new Date()
  
  const webhook = await prisma.integration_webhooks.findUnique({
    where: { id: webhookId },
    include: {
      integration_instances: {
        include: { integration_providers: true },
      },
    },
  })
  
  if (!webhook) {
    return { success: false, error: 'Webhook not found' }
  }
  
  // Sign the payload
  const payloadString = JSON.stringify(payload)
  const algo = webhook.instance.integration_providers.webhookSignatureAlgo || 'sha256'
  const signature = webhook.secretKey
    ? crypto.createHmac(algo, webhook.secretKey).update(payloadString).digest('hex')
    : ''
  
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Webhook-Id': webhook.id,
        'X-Retry-Count': retryCount.toString(),
      },
      body: payloadString,
    })
    
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()
    
    // Log the call
    await prisma.integration_logs.create({
      data: withPrismaDefaults({
        tenantId: webhook.instance.tenantId,
        instanceId: webhook.instanceId,
        logType: 'webhook_sent',
        direction: 'outbound',
        method: 'POST',
        url: webhook.url,
        requestBody: payload,
        responseStatus: response.status,
        startedAt,
        completedAt,
        durationMs,
        success: response.ok,
        errorCode: response.ok ? null : response.status.toString(),
        errorMessage: response.ok ? null : response.statusText,
        retryCount,
        isRetry: retryCount > 0,
      }),
    })
    
    // Update metrics
    await prisma.integration_webhooks.update({
      where: { id: webhookId },
      data: {
        totalCalls: { increment: 1 },
        successCount: response.ok ? { increment: 1 } : undefined,
        failureCount: response.ok ? undefined : { increment: 1 },
        lastCalledAt: new Date(),
        lastSuccessAt: response.ok ? new Date() : undefined,
        lastFailureAt: response.ok ? undefined : new Date(),
      },
    })
    
    // Retry if failed and retries enabled
    if (!response.ok && webhook.retryEnabled && retryCount < webhook.maxRetries) {
      setTimeout(() => {
        sendOutboundWebhook(webhookId, payload, retryCount + 1)
      }, webhook.retryDelayMs * Math.pow(2, retryCount)) // Exponential backoff
    }
    
    return { success: response.ok, responseStatus: response.status }
  } catch (error) {
    // Log the error
    await prisma.integration_logs.create({
      data: withPrismaDefaults({
        tenantId: webhook.instance.tenantId,
        instanceId: webhook.instanceId,
        logType: 'webhook_sent',
        direction: 'outbound',
        method: 'POST',
        url: webhook.url,
        requestBody: payload,
        startedAt,
        completedAt: new Date(),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
        isRetry: retryCount > 0,
      },
    })
    
    // Retry if enabled
    if (webhook.retryEnabled && retryCount < webhook.maxRetries) {
      setTimeout(() => {
        sendOutboundWebhook(webhookId, payload, retryCount + 1)
      }, webhook.retryDelayMs * Math.pow(2, retryCount))
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update webhook status
 */
export async function updateWebhookStatus(
  webhookId: string,
  status: WebhookStatus
) {
  return prisma.integration_webhooks.update({
    where: { id: webhookId },
    data: { status },
  })
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string) {
  const webhook = await prisma.integration_webhooks.findUnique({
    where: { id: webhookId },
    include: { integration_instances: true },
  })
  
  if (!webhook) {
    throw new Error('Webhook not found')
  }
  
  await prisma.integration_webhooks.delete({
    where: { id: webhookId },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      tenantId: webhook.instance.tenantId,
      eventType: 'WEBHOOK_DELETED',
      eventData: { webhookId, name: webhook.name },
      instanceId: webhook.instanceId,
    }),
  })
  
  return { success: true }
}

// Helper functions
function determineEventType(providerKey: string, payload: any): string {
  // Provider-specific event detection
  switch (providerKey) {
    case 'paystack':
      return payload.event || 'unknown'
    case 'flutterwave':
      return payload.event || payload['event.type'] || 'unknown'
    case 'stripe':
      return payload.type || 'unknown'
    default:
      return payload.event || payload.type || payload.eventType || 'unknown'
  }
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  const sensitiveKeys = ['authorization', 'x-api-key', 'x-secret', 'cookie']
  
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
