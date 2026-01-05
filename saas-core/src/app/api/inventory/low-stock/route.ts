/**
 * MODULE 1: Inventory & Warehouse Management
 * Low Stock Alerts API
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReorderSuggestionEngine } from '@/lib/inventory/reorder-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/low-stock - Get low stock alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const threshold = searchParams.get('threshold');

    const alerts = await ReorderSuggestionEngine.getLowStockAlerts(
      session.activeTenantId,
      {
        locationId: locationId || undefined,
        threshold: threshold ? parseInt(threshold) : undefined,
      }
    );

    // Group by urgency for summary
    const summary = {
      critical: alerts.filter(a => a.urgency === 'CRITICAL').length,
      high: alerts.filter(a => a.urgency === 'HIGH').length,
      normal: alerts.filter(a => a.urgency === 'NORMAL').length,
      low: alerts.filter(a => a.urgency === 'LOW').length,
    };

    return NextResponse.json({
      alerts,
      total: alerts.length,
      summary,
    });
  } catch (error) {
    console.error('[Low Stock API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
