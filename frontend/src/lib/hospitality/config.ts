/**
 * HOSPITALITY SUITE: Configuration & Constants
 * 
 * Labels, enums, types, and configuration for the Hospitality Suite.
 * Nigerian hospitality context - Hotels, Guest Houses, Restaurants, etc.
 */

// ============================================================================
// LABELS (UI Display)
// ============================================================================

export const HOSPITALITY_LABELS = {
  guests: 'Guests',
  rooms: 'Rooms',
  reservations: 'Reservations',
  checkIn: 'Check-In',
  checkOut: 'Check-Out',
  housekeeping: 'Housekeeping',
  folio: 'Folio',
  charges: 'Charges',
  tables: 'Tables',
  orders: 'Orders',
};

// ============================================================================
// ROOM TYPES & STATUS
// ============================================================================

export const ROOM_TYPES = {
  STANDARD: { name: 'Standard Room', baseRate: 15000, maxOccupancy: 2 },
  DELUXE: { name: 'Deluxe Room', baseRate: 25000, maxOccupancy: 2 },
  EXECUTIVE: { name: 'Executive Room', baseRate: 35000, maxOccupancy: 2 },
  SUITE: { name: 'Suite', baseRate: 50000, maxOccupancy: 4 },
  PRESIDENTIAL: { name: 'Presidential Suite', baseRate: 100000, maxOccupancy: 4 },
  SINGLE: { name: 'Single Room', baseRate: 10000, maxOccupancy: 1 },
  TWIN: { name: 'Twin Room', baseRate: 18000, maxOccupancy: 2 },
  FAMILY: { name: 'Family Room', baseRate: 40000, maxOccupancy: 6 },
} as const;

export type RoomType = keyof typeof ROOM_TYPES;

export const OCCUPANCY_STATUS = {
  VACANT: { name: 'Vacant', color: 'green' },
  OCCUPIED: { name: 'Occupied', color: 'red' },
  DUE_OUT: { name: 'Due Out', color: 'orange' },
  DUE_IN: { name: 'Due In', color: 'blue' },
  RESERVED: { name: 'Reserved', color: 'purple' },
} as const;

export type OccupancyStatus = keyof typeof OCCUPANCY_STATUS;

export const CLEANING_STATUS = {
  CLEAN: { name: 'Clean', color: 'green' },
  DIRTY: { name: 'Dirty', color: 'red' },
  INSPECTED: { name: 'Inspected', color: 'blue' },
  IN_PROGRESS: { name: 'Cleaning', color: 'yellow' },
  OUT_OF_ORDER: { name: 'Out of Order', color: 'gray' },
} as const;

export type CleaningStatus = keyof typeof CLEANING_STATUS;

export const BED_TYPES = {
  SINGLE: 'Single Bed',
  DOUBLE: 'Double Bed',
  QUEEN: 'Queen Bed',
  KING: 'King Bed',
  TWIN: 'Twin Beds',
  BUNK: 'Bunk Beds',
} as const;

export type BedType = keyof typeof BED_TYPES;

export const ROOM_AMENITIES = [
  'Air Conditioning',
  'TV',
  'WiFi',
  'Minibar',
  'Safe',
  'Balcony',
  'Ocean View',
  'Pool View',
  'Garden View',
  'Bathtub',
  'Shower',
  'Work Desk',
  'Coffee Maker',
  'Room Service',
  'Ironing Board',
] as const;

// ============================================================================
// RESERVATION STATUS
// ============================================================================

export const RESERVATION_STATUS = {
  PENDING: { name: 'Pending', color: 'yellow' },
  CONFIRMED: { name: 'Confirmed', color: 'blue' },
  CHECKED_IN: { name: 'Checked In', color: 'green' },
  CHECKED_OUT: { name: 'Checked Out', color: 'gray' },
  CANCELLED: { name: 'Cancelled', color: 'red' },
  NO_SHOW: { name: 'No Show', color: 'red' },
} as const;

export type ReservationStatus = keyof typeof RESERVATION_STATUS;

export const BOOKING_SOURCES = {
  WALK_IN: { name: 'Walk-In', icon: 'user' },
  PHONE: { name: 'Phone', icon: 'phone' },
  WEBSITE: { name: 'Website', icon: 'globe' },
  OTA: { name: 'OTA', icon: 'laptop' },
  CORPORATE: { name: 'Corporate', icon: 'building' },
  REFERRAL: { name: 'Referral', icon: 'share' },
} as const;

export type BookingSource = keyof typeof BOOKING_SOURCES;

// ============================================================================
// HOUSEKEEPING
// ============================================================================

export const HOUSEKEEPING_TASK_TYPES = {
  CHECKOUT_CLEAN: { name: 'Checkout Clean', priority: 'HIGH', estimatedMinutes: 45 },
  STAY_OVER: { name: 'Stay-over Service', priority: 'MEDIUM', estimatedMinutes: 20 },
  DEEP_CLEAN: { name: 'Deep Clean', priority: 'LOW', estimatedMinutes: 90 },
  TURNDOWN: { name: 'Turndown Service', priority: 'LOW', estimatedMinutes: 10 },
  INSPECTION: { name: 'Inspection', priority: 'MEDIUM', estimatedMinutes: 10 },
  TOUCH_UP: { name: 'Touch Up', priority: 'LOW', estimatedMinutes: 15 },
} as const;

export type HousekeepingTaskType = keyof typeof HOUSEKEEPING_TASK_TYPES;

export const HOUSEKEEPING_STATUS = {
  PENDING: { name: 'Pending', color: 'yellow' },
  ASSIGNED: { name: 'Assigned', color: 'blue' },
  IN_PROGRESS: { name: 'In Progress', color: 'purple' },
  COMPLETED: { name: 'Completed', color: 'green' },
  INSPECTED: { name: 'Inspected', color: 'green' },
  CANCELLED: { name: 'Cancelled', color: 'gray' },
} as const;

export type HousekeepingStatus = keyof typeof HOUSEKEEPING_STATUS;

// ============================================================================
// FOLIO & CHARGES
// ============================================================================

export const CHARGE_TYPES = {
  ROOM: { name: 'Room Charge', category: 'ACCOMMODATION' },
  FB_RESTAURANT: { name: 'Restaurant', category: 'FOOD_BEVERAGE' },
  FB_BAR: { name: 'Bar', category: 'FOOD_BEVERAGE' },
  FB_ROOM_SERVICE: { name: 'Room Service', category: 'FOOD_BEVERAGE' },
  MINIBAR: { name: 'Minibar', category: 'FOOD_BEVERAGE' },
  LAUNDRY: { name: 'Laundry', category: 'SERVICE' },
  SPA: { name: 'Spa', category: 'SERVICE' },
  PARKING: { name: 'Parking', category: 'SERVICE' },
  TELEPHONE: { name: 'Telephone', category: 'SERVICE' },
  INTERNET: { name: 'Internet', category: 'SERVICE' },
  OTHER: { name: 'Other', category: 'OTHER' },
  DEPOSIT: { name: 'Deposit', category: 'PAYMENT' },
  PAYMENT: { name: 'Payment', category: 'PAYMENT' },
  REFUND: { name: 'Refund', category: 'PAYMENT' },
  ADJUSTMENT: { name: 'Adjustment', category: 'ADJUSTMENT' },
} as const;

export type ChargeType = keyof typeof CHARGE_TYPES;

export const PAYMENT_METHODS = {
  CASH: { name: 'Cash', icon: 'banknote' },
  CARD: { name: 'Card (POS)', icon: 'credit-card' },
  TRANSFER: { name: 'Bank Transfer', icon: 'building' },
  MOBILE: { name: 'Mobile Money', icon: 'smartphone' },
  CORPORATE: { name: 'Corporate Account', icon: 'briefcase' },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

// ============================================================================
// GUEST TYPES
// ============================================================================

export const GUEST_TYPES = {
  INDIVIDUAL: { name: 'Individual', icon: 'user' },
  CORPORATE: { name: 'Corporate', icon: 'building' },
  GROUP: { name: 'Group', icon: 'users' },
  VIP: { name: 'VIP', icon: 'star' },
} as const;

export type GuestType = keyof typeof GUEST_TYPES;

export const ID_TYPES = {
  NIN: 'National ID (NIN)',
  PASSPORT: 'Passport',
  DRIVERS_LICENSE: "Driver's License",
  VOTERS_CARD: "Voter's Card",
  COMPANY_ID: 'Company ID',
} as const;

export type IdType = keyof typeof ID_TYPES;

// ============================================================================
// TYPES
// ============================================================================

export interface Room {
  id: string;
  tenantId: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  bedType: BedType;
  maxOccupancy: number;
  baseRate: number;
  amenities: string[];
  description?: string;
  occupancyStatus: OccupancyStatus;
  cleaningStatus: CleaningStatus;
  currentReservationId?: string;
  currentGuestName?: string;
  nextReservationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  tenantId: string;
  guestNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  guestType: GuestType;
  idType?: IdType;
  idNumber?: string;
  nationality?: string;
  companyName?: string;
  address?: string;
  city?: string;
  preferences?: string;
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  lastVisit?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  reservationNumber: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  ratePerNight: number;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  status: ReservationStatus;
  source: BookingSource;
  specialRequests?: string;
  arrivalTime?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  folioId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingTask {
  id: string;
  tenantId: string;
  roomId: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: HousekeepingStatus;
  assignedTo?: string;
  assignedToName?: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  notes?: string;
  issues?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolioCharge {
  id: string;
  folioId: string;
  chargeType: ChargeType;
  description: string;
  amount: number;
  quantity: number;
  total: number;
  date: string;
  reference?: string;
  postedBy: string;
  createdAt: string;
}

export interface Folio {
  id: string;
  tenantId: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  charges: FolioCharge[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  status: 'OPEN' | 'SETTLED' | 'CLOSED';
  settledAt?: string;
  settledBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CAPABILITY BUNDLE
// ============================================================================

export const HOSPITALITY_CAPABILITY_BUNDLE = {
  key: 'hospitality',
  name: 'Hospitality Suite',
  description: 'Complete hotel and restaurant management',
  requiredCapabilities: ['crm', 'inventory', 'pos', 'billing', 'payments'],
  optionalCapabilities: ['hr', 'analytics'],
};

// ============================================================================
// HELPERS
// ============================================================================

export function generateReservationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `RES-${year}-${random}`;
}

export function generateGuestNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GST-${year}-${random}`;
}

export function generateFolioNumber(reservationNumber: string): string {
  return `FOL-${reservationNumber.replace('RES-', '')}`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

export function isTomorrow(dateString: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateString === tomorrow.toISOString().split('T')[0];
}
