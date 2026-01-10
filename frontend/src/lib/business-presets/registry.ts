/**
 * PHASE 6: Business Presets Registry
 * 
 * Central registry of all business type configurations.
 * NO schema changes - config and labels only.
 * 
 * Nigeria-first, Partner-ready.
 */

// ============================================================================
// BUSINESS CATEGORIES
// ============================================================================

export type BusinessCategory = 
  | 'commerce'      // Phase 6.1: MSME Commerce
  | 'services'      // Phase 6.2: Services & Lifestyle
  | 'community';    // Phase 6.3: Community & Access

export type BusinessType =
  // Phase 6.1 - MSME Commerce
  | 'retail_pos'
  | 'supermarket'
  | 'market_mvm'
  | 'ecommerce_store'
  | 'restaurant'
  | 'event_ticketing'
  // Phase 6.2 - Services & Lifestyle
  | 'beauty_salon'
  | 'laundry'
  | 'cleaning_service'
  | 'repair_service'
  | 'auto_workshop'
  | 'courier'
  // Phase 6.3 - Community & Access
  | 'ngo'
  | 'alumni_portal'
  | 'sales_agent'
  | 'gate_pass'
  | 'parking';

// ============================================================================
// BUSINESS PRESET DEFINITION
// ============================================================================

export interface BusinessPreset {
  type: BusinessType;
  category: BusinessCategory;
  phase: '6.1' | '6.2' | '6.3';
  
  // Display
  name: string;
  description: string;
  icon: string;
  color: string;
  
  // Suite dependencies
  baseSuites: string[];
  
  // Label overrides
  labels: Record<string, string>;
  
  // Feature flags
  features: {
    pos: boolean;
    inventory: boolean;
    booking: boolean;
    dispatch: boolean;
    membership: boolean;
    marketplace: boolean;
    commissions: boolean;
  };
  
  // Dashboard KPIs
  kpis: string[];
  
  // Demo data config
  demoData: {
    itemCount: number;
    staffCount: number;
    sampleTransactions: number;
  };
  
  // Pricing suggestion
  pricing: {
    setupFee: number;
    monthlyBase: number;
    currency: string;
  };
  
  // Nigeria-specific
  nigeriaContext: {
    taxRate: number;
    commonPaymentMethods: string[];
    localTerms: Record<string, string>;
  };
}

// ============================================================================
// PHASE 6.1 — MSME COMMERCE PRESETS
// ============================================================================

export const RETAIL_POS_PRESET: BusinessPreset = {
  type: 'retail_pos',
  category: 'commerce',
  phase: '6.1',
  name: 'Retail Store',
  description: 'Point of Sale for retail shops, boutiques, and general stores',
  icon: 'shopping-bag',
  color: '#3B82F6',
  baseSuites: ['commerce'],
  labels: {
    product: 'Item',
    products: 'Items',
    order: 'Sale',
    orders: 'Sales',
    customer: 'Customer',
    inventory: 'Stock',
  },
  features: {
    pos: true,
    inventory: true,
    booking: false,
    dispatch: false,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Daily Sales', 'Items Sold', 'Average Transaction', 'Low Stock Items'],
  demoData: { itemCount: 50, staffCount: 3, sampleTransactions: 25 },
  pricing: { setupFee: 50000, monthlyBase: 15000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer', 'POS', 'USSD'],
    localTerms: { receipt: 'Receipt', discount: 'Discount' },
  },
};

export const SUPERMARKET_PRESET: BusinessPreset = {
  type: 'supermarket',
  category: 'commerce',
  phase: '6.1',
  name: 'Supermarket',
  description: 'Full supermarket POS with barcode scanning and inventory management',
  icon: 'shopping-cart',
  color: '#10B981',
  baseSuites: ['commerce'],
  labels: {
    product: 'Product',
    products: 'Products',
    order: 'Sale',
    orders: 'Sales',
    customer: 'Shopper',
    inventory: 'Stock',
    category: 'Aisle',
  },
  features: {
    pos: true,
    inventory: true,
    booking: false,
    dispatch: false,
    membership: true,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Daily Revenue', 'Basket Size', 'Stock Turnover', 'Expiring Items'],
  demoData: { itemCount: 200, staffCount: 8, sampleTransactions: 100 },
  pricing: { setupFee: 100000, monthlyBase: 35000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer', 'POS', 'Card'],
    localTerms: { aisle: 'Aisle', shelf: 'Shelf' },
  },
};

export const MARKET_MVM_PRESET: BusinessPreset = {
  type: 'market_mvm',
  category: 'commerce',
  phase: '6.1',
  name: 'Market / Trade Association',
  description: 'Multi-vendor marketplace for markets, plazas, and trade associations',
  icon: 'store',
  color: '#F59E0B',
  baseSuites: ['commerce'],
  labels: {
    vendor: 'Trader',
    vendors: 'Traders',
    product: 'Item',
    products: 'Items',
    order: 'Sale',
    orders: 'Sales',
    commission: 'Market Levy',
    marketplace: 'Market',
  },
  features: {
    pos: true,
    inventory: true,
    booking: false,
    dispatch: false,
    membership: true,
    marketplace: true,
    commissions: true,
  },
  kpis: ['Total Market Sales', 'Active Traders', 'Levies Collected', 'Top Sellers'],
  demoData: { itemCount: 100, staffCount: 5, sampleTransactions: 50 },
  pricing: { setupFee: 150000, monthlyBase: 50000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer', 'Mobile Money'],
    localTerms: { stall: 'Shop/Stall', levy: 'Levy', iya_oloja: 'Market Leader' },
  },
};

export const ECOMMERCE_STORE_PRESET: BusinessPreset = {
  type: 'ecommerce_store',
  category: 'commerce',
  phase: '6.1',
  name: 'Online Store',
  description: 'Single-vendor e-commerce store with Nigerian checkout',
  icon: 'globe',
  color: '#8B5CF6',
  baseSuites: ['commerce', 'sites_funnels'],
  labels: {
    product: 'Product',
    products: 'Products',
    order: 'Order',
    orders: 'Orders',
    customer: 'Customer',
    cart: 'Cart',
  },
  features: {
    pos: false,
    inventory: true,
    booking: false,
    dispatch: true,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Online Orders', 'Conversion Rate', 'Abandoned Carts', 'Shipping Pending'],
  demoData: { itemCount: 30, staffCount: 2, sampleTransactions: 15 },
  pricing: { setupFee: 75000, monthlyBase: 25000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Transfer', 'Card', 'Pay on Delivery'],
    localTerms: { delivery: 'Delivery', cod: 'Pay on Delivery' },
  },
};

export const RESTAURANT_PRESET: BusinessPreset = {
  type: 'restaurant',
  category: 'commerce',
  phase: '6.1',
  name: 'Restaurant / Food Vendor',
  description: 'Restaurant POS with menu management, tables, and kitchen flow',
  icon: 'utensils',
  color: '#EF4444',
  baseSuites: ['commerce', 'hospitality'],
  labels: {
    product: 'Menu Item',
    products: 'Menu',
    order: 'Order',
    orders: 'Orders',
    customer: 'Guest',
    category: 'Menu Category',
    table: 'Table',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: false,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Daily Sales', 'Tables Served', 'Average Order', 'Popular Items'],
  demoData: { itemCount: 40, staffCount: 6, sampleTransactions: 30 },
  pricing: { setupFee: 80000, monthlyBase: 30000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer', 'POS'],
    localTerms: { takeaway: 'Takeaway', dine_in: 'Dine In', pepper_soup: 'Soup' },
  },
};

export const EVENT_TICKETING_PRESET: BusinessPreset = {
  type: 'event_ticketing',
  category: 'commerce',
  phase: '6.1',
  name: 'Event & Ticketing',
  description: 'Event management with ticket sales and attendee tracking',
  icon: 'ticket',
  color: '#EC4899',
  baseSuites: ['commerce'],
  labels: {
    product: 'Ticket Type',
    products: 'Tickets',
    order: 'Booking',
    orders: 'Bookings',
    customer: 'Attendee',
    inventory: 'Available Seats',
    event: 'Event',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: false,
    membership: false,
    marketplace: true,
    commissions: true,
  },
  kpis: ['Tickets Sold', 'Revenue', 'Check-ins', 'Upcoming Events'],
  demoData: { itemCount: 10, staffCount: 4, sampleTransactions: 50 },
  pricing: { setupFee: 100000, monthlyBase: 40000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Transfer', 'Card', 'USSD'],
    localTerms: { vip: 'VIP', regular: 'Regular', gate: 'Gate' },
  },
};

// ============================================================================
// PHASE 6.2 — SERVICES & LIFESTYLE PRESETS
// ============================================================================

export const BEAUTY_SALON_PRESET: BusinessPreset = {
  type: 'beauty_salon',
  category: 'services',
  phase: '6.2',
  name: 'Beauty Salon & Spa',
  description: 'Salon booking, services, and retail product sales',
  icon: 'scissors',
  color: '#F472B6',
  baseSuites: ['commerce', 'hospitality'],
  labels: {
    product: 'Service',
    products: 'Services',
    order: 'Appointment',
    orders: 'Appointments',
    customer: 'Client',
    staff: 'Stylist',
    booking: 'Booking',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: false,
    membership: true,
    marketplace: false,
    commissions: true,
  },
  kpis: ['Today\'s Appointments', 'Revenue', 'Top Stylist', 'Product Sales'],
  demoData: { itemCount: 25, staffCount: 5, sampleTransactions: 20 },
  pricing: { setupFee: 60000, monthlyBase: 20000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { braiding: 'Braiding', relaxer: 'Relaxer', pedicure: 'Pedi' },
  },
};

export const LAUNDRY_PRESET: BusinessPreset = {
  type: 'laundry',
  category: 'services',
  phase: '6.2',
  name: 'Laundry & Dry Cleaning',
  description: 'Laundry service with item tracking and delivery',
  icon: 'shirt',
  color: '#06B6D4',
  baseSuites: ['commerce', 'logistics'],
  labels: {
    product: 'Service',
    products: 'Services',
    order: 'Order',
    orders: 'Orders',
    customer: 'Customer',
    job: 'Laundry Order',
    status: 'Status',
  },
  features: {
    pos: true,
    inventory: false,
    booking: false,
    dispatch: true,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Orders Today', 'Pending Pickup', 'Ready for Delivery', 'Revenue'],
  demoData: { itemCount: 15, staffCount: 4, sampleTransactions: 20 },
  pricing: { setupFee: 50000, monthlyBase: 18000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { wash_fold: 'Wash & Fold', dry_clean: 'Dry Clean', iron: 'Ironing' },
  },
};

export const CLEANING_SERVICE_PRESET: BusinessPreset = {
  type: 'cleaning_service',
  category: 'services',
  phase: '6.2',
  name: 'Cleaning Services',
  description: 'Home and office cleaning service management',
  icon: 'sparkles',
  color: '#14B8A6',
  baseSuites: ['logistics', 'commerce'],
  labels: {
    product: 'Service Package',
    products: 'Packages',
    order: 'Booking',
    orders: 'Bookings',
    customer: 'Client',
    job: 'Cleaning Job',
    staff: 'Cleaner',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: true,
    membership: true,
    marketplace: false,
    commissions: true,
  },
  kpis: ['Jobs Today', 'Cleaners Active', 'Pending Jobs', 'Client Satisfaction'],
  demoData: { itemCount: 10, staffCount: 8, sampleTransactions: 15 },
  pricing: { setupFee: 45000, monthlyBase: 15000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { deep_clean: 'Deep Cleaning', regular: 'Regular', fumigation: 'Fumigation' },
  },
};

export const REPAIR_SERVICE_PRESET: BusinessPreset = {
  type: 'repair_service',
  category: 'services',
  phase: '6.2',
  name: 'Repair Services',
  description: 'Phone, electronics, and appliance repair shop',
  icon: 'wrench',
  color: '#6366F1',
  baseSuites: ['logistics', 'commerce'],
  labels: {
    product: 'Repair Service',
    products: 'Services',
    order: 'Repair Order',
    orders: 'Repairs',
    customer: 'Customer',
    job: 'Repair Job',
    inventory: 'Parts',
  },
  features: {
    pos: true,
    inventory: true,
    booking: false,
    dispatch: false,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Jobs In Progress', 'Completed Today', 'Parts Used', 'Revenue'],
  demoData: { itemCount: 20, staffCount: 3, sampleTransactions: 15 },
  pricing: { setupFee: 40000, monthlyBase: 12000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { screen: 'Screen', battery: 'Battery', charging: 'Charging Port' },
  },
};

export const AUTO_WORKSHOP_PRESET: BusinessPreset = {
  type: 'auto_workshop',
  category: 'services',
  phase: '6.2',
  name: 'Auto Workshop / Mechanic',
  description: 'Auto repair and service center management',
  icon: 'car',
  color: '#84CC16',
  baseSuites: ['logistics', 'commerce'],
  labels: {
    product: 'Service',
    products: 'Services',
    order: 'Job Card',
    orders: 'Job Cards',
    customer: 'Vehicle Owner',
    job: 'Repair Job',
    inventory: 'Parts & Supplies',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: false,
    membership: false,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Active Jobs', 'Completed Today', 'Parts Value', 'Revenue'],
  demoData: { itemCount: 30, staffCount: 5, sampleTransactions: 10 },
  pricing: { setupFee: 60000, monthlyBase: 20000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { service: 'Servicing', brake: 'Brake', engine: 'Engine' },
  },
};

export const COURIER_PRESET: BusinessPreset = {
  type: 'courier',
  category: 'services',
  phase: '6.2',
  name: 'Courier & Delivery',
  description: 'Parcel delivery and courier service (status-based tracking)',
  icon: 'package',
  color: '#F97316',
  baseSuites: ['logistics', 'commerce'],
  labels: {
    product: 'Service',
    products: 'Services',
    order: 'Shipment',
    orders: 'Shipments',
    customer: 'Sender',
    job: 'Delivery',
    driver: 'Rider',
  },
  features: {
    pos: true,
    inventory: false,
    booking: false,
    dispatch: true,
    membership: false,
    marketplace: false,
    commissions: true,
  },
  kpis: ['Shipments Today', 'In Transit', 'Delivered', 'Riders Active'],
  demoData: { itemCount: 5, staffCount: 6, sampleTransactions: 30 },
  pricing: { setupFee: 70000, monthlyBase: 25000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Transfer', 'Pay on Delivery'],
    localTerms: { pickup: 'Pickup', dropoff: 'Drop-off', waybill: 'Waybill' },
  },
};

// ============================================================================
// PHASE 6.3 — COMMUNITY & ACCESS PRESETS
// ============================================================================

export const NGO_PRESET: BusinessPreset = {
  type: 'ngo',
  category: 'community',
  phase: '6.3',
  name: 'NGO / Nonprofit',
  description: 'Nonprofit organization management with donors and projects',
  icon: 'heart-handshake',
  color: '#22C55E',
  baseSuites: ['civic', 'commerce'],
  labels: {
    customer: 'Donor',
    customers: 'Donors',
    member: 'Beneficiary',
    members: 'Beneficiaries',
    order: 'Donation',
    orders: 'Donations',
    project: 'Program',
  },
  features: {
    pos: false,
    inventory: true,
    booking: false,
    dispatch: true,
    membership: true,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Donations This Month', 'Active Programs', 'Beneficiaries', 'Volunteers'],
  demoData: { itemCount: 5, staffCount: 10, sampleTransactions: 20 },
  pricing: { setupFee: 30000, monthlyBase: 10000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 0,
    commonPaymentMethods: ['Transfer', 'Card'],
    localTerms: { outreach: 'Outreach', empowerment: 'Empowerment' },
  },
};

export const ALUMNI_PORTAL_PRESET: BusinessPreset = {
  type: 'alumni_portal',
  category: 'community',
  phase: '6.3',
  name: 'Alumni Association',
  description: 'Alumni engagement portal with dues and events',
  icon: 'graduation-cap',
  color: '#7C3AED',
  baseSuites: ['civic', 'education', 'commerce'],
  labels: {
    member: 'Alumnus',
    members: 'Alumni',
    dues: 'Dues',
    event: 'Reunion',
    chapter: 'Chapter',
  },
  features: {
    pos: false,
    inventory: false,
    booking: true,
    dispatch: false,
    membership: true,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Active Members', 'Dues Collected', 'Upcoming Events', 'Engagement Rate'],
  demoData: { itemCount: 3, staffCount: 5, sampleTransactions: 30 },
  pricing: { setupFee: 40000, monthlyBase: 12000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 0,
    commonPaymentMethods: ['Transfer', 'Card'],
    localTerms: { set: 'Set/Class', old_boy: 'Old Boy/Girl' },
  },
};

export const SALES_AGENT_PRESET: BusinessPreset = {
  type: 'sales_agent',
  category: 'community',
  phase: '6.3',
  name: 'Sales Agents / Field Sales',
  description: 'Field sales team management with territories and commissions',
  icon: 'users',
  color: '#0EA5E9',
  baseSuites: ['commerce', 'logistics'],
  labels: {
    staff: 'Agent',
    order: 'Sale',
    orders: 'Sales',
    customer: 'Lead',
    territory: 'Territory',
    commission: 'Commission',
  },
  features: {
    pos: true,
    inventory: true,
    booking: false,
    dispatch: true,
    membership: false,
    marketplace: false,
    commissions: true,
  },
  kpis: ['Agent Sales Today', 'Top Performers', 'Territories Active', 'Commissions Due'],
  demoData: { itemCount: 20, staffCount: 10, sampleTransactions: 40 },
  pricing: { setupFee: 80000, monthlyBase: 30000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer', 'Mobile Money'],
    localTerms: { marketer: 'Marketer', field: 'Field' },
  },
};

export const GATE_PASS_PRESET: BusinessPreset = {
  type: 'gate_pass',
  category: 'community',
  phase: '6.3',
  name: 'Gate Pass & Visitors',
  description: 'Estate and facility visitor management with QR passes',
  icon: 'shield-check',
  color: '#64748B',
  baseSuites: ['civic'],
  labels: {
    visitor: 'Visitor',
    visitors: 'Visitors',
    pass: 'Gate Pass',
    resident: 'Resident',
    security: 'Security',
  },
  features: {
    pos: false,
    inventory: false,
    booking: false,
    dispatch: false,
    membership: true,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Visitors Today', 'Active Passes', 'Pending Approvals', 'Check-ins'],
  demoData: { itemCount: 0, staffCount: 4, sampleTransactions: 50 },
  pricing: { setupFee: 50000, monthlyBase: 15000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 0,
    commonPaymentMethods: [],
    localTerms: { gateman: 'Security', estate: 'Estate' },
  },
};

export const PARKING_PRESET: BusinessPreset = {
  type: 'parking',
  category: 'community',
  phase: '6.3',
  name: 'Parking Management',
  description: 'Parking lot management with slots and payments',
  icon: 'car-front',
  color: '#475569',
  baseSuites: ['commerce', 'logistics'],
  labels: {
    product: 'Slot',
    products: 'Slots',
    order: 'Parking Session',
    orders: 'Sessions',
    customer: 'Driver',
    inventory: 'Available Slots',
  },
  features: {
    pos: true,
    inventory: true,
    booking: true,
    dispatch: false,
    membership: true,
    marketplace: false,
    commissions: false,
  },
  kpis: ['Slots Available', 'Active Sessions', 'Revenue Today', 'Peak Hours'],
  demoData: { itemCount: 50, staffCount: 3, sampleTransactions: 40 },
  pricing: { setupFee: 60000, monthlyBase: 20000, currency: 'NGN' },
  nigeriaContext: {
    taxRate: 7.5,
    commonPaymentMethods: ['Cash', 'Transfer'],
    localTerms: { valet: 'Valet', hourly: 'Per Hour' },
  },
};

// ============================================================================
// PRESET REGISTRY
// ============================================================================

export const BUSINESS_PRESETS: Record<BusinessType, BusinessPreset> = {
  // Phase 6.1
  retail_pos: RETAIL_POS_PRESET,
  supermarket: SUPERMARKET_PRESET,
  market_mvm: MARKET_MVM_PRESET,
  ecommerce_store: ECOMMERCE_STORE_PRESET,
  restaurant: RESTAURANT_PRESET,
  event_ticketing: EVENT_TICKETING_PRESET,
  // Phase 6.2
  beauty_salon: BEAUTY_SALON_PRESET,
  laundry: LAUNDRY_PRESET,
  cleaning_service: CLEANING_SERVICE_PRESET,
  repair_service: REPAIR_SERVICE_PRESET,
  auto_workshop: AUTO_WORKSHOP_PRESET,
  courier: COURIER_PRESET,
  // Phase 6.3
  ngo: NGO_PRESET,
  alumni_portal: ALUMNI_PORTAL_PRESET,
  sales_agent: SALES_AGENT_PRESET,
  gate_pass: GATE_PASS_PRESET,
  parking: PARKING_PRESET,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPresetsByCategory(category: BusinessCategory): BusinessPreset[] {
  return Object.values(BUSINESS_PRESETS).filter((p: any) => p.category === category);
}

export function getPresetsByPhase(phase: '6.1' | '6.2' | '6.3'): BusinessPreset[] {
  return Object.values(BUSINESS_PRESETS).filter((p: any) => p.phase === phase);
}

export function getAllPresets(): BusinessPreset[] {
  return Object.values(BUSINESS_PRESETS);
}

export function getPreset(type: BusinessType): BusinessPreset | undefined {
  return BUSINESS_PRESETS[type];
}

export function getPresetLabel(type: BusinessType, key: string): string {
  const preset = BUSINESS_PRESETS[type];
  return preset?.labels[key] || key;
}
