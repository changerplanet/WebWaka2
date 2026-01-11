export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Inventory Audits API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';

// GET /api/inventory/audits - List audits
// POST /api/inventory/audits - Create audit
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const auditType = searchParams.get('auditType');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await InventoryAuditService.list(session.activeTenantId, {
      status: status || undefined,
      warehouseId: warehouseId || undefined,
      auditType: auditType || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Audit API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const body = await request.json();

    if (!body.warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId is required' },
        { status: 400 }
      );
    }

    const audit = await InventoryAuditService.create(
      session.activeTenantId,
      body,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    console.error('[Audit API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
