/**
 * CIVIC SUITE: Event Service
 * 
 * In-memory service for managing events and meetings.
 */

import {
  CivicEvent,
  EventType,
  EventStatus,
  EVENT_TYPES,
} from './config';
import { getEventsStore } from './demo-data';

// ============================================================================
// EVENT SERVICE
// ============================================================================

export async function getEvents(tenantId: string, options?: {
  status?: EventStatus;
  type?: EventType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ events: CivicEvent[]; total: number; stats: EventStats }> {
  const store = getEventsStore();
  let filtered = store.filter((e: any) => e.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.status) {
    filtered = filtered.filter((e: any) => e.status === options.status);
  }
  
  if (options?.type) {
    filtered = filtered.filter((e: any) => e.eventType === options.type);
  }
  
  if (options?.fromDate) {
    filtered = filtered.filter((e: any) => e.eventDate >= options.fromDate!);
  }
  
  if (options?.toDate) {
    filtered = filtered.filter((e: any) => e.eventDate <= options.toDate!);
  }
  
  // Sort by event date (upcoming first, then past)
  const now = new Date().toISOString().split('T')[0];
  filtered.sort((a: any, b: any) => {
    const aUpcoming = a.eventDate >= now;
    const bUpcoming = b.eventDate >= now;
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    if (aUpcoming) return a.eventDate.localeCompare(b.eventDate);
    return b.eventDate.localeCompare(a.eventDate);
  });
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    events: paginated,
    total,
    stats: calculateStats(store.filter((e: any) => e.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getEventById(tenantId: string, id: string): Promise<CivicEvent | null> {
  const store = getEventsStore();
  return store.find((e: any) => e.id === id && (e.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function getUpcomingEvents(tenantId: string, limit: number = 5): Promise<CivicEvent[]> {
  const store = getEventsStore();
  const now = new Date().toISOString().split('T')[0];
  
  return store
    .filter((e: any) => 
      (e.tenantId === tenantId || tenantId === 'demo-civic') && 
      e.eventDate >= now &&
      e.status === 'SCHEDULED'
    )
    .sort((a: any, b: any) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, limit);
}

export async function createEvent(tenantId: string, data: Partial<CivicEvent>): Promise<CivicEvent> {
  const store = getEventsStore();
  const eventType = data.eventType || 'COMMUNITY';
  const eventTypeConfig = EVENT_TYPES[eventType];
  
  const newEvent: CivicEvent = {
    id: `evt_${Date.now()}`,
    tenantId,
    eventType,
    title: data.title || '',
    description: data.description,
    venue: data.venue || '',
    eventDate: data.eventDate || new Date().toISOString().split('T')[0],
    startTime: data.startTime || '09:00',
    endTime: data.endTime || '17:00',
    status: 'DRAFT',
    expectedAttendees: data.expectedAttendees || 0,
    actualAttendees: 0,
    quorumRequired: eventTypeConfig.requiresQuorum ? Math.ceil((data.expectedAttendees || 0) * 0.5) : 0,
    quorumMet: !eventTypeConfig.requiresQuorum,
    agenda: data.agenda,
    createdBy: data.createdBy || 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newEvent);
  return newEvent;
}

export async function updateEvent(
  tenantId: string,
  id: string,
  data: Partial<CivicEvent>
): Promise<CivicEvent | null> {
  const store = getEventsStore();
  const index = store.findIndex((e: any) => e.id === id && (e.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function updateEventStatus(
  tenantId: string,
  id: string,
  status: EventStatus
): Promise<CivicEvent | null> {
  return updateEvent(tenantId, id, { status });
}

export async function scheduleEvent(tenantId: string, id: string): Promise<CivicEvent | null> {
  return updateEventStatus(tenantId, id, 'SCHEDULED');
}

export async function startEvent(tenantId: string, id: string): Promise<CivicEvent | null> {
  return updateEventStatus(tenantId, id, 'ONGOING');
}

export async function completeEvent(
  tenantId: string,
  id: string,
  actualAttendees: number,
  minutesUrl?: string
): Promise<CivicEvent | null> {
  const store = getEventsStore();
  const index = store.findIndex((e: any) => e.id === id && (e.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  const event = store[index];
  const quorumMet = event.quorumRequired === 0 || actualAttendees >= event.quorumRequired;
  
  store[index] = {
    ...event,
    status: 'COMPLETED',
    actualAttendees,
    quorumMet,
    minutesUrl,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function cancelEvent(tenantId: string, id: string): Promise<CivicEvent | null> {
  return updateEventStatus(tenantId, id, 'CANCELLED');
}

export async function postponeEvent(
  tenantId: string,
  id: string,
  newDate: string,
  newStartTime?: string,
  newEndTime?: string
): Promise<CivicEvent | null> {
  const updates: Partial<CivicEvent> = {
    status: 'POSTPONED',
    eventDate: newDate,
  };
  
  if (newStartTime) updates.startTime = newStartTime;
  if (newEndTime) updates.endTime = newEndTime;
  
  return updateEvent(tenantId, id, updates);
}

// ============================================================================
// ATTENDANCE
// ============================================================================

export async function recordAttendance(
  tenantId: string,
  id: string,
  attendeeCount: number
): Promise<CivicEvent | null> {
  const store = getEventsStore();
  const index = store.findIndex((e: any) => e.id === id && (e.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  const event = store[index];
  const quorumMet = event.quorumRequired === 0 || attendeeCount >= event.quorumRequired;
  
  store[index] = {
    ...event,
    actualAttendees: attendeeCount,
    quorumMet,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// STATISTICS
// ============================================================================

interface EventStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  totalAttendees: number;
  avgAttendance: number;
  quorumMetRate: number;
  byType: Record<string, number>;
}

function calculateStats(events: CivicEvent[]): EventStats {
  const now = new Date().toISOString().split('T')[0];
  const completed = events.filter((e: any) => e.status === 'COMPLETED');
  const quorumMet = completed.filter((e: any) => e.quorumMet);
  
  const totalAttendees = completed.reduce((sum: any, e: any) => sum + e.actualAttendees, 0);
  
  return {
    total: events.length,
    upcoming: events.filter((e: any) => e.status === 'SCHEDULED' && e.eventDate >= now).length,
    completed: completed.length,
    cancelled: events.filter((e: any) => e.status === 'CANCELLED').length,
    totalAttendees,
    avgAttendance: completed.length > 0 ? Math.round(totalAttendees / completed.length) : 0,
    quorumMetRate: completed.length > 0 ? (quorumMet.length / completed.length) * 100 : 0,
    byType: events.reduce((acc: any, e: any) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function getEventStats(tenantId: string): Promise<EventStats> {
  const store = getEventsStore();
  const filtered = store.filter((e: any) => e.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateStats(filtered);
}
