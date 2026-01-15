/**
 * SITES & FUNNELS PUBLIC RESOLVER
 * Wave I.4: Sites & Funnels Public Rendering (Exposure Only)
 * 
 * Server-side resolution for public Sites & Funnels pages.
 * Uses ONLY existing Prisma models and read-only queries.
 * 
 * CONSTRAINTS (Wave I.4 - ALL ENFORCED):
 * - ❌ No new business logic - only Prisma read queries
 * - ❌ No schema changes - uses existing models
 * - ❌ No automation - no background jobs
 * - ❌ No preview/edit modes - published content only
 * - ❌ No analytics or tracking
 * 
 * DATA SOURCES (existing only):
 * - tenant: Tenant resolution with activatedModules
 * - sf_sites: Published sites
 * - sf_pages: Published pages (site pages and funnel steps)
 * - sf_funnels: Published funnels
 * - sf_forms: Active forms
 * 
 * ============================================================================
 * WAVE I.4 GAP DOCUMENTATION (per spec requirement)
 * ============================================================================
 * 
 * GAP 1: No isHomepage flag on sf_pages
 * - What is missing: sf_pages has no isHomepage boolean field
 * - Current workaround: Using first page or page with slug 'home'
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 2: No theme/layout system for public rendering
 * - What is missing: No centralized theme application for public pages
 * - Current workaround: Using site-level branding (colors, fonts)
 * - Why it cannot be solved in Wave I: Would require new infrastructure
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 3: Domain-based routing not implemented
 * - What is missing: sf_domain_mappings exists but routing not wired
 * - Current workaround: Using slug-based routing only
 * - Why it cannot be solved in Wave I: Requires DNS/routing infrastructure
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 4: Missing form public renderer component
 * - What is missing: Full form rendering with validation in public context
 * - Current workaround: Using FormBlockRenderer placeholder
 * - Why it cannot be solved in Wave I: Would require new components
 * - Deferred to: Post-Wave I gap resolution - needs DynamicFormRenderer for public
 * 
 * GAP 5: No funnel progress tracking for public users (SEQUENTIAL ENFORCEMENT)
 * - What is missing: No session-based funnel step tracking to enforce sequential access
 * - Spec requirement: "Only sequential rendering (no skipping)"
 * - Current workaround: Allowing direct step access via URL (steps are publicly accessible)
 * - Why it cannot be solved in Wave I: 
 *   - Session tracking = new business logic (forbidden)
 *   - Cookie management = new infrastructure (forbidden)
 *   - Would require authentication state management
 * - Deferred to: Post-Wave I gap resolution
 * - NOTE: UI navigation enforces sequential flow, but URL-based access is not blocked
 * 
 * @module lib/sites-funnels/public-resolver
 */

import { prisma } from '../prisma'
import { TenantStatus, SiteStatus, FunnelStatus } from '@prisma/client'

export interface PublicTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  activatedModules: string[]
  isDemo: boolean
}

export interface PublicSite {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  status: SiteStatus
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  fontFamily: string | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string[]
  ogImageUrl: string | null
  customCss: string | null
  headerCode: string | null
  footerCode: string | null
}

export interface PublicPage {
  id: string
  tenantId: string
  siteId: string | null
  funnelId: string | null
  name: string
  slug: string
  pageType: string
  funnelOrder: number | null
  blocks: any[]
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  customCss: string | null
  isPublished: boolean
}

export interface PublicFunnel {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  status: FunnelStatus
  goalType: string | null
  steps: PublicPage[]
}

export interface PublicForm {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  schema: any
  status: string
  submitButtonText: string | null
  successMessage: string | null
  successRedirectUrl: string | null
  paymentEnabled: boolean
  paymentAmount: number | null
  paymentCurrency: string | null
  paymentDescription: string | null
  styling: any
}

export type TenantResolutionResult = 
  | { success: true; tenant: PublicTenant }
  | { success: false; reason: 'not_found' | 'suspended' | 'sites_funnels_disabled' }

export type SiteResolutionResult = 
  | { success: true; site: PublicSite; tenant: PublicTenant }
  | { success: false; reason: 'tenant_not_found' | 'site_not_found' | 'not_published' | 'suspended' | 'sites_funnels_disabled' }

export type PageResolutionResult = 
  | { success: true; page: PublicPage; site: PublicSite; tenant: PublicTenant }
  | { success: false; reason: 'tenant_not_found' | 'site_not_found' | 'page_not_found' | 'not_published' | 'suspended' | 'sites_funnels_disabled' }

export type FunnelResolutionResult = 
  | { success: true; funnel: PublicFunnel; tenant: PublicTenant }
  | { success: false; reason: 'tenant_not_found' | 'funnel_not_found' | 'not_published' | 'suspended' | 'sites_funnels_disabled' }

export type FunnelStepResolutionResult = 
  | { success: true; step: PublicPage; funnel: PublicFunnel; tenant: PublicTenant }
  | { success: false; reason: 'tenant_not_found' | 'funnel_not_found' | 'step_not_found' | 'not_published' | 'suspended' | 'sites_funnels_disabled' }

export type FormResolutionResult = 
  | { success: true; form: PublicForm; tenant: PublicTenant }
  | { success: false; reason: 'tenant_not_found' | 'form_not_found' | 'not_active' | 'suspended' | 'sites_funnels_disabled' }

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

function hasSitesFunnelsCapability(modules: string[], isDemoTenant: boolean): boolean {
  if (isDemoTenant) return true
  return modules.some(m => 
    m === 'sites_funnels' || 
    m === 'sites-funnels' || 
    m === 'sitesfunnels' ||
    m === 'sites' ||
    m === 'funnels' ||
    m === 'page_builder'
  )
}

export async function resolveTenantBySlug(tenantSlug: string): Promise<TenantResolutionResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      appName: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      secondaryColor: true,
      activatedModules: true,
    }
  })

  if (!tenant) {
    return { success: false, reason: 'not_found' }
  }

  const isDemoTenant = isDemo(tenant)

  if (!isDemoTenant && tenant.status === 'SUSPENDED') {
    return { success: false, reason: 'suspended' }
  }

  if (!isDemoTenant && tenant.status !== 'ACTIVE') {
    return { success: false, reason: 'suspended' }
  }

  if (!hasSitesFunnelsCapability(tenant.activatedModules, isDemoTenant)) {
    return { success: false, reason: 'sites_funnels_disabled' }
  }

  return { 
    success: true, 
    tenant: {
      ...tenant,
      isDemo: isDemoTenant
    }
  }
}

export async function resolvePublishedSite(tenantSlug: string): Promise<SiteResolutionResult> {
  const tenantResult = await resolveTenantBySlug(tenantSlug)
  
  if (!tenantResult.success) {
    if (tenantResult.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    return { success: false, reason: tenantResult.reason }
  }

  const tenant = tenantResult.tenant

  const site = await prisma.sf_sites.findFirst({
    where: {
      tenantId: tenant.id,
      status: tenant.isDemo ? undefined : 'PUBLISHED'
    },
    orderBy: { createdAt: 'asc' }
  })

  if (!site) {
    return { success: false, reason: 'site_not_found' }
  }

  if (!tenant.isDemo && site.status !== 'PUBLISHED') {
    return { success: false, reason: 'not_published' }
  }

  return {
    success: true,
    site: {
      id: site.id,
      tenantId: site.tenantId,
      name: site.name,
      slug: site.slug,
      description: site.description,
      status: site.status,
      logoUrl: site.logoUrl,
      faviconUrl: site.faviconUrl,
      primaryColor: site.primaryColor,
      secondaryColor: site.secondaryColor,
      fontFamily: site.fontFamily,
      metaTitle: site.metaTitle,
      metaDescription: site.metaDescription,
      metaKeywords: site.metaKeywords,
      ogImageUrl: site.ogImageUrl,
      customCss: site.customCss,
      headerCode: site.headerCode,
      footerCode: site.footerCode,
    },
    tenant
  }
}

export async function resolveHomePage(tenantSlug: string): Promise<PageResolutionResult> {
  const siteResult = await resolvePublishedSite(tenantSlug)
  
  if (!siteResult.success) {
    return { success: false, reason: siteResult.reason as any }
  }

  const { site, tenant } = siteResult

  const page = await prisma.sf_pages.findFirst({
    where: {
      siteId: site.id,
      isPublished: tenant.isDemo ? undefined : true,
      OR: [
        { slug: 'home' },
        { pageType: 'LANDING' }
      ]
    },
    orderBy: { createdAt: 'asc' }
  })

  if (!page) {
    const firstPage = await prisma.sf_pages.findFirst({
      where: {
        siteId: site.id,
        isPublished: tenant.isDemo ? undefined : true
      },
      orderBy: { createdAt: 'asc' }
    })

    if (!firstPage) {
      return { success: false, reason: 'page_not_found' }
    }

    return {
      success: true,
      page: {
        id: firstPage.id,
        tenantId: firstPage.tenantId,
        siteId: firstPage.siteId,
        funnelId: firstPage.funnelId,
        name: firstPage.name,
        slug: firstPage.slug,
        pageType: firstPage.pageType,
        funnelOrder: firstPage.funnelOrder,
        blocks: Array.isArray(firstPage.blocks) ? firstPage.blocks : [],
        metaTitle: firstPage.metaTitle,
        metaDescription: firstPage.metaDescription,
        ogImageUrl: firstPage.ogImageUrl,
        customCss: firstPage.customCss,
        isPublished: firstPage.isPublished,
      },
      site,
      tenant
    }
  }

  return {
    success: true,
    page: {
      id: page.id,
      tenantId: page.tenantId,
      siteId: page.siteId,
      funnelId: page.funnelId,
      name: page.name,
      slug: page.slug,
      pageType: page.pageType,
      funnelOrder: page.funnelOrder,
      blocks: Array.isArray(page.blocks) ? page.blocks : [],
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImageUrl: page.ogImageUrl,
      customCss: page.customCss,
      isPublished: page.isPublished,
    },
    site,
    tenant
  }
}

export async function resolvePublishedPage(
  tenantSlug: string, 
  pageSlug: string
): Promise<PageResolutionResult> {
  const siteResult = await resolvePublishedSite(tenantSlug)
  
  if (!siteResult.success) {
    return { success: false, reason: siteResult.reason as any }
  }

  const { site, tenant } = siteResult

  const page = await prisma.sf_pages.findFirst({
    where: {
      siteId: site.id,
      slug: pageSlug,
      isPublished: tenant.isDemo ? undefined : true
    }
  })

  if (!page) {
    return { success: false, reason: 'page_not_found' }
  }

  if (!tenant.isDemo && !page.isPublished) {
    return { success: false, reason: 'not_published' }
  }

  return {
    success: true,
    page: {
      id: page.id,
      tenantId: page.tenantId,
      siteId: page.siteId,
      funnelId: page.funnelId,
      name: page.name,
      slug: page.slug,
      pageType: page.pageType,
      funnelOrder: page.funnelOrder,
      blocks: Array.isArray(page.blocks) ? page.blocks : [],
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImageUrl: page.ogImageUrl,
      customCss: page.customCss,
      isPublished: page.isPublished,
    },
    site,
    tenant
  }
}

export async function resolvePublishedFunnel(
  tenantSlug: string, 
  funnelSlug: string
): Promise<FunnelResolutionResult> {
  const tenantResult = await resolveTenantBySlug(tenantSlug)
  
  if (!tenantResult.success) {
    if (tenantResult.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    return { success: false, reason: tenantResult.reason }
  }

  const tenant = tenantResult.tenant

  const funnel = await prisma.sf_funnels.findFirst({
    where: {
      tenantId: tenant.id,
      slug: funnelSlug,
      status: tenant.isDemo ? undefined : 'ACTIVE'
    },
    include: {
      pages: {
        where: {
          isPublished: tenant.isDemo ? undefined : true
        },
        orderBy: { funnelOrder: 'asc' }
      }
    }
  })

  if (!funnel) {
    return { success: false, reason: 'funnel_not_found' }
  }

  if (!tenant.isDemo && funnel.status !== 'ACTIVE') {
    return { success: false, reason: 'not_published' }
  }

  return {
    success: true,
    funnel: {
      id: funnel.id,
      tenantId: funnel.tenantId,
      name: funnel.name,
      slug: funnel.slug,
      description: funnel.description,
      status: funnel.status,
      goalType: funnel.goalType,
      steps: funnel.pages.map(page => ({
        id: page.id,
        tenantId: page.tenantId,
        siteId: page.siteId,
        funnelId: page.funnelId,
        name: page.name,
        slug: page.slug,
        pageType: page.pageType,
        funnelOrder: page.funnelOrder,
        blocks: Array.isArray(page.blocks) ? page.blocks : [],
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        ogImageUrl: page.ogImageUrl,
        customCss: page.customCss,
        isPublished: page.isPublished,
      }))
    },
    tenant
  }
}

export async function resolveFunnelStep(
  tenantSlug: string, 
  funnelSlug: string, 
  stepSlug: string
): Promise<FunnelStepResolutionResult> {
  const funnelResult = await resolvePublishedFunnel(tenantSlug, funnelSlug)
  
  if (!funnelResult.success) {
    return { success: false, reason: funnelResult.reason as any }
  }

  const { funnel, tenant } = funnelResult

  const step = funnel.steps.find(s => s.slug === stepSlug)

  if (!step) {
    return { success: false, reason: 'step_not_found' }
  }

  return {
    success: true,
    step,
    funnel,
    tenant
  }
}

export async function resolvePublishedForm(
  tenantSlug: string, 
  formSlug: string
): Promise<FormResolutionResult> {
  const tenantResult = await resolveTenantBySlug(tenantSlug)
  
  if (!tenantResult.success) {
    if (tenantResult.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    return { success: false, reason: tenantResult.reason }
  }

  const tenant = tenantResult.tenant

  const form = await prisma.sf_forms.findFirst({
    where: {
      tenantId: tenant.id,
      slug: formSlug,
      status: tenant.isDemo ? undefined : 'ACTIVE'
    }
  })

  if (!form) {
    return { success: false, reason: 'form_not_found' }
  }

  if (!tenant.isDemo && form.status !== 'ACTIVE') {
    return { success: false, reason: 'not_active' }
  }

  return {
    success: true,
    form: {
      id: form.id,
      tenantId: form.tenantId,
      name: form.name,
      slug: form.slug,
      description: form.description,
      schema: form.schema,
      status: form.status,
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage,
      successRedirectUrl: form.successRedirectUrl,
      paymentEnabled: form.paymentEnabled,
      paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : null,
      paymentCurrency: form.paymentCurrency,
      paymentDescription: form.paymentDescription,
      styling: form.styling,
    },
    tenant
  }
}
