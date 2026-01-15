/**
 * ParkHub Manifest Types
 * Wave F8: Manifest Generation
 * 
 * Types for manifest generation, printing, and verification.
 */

export type ManifestStatus = 
  | 'DRAFT'
  | 'GENERATED'
  | 'PRINTED'
  | 'DEPARTED'
  | 'COMPLETED'
  | 'VOIDED';

export type ManifestSyncStatus = 
  | 'SYNCED'
  | 'PENDING_SYNC'
  | 'SYNC_FAILED';

export type ManifestRevisionType = 
  | 'INITIAL'
  | 'REPRINT'
  | 'CORRECTION'
  | 'VOID';

export interface ManifestPassenger {
  seatNumber: string;
  passengerName: string;
  passengerPhone: string | null;
  ticketNumber: string;
  ticketId: string;
  paymentMethod: string;
  amount: number;
}

export interface ManifestData {
  id: string;
  tenantId: string;
  tripId: string;
  parkId: string;
  manifestNumber: string;
  serialNumber: string;
  
  routeName: string;
  origin: string;
  destination: string;
  departureMode: string;
  scheduledDeparture: Date | null;
  
  vehiclePlateNumber: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  driverName: string | null;
  driverPhone: string | null;
  
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  
  passengerList: ManifestPassenger[];
  
  totalRevenue: number;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
  
  status: ManifestStatus;
  syncStatus: ManifestSyncStatus;
  
  verificationHash: string | null;
  qrCodeData: string | null;
  isDemo: boolean;
  
  generatedById: string | null;
  generatedByName: string | null;
  generatedAt: Date | null;
  
  printCount: number;
  lastPrintedAt: Date | null;
  lastPrintedById: string | null;
  lastPrintedByName: string | null;
  
  parkName: string | null;
  parkLocation: string | null;
  parkPhone: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateManifestRequest {
  tenantId: string;
  tripId: string;
  parkId: string;
  parkName?: string;
  parkLocation?: string;
  parkPhone?: string;
  generatedById?: string;
  generatedByName?: string;
  isDemo?: boolean;
  offlineManifestNumber?: string;
  offlineVerificationHash?: string;
  offlineQrCodeData?: string;
  offlineGeneratedAt?: Date;
}

export interface GenerateManifestResult {
  success: boolean;
  manifest?: ManifestData;
  error?: string;
}

export interface PrintManifestRequest {
  manifestId: string;
  printedById: string;
  printedByName: string;
  reason?: string;
}

export interface PrintManifestResult {
  success: boolean;
  manifest?: ManifestData;
  revisionId?: string;
  error?: string;
}

export interface VerifyManifestResult {
  valid: boolean;
  manifest?: {
    manifestNumber: string;
    routeName: string;
    origin: string;
    destination: string;
    scheduledDeparture: Date | null;
    status: ManifestStatus;
    syncStatus: ManifestSyncStatus;
    isDemo: boolean;
    bookedSeats: number;
    totalSeats: number;
    generatedAt: Date | null;
    parkName: string | null;
  };
  error?: string;
}

export interface ManifestListItem {
  id: string;
  manifestNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture: Date | null;
  status: ManifestStatus;
  syncStatus: ManifestSyncStatus;
  bookedSeats: number;
  totalSeats: number;
  printCount: number;
  generatedAt: Date | null;
  isDemo: boolean;
}

export interface ManifestRevision {
  id: string;
  revisionNumber: number;
  revisionType: ManifestRevisionType;
  reason: string | null;
  changesSummary: string | null;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  wasPrinted: boolean;
  printedAt: Date | null;
}
