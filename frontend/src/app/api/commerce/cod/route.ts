/**
 * COD (Cash on Delivery) Payment API
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Handles COD lifecycle from creation to reconciliation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createCodService } from '@/lib/commerce/payment-verification';

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
    const { action } = body;

    const codService = createCodService(tenantId);

    switch (action) {
      case 'create': {
        const { orderId, orderNumber, expectedAmount, customerPhone, customerName, deliveryAddress } = body;
        
        if (!orderId || !expectedAmount) {
          return NextResponse.json({ error: 'Missing required fields: orderId, expectedAmount' }, { status: 400 });
        }

        const payment = await codService.createCodPayment({
          tenantId,
          orderId,
          orderNumber,
          expectedAmount,
          customerPhone,
          customerName,
          deliveryAddress,
        });

        return NextResponse.json({ success: true, payment });
      }

      case 'assign_agent': {
        const { codPaymentId, agentId, agentName } = body;

        if (!codPaymentId || !agentId || !agentName) {
          return NextResponse.json({ error: 'Missing required fields: codPaymentId, agentId, agentName' }, { status: 400 });
        }

        const result = await codService.assignDeliveryAgent({
          codPaymentId,
          agentId,
          agentName,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_delivered': {
        const { codPaymentId } = body;

        if (!codPaymentId) {
          return NextResponse.json({ error: 'Missing required field: codPaymentId' }, { status: 400 });
        }

        const result = await codService.markAsDelivered(codPaymentId);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'collect': {
        const { codPaymentId, collectedAmount, collectionMethod, notes } = body;

        if (!codPaymentId || collectedAmount === undefined || !collectionMethod) {
          return NextResponse.json({ error: 'Missing required fields: codPaymentId, collectedAmount, collectionMethod' }, { status: 400 });
        }

        const result = await codService.collectPayment({
          codPaymentId,
          collectedAmount,
          collectionMethod,
          collectedById: session.user.id,
          collectedByName: session.user.name || session.user.email || 'Unknown',
          notes,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_failed': {
        const { codPaymentId, reason } = body;

        if (!codPaymentId || !reason) {
          return NextResponse.json({ error: 'Missing required fields: codPaymentId, reason' }, { status: 400 });
        }

        const result = await codService.markAsFailed({
          codPaymentId,
          reason,
          markedById: session.user.id,
          markedByName: session.user.name || session.user.email || 'Unknown',
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_returned': {
        const { codPaymentId, reason } = body;

        if (!codPaymentId || !reason) {
          return NextResponse.json({ error: 'Missing required fields: codPaymentId, reason' }, { status: 400 });
        }

        const result = await codService.markAsReturned(codPaymentId, reason);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'reconcile': {
        const { codPaymentId, reconciliationRef } = body;

        if (!codPaymentId) {
          return NextResponse.json({ error: 'Missing required field: codPaymentId' }, { status: 400 });
        }

        const result = await codService.reconcilePayment({
          codPaymentId,
          reconciledById: session.user.id,
          reconciledByName: session.user.name || session.user.email || 'Unknown',
          reconciliationRef,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('COD API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const deliveryAgentId = searchParams.get('deliveryAgentId');
    const agentPending = searchParams.get('agentPending');
    const pendingReconciliation = searchParams.get('pendingReconciliation') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const codService = createCodService(tenantId);

    if (agentPending) {
      const payments = await codService.getAgentPendingCollections(agentPending);
      return NextResponse.json({ payments });
    }

    if (pendingReconciliation) {
      const payments = await codService.getPendingReconciliation();
      return NextResponse.json({ payments });
    }

    if (paymentId) {
      const payment = await codService.getPayment(paymentId);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      return NextResponse.json({ payment });
    }

    if (orderId) {
      const payment = await codService.getPaymentByOrderId(orderId);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      return NextResponse.json({ payment });
    }

    const { payments, total } = await codService.listPayments({
      status: status as any,
      deliveryAgentId: deliveryAgentId || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ payments, total, limit, offset });
  } catch (error) {
    console.error('COD GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
