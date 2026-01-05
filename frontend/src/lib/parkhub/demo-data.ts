/**
 * PARKHUB: Demo Data Seeding Service
 * 
 * Seeds demo data for Transport & ParkHub module.
 * Uses existing MVM, Logistics, and Payments structures.
 * 
 * NO SCHEMA CHANGES - Uses metadata fields for transport-specific data.
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// DEMO DATA DEFINITIONS
// ============================================================================

const DEMO_MOTOR_PARK = {
  name: 'Jibowu Motor Park',
  slug: 'jibowu-motor-park',
  description: 'One of Lagos largest motor parks serving destinations across Nigeria',
  address: 'Jibowu, Yaba, Lagos',
  phone: '08012345678',
  email: 'info@jibowumotorpark.com',
};

const DEMO_TRANSPORT_COMPANIES = [
  {
    name: 'ABC Transport',
    slug: 'abc-transport',
    email: 'operations@abctransport.com',
    phone: '08011111111',
    description: 'Premium interstate transport services with luxury buses',
    commissionRate: 10,
    routes: [
      { origin: 'Lagos (Jibowu)', destination: 'Abuja (Utako)', departureTime: '06:00', price: 15000, busType: 'LUXURY', seats: 18, amenities: ['AC', 'WiFi', 'TV', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Abuja (Utako)', departureTime: '14:00', price: 15000, busType: 'LUXURY', seats: 18, amenities: ['AC', 'WiFi', 'TV', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Ibadan (Challenge)', departureTime: '07:30', price: 4500, busType: 'STANDARD', seats: 14, amenities: ['AC', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Ibadan (Challenge)', departureTime: '15:00', price: 4500, busType: 'STANDARD', seats: 14, amenities: ['AC', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Owerri', departureTime: '10:00', price: 10000, busType: 'STANDARD', seats: 18, amenities: ['AC', 'USB'] },
    ],
    buses: [
      { plateNumber: 'LAG-234-ABC', type: 'LUXURY', capacity: 18 },
      { plateNumber: 'LAG-567-DEF', type: 'STANDARD', capacity: 14 },
    ],
    drivers: [
      { name: 'Chukwu Emmanuel', phone: '08012345678', licenseNumber: 'DRV001' },
      { name: 'Adebayo Kunle', phone: '08023456789', licenseNumber: 'DRV002' },
    ],
  },
  {
    name: 'Peace Mass Transit',
    slug: 'peace-mass-transit',
    email: 'booking@peacemass.com',
    phone: '08022222222',
    description: 'Reliable and affordable transport across Nigeria',
    commissionRate: 10,
    routes: [
      { origin: 'Lagos (Jibowu)', destination: 'Abuja (Utako)', departureTime: '07:00', price: 12000, busType: 'STANDARD', seats: 18, amenities: ['AC', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Benin City', departureTime: '08:00', price: 8000, busType: 'STANDARD', seats: 18, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Enugu', departureTime: '09:00', price: 12000, busType: 'STANDARD', seats: 18, amenities: ['AC', 'USB'] },
      { origin: 'Lagos (Jibowu)', destination: 'Onitsha', departureTime: '11:00', price: 10000, busType: 'STANDARD', seats: 18, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Asaba', departureTime: '06:30', price: 9000, busType: 'STANDARD', seats: 18, amenities: ['AC'] },
    ],
    buses: [
      { plateNumber: 'LAG-111-PMT', type: 'STANDARD', capacity: 18 },
      { plateNumber: 'LAG-222-PMT', type: 'STANDARD', capacity: 18 },
    ],
    drivers: [
      { name: 'Okafor Chinedu', phone: '08034567890', licenseNumber: 'DRV003' },
      { name: 'Aliyu Bello', phone: '08045678901', licenseNumber: 'DRV004' },
    ],
  },
  {
    name: 'GUO Transport',
    slug: 'guo-transport',
    email: 'info@guotransport.com',
    phone: '08033333333',
    description: 'Budget-friendly transport solutions',
    commissionRate: 10,
    routes: [
      { origin: 'Lagos (Jibowu)', destination: 'Port Harcourt', departureTime: '09:00', price: 12000, busType: 'ECONOMY', seats: 22, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Calabar', departureTime: '08:00', price: 14000, busType: 'ECONOMY', seats: 22, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Uyo', departureTime: '10:00', price: 13000, busType: 'ECONOMY', seats: 22, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Warri', departureTime: '07:00', price: 7000, busType: 'ECONOMY', seats: 22, amenities: ['AC'] },
      { origin: 'Lagos (Jibowu)', destination: 'Aba', departureTime: '11:00', price: 11000, busType: 'ECONOMY', seats: 22, amenities: ['AC'] },
    ],
    buses: [
      { plateNumber: 'LAG-333-GUO', type: 'ECONOMY', capacity: 22 },
      { plateNumber: 'LAG-444-GUO', type: 'ECONOMY', capacity: 22 },
    ],
    drivers: [
      { name: 'Ibrahim Musa', phone: '08056789012', licenseNumber: 'DRV005' },
      { name: 'Ojo Taiwo', phone: '08067890123', licenseNumber: 'DRV006' },
      { name: 'Emeka Ugochukwu', phone: '08078901234', licenseNumber: 'DRV007' },
    ],
  },
];

const SAMPLE_TICKETS = [
  { passengerName: 'Adewale Johnson', phone: '08091234567', routeIndex: 0, companyIndex: 0 },
  { passengerName: 'Ngozi Okonkwo', phone: '08092345678', routeIndex: 0, companyIndex: 0 },
  { passengerName: 'Bola Tinubu', phone: '08093456789', routeIndex: 1, companyIndex: 0 },
  { passengerName: 'Chioma Eze', phone: '08094567890', routeIndex: 0, companyIndex: 1 },
  { passengerName: 'Mohammed Yusuf', phone: '08095678901', routeIndex: 1, companyIndex: 1 },
  { passengerName: 'Funke Akindele', phone: '08096789012', routeIndex: 0, companyIndex: 2 },
  { passengerName: 'Emeka Obi', phone: '08097890123', routeIndex: 2, companyIndex: 0 },
  { passengerName: 'Aisha Bello', phone: '08098901234', routeIndex: 3, companyIndex: 1 },
  { passengerName: 'David Oyelaran', phone: '08099012345', routeIndex: 1, companyIndex: 2 },
  { passengerName: 'Grace Nwachukwu', phone: '08090123456', routeIndex: 4, companyIndex: 0 },
  { passengerName: 'Kola Badmus', phone: '08091234568', routeIndex: 2, companyIndex: 1 },
  { passengerName: 'Amina Garba', phone: '08092345679', routeIndex: 3, companyIndex: 2 },
  { passengerName: 'Peter Okoye', phone: '08093456780', routeIndex: 0, companyIndex: 0 },
  { passengerName: 'Blessing Okoro', phone: '08094567891', routeIndex: 1, companyIndex: 1 },
  { passengerName: 'Yemi Alade', phone: '08095678902', routeIndex: 4, companyIndex: 2 },
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

export interface ParkHubDemoData {
  parkId: string;
  companies: Array<{
    id: string;
    name: string;
    routes: Array<{ id: string; name: string }>;
    drivers: Array<{ id: string; name: string }>;
  }>;
  totalRoutes: number;
  totalDrivers: number;
  totalTickets: number;
}

/**
 * Seed ParkHub demo data
 * Returns IDs for reference
 */
export async function seedParkHubDemoData(tenantId: string, partnerId: string): Promise<ParkHubDemoData> {
  const result: ParkHubDemoData = {
    parkId: '',
    companies: [],
    totalRoutes: 0,
    totalDrivers: 0,
    totalTickets: 0,
  };

  console.log('[ParkHub] Seeding demo data for tenant:', tenantId);

  // Create Motor Park as the marketplace owner (this is the tenant)
  result.parkId = tenantId;

  // Create Transport Companies as Vendors (using MVM vendor structure)
  for (const companyDef of DEMO_TRANSPORT_COMPANIES) {
    const vendorId = `vendor_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
    
    const companyData = {
      id: vendorId,
      name: companyDef.name,
      routes: [] as Array<{ id: string; name: string }>,
      drivers: [] as Array<{ id: string; name: string }>,
    };

    // Create Routes as Products (using MVM product structure)
    for (const routeDef of companyDef.routes) {
      const productId = `product_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
      const routeName = `${routeDef.origin} - ${routeDef.destination}`;
      
      companyData.routes.push({ id: productId, name: routeName });
      result.totalRoutes++;
    }

    // Create Drivers as Logistics Agents
    for (const driverDef of companyDef.drivers) {
      const agentId = `agent_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
      
      companyData.drivers.push({ id: agentId, name: driverDef.name });
      result.totalDrivers++;
    }

    result.companies.push(companyData);
  }

  // Create Sample Tickets as Orders
  result.totalTickets = SAMPLE_TICKETS.length;

  console.log('[ParkHub] Demo data seeded successfully:', {
    companies: result.companies.length,
    routes: result.totalRoutes,
    drivers: result.totalDrivers,
    tickets: result.totalTickets,
  });

  return result;
}

/**
 * Get demo data summary
 */
export function getParkHubDemoSummary() {
  return {
    motorPark: DEMO_MOTOR_PARK,
    companies: DEMO_TRANSPORT_COMPANIES.map(c => ({
      name: c.name,
      routeCount: c.routes.length,
      driverCount: c.drivers.length,
      busCount: c.buses.length,
    })),
    totalRoutes: DEMO_TRANSPORT_COMPANIES.reduce((sum, c) => sum + c.routes.length, 0),
    totalDrivers: DEMO_TRANSPORT_COMPANIES.reduce((sum, c) => sum + c.drivers.length, 0),
    totalBuses: DEMO_TRANSPORT_COMPANIES.reduce((sum, c) => sum + c.buses.length, 0),
    sampleTickets: SAMPLE_TICKETS.length,
  };
}

/**
 * Get demo credentials
 */
export function getParkHubDemoCredentials() {
  return {
    parkAdmin: {
      description: 'Motor Park Administrator',
      role: 'Park Admin (Tenant Admin)',
      capabilities: ['Manage all transport companies', 'View all routes & tickets', 'Manage commissions', 'View analytics'],
    },
    operatorAccounts: DEMO_TRANSPORT_COMPANIES.map(c => ({
      company: c.name,
      email: c.email,
      role: 'Transport Company Operator (Vendor)',
      capabilities: ['Manage own routes', 'Manage own drivers', 'View own tickets', 'View earnings'],
    })),
    posAgent: {
      description: 'Park Ticket Agent',
      role: 'POS Agent',
      capabilities: ['Sell tickets', 'Process payments', 'Print receipts'],
    },
  };
}
