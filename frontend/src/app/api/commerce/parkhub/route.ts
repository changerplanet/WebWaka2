export const dynamic = 'force-dynamic';

/**
 * PARKHUB API
 * Wave 1: Nigeria-First Modular Commerce
 * Walk-up POS, Dynamic Departures, Ticket Sales
 */

import { NextRequest, NextResponse } from 'next/server';
import { ParkHubService } from '@/lib/commerce/parkhub/parkhub-service';
import { getCurrentSession } from '@/lib/auth';
import { ParkTripDepartureMode } from '@prisma/client';

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
    const tripId = searchParams.get('tripId');
    const routeId = searchParams.get('routeId');
    const action = searchParams.get('action');

    if (action === 'today') {
      const trips = await ParkHubService.getTodaysTrips(tenantId);
      return NextResponse.json({ trips });
    }

    if (action === 'available') {
      const trips = await ParkHubService.getAvailableTrips(
        tenantId,
        routeId || undefined
      );
      return NextResponse.json({ trips });
    }

    if (action === 'manifest' && tripId) {
      const manifest = await ParkHubService.getTripManifest(tripId);
      if (!manifest) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      return NextResponse.json({ manifest });
    }

    if (tripId) {
      const summary = await ParkHubService.getTripSummary(tripId);
      if (!summary) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
      return NextResponse.json({ trip: summary });
    }

    return NextResponse.json({ error: 'action or tripId required' }, { status: 400 });
  } catch (error) {
    console.error('ParkHub GET error:', error);
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
      case 'create-trip':
        if (!data.routeId || !data.totalSeats || !data.basePrice) {
          return NextResponse.json(
            { error: 'routeId, totalSeats, and basePrice required' },
            { status: 400 }
          );
        }
        const trip = await ParkHubService.createTrip(tenantId, {
          routeId: data.routeId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          departureMode: (data.departureMode as ParkTripDepartureMode) || 'SCHEDULED',
          scheduledDeparture: data.scheduledDeparture ? new Date(data.scheduledDeparture) : undefined,
          totalSeats: data.totalSeats,
          departureThreshold: data.departureThreshold,
          basePrice: data.basePrice,
        });
        return NextResponse.json({ trip, message: 'Trip created' });

      case 'sell-ticket':
        if (!data.tripId || !data.passengerName) {
          return NextResponse.json(
            { error: 'tripId and passengerName required' },
            { status: 400 }
          );
        }
        const ticketResult = await ParkHubService.sellTicket(tenantId, {
          tripId: data.tripId,
          passengerName: data.passengerName,
          passengerPhone: data.passengerPhone,
          seatNumber: data.seatNumber,
          paymentMethod: data.paymentMethod || 'CASH',
          soldById: session.user.id,
          soldByName: session.user.name || session.user.email || 'Agent',
          discount: data.discount,
          roundingMode: data.roundingMode,
          offlineSaleId: data.offlineSaleId,
        });
        return NextResponse.json({
          ticket: ticketResult.ticket,
          trip: ticketResult.trip,
          readyToDepart: ticketResult.readyToDepart,
          message: ticketResult.readyToDepart
            ? 'Ticket sold! Trip is ready to depart.'
            : 'Ticket sold successfully'
        });

      case 'start-boarding':
        if (!data.tripId) {
          return NextResponse.json(
            { error: 'tripId required' },
            { status: 400 }
          );
        }
        const boarding = await ParkHubService.startBoarding(
          data.tripId,
          session.user.id,
          session.user.name || session.user.email || 'Agent'
        );
        return NextResponse.json({ trip: boarding, message: 'Boarding started' });

      case 'depart':
        if (!data.tripId) {
          return NextResponse.json({ error: 'tripId required' }, { status: 400 });
        }
        const departed = await ParkHubService.departTrip(data.tripId);
        return NextResponse.json({ trip: departed, message: 'Trip departed' });

      case 'update-status':
        if (!data.tripId || !data.status) {
          return NextResponse.json(
            { error: 'tripId and status required' },
            { status: 400 }
          );
        }
        const updated = await ParkHubService.updateTripStatus(
          data.tripId,
          data.status,
          session.user.id,
          session.user.name || session.user.email || 'Agent'
        );
        return NextResponse.json({ trip: updated });

      case 'cancel-ticket':
        if (!data.ticketId) {
          return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
        }
        const cancelled = await ParkHubService.cancelTicket(data.ticketId, data.reason);
        return NextResponse.json({ ticket: cancelled, message: 'Ticket cancelled' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('ParkHub POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
