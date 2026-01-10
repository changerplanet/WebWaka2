/**
 * HOSPITALITY SUITE: Guest Service
 * 
 * In-memory service for managing hotel guests.
 * Wraps CRM Contact concepts for hospitality.
 */

import {
  Guest,
  GuestType,
  IdType,
  generateGuestNumber,
} from './config';
import { getGuestsStore, getReservationsStore } from './demo-data';

// ============================================================================
// GUEST SERVICE
// ============================================================================

export async function getGuests(tenantId: string, options?: {
  guestType?: GuestType;
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isBlacklisted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ guests: Guest[]; total: number; stats: GuestStats }> {
  const store = getGuestsStore();
  let filtered = store.filter((g: any) => g.tenantId === tenantId || tenantId === 'demo-hotel');
  
  if (options?.guestType) {
    filtered = filtered.filter((g: any) => g.guestType === options.guestType);
  }
  
  if (options?.loyaltyTier) {
    filtered = filtered.filter((g: any) => g.loyaltyTier === options.loyaltyTier);
  }
  
  if (options?.isBlacklisted !== undefined) {
    filtered = filtered.filter((g: any) => g.isBlacklisted === options.isBlacklisted);
  }
  
  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter((g: any) => 
      g.firstName.toLowerCase().includes(search) ||
      g.lastName.toLowerCase().includes(search) ||
      g.email?.toLowerCase().includes(search) ||
      g.phone.includes(search) ||
      g.guestNumber.toLowerCase().includes(search)
    );
  }
  
  // Sort by name
  filtered.sort((a: any, b: any) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    guests: paginated,
    total,
    stats: calculateGuestStats(store.filter((g: any) => g.tenantId === tenantId || tenantId === 'demo-hotel')),
  };
}

export async function getGuestById(tenantId: string, id: string): Promise<Guest | null> {
  const store = getGuestsStore();
  return store.find((g: any) => g.id === id && (g.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getGuestByPhone(tenantId: string, phone: string): Promise<Guest | null> {
  const store = getGuestsStore();
  return store.find((g: any) => 
    g.phone === phone && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  ) || null;
}

export async function getGuestByEmail(tenantId: string, email: string): Promise<Guest | null> {
  const store = getGuestsStore();
  return store.find((g: any) => 
    g.email?.toLowerCase() === email.toLowerCase() && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  ) || null;
}

export async function searchGuests(tenantId: string, query: string): Promise<Guest[]> {
  const store = getGuestsStore();
  const search = query.toLowerCase();
  
  return store.filter((g: any) => 
    (g.tenantId === tenantId || tenantId === 'demo-hotel') &&
    (
      g.firstName.toLowerCase().includes(search) ||
      g.lastName.toLowerCase().includes(search) ||
      g.email?.toLowerCase().includes(search) ||
      g.phone.includes(search) ||
      g.guestNumber.toLowerCase().includes(search)
    )
  ).slice(0, 10);
}

// ============================================================================
// GUEST OPERATIONS
// ============================================================================

export async function createGuest(tenantId: string, data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  guestType?: GuestType;
  idType?: IdType;
  idNumber?: string;
  nationality?: string;
  companyName?: string;
  address?: string;
  city?: string;
  preferences?: string;
  notes?: string;
}): Promise<Guest> {
  const store = getGuestsStore();
  
  // Check for duplicate phone
  const existing = await getGuestByPhone(tenantId, data.phone);
  if (existing) {
    throw new Error(`Guest with phone ${data.phone} already exists`);
  }
  
  const newGuest: Guest = {
    id: `guest_${Date.now()}`,
    tenantId,
    guestNumber: generateGuestNumber(),
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    guestType: data.guestType || 'INDIVIDUAL',
    idType: data.idType,
    idNumber: data.idNumber,
    nationality: data.nationality || 'Nigerian',
    companyName: data.companyName,
    address: data.address,
    city: data.city,
    preferences: data.preferences,
    loyaltyPoints: 0,
    totalStays: 0,
    totalSpent: 0,
    isBlacklisted: false,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newGuest);
  return newGuest;
}

export async function updateGuest(
  tenantId: string,
  id: string,
  data: Partial<Guest>
): Promise<Guest | null> {
  const store = getGuestsStore();
  const index = store.findIndex(g => 
    g.id === id && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  // Don't allow changing certain fields
  const { id: _, tenantId: __, guestNumber, createdAt, ...updates } = data;
  
  store[index] = {
    ...store[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function blacklistGuest(
  tenantId: string,
  id: string,
  reason: string
): Promise<Guest | null> {
  return updateGuest(tenantId, id, {
    isBlacklisted: true,
    blacklistReason: reason,
  });
}

export async function removeBlacklist(tenantId: string, id: string): Promise<Guest | null> {
  return updateGuest(tenantId, id, {
    isBlacklisted: false,
    blacklistReason: undefined,
  });
}

// ============================================================================
// LOYALTY
// ============================================================================

export async function addLoyaltyPoints(
  tenantId: string,
  guestId: string,
  points: number
): Promise<Guest | null> {
  const store = getGuestsStore();
  const index = store.findIndex(g => 
    g.id === guestId && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  const guest = store[index];
  const newPoints = guest.loyaltyPoints + points;
  
  // Update tier based on points
  let loyaltyTier = guest.loyaltyTier;
  if (newPoints >= 10000) {
    loyaltyTier = 'PLATINUM';
  } else if (newPoints >= 5000) {
    loyaltyTier = 'GOLD';
  } else if (newPoints >= 2000) {
    loyaltyTier = 'SILVER';
  } else if (newPoints >= 500) {
    loyaltyTier = 'BRONZE';
  }
  
  store[index] = {
    ...guest,
    loyaltyPoints: newPoints,
    loyaltyTier,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function redeemLoyaltyPoints(
  tenantId: string,
  guestId: string,
  points: number
): Promise<Guest | null> {
  const store = getGuestsStore();
  const index = store.findIndex(g => 
    g.id === guestId && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  const guest = store[index];
  
  if (guest.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }
  
  store[index] = {
    ...guest,
    loyaltyPoints: guest.loyaltyPoints - points,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// GUEST HISTORY
// ============================================================================

export async function getGuestHistory(tenantId: string, guestId: string): Promise<{
  guest: Guest | null;
  reservations: any[];
  totalStays: number;
  totalSpent: number;
  averageStayLength: number;
  favoriteRoomType?: string;
}> {
  const guests = getGuestsStore();
  const reservations = getReservationsStore();
  
  const guest = guests.find((g: any) => 
    g.id === guestId && 
    (g.tenantId === tenantId || tenantId === 'demo-hotel')
  ) || null;
  
  if (!guest) {
    return {
      guest: null,
      reservations: [],
      totalStays: 0,
      totalSpent: 0,
      averageStayLength: 0,
    };
  }
  
  const guestReservations = reservations.filter((r: any) => 
    r.guestId === guestId &&
    (r.tenantId === tenantId || tenantId === 'demo-hotel')
  ).sort((a: any, b: any) => b.checkInDate.localeCompare(a.checkInDate));
  
  const completedStays = guestReservations.filter((r: any) => 
    r.status === 'CHECKED_OUT' || r.status === 'CHECKED_IN'
  );
  
  const totalSpent = completedStays.reduce((sum: any, r: any) => sum + r.totalAmount, 0);
  const totalNights = completedStays.reduce((sum: any, r: any) => sum + r.nights, 0);
  const averageStayLength = completedStays.length > 0 ? totalNights / completedStays.length : 0;
  
  // Find favorite room type
  const roomTypeCounts: Record<string, number> = {};
  completedStays.forEach((r: any) => {
    roomTypeCounts[r.roomType] = (roomTypeCounts[r.roomType] || 0) + 1;
  });
  const favoriteRoomType = Object.entries(roomTypeCounts)
    .sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
  
  return {
    guest,
    reservations: guestReservations,
    totalStays: completedStays.length,
    totalSpent,
    averageStayLength: Math.round(averageStayLength * 10) / 10,
    favoriteRoomType,
  };
}

// ============================================================================
// VIP GUESTS
// ============================================================================

export async function getVIPGuests(tenantId: string): Promise<Guest[]> {
  const store = getGuestsStore();
  return store.filter((g: any) => 
    (g.tenantId === tenantId || tenantId === 'demo-hotel') &&
    (g.guestType === 'VIP' || g.loyaltyTier === 'PLATINUM' || g.loyaltyTier === 'GOLD')
  );
}

export async function getCorporateGuests(tenantId: string): Promise<Guest[]> {
  const store = getGuestsStore();
  return store.filter((g: any) => 
    (g.tenantId === tenantId || tenantId === 'demo-hotel') &&
    g.guestType === 'CORPORATE'
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

interface GuestStats {
  totalGuests: number;
  individualGuests: number;
  corporateGuests: number;
  vipGuests: number;
  blacklistedGuests: number;
  totalLoyaltyPoints: number;
  byLoyaltyTier: Record<string, number>;
  topGuests: { id: string; name: string; totalSpent: number }[];
  newGuestsThisMonth: number;
}

function calculateGuestStats(guests: Guest[]): GuestStats {
  const individual = guests.filter((g: any) => g.guestType === 'INDIVIDUAL');
  const corporate = guests.filter((g: any) => g.guestType === 'CORPORATE');
  const vip = guests.filter((g: any) => g.guestType === 'VIP');
  const blacklisted = guests.filter((g: any) => g.isBlacklisted);
  
  const totalLoyaltyPoints = guests.reduce((sum: any, g) => sum + g.loyaltyPoints, 0);
  
  const byLoyaltyTier: Record<string, number> = {
    PLATINUM: guests.filter((g: any) => g.loyaltyTier === 'PLATINUM').length,
    GOLD: guests.filter((g: any) => g.loyaltyTier === 'GOLD').length,
    SILVER: guests.filter((g: any) => g.loyaltyTier === 'SILVER').length,
    BRONZE: guests.filter((g: any) => g.loyaltyTier === 'BRONZE').length,
  };
  
  const topGuests = [...guests]
    .filter((g: any) => !g.isBlacklisted)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map((g: any) => ({
      id: g.id,
      name: `${g.firstName} ${g.lastName}`,
      totalSpent: g.totalSpent,
    }));
  
  // Count new guests this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newGuestsThisMonth = guests.filter((g: any) => g.createdAt.startsWith(thisMonth)).length;
  
  return {
    totalGuests: guests.length,
    individualGuests: individual.length,
    corporateGuests: corporate.length,
    vipGuests: vip.length,
    blacklistedGuests: blacklisted.length,
    totalLoyaltyPoints,
    byLoyaltyTier,
    topGuests,
    newGuestsThisMonth,
  };
}

export async function getGuestStats(tenantId: string): Promise<GuestStats> {
  const store = getGuestsStore();
  const filtered = store.filter((g: any) => g.tenantId === tenantId || tenantId === 'demo-hotel');
  return calculateGuestStats(filtered);
}
