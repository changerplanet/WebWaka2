/**
 * HOSPITALITY SUITE: Reservation Service
 * 
 * In-memory service for managing reservations and bookings.
 */

import {
  Reservation,
  ReservationStatus,
  BookingSource,
  RoomType,
  ROOM_TYPES,
  generateReservationNumber,
  calculateNights,
} from './config';
import { getReservationsStore, getRoomsStore, getGuestsStore } from './demo-data';
import { setRoomOccupied, setRoomVacant, updateRoomStatus } from './room-service';
import { createFolio } from './folio-service';

// ============================================================================
// RESERVATION SERVICE
// ============================================================================

export async function getReservations(tenantId: string, options?: {
  status?: ReservationStatus;
  guestId?: string;
  roomId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  source?: BookingSource;
  page?: number;
  limit?: number;
}): Promise<{ reservations: Reservation[]; total: number; stats: ReservationStats }> {
  const store = getReservationsStore();
  let filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel');
  
  if (options?.status) {
    filtered = filtered.filter((r: any) => r.status === options.status);
  }
  
  if (options?.guestId) {
    filtered = filtered.filter((r: any) => r.guestId === options.guestId);
  }
  
  if (options?.roomId) {
    filtered = filtered.filter((r: any) => r.roomId === options.roomId);
  }
  
  if (options?.checkInDate) {
    filtered = filtered.filter((r: any) => r.checkInDate === options.checkInDate);
  }
  
  if (options?.checkOutDate) {
    filtered = filtered.filter((r: any) => r.checkOutDate === options.checkOutDate);
  }
  
  if (options?.source) {
    filtered = filtered.filter((r: any) => r.source === options.source);
  }
  
  // Sort by check-in date (upcoming first)
  filtered.sort((a: any, b: any) => {
    if (a.status === 'CHECKED_IN' && b.status !== 'CHECKED_IN') return -1;
    if (a.status !== 'CHECKED_IN' && b.status === 'CHECKED_IN') return 1;
    return a.checkInDate.localeCompare(b.checkInDate);
  });
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    reservations: paginated,
    total,
    stats: calculateStats(store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel')),
  };
}

export async function getReservationById(tenantId: string, id: string): Promise<Reservation | null> {
  const store = getReservationsStore();
  return store.find((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getReservationByNumber(tenantId: string, number: string): Promise<Reservation | null> {
  const store = getReservationsStore();
  return store.find((r: any) => r.reservationNumber === number && (r.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getTodayArrivals(tenantId: string): Promise<Reservation[]> {
  const today = new Date().toISOString().split('T')[0];
  const store = getReservationsStore();
  
  return store.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.checkInDate === today &&
    (r.status === 'CONFIRMED' || r.status === 'PENDING')
  );
}

export async function getTodayDepartures(tenantId: string): Promise<Reservation[]> {
  const today = new Date().toISOString().split('T')[0];
  const store = getReservationsStore();
  
  return store.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.checkOutDate === today &&
    r.status === 'CHECKED_IN'
  );
}

export async function getInHouseGuests(tenantId: string): Promise<Reservation[]> {
  const store = getReservationsStore();
  
  return store.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.status === 'CHECKED_IN'
  );
}

// ============================================================================
// BOOKING OPERATIONS
// ============================================================================

export async function createReservation(tenantId: string, data: {
  guestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  source: BookingSource;
  ratePerNight?: number;
  depositPaid?: number;
  specialRequests?: string;
  arrivalTime?: string;
  createdBy: string;
}): Promise<Reservation> {
  const store = getReservationsStore();
  const rooms = getRoomsStore();
  const guests = getGuestsStore();
  
  const room = rooms.find((r: any) => r.id === data.roomId);
  const guest = guests.find((g: any) => g.id === data.guestId);
  
  if (!room) throw new Error('Room not found');
  if (!guest) throw new Error('Guest not found');
  
  const nights = calculateNights(data.checkInDate, data.checkOutDate);
  const ratePerNight = data.ratePerNight || ROOM_TYPES[room.roomType].baseRate;
  const totalAmount = nights * ratePerNight;
  const depositPaid = data.depositPaid || 0;
  
  const newReservation: Reservation = {
    id: `res_${Date.now()}`,
    tenantId,
    reservationNumber: generateReservationNumber(),
    guestId: data.guestId,
    guestName: `${guest.firstName} ${guest.lastName}`,
    guestPhone: guest.phone,
    roomId: data.roomId,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    nights,
    adults: data.adults,
    children: data.children || 0,
    ratePerNight,
    totalAmount,
    depositPaid,
    balanceDue: totalAmount - depositPaid,
    status: depositPaid > 0 ? 'CONFIRMED' : 'PENDING',
    source: data.source,
    specialRequests: data.specialRequests,
    arrivalTime: data.arrivalTime,
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newReservation);
  
  // Update room status if check-in is today or earlier
  const today = new Date().toISOString().split('T')[0];
  if (data.checkInDate <= today) {
    await updateRoomStatus(tenantId, data.roomId, {
      occupancyStatus: 'RESERVED',
      nextReservationId: newReservation.id,
    });
  }
  
  return newReservation;
}

export async function updateReservation(
  tenantId: string,
  id: string,
  data: Partial<Reservation>
): Promise<Reservation | null> {
  const store = getReservationsStore();
  const index = store.findIndex((r: any) => r.id === id && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  // Recalculate if dates changed
  if (data.checkInDate || data.checkOutDate) {
    const checkIn = data.checkInDate || store[index].checkInDate;
    const checkOut = data.checkOutDate || store[index].checkOutDate;
    const nights = calculateNights(checkIn, checkOut);
    const ratePerNight = data.ratePerNight || store[index].ratePerNight;
    const totalAmount = nights * ratePerNight;
    
    data.nights = nights;
    data.totalAmount = totalAmount;
    data.balanceDue = totalAmount - (data.depositPaid ?? store[index].depositPaid);
  }
  
  store[index] = {
    ...store[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// CHECK-IN / CHECK-OUT
// ============================================================================

export async function checkIn(tenantId: string, reservationId: string): Promise<{
  reservation: Reservation;
  folio: any;
} | null> {
  const store = getReservationsStore();
  const index = store.findIndex((r: any) => r.id === reservationId && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  const reservation = store[index];
  
  if (reservation.status === 'CHECKED_IN') {
    throw new Error('Guest is already checked in');
  }
  
  if (reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') {
    throw new Error('Cannot check in a cancelled or no-show reservation');
  }
  
  // Update reservation
  store[index] = {
    ...reservation,
    status: 'CHECKED_IN',
    actualCheckIn: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update room status
  await setRoomOccupied(tenantId, reservation.roomId, reservationId, reservation.guestName);
  
  // Create folio
  const folio = await createFolio(tenantId, {
    reservationId,
    guestId: reservation.guestId,
    guestName: reservation.guestName,
    roomNumber: reservation.roomNumber,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
  });
  
  // Update reservation with folio ID
  store[index].folioId = folio.id;
  
  // Update guest stats
  const guests = getGuestsStore();
  const guestIndex = guests.findIndex(g => g.id === reservation.guestId);
  if (guestIndex !== -1) {
    guests[guestIndex].totalStays++;
    guests[guestIndex].lastVisit = new Date().toISOString().split('T')[0];
  }
  
  return {
    reservation: store[index],
    folio,
  };
}

export async function checkOut(tenantId: string, reservationId: string): Promise<Reservation | null> {
  const store = getReservationsStore();
  const index = store.findIndex((r: any) => r.id === reservationId && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  const reservation = store[index];
  
  if (reservation.status !== 'CHECKED_IN') {
    throw new Error('Guest is not checked in');
  }
  
  // Update reservation
  store[index] = {
    ...reservation,
    status: 'CHECKED_OUT',
    actualCheckOut: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update room status
  await setRoomVacant(tenantId, reservation.roomId);
  
  return store[index];
}

export async function cancelReservation(
  tenantId: string,
  reservationId: string,
  reason?: string
): Promise<Reservation | null> {
  const store = getReservationsStore();
  const index = store.findIndex((r: any) => r.id === reservationId && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  if (store[index].status === 'CHECKED_IN') {
    throw new Error('Cannot cancel a checked-in reservation. Please check out first.');
  }
  
  store[index] = {
    ...store[index],
    status: 'CANCELLED',
    specialRequests: reason ? `CANCELLED: ${reason}\n${store[index].specialRequests || ''}` : store[index].specialRequests,
    updatedAt: new Date().toISOString(),
  };
  
  // Clear room reservation
  await updateRoomStatus(tenantId, store[index].roomId, {
    occupancyStatus: 'VACANT',
    nextReservationId: undefined,
  });
  
  return store[index];
}

export async function markNoShow(tenantId: string, reservationId: string): Promise<Reservation | null> {
  const store = getReservationsStore();
  const index = store.findIndex((r: any) => r.id === reservationId && (r.tenantId === tenantId || tenantId === 'demo-hotel'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'NO_SHOW',
    updatedAt: new Date().toISOString(),
  };
  
  // Clear room reservation
  await updateRoomStatus(tenantId, store[index].roomId, {
    occupancyStatus: 'VACANT',
    nextReservationId: undefined,
  });
  
  return store[index];
}

// ============================================================================
// STATISTICS
// ============================================================================

interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  noShow: number;
  todayArrivals: number;
  todayDepartures: number;
  totalRevenue: number;
  averageRate: number;
  bySource: Record<string, number>;
}

function calculateStats(reservations: Reservation[]): ReservationStats {
  const today = new Date().toISOString().split('T')[0];
  
  const pending = reservations.filter((r: any) => r.status === 'PENDING');
  const confirmed = reservations.filter((r: any) => r.status === 'CONFIRMED');
  const checkedIn = reservations.filter((r: any) => r.status === 'CHECKED_IN');
  const checkedOut = reservations.filter((r: any) => r.status === 'CHECKED_OUT');
  const cancelled = reservations.filter((r: any) => r.status === 'CANCELLED');
  const noShow = reservations.filter((r: any) => r.status === 'NO_SHOW');
  
  const todayArrivals = reservations.filter((r: any) => 
    r.checkInDate === today && 
    (r.status === 'CONFIRMED' || r.status === 'PENDING')
  );
  
  const todayDepartures = reservations.filter((r: any) => 
    r.checkOutDate === today && 
    r.status === 'CHECKED_IN'
  );
  
  const totalRevenue = reservations
    .filter((r: any) => r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT')
    .reduce((sum: any, r: any) => sum + r.totalAmount, 0);
  
  const totalNights = reservations.reduce((sum: any, r: any) => sum + r.nights, 0);
  const averageRate = totalNights > 0 ? totalRevenue / totalNights : 0;
  
  const bySource = reservations.reduce((acc: any, r: any) => {
    acc[r.source] = (acc[r.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: reservations.length,
    pending: pending.length,
    confirmed: confirmed.length,
    checkedIn: checkedIn.length,
    checkedOut: checkedOut.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    todayArrivals: todayArrivals.length,
    todayDepartures: todayDepartures.length,
    totalRevenue,
    averageRate: Math.round(averageRate),
    bySource,
  };
}

export async function getReservationStats(tenantId: string): Promise<ReservationStats> {
  const store = getReservationsStore();
  const filtered = store.filter((r: any) => r.tenantId === tenantId || tenantId === 'demo-hotel');
  return calculateStats(filtered);
}
