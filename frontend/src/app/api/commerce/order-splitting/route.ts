export const dynamic = 'force-dynamic';

/**
 * MVM ORDER SPLITTING API
 * Wave 1: Nigeria-First Modular Commerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderSplittingService } from '@/lib/commerce/order-splitting/order-splitting-service';
import { getCurrentSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const parentOrderId = searchParams.get('parentOrderId');
    const subOrderId = searchParams.get('subOrderId');
    const action = searchParams.get('action');

    if (action === 'customer-summary' && parentOrderId) {
      const summary = await OrderSplittingService.getCustomerOrderSummary(parentOrderId);
      if (!summary) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order: summary });
    }

    if (parentOrderId) {
      const order = await OrderSplittingService.getParentOrder(parentOrderId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const subOrders = await OrderSplittingService.getSubOrdersForParent(parentOrderId);
      return NextResponse.json({ order, subOrders });
    }

    if (vendorId) {
      const status = searchParams.get('status') || undefined;
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const subOrders = await OrderSplittingService.getVendorSubOrders(
        tenantId,
        vendorId,
        { status, limit, offset }
      );
      return NextResponse.json({ subOrders });
    }

    if (subOrderId) {
      const items = await OrderSplittingService.getSubOrderItems(subOrderId);
      return NextResponse.json({ items });
    }

    return NextResponse.json(
      { error: 'parentOrderId, vendorId, or subOrderId required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Order splitting GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
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
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        if (!data.customerEmail || !data.items || !data.shippingAddress) {
          return NextResponse.json(
            { error: 'customerEmail, items, and shippingAddress required' },
            { status: 400 }
          );
        }
        const result = await OrderSplittingService.createAndSplitOrder(tenantId, data);
        return NextResponse.json({
          parentOrder: result.parentOrder,
          subOrders: result.subOrders,
          message: `Order split into ${result.subOrders.length} vendor orders`
        });

      case 'update-status':
        if (!data.subOrderId || !data.vendorId || !data.status) {
          return NextResponse.json(
            { error: 'subOrderId, vendorId, and status required' },
            { status: 400 }
          );
        }
        const updated = await OrderSplittingService.updateSubOrderStatus(
          data.subOrderId,
          data.vendorId,
          data.status
        );
        return NextResponse.json({
          subOrder: updated,
          message: `Status updated to ${data.status}`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Order splitting POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
