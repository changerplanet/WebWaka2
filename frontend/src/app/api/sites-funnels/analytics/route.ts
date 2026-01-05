/**
 * SITES & FUNNELS: Analytics API
 * 
 * REST API for analytics tracking and reporting
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireSitesFunnelsEnabled } from '@/lib/sites-funnels/entitlements-service';
import { hasPermission } from '@/lib/sites-funnels/permissions-service';
import {
  trackEvent,
  trackPageView,
  trackFormSubmit,
  getSiteAnalytics,
  getPartnerAnalytics,
  getInstanceAnalytics,
  exportAnalyticsCSV,
} from '@/lib/sites-funnels/analytics-service';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'site';
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

  // Check permission for viewing analytics
  const canViewAnalytics = await hasPermission(userId, tenantId, 'view_analytics');
  if (!canViewAnalytics) {
    return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
  }

  // Parse time range
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
  const timeRange = startDate && endDate ? { startDate, endDate } : undefined;

  try {
    switch (action) {
      case 'site': {
        const siteId = searchParams.get('siteId');
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const analytics = await getSiteAnalytics(siteId, tenantId, timeRange);
        return NextResponse.json({ success: true, analytics });
      }

      case 'partner': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ success: false, error: 'Partner ID required' }, { status: 400 });
        }
        const analytics = await getPartnerAnalytics(partnerId, timeRange);
        return NextResponse.json({ success: true, analytics });
      }

      case 'instance': {
        const platformInstanceId = searchParams.get('platformInstanceId');
        if (!platformInstanceId) {
          return NextResponse.json({ success: false, error: 'Platform Instance ID required' }, { status: 400 });
        }
        const analytics = await getInstanceAnalytics(platformInstanceId, timeRange);
        return NextResponse.json({ success: true, analytics });
      }

      case 'export': {
        const siteId = searchParams.get('siteId');
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const csv = await exportAnalyticsCSV(siteId, tenantId, timeRange);
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="analytics-${siteId}-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Analytics API GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Analytics tracking endpoint - can be called without full authentication
  // for tracking visitor events (but tenantId is still required)
  
  try {
    const body = await request.json();
    const { action, tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    switch (action) {
      case 'track': {
        const { 
          eventType,
          platformInstanceId,
          siteId,
          funnelId,
          pageId,
          visitorId,
          sessionId,
          eventData,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          deviceType,
          browser,
          country,
        } = body;

        if (!eventType) {
          return NextResponse.json({ success: false, error: 'Event type required' }, { status: 400 });
        }

        await trackEvent({
          eventType,
          tenantId,
          platformInstanceId,
          siteId,
          funnelId,
          pageId,
          visitorId,
          sessionId,
          eventData,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          deviceType,
          browser,
          country,
        });

        return NextResponse.json({ success: true });
      }

      case 'page-view': {
        const { pageId, siteId, funnelId, visitorId, sessionId, referrer, utmSource, utmMedium, utmCampaign, deviceType, browser, country } = body;
        
        if (!pageId) {
          return NextResponse.json({ success: false, error: 'Page ID required' }, { status: 400 });
        }

        await trackPageView(tenantId, pageId, {
          siteId,
          funnelId,
          visitorId,
          sessionId,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          deviceType,
          browser,
          country,
        });

        return NextResponse.json({ success: true });
      }

      case 'form-submit': {
        const { pageId, formId, fields, siteId, funnelId, visitorId, sessionId } = body;
        
        if (!pageId) {
          return NextResponse.json({ success: false, error: 'Page ID required' }, { status: 400 });
        }

        await trackFormSubmit(tenantId, pageId, {
          formId,
          fields,
          siteId,
          funnelId,
          visitorId,
          sessionId,
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Analytics API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
