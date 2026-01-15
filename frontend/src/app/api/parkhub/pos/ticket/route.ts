/**
 * PARKHUB POS TICKET API
 * Wave F1: ParkHub Walk-Up POS Interface
 * 
 * POST /api/parkhub/pos/ticket - Queue or process a ticket sale
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createParkHubPosService } from '@/lib/commerce/parkhub/parkhub-pos-service';

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
    const {
      parkId,
      clientTicketId,
      clientTimestamp,
      routeId,
      routeName,
      tripId,
      tripNumber,
      seatNumbers,
      ticketCount,
      passengerName,
      passengerPhone,
      unitPrice,
      subtotal,
      discount,
      roundingAmount,
      roundingMode,
      totalAmount,
      paymentMethod,
      paymentNotes,
      bankProofUrl,
    } = body;

    if (!parkId || !clientTicketId || !tripId || !routeId) {
      return NextResponse.json(
        { error: 'Missing required fields: parkId, clientTicketId, tripId, routeId' },
        { status: 400 }
      );
    }

    const service = createParkHubPosService(tenantId);

    const result = await service.queueTicket({
      parkId,
      agentId: session.user.id,
      agentName: session.user.name || 'Agent',
      clientTicketId,
      clientTimestamp: new Date(clientTimestamp),
      routeId,
      routeName: routeName || '',
      tripId,
      tripNumber: tripNumber || '',
      seatNumbers: seatNumbers || [],
      ticketCount: ticketCount || 1,
      passengerName,
      passengerPhone,
      unitPrice: unitPrice || 0,
      subtotal: subtotal || 0,
      discount,
      roundingAmount,
      roundingMode,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || 'CASH',
      paymentNotes,
      bankProofUrl,
    });

    return NextResponse.json({
      success: true,
      queueId: result.queueId,
      message: 'Ticket queued successfully',
    });

  } catch (error) {
    console.error('ParkHub POS ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to queue ticket' },
      { status: 500 }
    );
  }
}
