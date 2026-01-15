/**
 * SUPER ADMIN TEMPLATE SERVICE (Phase H1)
 * 
 * Template management for Super Admin ONLY.
 * Partners CANNOT create, upload, or modify templates.
 * 
 * Capabilities:
 * - Create templates (SITE_TEMPLATE, FUNNEL_TEMPLATE, PAGE_TEMPLATE)
 * - Upload template definitions
 * - Validate template schema
 * - Publish / Unpublish templates
 * - Deprecate templates
 * - Mark as partner-visible / demo-only
 * 
 * Constraints:
 * - SUPER_ADMIN role enforced on all mutations
 * - Templates are immutable once published
 * - No partner template uploads
 * - No marketplace, no payments
 * - No automation, no background jobs
 */

import { prisma } from '../prisma'
import { TemplateType, TemplateStatus, PageType, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { z } from 'zod'

type JsonValue = Prisma.InputJsonValue

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

export interface AdminUser {
  id: string
  role: string
  email?: string
}

export interface CreateTemplateInput {
  categoryId: string
  name: string
  slug: string
  description?: string
  previewImageUrl?: string
  thumbnailUrl?: string
  templateType: TemplateType
  industry?: string
  useCase?: string
  pageType?: PageType
  styles?: Record<string, unknown>
  settings?: Record<string, unknown>
  isDemo?: boolean
  partnerVisible?: boolean
}

export interface TemplatePageInput {
  name: string
  slug: string
  pageType?: PageType
  sortOrder?: number
  blocks?: unknown[]
  styles?: Record<string, unknown>
  settings?: Record<string, unknown>
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  previewImageUrl?: string
  thumbnailUrl?: string
  industry?: string
  useCase?: string
  styles?: Record<string, unknown>
  settings?: Record<string, unknown>
  isDemo?: boolean
  partnerVisible?: boolean
}

export interface TemplateManifest {
  id: string
  name: string
  description?: string
  templateType: TemplateType
  industry?: string
  category?: string
  supportedPages: Array<{
    name: string
    slug: string
    pageType: PageType
    sortOrder: number
  }>
  blockStructure: unknown[]
  version: string
  status: TemplateStatus
  isDemo: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const BlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  name: z.string().optional(),
  content: z.record(z.string(), z.any()).optional(),
  styles: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
})

const TemplateBlocksSchema = z.array(BlockSchema)

function requireSuperAdmin(user: AdminUser): void {
  if (user.role !== SUPER_ADMIN_ROLE) {
    throw new Error('Access denied: SUPER_ADMIN role required')
  }
}

export class SuperAdminTemplateService {
  async createTemplate(
    user: AdminUser,
    input: CreateTemplateInput
  ): Promise<{ success: boolean; template?: unknown; error?: string }> {
    try {
      requireSuperAdmin(user)

      const existingTemplate = await prisma.sf_templates.findUnique({
        where: { slug: input.slug },
      })

      if (existingTemplate) {
        return { success: false, error: 'Template slug already exists' }
      }

      const category = await prisma.sf_template_categories.findUnique({
        where: { id: input.categoryId },
      })

      if (!category) {
        return { success: false, error: 'Category not found' }
      }

      const template = await prisma.sf_templates.create({
        data: {
          id: randomUUID(),
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          previewImageUrl: input.previewImageUrl,
          thumbnailUrl: input.thumbnailUrl,
          templateType: input.templateType,
          industry: input.industry,
          useCase: input.useCase,
          pageType: input.pageType || 'LANDING',
          blocks: [] as JsonValue,
          styles: (input.styles || {}) as JsonValue,
          settings: (input.settings || {}) as JsonValue,
          version: '1.0.0',
          isLatest: true,
          status: 'DRAFT',
          isActive: true,
          isPremium: false,
          partnerVisible: input.partnerVisible ?? true,
          isDemo: input.isDemo ?? false,
          createdBy: user.id,
        },
      })

      return { success: true, template }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create template'
      return { success: false, error: message }
    }
  }

  async addTemplatePage(
    user: AdminUser,
    templateId: string,
    input: TemplatePageInput
  ): Promise<{ success: boolean; page?: unknown; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        return { success: false, error: 'Cannot modify published template' }
      }

      if (template.templateType === 'PAGE_TEMPLATE') {
        return { success: false, error: 'PAGE_TEMPLATE does not support multiple pages' }
      }

      const existingPage = await prisma.sf_template_pages.findUnique({
        where: { templateId_slug: { templateId, slug: input.slug } },
      })

      if (existingPage) {
        return { success: false, error: 'Page slug already exists in this template' }
      }

      const page = await prisma.sf_template_pages.create({
        data: {
          id: randomUUID(),
          templateId,
          name: input.name,
          slug: input.slug,
          pageType: input.pageType || 'CONTENT',
          sortOrder: input.sortOrder || 0,
          blocks: (input.blocks || []) as JsonValue,
          styles: (input.styles || {}) as JsonValue,
          settings: (input.settings || {}) as JsonValue,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
        },
      })

      return { success: true, page }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add template page'
      return { success: false, error: message }
    }
  }

  async updateTemplatePageBlocks(
    user: AdminUser,
    templateId: string,
    pageId: string,
    blocks: unknown[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        return { success: false, error: 'Cannot modify published template' }
      }

      const validationResult = TemplateBlocksSchema.safeParse(blocks)
      if (!validationResult.success) {
        return { success: false, error: `Invalid blocks: ${validationResult.error.message}` }
      }

      await prisma.sf_template_pages.update({
        where: { id: pageId },
        data: { blocks: blocks as JsonValue, updatedAt: new Date() },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update blocks'
      return { success: false, error: message }
    }
  }

  async updatePageTemplateBlocks(
    user: AdminUser,
    templateId: string,
    blocks: unknown[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        return { success: false, error: 'Cannot modify published template' }
      }

      if (template.templateType !== 'PAGE_TEMPLATE') {
        return { success: false, error: 'Use addTemplatePage for multi-page templates' }
      }

      const validationResult = TemplateBlocksSchema.safeParse(blocks)
      if (!validationResult.success) {
        return { success: false, error: `Invalid blocks: ${validationResult.error.message}` }
      }

      await prisma.sf_templates.update({
        where: { id: templateId },
        data: { blocks: blocks as JsonValue, updatedAt: new Date() },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update blocks'
      return { success: false, error: message }
    }
  }

  async validateTemplateSchema(
    user: AdminUser,
    templateId: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      requireSuperAdmin(user)

      const errors: string[] = []

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
        include: { pages: true, category: true },
      })

      if (!template) {
        return { valid: false, errors: ['Template not found'] }
      }

      if (!template.name || template.name.trim().length === 0) {
        errors.push('Template name is required')
      }

      if (!template.categoryId) {
        errors.push('Category is required')
      }

      if (template.templateType === 'PAGE_TEMPLATE') {
        const blocks = template.blocks as unknown[]
        if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
          errors.push('PAGE_TEMPLATE requires at least one block')
        }
      } else {
        if (template.pages.length === 0) {
          errors.push(`${template.templateType} requires at least one page`)
        }

        for (const page of template.pages) {
          const blocks = page.blocks as unknown[]
          if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
            errors.push(`Page "${page.name}" has no blocks`)
          }
        }
      }

      return { valid: errors.length === 0, errors }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return { valid: false, errors: [message] }
    }
  }

  async publishTemplate(
    user: AdminUser,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        return { success: false, error: 'Template is already published' }
      }

      if (template.status === 'DEPRECATED') {
        return { success: false, error: 'Cannot publish deprecated template' }
      }

      const validation = await this.validateTemplateSchema(user, templateId)
      if (!validation.valid) {
        return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` }
      }

      await prisma.sf_templates.update({
        where: { id: templateId },
        data: {
          status: 'PUBLISHED',
          isActive: true,
          publishedBy: user.id,
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to publish template'
      return { success: false, error: message }
    }
  }

  async unpublishTemplate(
    user: AdminUser,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status !== 'PUBLISHED') {
        return { success: false, error: 'Template is not published' }
      }

      await prisma.sf_templates.update({
        where: { id: templateId },
        data: {
          status: 'DRAFT',
          updatedAt: new Date(),
        },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to unpublish template'
      return { success: false, error: message }
    }
  }

  async deprecateTemplate(
    user: AdminUser,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'DEPRECATED') {
        return { success: false, error: 'Template is already deprecated' }
      }

      await prisma.sf_templates.update({
        where: { id: templateId },
        data: {
          status: 'DEPRECATED',
          isActive: false,
          partnerVisible: false,
          deprecatedBy: user.id,
          deprecatedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to deprecate template'
      return { success: false, error: message }
    }
  }

  async updateTemplate(
    user: AdminUser,
    templateId: string,
    input: UpdateTemplateInput
  ): Promise<{ success: boolean; template?: unknown; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        const allowedFields = ['partnerVisible', 'isDemo', 'previewImageUrl', 'thumbnailUrl']
        const inputKeys = Object.keys(input)
        const disallowedKeys = inputKeys.filter(k => !allowedFields.includes(k))
        if (disallowedKeys.length > 0) {
          return { 
            success: false, 
            error: `Cannot modify ${disallowedKeys.join(', ')} on published template` 
          }
        }
      }

      const updated = await prisma.sf_templates.update({
        where: { id: templateId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.previewImageUrl !== undefined && { previewImageUrl: input.previewImageUrl }),
          ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl }),
          ...(input.industry !== undefined && { industry: input.industry }),
          ...(input.useCase !== undefined && { useCase: input.useCase }),
          ...(input.styles !== undefined && { styles: input.styles as JsonValue }),
          ...(input.settings !== undefined && { settings: input.settings as JsonValue }),
          ...(input.isDemo !== undefined && { isDemo: input.isDemo }),
          ...(input.partnerVisible !== undefined && { partnerVisible: input.partnerVisible }),
          updatedAt: new Date(),
        },
      })

      return { success: true, template: updated }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update template'
      return { success: false, error: message }
    }
  }

  async deleteTemplate(
    user: AdminUser,
    templateId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      requireSuperAdmin(user)

      const template = await prisma.sf_templates.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      if (template.status === 'PUBLISHED') {
        return { success: false, error: 'Cannot delete published template. Deprecate it instead.' }
      }

      await prisma.sf_templates.delete({
        where: { id: templateId },
      })

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete template'
      return { success: false, error: message }
    }
  }

  async getTemplate(
    user: AdminUser,
    templateId: string
  ): Promise<unknown | null> {
    requireSuperAdmin(user)

    return prisma.sf_templates.findUnique({
      where: { id: templateId },
      include: {
        category: true,
        pages: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async listTemplates(
    user: AdminUser,
    options: {
      templateType?: TemplateType
      status?: TemplateStatus
      categoryId?: string
      industry?: string
      search?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<{
    templates: unknown[]
    total: number
    page: number
    totalPages: number
  }> {
    requireSuperAdmin(user)

    const { templateType, status, categoryId, industry, search, page = 1, limit = 20 } = options

    const where: Record<string, unknown> = {}
    if (templateType) where.templateType = templateType
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (industry) where.industry = industry
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
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sf_templates.count({ where }),
    ])

    return {
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getTemplateManifest(
    user: AdminUser,
    templateId: string
  ): Promise<TemplateManifest | null> {
    requireSuperAdmin(user)

    const template = await prisma.sf_templates.findUnique({
      where: { id: templateId },
      include: {
        category: true,
        pages: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!template) return null

    const supportedPages = template.templateType === 'PAGE_TEMPLATE'
      ? [{ name: 'Home', slug: 'home', pageType: template.pageType, sortOrder: 0 }]
      : template.pages.map(p => ({
          name: p.name,
          slug: p.slug,
          pageType: p.pageType,
          sortOrder: p.sortOrder,
        }))

    const blockStructure = template.templateType === 'PAGE_TEMPLATE'
      ? template.blocks as unknown[]
      : template.pages.map(p => ({
          pageSlug: p.slug,
          blocks: p.blocks,
        }))

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      templateType: template.templateType,
      industry: template.industry || undefined,
      category: template.category?.name,
      supportedPages,
      blockStructure,
      version: template.version,
      status: template.status,
      isDemo: template.isDemo,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }
  }

  async uploadTemplateDefinition(
    user: AdminUser,
    definition: {
      categorySlug: string
      name: string
      slug: string
      description?: string
      templateType: TemplateType
      industry?: string
      useCase?: string
      isDemo?: boolean
      pages: TemplatePageInput[]
    }
  ): Promise<{ success: boolean; template?: unknown; error?: string }> {
    try {
      requireSuperAdmin(user)

      const category = await prisma.sf_template_categories.findUnique({
        where: { slug: definition.categorySlug },
      })

      if (!category) {
        return { success: false, error: `Category "${definition.categorySlug}" not found` }
      }

      const existingTemplate = await prisma.sf_templates.findUnique({
        where: { slug: definition.slug },
      })

      if (existingTemplate) {
        return { success: false, error: 'Template slug already exists' }
      }

      const templateId = randomUUID()

      const template = await prisma.sf_templates.create({
        data: {
          id: templateId,
          categoryId: category.id,
          name: definition.name,
          slug: definition.slug,
          description: definition.description,
          templateType: definition.templateType,
          industry: definition.industry,
          useCase: definition.useCase,
          pageType: 'LANDING',
          blocks: (definition.templateType === 'PAGE_TEMPLATE' && definition.pages.length > 0
            ? definition.pages[0].blocks || []
            : []) as JsonValue,
          version: '1.0.0',
          isLatest: true,
          status: 'DRAFT',
          isActive: true,
          isPremium: false,
          partnerVisible: true,
          isDemo: definition.isDemo ?? false,
          createdBy: user.id,
        },
      })

      if (definition.templateType !== 'PAGE_TEMPLATE' && definition.pages.length > 0) {
        for (let i = 0; i < definition.pages.length; i++) {
          const pageInput = definition.pages[i]
          await prisma.sf_template_pages.create({
            data: {
              id: randomUUID(),
              templateId,
              name: pageInput.name,
              slug: pageInput.slug,
              pageType: pageInput.pageType || 'CONTENT',
              sortOrder: pageInput.sortOrder ?? i,
              blocks: (pageInput.blocks || []) as JsonValue,
              styles: (pageInput.styles || {}) as JsonValue,
              settings: (pageInput.settings || {}) as JsonValue,
              metaTitle: pageInput.metaTitle,
              metaDescription: pageInput.metaDescription,
            },
          })
        }
      }

      return { success: true, template }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload template'
      return { success: false, error: message }
    }
  }
}

export function createSuperAdminTemplateService(): SuperAdminTemplateService {
  return new SuperAdminTemplateService()
}
