/**
 * PARKHUB: Configuration & Mapping Service
 * 
 * ParkHub is a Transport configuration of MVM (Multi-Vendor Marketplace).
 * This service provides configuration mappings and UI label overrides.
 * 
 * KEY PRINCIPLE: NO NEW SCHEMAS - Uses existing MVM, Logistics, Payments
 * 
 * MAPPING:
 * - Marketplace Owner = Motor Park (Tenant)
 * - Vendors = Transport Companies
 * - Products = Routes / Trips (service-type products)
 * - Inventory = Seats per bus
 * - Orders = Tickets
 * - Commission = Park-level commission
 */

// ============================================================================
// LABEL MAPPINGS
// ============================================================================

export const PARKHUB_LABELS = {
  // Entity labels
  vendor: 'Transport Company',
  vendors: 'Transport Companies',
  product: 'Route',
  products: 'Routes',
  inventory: 'Seats',
  order: 'Ticket',
  orders: 'Tickets',
  customer: 'Passenger',
  customers: 'Passengers',
  
  // Action labels
  addProduct: 'Add Route',
  editProduct: 'Edit Route',
  deleteProduct: 'Remove Route',
  addInventory: 'Add Seats',
  createOrder: 'Book Ticket',
  viewOrders: 'View Tickets',
  
  // Status labels
  pendingApproval: 'Pending Park Approval',
  approved: 'Approved Operator',
  suspended: 'Suspended Operator',
  
  // Dashboard labels
  totalProducts: 'Total Routes',
  totalOrders: 'Total Tickets Sold',
  totalInventory: 'Available Seats',
  
  // Commission labels
  commission: 'Park Commission',
  vendorEarnings: 'Operator Earnings',
} as const;

// ============================================================================
// PRODUCT METADATA SCHEMA (Routes)
// ============================================================================

export interface RouteMetadata {
  // Route details
  origin: string;
  destination: string;
  departureTime: string; // HH:MM format
  arrivalTime?: string;
  duration?: number; // minutes
  
  // Bus details
  busId?: string;
  busType: 'LUXURY' | 'STANDARD' | 'ECONOMY' | 'MINI_BUS';
  busCapacity: number; // Total seats
  amenities?: string[]; // AC, WiFi, USB, etc.
  
  // Schedule
  frequency: 'DAILY' | 'WEEKLY' | 'SPECIFIC_DAYS';
  operatingDays?: string[]; // ['MON', 'TUE', etc.]
  
  // Pricing variations
  priceModifiers?: {
    childDiscount?: number; // Percentage
    seniorDiscount?: number;
    weekendPremium?: number;
  };
}

// ============================================================================
// TRIP STATUS MAPPING (Logistics Integration)
// ============================================================================

export const TRIP_STATUS_MAP = {
  // ParkHub Status → Logistics Status
  SCHEDULED: 'PENDING',
  BOARDING: 'ASSIGNED',
  DEPARTED: 'PICKING_UP', // Picking up passengers
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVING',
  COMPLETED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const TRIP_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  BOARDING: 'Now Boarding',
  DEPARTED: 'Departed',
  IN_TRANSIT: 'En Route',
  ARRIVED: 'Arrived',
  COMPLETED: 'Trip Completed',
  CANCELLED: 'Cancelled',
} as const;

export type TripStatus = keyof typeof TRIP_STATUS_MAP;

// ============================================================================
// DRIVER (AGENT) TYPE MAPPING
// ============================================================================

export const DRIVER_CONFIG = {
  agentType: 'IN_HOUSE' as const, // or 'FREELANCE' for contracted drivers
  vehicleTypes: ['BUS', 'MINI_BUS', 'COASTER'] as const,
  requiredDocuments: [
    'drivers_license',
    'vehicle_registration',
    'road_worthiness',
    'insurance',
  ],
};

// ============================================================================
// MVM CONFIGURATION PROFILE
// ============================================================================

export const PARKHUB_MVM_CONFIG = {
  // Marketplace settings
  marketplaceName: 'Motor Park',
  marketplaceType: 'TRANSPORT_SERVICES',
  
  // Vendor settings
  vendorLabel: 'Transport Company',
  vendorApprovalRequired: true,
  vendorOnboardingSteps: [
    'REGISTRATION',
    'DOCUMENT_VERIFICATION',
    'FLEET_SETUP',
    'ROUTE_CREATION',
    'APPROVAL',
  ],
  
  // Product settings
  productType: 'SERVICE',
  productLabel: 'Route',
  productMetadataSchema: 'RouteMetadata',
  
  // Inventory settings
  inventoryType: 'QUANTITY',
  inventoryLabel: 'Seats',
  inventoryTrackingEnabled: true,
  allowOverbooking: false,
  
  // Order settings
  orderType: 'TICKET',
  orderLabel: 'Ticket',
  requireCustomerDetails: true,
  
  // Commission settings
  defaultCommissionRate: 0.10, // 10% park commission
  commissionCalculation: 'PER_TICKET',
  
  // Features
  features: {
    multipleStops: false, // Future enhancement
    seatSelection: true,
    parcelBooking: false, // Future enhancement
    advanceBooking: true,
    refunds: true,
    rescheduling: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get ParkHub-specific label for an entity
 */
export function getParkHubLabel(key: keyof typeof PARKHUB_LABELS): string {
  return PARKHUB_LABELS[key] || key;
}

/**
 * Convert MVM product to Route display format
 */
export function formatRouteFromProduct(product: any): any {
  const metadata = product.metadata as RouteMetadata | undefined;
  
  return {
    id: product.id,
    name: product.name,
    origin: metadata?.origin || 'Unknown',
    destination: metadata?.destination || 'Unknown',
    departureTime: metadata?.departureTime || 'N/A',
    arrivalTime: metadata?.arrivalTime,
    duration: metadata?.duration,
    price: product.price,
    availableSeats: product.quantity || 0,
    totalSeats: metadata?.busCapacity || 0,
    busType: metadata?.busType || 'STANDARD',
    amenities: metadata?.amenities || [],
    vendorId: product.vendorId,
    vendorName: product.vendor?.name,
  };
}

/**
 * Convert MVM order to Ticket display format
 */
export function formatTicketFromOrder(order: any): any {
  return {
    id: order.id,
    ticketNumber: order.orderNumber,
    passengerName: order.customer?.name || order.customerName,
    passengerPhone: order.customer?.phone || order.customerPhone,
    route: order.items?.[0]?.productName,
    departureTime: order.items?.[0]?.metadata?.departureTime,
    seatNumber: order.items?.[0]?.metadata?.seatNumber,
    price: order.totalAmount,
    status: order.status,
    bookedAt: order.createdAt,
    tripId: order.metadata?.tripId,
  };
}

/**
 * Create route product metadata from form input
 */
export function createRouteMetadata(input: {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime?: string;
  busType: string;
  busCapacity: number;
  amenities?: string[];
}): RouteMetadata {
  return {
    origin: input.origin,
    destination: input.destination,
    departureTime: input.departureTime,
    arrivalTime: input.arrivalTime,
    busType: input.busType as RouteMetadata['busType'],
    busCapacity: input.busCapacity,
    amenities: input.amenities,
    frequency: 'DAILY',
  };
}

/**
 * Get trip status label
 */
export function getTripStatusLabel(status: TripStatus): string {
  return TRIP_STATUS_LABELS[status] || status;
}

/**
 * Map trip status to logistics status
 */
export function mapTripStatusToLogistics(tripStatus: TripStatus): string {
  return TRIP_STATUS_MAP[tripStatus] || 'PENDING';
}

// ============================================================================
// CAPABILITY BUNDLE DEFINITION
// ============================================================================

export const PARKHUB_CAPABILITY_BUNDLE = {
  key: 'parkhub',
  name: 'ParkHub - Motor Park Solution',
  description: 'Complete motor park management solution with multi-vendor marketplace for transport companies',
  
  // Required capabilities
  requiredCapabilities: [
    'mvm',           // Multi-Vendor Marketplace (core)
    'logistics',     // Driver & trip management
    'payments',      // Payment processing & wallets
  ],
  
  // Optional capabilities
  optionalCapabilities: [
    'pos',           // Walk-in ticket sales
    'crm',           // Customer management
    'analytics',     // Business intelligence
  ],
  
  // Configuration applied when activated
  configuration: PARKHUB_MVM_CONFIG,
  
  // UI customization
  uiProfile: 'parkhub',
  labelOverrides: PARKHUB_LABELS,
  
  // Entitlements
  entitlements: {
    maxRoutes: { free: 5, starter: 20, professional: 100, enterprise: -1 },
    maxDrivers: { free: 2, starter: 10, professional: 50, enterprise: -1 },
    maxDailyTickets: { free: 50, starter: 200, professional: 1000, enterprise: -1 },
    advanceBookingDays: { free: 1, starter: 7, professional: 30, enterprise: 90 },
  },
};
