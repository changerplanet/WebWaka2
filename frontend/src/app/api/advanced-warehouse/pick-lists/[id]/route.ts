export const dynamic = 'force-dynamic'

/**
 * ADVANCED WAREHOUSE SUITE — Pick List Detail API
 * Phase 7C.3, S4 API Routes
 * 
 * GET    /api/advanced-warehouse/pick-lists/[id]         - Get pick list
 * POST   /api/advanced-warehouse/pick-lists/[id]         - Actions (assign, start, pick-item, complete-picking, pack, dispatch, cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PickListService } from '@/lib/advanced-warehouse/pick-list-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    const pickList = await PickListService.getById(ctx, id);
    if (!pickList) {
      return NextResponse.json({ error: 'Pick list not found' }, { status: 404 });
    }

    return NextResponse.json(pickList);
  } catch (error: any) {
    console.error('Error getting pick list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const ctx = {
      tenantId,
      platformInstanceId: request.headers.get('x-platform-instance-id') || tenantId,
    };

    switch (action) {
      case 'assign': {
        const { assignedToId, assignedToName } = body;
        if (!assignedToId || !assignedToName) {
          return NextResponse.json({ error: 'assignedToId and assignedToName are required' }, { status: 400 });
        }
        const pickList = await PickListService.assign(ctx, id, { assignedToId, assignedToName });
        return NextResponse.json(pickList);
      }

      case 'start': {
        const pickList = await PickListService.startPicking(ctx, id);
        return NextResponse.json(pickList);
      }

      case 'pick-item': {
        const { pickListItemId, pickedQuantity, shortQuantity, shortReason, actualBinId, actualBinCode, actualBatchId, actualBatchNumber, pickedById, pickedByName } = body;
        if (!pickListItemId || pickedQuantity === undefined || !pickedById || !pickedByName) {
          return NextResponse.json({ error: 'pickListItemId, pickedQuantity, pickedById, and pickedByName are required' }, { status: 400 });
        }
        const item = await PickListService.pickItem(ctx, id, {
          pickListItemId,
          pickedQuantity,
          shortQuantity,
          shortReason,
          actualBinId,
          actualBinCode,
          actualBatchId,
          actualBatchNumber,
          pickedById,
          pickedByName,
        });
        return NextResponse.json(item);
      }

      case 'complete-picking': {
        const pickList = await PickListService.completePicking(ctx, id);
        return NextResponse.json(pickList);
      }

      case 'pack': {
        const { packageCount, totalWeight, packingNotes } = body;
        if (packageCount === undefined) {
          return NextResponse.json({ error: 'packageCount is required' }, { status: 400 });
        }
        const pickList = await PickListService.completePacking(ctx, id, {
          packageCount,
          totalWeight,
          packingNotes,
        });
        return NextResponse.json(pickList);
      }

      case 'dispatch': {
        const { dispatchManifestId, waybillNumber, carrierName } = body;
        const pickList = await PickListService.dispatch(ctx, id, {
          dispatchManifestId,
          waybillNumber,
          carrierName,
        });
        return NextResponse.json(pickList);
      }

      case 'cancel': {
        const { reason } = body;
        const pickList = await PickListService.cancel(ctx, id, reason);
        return NextResponse.json(pickList);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error performing pick list action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
