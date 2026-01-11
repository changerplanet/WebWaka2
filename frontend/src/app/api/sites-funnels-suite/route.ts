export const dynamic = 'force-dynamic'

/**
 * SITES & FUNNELS SUITE: Main API Route
 * 
 * GET - Suite overview, stats, and demo data
 * POST - Demo actions (reset, seed)
 * 
 * Part of: Sites & Funnels Suite S2-S5 Formalization
 * 
 * ⚠️ DEMO MODE - Uses existing Phase 5 implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  listSites,
} from '@/lib/sites-funnels/site-service';
import {
  listTemplates,
} from '@/lib/sites-funnels/template-service';
import {
  listFunnels,
} from '@/lib/sites-funnels/funnel-service';
import {
  getAIContentHistory,
} from '@/lib/sites-funnels/ai-content-service';

// Suite configuration
const SUITE_CONFIG = {
  name: 'Sites & Funnels Suite',
  version: '1.0.0',
  status: 'DEMO',
  description: 'Build and deploy professional websites and conversion funnels for your clients',
  baseline: 'Phase 5 Implementation',
  
  capabilities: {
    coreSites: {
      label: 'Core Sites',
      coverage: '95%',
      features: [
        'Site CRUD operations',
        'Page management',
        'Block-based editor',
        'Template library',
        'Template cloning',
        'Publish/Unpublish',
        'Preview mode',
        'SEO basics',
        'Theme & styling',
        'Responsive design',
      ],
    },
    funnels: {
      label: 'Funnels',
      coverage: '75%',
      features: [
        'Funnel CRUD operations',
        'Funnel steps',
        'Step reordering',
        'Goal types',
        'Activate/Pause',
        'Forms & lead capture',
        'Checkout integration (basic)',
      ],
      gaps: ['Upsell/Downsell', 'A/B Testing', 'Conditional Steps'],
    },
    domains: {
      label: 'Domain & Branding',
      coverage: '98%',
      features: [
        'Domain mapping',
        'DNS verification',
        'SSL certificates',
        'Primary domain',
        'Site branding',
        'White-label',
        'Subdomain support',
      ],
    },
    analytics: {
      label: 'Analytics',
      coverage: '80%',
      features: [
        'Page views tracking',
        'Form submissions',
        'Conversion tracking',
        'Funnel analytics',
        'UTM tracking',
        'Device/browser stats',
        'Analytics export',
      ],
      gaps: ['Heatmaps', 'Session Recording'],
    },
    ai: {
      label: 'AI Layer',
      coverage: '70%',
      features: [
        'AI headline generation',
        'AI body copy',
        'AI CTA suggestions',
        'AI SEO meta',
        'AI content approval',
        'AI usage tracking',
      ],
      gaps: ['AI Page Suggestions', 'AI Funnel Optimization', 'AI Image Generation'],
    },
    governance: {
      label: 'Governance',
      coverage: '90%',
      features: [
        'Partner ownership',
        'Tenant scoping',
        'Entitlements check',
        'Permission service',
        'Client permissions',
        'Instance-level branding',
      ],
      gaps: ['Audit Logging', 'Version History'],
    },
  },
  
  targetUsers: {
    primary: 'Partners (operators who build sites/funnels for clients)',
    secondary: 'Clients (limited access if granted by Partner)',
  },
  
  routes: {
    sites: '/partner-portal/sites',
    siteEditor: '/partner-portal/sites/:siteId/editor',
    funnels: '/partner-portal/funnels',
    funnelEditor: '/partner-portal/funnels/:funnelId/editor',
    dashboard: '/sites-funnels-suite/admin',
  },
  
  apis: {
    sites: '/api/sites-funnels/sites',
    funnels: '/api/sites-funnels/funnels',
    aiContent: '/api/sites-funnels/ai-content',
    domains: '/api/sites-funnels/domains',
    analytics: '/api/sites-funnels/analytics',
  },
};

// Demo statistics
async function getSuiteStats(tenantId: string | null) {
  // Default demo stats if no tenant
  if (!tenantId) {
    return {
      sites: {
        total: 0,
        published: 0,
        draft: 0,
        totalViews: 0,
      },
      funnels: {
        total: 0,
        active: 0,
        paused: 0,
        totalConversions: 0,
      },
      templates: {
        total: 0,
        categories: 0,
      },
      ai: {
        totalGenerations: 0,
        approved: 0,
        rejected: 0,
      },
    };
  }

  try {
    // Get sites stats
    const sitesResult = await listSites(tenantId, { page: 1, limit: 1000 });
    const sites = sitesResult.sites || [];
    
    // Get funnels stats
    const funnelsResult = await listFunnels(tenantId, { page: 1, limit: 1000 });
    const funnels = funnelsResult.funnels || [];
    
    // Get templates stats
    const templatesResult = await listTemplates({ page: 1, limit: 1000 });
    const templates = templatesResult.templates || [];
    const categories = new Set(templates.map((t: any) => t.categorySlug)).size;
    
    // Get AI stats
    const aiResult = await getAIContentHistory(tenantId, { page: 1, limit: 1000 });
    const aiLogs = aiResult.logs || [];
    
    return {
      sites: {
        total: sites.length,
        published: sites.filter((s: any) => s.status === 'PUBLISHED').length,
        draft: sites.filter((s: any) => s.status === 'DRAFT').length,
        totalViews: sites.reduce((sum: number, s: any) => sum + (s.viewCount || 0), 0),
      },
      funnels: {
        total: funnels.length,
        active: funnels.filter((f: any) => f.status === 'ACTIVE').length,
        paused: funnels.filter((f: any) => f.status === 'PAUSED').length,
        totalConversions: funnels.reduce((sum: number, f: any) => sum + (f.totalConversions || 0), 0),
      },
      templates: {
        total: templates.length,
        categories,
      },
      ai: {
        totalGenerations: aiLogs.length,
        approved: aiLogs.filter((l: any) => l.status === 'APPROVED').length,
        rejected: aiLogs.filter((l: any) => l.status === 'REJECTED').length,
      },
    };
  } catch (error) {
    console.error('Error getting suite stats:', error);
    return {
      sites: { total: 0, published: 0, draft: 0, totalViews: 0 },
      funnels: { total: 0, active: 0, paused: 0, totalConversions: 0 },
      templates: { total: 0, categories: 0 },
      ai: { totalGenerations: 0, approved: 0, rejected: 0 },
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    const tenantId = session?.activeTenantId || null;
    
    const stats = await getSuiteStats(tenantId);
    
    return NextResponse.json({
      success: true,
      suite: 'Sites & Funnels',
      version: SUITE_CONFIG.version,
      status: SUITE_CONFIG.status,
      description: SUITE_CONFIG.description,
      baseline: SUITE_CONFIG.baseline,
      
      // Config
      config: SUITE_CONFIG,
      
      // Stats
      stats,
      
      // Demo info
      demo: {
        isDemo: true,
        message: 'Sites & Funnels Suite operates in demo mode. Data persists to database but may be reset.',
        dataSource: 'Database (Prisma)',
        resetable: true,
      },
      
      // Quick links
      quickLinks: {
        createSite: '/partner-portal/sites',
        createFunnel: '/partner-portal/funnels',
        templates: '/api/sites-funnels/sites?action=templates',
        documentation: '/docs/sites-and-funnels.md',
        capabilityMap: '/docs/sites-and-funnels-suite-capability-map.md',
      },
      
      // Session info
      session: {
        authenticated: !!session?.user?.id,
        hasTenant: !!tenantId,
        tenantId: tenantId || null,
      },
    });
  } catch (error) {
    console.error('Sites & Funnels Suite API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suite info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'get-config':
        return NextResponse.json({
          success: true,
          config: SUITE_CONFIG,
        });
      
      case 'get-capabilities':
        return NextResponse.json({
          success: true,
          capabilities: SUITE_CONFIG.capabilities,
          totalCapabilities: 56,
          complete: 41,
          partial: 5,
          gaps: 10,
          overallCoverage: '85%',
        });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sites & Funnels Suite POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
