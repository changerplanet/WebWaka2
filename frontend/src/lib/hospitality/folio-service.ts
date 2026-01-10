/**
 * HOSPITALITY SUITE: Folio Service
 * 
 * In-memory service for managing guest folios and charges.
 */

import {
  Folio,
  FolioCharge,
  ChargeType,
  PaymentMethod,
  generateFolioNumber,
  formatNaira,
} from './config';
import { getFoliosStore, getChargesStore } from './demo-data';

// ============================================================================
// FOLIO SERVICE
// ============================================================================

export async function getFolios(tenantId: string, options?: {
  status?: 'OPEN' | 'SETTLED' | 'CLOSED';
  guestId?: string;
  reservationId?: string;
  page?: number;
  limit?: number;
}): Promise<{ folios: Folio[]; total: number; stats: FolioStats }> {
  const store = getFoliosStore();
  let filtered = store.filter((f: any) => f.tenantId === tenantId || tenantId === 'demo-hotel');
  
  if (options?.status) {
    filtered = filtered.filter((f: any) => f.status === options.status);
  }
  
  if (options?.guestId) {
    filtered = filtered.filter((f: any) => f.guestId === options.guestId);
  }
  
  if (options?.reservationId) {
    filtered = filtered.filter((f: any) => f.reservationId === options.reservationId);
  }
  
  // Sort by created date (newest first)
  filtered.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    folios: paginated,
    total,
    stats: calculateFolioStats(store.filter((f: any) => f.tenantId === tenantId || tenantId === 'demo-hotel')),
  };
}

export async function getFolioById(tenantId: string, id: string): Promise<Folio | null> {
  const store = getFoliosStore();
  return store.find((f: any) => f.id === id && (f.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getFolioByReservation(tenantId: string, reservationId: string): Promise<Folio | null> {
  const store = getFoliosStore();
  return store.find((f: any) => 
    f.reservationId === reservationId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  ) || null;
}

export async function createFolio(tenantId: string, data: {
  reservationId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
}): Promise<Folio> {
  const store = getFoliosStore();
  
  const newFolio: Folio = {
    id: `folio_${Date.now()}`,
    tenantId,
    reservationId: data.reservationId,
    guestId: data.guestId,
    guestName: data.guestName,
    roomNumber: data.roomNumber,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    charges: [],
    totalCharges: 0,
    totalPayments: 0,
    balance: 0,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newFolio);
  return newFolio;
}

// ============================================================================
// CHARGE OPERATIONS
// ============================================================================

export async function postCharge(
  tenantId: string,
  folioId: string,
  data: {
    chargeType: ChargeType;
    description: string;
    amount: number;
    quantity?: number;
    reference?: string;
    postedBy: string;
  }
): Promise<FolioCharge | null> {
  const store = getFoliosStore();
  const chargesStore = getChargesStore();
  const folioIndex = store.findIndex(f => 
    f.id === folioId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (folioIndex === -1) return null;
  
  const folio = store[folioIndex];
  
  if (folio.status !== 'OPEN') {
    throw new Error('Cannot post charges to a closed folio');
  }
  
  const quantity = data.quantity || 1;
  const total = data.amount * quantity;
  
  const newCharge: FolioCharge = {
    id: `chg_${Date.now()}`,
    folioId,
    chargeType: data.chargeType,
    description: data.description,
    amount: data.amount,
    quantity,
    total,
    date: new Date().toISOString().split('T')[0],
    reference: data.reference,
    postedBy: data.postedBy,
    createdAt: new Date().toISOString(),
  };
  
  chargesStore.push(newCharge);
  
  // Update folio
  folio.charges.push(newCharge);
  folio.totalCharges += total;
  folio.balance = folio.totalCharges - folio.totalPayments;
  folio.updatedAt = new Date().toISOString();
  
  return newCharge;
}

export async function postPayment(
  tenantId: string,
  folioId: string,
  data: {
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    postedBy: string;
  }
): Promise<FolioCharge | null> {
  const store = getFoliosStore();
  const chargesStore = getChargesStore();
  const folioIndex = store.findIndex(f => 
    f.id === folioId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (folioIndex === -1) return null;
  
  const folio = store[folioIndex];
  
  if (folio.status === 'CLOSED') {
    throw new Error('Cannot post payments to a closed folio');
  }
  
  const newPayment: FolioCharge = {
    id: `chg_${Date.now()}`,
    folioId,
    chargeType: 'PAYMENT',
    description: `Payment - ${data.paymentMethod}`,
    amount: -data.amount, // Negative for payments
    quantity: 1,
    total: -data.amount,
    date: new Date().toISOString().split('T')[0],
    reference: data.reference,
    postedBy: data.postedBy,
    createdAt: new Date().toISOString(),
  };
  
  chargesStore.push(newPayment);
  
  // Update folio
  folio.charges.push(newPayment);
  folio.totalPayments += data.amount;
  folio.balance = folio.totalCharges - folio.totalPayments;
  folio.updatedAt = new Date().toISOString();
  
  return newPayment;
}

export async function postRefund(
  tenantId: string,
  folioId: string,
  data: {
    amount: number;
    reason: string;
    postedBy: string;
  }
): Promise<FolioCharge | null> {
  const store = getFoliosStore();
  const chargesStore = getChargesStore();
  const folioIndex = store.findIndex(f => 
    f.id === folioId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (folioIndex === -1) return null;
  
  const folio = store[folioIndex];
  
  const newRefund: FolioCharge = {
    id: `chg_${Date.now()}`,
    folioId,
    chargeType: 'REFUND',
    description: `Refund: ${data.reason}`,
    amount: data.amount,
    quantity: 1,
    total: data.amount,
    date: new Date().toISOString().split('T')[0],
    postedBy: data.postedBy,
    createdAt: new Date().toISOString(),
  };
  
  chargesStore.push(newRefund);
  
  // Update folio (refund reduces payments)
  folio.charges.push(newRefund);
  folio.totalPayments -= data.amount;
  folio.balance = folio.totalCharges - folio.totalPayments;
  folio.updatedAt = new Date().toISOString();
  
  return newRefund;
}

export async function getChargesByFolio(tenantId: string, folioId: string): Promise<FolioCharge[]> {
  const chargesStore = getChargesStore();
  return chargesStore.filter((c: any) => c.folioId === folioId);
}

// ============================================================================
// FOLIO SETTLEMENT
// ============================================================================

export async function settleFolio(
  tenantId: string,
  folioId: string,
  settledBy: string
): Promise<Folio | null> {
  const store = getFoliosStore();
  const folioIndex = store.findIndex(f => 
    f.id === folioId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (folioIndex === -1) return null;
  
  const folio = store[folioIndex];
  
  if (folio.balance !== 0) {
    throw new Error(`Cannot settle folio with outstanding balance: ${formatNaira(folio.balance)}`);
  }
  
  store[folioIndex] = {
    ...folio,
    status: 'SETTLED',
    settledAt: new Date().toISOString(),
    settledBy,
    updatedAt: new Date().toISOString(),
  };
  
  return store[folioIndex];
}

export async function closeFolio(
  tenantId: string,
  folioId: string,
  settledBy: string
): Promise<Folio | null> {
  const store = getFoliosStore();
  const folioIndex = store.findIndex(f => 
    f.id === folioId && 
    (f.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (folioIndex === -1) return null;
  
  store[folioIndex] = {
    ...store[folioIndex],
    status: 'CLOSED',
    settledAt: new Date().toISOString(),
    settledBy,
    updatedAt: new Date().toISOString(),
  };
  
  return store[folioIndex];
}

// ============================================================================
// STATISTICS
// ============================================================================

interface FolioStats {
  totalFolios: number;
  openFolios: number;
  settledFolios: number;
  totalRevenue: number;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  averageFolioValue: number;
  byChargeType: Record<string, number>;
}

function calculateFolioStats(folios: Folio[]): FolioStats {
  const open = folios.filter((f: any) => f.status === 'OPEN');
  const settled = folios.filter((f: any) => f.status === 'SETTLED' || f.status === 'CLOSED');
  
  const totalCharges = folios.reduce((sum: any, f) => sum + f.totalCharges, 0);
  const totalPayments = folios.reduce((sum: any, f) => sum + f.totalPayments, 0);
  const outstandingBalance = open.reduce((sum: any, f) => sum + f.balance, 0);
  
  // Revenue from settled folios
  const totalRevenue = settled.reduce((sum: any, f) => sum + f.totalPayments, 0);
  
  // Breakdown by charge type
  const byChargeType: Record<string, number> = {};
  folios.forEach((f: any) => {
    f.charges.forEach((c: any) => {
      if (c.total > 0) { // Only positive charges
        byChargeType[c.chargeType] = (byChargeType[c.chargeType] || 0) + c.total;
      }
    });
  });
  
  return {
    totalFolios: folios.length,
    openFolios: open.length,
    settledFolios: settled.length,
    totalRevenue,
    totalCharges,
    totalPayments,
    outstandingBalance,
    averageFolioValue: folios.length > 0 ? Math.round(totalCharges / folios.length) : 0,
    byChargeType,
  };
}

export async function getFolioStats(tenantId: string): Promise<FolioStats> {
  const store = getFoliosStore();
  const filtered = store.filter((f: any) => f.tenantId === tenantId || tenantId === 'demo-hotel');
  return calculateFolioStats(filtered);
}

// ============================================================================
// ROOM CHARGE POSTING (From POS)
// ============================================================================

export async function postRoomCharge(
  tenantId: string,
  roomNumber: string,
  data: {
    chargeType: ChargeType;
    description: string;
    amount: number;
    quantity?: number;
    reference?: string;
    postedBy: string;
  }
): Promise<FolioCharge | null> {
  const store = getFoliosStore();
  
  // Find open folio for the room
  const folio = store.find((f: any) => 
    (f.tenantId === tenantId || tenantId === 'demo-hotel') &&
    f.roomNumber === roomNumber &&
    f.status === 'OPEN'
  );
  
  if (!folio) {
    throw new Error(`No open folio found for room ${roomNumber}`);
  }
  
  return postCharge(tenantId, folio.id, data);
}
