export const dynamic = 'force-dynamic'

/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * API Routes
 * 
 * Unified API for integration management, developer portal, and audit.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as configService from '@/lib/integrations/config-service'
import * as providerService from '@/lib/integrations/provider-service'
import * as instanceService from '@/lib/integrations/instance-service'
import * as webhookService from '@/lib/integrations/webhook-service'
import * as connectorService from '@/lib/integrations/connector-service'
import * as developerService from '@/lib/integrations/developer-service'
import * as auditService from '@/lib/integrations/audit-service'
import { IntegrationCategory, IntegrationProviderStatus, WebhookDirection } from '@prisma/client'

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      // ========================================
      // Module Configuration
      // ========================================
      case 'status':
        return NextResponse.json(await configService.getModuleStatus())
      
      case 'manifest':
        return NextResponse.json(configService.getModuleManifest())
      
      case 'validate':
        return NextResponse.json(await configService.validateModule())
      
      // ========================================
      // Provider Registry
      // ========================================
      case 'providers': {
        const category = searchParams.get('category') as IntegrationCategory | null
        const status = searchParams.get('status') as IntegrationProviderStatus | null
        const nigeriaFirstOnly = searchParams.get('nigeriaFirstOnly') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        return NextResponse.json(await providerService.listProviders({
          category: category || undefined,
          status: status || undefined,
          nigeriaFirstOnly,
          page,
          limit,
        }))
      }
      
      case 'provider': {
        const key = searchParams.get('key')
        if (!key) {
          return NextResponse.json({ error: 'Provider key required' }, { status: 400 })
        }
        const provider = await providerService.getProviderByKey(key)
        if (!provider) {
          return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
        }
        return NextResponse.json(provider)
      }
      
      case 'providers-by-category':
        return NextResponse.json(await providerService.listProvidersByCategory())
      
      case 'nigeria-first-providers':
        return NextResponse.json(await providerService.getNigeriaFirstProviders())
      
      case 'categories':
        return NextResponse.json(providerService.getAvailableCategories())
      
      // ========================================
      // Integration Instances
      // ========================================
      case 'instances': {
        const tenantId = searchParams.get('tenantId')
        if (!tenantId) {
          return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
        }
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        return NextResponse.json(await instanceService.listInstancesForTenant(tenantId, { page, limit }))
      }
      
      case 'instance': {
        const instanceId = searchParams.get('instanceId')
        const tenantId = searchParams.get('tenantId')
        if (!instanceId) {
          return NextResponse.json({ error: 'Instance ID required' }, { status: 400 })
        }
        const instance = await instanceService.getInstanceById(instanceId, tenantId || undefined)
        if (!instance) {
          return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
        }
        return NextResponse.json(instance)
      }
      
      // ========================================
      // Webhooks
      // ========================================
      case 'webhooks': {
        const instanceId = searchParams.get('instanceId')
        if (!instanceId) {
          return NextResponse.json({ error: 'Instance ID required' }, { status: 400 })
        }
        return NextResponse.json(await webhookService.listWebhooksForInstance(instanceId))
      }
      
      case 'webhook': {
        const webhookId = searchParams.get('webhookId')
        if (!webhookId) {
          return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
        }
        const webhook = await webhookService.getWebhookById(webhookId)
        if (!webhook) {
          return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }
        return NextResponse.json(webhook)
      }
      
      // ========================================
      // Developer Portal
      // ========================================
      case 'apps': {
        const tenantId = searchParams.get('tenantId')
        const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        return NextResponse.json(await developerService.listDeveloperApps({
          tenantId: tenantId || undefined,
          verifiedOnly,
          page,
          limit,
        }))
      }
      
      case 'app': {
        const appId = searchParams.get('appId')
        if (!appId) {
          return NextResponse.json({ error: 'App ID required' }, { status: 400 })
        }
        const app = await developerService.getDeveloperApp(appId)
        if (!app) {
          return NextResponse.json({ error: 'App not found' }, { status: 404 })
        }
        return NextResponse.json(app)
      }
      
      case 'api-keys': {
        const appId = searchParams.get('appId')
        if (!appId) {
          return NextResponse.json({ error: 'App ID required' }, { status: 400 })
        }
        const tenantId = searchParams.get('tenantId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        return NextResponse.json(await developerService.listApiKeysForApp(appId, {
          tenantId: tenantId || undefined,
          page,
          limit,
        }))
      }
      
      case 'scopes': {
        const resource = searchParams.get('resource')
        const moduleKey = searchParams.get('moduleKey')
        
        return NextResponse.json(await developerService.listAccessScopes({
          resource: resource || undefined,
          moduleKey: moduleKey || undefined,
        }))
      }
      
      // ========================================
      // Audit & Logging
      // ========================================
      case 'logs': {
        const tenantId = searchParams.get('tenantId')
        const instanceId = searchParams.get('instanceId')
        const logType = searchParams.get('logType')
        const direction = searchParams.get('direction')
        const success = searchParams.get('success')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        return NextResponse.json(await auditService.queryIntegrationLogs({
          tenantId: tenantId || undefined,
          instanceId: instanceId || undefined,
          logType: logType || undefined,
          direction: direction || undefined,
          success: success === 'true' ? true : success === 'false' ? false : undefined,
          page,
          limit,
        }))
      }
      
      case 'log': {
        const logId = searchParams.get('logId')
        if (!logId) {
          return NextResponse.json({ error: 'Log ID required' }, { status: 400 })
        }
        const log = await auditService.getLogById(logId)
        if (!log) {
          return NextResponse.json({ error: 'Log not found' }, { status: 404 })
        }
        return NextResponse.json(log)
      }
      
      case 'events': {
        const tenantId = searchParams.get('tenantId')
        const eventType = searchParams.get('eventType')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        return NextResponse.json(await auditService.queryEventLogs({
          tenantId: tenantId || undefined,
          eventType: eventType || undefined,
          page,
          limit,
        }))
      }
      
      case 'statistics': {
        const tenantId = searchParams.get('tenantId')
        const period = (searchParams.get('period') || 'day') as 'day' | 'week' | 'month'
        
        return NextResponse.json(await auditService.getIntegrationStatistics(
          tenantId || undefined,
          period
        ))
      }
      
      case 'security-anomalies': {
        const tenantId = searchParams.get('tenantId')
        return NextResponse.json(await auditService.detectSecurityAnomalies(tenantId || undefined))
      }
      
      case 'entitlements':
        return NextResponse.json({
          entitlements: {
            integrations_enabled: { type: 'boolean', default: false },
            api_access_enabled: { type: 'boolean', default: false },
            custom_webhooks_enabled: { type: 'boolean', default: false },
            developer_portal_enabled: { type: 'boolean', default: false },
            max_integrations: { type: 'number', default: 5 },
            max_api_keys: { type: 'number', default: 10 },
          },
          tiers: {
            free: { integrations_enabled: false, api_access_enabled: false },
            starter: { integrations_enabled: true, max_integrations: 3 },
            professional: { integrations_enabled: true, api_access_enabled: true, max_integrations: 10 },
            enterprise: { integrations_enabled: true, api_access_enabled: true, developer_portal_enabled: true, max_integrations: -1 },
          },
        })
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Integrations API GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    switch (action) {
      // ========================================
      // Module Initialization
      // ========================================
      case 'initialize':
        return NextResponse.json(await configService.initializeModule())
      
      // ========================================
      // Provider Management (Super Admin)
      // ========================================
      case 'register-provider': {
        const { key, name, category, description, logoUrl, websiteUrl, documentationUrl,
          apiBaseUrl, apiVersion, isNigeriaFirst, supportedScopes, requiredCredentials,
          supportsWebhooks, webhookSignatureAlgo, defaultRateLimit, createdBy } = body
        
        if (!key || !name || !category || !supportedScopes || !requiredCredentials) {
          return NextResponse.json(
            { error: 'Missing required fields: key, name, category, supportedScopes, requiredCredentials' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await providerService.registerProvider({
          key,
          name,
          category,
          description,
          logoUrl,
          websiteUrl,
          documentationUrl,
          apiBaseUrl,
          apiVersion,
          isNigeriaFirst,
          supportedScopes,
          requiredCredentials,
          supportsWebhooks,
          webhookSignatureAlgo,
          defaultRateLimit,
          createdBy,
        }))
      }
      
      case 'update-provider-status': {
        const { providerId, status, updatedBy } = body
        if (!providerId || !status) {
          return NextResponse.json(
            { error: 'Missing required fields: providerId, status' },
            { status: 400 }
          )
        }
        return NextResponse.json(await providerService.updateProviderStatus(providerId, status, updatedBy))
      }
      
      // ========================================
      // Integration Instance Management
      // ========================================
      case 'enable-integration': {
        const { tenantId, providerKey, displayName, environment, enabledScopes, configuration, activatedBy } = body
        
        if (!tenantId || !providerKey || !enabledScopes || !activatedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: tenantId, providerKey, enabledScopes, activatedBy' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await instanceService.enableIntegration(tenantId, {
          providerKey,
          displayName,
          environment,
          enabledScopes,
          configuration,
          activatedBy,
        }))
      }
      
      case 'configure-credentials': {
        const { instanceId, credentials, configuredBy } = body
        
        if (!instanceId || !credentials || !configuredBy) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, credentials, configuredBy' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await instanceService.configureCredentials(instanceId, credentials, configuredBy))
      }
      
      case 'suspend-instance': {
        const { instanceId, reason, suspendedBy } = body
        if (!instanceId || !reason || !suspendedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, reason, suspendedBy' },
            { status: 400 }
          )
        }
        return NextResponse.json(await instanceService.suspendInstance(instanceId, reason, suspendedBy))
      }
      
      case 'reactivate-instance': {
        const { instanceId, reactivatedBy } = body
        if (!instanceId || !reactivatedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, reactivatedBy' },
            { status: 400 }
          )
        }
        return NextResponse.json(await instanceService.reactivateInstance(instanceId, reactivatedBy))
      }
      
      case 'revoke-instance': {
        const { instanceId, reason, revokedBy } = body
        if (!instanceId || !reason || !revokedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, reason, revokedBy' },
            { status: 400 }
          )
        }
        return NextResponse.json(await instanceService.revokeInstance(instanceId, reason, revokedBy))
      }
      
      // ========================================
      // Webhook Management
      // ========================================
      case 'create-webhook': {
        const { instanceId, name, direction, url, events, secretKey, retryEnabled, maxRetries, retryDelayMs } = body
        
        if (!instanceId || !name || !direction || !url || !events) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, name, direction, url, events' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await webhookService.createWebhook({
          instanceId,
          name,
          direction,
          url,
          events,
          secretKey,
          retryEnabled,
          maxRetries,
          retryDelayMs,
        }))
      }
      
      case 'process-webhook': {
        const { webhookId, payload, headers } = body
        if (!webhookId || !payload) {
          return NextResponse.json(
            { error: 'Missing required fields: webhookId, payload' },
            { status: 400 }
          )
        }
        return NextResponse.json(await webhookService.processInboundWebhook(webhookId, payload, headers || {}))
      }
      
      case 'send-webhook': {
        const { webhookId, payload } = body
        if (!webhookId || !payload) {
          return NextResponse.json(
            { error: 'Missing required fields: webhookId, payload' },
            { status: 400 }
          )
        }
        return NextResponse.json(await webhookService.sendOutboundWebhook(webhookId, payload))
      }
      
      case 'delete-webhook': {
        const { webhookId } = body
        if (!webhookId) {
          return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
        }
        return NextResponse.json(await webhookService.deleteWebhook(webhookId))
      }
      
      // ========================================
      // API Connector
      // ========================================
      case 'api-call': {
        const { instanceId, method, path, requestBody, headers, queryParams, timeout, retries } = body
        
        if (!instanceId || !method || !path) {
          return NextResponse.json(
            { error: 'Missing required fields: instanceId, method, path' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await connectorService.makeApiCall(instanceId, {
          method,
          path,
          body: requestBody,
          headers,
          queryParams,
          timeout,
          retries,
        }))
      }
      
      // ========================================
      // Developer Portal
      // ========================================
      case 'create-app': {
        const { tenantId, name, description, logoUrl, websiteUrl, developerName, developerEmail, redirectUris, allowedScopes } = body
        
        if (!name || !developerName || !developerEmail || !allowedScopes) {
          return NextResponse.json(
            { error: 'Missing required fields: name, developerName, developerEmail, allowedScopes' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await developerService.createDeveloperApp({
          tenantId,
          name,
          description,
          logoUrl,
          websiteUrl,
          developerName,
          developerEmail,
          redirectUris,
          allowedScopes,
        }))
      }
      
      case 'verify-app': {
        const { appId, verifiedBy } = body
        if (!appId || !verifiedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: appId, verifiedBy' },
            { status: 400 }
          )
        }
        return NextResponse.json(await developerService.verifyDeveloperApp(appId, verifiedBy))
      }
      
      case 'generate-api-key': {
        const { appId, name, tenantId, scopes, expiresAt, rateLimit, allowedIps } = body
        
        if (!appId || !name || !scopes) {
          return NextResponse.json(
            { error: 'Missing required fields: appId, name, scopes' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(await developerService.generateApiKeyForApp(appId, {
          name,
          tenantId,
          scopes,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          rateLimit,
          allowedIps,
        }))
      }
      
      case 'validate-api-key': {
        const { key, requiredScopes, clientIp } = body
        if (!key) {
          return NextResponse.json({ error: 'API key required' }, { status: 400 })
        }
        return NextResponse.json(await developerService.validateApiKey(key, requiredScopes, clientIp))
      }
      
      case 'revoke-api-key': {
        const { keyId, reason, revokedBy } = body
        if (!keyId || !reason || !revokedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: keyId, reason, revokedBy' },
            { status: 400 }
          )
        }
        return NextResponse.json(await developerService.revokeApiKey(keyId, reason, revokedBy))
      }
      
      // ========================================
      // Audit
      // ========================================
      case 'audit-summary': {
        const { tenantId, startDate, endDate } = body
        if (!tenantId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required fields: tenantId, startDate, endDate' },
            { status: 400 }
          )
        }
        return NextResponse.json(await auditService.getAuditSummary(
          tenantId,
          new Date(startDate),
          new Date(endDate)
        ))
      }
      
      case 'cleanup-logs': {
        const { retentionDays } = body
        return NextResponse.json(await auditService.cleanupOldLogs(retentionDays || 90))
      }
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Integrations API POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
