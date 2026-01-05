/**
 * SITES & FUNNELS: Sites API
 * 
 * REST API for site management
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireSitesFunnelsEnabled, requirePartnerOwnership } from '@/lib/sites-funnels/entitlements-service';
import {
  createSite,
  getSite,
  listSites,
  updateSite,
  deleteSite,
  publishSite,
  unpublishSite,
  createPage,
  getPage,
  listPages,
  updatePage,
  deletePage,
  updatePageBlocks,
} from '@/lib/sites-funnels/site-service';
import { listTemplates, getTemplate, cloneSiteFromTemplate } from '@/lib/sites-funnels/template-service';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const tenantId = searchParams.get('tenantId') || session.activeTenantId;

  // Templates can be accessed without tenant (they're global)
  if (action === 'templates' || action === 'template') {
    try {
      if (action === 'templates') {
        const categorySlug = searchParams.get('category') || undefined;
        const industry = searchParams.get('industry') || undefined;
        const useCase = searchParams.get('useCase') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await listTemplates({ categorySlug, industry, useCase, search, page, limit });
        return NextResponse.json({ success: true, ...result });
      }

      if (action === 'template') {
        const templateId = searchParams.get('templateId');
        if (!templateId) {
          return NextResponse.json({ success: false, error: 'Template ID required' }, { status: 400 });
        }
        const template = await getTemplate(templateId);
        if (!template) {
          return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, template });
      }
    } catch (error: any) {
      console.error('Sites API templates error:', error);
      return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
    }
  }

  // All other actions require a tenant
  if (!tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'No active tenant. Please select a tenant from your partner dashboard to manage sites.',
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
        const status = searchParams.get('status') as any;
        const partnerId = searchParams.get('partnerId') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await listSites(tenantId, { status, partnerId, search, page, limit });
        return NextResponse.json({ success: true, ...result });
      }

      case 'get': {
        const siteId = searchParams.get('siteId');
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const site = await getSite(siteId, tenantId);
        if (!site) {
          return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, site });
      }

      case 'pages': {
        const siteId = searchParams.get('siteId');
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const pages = await listPages(siteId, tenantId);
        return NextResponse.json({ success: true, pages });
      }

      case 'page': {
        const pageId = searchParams.get('pageId');
        if (!pageId) {
          return NextResponse.json({ success: false, error: 'Page ID required' }, { status: 400 });
        }
        const page = await getPage(pageId, tenantId);
        if (!page) {
          return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, page });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Sites API GET error:', error);
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
      case 'create-site': {
        const { name, slug, description, platformInstanceId, templateId } = body;
        
        if (!name || !slug) {
          return NextResponse.json({ success: false, error: 'Name and slug required' }, { status: 400 });
        }

        // If template provided, clone from template
        if (templateId) {
          const result = await cloneSiteFromTemplate({
            templateId,
            tenantId,
            platformInstanceId,
            partnerId: partnerCheck.partnerId!,
            siteName: name,
            siteSlug: slug,
            createdBy: userId,
          });
          return NextResponse.json(result);
        }

        const result = await createSite({
          tenantId,
          platformInstanceId,
          partnerId: partnerCheck.partnerId!,
          name,
          slug,
          description,
          createdBy: userId,
        });
        return NextResponse.json(result);
      }

      case 'update-site': {
        const { siteId, ...updateData } = body;
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const result = await updateSite(siteId, tenantId, {
          ...updateData,
          updatedBy: userId,
        });
        return NextResponse.json(result);
      }

      case 'delete-site': {
        const { siteId } = body;
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const result = await deleteSite(siteId, tenantId);
        return NextResponse.json(result);
      }

      case 'publish-site': {
        const { siteId } = body;
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const result = await publishSite(siteId, tenantId, userId);
        return NextResponse.json(result);
      }

      case 'unpublish-site': {
        const { siteId } = body;
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const result = await unpublishSite(siteId, tenantId, userId);
        return NextResponse.json(result);
      }

      case 'create-page': {
        const { siteId, name, slug, pageType, templateId } = body;
        if (!siteId || !name || !slug) {
          return NextResponse.json({ success: false, error: 'Site ID, name, and slug required' }, { status: 400 });
        }
        const result = await createPage({
          tenantId,
          siteId,
          name,
          slug,
          pageType,
          createdBy: userId,
          templateId,
        });
        return NextResponse.json(result);
      }

      case 'update-page': {
        const { pageId, ...updateData } = body;
        if (!pageId) {
          return NextResponse.json({ success: false, error: 'Page ID required' }, { status: 400 });
        }
        const result = await updatePage(pageId, tenantId, {
          ...updateData,
          updatedBy: userId,
        });
        return NextResponse.json(result);
      }

      case 'update-page-blocks': {
        const { pageId, blocks } = body;
        if (!pageId || !blocks) {
          return NextResponse.json({ success: false, error: 'Page ID and blocks required' }, { status: 400 });
        }
        const result = await updatePageBlocks(pageId, tenantId, blocks, userId);
        return NextResponse.json(result);
      }

      case 'delete-page': {
        const { pageId } = body;
        if (!pageId) {
          return NextResponse.json({ success: false, error: 'Page ID required' }, { status: 400 });
        }
        const result = await deletePage(pageId, tenantId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Sites API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
