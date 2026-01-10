/**
 * SVM Demo Data Seed Script
 * 
 * Seeds Nigerian products, shipping zones, and sample orders for demo purposes.
 * Run with: npx ts-node scripts/seed-svm-demo.ts
 * 
 * @module scripts/seed-svm-demo
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// NIGERIAN DEMO PRODUCTS
// ============================================================================

const NIGERIAN_PRODUCTS = [
  // Electronics
  {
    name: 'Samsung Galaxy A54 5G',
    shortDescription: 'Premium mid-range smartphone with 5G support',
    description: '6.4" Super AMOLED display, 128GB storage, 8GB RAM. Perfect for Nigerian networks with dual SIM support.',
    basePrice: 285000,
    compareAtPrice: 320000,
    sku: 'SAM-A54-128',
    category: 'Electronics',
    images: ['/images/products/samsung-a54.jpg'],
    variants: [
      { name: 'Awesome Graphite', priceAdjustment: 0 },
      { name: 'Awesome Violet', priceAdjustment: 0 },
      { name: 'Awesome White', priceAdjustment: 0 }
    ]
  },
  {
    name: 'Oraimo PowerGiga 27000mAh',
    shortDescription: 'High-capacity power bank with fast charging',
    description: '27000mAh capacity, 22.5W fast charge output, 3 USB ports. Perfect for Nigerian power situations.',
    basePrice: 18500,
    compareAtPrice: 22000,
    sku: 'ORA-PG-27K',
    category: 'Electronics',
    images: ['/images/products/oraimo-powerbank.jpg'],
    variants: []
  },
  {
    name: 'Hisense 43" Smart TV',
    shortDescription: 'Full HD Smart Television with Netflix',
    description: '43-inch Full HD display, built-in Netflix and YouTube. Energy efficient for Nigerian NEPA situations.',
    basePrice: 175000,
    compareAtPrice: 195000,
    sku: 'HIS-TV-43',
    category: 'Electronics',
    images: ['/images/products/hisense-tv.jpg'],
    variants: []
  },

  // FMCG
  {
    name: 'Golden Penny Semovita 2kg',
    shortDescription: 'Premium semolina flour',
    description: 'High quality semolina wheat flour, perfect for making semo. Family size pack.',
    basePrice: 2800,
    compareAtPrice: null,
    sku: 'GP-SEMO-2KG',
    category: 'FMCG',
    images: ['/images/products/semovita.jpg'],
    variants: []
  },
  {
    name: 'Peak Milk Refill 850g',
    shortDescription: 'Fortified full cream milk powder',
    description: 'Rich, creamy milk powder fortified with vitamins. Great for the whole family.',
    basePrice: 4500,
    compareAtPrice: 4800,
    sku: 'PEAK-850G',
    category: 'FMCG',
    images: ['/images/products/peak-milk.jpg'],
    variants: []
  },
  {
    name: 'Indomie Instant Noodles (Carton)',
    shortDescription: '40 packs of Indomie Chicken Flavour',
    description: 'Carton of 40 packs. Nigeria\'s favorite instant noodles.',
    basePrice: 8500,
    compareAtPrice: 9200,
    sku: 'INDO-CTN-40',
    category: 'FMCG',
    images: ['/images/products/indomie.jpg'],
    variants: [
      { name: 'Chicken Flavour', priceAdjustment: 0 },
      { name: 'Onion Chicken', priceAdjustment: 200 },
      { name: 'Pepper Chicken', priceAdjustment: 200 }
    ]
  },

  // Fashion
  {
    name: 'Ankara Print Fabric (6 Yards)',
    shortDescription: 'Premium Holland wax print',
    description: '100% cotton Holland wax ankara fabric. 6 yards, perfect for traditional wear.',
    basePrice: 12000,
    compareAtPrice: 15000,
    sku: 'ANK-6YD-001',
    category: 'Fashion',
    images: ['/images/products/ankara.jpg'],
    variants: [
      { name: 'Blue/Gold Pattern', priceAdjustment: 0 },
      { name: 'Red/Black Pattern', priceAdjustment: 0 },
      { name: 'Green/Yellow Pattern', priceAdjustment: 500 }
    ]
  },
  {
    name: 'Agbada Complete Set',
    shortDescription: 'Traditional Nigerian men\'s outfit',
    description: 'Complete agbada set including agbada, buba, and sokoto. Premium quality.',
    basePrice: 35000,
    compareAtPrice: 45000,
    sku: 'AGB-SET-001',
    category: 'Fashion',
    images: ['/images/products/agbada.jpg'],
    variants: [
      { name: 'White', priceAdjustment: 0 },
      { name: 'Sky Blue', priceAdjustment: 2000 },
      { name: 'Cream', priceAdjustment: 0 }
    ]
  },
  {
    name: 'Palm Slippers (Unisex)',
    shortDescription: 'Handcrafted leather slippers',
    description: 'Genuine leather palm slippers, handmade in Aba. Comfortable and durable.',
    basePrice: 8500,
    compareAtPrice: 10000,
    sku: 'PALM-UNI-001',
    category: 'Fashion',
    images: ['/images/products/palm-slippers.jpg'],
    variants: [
      { name: 'Size 40', priceAdjustment: 0 },
      { name: 'Size 42', priceAdjustment: 0 },
      { name: 'Size 44', priceAdjustment: 0 },
      { name: 'Size 46', priceAdjustment: 500 }
    ]
  },

  // Home & Kitchen
  {
    name: 'Binatone Blender 1.5L',
    shortDescription: 'High-speed blender with grinding attachment',
    description: '1.5L capacity, 400W motor, includes dry and wet grinding attachments. Surge protection.',
    basePrice: 22000,
    compareAtPrice: 26000,
    sku: 'BIN-BLD-15L',
    category: 'Home',
    images: ['/images/products/binatone-blender.jpg'],
    variants: []
  },
  {
    name: 'Rechargeable Standing Fan 18"',
    shortDescription: 'Solar-compatible rechargeable fan',
    description: '18-inch oscillating fan with 8-hour battery backup. Perfect for NEPA situations.',
    basePrice: 45000,
    compareAtPrice: 52000,
    sku: 'FAN-RECH-18',
    category: 'Home',
    images: ['/images/products/rechargeable-fan.jpg'],
    variants: []
  },
  {
    name: 'Cooking Gas Cylinder 12.5kg',
    shortDescription: 'LPG cylinder only (empty)',
    description: 'Standard 12.5kg LPG cylinder. Empty cylinder only, fill at your nearest gas station.',
    basePrice: 32000,
    compareAtPrice: null,
    sku: 'GAS-CYL-12',
    category: 'Home',
    images: ['/images/products/gas-cylinder.jpg'],
    variants: []
  }
]

// ============================================================================
// NIGERIAN SHIPPING ZONES
// ============================================================================

const NIGERIAN_ZONES = [
  {
    name: 'Lagos Metro',
    description: 'Same-day and next-day delivery available',
    states: ['Lagos'],
    rates: [
      { name: 'Standard (2-3 days)', fee: 1500, freeAbove: 50000, minDays: 2, maxDays: 3 },
      { name: 'Express (Same day)', fee: 3000, freeAbove: 100000, minDays: 0, maxDays: 1 }
    ]
  },
  {
    name: 'South West',
    description: 'Ogun, Oyo, Osun, Ondo, Ekiti',
    states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
    rates: [
      { name: 'Standard (3-5 days)', fee: 2000, freeAbove: 75000, minDays: 3, maxDays: 5 },
      { name: 'Express (2-3 days)', fee: 3500, freeAbove: 150000, minDays: 2, maxDays: 3 }
    ]
  },
  {
    name: 'South East',
    description: 'Enugu, Anambra, Imo, Abia, Ebonyi',
    states: ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'],
    rates: [
      { name: 'Standard (4-6 days)', fee: 2500, freeAbove: 100000, minDays: 4, maxDays: 6 },
      { name: 'Express (2-4 days)', fee: 4500, freeAbove: 200000, minDays: 2, maxDays: 4 }
    ]
  },
  {
    name: 'FCT & North Central',
    description: 'Abuja, Kogi, Kwara, Nasarawa, Niger, Benue, Plateau',
    states: ['FCT', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Benue', 'Plateau'],
    rates: [
      { name: 'Standard (4-6 days)', fee: 2500, freeAbove: 100000, minDays: 4, maxDays: 6 },
      { name: 'Express (2-4 days)', fee: 4500, freeAbove: 200000, minDays: 2, maxDays: 4 }
    ]
  }
]

// ============================================================================
// SAMPLE CUSTOMERS
// ============================================================================

const SAMPLE_CUSTOMERS = [
  {
    name: 'Adebayo Johnson',
    email: 'adebayo.johnson@email.com',
    phone: '08012345678',
    address: {
      name: 'Adebayo Johnson',
      phone: '08012345678',
      address1: '15 Admiralty Way',
      address2: 'Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      postalCode: '101233',
      country: 'Nigeria'
    }
  },
  {
    name: 'Chidinma Okonkwo',
    email: 'chidinma.okonkwo@email.com',
    phone: '08098765432',
    address: {
      name: 'Chidinma Okonkwo',
      phone: '08098765432',
      address1: '42 New Market Road',
      address2: '',
      city: 'Onitsha',
      state: 'Anambra',
      postalCode: '',
      country: 'Nigeria'
    }
  },
  {
    name: 'Musa Ibrahim',
    email: 'musa.ibrahim@email.com',
    phone: '07033445566',
    address: {
      name: 'Musa Ibrahim',
      phone: '07033445566',
      address1: 'Plot 234, Wuse Zone 5',
      address2: '',
      city: 'Abuja',
      state: 'FCT',
      postalCode: '900001',
      country: 'Nigeria'
    }
  }
]

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

async function seedProducts(tenantId: string) {
  console.log('Seeding Nigerian products...')
  
  for (const product of NIGERIAN_PRODUCTS) {
    const productId = generateId()
    
    await prisma.product.create({
      data: {
        id: productId,
        tenantId,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        sku: product.sku,
        category: product.category,
        images: product.images,
        status: 'ACTIVE',
        inventoryTracking: true,
        inventoryQuantity: Math.floor(Math.random() * 100) + 20,
        lowStockThreshold: 5,
        currency: 'NGN',
        updatedAt: new Date()
      }
    })
    
    console.log(`  Created: ${product.name}`)
  }
  
  console.log(`Seeded ${NIGERIAN_PRODUCTS.length} products`)
}

async function seedShippingZones(tenantId: string) {
  console.log('Seeding Nigerian shipping zones...')
  
  for (const zone of NIGERIAN_ZONES) {
    const zoneId = generateId()
    
    await prisma.svm_shipping_zones.create({
      data: {
        id: zoneId,
        tenantId,
        name: zone.name,
        description: zone.description,
        countries: ['NG'],
        states: zone.states,
        postalCodes: [],
        cities: [],
        isDefault: zone.name === 'Lagos Metro',
        isActive: true,
        priority: zone.name === 'Lagos Metro' ? 100 : 50,
        updatedAt: new Date(),
        svm_shipping_rates: {
          create: zone.rates.map(rate => ({
            id: generateId(),
            name: rate.name,
            description: `${rate.minDays}-${rate.maxDays} business days`,
            carrier: 'GIG Logistics',
            rateType: 'FLAT',
            flatRate: rate.fee,
            freeAbove: rate.freeAbove,
            minDays: rate.minDays,
            maxDays: rate.maxDays,
            isActive: true,
            priority: rate.name.includes('Express') ? 10 : 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: [],
            updatedAt: new Date()
          }))
        }
      }
    })
    
    console.log(`  Created zone: ${zone.name}`)
  }
  
  // Add Local Pickup
  await prisma.svm_shipping_zones.create({
    data: {
      id: generateId(),
      tenantId,
      name: 'Local Pickup',
      description: 'Pick up from our Lagos Island office',
      countries: ['NG'],
      states: [],
      postalCodes: [],
      cities: [],
      isDefault: false,
      isActive: true,
      priority: 200,
      updatedAt: new Date(),
      svm_shipping_rates: {
        create: [{
          id: generateId(),
          name: 'Store Pickup',
          description: 'Ready within 24 hours',
          carrier: 'Self',
          rateType: 'FLAT',
          flatRate: 0,
          minDays: 0,
          maxDays: 1,
          isActive: true,
          priority: 0,
          allowedProductIds: [],
          excludedProductIds: [],
          allowedCategoryIds: [],
          excludedCategoryIds: [],
          updatedAt: new Date()
        }]
      }
    }
  })
  
  console.log(`Seeded ${NIGERIAN_ZONES.length + 1} shipping zones`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const tenantId = process.env.DEMO_TENANT_ID || 'demo_tenant'
  
  console.log('='.repeat(60))
  console.log('SVM Nigerian Demo Data Seed')
  console.log('='.repeat(60))
  console.log(`Tenant ID: ${tenantId}`)
  console.log('')
  
  try {
    await seedProducts(tenantId)
    console.log('')
    await seedShippingZones(tenantId)
    
    console.log('')
    console.log('='.repeat(60))
    console.log('Demo data seeded successfully!')
    console.log('')
    console.log('Sample Products:')
    NIGERIAN_PRODUCTS.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name}: ₦${p.basePrice.toLocaleString()}`)
    })
    console.log('')
    console.log('Sample Customers:')
    SAMPLE_CUSTOMERS.forEach(c => {
      console.log(`  - ${c.name} (${c.address.state})`)
    })
    console.log('='.repeat(60))
  } catch (error) {
    console.error('Error seeding demo data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
