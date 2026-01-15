/**
 * ParkHub Driver SMS API
 * Wave F7: SMS Driver Updates
 * 
 * API endpoint for sending SMS notifications to drivers.
 * User-triggered only - NO automation.
 * 
 * POST: Send SMS notification to a driver
 * GET: Get SMS history for a driver or trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createDriverSmsService } from '@/lib/parkhub/sms';

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
    const {
      driverId,
      tripId,
      messageType,
      customMessage,
      isDemo,
    } = body;

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'driverId is required' },
        { status: 400 }
      );
    }

    if (!messageType) {
      return NextResponse.json(
        { success: false, error: 'messageType is required' },
        { status: 400 }
      );
    }

    const validMessageTypes = [
      'TRIP_ASSIGNMENT',
      'READY_TO_DEPART',
      'DEPARTURE_REMINDER',
      'STATUS_CHANGE',
      'CANCELLATION',
      'CUSTOM',
    ];

    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { success: false, error: `Invalid messageType. Must be one of: ${validMessageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (messageType === 'CUSTOM' && !customMessage) {
      return NextResponse.json(
        { success: false, error: 'customMessage is required for CUSTOM messageType' },
        { status: 400 }
      );
    }

    if (['TRIP_ASSIGNMENT', 'READY_TO_DEPART', 'DEPARTURE_REMINDER', 'STATUS_CHANGE', 'CANCELLATION'].includes(messageType) && !tripId) {
      return NextResponse.json(
        { success: false, error: `tripId is required for ${messageType} messageType` },
        { status: 400 }
      );
    }

    const smsService = createDriverSmsService(tenantId);

    const result = await smsService.sendDriverSms({
      tenantId,
      driverId,
      tripId,
      messageType,
      customMessage,
      sentById: session.user.id,
      sentByName: session.user.name || session.user.email || 'Unknown',
      isDemo: isDemo ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Driver SMS API error:', error);
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
    const driverId = searchParams.get('driverId');
    const tripId = searchParams.get('tripId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!driverId && !tripId) {
      return NextResponse.json(
        { success: false, error: 'Either driverId or tripId is required' },
        { status: 400 }
      );
    }

    const smsService = createDriverSmsService(tenantId);

    if (driverId) {
      const history = await smsService.getDriverSmsHistory(driverId, limit);
      if (!history) {
        return NextResponse.json(
          { success: false, error: 'Driver not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: history });
    }

    if (tripId) {
      const logs = await smsService.getTripSmsLogs(tripId);
      return NextResponse.json({ success: true, data: { tripId, messages: logs } });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Driver SMS API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
