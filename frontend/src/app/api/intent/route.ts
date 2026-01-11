export const dynamic = 'force-dynamic'

/**
 * CTA INTENT API
 * 
 * Handles intent capture and retrieval for CTA-driven signups.
 * Intent is advisory-only - influences suggestions, not activation.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as intentService from '@/lib/intent/service'
import { IntentSource } from '@prisma/client'

// GET handler - retrieve intents and definitions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'definitions': {
        // Get all intent definitions
        const domain = searchParams.get('domain')
        const intents = domain 
          ? intentService.getIntentsByDomain(domain as any)
          : intentService.getAllIntents()
        
        return NextResponse.json({
          intents,
          domains: ['COMMERCE', 'EDUCATION', 'HEALTHCARE', 'HOSPITALITY', 'SERVICES', 'LOGISTICS', 'GENERAL'],
        })
      }
      
      case 'definition': {
        // Get single intent definition
        const key = searchParams.get('key')
        if (!key) {
          return NextResponse.json({ error: 'Intent key required' }, { status: 400 })
        }
        
        const intent = intentService.getIntentByKey(key)
        if (!intent) {
          return NextResponse.json({ error: 'Intent not found' }, { status: 404 })
        }
        
        return NextResponse.json(intent)
      }
      
      case 'suggestions': {
        // Get capability suggestions for intent
        const key = searchParams.get('key')
        if (!key) {
          return NextResponse.json({ error: 'Intent key required' }, { status: 400 })
        }
        
        const suggestions = intentService.getSuggestedCapabilities(key)
        const intentDef = intentService.getIntentByKey(key)
        
        return NextResponse.json({
          intentKey: key,
          suggestions,
          intentLabel: intentDef?.label,
          intentDescription: intentDef?.description,
          _note: 'These are suggestions only - user must explicitly activate capabilities',
        })
      }
      
      case 'user-intent': {
        // Get pending intent for user
        const userId = searchParams.get('userId')
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }
        
        const intent = await intentService.getPendingIntentForUser(userId)
        return NextResponse.json(intent)
      }
      
      case 'tenant-intents': {
        // Get all intents for tenant
        const tenantId = searchParams.get('tenantId')
        if (!tenantId) {
          return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
        }
        
        const intents = await intentService.getIntentsForTenant(tenantId)
        return NextResponse.json({ intents })
      }
      
      case 'cta-routes': {
        // Get standard CTA routes
        return NextResponse.json({
          routes: intentService.STANDARD_CTA_ROUTES,
          _note: 'All CTAs must route through /signup or /login with intent parameter',
        })
      }
      
      case 'parse': {
        // Parse intent from URL
        const url = searchParams.get('url')
        if (!url) {
          return NextResponse.json({ error: 'URL required' }, { status: 400 })
        }
        
        const parsed = intentService.parseIntentFromUrl(url)
        return NextResponse.json(parsed)
      }
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Intent API GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST handler - capture and manage intents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    switch (action) {
      case 'capture': {
        // Capture intent from CTA
        const { intentKey, userId, tenantId, source, sourceUrl, campaignId, referralCode, metadata } = body
        
        if (!intentKey) {
          return NextResponse.json({ error: 'Intent key required' }, { status: 400 })
        }
        
        // Validate intent key exists
        const intentDef = intentService.getIntentByKey(intentKey)
        if (!intentDef) {
          return NextResponse.json({ 
            error: `Unknown intent key: ${intentKey}`,
            availableIntents: intentService.getAllIntents().map(i => i.key),
          }, { status: 400 })
        }
        
        const intent = await intentService.captureIntent({
          intentKey,
          userId,
          tenantId,
          source: source as IntentSource,
          sourceUrl,
          campaignId,
          referralCode,
          metadata,
        })
        
        return NextResponse.json({
          intent,
          suggestions: intentDef.suggestedCapabilities,
          _note: 'Intent captured. Suggestions are advisory only.',
        })
      }
      
      case 'attach-to-tenant': {
        // Attach intent to tenant after creation
        const { intentId, tenantId } = body
        
        if (!intentId || !tenantId) {
          return NextResponse.json({ error: 'Intent ID and Tenant ID required' }, { status: 400 })
        }
        
        const intent = await intentService.attachIntentToTenant(intentId, tenantId)
        return NextResponse.json({ intent })
      }
      
      case 'mark-processed': {
        // Mark intent as processed (suggestions shown to user)
        const { intentId } = body
        
        if (!intentId) {
          return NextResponse.json({ error: 'Intent ID required' }, { status: 400 })
        }
        
        const intent = await intentService.markIntentProcessed(intentId)
        return NextResponse.json({ intent })
      }
      
      case 'build-cta-url': {
        // Build a CTA URL with intent parameters
        const { basePath, intentKey, source, campaignId, referralCode } = body
        
        if (!basePath || !intentKey) {
          return NextResponse.json({ error: 'Base path and intent key required' }, { status: 400 })
        }
        
        const url = intentService.buildCtaUrl(basePath, intentKey, { source, campaignId, referralCode })
        return NextResponse.json({ url })
      }
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Intent API POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
