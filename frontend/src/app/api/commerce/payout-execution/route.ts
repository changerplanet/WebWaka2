/**
 * PAYOUT EXECUTION API
 * Wave F2: Payout Execution Engine (MVM)
 * 
 * POST /api/commerce/payout-execution - Create/manage payout batches
 * GET /api/commerce/payout-execution - List payout batches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createPayoutExecutionService } from '@/lib/commerce/payout-execution';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const service = createPayoutExecutionService(tenantId);
    const result = await service.listBatches({ status, limit, offset });

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Payout execution list error:', error);
    return NextResponse.json(
      { error: 'Failed to list payout batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    const service = createPayoutExecutionService(tenantId);

    switch (action) {
      case 'preview': {
        const { periodType, periodStart, periodEnd, minPayoutThreshold } = body;
        
        if (!periodType || !periodStart || !periodEnd) {
          return NextResponse.json(
            { error: 'Missing required fields: periodType, periodStart, periodEnd' },
            { status: 400 }
          );
        }

        const preview = await service.previewBatch({
          periodType,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          minPayoutThreshold,
        });

        return NextResponse.json({
          success: true,
          preview,
        });
      }

      case 'create': {
        const {
          periodType,
          periodStart,
          periodEnd,
          description,
          minPayoutThreshold,
          isDemo,
        } = body;
        
        if (!periodType || !periodStart || !periodEnd) {
          return NextResponse.json(
            { error: 'Missing required fields: periodType, periodStart, periodEnd' },
            { status: 400 }
          );
        }

        const batch = await service.createBatch({
          tenantId,
          periodType,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          description,
          minPayoutThreshold,
          createdBy: session.user.id,
          createdByName: session.user.name || undefined,
          isDemo: isDemo ?? false,
        });

        return NextResponse.json({
          success: true,
          batch,
          message: 'Payout batch created successfully',
        });
      }

      case 'approve': {
        const { batchId } = body;
        
        if (!batchId) {
          return NextResponse.json(
            { error: 'Missing required field: batchId' },
            { status: 400 }
          );
        }

        const batch = await service.approveBatch({
          batchId,
          approvedBy: session.user.id,
          approvedByName: session.user.name || undefined,
        });

        return NextResponse.json({
          success: true,
          batch,
          message: 'Payout batch approved',
        });
      }

      case 'process': {
        const { batchId } = body;
        
        if (!batchId) {
          return NextResponse.json(
            { error: 'Missing required field: batchId' },
            { status: 400 }
          );
        }

        const batch = await service.processBatch({
          batchId,
          processedBy: session.user.id,
          processedByName: session.user.name || undefined,
        });

        return NextResponse.json({
          success: true,
          batch,
          message: 'Payout batch processed',
        });
      }

      case 'cancel': {
        const { batchId, reason } = body;
        
        if (!batchId) {
          return NextResponse.json(
            { error: 'Missing required field: batchId' },
            { status: 400 }
          );
        }

        const batch = await service.cancelBatch({
          batchId,
          cancelledBy: session.user.id,
          cancelledByName: session.user.name || undefined,
          reason,
        });

        return NextResponse.json({
          success: true,
          batch,
          message: 'Payout batch cancelled',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: preview, create, approve, process, cancel' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Payout execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payout request' },
      { status: 500 }
    );
  }
}
