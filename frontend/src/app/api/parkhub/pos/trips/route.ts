/**
 * PARKHUB POS TRIPS API
 * Wave F1: ParkHub Walk-Up POS Interface
 * 
 * GET /api/parkhub/pos/trips - List available trips for a route
 * GET /api/parkhub/pos/trips?tripId=xxx - Get seat availability for a trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createParkHubPosService } from '@/lib/commerce/parkhub/parkhub-pos-service';

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
    const parkId = searchParams.get('parkId');
    const routeId = searchParams.get('routeId');
    const tripId = searchParams.get('tripId');

    if (!parkId) {
      return NextResponse.json({ error: 'parkId is required' }, { status: 400 });
    }

    const service = createParkHubPosService(tenantId);

    if (tripId) {
      const seatData = await service.getTripSeats(tripId);
      
      if (!seatData) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        trip: seatData,
      });
    }

    if (!routeId) {
      return NextResponse.json({ error: 'routeId is required' }, { status: 400 });
    }

    const trips = await service.getTripsForRoute(parkId, routeId);

    return NextResponse.json({
      success: true,
      trips,
    });

  } catch (error) {
    console.error('ParkHub POS trips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
