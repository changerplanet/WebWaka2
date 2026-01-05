/**
 * SITES & FUNNELS: Domains API
 * 
 * REST API for domain mapping and branding
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireSitesFunnelsEnabled } from '@/lib/sites-funnels/entitlements-service';
import { hasPermission } from '@/lib/sites-funnels/permissions-service';
import {
  addDomainMapping,
  listDomainMappings,
  removeDomainMapping,
  setPrimaryDomain,
  getDnsVerificationRecords,
  verifyDomain,
  getSiteBranding,
  updateSiteBranding,
} from '@/lib/sites-funnels/domain-service';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const tenantId = searchParams.get('tenantId') || session.activeTenantId;
  const siteId = searchParams.get('siteId');

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
      case 'list': {
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const domains = await listDomainMappings(siteId, tenantId);
        return NextResponse.json({ success: true, domains });
      }

      case 'dns-records': {
        const domain = searchParams.get('domain');
        if (!domain) {
          return NextResponse.json({ success: false, error: 'Domain required' }, { status: 400 });
        }
        const records = getDnsVerificationRecords(domain);
        return NextResponse.json({ success: true, records });
      }

      case 'branding': {
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }
        const branding = await getSiteBranding(siteId);
        return NextResponse.json({ success: true, branding });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Domains API GET error:', error);
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

    // Check permission for domain management
    const canManageDomains = await hasPermission(userId, tenantId, 'manage_domains');
    if (!canManageDomains) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    switch (action) {
      case 'add': {
        const { siteId, domain, subdomain, domainType, isPrimary } = body;
        
        if (!siteId || !domain) {
          return NextResponse.json({ success: false, error: 'Site ID and domain required' }, { status: 400 });
        }

        const result = await addDomainMapping(
          { siteId, domain, subdomain, domainType: domainType || 'custom', isPrimary },
          tenantId
        );
        return NextResponse.json(result);
      }

      case 'remove': {
        const { domainId } = body;
        if (!domainId) {
          return NextResponse.json({ success: false, error: 'Domain ID required' }, { status: 400 });
        }
        const result = await removeDomainMapping(domainId, tenantId);
        return NextResponse.json(result);
      }

      case 'set-primary': {
        const { domainId } = body;
        if (!domainId) {
          return NextResponse.json({ success: false, error: 'Domain ID required' }, { status: 400 });
        }
        const result = await setPrimaryDomain(domainId, tenantId);
        return NextResponse.json(result);
      }

      case 'verify': {
        const { domainId } = body;
        if (!domainId) {
          return NextResponse.json({ success: false, error: 'Domain ID required' }, { status: 400 });
        }
        const result = await verifyDomain(domainId, tenantId);
        return NextResponse.json(result);
      }

      case 'update-branding': {
        const { siteId, logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily } = body;
        
        if (!siteId) {
          return NextResponse.json({ success: false, error: 'Site ID required' }, { status: 400 });
        }

        const result = await updateSiteBranding(siteId, tenantId, {
          logoUrl,
          faviconUrl,
          primaryColor,
          secondaryColor,
          fontFamily,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Domains API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
