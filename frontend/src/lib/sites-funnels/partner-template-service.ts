/**
 * PARTNER TEMPLATE SERVICE (Phase H1)
 * 
 * Read-only template browsing and cloning for Partners.
 * Partners CANNOT create, modify, or upload templates.
 * 
 * Capabilities:
 * - Browse template catalog
 * - Filter by industry, type, category
 * - Preview templates
 * - Clone templates to create Sites or Funnels
 * - Token resolution during cloning
 * 
 * Constraints:
 * - Read-only access to templates
 * - No template modifications
 * - No template uploads
 * - Tenant-isolated cloning
 */

import { prisma } from '../prisma'
import { TemplateType, TemplateStatus, PageType, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

type JsonValue = Prisma.InputJsonValue
import { canCreateSite, canCreateFunnel, requireSitesFunnelsEnabled } from './entitlements-service'

export interface PartnerUser {
  id: string
  partnerId: string
  tenantId?: string
}

export interface TemplateCatalogItem {
  id: string
  name: string
  slug: string
  description?: string
  previewImageUrl?: string
  thumbnailUrl?: string
  templateType: TemplateType
  industry?: string
  useCase?: string
  category?: { id: string; name: string; slug: string }
  pageCount: number
  version: string
  isDemo: boolean
}

export interface TemplatePreview {
  id: string
  name: string
  slug: string
  description?: string
  previewImageUrl?: string
  templateType: TemplateType
  industry?: string
  useCase?: string
  category?: { id: string; name: string; slug: string }
  pages: Array<{
    name: string
    slug: string
    pageType: PageType
    sortOrder: number
    blockCount: number
  }>
  version: string
  isDemo: boolean
}

export interface TokenContext {
  tenant?: {
    name?: string
    domain?: string
  }
  brand?: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
  }
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
  custom?: Record<string, string>
}

export interface CloneSiteTemplateInput {
  templateId: string
  tenantId: string
  platformInstanceId?: string
  partnerId: string
  siteName: string
  siteSlug: string
  createdBy: string
  tokenContext?: TokenContext
}

export interface CloneFunnelTemplateInput {
  templateId: string
  tenantId: string
  platformInstanceId?: string
  partnerId: string
  siteId?: string
  funnelName: string
  funnelSlug: string
  goalType?: string
  createdBy: string
  tokenContext?: TokenContext
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function resolveTokens(content: unknown, context: TokenContext): unknown {
  const cloned = deepClone(content)
  return resolveTokensInternal(cloned, context)
}

function resolveTokensInternal(content: unknown, context: TokenContext): unknown {
  if (typeof content === 'string') {
    let result = content

    if (context.tenant?.name) {
      result = result.replace(/\{\{tenant\.name\}\}/g, context.tenant.name)
    }
    if (context.tenant?.domain) {
      result = result.replace(/\{\{tenant\.domain\}\}/g, context.tenant.domain)
    }
    if (context.brand?.primaryColor) {
      result = result.replace(/\{\{brand\.primaryColor\}\}/g, context.brand.primaryColor)
    }
    if (context.brand?.secondaryColor) {
      result = result.replace(/\{\{brand\.secondaryColor\}\}/g, context.brand.secondaryColor)
    }
    if (context.brand?.logoUrl) {
      result = result.replace(/\{\{brand\.logoUrl\}\}/g, context.brand.logoUrl)
    }
    if (context.contact?.phone) {
      result = result.replace(/\{\{contact\.phone\}\}/g, context.contact.phone)
    }
    if (context.contact?.email) {
      result = result.replace(/\{\{contact\.email\}\}/g, context.contact.email)
    }
    if (context.contact?.address) {
      result = result.replace(/\{\{contact\.address\}\}/g, context.contact.address)
    }

    if (context.custom) {
      for (const [key, value] of Object.entries(context.custom)) {
        const regex = new RegExp(`\\{\\{custom\\.${key}\\}\\}`, 'g')
        result = result.replace(regex, value)
      }
    }

    return result
  }

  if (Array.isArray(content)) {
    return content.map(item => resolveTokensInternal(item, context))
  }

  if (typeof content === 'object' && content !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(content)) {
      result[key] = resolveTokensInternal(value, context)
    }
    return result
  }

  return content
}

export class PartnerTemplateService {
  async browseTemplates(options: {
    templateType?: TemplateType
    categoryId?: string
    categorySlug?: string
    industry?: string
    useCase?: string
    search?: string
    includeDemo?: boolean
    page?: number
    limit?: number
  } = {}): Promise<{
    templates: TemplateCatalogItem[]
    total: number
    page: number
    totalPages: number
  }> {
    const {
      templateType,
      categoryId,
      categorySlug,
      industry,
      useCase,
      search,
      includeDemo = true,
      page = 1,
      limit = 20,
    } = options

    const where: Record<string, unknown> = {
      status: 'PUBLISHED' as TemplateStatus,
      partnerVisible: true,
      isActive: true,
    }

    if (templateType) where.templateType = templateType
    if (categoryId) where.categoryId = categoryId
    if (categorySlug) where.category = { slug: categorySlug }
    if (industry) where.industry = industry
    if (useCase) where.useCase = useCase
    if (!includeDemo) where.isDemo = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [templates, total] = await Promise.all([
      prisma.sf_templates.findMany({
        where,
        include: {
          category: true,
          _count: { select: { pages: true } },
        },
        orderBy: [{ isPremium: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sf_templates.count({ where }),
    ])

    return {
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description || undefined,
        previewImageUrl: t.previewImageUrl || undefined,
        thumbnailUrl: t.thumbnailUrl || undefined,
        templateType: t.templateType,
        industry: t.industry || undefined,
        useCase: t.useCase || undefined,
        category: t.category
          ? { id: t.category.id, name: t.category.name, slug: t.category.slug }
          : undefined,
        pageCount: t.templateType === 'PAGE_TEMPLATE' ? 1 : (t as unknown as { _count: { pages: number } })._count.pages,
        version: t.version,
        isDemo: t.isDemo,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getCategories(options: {
    industry?: string
  } = {}): Promise<Array<{
    id: string
    name: string
    slug: string
    description?: string
    industry?: string
    templateCount: number
  }>> {
    const { industry } = options

    const where: Record<string, unknown> = { isActive: true }
    if (industry) where.industry = industry

    const categories = await prisma.sf_template_categories.findMany({
      where,
      include: {
        _count: {
          select: {
            templates: {
              where: {
                status: 'PUBLISHED',
                partnerVisible: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      industry: c.industry || undefined,
      templateCount: (c as unknown as { _count: { templates: number } })._count.templates,
    }))
  }

  async previewTemplate(templateId: string): Promise<TemplatePreview | null> {
    const template = await prisma.sf_templates.findFirst({
      where: {
        id: templateId,
        status: 'PUBLISHED',
        partnerVisible: true,
        isActive: true,
      },
      include: {
        category: true,
        pages: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!template) return null

    const pages =
      template.templateType === 'PAGE_TEMPLATE'
        ? [
            {
              name: 'Home',
              slug: 'home',
              pageType: template.pageType,
              sortOrder: 0,
              blockCount: Array.isArray(template.blocks) ? (template.blocks as unknown[]).length : 0,
            },
          ]
        : template.pages.map(p => ({
            name: p.name,
            slug: p.slug,
            pageType: p.pageType,
            sortOrder: p.sortOrder,
            blockCount: Array.isArray(p.blocks) ? (p.blocks as unknown[]).length : 0,
          }))

    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description || undefined,
      previewImageUrl: template.previewImageUrl || undefined,
      templateType: template.templateType,
      industry: template.industry || undefined,
      useCase: template.useCase || undefined,
      category: template.category
        ? { id: template.category.id, name: template.category.name, slug: template.category.slug }
        : undefined,
      pages,
      version: template.version,
      isDemo: template.isDemo,
    }
  }

  async cloneSiteTemplate(
    input: CloneSiteTemplateInput
  ): Promise<{ success: boolean; site?: unknown; error?: string }> {
    try {
      const { templateId, tenantId, platformInstanceId, partnerId, siteName, siteSlug, createdBy, tokenContext } = input

      const entitlementCheck = await requireSitesFunnelsEnabled(tenantId)
      if (!entitlementCheck.authorized) {
        return { success: false, error: entitlementCheck.error }
      }

      const quotaCheck = await canCreateSite(tenantId)
      if (!quotaCheck.allowed) {
        return { success: false, error: quotaCheck.reason }
      }

      const template = await prisma.sf_templates.findFirst({
        where: {
          id: templateId,
          status: 'PUBLISHED',
          partnerVisible: true,
          isActive: true,
          templateType: 'SITE_TEMPLATE',
        },
        include: { pages: { orderBy: { sortOrder: 'asc' } } },
      })

      if (!template) {
        return { success: false, error: 'Site template not found or not available' }
      }

      const existingSite = await prisma.sf_sites.findUnique({
        where: { tenantId_slug: { tenantId, slug: siteSlug } },
      })

      if (existingSite) {
        return { success: false, error: 'Site slug already exists' }
      }

      const siteId = randomUUID()

      const result = await prisma.$transaction(async (tx) => {
        const site = await tx.sf_sites.create({
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
            settings: (template.settings || {}) as JsonValue,
            createdBy,
            updatedBy: createdBy,
          },
        })

        for (const templatePage of template.pages) {
          const pageId = randomUUID()
          let blocks = deepClone(templatePage.blocks as unknown[])

          if (tokenContext) {
            blocks = resolveTokens(blocks, tokenContext) as unknown[]
          }

          await tx.sf_pages.create({
            data: {
              id: pageId,
              tenantId,
              siteId,
              name: templatePage.name,
              slug: templatePage.slug,
              pageType: templatePage.pageType,
              blocks: blocks as JsonValue,
              metaTitle: templatePage.metaTitle,
              metaDescription: templatePage.metaDescription,
              isPublished: false,
              settings: (templatePage.settings || {}) as JsonValue,
              createdBy,
              updatedBy: createdBy,
            },
          })

          if (Array.isArray(blocks)) {
            for (let i = 0; i < blocks.length; i++) {
              const block = blocks[i] as Record<string, unknown>
              await tx.sf_page_blocks.create({
                data: {
                  id: randomUUID(),
                  pageId,
                  blockType: (block.type as string) || 'section',
                  name: (block.name as string) || `Block ${i + 1}`,
                  content: ((block.content as Record<string, unknown>) || {}) as JsonValue,
                  styles: ((block.styles as Record<string, unknown>) || {}) as JsonValue,
                  settings: ((block.settings as Record<string, unknown>) || {}) as JsonValue,
                  sortOrder: i,
                  isVisible: true,
                },
              })
            }
          }
        }

        return site
      })

      return {
        success: true,
        site: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          status: result.status,
          pageCount: template.pages.length,
          clonedFromTemplateId: templateId,
          clonedFromTemplateVersion: template.version,
        },
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clone template'
      return { success: false, error: message }
    }
  }

  async cloneFunnelTemplate(
    input: CloneFunnelTemplateInput
  ): Promise<{ success: boolean; funnel?: unknown; error?: string }> {
    try {
      const {
        templateId,
        tenantId,
        platformInstanceId,
        partnerId,
        siteId,
        funnelName,
        funnelSlug,
        goalType,
        createdBy,
        tokenContext,
      } = input

      const entitlementCheck = await requireSitesFunnelsEnabled(tenantId)
      if (!entitlementCheck.authorized) {
        return { success: false, error: entitlementCheck.error }
      }

      const quotaCheck = await canCreateFunnel(tenantId)
      if (!quotaCheck.allowed) {
        return { success: false, error: quotaCheck.reason }
      }

      const template = await prisma.sf_templates.findFirst({
        where: {
          id: templateId,
          status: 'PUBLISHED',
          partnerVisible: true,
          isActive: true,
          templateType: 'FUNNEL_TEMPLATE',
        },
        include: { pages: { orderBy: { sortOrder: 'asc' } } },
      })

      if (!template) {
        return { success: false, error: 'Funnel template not found or not available' }
      }

      const existingFunnel = await prisma.sf_funnels.findUnique({
        where: { tenantId_slug: { tenantId, slug: funnelSlug } },
      })

      if (existingFunnel) {
        return { success: false, error: 'Funnel slug already exists' }
      }

      const funnelId = randomUUID()

      const result = await prisma.$transaction(async (tx) => {
        const funnel = await tx.sf_funnels.create({
          data: {
            id: funnelId,
            tenantId,
            platformInstanceId,
            partnerId,
            siteId,
            name: funnelName,
            slug: funnelSlug,
            description: template.description,
            status: 'DRAFT',
            goalType: goalType || template.useCase,
            settings: (template.settings || {}) as JsonValue,
            createdBy,
            updatedBy: createdBy,
          },
        })

        for (let i = 0; i < template.pages.length; i++) {
          const templatePage = template.pages[i]
          const pageId = randomUUID()
          let blocks = deepClone(templatePage.blocks as unknown[])

          if (tokenContext) {
            blocks = resolveTokens(blocks, tokenContext) as unknown[]
          }

          await tx.sf_pages.create({
            data: {
              id: pageId,
              tenantId,
              funnelId,
              name: templatePage.name,
              slug: templatePage.slug,
              pageType: templatePage.pageType,
              funnelOrder: i + 1,
              blocks: blocks as JsonValue,
              metaTitle: templatePage.metaTitle,
              metaDescription: templatePage.metaDescription,
              isPublished: false,
              settings: (templatePage.settings || {}) as JsonValue,
              createdBy,
              updatedBy: createdBy,
            },
          })

          if (Array.isArray(blocks)) {
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j] as Record<string, unknown>
              await tx.sf_page_blocks.create({
                data: {
                  id: randomUUID(),
                  pageId,
                  blockType: (block.type as string) || 'section',
                  name: (block.name as string) || `Block ${j + 1}`,
                  content: ((block.content as Record<string, unknown>) || {}) as JsonValue,
                  styles: ((block.styles as Record<string, unknown>) || {}) as JsonValue,
                  settings: ((block.settings as Record<string, unknown>) || {}) as JsonValue,
                  sortOrder: j,
                  isVisible: true,
                },
              })
            }
          }
        }

        return funnel
      })

      return {
        success: true,
        funnel: {
          id: result.id,
          name: result.name,
          slug: result.slug,
          status: result.status,
          stepCount: template.pages.length,
          clonedFromTemplateId: templateId,
          clonedFromTemplateVersion: template.version,
        },
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clone template'
      return { success: false, error: message }
    }
  }
}

export function createPartnerTemplateService(): PartnerTemplateService {
  return new PartnerTemplateService()
}
