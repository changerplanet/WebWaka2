/**
 * SITES & FUNNELS: Template Service
 * 
 * Template management with industry taxonomy:
 * Industry → Use Case → Page Type
 * 
 * Templates are READ-ONLY. Cloning creates editable Site/Page copies.
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { PageType } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  icon?: string;
  templateCount?: number;
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  previewImageUrl?: string;
  thumbnailUrl?: string;
  industry?: string;
  useCase?: string;
  pageType: PageType;
  blocks: any[];
  styles?: any;
  settings?: any;
  version: string;
  isPremium: boolean;
  category?: TemplateCategory;
}

export interface TemplateBlock {
  id: string;
  type: string;
  name: string;
  content: any;
  styles?: any;
  settings?: any;
}

// ============================================================================
// INDUSTRY TAXONOMY
// ============================================================================

export const INDUSTRIES = {
  RETAIL: { key: 'retail', name: 'Retail & E-commerce', icon: 'shopping-bag' },
  HEALTHCARE: { key: 'healthcare', name: 'Healthcare', icon: 'heart-pulse' },
  EDUCATION: { key: 'education', name: 'Education', icon: 'graduation-cap' },
  HOSPITALITY: { key: 'hospitality', name: 'Hospitality', icon: 'hotel' },
  PROFESSIONAL: { key: 'professional', name: 'Professional Services', icon: 'briefcase' },
  TECHNOLOGY: { key: 'technology', name: 'Technology', icon: 'cpu' },
  REAL_ESTATE: { key: 'real_estate', name: 'Real Estate', icon: 'building' },
  FITNESS: { key: 'fitness', name: 'Fitness & Wellness', icon: 'dumbbell' },
  FOOD: { key: 'food', name: 'Food & Restaurant', icon: 'utensils' },
  BEAUTY: { key: 'beauty', name: 'Beauty & Spa', icon: 'sparkles' },
  GENERAL: { key: 'general', name: 'General Purpose', icon: 'layout' },
} as const;

export const USE_CASES = {
  LEAD_GENERATION: { key: 'lead_generation', name: 'Lead Generation', description: 'Capture leads with forms and CTAs' },
  PRODUCT_SHOWCASE: { key: 'product_showcase', name: 'Product Showcase', description: 'Highlight products or services' },
  BOOKING: { key: 'booking', name: 'Appointment Booking', description: 'Schedule appointments or consultations' },
  EVENT: { key: 'event', name: 'Event Registration', description: 'Promote and register for events' },
  PORTFOLIO: { key: 'portfolio', name: 'Portfolio', description: 'Showcase work and projects' },
  SALES: { key: 'sales', name: 'Sales Funnel', description: 'Multi-step sales process' },
  WEBINAR: { key: 'webinar', name: 'Webinar Registration', description: 'Promote and register for webinars' },
  DOWNLOAD: { key: 'download', name: 'Download/Opt-in', description: 'Offer downloadable resources' },
  COMING_SOON: { key: 'coming_soon', name: 'Coming Soon', description: 'Pre-launch landing pages' },
  THANK_YOU: { key: 'thank_you', name: 'Thank You', description: 'Post-conversion thank you pages' },
} as const;

// ============================================================================
// TEMPLATE REGISTRY (Seed Data)
// ============================================================================

export async function seedTemplateCategories(): Promise<void> {
  const categories = [
    { name: 'Landing Pages', slug: 'landing-pages', description: 'High-converting landing page templates', industry: 'general', sortOrder: 1 },
    { name: 'Sales Funnels', slug: 'sales-funnels', description: 'Multi-step sales funnel templates', industry: 'general', sortOrder: 2 },
    { name: 'Lead Generation', slug: 'lead-generation', description: 'Lead capture page templates', industry: 'general', sortOrder: 3 },
    { name: 'E-commerce', slug: 'ecommerce', description: 'Online store page templates', industry: 'retail', sortOrder: 4 },
    { name: 'Healthcare', slug: 'healthcare', description: 'Medical practice page templates', industry: 'healthcare', sortOrder: 5 },
    { name: 'Real Estate', slug: 'real-estate', description: 'Property listing page templates', industry: 'real_estate', sortOrder: 6 },
    { name: 'Restaurant', slug: 'restaurant', description: 'Food service page templates', industry: 'food', sortOrder: 7 },
    { name: 'Fitness', slug: 'fitness', description: 'Gym and wellness page templates', industry: 'fitness', sortOrder: 8 },
    { name: 'Education', slug: 'education', description: 'Course and school page templates', industry: 'education', sortOrder: 9 },
    { name: 'Events', slug: 'events', description: 'Event promotion page templates', industry: 'general', sortOrder: 10 },
  ];

  for (const category of categories) {
    await prisma.sf_template_categories.upsert({
      where: { slug: category.slug },
      update: category,
      create: {
        id: randomUUID(),
        ...category,
        isActive: true,
      },
    });
  }
}

// ============================================================================
// TEMPLATE BROWSER API
// ============================================================================

/**
 * List template categories
 */
export async function listTemplateCategories(options: {
  industry?: string;
  includeTemplateCount?: boolean;
} = {}): Promise<TemplateCategory[]> {
  const { industry, includeTemplateCount } = options;

  const where: any = { isActive: true };
  if (industry) {
    where.industry = industry;
  }

  const categories = await prisma.sf_template_categories.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: includeTemplateCount ? {
      _count: {
        select: { templates: { where: { isActive: true } } },
      },
    } : undefined,
  });

  // Phase 11C: Using type assertion for Prisma _count aggregation
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    industry: cat.industry || undefined,
    icon: cat.icon || undefined,
    templateCount: (cat as { _count?: { templates?: number } })._count?.templates,
  }));
}

/**
 * List templates with filters
 */
export async function listTemplates(options: {
  categoryId?: string;
  categorySlug?: string;
  industry?: string;
  useCase?: string;
  pageType?: PageType;
  isPremium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  templates: Template[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { 
    categoryId, 
    categorySlug, 
    industry, 
    useCase, 
    pageType, 
    isPremium,
    search,
    page = 1, 
    limit = 20 
  } = options;

  const where: any = { isActive: true, isLatest: true };

  if (categoryId) where.categoryId = categoryId;
  if (categorySlug) where.category = { slug: categorySlug };
  if (industry) where.industry = industry;
  if (useCase) where.useCase = useCase;
  if (pageType) where.pageType = pageType;
  if (typeof isPremium === 'boolean') where.isPremium = isPremium;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [templates, total] = await Promise.all([
    prisma.sf_templates.findMany({
      where,
      include: { category: true },
      orderBy: [{ isPremium: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sf_templates.count({ where }),
  ]);

  return {
    templates: templates.map(t => ({
      id: t.id,
      categoryId: t.categoryId,
      name: t.name,
      slug: t.slug,
      description: t.description || undefined,
      previewImageUrl: t.previewImageUrl || undefined,
      thumbnailUrl: t.thumbnailUrl || undefined,
      industry: t.industry || undefined,
      useCase: t.useCase || undefined,
      pageType: t.pageType,
      blocks: t.blocks as any[] || [],
      styles: t.styles || undefined,
      settings: t.settings || undefined,
      version: t.version,
      isPremium: t.isPremium,
      category: t.category ? {
        id: t.category.id,
        name: t.category.name,
        slug: t.category.slug,
      } : undefined,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get single template by ID or slug
 */
export async function getTemplate(idOrSlug: string): Promise<Template | null> {
  const template = await prisma.sf_templates.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
      isActive: true,
    },
    include: { category: true },
  });

  if (!template) return null;

  return {
    id: template.id,
    categoryId: template.categoryId,
    name: template.name,
    slug: template.slug,
    description: template.description || undefined,
    previewImageUrl: template.previewImageUrl || undefined,
    thumbnailUrl: template.thumbnailUrl || undefined,
    industry: template.industry || undefined,
    useCase: template.useCase || undefined,
    pageType: template.pageType,
    blocks: template.blocks as any[] || [],
    styles: template.styles || undefined,
    settings: template.settings || undefined,
    version: template.version,
    isPremium: template.isPremium,
    category: template.category ? {
      id: template.category.id,
      name: template.category.name,
      slug: template.category.slug,
    } : undefined,
  };
}

// ============================================================================
// TEMPLATE CLONING
// ============================================================================

export interface CloneSiteFromTemplateInput {
  templateId: string;
  tenantId: string;
  platformInstanceId?: string;
  partnerId: string;
  siteName: string;
  siteSlug: string;
  createdBy: string;
}

/**
 * Clone a template to create a new site with pages
 */
export async function cloneSiteFromTemplate(input: CloneSiteFromTemplateInput): Promise<{
  success: boolean;
  site?: any;
  error?: string;
}> {
  const { templateId, tenantId, platformInstanceId, partnerId, siteName, siteSlug, createdBy } = input;

  try {
    // Get the template
    const template = await prisma.sf_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    if (!template.isActive) {
      return { success: false, error: 'Template is not available' };
    }

    // Check if slug is already taken
    const existingSite = await prisma.sf_sites.findUnique({
      where: { tenantId_slug: { tenantId, slug: siteSlug } },
    });

    if (existingSite) {
      return { success: false, error: 'Site slug already exists' };
    }

    // Create the site
    const siteId = randomUUID();
    const pageId = randomUUID();

    const site = await prisma.sf_sites.create({
      data: {
        id: siteId,
        tenantId,
        platformInstanceId,
        partnerId,
        name: siteName,
        slug: siteSlug,
        description: template.description,
        status: 'DRAFT',
        metaTitle: siteName,
        metaDescription: template.description,
        settings: template.settings || {},
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create the home page from template
    await prisma.sf_pages.create({
      data: {
        id: pageId,
        tenantId,
        siteId,
        name: 'Home',
        slug: 'home',
        pageType: template.pageType,
        blocks: template.blocks || [],
        isPublished: false,
        settings: {},
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create page blocks from template blocks
    const templateBlocks = template.blocks as any[] || [];
    for (let i = 0; i < templateBlocks.length; i++) {
      const block = templateBlocks[i];
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
          isVisible: true,
        },
      });
    }

    return {
      success: true,
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
      },
    };
  } catch (error: any) {
    console.error('Clone site from template error:', error);
    return { success: false, error: error.message || 'Failed to clone template' };
  }
}

export interface ClonePageFromTemplateInput {
  templateId: string;
  tenantId: string;
  siteId?: string;
  funnelId?: string;
  pageName: string;
  pageSlug: string;
  createdBy: string;
  funnelOrder?: number;
}

/**
 * Clone a template to create a new page
 */
export async function clonePageFromTemplate(input: ClonePageFromTemplateInput): Promise<{
  success: boolean;
  page?: any;
  error?: string;
}> {
  const { templateId, tenantId, siteId, funnelId, pageName, pageSlug, createdBy, funnelOrder } = input;

  try {
    // Get the template
    const template = await prisma.sf_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Validate parent exists
    if (siteId) {
      const site = await prisma.sf_sites.findUnique({ where: { id: siteId } });
      if (!site || site.tenantId !== tenantId) {
        return { success: false, error: 'Site not found or access denied' };
      }
    }

    if (funnelId) {
      const funnel = await prisma.sf_funnels.findUnique({ where: { id: funnelId } });
      if (!funnel || funnel.tenantId !== tenantId) {
        return { success: false, error: 'Funnel not found or access denied' };
      }
    }

    // Create the page
    const pageId = randomUUID();

    const page = await prisma.sf_pages.create({
      data: {
        id: pageId,
        tenantId,
        siteId,
        funnelId,
        name: pageName,
        slug: pageSlug,
        pageType: template.pageType,
        funnelOrder,
        blocks: template.blocks || [],
        metaTitle: pageName,
        metaDescription: template.description,
        isPublished: false,
        settings: {},
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create page blocks
    // Phase 11C: Using typed cast for JSON template blocks
    const templateBlocks = (template.blocks as TemplateBlock[]) || [];
    for (let i = 0; i < templateBlocks.length; i++) {
      const block = templateBlocks[i];
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
          isVisible: true,
        },
      });
    }

    return {
      success: true,
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        pageType: page.pageType,
      },
    };
  } catch (error: any) {
    console.error('Clone page from template error:', error);
    return { success: false, error: error.message || 'Failed to clone template' };
  }
}

// ============================================================================
// TEMPLATE SEED DATA
// ============================================================================

/**
 * Seed starter templates
 */
export async function seedStarterTemplates(): Promise<void> {
  // First ensure categories exist
  await seedTemplateCategories();

  const categories = await prisma.sf_template_categories.findMany();
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

  const templates = [
    {
      categoryId: categoryMap.get('landing-pages'),
      name: 'Hero Landing Page',
      slug: 'hero-landing',
      description: 'Bold hero section with CTA for lead generation',
      industry: 'general',
      useCase: 'lead_generation',
      pageType: 'LANDING' as PageType,
      blocks: [
        { type: 'hero', name: 'Hero Section', content: { headline: 'Grow Your Business Today', subheadline: 'Professional solutions for modern businesses', ctaText: 'Get Started', ctaLink: '#signup' } },
        { type: 'features', name: 'Features', content: { title: 'Why Choose Us', features: [] } },
        { type: 'testimonials', name: 'Testimonials', content: { title: 'What Our Clients Say', testimonials: [] } },
        { type: 'cta', name: 'CTA Section', content: { headline: 'Ready to Start?', ctaText: 'Contact Us' } },
      ],
    },
    {
      categoryId: categoryMap.get('lead-generation'),
      name: 'Lead Capture Form',
      slug: 'lead-capture',
      description: 'Simple lead capture page with form',
      industry: 'general',
      useCase: 'lead_generation',
      pageType: 'LANDING' as PageType,
      blocks: [
        { type: 'hero', name: 'Hero', content: { headline: 'Get Your Free Quote', subheadline: 'Fill out the form below' } },
        { type: 'form', name: 'Lead Form', content: { fields: ['name', 'email', 'phone', 'message'], submitText: 'Submit' } },
      ],
    },
    {
      categoryId: categoryMap.get('sales-funnels'),
      name: 'Sales Funnel Step 1',
      slug: 'sales-funnel-step1',
      description: 'First step of a sales funnel - awareness',
      industry: 'general',
      useCase: 'sales',
      pageType: 'FUNNEL_STEP' as PageType,
      blocks: [
        { type: 'hero', name: 'Awareness', content: { headline: 'Discover the Solution', ctaText: 'Learn More' } },
        { type: 'benefits', name: 'Benefits', content: { title: 'Benefits', items: [] } },
      ],
    },
    {
      categoryId: categoryMap.get('healthcare'),
      name: 'Medical Practice Landing',
      slug: 'medical-practice',
      description: 'Professional medical practice page',
      industry: 'healthcare',
      useCase: 'booking',
      pageType: 'LANDING' as PageType,
      blocks: [
        { type: 'hero', name: 'Hero', content: { headline: 'Your Health is Our Priority', ctaText: 'Book Appointment' } },
        { type: 'services', name: 'Services', content: { title: 'Our Services', services: [] } },
        { type: 'team', name: 'Our Team', content: { title: 'Meet Our Doctors', members: [] } },
        { type: 'contact', name: 'Contact', content: { title: 'Contact Us' } },
      ],
    },
    {
      categoryId: categoryMap.get('real-estate'),
      name: 'Property Listing',
      slug: 'property-listing',
      description: 'Real estate property showcase page',
      industry: 'real_estate',
      useCase: 'product_showcase',
      pageType: 'LANDING' as PageType,
      blocks: [
        { type: 'hero', name: 'Property Hero', content: { headline: 'Find Your Dream Home' } },
        { type: 'gallery', name: 'Property Gallery', content: { images: [] } },
        { type: 'features', name: 'Property Features', content: { features: [] } },
        { type: 'contact', name: 'Inquiry Form', content: { title: 'Schedule a Viewing' } },
      ],
    },
    {
      categoryId: categoryMap.get('restaurant'),
      name: 'Restaurant Page',
      slug: 'restaurant-page',
      description: 'Restaurant with menu and reservations',
      industry: 'food',
      useCase: 'booking',
      pageType: 'LANDING' as PageType,
      blocks: [
        { type: 'hero', name: 'Restaurant Hero', content: { headline: 'Authentic Cuisine', ctaText: 'Reserve a Table' } },
        { type: 'menu', name: 'Menu', content: { title: 'Our Menu', categories: [] } },
        { type: 'gallery', name: 'Gallery', content: { images: [] } },
        { type: 'reservation', name: 'Reservations', content: { title: 'Book Your Table' } },
      ],
    },
  ];

  for (const template of templates) {
    if (!template.categoryId) continue;

    const categoryId = template.categoryId;
    
    await prisma.sf_templates.upsert({
      where: { slug: template.slug },
      update: {
        ...template,
        categoryId,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        ...template,
        categoryId,
        isActive: true,
        isPremium: false,
        version: '1.0.0',
        isLatest: true,
      },
    });
  }
}
