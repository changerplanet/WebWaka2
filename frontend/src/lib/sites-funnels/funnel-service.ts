/**
 * SITES & FUNNELS: Funnel Service
 * 
 * Funnel management operations:
 * - Funnel = ordered pages with conversion goals
 * - Analytics hooks
 * - CRM integration (optional)
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { FunnelStatus, PageType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { canCreateFunnel, requireSitesFunnelsEnabled } from './entitlements-service';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateFunnelInput {
  tenantId: string;
  platformInstanceId?: string;
  partnerId: string;
  siteId?: string;
  name: string;
  slug: string;
  description?: string;
  goalType?: string;
  goalValue?: number;
  createdBy: string;
}

export interface UpdateFunnelInput {
  name?: string;
  description?: string;
  goalType?: string;
  goalValue?: number;
  settings?: any;
  updatedBy: string;
}

export interface AddFunnelStepInput {
  tenantId: string;
  funnelId: string;
  name: string;
  slug: string;
  pageType?: PageType;
  createdBy: string;
  templateId?: string;
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export const FUNNEL_GOAL_TYPES = {
  LEAD: { key: 'lead', name: 'Lead Capture', description: 'Capture contact information' },
  BOOKING: { key: 'booking', name: 'Appointment Booking', description: 'Schedule appointments' },
  PURCHASE: { key: 'purchase', name: 'Product Purchase', description: 'Complete a sale' },
  SIGNUP: { key: 'signup', name: 'Account Signup', description: 'Create an account' },
  DOWNLOAD: { key: 'download', name: 'Download', description: 'Download a resource' },
  WEBINAR: { key: 'webinar', name: 'Webinar Registration', description: 'Register for webinar' },
  CUSTOM: { key: 'custom', name: 'Custom Goal', description: 'Custom conversion goal' },
} as const;

// ============================================================================
// FUNNEL CRUD
// ============================================================================

/**
 * Create a new funnel
 */
export async function createFunnel(input: CreateFunnelInput): Promise<{
  success: boolean;
  funnel?: any;
  error?: string;
}> {
  try {
    const { tenantId, platformInstanceId, partnerId, siteId, name, slug, description, goalType, goalValue, createdBy } = input;

    // Check entitlement
    const entitlementCheck = await requireSitesFunnelsEnabled(tenantId);
    if (!entitlementCheck.authorized) {
      return { success: false, error: entitlementCheck.error };
    }

    // Check quota
    const quotaCheck = await canCreateFunnel(tenantId);
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.reason };
    }

    // Check slug uniqueness
    const existingFunnel = await prisma.sf_funnels.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (existingFunnel) {
      return { success: false, error: 'Funnel slug already exists' };
    }

    // Create funnel
    const funnel = await prisma.sf_funnels.create({
      data: {
        id: randomUUID(),
        tenantId,
        platformInstanceId,
        partnerId,
        siteId,
        name,
        slug,
        description,
        status: 'DRAFT',
        goalType,
        goalValue: goalValue ? goalValue : undefined,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create default first step
    await prisma.sf_pages.create({
      data: {
        id: randomUUID(),
        tenantId,
        funnelId: funnel.id,
        name: 'Step 1: Landing',
        slug: 'step-1',
        pageType: 'FUNNEL_STEP',
        funnelOrder: 1,
        blocks: [],
        isPublished: false,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return { success: true, funnel };
  } catch (error: any) {
    console.error('Create funnel error:', error);
    return { success: false, error: error.message || 'Failed to create funnel' };
  }
}

/**
 * Get funnel by ID
 */
export async function getFunnel(funnelId: string, tenantId: string): Promise<any | null> {
  return prisma.sf_funnels.findFirst({
    where: { id: funnelId, tenantId },
    include: {
      pages: {
        orderBy: { funnelOrder: 'asc' },
      },
    },
  });
}

/**
 * List funnels for a tenant
 */
export async function listFunnels(
  tenantId: string,
  options: {
    status?: FunnelStatus;
    partnerId?: string;
    siteId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  funnels: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { status, partnerId, siteId, search, page = 1, limit = 20 } = options;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;
  if (siteId) where.siteId = siteId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [funnels, total] = await Promise.all([
    prisma.sf_funnels.findMany({
      where,
      include: {
        _count: { select: { pages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sf_funnels.count({ where }),
  ]);

  return {
    funnels,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update a funnel
 */
export async function updateFunnel(
  funnelId: string,
  tenantId: string,
  input: UpdateFunnelInput
): Promise<{ success: boolean; funnel?: any; error?: string }> {
  try {
    const funnel = await prisma.sf_funnels.findFirst({
      where: { id: funnelId, tenantId },
    });

    if (!funnel) {
      return { success: false, error: 'Funnel not found' };
    }

    const updated = await prisma.sf_funnels.update({
      where: { id: funnelId },
      data: {
        name: input.name,
        description: input.description,
        goalType: input.goalType,
        goalValue: input.goalValue,
        settings: input.settings,
        updatedBy: input.updatedBy,
        updatedAt: new Date(),
      },
    });

    return { success: true, funnel: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update funnel' };
  }
}

/**
 * Delete a funnel
 */
export async function deleteFunnel(
  funnelId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const funnel = await prisma.sf_funnels.findFirst({
      where: { id: funnelId, tenantId },
    });

    if (!funnel) {
      return { success: false, error: 'Funnel not found' };
    }

    await prisma.sf_funnels.delete({
      where: { id: funnelId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete funnel' };
  }
}

// ============================================================================
// FUNNEL STEPS
// ============================================================================

/**
 * Add a step to a funnel
 */
export async function addFunnelStep(input: AddFunnelStepInput): Promise<{
  success: boolean;
  page?: any;
  error?: string;
}> {
  try {
    const { tenantId, funnelId, name, slug, pageType, createdBy } = input;

    // Verify funnel exists
    const funnel = await prisma.sf_funnels.findFirst({
      where: { id: funnelId, tenantId },
      include: { pages: true },
    });
    if (!funnel) {
      return { success: false, error: 'Funnel not found' };
    }

    // Check slug uniqueness within funnel
    const existingPage = await prisma.sf_pages.findUnique({
      where: { funnelId_slug: { funnelId, slug } },
    });
    if (existingPage) {
      return { success: false, error: 'Step slug already exists in this funnel' };
    }

    // Get next order
    const nextOrder = funnel.pages.length + 1;

    const page = await prisma.sf_pages.create({
      data: {
        id: randomUUID(),
        tenantId,
        funnelId,
        name,
        slug,
        pageType: pageType || 'FUNNEL_STEP',
        funnelOrder: nextOrder,
        blocks: [],
        isPublished: false,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return { success: true, page };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add funnel step' };
  }
}

/**
 * Reorder funnel steps
 */
export async function reorderFunnelSteps(
  funnelId: string,
  tenantId: string,
  stepOrder: string[] // Array of page IDs in new order
): Promise<{ success: boolean; error?: string }> {
  try {
    const funnel = await prisma.sf_funnels.findFirst({
      where: { id: funnelId, tenantId },
    });

    if (!funnel) {
      return { success: false, error: 'Funnel not found' };
    }

    // Update order for each step
    for (let i = 0; i < stepOrder.length; i++) {
      await prisma.sf_pages.update({
        where: { id: stepOrder[i] },
        data: { funnelOrder: i + 1 },
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reorder steps' };
  }
}

// ============================================================================
// FUNNEL STATUS
// ============================================================================

/**
 * Activate a funnel
 */
export async function activateFunnel(
  funnelId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const funnel = await prisma.sf_funnels.findFirst({
      where: { id: funnelId, tenantId },
      include: { pages: true },
    });

    if (!funnel) {
      return { success: false, error: 'Funnel not found' };
    }

    if (funnel.pages.length === 0) {
      return { success: false, error: 'Cannot activate funnel with no steps' };
    }

    await prisma.sf_funnels.update({
      where: { id: funnelId },
      data: {
        status: 'ACTIVE',
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Publish all pages
    await prisma.sf_pages.updateMany({
      where: { funnelId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to activate funnel' };
  }
}

/**
 * Pause a funnel
 */
export async function pauseFunnel(
  funnelId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sf_funnels.update({
      where: { id: funnelId },
      data: {
        status: 'PAUSED',
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to pause funnel' };
  }
}

// ============================================================================
// FUNNEL ANALYTICS
// ============================================================================

/**
 * Track funnel event
 */
export async function trackFunnelEvent(
  funnelId: string,
  eventType: 'funnel_start' | 'funnel_step' | 'funnel_complete' | 'form_submit',
  data: {
    tenantId: string;
    platformInstanceId?: string;
    pageId?: string;
    visitorId?: string;
    sessionId?: string;
    eventData?: any;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceType?: string;
    browser?: string;
    country?: string;
  }
): Promise<void> {
  try {
    await prisma.sf_analytics_events.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        platformInstanceId: data.platformInstanceId,
        eventType,
        funnelId,
        pageId: data.pageId,
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        eventData: data.eventData,
        referrer: data.referrer,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        deviceType: data.deviceType,
        browser: data.browser,
        country: data.country,
      },
    });

    // Update funnel stats
    if (eventType === 'funnel_start') {
      await prisma.sf_funnels.update({
        where: { id: funnelId },
        data: { totalVisitors: { increment: 1 } },
      });
    } else if (eventType === 'funnel_complete') {
      const funnel = await prisma.sf_funnels.findUnique({ where: { id: funnelId } });
      if (funnel) {
        const newConversions = funnel.totalConversions + 1;
        const newRate = funnel.totalVisitors > 0 
          ? (newConversions / funnel.totalVisitors) * 100 
          : 0;
        
        await prisma.sf_funnels.update({
          where: { id: funnelId },
          data: {
            totalConversions: newConversions,
            conversionRate: newRate,
          },
        });
      }
    }
  } catch (error) {
    console.error('Track funnel event error:', error);
  }
}

/**
 * Get funnel analytics
 */
export async function getFunnelAnalytics(
  funnelId: string,
  tenantId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  overview: {
    totalVisitors: number;
    totalConversions: number;
    conversionRate: number;
  };
  stepMetrics: Array<{
    pageId: string;
    pageName: string;
    views: number;
    dropOff: number;
    dropOffRate: number;
  }>;
  sources: Record<string, number>;
}> {
  const funnel = await prisma.sf_funnels.findFirst({
    where: { id: funnelId, tenantId },
    include: { pages: { orderBy: { funnelOrder: 'asc' } } },
  });

  if (!funnel) {
    return {
      overview: { totalVisitors: 0, totalConversions: 0, conversionRate: 0 },
      stepMetrics: [],
      sources: {},
    };
  }

  const where: any = { funnelId, tenantId };
  if (options.startDate) where.createdAt = { gte: options.startDate };
  if (options.endDate) {
    where.createdAt = { ...where.createdAt, lte: options.endDate };
  }

  const events = await prisma.sf_analytics_events.findMany({ where });

  // Calculate step metrics
  const stepMetrics = funnel.pages.map((page, index) => {
    const pageViews = events.filter(
      e => e.pageId === page.id && e.eventType === 'funnel_step'
    ).length;
    
    const previousViews = index === 0 
      ? events.filter(e => e.eventType === 'funnel_start').length
      : events.filter(
          e => e.pageId === funnel.pages[index - 1].id && e.eventType === 'funnel_step'
        ).length;
    
    const dropOff = previousViews - pageViews;
    const dropOffRate = previousViews > 0 ? (dropOff / previousViews) * 100 : 0;

    return {
      pageId: page.id,
      pageName: page.name,
      views: pageViews,
      dropOff,
      dropOffRate,
    };
  });

  // Calculate traffic sources
  const sources: Record<string, number> = {};
  events.forEach(e => {
    const source = e.utmSource || 'direct';
    sources[source] = (sources[source] || 0) + 1;
  });

  return {
    overview: {
      totalVisitors: funnel.totalVisitors,
      totalConversions: funnel.totalConversions,
      conversionRate: Number(funnel.conversionRate) || 0,
    },
    stepMetrics,
    sources,
  };
}
