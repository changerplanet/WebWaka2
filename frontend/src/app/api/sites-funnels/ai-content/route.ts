export const dynamic = 'force-dynamic'

/**
 * SITES & FUNNELS: AI Content API
 * 
 * REST API for AI-assisted content generation
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireSitesFunnelsEnabled } from '@/lib/sites-funnels/entitlements-service';
import { hasPermission } from '@/lib/sites-funnels/permissions-service';
import {
  generateAIContent,
  approveAIContent,
  rejectAIContent,
  markAIContentEdited,
  getAIContentHistory,
} from '@/lib/sites-funnels/ai-content-service';
import { validateAiContentStatus, validateAiContentType } from '@/lib/enums';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'history';
  const tenantId = searchParams.get('tenantId') || session.activeTenantId;

  if (!tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'No active tenant',
      code: 'NO_TENANT'
    }, { status: 400 });
  }

  // Check entitlement
  const entitlementCheck = await requireSitesFunnelsEnabled(tenantId);
  if (!entitlementCheck.authorized) {
    return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 });
  }

  try {
    switch (action) {
      case 'history': {
        // Phase 11C: Using type-safe enum validators
        const status = validateAiContentStatus(searchParams.get('status'));
        const contentType = validateAiContentType(searchParams.get('contentType'));
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await getAIContentHistory(tenantId, { status, contentType, page, limit });
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI Content API GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { action, tenantId: bodyTenantId } = body;
    const tenantId = bodyTenantId || session.activeTenantId;

    if (!tenantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active tenant',
        code: 'NO_TENANT'
      }, { status: 400 });
    }

    // Check entitlement
    const entitlementCheck = await requireSitesFunnelsEnabled(tenantId);
    if (!entitlementCheck.authorized) {
      return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 });
    }

    // Check permission for AI content
    const canUseAI = await hasPermission(userId, tenantId, 'use_ai_content');
    if (!canUseAI) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    switch (action) {
      case 'generate': {
        const { 
          contentType, 
          industry, 
          targetAudience, 
          tone, 
          businessName, 
          productService, 
          keywords,
          siteId,
          funnelId,
          pageId,
          platformInstanceId,
          partnerId,
        } = body;

        if (!contentType) {
          return NextResponse.json({ success: false, error: 'Content type required' }, { status: 400 });
        }

        const result = await generateAIContent({
          tenantId,
          platformInstanceId,
          partnerId: partnerId || '',
          userId,
          contentType,
          industry,
          targetAudience,
          tone,
          businessName,
          productService,
          keywords,
          siteId,
          funnelId,
          pageId,
        });

        return NextResponse.json(result);
      }

      case 'approve': {
        const { logId } = body;
        if (!logId) {
          return NextResponse.json({ success: false, error: 'Log ID required' }, { status: 400 });
        }
        const result = await approveAIContent(logId, userId);
        return NextResponse.json(result);
      }

      case 'reject': {
        const { logId } = body;
        if (!logId) {
          return NextResponse.json({ success: false, error: 'Log ID required' }, { status: 400 });
        }
        const result = await rejectAIContent(logId, userId);
        return NextResponse.json(result);
      }

      case 'mark-edited': {
        const { logId } = body;
        if (!logId) {
          return NextResponse.json({ success: false, error: 'Log ID required' }, { status: 400 });
        }
        const result = await markAIContentEdited(logId, userId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI Content API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
