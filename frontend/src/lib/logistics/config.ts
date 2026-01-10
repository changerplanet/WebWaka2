/**
 * LOGISTICS SUITE: Configuration & Types
 * 
 * Core types, constants, and configuration for the Logistics Suite.
 * This is a FOUNDATIONAL module - industry-agnostic.
 * 
 * ⚠️ DEMO ONLY - No database persistence
 */

// ============================================================================
// LABELS & BRANDING
// ============================================================================

export const LOGISTICS_LABELS = {
  suite: 'Logistics Suite',
  tagline: 'Operations backbone for goods, people, and assets',
  demoNotice: '⚠️ DEMO MODE: Data resets on refresh',
};

// ============================================================================
// VEHICLE & FLEET TYPES
// ============================================================================

export const VEHICLE_TYPES = {
  MOTORCYCLE: { name: 'Motorcycle', icon: 'motorcycle', capacity: 'small' },
  TRICYCLE: { name: 'Tricycle (Keke)', icon: 'truck', capacity: 'small' },
  CAR: { name: 'Car', icon: 'car', capacity: 'medium' },
  VAN: { name: 'Van', icon: 'shuttle-van', capacity: 'medium' },
  PICKUP: { name: 'Pickup Truck', icon: 'truck-pickup', capacity: 'medium' },
  TRUCK_SMALL: { name: 'Small Truck', icon: 'truck', capacity: 'large' },
  TRUCK_MEDIUM: { name: 'Medium Truck', icon: 'truck', capacity: 'large' },
  TRUCK_LARGE: { name: 'Large Truck (Trailer)', icon: 'truck-moving', capacity: 'xlarge' },
  BUS_MINI: { name: 'Mini Bus', icon: 'bus', capacity: 'medium' },
  BUS_STANDARD: { name: 'Standard Bus', icon: 'bus', capacity: 'large' },
  BUS_LUXURY: { name: 'Luxury Bus', icon: 'bus-alt', capacity: 'large' },
} as const;

export type VehicleType = keyof typeof VEHICLE_TYPES;

export const VEHICLE_STATUS = {
  AVAILABLE: { name: 'Available', color: 'bg-green-100 text-green-700' },
  IN_USE: { name: 'In Use', color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { name: 'Maintenance', color: 'bg-yellow-100 text-yellow-700' },
  OUT_OF_SERVICE: { name: 'Out of Service', color: 'bg-red-100 text-red-700' },
  RESERVED: { name: 'Reserved', color: 'bg-purple-100 text-purple-700' },
} as const;

export type VehicleStatus = keyof typeof VEHICLE_STATUS;

// ============================================================================
// DRIVER TYPES
// ============================================================================

export const DRIVER_STATUS = {
  AVAILABLE: { name: 'Available', color: 'bg-green-100 text-green-700' },
  ON_TRIP: { name: 'On Trip', color: 'bg-blue-100 text-blue-700' },
  OFF_DUTY: { name: 'Off Duty', color: 'bg-gray-100 text-gray-700' },
  ON_BREAK: { name: 'On Break', color: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { name: 'Suspended', color: 'bg-red-100 text-red-700' },
} as const;

export type DriverStatus = keyof typeof DRIVER_STATUS;

export const LICENSE_TYPES = {
  CLASS_A: { name: 'Class A (Motorcycle)', vehicles: ['MOTORCYCLE'] },
  CLASS_B: { name: 'Class B (Light Vehicle)', vehicles: ['CAR', 'VAN', 'PICKUP', 'TRICYCLE'] },
  CLASS_C: { name: 'Class C (Light Truck)', vehicles: ['TRUCK_SMALL', 'BUS_MINI'] },
  CLASS_D: { name: 'Class D (Heavy Vehicle)', vehicles: ['TRUCK_MEDIUM', 'BUS_STANDARD', 'BUS_LUXURY'] },
  CLASS_E: { name: 'Class E (Articulated)', vehicles: ['TRUCK_LARGE'] },
} as const;

export type LicenseType = keyof typeof LICENSE_TYPES;

// ============================================================================
// JOB/TRIP TYPES
// ============================================================================

export const JOB_TYPES = {
  DELIVERY: { name: 'Delivery', description: 'Point-to-point delivery' },
  PICKUP: { name: 'Pickup', description: 'Collection from location' },
  PICKUP_DELIVERY: { name: 'Pickup & Delivery', description: 'Collect and deliver' },
  MULTI_STOP: { name: 'Multi-Stop', description: 'Multiple pickups/deliveries' },
  TRANSPORT: { name: 'Transport', description: 'Passenger transport' },
  FREIGHT: { name: 'Freight', description: 'Cargo movement' },
  TRANSFER: { name: 'Transfer', description: 'Inter-location transfer' },
} as const;

export type JobType = keyof typeof JOB_TYPES;

export const JOB_STATUS = {
  CREATED: { name: 'Created', color: 'bg-slate-100 text-slate-700', order: 1 },
  PENDING: { name: 'Pending', color: 'bg-yellow-100 text-yellow-700', order: 2 },
  ASSIGNED: { name: 'Assigned', color: 'bg-blue-100 text-blue-700', order: 3 },
  ACCEPTED: { name: 'Accepted', color: 'bg-indigo-100 text-indigo-700', order: 4 },
  EN_ROUTE_PICKUP: { name: 'En Route to Pickup', color: 'bg-purple-100 text-purple-700', order: 5 },
  AT_PICKUP: { name: 'At Pickup', color: 'bg-orange-100 text-orange-700', order: 6 },
  PICKED_UP: { name: 'Picked Up', color: 'bg-cyan-100 text-cyan-700', order: 7 },
  IN_TRANSIT: { name: 'In Transit', color: 'bg-blue-100 text-blue-700', order: 8 },
  AT_DELIVERY: { name: 'At Delivery', color: 'bg-orange-100 text-orange-700', order: 9 },
  DELIVERED: { name: 'Delivered', color: 'bg-green-100 text-green-700', order: 10 },
  COMPLETED: { name: 'Completed', color: 'bg-teal-100 text-teal-700', order: 11 },
  CANCELLED: { name: 'Cancelled', color: 'bg-red-100 text-red-700', order: 99 },
  FAILED: { name: 'Failed', color: 'bg-red-100 text-red-700', order: 98 },
} as const;

export type JobStatus = keyof typeof JOB_STATUS;

export const JOB_PRIORITY = {
  LOW: { name: 'Low', color: 'bg-slate-100 text-slate-600' },
  NORMAL: { name: 'Normal', color: 'bg-blue-100 text-blue-600' },
  HIGH: { name: 'High', color: 'bg-orange-100 text-orange-600' },
  URGENT: { name: 'Urgent', color: 'bg-red-100 text-red-600' },
  EXPRESS: { name: 'Express', color: 'bg-purple-100 text-purple-600' },
} as const;

export type JobPriority = keyof typeof JOB_PRIORITY;

// ============================================================================
// DISPATCH TYPES
// ============================================================================

export const DISPATCH_MODE = {
  MANUAL: { name: 'Manual', description: 'Dispatcher assigns jobs manually' },
  AUTO_NEAREST: { name: 'Auto (Nearest)', description: 'Assign to nearest available driver' },
  AUTO_ROUND_ROBIN: { name: 'Auto (Round Robin)', description: 'Rotate assignments evenly' },
  DRIVER_ACCEPT: { name: 'Driver Accept', description: 'Broadcast to drivers, first accept wins' },
} as const;

export type DispatchMode = keyof typeof DISPATCH_MODE;

// ============================================================================
// PROOF OF DELIVERY TYPES
// ============================================================================

export const POD_TYPES = {
  SIGNATURE: { name: 'Signature', required: true },
  PHOTO: { name: 'Photo', required: false },
  PIN_CODE: { name: 'PIN Code', required: false },
  OTP: { name: 'OTP Verification', required: false },
  QR_SCAN: { name: 'QR Code Scan', required: false },
} as const;

export type PODType = keyof typeof POD_TYPES;

export const DELIVERY_EXCEPTIONS = {
  RECIPIENT_UNAVAILABLE: { name: 'Recipient Unavailable', action: 'reschedule' },
  WRONG_ADDRESS: { name: 'Wrong Address', action: 'return' },
  REFUSED: { name: 'Delivery Refused', action: 'return' },
  DAMAGED: { name: 'Item Damaged', action: 'report' },
  PARTIAL: { name: 'Partial Delivery', action: 'note' },
  ACCESS_DENIED: { name: 'Access Denied', action: 'reschedule' },
  WEATHER: { name: 'Weather Delay', action: 'reschedule' },
  VEHICLE_ISSUE: { name: 'Vehicle Issue', action: 'reassign' },
} as const;

export type DeliveryException = keyof typeof DELIVERY_EXCEPTIONS;

// ============================================================================
// PAYMENT & BILLING
// ============================================================================

export const PAYMENT_METHODS = {
  CASH: { name: 'Cash', icon: 'money-bill' },
  TRANSFER: { name: 'Bank Transfer', icon: 'university' },
  CARD: { name: 'Card/POS', icon: 'credit-card' },
  MOBILE_MONEY: { name: 'Mobile Money', icon: 'mobile-alt' },
  WALLET: { name: 'Wallet Balance', icon: 'wallet' },
  COD: { name: 'Cash on Delivery', icon: 'hand-holding-usd' },
  PREPAID: { name: 'Prepaid', icon: 'receipt' },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const BILLING_TYPES = {
  PER_JOB: { name: 'Per Job', description: 'Fixed rate per job' },
  PER_KM: { name: 'Per Kilometer', description: 'Distance-based pricing' },
  PER_HOUR: { name: 'Per Hour', description: 'Time-based pricing' },
  WEIGHT_BASED: { name: 'Weight Based', description: 'Pricing by weight' },
  ZONE_BASED: { name: 'Zone Based', description: 'Pricing by delivery zone' },
  SUBSCRIPTION: { name: 'Subscription', description: 'Monthly/weekly flat rate' },
} as const;

export type BillingType = keyof typeof BILLING_TYPES;

// ============================================================================
// DATA INTERFACES
// ============================================================================

export interface Vehicle {
  id: string;
  tenantId: string;
  vehicleNumber: string; // Plate number
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  status: VehicleStatus;
  capacity: number; // kg or seats
  currentDriverId?: string;
  currentDriverName?: string;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  lastServiceDate?: string;
  nextServiceDue?: string;
  insuranceExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  driverNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;
  ninNumber?: string; // National ID
  status: DriverStatus;
  currentVehicleId?: string;
  currentVehicleNumber?: string;
  currentJobId?: string;
  rating: number; // 1-5
  totalTrips: number;
  totalEarnings: number;
  bankName?: string;
  bankAccount?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  tenantId: string;
  jobNumber: string;
  jobType: JobType;
  status: JobStatus;
  priority: JobPriority;
  
  // Assignment
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  assignedAt?: string;
  acceptedAt?: string;
  
  // Pickup
  pickupAddress: string;
  pickupLandmark?: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupNotes?: string;
  scheduledPickupTime?: string;
  actualPickupTime?: string;
  
  // Delivery
  deliveryAddress: string;
  deliveryLandmark?: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryNotes?: string;
  scheduledDeliveryTime?: string;
  actualDeliveryTime?: string;
  
  // Item details
  itemDescription: string;
  itemQuantity: number;
  itemWeight?: number; // kg
  itemValue?: number; // NGN
  isFragile: boolean;
  requiresSignature: boolean;
  
  // Billing
  billingType: BillingType;
  amount: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paidAt?: string;
  
  // Tracking
  logistics_delivery_status_history: StatusUpdate[];
  
  // POD
  pod?: ProofOfDelivery;
  
  // Metadata
  customerId?: string;
  customerName?: string;
  reference?: string;
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface StatusUpdate {
  status: JobStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface ProofOfDelivery {
  id: string;
  jobId: string;
  deliveredAt: string;
  receivedBy: string;
  signatureData?: string; // Base64 signature
  photoUrl?: string;
  pinCode?: string;
  notes?: string;
  exception?: DeliveryException;
  exceptionNotes?: string;
  createdAt: string;
}

export interface Stop {
  id: string;
  jobId: string;
  sequence: number;
  type: 'PICKUP' | 'DELIVERY' | 'WAYPOINT';
  address: string;
  landmark?: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  scheduledTime?: string;
  actualTime?: string;
  status: 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'SKIPPED';
}

// ============================================================================
// CAPABILITY BUNDLE
// ============================================================================

export const LOGISTICS_CAPABILITY_BUNDLE = {
  key: 'logistics_suite',
  displayName: 'Logistics Suite',
  description: 'Complete logistics operations platform',
  requiredCapabilities: [
    'logistics',
    'logistics_fleet',
    'logistics_dispatch',
    'logistics_tracking',
    'logistics_pod',
    'logistics_billing',
    'logistics_analytics',
  ],
  optionalCapabilities: [
    'logistics_lastmile',
    'logistics_courier',
    'logistics_routing',
    'logistics_sla',
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function generateJobNumber(): string {
  const prefix = 'JOB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateDriverNumber(): string {
  const prefix = 'DRV';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

export function generateVehicleId(): string {
  const prefix = 'VEH';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: JobStatus): string {
  return JOB_STATUS[status]?.color || 'bg-slate-100 text-slate-700';
}

export function canTransitionTo(currentStatus: JobStatus, newStatus: JobStatus): boolean {
  const currentOrder = JOB_STATUS[currentStatus]?.order || 0;
  const newOrder = JOB_STATUS[newStatus]?.order || 0;
  
  // Can always cancel or fail
  if (newStatus === 'CANCELLED' || newStatus === 'FAILED') return true;
  
  // Must progress forward (with some flexibility)
  return newOrder > currentOrder || newOrder === currentOrder + 1;
}
