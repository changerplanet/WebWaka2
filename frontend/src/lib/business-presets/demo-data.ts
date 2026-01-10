/**
 * PHASE 6: Demo Data Generators
 * 
 * Nigeria-realistic demo data for each business type.
 * NO schema changes - uses existing models.
 */

import { BusinessType } from './registry';

// ============================================================================
// NIGERIAN DATA CONSTANTS
// ============================================================================

const NIGERIAN_FIRST_NAMES = [
  'Chidi', 'Ngozi', 'Emeka', 'Chioma', 'Obiora', 'Adaeze', 'Ikenna', 'Nneka',
  'Oluwaseun', 'Folake', 'Adebayo', 'Yetunde', 'Olumide', 'Bukola', 'Tunde',
  'Funke', 'Ahmed', 'Fatima', 'Musa', 'Aisha', 'Ibrahim', 'Zainab',
];

const NIGERIAN_LAST_NAMES = [
  'Okonkwo', 'Adeyemi', 'Eze', 'Okoro', 'Nwosu', 'Adeleke', 'Obi', 'Ajayi',
  'Balogun', 'Okafor', 'Adeola', 'Chukwu', 'Mohammed', 'Aliyu', 'Suleiman',
];

const LAGOS_AREAS = [
  'Ikeja', 'Victoria Island', 'Lekki', 'Surulere', 'Yaba', 'Ikoyi',
  'Ajah', 'Festac', 'Oshodi', 'Mushin', 'Apapa', 'Maryland',
];

const ABUJA_AREAS = [
  'Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi', 'Utako',
];

function randomName(): string {
  const first = NIGERIAN_FIRST_NAMES[Math.floor(Math.random() * NIGERIAN_FIRST_NAMES.length)];
  const last = NIGERIAN_LAST_NAMES[Math.floor(Math.random() * NIGERIAN_LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomPhone(): string {
  const prefixes = ['080', '081', '090', '070', '091'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${number}`;
}

function randomArea(): string {
  const areas = [...LAGOS_AREAS, ...ABUJA_AREAS];
  return areas[Math.floor(Math.random() * areas.length)];
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) / 100) * 100;
}

// ============================================================================
// PHASE 6.1 — MSME COMMERCE DEMO DATA
// ============================================================================

export function generateRetailDemoData() {
  return {
    products: [
      { name: 'Rice (50kg bag)', sku: 'RICE-50KG', price: 75000, stock: 25, category: 'Foodstuff' },
      { name: 'Groundnut Oil (5L)', sku: 'OIL-5L', price: 12000, stock: 40, category: 'Foodstuff' },
      { name: 'Garri (25kg)', sku: 'GARRI-25', price: 18000, stock: 30, category: 'Foodstuff' },
      { name: 'Indomie Carton', sku: 'INDO-CTN', price: 8500, stock: 50, category: 'Foodstuff' },
      { name: 'Peak Milk Tin', sku: 'PEAK-TIN', price: 2800, stock: 100, category: 'Beverages' },
      { name: 'Coca-Cola (35cl)', sku: 'COKE-35', price: 250, stock: 200, category: 'Beverages' },
      { name: 'Detergent (2kg)', sku: 'DET-2KG', price: 3500, stock: 60, category: 'Household' },
      { name: 'Tissue Paper (12 rolls)', sku: 'TISSUE-12', price: 4500, stock: 45, category: 'Household' },
    ],
    staff: [
      { name: randomName(), role: 'Cashier', phone: randomPhone() },
      { name: randomName(), role: 'Stock Keeper', phone: randomPhone() },
      { name: randomName(), role: 'Sales Associate', phone: randomPhone() },
    ],
    customers: [
      { name: randomName(), phone: randomPhone(), area: randomArea() },
      { name: randomName(), phone: randomPhone(), area: randomArea() },
      { name: randomName(), phone: randomPhone(), area: randomArea() },
    ],
  };
}

export function generateMarketMVMDemoData() {
  return {
    vendors: [
      { name: 'Mama Nkechi Foodstuff', category: 'Foodstuff', stall: 'A1', phone: randomPhone() },
      { name: 'Alhaji Musa Grains', category: 'Grains', stall: 'A5', phone: randomPhone() },
      { name: 'Mrs. Adeyemi Provisions', category: 'Provisions', stall: 'B2', phone: randomPhone() },
      { name: 'Chukwuemeka Electronics', category: 'Electronics', stall: 'C1', phone: randomPhone() },
      { name: 'Sister Funke Cosmetics', category: 'Beauty', stall: 'D3', phone: randomPhone() },
    ],
    levyRates: {
      daily: 500,
      weekly: 2500,
      monthly: 8000,
    },
    association: {
      name: 'Balogun Market Traders Association',
      chairman: randomName(),
      secretary: randomName(),
    },
  };
}

export function generateRestaurantDemoData() {
  return {
    menu: [
      { name: 'Jollof Rice with Chicken', category: 'Main', price: 3500 },
      { name: 'Fried Rice with Turkey', category: 'Main', price: 4000 },
      { name: 'Egusi Soup with Pounded Yam', category: 'Traditional', price: 3000 },
      { name: 'Pepper Soup (Goat)', category: 'Traditional', price: 4500 },
      { name: 'Suya (Full)', category: 'Grill', price: 5000 },
      { name: 'Chapman', category: 'Drinks', price: 1500 },
      { name: 'Fresh Juice', category: 'Drinks', price: 1200 },
      { name: 'Bottled Water', category: 'Drinks', price: 300 },
      { name: 'Malt Drink', category: 'Drinks', price: 500 },
      { name: 'Plantain (Dodo)', category: 'Sides', price: 800 },
    ],
    tables: [
      { number: 1, seats: 4, status: 'available' },
      { number: 2, seats: 4, status: 'available' },
      { number: 3, seats: 6, status: 'occupied' },
      { number: 4, seats: 2, status: 'available' },
      { number: 5, seats: 8, status: 'reserved' },
    ],
    staff: [
      { name: randomName(), role: 'Chef', phone: randomPhone() },
      { name: randomName(), role: 'Waiter', phone: randomPhone() },
      { name: randomName(), role: 'Waiter', phone: randomPhone() },
      { name: randomName(), role: 'Cashier', phone: randomPhone() },
    ],
  };
}

export function generateEventTicketingDemoData() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return {
    events: [
      {
        name: 'Lagos Tech Summit 2026',
        date: nextMonth.toISOString().split('T')[0],
        venue: 'Eko Convention Centre, Victoria Island',
        tickets: [
          { type: 'Regular', price: 25000, available: 500 },
          { type: 'VIP', price: 75000, available: 100 },
          { type: 'VVIP', price: 150000, available: 50 },
        ],
      },
      {
        name: 'Afrobeats Night Live',
        date: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        venue: 'Muri Okunola Park, Lagos',
        tickets: [
          { type: 'General Admission', price: 10000, available: 2000 },
          { type: 'VIP Table', price: 100000, available: 30 },
        ],
      },
    ],
    organizer: {
      name: 'Events Nigeria Ltd',
      contact: randomName(),
      phone: randomPhone(),
    },
  };
}

// ============================================================================
// PHASE 6.2 — SERVICES DEMO DATA
// ============================================================================

export function generateBeautySalonDemoData() {
  return {
    services: [
      { name: 'Braiding (Box Braids)', price: 15000, duration: 180 },
      { name: 'Braiding (Ghana Weaving)', price: 8000, duration: 120 },
      { name: 'Hair Relaxer Treatment', price: 5000, duration: 90 },
      { name: 'Hair Wash & Styling', price: 3000, duration: 60 },
      { name: 'Manicure & Pedicure', price: 6000, duration: 90 },
      { name: 'Facial Treatment', price: 8000, duration: 60 },
      { name: 'Makeup (Full)', price: 25000, duration: 120 },
      { name: 'Lash Extensions', price: 12000, duration: 90 },
    ],
    stylists: [
      { name: randomName(), specialty: 'Braiding', phone: randomPhone() },
      { name: randomName(), specialty: 'Hair Treatment', phone: randomPhone() },
      { name: randomName(), specialty: 'Nails', phone: randomPhone() },
      { name: randomName(), specialty: 'Makeup', phone: randomPhone() },
    ],
    products: [
      { name: 'Shea Butter (500ml)', price: 3500, stock: 20 },
      { name: 'Hair Oil', price: 2500, stock: 30 },
      { name: 'Edge Control', price: 1800, stock: 25 },
    ],
  };
}

export function generateLaundryDemoData() {
  return {
    services: [
      { name: 'Shirt (Wash & Iron)', price: 500 },
      { name: 'Trouser (Wash & Iron)', price: 600 },
      { name: 'Agbada (Full)', price: 3000 },
      { name: 'Suit (Dry Clean)', price: 4000 },
      { name: 'Dress (Dry Clean)', price: 2500 },
      { name: 'Bedsheet (Large)', price: 1500 },
      { name: 'Blanket', price: 2000 },
      { name: 'Curtain (per panel)', price: 1000 },
    ],
    staff: [
      { name: randomName(), role: 'Washer', phone: randomPhone() },
      { name: randomName(), role: 'Ironer', phone: randomPhone() },
      { name: randomName(), role: 'Delivery', phone: randomPhone() },
    ],
    activeOrders: [
      { customer: randomName(), items: 5, status: 'Washing', dueDate: 'Tomorrow' },
      { customer: randomName(), items: 3, status: 'Ironing', dueDate: 'Today' },
      { customer: randomName(), items: 8, status: 'Ready', dueDate: 'Today' },
    ],
  };
}

export function generateRepairServiceDemoData() {
  return {
    services: [
      { name: 'Phone Screen Replacement', price: 25000, category: 'Phone' },
      { name: 'Phone Battery Replacement', price: 8000, category: 'Phone' },
      { name: 'Phone Charging Port', price: 5000, category: 'Phone' },
      { name: 'Laptop Screen', price: 45000, category: 'Computer' },
      { name: 'Laptop Keyboard', price: 15000, category: 'Computer' },
      { name: 'TV Repair (LED)', price: 20000, category: 'Electronics' },
      { name: 'Generator Servicing', price: 8000, category: 'Power' },
      { name: 'Inverter Repair', price: 15000, category: 'Power' },
    ],
    parts: [
      { name: 'iPhone Screen (Generic)', cost: 15000, stock: 10 },
      { name: 'Samsung Screen (Generic)', cost: 12000, stock: 15 },
      { name: 'Laptop Battery', cost: 8000, stock: 8 },
    ],
    technicians: [
      { name: randomName(), specialty: 'Phones', phone: randomPhone() },
      { name: randomName(), specialty: 'Computers', phone: randomPhone() },
      { name: randomName(), specialty: 'Electronics', phone: randomPhone() },
    ],
  };
}

export function generateAutoWorkshopDemoData() {
  return {
    services: [
      { name: 'Full Service', price: 35000, duration: 180 },
      { name: 'Oil Change', price: 15000, duration: 45 },
      { name: 'Brake Pad Replacement', price: 25000, duration: 90 },
      { name: 'AC Repair', price: 40000, duration: 120 },
      { name: 'Wheel Alignment', price: 8000, duration: 60 },
      { name: 'Battery Check & Charge', price: 3000, duration: 30 },
      { name: 'Engine Diagnosis', price: 10000, duration: 60 },
      { name: 'Tyre Change (each)', price: 2000, duration: 20 },
    ],
    parts: [
      { name: 'Engine Oil (4L)', cost: 8000, stock: 20 },
      { name: 'Oil Filter', cost: 3000, stock: 30 },
      { name: 'Brake Pad Set', cost: 12000, stock: 15 },
      { name: 'Air Filter', cost: 2500, stock: 25 },
    ],
    mechanics: [
      { name: randomName(), specialty: 'Engine', phone: randomPhone() },
      { name: randomName(), specialty: 'Electrical', phone: randomPhone() },
      { name: randomName(), specialty: 'Body Work', phone: randomPhone() },
    ],
    activeJobs: [
      { vehicle: 'Toyota Camry', plate: 'LAG-123-XY', issue: 'Service', status: 'In Progress' },
      { vehicle: 'Honda Accord', plate: 'ABJ-456-AB', issue: 'AC Repair', status: 'Waiting Parts' },
    ],
  };
}

export function generateCourierDemoData() {
  return {
    rates: [
      { zone: 'Same Area (Ikeja to Ikeja)', price: 1500 },
      { zone: 'Mainland to Mainland', price: 2500 },
      { zone: 'Island to Mainland', price: 3500 },
      { zone: 'Express (Same Day)', price: 5000 },
      { zone: 'Next Day', price: 2000 },
    ],
    riders: [
      { name: randomName(), vehicle: 'Motorcycle', phone: randomPhone(), status: 'Active' },
      { name: randomName(), vehicle: 'Motorcycle', phone: randomPhone(), status: 'On Delivery' },
      { name: randomName(), vehicle: 'Van', phone: randomPhone(), status: 'Active' },
    ],
    activeDeliveries: [
      { waybill: 'WB-001234', from: 'Ikeja', to: 'Lekki', status: 'In Transit', rider: randomName() },
      { waybill: 'WB-001235', from: 'VI', to: 'Surulere', status: 'Picked Up', rider: randomName() },
      { waybill: 'WB-001236', from: 'Yaba', to: 'Ajah', status: 'Pending Pickup', rider: null },
    ],
  };
}

// ============================================================================
// PHASE 6.3 — COMMUNITY DEMO DATA
// ============================================================================

export function generateNGODemoData() {
  return {
    organization: {
      name: 'Hope Foundation Nigeria',
      mission: 'Empowering communities through education and healthcare',
      registration: 'CAC/IT/12345',
    },
    programs: [
      { name: 'School Feeding Program', beneficiaries: 500, budget: 2000000 },
      { name: 'Skills Acquisition', beneficiaries: 150, budget: 1500000 },
      { name: 'Healthcare Outreach', beneficiaries: 1000, budget: 3000000 },
    ],
    donors: [
      { name: 'ABC Foundation', type: 'Corporate', totalDonated: 5000000 },
      { name: randomName(), type: 'Individual', totalDonated: 500000 },
      { name: 'XYZ Bank CSR', type: 'Corporate', totalDonated: 2000000 },
    ],
    volunteers: [
      { name: randomName(), role: 'Field Coordinator', phone: randomPhone() },
      { name: randomName(), role: 'Health Worker', phone: randomPhone() },
      { name: randomName(), role: 'Teacher', phone: randomPhone() },
    ],
  };
}

export function generateAlumniDemoData() {
  return {
    association: {
      name: 'University of Lagos Alumni Association',
      foundedYear: 1975,
      chapters: ['Lagos', 'Abuja', 'Port Harcourt', 'UK', 'USA'],
    },
    duesStructure: {
      annual: 20000,
      lifetime: 200000,
      chapter: 5000,
    },
    upcomingEvents: [
      { name: 'Annual Reunion Dinner', date: '2026-03-15', venue: 'Eko Hotel', fee: 50000 },
      { name: 'Career Mentorship Day', date: '2026-02-20', venue: 'UNILAG Campus', fee: 0 },
    ],
    stats: {
      totalMembers: 15000,
      paidDues: 8500,
      activeChapters: 12,
    },
  };
}

export function generateSalesAgentDemoData() {
  return {
    territories: [
      { name: 'Lagos Mainland', agents: 5, quota: 5000000 },
      { name: 'Lagos Island', agents: 3, quota: 8000000 },
      { name: 'Abuja', agents: 4, quota: 6000000 },
    ],
    agents: [
      { name: randomName(), territory: 'Lagos Mainland', phone: randomPhone(), sales: 1500000, target: 2000000 },
      { name: randomName(), territory: 'Lagos Island', phone: randomPhone(), sales: 2800000, target: 3000000 },
      { name: randomName(), territory: 'Abuja', phone: randomPhone(), sales: 1200000, target: 1500000 },
    ],
    commissionRates: {
      standard: 5,
      bonus: 10,
      threshold: 100,
    },
    products: [
      { name: 'Premium Package', price: 150000 },
      { name: 'Standard Package', price: 75000 },
      { name: 'Basic Package', price: 35000 },
    ],
  };
}

export function generateGatePassDemoData() {
  return {
    estate: {
      name: 'Lekki Gardens Estate',
      units: 250,
      securityPosts: 3,
    },
    residents: [
      { unit: 'Block A, Flat 5', name: randomName(), phone: randomPhone() },
      { unit: 'Block B, Flat 12', name: randomName(), phone: randomPhone() },
      { unit: 'Block C, Flat 3', name: randomName(), phone: randomPhone() },
    ],
    visitorTypes: ['Guest', 'Delivery', 'Artisan', 'Staff', 'Emergency'],
    todayVisitors: [
      { name: randomName(), type: 'Guest', visiting: 'Block A, Flat 5', time: '10:30 AM', status: 'Checked In' },
      { name: 'DHL Delivery', type: 'Delivery', visiting: 'Block B, Flat 12', time: '11:00 AM', status: 'Pending' },
      { name: randomName(), type: 'Artisan', visiting: 'Block C, Flat 3', time: '09:00 AM', status: 'Checked Out' },
    ],
    security: [
      { name: randomName(), post: 'Main Gate', shift: 'Day', phone: randomPhone() },
      { name: randomName(), post: 'Back Gate', shift: 'Day', phone: randomPhone() },
    ],
  };
}

export function generateParkingDemoData() {
  return {
    facility: {
      name: 'Victoria Island Parking Plaza',
      totalSlots: 150,
      floors: 3,
    },
    rates: {
      hourly: 500,
      daily: 3000,
      monthly: 50000,
      valet: 1000,
    },
    slots: [
      { floor: 1, section: 'A', total: 50, available: 15, type: 'Regular' },
      { floor: 1, section: 'B', total: 20, available: 5, type: 'VIP' },
      { floor: 2, section: 'A', total: 50, available: 20, type: 'Regular' },
      { floor: 3, section: 'A', total: 30, available: 25, type: 'Reserved' },
    ],
    activeSessions: [
      { plate: 'LAG-123-AB', slot: '1A-05', entryTime: '09:30 AM', type: 'Hourly' },
      { plate: 'ABJ-456-CD', slot: '1B-02', entryTime: '08:00 AM', type: 'VIP' },
      { plate: 'LAG-789-EF', slot: '2A-15', entryTime: '10:15 AM', type: 'Hourly' },
    ],
    staff: [
      { name: randomName(), role: 'Attendant', shift: 'Day', phone: randomPhone() },
      { name: randomName(), role: 'Valet', shift: 'Day', phone: randomPhone() },
    ],
  };
}

// ============================================================================
// DEMO DATA FACTORY
// ============================================================================

export function getDemoData(businessType: BusinessType): Record<string, unknown> {
  const generators: Record<BusinessType, () => Record<string, unknown>> = {
    retail_pos: generateRetailDemoData,
    supermarket: generateRetailDemoData,
    market_mvm: generateMarketMVMDemoData,
    ecommerce_store: generateRetailDemoData,
    restaurant: generateRestaurantDemoData,
    event_ticketing: generateEventTicketingDemoData,
    beauty_salon: generateBeautySalonDemoData,
    laundry: generateLaundryDemoData,
    cleaning_service: () => ({ ...generateLaundryDemoData(), type: 'cleaning' }),
    repair_service: generateRepairServiceDemoData,
    auto_workshop: generateAutoWorkshopDemoData,
    courier: generateCourierDemoData,
    ngo: generateNGODemoData,
    alumni_portal: generateAlumniDemoData,
    sales_agent: generateSalesAgentDemoData,
    gate_pass: generateGatePassDemoData,
    parking: generateParkingDemoData,
  };
  
  const generator = generators[businessType];
  return generator ? generator() : {};
}
