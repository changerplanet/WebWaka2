/**
 * HOSPITALITY SUITE: Room Service
 * 
 * In-memory service for room inventory and status management.
 */

import {
  Room,
  RoomType,
  OccupancyStatus,
  CleaningStatus,
  ROOM_TYPES,
} from './config';
import { getRoomsStore, DEMO_STATS } from './demo-data';

// ============================================================================
// ROOM SERVICE
// ============================================================================

export async function getRooms(tenantId: string, options?: {
  roomType?: RoomType;
  occupancyStatus?: OccupancyStatus;
  cleaningStatus?: CleaningStatus;
  floor?: number;
  isActive?: boolean;
}): Promise<{ rooms: Room[]; stats: RoomStats }> {
  const store = getRoomsStore();
  let filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel');
  
  if (options?.roomType) {
    filtered = filtered.filter((r: any) => r.roomType === options.roomType);
  }
  
  if (options?.occupancyStatus) {
    filtered = filtered.filter((r: any) => r.occupancyStatus === options.occupancyStatus);
  }
  
  if (options?.cleaningStatus) {
    filtered = filtered.filter((r: any) => r.cleaningStatus === options.cleaningStatus);
  }
  
  if (options?.floor !== undefined) {
    filtered = filtered.filter((r: any) => r.floor === options.floor);
  }
  
  if (options?.isActive !== undefined) {
    filtered = filtered.filter((r: any) => r.isActive === options.isActive);
  }
  
  // Sort by room number
  filtered.sort((a: any, b: any) => a.roomNumber.localeCompare(b.roomNumber));
  
  return {
    rooms: filtered,
    stats: calculateRoomStats(store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel')),
  };
}

export async function getRoomById(tenantId: string, id: string): Promise<Room | null> {
  const store = getRoomsStore();
  return store.find((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getRoomByNumber(tenantId: string, roomNumber: string): Promise<Room | null> {
  const store = getRoomsStore();
  return store.find((r: any) => r.roomNumber === roomNumber && (r.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function updateRoomStatus(
  tenantId: string,
  id: string,
  updates: {
    occupancyStatus?: OccupancyStatus;
    cleaningStatus?: CleaningStatus;
    currentReservationId?: string;
    currentGuestName?: string;
    nextReservationId?: string;
  }
): Promise<Room | null> {
  const store = getRoomsStore();
  const index = store.findIndex((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function setRoomOccupied(
  tenantId: string,
  roomId: string,
  reservationId: string,
  guestName: string
): Promise<Room | null> {
  return updateRoomStatus(tenantId, roomId, {
    occupancyStatus: 'OCCUPIED',
    currentReservationId: reservationId,
    currentGuestName: guestName,
  });
}

export async function setRoomVacant(tenantId: string, roomId: string): Promise<Room | null> {
  return updateRoomStatus(tenantId, roomId, {
    occupancyStatus: 'VACANT',
    cleaningStatus: 'DIRTY',
    currentReservationId: undefined,
    currentGuestName: undefined,
  });
}

export async function setRoomCleaningStatus(
  tenantId: string,
  roomId: string,
  status: CleaningStatus
): Promise<Room | null> {
  return updateRoomStatus(tenantId, roomId, { cleaningStatus: status });
}

// ============================================================================
// AVAILABILITY
// ============================================================================

export async function checkAvailability(
  tenantId: string,
  checkIn: string,
  checkOut: string,
  roomType?: RoomType
): Promise<Room[]> {
  const store = getRoomsStore();
  
  // Get all active rooms of requested type
  let rooms = store.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.isActive &&
    r.cleaningStatus !== 'OUT_OF_ORDER'
  );
  
  if (roomType) {
    rooms = rooms.filter((r: any) => r.roomType === roomType);
  }
  
  // Filter out rooms with conflicting reservations
  // For demo purposes, we check current status
  rooms = rooms.filter((r: any) => {
    // Vacant and not reserved for the dates
    if (r.occupancyStatus === 'VACANT' && !r.nextReservationId) {
      return true;
    }
    return false;
  });
  
  return rooms;
}

export async function getRoomAvailabilityForDate(
  tenantId: string,
  date: string
): Promise<{ roomId: string; roomNumber: string; status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' }[]> {
  const store = getRoomsStore();
  
  return store
    .filter((r: any) => (r.tenantId === tenantId || tenantId === 'demo-hotel') && r.isActive)
    .map(room => {
      let status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' = 'AVAILABLE';
      
      if (!room.isActive || room.cleaningStatus === 'OUT_OF_ORDER') {
        status = 'BLOCKED';
      } else if (room.occupancyStatus === 'OCCUPIED') {
        status = 'OCCUPIED';
      } else if (room.occupancyStatus === 'RESERVED' || room.nextReservationId) {
        status = 'RESERVED';
      }
      
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        status,
      };
    })
    .sort((a: any, b: any) => a.roomNumber.localeCompare(b.roomNumber));
}

// ============================================================================
// STATISTICS
// ============================================================================

interface RoomStats {
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  reservedRooms: number;
  dueOutRooms: number;
  dueInRooms: number;
  outOfOrder: number;
  dirtyRooms: number;
  cleanRooms: number;
  occupancyRate: number;
  byType: Record<string, { total: number; occupied: number }>;
  byFloor: Record<number, { total: number; occupied: number }>;
}

function calculateRoomStats(rooms: Room[]): RoomStats {
  const active = rooms.filter((r: any) => r.isActive);
  const occupied = active.filter((r: any) => r.occupancyStatus === 'OCCUPIED');
  const vacant = active.filter((r: any) => r.occupancyStatus === 'VACANT');
  const reserved = active.filter((r: any) => r.occupancyStatus === 'RESERVED');
  const dueOut = active.filter((r: any) => r.occupancyStatus === 'DUE_OUT');
  const dueIn = active.filter((r: any) => r.occupancyStatus === 'DUE_IN');
  const outOfOrder = rooms.filter((r: any) => !r.isActive || r.cleaningStatus === 'OUT_OF_ORDER');
  const dirty = active.filter((r: any) => r.cleaningStatus === 'DIRTY');
  const clean = active.filter((r: any) => r.cleaningStatus === 'CLEAN' || r.cleaningStatus === 'INSPECTED');
  
  const byType: Record<string, { total: number; occupied: number }> = {};
  const byFloor: Record<number, { total: number; occupied: number }> = {};
  
  active.forEach(room => {
    // By type
    if (!byType[room.roomType]) {
      byType[room.roomType] = { total: 0, occupied: 0 };
    }
    byType[room.roomType].total++;
    if (room.occupancyStatus === 'OCCUPIED') {
      byType[room.roomType].occupied++;
    }
    
    // By floor
    if (!byFloor[room.floor]) {
      byFloor[room.floor] = { total: 0, occupied: 0 };
    }
    byFloor[room.floor].total++;
    if (room.occupancyStatus === 'OCCUPIED') {
      byFloor[room.floor].occupied++;
    }
  });
  
  return {
    totalRooms: rooms.length,
    activeRooms: active.length,
    occupiedRooms: occupied.length,
    vacantRooms: vacant.length,
    reservedRooms: reserved.length,
    dueOutRooms: dueOut.length,
    dueInRooms: dueIn.length,
    outOfOrder: outOfOrder.length,
    dirtyRooms: dirty.length,
    cleanRooms: clean.length,
    occupancyRate: active.length > 0 ? Math.round((occupied.length / active.length) * 100) : 0,
    byType,
    byFloor,
  };
}

export async function getRoomStats(tenantId: string): Promise<RoomStats> {
  const store = getRoomsStore();
  const filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel');
  return calculateRoomStats(filtered);
}
