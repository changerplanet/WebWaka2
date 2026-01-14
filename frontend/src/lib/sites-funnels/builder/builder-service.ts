/**
 * SITES & FUNNELS: Builder Service
 * 
 * Server-side service for page builder operations.
 * Handles saving blocks, loading pages for editing, etc.
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import { prisma } from '../../prisma';
import { randomUUID } from 'crypto';
import { PageBlock, BlockType, isValidBlockType, BLOCK_REGISTRY } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface GetPageForEditingResult {
  success: boolean;
  page?: {
    id: string;
    name: string;
    slug: string;
    siteId?: string;
    funnelId?: string;
    blocks: PageBlock[];
    isPublished: boolean;
    metaTitle?: string;
    metaDescription?: string;
  };
  site?: {
    id: string;
    name: string;
    status: string;
  };
  funnel?: {
    id: string;
    name: string;
    status: string;
  };
  error?: string;
}

export interface SaveBlocksInput {
  pageId: string;
  tenantId: string;
  blocks: PageBlock[];
  updatedBy: string;
}

export interface SaveBlocksResult {
  success: boolean;
  error?: string;
  savedAt?: Date;
}

// ============================================================================
// GET PAGE FOR EDITING
// ============================================================================

export async function getPageForEditing(
  pageId: string,
  tenantId: string
): Promise<GetPageForEditingResult> {
  try {
    const page = await prisma.sf_pages.findFirst({
      where: { id: pageId, tenantId },
      include: {
        site: {
          select: { id: true, name: true, status: true },
        },
        funnel: {
          select: { id: true, name: true, status: true },
        },
        pageBlocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    // Convert stored blocks to PageBlock format
    const blocks: PageBlock[] = page.pageBlocks.map((block) => ({
      id: block.id,
      type: isValidBlockType(block.blockType) ? block.blockType : 'cta',
      name: block.name,
      isVisible: block.isVisible,
      sortOrder: block.sortOrder,
      content: block.content as Record<string, any>,
    })) as PageBlock[];

    // If no page blocks exist, try to parse from the JSON blocks column
    if (blocks.length === 0 && page.blocks && Array.isArray(page.blocks)) {
      const jsonBlocks = page.blocks as any[];
      for (let i = 0; i < jsonBlocks.length; i++) {
        const jb = jsonBlocks[i];
        if (jb && typeof jb === 'object' && jb.type && isValidBlockType(jb.type)) {
          const blockType = jb.type as BlockType;
          blocks.push({
            id: jb.id || randomUUID(),
            type: blockType,
            name: jb.name || BLOCK_REGISTRY[blockType].name,
            isVisible: jb.isVisible !== false,
            sortOrder: i,
            content: jb.content || BLOCK_REGISTRY[blockType].defaultContent,
          } as PageBlock);
        }
      }
    }

    return {
      success: true,
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        siteId: page.siteId || undefined,
        funnelId: page.funnelId || undefined,
        blocks,
        isPublished: page.isPublished,
        metaTitle: page.metaTitle || undefined,
        metaDescription: page.metaDescription || undefined,
      },
      site: page.site ? {
        id: page.site.id,
        name: page.site.name,
        status: page.site.status,
      } : undefined,
      funnel: page.funnel ? {
        id: page.funnel.id,
        name: page.funnel.name,
        status: page.funnel.status,
      } : undefined,
    };
  } catch (error: any) {
    console.error('Get page for editing error:', error);
    return { success: false, error: error.message || 'Failed to load page' };
  }
}

// ============================================================================
// SAVE BLOCKS
// ============================================================================

export async function saveBlocks(input: SaveBlocksInput): Promise<SaveBlocksResult> {
  try {
    const { pageId, tenantId, blocks, updatedBy } = input;

    // Verify page exists and belongs to tenant
    const page = await prisma.sf_pages.findFirst({
      where: { id: pageId, tenantId },
    });

    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing page blocks
      await tx.sf_page_blocks.deleteMany({
        where: { pageId },
      });

      // Create new page blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        await tx.sf_page_blocks.create({
          data: {
            id: block.id || randomUUID(),
            pageId,
            blockType: block.type,
            name: block.name,
            content: (block.content || {}) as any,
            styles: {},
            settings: {},
            sortOrder: i,
            isVisible: block.isVisible !== false,
          },
        });
      }

      // Update page's blocks JSON column (for backward compatibility)
      await tx.sf_pages.update({
        where: { id: pageId },
        data: {
          blocks: blocks.map((b, i) => ({
            id: b.id,
            type: b.type,
            name: b.name,
            content: b.content as any,
            isVisible: b.isVisible,
            sortOrder: i,
          })) as any,
          updatedBy,
          updatedAt: new Date(),
        },
      });
    });

    return { success: true, savedAt: new Date() };
  } catch (error: any) {
    console.error('Save blocks error:', error);
    return { success: false, error: error.message || 'Failed to save blocks' };
  }
}

// ============================================================================
// ADD BLOCK
// ============================================================================

export async function addBlock(
  pageId: string,
  tenantId: string,
  block: PageBlock,
  position: number,
  updatedBy: string
): Promise<SaveBlocksResult> {
  try {
    // Get current blocks
    const result = await getPageForEditing(pageId, tenantId);
    if (!result.success || !result.page) {
      return { success: false, error: result.error || 'Page not found' };
    }

    const blocks = [...result.page.blocks];
    blocks.splice(position, 0, block);

    return saveBlocks({ pageId, tenantId, blocks, updatedBy });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add block' };
  }
}

// ============================================================================
// REMOVE BLOCK
// ============================================================================

export async function removeBlock(
  pageId: string,
  tenantId: string,
  blockId: string,
  updatedBy: string
): Promise<SaveBlocksResult> {
  try {
    // Get current blocks
    const result = await getPageForEditing(pageId, tenantId);
    if (!result.success || !result.page) {
      return { success: false, error: result.error || 'Page not found' };
    }

    const blocks = result.page.blocks.filter(b => b.id !== blockId);

    return saveBlocks({ pageId, tenantId, blocks, updatedBy });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to remove block' };
  }
}

// ============================================================================
// REORDER BLOCKS
// ============================================================================

export async function reorderBlocks(
  pageId: string,
  tenantId: string,
  blockIds: string[],
  updatedBy: string
): Promise<SaveBlocksResult> {
  try {
    // Get current blocks
    const result = await getPageForEditing(pageId, tenantId);
    if (!result.success || !result.page) {
      return { success: false, error: result.error || 'Page not found' };
    }

    // Reorder blocks based on new order
    const blockMap = new Map(result.page.blocks.map(b => [b.id, b]));
    const reorderedBlocks: PageBlock[] = [];

    for (const id of blockIds) {
      const block = blockMap.get(id);
      if (block) {
        reorderedBlocks.push(block);
      }
    }

    // Add any blocks that weren't in the order list (shouldn't happen, but safety)
    for (const block of result.page.blocks) {
      if (!blockIds.includes(block.id)) {
        reorderedBlocks.push(block);
      }
    }

    return saveBlocks({ pageId, tenantId, blocks: reorderedBlocks, updatedBy });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reorder blocks' };
  }
}

// ============================================================================
// UPDATE BLOCK CONTENT
// ============================================================================

export async function updateBlockContent(
  pageId: string,
  tenantId: string,
  blockId: string,
  content: Record<string, any>,
  updatedBy: string
): Promise<SaveBlocksResult> {
  try {
    // Get current blocks
    const result = await getPageForEditing(pageId, tenantId);
    if (!result.success || !result.page) {
      return { success: false, error: result.error || 'Page not found' };
    }

    const blocks = result.page.blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, content: { ...block.content, ...content } } as PageBlock;
      }
      return block;
    }) as PageBlock[];

    return saveBlocks({ pageId, tenantId, blocks, updatedBy });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update block' };
  }
}

// ============================================================================
// TOGGLE BLOCK VISIBILITY
// ============================================================================

export async function toggleBlockVisibility(
  pageId: string,
  tenantId: string,
  blockId: string,
  isVisible: boolean,
  updatedBy: string
): Promise<SaveBlocksResult> {
  try {
    // Get current blocks
    const result = await getPageForEditing(pageId, tenantId);
    if (!result.success || !result.page) {
      return { success: false, error: result.error || 'Page not found' };
    }

    const blocks = result.page.blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, isVisible } as PageBlock;
      }
      return block;
    }) as PageBlock[];

    return saveBlocks({ pageId, tenantId, blocks, updatedBy });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to toggle visibility' };
  }
}

// ============================================================================
// GET AVAILABLE FORMS (for Form Block)
// ============================================================================

export async function getAvailableForms(tenantId: string): Promise<Array<{
  id: string;
  name: string;
  description?: string;
}>> {
  try {
    const forms = await prisma.sf_forms.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    return forms.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description || undefined,
    }));
  } catch (error) {
    console.error('Get available forms error:', error);
    return [];
  }
}
