/**
 * PARKHUB: Transport & Logistics Solution
 * 
 * ParkHub is a Transport configuration of MVM (Multi-Vendor Marketplace).
 * It enables motor parks to operate as digital marketplaces.
 * 
 * COMPOSITION:
 * - MVM: Products (Routes), Orders (Tickets), Vendors (Transport Companies)
 * - Logistics: Drivers, Trip Assignments, Status Tracking
 * - Payments: Commission Calculation, Wallet Management
 * 
 * NO NEW SCHEMAS: Uses metadata fields for transport-specific data.
 */

// Configuration & Mapping
export {
  PARKHUB_LABELS,
  PARKHUB_MVM_CONFIG,
  PARKHUB_CAPABILITY_BUNDLE,
  TRIP_STATUS_MAP,
  TRIP_STATUS_LABELS,
  DRIVER_CONFIG,
  type RouteMetadata,
  type TripStatus,
  getParkHubLabel,
  formatRouteFromProduct,
  formatTicketFromOrder,
  createRouteMetadata,
  getTripStatusLabel,
  mapTripStatusToLogistics,
} from './config';

// Demo Data
export {
  seedParkHubDemoData,
  getParkHubDemoSummary,
  getParkHubDemoCredentials,
  type ParkHubDemoData,
} from './demo-data';

// Partner Activation
export {
  activateParkHub,
  canActivateParkHub,
  getParkHubActivationStatus,
  PARKHUB_SOLUTION_PACKAGE,
  PARKHUB_ACTIVATION_CHECKLIST,
  PARKHUB_DEMO_ONBOARDING,
  type ParkHubActivationRequest,
  type ParkHubActivationResult,
} from './activation';

// API Endpoints
export const PARKHUB_API = {
  config: '/api/parkhub?action=config',
  solutionPackage: '/api/parkhub?action=solution-package',
  demoData: '/api/parkhub?action=demo-data',
  activate: '/api/parkhub', // POST with action: activate
  activationStatus: '/api/parkhub?action=activation-status',
};

// Page Routes
export const PARKHUB_ROUTES = {
  parkAdmin: {
    dashboard: '/parkhub/park-admin',
    trips: '/parkhub/park-admin/trips',
    operators: '/parkhub/park-admin/operators',
    routes: '/parkhub/park-admin/routes',
    tickets: '/parkhub/park-admin/tickets',
    commissions: '/parkhub/park-admin/commissions',
  },
  operator: {
    dashboard: '/parkhub/operator',
    routes: '/parkhub/operator/routes',
    drivers: '/parkhub/operator/drivers',
    trips: '/parkhub/operator/trips',
    tickets: '/parkhub/operator/tickets',
  },
  booking: {
    search: '/parkhub/booking',
    checkout: '/parkhub/booking/checkout',
    confirmation: '/parkhub/booking/confirmation',
  },
  pos: {
    main: '/parkhub/pos',
  },
};
