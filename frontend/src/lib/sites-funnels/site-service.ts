/**
 * SITES & FUNNELS: Site Service
 * 
 * Core site management operations:
 * - Create, read, update, delete sites
 * - Publish/unpublish
 * - Page management
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { SiteStatus, PageType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { canCreateSite, requirePartnerOwnership, requireSitesFunnelsEnabled } from './entitlements-service';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateSiteInput {
  tenantId: string;
  platformInstanceId?: string;
  partnerId: string;
  name: string;
  slug: string;
  description?: string;
  createdBy: string;
  templateId?: string;
}

export interface UpdateSiteInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  customCss?: string;
  headerCode?: string;
  footerCode?: string;
  settings?: any;
  updatedBy: string;
}

export interface CreatePageInput {
  tenantId: string;
  siteId: string;
  name: string;
  slug: string;
  pageType?: PageType;
  createdBy: string;
  templateId?: string;
}

export interface UpdatePageInput {
  name?: string;
  slug?: string;
  pageType?: PageType;
  blocks?: any[];
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  customCss?: string;
  settings?: any;
  updatedBy: string;
}

// ============================================================================
// SITE CRUD
// ============================================================================

/**
 * Create a new site
 */
export async function createSite(input: CreateSiteInput): Promise<{
  success: boolean;
  site?: any;
  error?: string;
}> {
  try {
    const { tenantId, platformInstanceId, partnerId, name, slug, description, createdBy } = input;

    // Check entitlement
    const entitlementCheck = await requireSitesFunnelsEnabled(tenantId);
    if (!entitlementCheck.authorized) {
      return { success: false, error: entitlementCheck.error };
    }

    // Check quota
    const quotaCheck = await canCreateSite(tenantId);
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.reason };
    }

    // Check slug uniqueness
    const existingSite = await prisma.sf_sites.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (existingSite) {
      return { success: false, error: 'Site slug already exists' };
    }

    // Create site
    const site = await prisma.sf_sites.create({
      data: {
        id: randomUUID(),
        tenantId,
        platformInstanceId,
        partnerId,
        name,
        slug,
        description,
        status: 'DRAFT',
        metaTitle: name,
        metaDescription: description,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create default home page
    await prisma.sf_pages.create({
      data: {
        id: randomUUID(),
        tenantId,
        siteId: site.id,
        name: 'Home',
        slug: 'home',
        pageType: 'LANDING',
        blocks: [],
        isPublished: false,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return { success: true, site };
  } catch (error: any) {
    console.error('Create site error:', error);
    return { success: false, error: error.message || 'Failed to create site' };
  }
}

/**
 * Get site by ID
 */
export async function getSite(siteId: string, tenantId: string): Promise<any | null> {
  return prisma.sf_sites.findFirst({
    where: { id: siteId, tenantId },
    include: {
      pages: {
        orderBy: { createdAt: 'asc' },
      },
      domainMappings: true,
    },
  });
}

/**
 * List sites for a tenant
 */
export async function listSites(
  tenantId: string,
  options: {
    status?: SiteStatus;
    partnerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  sites: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { status, partnerId, search, page = 1, limit = 20 } = options;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [sites, total] = await Promise.all([
    prisma.sf_sites.findMany({
      where,
      include: {
        _count: { select: { pages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sf_sites.count({ where }),
  ]);

  return {
    sites,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update a site
 */
export async function updateSite(
  siteId: string,
  tenantId: string,
  input: UpdateSiteInput
): Promise<{ success: boolean; site?: any; error?: string }> {
  try {
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    const updated = await prisma.sf_sites.update({
      where: { id: siteId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    return { success: true, site: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update site' };
  }
}

/**
 * Delete a site
 */
export async function deleteSite(
  siteId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    // Cascade delete handled by Prisma
    await prisma.sf_sites.delete({
      where: { id: siteId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete site' };
  }
}

// ============================================================================
// PUBLISH / UNPUBLISH
// ============================================================================

/**
 * Publish a site
 */
export async function publishSite(
  siteId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
      include: { pages: true },
    });

    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    if (site.pages.length === 0) {
      return { success: false, error: 'Cannot publish site with no pages' };
    }

    await prisma.sf_sites.update({
      where: { id: siteId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Publish all pages
    await prisma.sf_pages.updateMany({
      where: { siteId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to publish site' };
  }
}

/**
 * Unpublish a site
 */
export async function unpublishSite(
  siteId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sf_sites.update({
      where: { id: siteId },
      data: {
        status: 'UNPUBLISHED',
        unpublishedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Unpublish all pages
    await prisma.sf_pages.updateMany({
      where: { siteId },
      data: { isPublished: false },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unpublish site' };
  }
}

// ============================================================================
// PAGE CRUD
// ============================================================================

/**
 * Create a page
 */
export async function createPage(input: CreatePageInput): Promise<{
  success: boolean;
  page?: any;
  error?: string;
}> {
  try {
    const { tenantId, siteId, name, slug, pageType, createdBy } = input;

    // Verify site exists
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    // Check slug uniqueness within site
    const existingPage = await prisma.sf_pages.findUnique({
      where: { siteId_slug: { siteId, slug } },
    });
    if (existingPage) {
      return { success: false, error: 'Page slug already exists in this site' };
    }

    const page = await prisma.sf_pages.create({
      data: {
        id: randomUUID(),
        tenantId,
        siteId,
        name,
        slug,
        pageType: pageType || 'CONTENT',
        blocks: [],
        isPublished: false,
        createdBy,
        updatedBy: createdBy,
      },
    });

    return { success: true, page };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create page' };
  }
}

/**
 * Get page by ID
 */
export async function getPage(pageId: string, tenantId: string): Promise<any | null> {
  return prisma.sf_pages.findFirst({
    where: { id: pageId, tenantId },
    include: {
      pageBlocks: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

/**
 * List pages for a site
 */
export async function listPages(
  siteId: string,
  tenantId: string
): Promise<any[]> {
  return prisma.sf_pages.findMany({
    where: { siteId, tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Update a page
 */
export async function updatePage(
  pageId: string,
  tenantId: string,
  input: UpdatePageInput
): Promise<{ success: boolean; page?: any; error?: string }> {
  try {
    const page = await prisma.sf_pages.findFirst({
      where: { id: pageId, tenantId },
    });

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    const updated = await prisma.sf_pages.update({
      where: { id: pageId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    return { success: true, page: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update page' };
  }
}

/**
 * Delete a page
 */
export async function deletePage(
  pageId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const page = await prisma.sf_pages.findFirst({
      where: { id: pageId, tenantId },
    });

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    await prisma.sf_pages.delete({
      where: { id: pageId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete page' };
  }
}

// ============================================================================
// PAGE BLOCKS
// ============================================================================

/**
 * Update page blocks
 */
export async function updatePageBlocks(
  pageId: string,
  tenantId: string,
  blocks: any[],
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const page = await prisma.sf_pages.findFirst({
      where: { id: pageId, tenantId },
    });

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    // Delete existing blocks
    await prisma.sf_page_blocks.deleteMany({
      where: { pageId },
    });

    // Create new blocks
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      await prisma.sf_page_blocks.create({
        data: {
          id: randomUUID(),
          pageId,
          blockType: block.type || 'section',
          name: block.name || `Block ${i + 1}`,
          content: block.content || {},
          styles: block.styles || {},
          settings: block.settings || {},
          sortOrder: i,
          isVisible: block.isVisible !== false,
        },
      });
    }

    // Update page's blocks JSON
    await prisma.sf_pages.update({
      where: { id: pageId },
      data: {
        blocks,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update blocks' };
  }
}
