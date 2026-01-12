export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Folio API Route
 * 
 * GET - List/filter folios
 * POST - Create folio, post charges, post payments
 * PATCH - Settle or close folio
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFolios,
  getFolioById,
  getFolioByReservation,
  createFolio,
  postCharge,
  postPayment,
  postRefund,
  getChargesByFolio,
  settleFolio,
  closeFolio,
  getFolioStats,
  postRoomCharge,
} from '@/lib/hospitality/folio-service';

// Phase 13: Folio status validator
type FolioStatus = 'OPEN' | 'SETTLED' | 'CLOSED';
const VALID_FOLIO_STATUSES: FolioStatus[] = ['OPEN', 'SETTLED', 'CLOSED'];
function validateFolioStatus(status: string | null): FolioStatus | undefined {
  if (!status) return undefined;
  if (VALID_FOLIO_STATUSES.includes(status as FolioStatus)) {
    return status as FolioStatus;
  }
  console.warn(`[Hospitality Folio] Invalid status '${status}'`);
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-hotel';
    const { searchParams } = new URL(request.url);
    
    // Check for specific queries
    const id = searchParams.get('id');
    const reservationId = searchParams.get('reservationId');
    const query = searchParams.get('query');
    
    if (id) {
      const folio = await getFolioById(tenantId, id);
      if (!folio) {
        return NextResponse.json(
          { success: false, error: 'Folio not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, folio });
    }
    
    if (reservationId) {
      const folio = await getFolioByReservation(tenantId, reservationId);
      return NextResponse.json({
        success: true,
        folio,
        found: !!folio,
      });
    }
    
    if (query === 'stats') {
      const stats = await getFolioStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    if (query === 'charges') {
      const folioId = searchParams.get('folioId');
      if (!folioId) {
        return NextResponse.json(
          { success: false, error: 'Folio ID is required' },
          { status: 400 }
        );
      }
      const charges = await getChargesByFolio(tenantId, folioId);
      return NextResponse.json({ success: true, charges });
    }
    
    // Regular listing with filters
    const { folios, total, stats } = await getFolios(tenantId, {
      status: validateFolioStatus(searchParams.get('status')),
      guestId: searchParams.get('guestId') || undefined,
      reservationId: searchParams.get('reservationIdFilter') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });
    
    return NextResponse.json({
      success: true,
      folios,
      total,
      stats,
    });
  } catch (error) {
    console.error('Folio API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-hotel';
    const body = await request.json();
    const { action, folioId, ...data } = body;
    
    // Handle actions on existing folios
    if (action && folioId) {
      switch (action) {
        case 'post-charge': {
          if (!data.chargeType || !data.description || !data.amount || !data.postedBy) {
            return NextResponse.json(
              { success: false, error: 'Missing required fields: chargeType, description, amount, postedBy' },
              { status: 400 }
            );
          }
          const charge = await postCharge(tenantId, folioId, data);
          if (!charge) {
            return NextResponse.json(
              { success: false, error: 'Folio not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Charge posted',
            charge,
          });
        }
        
        case 'post-payment': {
          if (!data.amount || !data.paymentMethod || !data.postedBy) {
            return NextResponse.json(
              { success: false, error: 'Missing required fields: amount, paymentMethod, postedBy' },
              { status: 400 }
            );
          }
          const payment = await postPayment(tenantId, folioId, data);
          if (!payment) {
            return NextResponse.json(
              { success: false, error: 'Folio not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Payment posted',
            payment,
          });
        }
        
        case 'post-refund': {
          if (!data.amount || !data.reason || !data.postedBy) {
            return NextResponse.json(
              { success: false, error: 'Missing required fields: amount, reason, postedBy' },
              { status: 400 }
            );
          }
          const refund = await postRefund(tenantId, folioId, data);
          if (!refund) {
            return NextResponse.json(
              { success: false, error: 'Folio not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Refund posted',
            refund,
          });
        }
        
        case 'settle': {
          if (!data.settledBy) {
            return NextResponse.json(
              { success: false, error: 'settledBy is required' },
              { status: 400 }
            );
          }
          const folio = await settleFolio(tenantId, folioId, data.settledBy);
          if (!folio) {
            return NextResponse.json(
              { success: false, error: 'Folio not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Folio settled',
            folio,
          });
        }
        
        case 'close': {
          if (!data.settledBy) {
            return NextResponse.json(
              { success: false, error: 'settledBy is required' },
              { status: 400 }
            );
          }
          const folio = await closeFolio(tenantId, folioId, data.settledBy);
          if (!folio) {
            return NextResponse.json(
              { success: false, error: 'Folio not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Folio closed',
            folio,
          });
        }
        
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Handle room charge (post to room)
    if (action === 'room-charge') {
      if (!data.roomNumber || !data.chargeType || !data.description || !data.amount || !data.postedBy) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: roomNumber, chargeType, description, amount, postedBy' },
          { status: 400 }
        );
      }
      try {
        const charge = await postRoomCharge(tenantId, data.roomNumber, data);
        return NextResponse.json({
          success: true,
          message: `Charge posted to room ${data.roomNumber}`,
          charge,
        });
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }
    
    // Create new folio (usually done automatically at check-in)
    if (!data.reservationId || !data.guestId || !data.guestName || !data.roomNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reservationId, guestId, guestName, roomNumber' },
        { status: 400 }
      );
    }
    
    const folio = await createFolio(tenantId, data);
    
    return NextResponse.json({
      success: true,
      message: 'Folio created successfully',
      folio,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Folio API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process folio operation' },
      { status: 500 }
    );
  }
}
