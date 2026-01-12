export const dynamic = 'force-dynamic'

/**
 * SITES & FUNNELS: Funnels API
 * 
 * REST API for funnel management
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireSitesFunnelsEnabled, requirePartnerOwnership } from '@/lib/sites-funnels/entitlements-service';
import {
  createFunnel,
  getFunnel,
  listFunnels,
  updateFunnel,
  deleteFunnel,
  addFunnelStep,
  reorderFunnelSteps,
  activateFunnel,
  pauseFunnel,
  getFunnelAnalytics,
} from '@/lib/sites-funnels/funnel-service';
import { validateFunnelStatus } from '@/lib/enums';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const tenantId = searchParams.get('tenantId') || session.activeTenantId;

  if (!tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'No active tenant. Please select a tenant from your partner dashboard to manage funnels.',
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
      case 'list': {
        // Phase 11C: Using type-safe enum validator
        const status = validateFunnelStatus(searchParams.get('status'));
        const partnerId = searchParams.get('partnerId') || undefined;
        const siteId = searchParams.get('siteId') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await listFunnels(tenantId, { status, partnerId, siteId, search, page, limit });
        return NextResponse.json({ success: true, ...result });
      }

      case 'get': {
        const funnelId = searchParams.get('funnelId');
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const funnel = await getFunnel(funnelId, tenantId);
        if (!funnel) {
          return NextResponse.json({ success: false, error: 'Funnel not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, funnel });
      }

      case 'analytics': {
        const funnelId = searchParams.get('funnelId');
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const startDate = searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : undefined;
        const endDate = searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : undefined;
        
        const analytics = await getFunnelAnalytics(funnelId, tenantId, { startDate, endDate });
        return NextResponse.json({ success: true, analytics });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Funnels API GET error:', error);
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
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    // Check entitlement
    const entitlementCheck = await requireSitesFunnelsEnabled(tenantId);
    if (!entitlementCheck.authorized) {
      return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 });
    }

    // Check partner ownership for write operations
    const partnerCheck = await requirePartnerOwnership(tenantId, userId);
    if (!partnerCheck.authorized) {
      return NextResponse.json({ success: false, error: partnerCheck.error }, { status: 403 });
    }

    switch (action) {
      case 'create-funnel': {
        const { name, slug, description, siteId, goalType, goalValue, platformInstanceId } = body;
        
        if (!name || !slug) {
          return NextResponse.json({ success: false, error: 'Name and slug required' }, { status: 400 });
        }

        const result = await createFunnel({
          tenantId,
          platformInstanceId,
          partnerId: partnerCheck.partnerId!,
          siteId,
          name,
          slug,
          description,
          goalType,
          goalValue,
          createdBy: userId,
        });
        return NextResponse.json(result);
      }

      case 'update-funnel': {
        const { funnelId, ...updateData } = body;
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const result = await updateFunnel(funnelId, tenantId, {
          ...updateData,
          updatedBy: userId,
        });
        return NextResponse.json(result);
      }

      case 'delete-funnel': {
        const { funnelId } = body;
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const result = await deleteFunnel(funnelId, tenantId);
        return NextResponse.json(result);
      }

      case 'activate-funnel': {
        const { funnelId } = body;
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const result = await activateFunnel(funnelId, tenantId, userId);
        return NextResponse.json(result);
      }

      case 'pause-funnel': {
        const { funnelId } = body;
        if (!funnelId) {
          return NextResponse.json({ success: false, error: 'Funnel ID required' }, { status: 400 });
        }
        const result = await pauseFunnel(funnelId, tenantId, userId);
        return NextResponse.json(result);
      }

      case 'add-step': {
        const { funnelId, name, slug, pageType, templateId } = body;
        if (!funnelId || !name || !slug) {
          return NextResponse.json({ success: false, error: 'Funnel ID, name, and slug required' }, { status: 400 });
        }
        const result = await addFunnelStep({
          tenantId,
          funnelId,
          name,
          slug,
          pageType,
          createdBy: userId,
          templateId,
        });
        return NextResponse.json(result);
      }

      case 'reorder-steps': {
        const { funnelId, stepOrder } = body;
        if (!funnelId || !stepOrder) {
          return NextResponse.json({ success: false, error: 'Funnel ID and step order required' }, { status: 400 });
        }
        const result = await reorderFunnelSteps(funnelId, tenantId, stepOrder);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Funnels API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
