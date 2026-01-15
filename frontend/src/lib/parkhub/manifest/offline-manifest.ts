/**
 * Offline Manifest Generation
 * Wave F8: Manifest Generation (ParkHub)
 * 
 * Client-side manifest generation for offline scenarios.
 * Can be synced later when connectivity is restored.
 * 
 * Uses pure JS SHA-256 implementation for cross-environment compatibility.
 */

import {
  ManifestData,
  ManifestPassenger,
  ManifestStatus,
  ManifestSyncStatus,
} from './types';

function sha256(message: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
  }

  function ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
  }

  function maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
  }

  function sigma0(x: number): number {
    return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  }

  function sigma1(x: number): number {
    return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  }

  function gamma0(x: number): number {
    return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  }

  function gamma1(x: number): number {
    return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
  }

  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    bytes.push(message.charCodeAt(i));
  }

  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }

  const bitLen = (message.length * 8) >>> 0;
  bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  for (let i = 0; i < bytes.length; i += 64) {
    const W: number[] = [];
    for (let j = 0; j < 16; j++) {
      W[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
    }
    for (let j = 16; j < 64; j++) {
      W[j] = (gamma1(W[j - 2]) + W[j - 7] + gamma0(W[j - 15]) + W[j - 16]) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let j = 0; j < 64; j++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g; g = f; f = e; e = (d + T1) >>> 0;
      d = c; c = b; b = a; a = (T1 + T2) >>> 0;
    }

    H = [(H[0] + a) >>> 0, (H[1] + b) >>> 0, (H[2] + c) >>> 0, (H[3] + d) >>> 0, (H[4] + e) >>> 0, (H[5] + f) >>> 0, (H[6] + g) >>> 0, (H[7] + h) >>> 0];
  }

  return H.map(x => x.toString(16).padStart(8, '0')).join('');
}

interface OfflineTripData {
  tripId: string;
  tripNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  departureMode: string;
  scheduledDeparture: Date | null;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  vehiclePlateNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  driverName?: string;
  driverPhone?: string;
}

interface OfflineTicketData {
  id: string;
  seatNumber: string;
  passengerName: string;
  passengerPhone: string | null;
  ticketNumber: string;
  paymentMethod: string;
  amount: number;
}

interface OfflineManifestRequest {
  tenantId: string;
  parkId: string;
  parkName?: string;
  parkLocation?: string;
  parkPhone?: string;
  trip: OfflineTripData;
  tickets: OfflineTicketData[];
  generatedById?: string;
  generatedByName?: string;
  isDemo?: boolean;
}

export function generateOfflineManifest(request: OfflineManifestRequest): ManifestData {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const offlineId = `OFF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const manifestNumber = `MNF-${request.tenantId}-${dateStr}-${offlineId}`;
  const serialNumber = `OFF${Date.now().toString().slice(-8)}`;
  const clientId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const passengerList: ManifestPassenger[] = request.tickets.map((ticket) => ({
    seatNumber: ticket.seatNumber,
    passengerName: ticket.passengerName,
    passengerPhone: ticket.passengerPhone,
    ticketNumber: ticket.ticketNumber,
    ticketId: ticket.id,
    paymentMethod: ticket.paymentMethod,
    amount: ticket.amount,
  }));

  const totalRevenue = passengerList.reduce((sum, p) => sum + p.amount, 0);
  const cashAmount = passengerList
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const cardAmount = passengerList
    .filter((p) => ['POS_CARD', 'CARD'].includes(p.paymentMethod))
    .reduce((sum, p) => sum + p.amount, 0);
  const transferAmount = passengerList
    .filter((p) => p.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  const verificationPayload = `${manifestNumber}:${request.trip.tripId}:${request.tenantId}:${passengerList.length}:${totalRevenue}`;
  const verificationHash = sha256(verificationPayload);

  const qrCodeData = JSON.stringify({
    type: 'PARK_MANIFEST',
    id: manifestNumber,
    t: request.tenantId,
    v: verificationHash.substring(0, 12),
    demo: request.isDemo ?? false,
    offline: true,
  });

  return {
    id: clientId,
    tenantId: request.tenantId,
    tripId: request.trip.tripId,
    parkId: request.parkId,
    manifestNumber,
    serialNumber,
    routeName: request.trip.routeName,
    origin: request.trip.origin,
    destination: request.trip.destination,
    departureMode: request.trip.departureMode,
    scheduledDeparture: request.trip.scheduledDeparture,
    vehiclePlateNumber: request.trip.vehiclePlateNumber || null,
    vehicleMake: request.trip.vehicleMake || null,
    vehicleModel: request.trip.vehicleModel || null,
    driverName: request.trip.driverName || null,
    driverPhone: request.trip.driverPhone || null,
    totalSeats: request.trip.totalSeats,
    bookedSeats: request.trip.bookedSeats,
    availableSeats: request.trip.availableSeats,
    passengerList,
    totalRevenue,
    cashAmount,
    cardAmount,
    transferAmount,
    status: 'GENERATED' as ManifestStatus,
    syncStatus: 'PENDING_SYNC' as ManifestSyncStatus,
    verificationHash,
    qrCodeData,
    isDemo: request.isDemo ?? false,
    generatedById: request.generatedById || null,
    generatedByName: request.generatedByName || null,
    generatedAt: now,
    printCount: 0,
    lastPrintedAt: null,
    lastPrintedById: null,
    lastPrintedByName: null,
    parkName: request.parkName || null,
    parkLocation: request.parkLocation || null,
    parkPhone: request.parkPhone || null,
    createdAt: now,
    updatedAt: now,
  };
}

const OFFLINE_MANIFEST_STORAGE_KEY = 'parkhub_offline_manifests';

export function saveOfflineManifest(manifest: ManifestData): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(OFFLINE_MANIFEST_STORAGE_KEY);
  const manifests: ManifestData[] = stored ? JSON.parse(stored) : [];
  
  const existing = manifests.findIndex((m) => m.tripId === manifest.tripId);
  if (existing >= 0) {
    manifests[existing] = manifest;
  } else {
    manifests.push(manifest);
  }
  
  localStorage.setItem(OFFLINE_MANIFEST_STORAGE_KEY, JSON.stringify(manifests));
}

export function getOfflineManifests(): ManifestData[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(OFFLINE_MANIFEST_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getOfflineManifestByTrip(tripId: string): ManifestData | null {
  const manifests = getOfflineManifests();
  return manifests.find((m) => m.tripId === tripId) || null;
}

export function getPendingSyncManifests(): ManifestData[] {
  const manifests = getOfflineManifests();
  return manifests.filter((m) => m.syncStatus === 'PENDING_SYNC');
}

export function markManifestSynced(tripId: string, serverManifest: ManifestData): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(OFFLINE_MANIFEST_STORAGE_KEY);
  const manifests: ManifestData[] = stored ? JSON.parse(stored) : [];
  
  const index = manifests.findIndex((m) => m.tripId === tripId);
  if (index >= 0) {
    manifests[index] = {
      ...serverManifest,
      syncStatus: 'SYNCED',
    };
    localStorage.setItem(OFFLINE_MANIFEST_STORAGE_KEY, JSON.stringify(manifests));
  }
}

export function markManifestSyncFailed(tripId: string, error: string): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(OFFLINE_MANIFEST_STORAGE_KEY);
  const manifests: ManifestData[] = stored ? JSON.parse(stored) : [];
  
  const index = manifests.findIndex((m) => m.tripId === tripId);
  if (index >= 0) {
    manifests[index] = {
      ...manifests[index],
      syncStatus: 'SYNC_FAILED',
    };
    localStorage.setItem(OFFLINE_MANIFEST_STORAGE_KEY, JSON.stringify(manifests));
  }
}

export function clearSyncedManifests(): void {
  if (typeof window === 'undefined') return;
  
  const manifests = getOfflineManifests();
  const pending = manifests.filter((m) => m.syncStatus !== 'SYNCED');
  localStorage.setItem(OFFLINE_MANIFEST_STORAGE_KEY, JSON.stringify(pending));
}

export async function syncOfflineManifests(
  apiEndpoint: string = '/api/parkhub/manifest'
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const pending = getPendingSyncManifests();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const manifest of pending) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: manifest.tripId,
          parkId: manifest.parkId,
          parkName: manifest.parkName,
          parkLocation: manifest.parkLocation,
          parkPhone: manifest.parkPhone,
          isDemo: manifest.isDemo,
          offlineManifestNumber: manifest.manifestNumber,
          offlineVerificationHash: manifest.verificationHash,
          offlineQrCodeData: manifest.qrCodeData,
          offlineGeneratedAt: manifest.generatedAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.manifest) {
        markManifestSynced(manifest.tripId, result.manifest);
        synced++;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      markManifestSyncFailed(manifest.tripId, error instanceof Error ? error.message : 'Sync failed');
      failed++;
      errors.push(`${manifest.manifestNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { synced, failed, errors };
}
