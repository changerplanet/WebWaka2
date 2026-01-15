/**
 * INVENTORY ENGINE API
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * API endpoints for inventory sync engine operations.
 * User-triggered only - NO automation.
 * 
 * POST: Process stock events, replay offline, resolve conflicts
 * GET: Get unified stock views, conflict stats, ParkHub capacity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { ChannelType } from '@prisma/client';
import {
  createInventorySyncEngine,
  createConflictResolutionService,
  StockEvent,
  ChannelSource,
} from '@/lib/commerce/inventory-engine';
import {
  createInventorySyncService,
  createStockTraceabilityService,
  TimeFilter,
} from '@/lib/commerce/inventory-sync';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No active tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'process_event': {
        const engine = createInventorySyncEngine(tenantId);
        const event: StockEvent = {
          id: body.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tenantId,
          channel: body.channel as ChannelSource,
          eventType: body.eventType,
          productId: body.productId,
          variantId: body.variantId || null,
          locationId: body.locationId || null,
          quantity: body.quantity,
          unitPrice: body.unitPrice,
          referenceType: body.referenceType,
          referenceId: body.referenceId,
          performedById: session.user.id,
          performedByName: session.user.name || session.user.email || 'Unknown',
          clientTimestamp: body.clientTimestamp ? new Date(body.clientTimestamp) : undefined,
          serverTimestamp: new Date(),
          isOffline: body.isOffline ?? false,
          offlineEventId: body.offlineEventId,
          metadata: body.metadata,
        };

        const result = await engine.processEvent(event);
        return NextResponse.json({ success: result.success, result });
      }

      case 'process_batch': {
        const engine = createInventorySyncEngine(tenantId);
        const events: StockEvent[] = body.events.map((e: Record<string, unknown>) => ({
          id: e.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          tenantId,
          channel: e.channel as ChannelSource,
          eventType: e.eventType,
          productId: e.productId,
          variantId: e.variantId || null,
          locationId: e.locationId || null,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          referenceType: e.referenceType,
          referenceId: e.referenceId,
          performedById: session.user.id,
          performedByName: session.user.name || session.user.email || 'Unknown',
          clientTimestamp: e.clientTimestamp ? new Date(e.clientTimestamp as string) : undefined,
          serverTimestamp: new Date(),
          isOffline: e.isOffline ?? false,
          offlineEventId: e.offlineEventId,
          metadata: e.metadata,
        }));

        const results = await engine.processBatch(events);
        return NextResponse.json({
          success: true,
          results,
          summary: {
            total: results.length,
            succeeded: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            conflicts: results.filter(r => r.conflict).length,
          },
        });
      }

      case 'replay_offline': {
        const engine = createInventorySyncEngine(tenantId);
        const result = await engine.replayOfflineEvents(body.locationId);
        return NextResponse.json({ success: true, result });
      }

      case 'resolve_conflict': {
        const resolutionService = createConflictResolutionService(tenantId);
        const result = await resolutionService.resolveConflict({
          conflictId: body.conflictId,
          offlineSaleId: body.offlineSaleId,
          action: body.resolutionAction,
          adjustedQuantity: body.adjustedQuantity,
          notes: body.notes,
          resolvedById: session.user.id,
          resolvedByName: session.user.name || session.user.email || 'Unknown',
        });
        return NextResponse.json({ success: result.success, result });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: process_event, process_batch, replay_offline, resolve_conflict' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Inventory engine API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No active tenant' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const productId = searchParams.get('productId');
    const tripId = searchParams.get('tripId');
    const channel = searchParams.get('channel') as ChannelSource | null;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const severityFilter = searchParams.get('severity') as 'MILD' | 'SEVERE' | 'CRITICAL' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const engine = createInventorySyncEngine(tenantId);
    const resolutionService = createConflictResolutionService(tenantId);

    switch (view) {
      case 'unified': {
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId is required' },
            { status: 400 }
          );
        }
        const stockView = await engine.getUnifiedStockView(productId);
        if (!stockView) {
          return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, stockView });
      }

      case 'multi': {
        const productIds = searchParams.get('productIds')?.split(',').filter(Boolean);
        const result = await engine.getMultiProductUnifiedView({
          productIds,
          channel: channel || undefined,
          lowStockOnly,
          limit,
          offset,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'parkhub': {
        if (!tripId) {
          return NextResponse.json(
            { success: false, error: 'tripId is required' },
            { status: 400 }
          );
        }
        const capacityView = await engine.getParkHubCapacityView(tripId);
        if (!capacityView) {
          return NextResponse.json(
            { success: false, error: 'Trip not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, capacityView });
      }

      case 'conflicts': {
        const result = await resolutionService.getPendingConflicts({
          channel: channel || undefined,
          severityFilter: severityFilter || undefined,
          limit,
          offset,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'conflict-stats': {
        const stats = await resolutionService.getConflictStats();
        return NextResponse.json({ success: true, stats });
      }

      case 'traceability': {
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId is required' },
            { status: 400 }
          );
        }
        const period = searchParams.get('period') as TimeFilter['period'] || '30d';
        const traceabilityService = createStockTraceabilityService(tenantId);
        const traceability = await traceabilityService.getProductTraceability(productId, { period });
        if (!traceability) {
          return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, traceability });
      }

      case 'cross-channel': {
        const period = searchParams.get('period') as TimeFilter['period'] || '30d';
        const traceabilityService = createStockTraceabilityService(tenantId);
        const comparison = await traceabilityService.getCrossChannelComparison({ period });
        return NextResponse.json({ success: true, comparison });
      }

      case 'movements': {
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId is required' },
            { status: 400 }
          );
        }
        const period = searchParams.get('period') as TimeFilter['period'] || '30d';
        const syncService = createInventorySyncService(tenantId);
        const result = await syncService.getStockMovementHistory(productId, { period }, { limit, offset });
        return NextResponse.json({ success: true, ...result });
      }

      case 'channel-summary': {
        if (!channel) {
          return NextResponse.json(
            { success: false, error: 'channel is required' },
            { status: 400 }
          );
        }
        const syncService = createInventorySyncService(tenantId);
        const summary = await syncService.getChannelStockSummary(channel as ChannelType);
        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid view. Use: unified, multi, parkhub, conflicts, conflict-stats, traceability, cross-channel, movements, channel-summary' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Inventory engine API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
