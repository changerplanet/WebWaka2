/**
 * SITES & FUNNELS: Builder Page API
 * 
 * GET /api/sites-funnels/builder/page/[pageId] - Get page for editing
 * PUT /api/sites-funnels/builder/page/[pageId] - Save page blocks
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { requireTenantRole } from '@/lib/auth/authorization';
import { getPageForEditing, saveBlocks } from '@/lib/sites-funnels/builder';
import { PageBlock, isValidBlockType } from '@/lib/sites-funnels/builder/types';

// ============================================================================
// GET - Load page for editing
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const authCheck = await requireTenantRole(session.user.id, tenantId, ['PARTNER_ADMIN', 'PARTNER_EDITOR']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await getPageForEditing(pageId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /api/sites-funnels/builder/page/[pageId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Save page blocks
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const authCheck = await requireTenantRole(session.user.id, tenantId, ['PARTNER_ADMIN', 'PARTNER_EDITOR']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { blocks } = body;

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 });
    }

    // Validate blocks
    const validatedBlocks: PageBlock[] = [];
    for (const block of blocks) {
      if (!block.id || !block.type || !isValidBlockType(block.type)) {
        return NextResponse.json({ error: `Invalid block: ${JSON.stringify(block)}` }, { status: 400 });
      }
      validatedBlocks.push({
        id: block.id,
        type: block.type,
        name: block.name || block.type,
        isVisible: block.isVisible !== false,
        sortOrder: block.sortOrder || 0,
        content: block.content || {},
      } as PageBlock);
    }

    const result = await saveBlocks({
      pageId,
      tenantId: session.user.tenantId,
      blocks: validatedBlocks,
      updatedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, savedAt: result.savedAt });
  } catch (error: any) {
    console.error('PUT /api/sites-funnels/builder/page/[pageId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
