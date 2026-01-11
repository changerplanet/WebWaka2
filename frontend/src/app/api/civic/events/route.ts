export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Events API
 * 
 * GET - List events with filters
 * POST - Create, update, manage events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEvents,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  scheduleEvent,
  startEvent,
  completeEvent,
  cancelEvent,
  postponeEvent,
  recordAttendance,
  getEventStats,
} from '@/lib/civic/event-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const { searchParams } = new URL(request.url);
    
    // Check for single event fetch
    const id = searchParams.get('id');
    if (id) {
      const event = await getEventById(tenantId, id);
      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, event });
    }
    
    // Check for upcoming events
    const listType = searchParams.get('list');
    if (listType === 'upcoming') {
      const limit = parseInt(searchParams.get('limit') || '5');
      const upcoming = await getUpcomingEvents(tenantId, limit);
      return NextResponse.json({ success: true, events: upcoming });
    }
    
    // Check for stats only
    if (searchParams.get('statsOnly') === 'true') {
      const stats = await getEventStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Get list with filters
    const options = {
      status: searchParams.get('status') as any,
      type: searchParams.get('type') as any,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    const result = await getEvents(tenantId, options);
    
    return NextResponse.json({
      success: true,
      ...result,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    });
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-civic';
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'schedule':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Event ID required' },
            { status: 400 }
          );
        }
        const scheduled = await scheduleEvent(tenantId, data.id);
        if (!scheduled) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: scheduled,
          message: 'Event scheduled successfully',
        });
        
      case 'start':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Event ID required' },
            { status: 400 }
          );
        }
        const started = await startEvent(tenantId, data.id);
        if (!started) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: started,
          message: 'Event started',
        });
        
      case 'complete':
        if (!data.id || data.actualAttendees === undefined) {
          return NextResponse.json(
            { success: false, error: 'Event ID and attendance count required' },
            { status: 400 }
          );
        }
        const completed = await completeEvent(
          tenantId,
          data.id,
          data.actualAttendees,
          data.minutesUrl
        );
        if (!completed) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: completed,
          message: completed.quorumMet 
            ? 'Event completed. Quorum was met.' 
            : 'Event completed. Quorum was NOT met.',
        });
        
      case 'cancel':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Event ID required' },
            { status: 400 }
          );
        }
        const cancelled = await cancelEvent(tenantId, data.id);
        if (!cancelled) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: cancelled,
          message: 'Event cancelled',
        });
        
      case 'postpone':
        if (!data.id || !data.newDate) {
          return NextResponse.json(
            { success: false, error: 'Event ID and new date required' },
            { status: 400 }
          );
        }
        const postponed = await postponeEvent(
          tenantId,
          data.id,
          data.newDate,
          data.newStartTime,
          data.newEndTime
        );
        if (!postponed) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: postponed,
          message: 'Event postponed',
        });
        
      case 'record-attendance':
        if (!data.id || data.attendeeCount === undefined) {
          return NextResponse.json(
            { success: false, error: 'Event ID and attendee count required' },
            { status: 400 }
          );
        }
        const recorded = await recordAttendance(tenantId, data.id, data.attendeeCount);
        if (!recorded) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: recorded,
          message: 'Attendance recorded',
        });
        
      case 'update':
        if (!data.id) {
          return NextResponse.json(
            { success: false, error: 'Event ID required' },
            { status: 400 }
          );
        }
        const updated = await updateEvent(tenantId, data.id, data);
        if (!updated) {
          return NextResponse.json(
            { success: false, error: 'Event not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          event: updated,
          message: 'Event updated',
        });
        
      default:
        // Create new event
        const event = await createEvent(tenantId, data);
        return NextResponse.json({
          success: true,
          event,
          message: 'Event created successfully',
        }, { status: 201 });
    }
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process event request' },
      { status: 500 }
    );
  }
}
