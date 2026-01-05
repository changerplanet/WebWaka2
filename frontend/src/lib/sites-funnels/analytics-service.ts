/**
 * SITES & FUNNELS: Analytics Service
 * 
 * Analytics tracking and reporting:
 * - Page views
 * - Funnel conversions
 * - Traffic sources
 * - Lead submissions
 * 
 * Scopes: Instance-level, Partner-level, Tenant-level (read-only)
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsEvent {
  eventType: 'page_view' | 'funnel_start' | 'funnel_step' | 'conversion' | 'form_submit' | 'cta_click';
  tenantId: string;
  platformInstanceId?: string;
  siteId?: string;
  funnelId?: string;
  pageId?: string;
  visitorId?: string;
  sessionId?: string;
  eventData?: any;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  country?: string;
}

export interface AnalyticsSummary {
  pageViews: number;
  uniqueVisitors: number;
  funnelStarts: number;
  conversions: number;
  conversionRate: number;
  formSubmissions: number;
  topPages: Array<{ pageId: string; name: string; views: number }>;
  topSources: Array<{ source: string; visits: number }>;
  deviceBreakdown: Record<string, number>;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track an analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await prisma.sf_analytics_events.create({
      data: {
        id: randomUUID(),
        tenantId: event.tenantId,
        platformInstanceId: event.platformInstanceId,
        eventType: event.eventType,
        eventData: event.eventData,
        siteId: event.siteId,
        funnelId: event.funnelId,
        pageId: event.pageId,
        visitorId: event.visitorId,
        sessionId: event.sessionId,
        referrer: event.referrer,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        deviceType: event.deviceType,
        browser: event.browser,
        country: event.country,
      },
    });

    // Update view counts
    if (event.eventType === 'page_view') {
      if (event.pageId) {
        await prisma.sf_pages.update({
          where: { id: event.pageId },
          data: { viewCount: { increment: 1 } },
        }).catch(() => {});
      }
      if (event.siteId) {
        await prisma.sf_sites.update({
          where: { id: event.siteId },
          data: { viewCount: { increment: 1 } },
        }).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Track event error:', error);
  }
}

/**
 * Track page view (convenience method)
 */
export async function trackPageView(
  tenantId: string,
  pageId: string,
  context: {
    siteId?: string;
    funnelId?: string;
    visitorId?: string;
    sessionId?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    country?: string;
  } = {}
): Promise<void> {
  await trackEvent({
    eventType: 'page_view',
    tenantId,
    pageId,
    ...context,
  });
}

/**
 * Track form submission
 */
export async function trackFormSubmit(
  tenantId: string,
  pageId: string,
  formData: {
    formId?: string;
    fields?: string[];
    siteId?: string;
    funnelId?: string;
    visitorId?: string;
    sessionId?: string;
  } = {}
): Promise<void> {
  await trackEvent({
    eventType: 'form_submit',
    tenantId,
    pageId,
    siteId: formData.siteId,
    funnelId: formData.funnelId,
    visitorId: formData.visitorId,
    sessionId: formData.sessionId,
    eventData: {
      formId: formData.formId,
      fields: formData.fields,
    },
  });
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get site analytics summary
 */
export async function getSiteAnalytics(
  siteId: string,
  tenantId: string,
  timeRange?: TimeRange
): Promise<AnalyticsSummary> {
  const where: any = {
    siteId,
    tenantId,
  };

  if (timeRange) {
    where.createdAt = {
      gte: timeRange.startDate,
      lte: timeRange.endDate,
    };
  }

  const events = await prisma.sf_analytics_events.findMany({
    where,
  });

  // Get pages for names
  const pages = await prisma.sf_pages.findMany({
    where: { siteId, tenantId },
    select: { id: true, name: true },
  });
  const pageMap = new Map(pages.map(p => [p.id, p.name]));

  // Calculate metrics
  const pageViews = events.filter(e => e.eventType === 'page_view').length;
  const uniqueVisitors = new Set(events.filter(e => e.visitorId).map(e => e.visitorId)).size;
  const funnelStarts = events.filter(e => e.eventType === 'funnel_start').length;
  const conversions = events.filter(e => e.eventType === 'conversion').length;
  const formSubmissions = events.filter(e => e.eventType === 'form_submit').length;

  // Top pages by views
  const pageViewCounts: Record<string, number> = {};
  events
    .filter(e => e.eventType === 'page_view' && e.pageId)
    .forEach(e => {
      pageViewCounts[e.pageId!] = (pageViewCounts[e.pageId!] || 0) + 1;
    });

  const topPages = Object.entries(pageViewCounts)
    .map(([pageId, views]) => ({
      pageId,
      name: pageMap.get(pageId) || 'Unknown Page',
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top sources
  const sourceCounts: Record<string, number> = {};
  events.forEach(e => {
    const source = e.utmSource || (e.referrer ? new URL(e.referrer).hostname : 'direct');
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const topSources = Object.entries(sourceCounts)
    .map(([source, visits]) => ({ source, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // Device breakdown
  const deviceBreakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  events.forEach(e => {
    const device = e.deviceType || 'unknown';
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
  });

  return {
    pageViews,
    uniqueVisitors,
    funnelStarts,
    conversions,
    conversionRate: pageViews > 0 ? (conversions / pageViews) * 100 : 0,
    formSubmissions,
    topPages,
    topSources,
    deviceBreakdown,
  };
}

/**
 * Get partner-level analytics (all sites/funnels)
 */
export async function getPartnerAnalytics(
  partnerId: string,
  timeRange?: TimeRange
): Promise<{
  totalSites: number;
  totalFunnels: number;
  totalPageViews: number;
  totalConversions: number;
  siteMetrics: Array<{
    siteId: string;
    siteName: string;
    pageViews: number;
    conversions: number;
  }>;
}> {
  // Get all sites for this partner
  const sites = await prisma.sf_sites.findMany({
    where: { partnerId },
    select: { id: true, name: true, tenantId: true },
  });

  const funnels = await prisma.sf_funnels.findMany({
    where: { partnerId },
    select: { id: true },
  });

  // Get events for all these sites
  const siteIds = sites.map(s => s.id);
  
  const where: any = {
    siteId: { in: siteIds },
  };

  if (timeRange) {
    where.createdAt = {
      gte: timeRange.startDate,
      lte: timeRange.endDate,
    };
  }

  const events = await prisma.sf_analytics_events.findMany({ where });

  // Calculate per-site metrics
  const siteMetrics = sites.map(site => {
    const siteEvents = events.filter(e => e.siteId === site.id);
    return {
      siteId: site.id,
      siteName: site.name,
      pageViews: siteEvents.filter(e => e.eventType === 'page_view').length,
      conversions: siteEvents.filter(e => e.eventType === 'conversion').length,
    };
  });

  return {
    totalSites: sites.length,
    totalFunnels: funnels.length,
    totalPageViews: events.filter(e => e.eventType === 'page_view').length,
    totalConversions: events.filter(e => e.eventType === 'conversion').length,
    siteMetrics,
  };
}

/**
 * Get instance-level analytics (all tenants in instance)
 */
export async function getInstanceAnalytics(
  platformInstanceId: string,
  timeRange?: TimeRange
): Promise<{
  totalSites: number;
  totalFunnels: number;
  totalPageViews: number;
  totalConversions: number;
  totalFormSubmissions: number;
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    siteCount: number;
    pageViews: number;
  }>;
}> {
  // Get all sites for this instance
  const sites = await prisma.sf_sites.findMany({
    where: { platformInstanceId },
    select: { id: true, partnerId: true },
  });

  const funnels = await prisma.sf_funnels.findMany({
    where: { platformInstanceId },
    select: { id: true },
  });

  const where: any = { platformInstanceId };

  if (timeRange) {
    where.createdAt = {
      gte: timeRange.startDate,
      lte: timeRange.endDate,
    };
  }

  const events = await prisma.sf_analytics_events.findMany({ where });

  // Get partners
  const partnerIds = [...new Set(sites.map(s => s.partnerId))];
  const partners = await prisma.partner.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, name: true },
  });
  const partnerMap = new Map(partners.map(p => [p.id, p.name]));

  // Calculate per-partner metrics
  const partnerMetrics = new Map<string, { siteCount: number; pageViews: number }>();
  
  sites.forEach(site => {
    const current = partnerMetrics.get(site.partnerId) || { siteCount: 0, pageViews: 0 };
    current.siteCount++;
    partnerMetrics.set(site.partnerId, current);
  });

  events.forEach(event => {
    const site = sites.find(s => s.id === event.siteId);
    if (site && event.eventType === 'page_view') {
      const current = partnerMetrics.get(site.partnerId) || { siteCount: 0, pageViews: 0 };
      current.pageViews++;
      partnerMetrics.set(site.partnerId, current);
    }
  });

  const topPartners = Array.from(partnerMetrics.entries())
    .map(([partnerId, metrics]) => ({
      partnerId,
      partnerName: partnerMap.get(partnerId) || 'Unknown Partner',
      siteCount: metrics.siteCount,
      pageViews: metrics.pageViews,
    }))
    .sort((a, b) => b.pageViews - a.pageViews)
    .slice(0, 10);

  return {
    totalSites: sites.length,
    totalFunnels: funnels.length,
    totalPageViews: events.filter(e => e.eventType === 'page_view').length,
    totalConversions: events.filter(e => e.eventType === 'conversion').length,
    totalFormSubmissions: events.filter(e => e.eventType === 'form_submit').length,
    topPartners,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(
  siteId: string,
  tenantId: string,
  timeRange?: TimeRange
): Promise<string> {
  const where: any = { siteId, tenantId };

  if (timeRange) {
    where.createdAt = {
      gte: timeRange.startDate,
      lte: timeRange.endDate,
    };
  }

  const events = await prisma.sf_analytics_events.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV
  const headers = ['Timestamp', 'Event Type', 'Page ID', 'Visitor ID', 'Source', 'Device', 'Country'];
  const rows = events.map(e => [
    e.createdAt.toISOString(),
    e.eventType,
    e.pageId || '',
    e.visitorId || '',
    e.utmSource || 'direct',
    e.deviceType || 'unknown',
    e.country || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}
