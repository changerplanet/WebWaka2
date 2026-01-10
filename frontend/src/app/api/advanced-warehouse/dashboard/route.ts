/**
 * ADVANCED WAREHOUSE SUITE — Dashboard API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/dashboard         - Get warehouse summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ZoneService } from '@/lib/advanced-warehouse/zone-service';
import { PutawayService } from '@/lib/advanced-warehouse/putaway-service';
import { PickListService } from '@/lib/advanced-warehouse/pick-list-service';
import { MovementService } from '@/lib/advanced-warehouse/movement-service';
import { BatchService } from '@/lib/advanced-warehouse/batch-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json({ error: 'warehouseId is required' }, { status: 400 });
    }

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    // Get warehouse info
    const warehouse = await prisma.inv_warehouses.findFirst({
      where: {
        id: warehouseId,
        tenantId,
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Get zone summaries
    const zoneSummaries = await ZoneService.listByWarehouse(ctx, warehouseId);

    // Get bin counts
    const [totalBins, emptyBins, blockedBins] = await Promise.all([
      prisma.wh_bin.count({
        where: { tenantId, warehouseId, isActive: true },
      }),
      prisma.wh_bin.count({
        where: { tenantId, warehouseId, isActive: true, isEmpty: true },
      }),
      prisma.wh_bin.count({
        where: { tenantId, warehouseId, isActive: true, isBlocked: true },
      }),
    ]);

    // Get task stats
    const putawayStats = await PutawayService.getStats(ctx, warehouseId);
    const pickStats = await PickListService.getStats(ctx, warehouseId);

    // Get receipt counts
    const [pendingReceipts, receivingReceipts] = await Promise.all([
      prisma.wh_receipt.count({
        where: { tenantId, warehouseId, status: 'EXPECTED' },
      }),
      prisma.wh_receipt.count({
        where: { tenantId, warehouseId, status: 'RECEIVING' },
      }),
    ]);

    // Get expiring batches (within 30 days)
    const expiringBatches = await BatchService.getExpiring(ctx, 30);

    // Get today's movement summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const movementSummary = await MovementService.getWarehouseSummary(ctx, warehouseId, today);

    // Build dashboard response
    const dashboard = {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        type: (warehouse as any).warehouseType || 'STANDARD',
        isActive: warehouse.isActive,
      },
      zones: {
        total: zoneSummaries.length,
        summaries: zoneSummaries,
      },
      bins: {
        total: totalBins,
        empty: emptyBins,
        occupied: totalBins - emptyBins,
        blocked: blockedBins,
        occupancyRate: totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0,
      },
      receiving: {
        pendingReceipts,
        receivingInProgress: receivingReceipts,
        total: pendingReceipts + receivingReceipts,
      },
      putaway: {
        pending: putawayStats.pending,
        assigned: putawayStats.assigned,
        inProgress: putawayStats.inProgress,
        completedToday: putawayStats.completedToday,
      },
      picking: {
        pending: pickStats.pending,
        assigned: pickStats.assigned,
        picking: pickStats.picking,
        picked: pickStats.picked,
        packed: pickStats.packed,
        dispatchedToday: pickStats.dispatchedToday,
      },
      inventory: {
        expiringBatchesCount: expiringBatches.length,
        expiringBatches: expiringBatches.slice(0, 10).map((b: any) => ({
          id: b.id,
          productId: b.productId,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          currentQuantity: b.currentQuantity,
        })),
      },
      todayMovements: movementSummary,
    };

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Error getting dashboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
