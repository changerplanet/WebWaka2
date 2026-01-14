/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Products & Inventory Suite - Nigerian Demo Data Seeder
 * 
 * Creates demo data for product catalog and inventory:
 * - Product categories
 * - Products with Nigerian pricing (NGN)
 * - Product variants (sizes, colors)
 * - Inventory levels
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-products-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-retail-store'

// =============================================================================
// PRODUCT CATEGORIES (Nigerian Retail Context)
// =============================================================================

const CATEGORIES = [
  { id: 'cat-groceries', name: 'Groceries', description: 'Food staples and household items', sortOrder: 1 },
  { id: 'cat-drinks', name: 'Beverages & Drinks', description: 'Soft drinks, juices, and water', sortOrder: 2 },
  { id: 'cat-dairy', name: 'Dairy & Eggs', description: 'Milk, cheese, eggs, and yogurt', sortOrder: 3 },
  { id: 'cat-snacks', name: 'Snacks & Confectionery', description: 'Biscuits, chocolates, and treats', sortOrder: 4 },
  { id: 'cat-bakery', name: 'Bakery', description: 'Bread, cakes, and pastries', sortOrder: 5 },
  { id: 'cat-household', name: 'Household & Cleaning', description: 'Detergents, cleaners, and home items', sortOrder: 6 },
  { id: 'cat-personal', name: 'Personal Care', description: 'Soaps, toiletries, and cosmetics', sortOrder: 7 },
  { id: 'cat-electronics', name: 'Electronics', description: 'Phones, accessories, and gadgets', sortOrder: 8 },
  { id: 'cat-fashion', name: 'Fashion & Apparel', description: 'Clothing, shoes, and accessories', sortOrder: 9 },
  { id: 'cat-baby', name: 'Baby & Kids', description: 'Baby food, diapers, and toys', sortOrder: 10 },
]

// =============================================================================
// PRODUCTS (Nigerian Market Products with NGN Pricing)
// =============================================================================

const PRODUCTS = [
  // Groceries
  { id: 'prod-001', sku: 'RICE-MG-5KG', name: 'Mama Gold Rice (5kg)', price: 8500, costPrice: 7200, categoryId: 'cat-groceries', stock: 150 },
  { id: 'prod-002', sku: 'RICE-OF-5KG', name: 'Ofada Rice (5kg)', price: 9500, costPrice: 8000, categoryId: 'cat-groceries', stock: 80 },
  { id: 'prod-003', sku: 'OIL-DK-5L', name: 'Devon King\'s Oil (5L)', price: 12000, costPrice: 10500, categoryId: 'cat-groceries', stock: 60 },
  { id: 'prod-004', sku: 'SUGAR-DG-1KG', name: 'Dangote Sugar (1kg)', price: 1400, costPrice: 1200, categoryId: 'cat-groceries', stock: 200 },
  { id: 'prod-005', sku: 'INDOMIE-70G', name: 'Indomie Chicken (70g)', price: 250, costPrice: 200, categoryId: 'cat-groceries', stock: 500 },
  { id: 'prod-006', sku: 'SPAGHETTI-500G', name: 'Dangote Spaghetti (500g)', price: 650, costPrice: 550, categoryId: 'cat-groceries', stock: 180 },
  { id: 'prod-007', sku: 'TOMATO-GT-400G', name: 'Gino Tomato Paste (400g)', price: 1200, costPrice: 1000, categoryId: 'cat-groceries', stock: 120 },
  { id: 'prod-008', sku: 'MAGGI-100PCS', name: 'Maggi Cubes (100pcs)', price: 1000, costPrice: 850, categoryId: 'cat-groceries', stock: 90 },
  { id: 'prod-009', sku: 'BEANS-HONEY-5KG', name: 'Honey Beans (5kg)', price: 7500, costPrice: 6500, categoryId: 'cat-groceries', stock: 45 },
  { id: 'prod-010', sku: 'GARRI-IJEBU-5KG', name: 'Ijebu Garri (5kg)', price: 4500, costPrice: 3800, categoryId: 'cat-groceries', stock: 70 },
  
  // Beverages & Drinks
  { id: 'prod-011', sku: 'COCA-50CL', name: 'Coca-Cola (50cl)', price: 350, costPrice: 280, categoryId: 'cat-drinks', stock: 300 },
  { id: 'prod-012', sku: 'FANTA-50CL', name: 'Fanta Orange (50cl)', price: 350, costPrice: 280, categoryId: 'cat-drinks', stock: 250 },
  { id: 'prod-013', sku: 'MALTINA-33CL', name: 'Maltina Classic (33cl)', price: 400, costPrice: 320, categoryId: 'cat-drinks', stock: 200 },
  { id: 'prod-014', sku: 'MILO-400G', name: 'Milo (400g)', price: 2500, costPrice: 2100, categoryId: 'cat-drinks', stock: 85 },
  { id: 'prod-015', sku: 'WATER-EVA-75CL', name: 'Eva Water (75cl)', price: 200, costPrice: 150, categoryId: 'cat-drinks', stock: 400 },
  { id: 'prod-016', sku: 'JUICE-CHI-1L', name: 'Chi Exotic Juice (1L)', price: 1300, costPrice: 1100, categoryId: 'cat-drinks', stock: 60 },
  { id: 'prod-017', sku: 'BOURNVITA-400G', name: 'Bournvita (400g)', price: 2200, costPrice: 1850, categoryId: 'cat-drinks', stock: 75 },
  
  // Dairy
  { id: 'prod-018', sku: 'PEAK-400G', name: 'Peak Milk Tin (400g)', price: 1800, costPrice: 1500, categoryId: 'cat-dairy', stock: 100 },
  { id: 'prod-019', sku: 'DANO-400G', name: 'Dano Milk Powder (400g)', price: 2200, costPrice: 1900, categoryId: 'cat-dairy', stock: 70 },
  { id: 'prod-020', sku: 'GOLDENMORN-450G', name: 'Golden Morn (450g)', price: 1500, costPrice: 1250, categoryId: 'cat-dairy', stock: 90 },
  { id: 'prod-021', sku: 'EGGS-CRATE', name: 'Eggs Crate (30pcs)', price: 3500, costPrice: 3000, categoryId: 'cat-dairy', stock: 40 },
  
  // Snacks
  { id: 'prod-022', sku: 'GALA-REG', name: 'Gala Sausage Roll', price: 300, costPrice: 240, categoryId: 'cat-snacks', stock: 200 },
  { id: 'prod-023', sku: 'CABIN-BISCUIT', name: 'Cabin Biscuit', price: 200, costPrice: 160, categoryId: 'cat-snacks', stock: 180 },
  { id: 'prod-024', sku: 'DIGESTIVE-250G', name: 'Digestive Biscuits (250g)', price: 850, costPrice: 700, categoryId: 'cat-snacks', stock: 60 },
  { id: 'prod-025', sku: 'CHIN-CHIN-500G', name: 'Chin Chin Pack (500g)', price: 1200, costPrice: 950, categoryId: 'cat-snacks', stock: 50 },
  
  // Bakery
  { id: 'prod-026', sku: 'BREAD-AGEGE', name: 'Agege Bread (Sliced)', price: 1200, costPrice: 1000, categoryId: 'cat-bakery', stock: 30 },
  { id: 'prod-027', sku: 'BREAD-BUTTER', name: 'Butter Bread Loaf', price: 800, costPrice: 650, categoryId: 'cat-bakery', stock: 25 },
  
  // Household
  { id: 'prod-028', sku: 'OMO-900G', name: 'OMO Multi Active (900g)', price: 1600, costPrice: 1350, categoryId: 'cat-household', stock: 80 },
  { id: 'prod-029', sku: 'HARPIC-500ML', name: 'Harpic Toilet Cleaner (500ml)', price: 1200, costPrice: 1000, categoryId: 'cat-household', stock: 45 },
  { id: 'prod-030', sku: 'MORNING-FRESH', name: 'Morning Fresh Dishwash (450ml)', price: 900, costPrice: 750, categoryId: 'cat-household', stock: 55 },
  
  // Personal Care
  { id: 'prod-031', sku: 'DETTOL-175G', name: 'Dettol Soap (175g)', price: 550, costPrice: 450, categoryId: 'cat-personal', stock: 100 },
  { id: 'prod-032', sku: 'CLOSEUP-140G', name: 'Close Up Toothpaste (140g)', price: 750, costPrice: 600, categoryId: 'cat-personal', stock: 70 },
  { id: 'prod-033', sku: 'VASELINE-400ML', name: 'Vaseline Lotion (400ml)', price: 2000, costPrice: 1700, categoryId: 'cat-personal', stock: 40 },
  
  // Electronics
  { id: 'prod-034', sku: 'CHARGER-ANDROID', name: 'Android Phone Charger', price: 2500, costPrice: 1800, categoryId: 'cat-electronics', stock: 30 },
  { id: 'prod-035', sku: 'EARPIECE-WIRED', name: 'Wired Earpiece', price: 1500, costPrice: 1000, categoryId: 'cat-electronics', stock: 50 },
  { id: 'prod-036', sku: 'POWERBANK-10K', name: 'Power Bank 10000mAh', price: 8000, costPrice: 6000, categoryId: 'cat-electronics', stock: 20 },
  
  // Fashion
  { id: 'prod-037', sku: 'ANKARA-6YDS', name: 'Ankara Fabric (6 yards)', price: 15000, costPrice: 12000, categoryId: 'cat-fashion', stock: 25 },
  { id: 'prod-038', sku: 'TSHIRT-PLAIN-M', name: 'Plain T-Shirt (Medium)', price: 3500, costPrice: 2500, categoryId: 'cat-fashion', stock: 40 },
  { id: 'prod-039', sku: 'SLIPPERS-PALM', name: 'Palm Slippers', price: 2000, costPrice: 1400, categoryId: 'cat-fashion', stock: 35 },
  
  // Baby
  { id: 'prod-040', sku: 'PAMPERS-L-44', name: 'Pampers Diapers (Large, 44pcs)', price: 8500, costPrice: 7200, categoryId: 'cat-baby', stock: 30 },
  { id: 'prod-041', sku: 'CERELAC-400G', name: 'Cerelac Baby Food (400g)', price: 3500, costPrice: 3000, categoryId: 'cat-baby', stock: 25 },
  { id: 'prod-042', sku: 'NAN-400G', name: 'NAN Baby Formula (400g)', price: 6500, costPrice: 5500, categoryId: 'cat-baby', stock: 20 },
]

// =============================================================================
// PRODUCT VARIANTS (Size/Color Options)
// =============================================================================

const VARIANTS = [
  // T-Shirt sizes
  { productId: 'prod-038', sku: 'TSHIRT-PLAIN-S', name: 'Small', priceAdjustment: -500 },
  { productId: 'prod-038', sku: 'TSHIRT-PLAIN-L', name: 'Large', priceAdjustment: 500 },
  { productId: 'prod-038', sku: 'TSHIRT-PLAIN-XL', name: 'Extra Large', priceAdjustment: 1000 },
  // Slippers sizes
  { productId: 'prod-039', sku: 'SLIPPERS-40', name: 'Size 40', priceAdjustment: 0 },
  { productId: 'prod-039', sku: 'SLIPPERS-42', name: 'Size 42', priceAdjustment: 0 },
  { productId: 'prod-039', sku: 'SLIPPERS-44', name: 'Size 44', priceAdjustment: 200 },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoPartner() {
  console.log('Verifying Demo Partner exists...')
  
  const partner = await prisma.partner.findUnique({
    where: { id: DEMO_PARTNER_ID }
  })
  
  if (!partner) {
    throw new Error(`FATAL: Demo Partner not found with ID: ${DEMO_PARTNER_ID}`)
  }
  
  console.log(`  Found Demo Partner: ${partner.name}`)
  return partner
}

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { 
      slug: DEMO_TENANT_SLUG,
      partnerId: DEMO_PARTNER_ID 
    }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  if (tenant.partnerId !== DEMO_PARTNER_ID) {
    throw new Error(`FATAL: Demo Tenant does not belong to Demo Partner`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function seedCategories(tenantId: string) {
  console.log('Creating product categories...')
  
  for (const cat of CATEGORIES) {
    const existing = await prisma.productCategory.findFirst({
      where: { tenantId, name: cat.name }
    })
    
    if (!existing) {
      await prisma.productCategory.create({
        data: {
          id: `${tenantId}-${cat.id}`,
          tenantId,
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
        }
      })
      console.log(`  Created category: ${cat.name}`)
    } else {
      console.log(`  Category exists: ${cat.name}`)
    }
  }
}

async function seedProducts(tenantId: string) {
  console.log('Creating products...')
  
  for (const prod of PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { tenantId, sku: prod.sku }
    })
    
    if (!existing) {
      await prisma.product.create({
        data: {
          id: `${tenantId}-${prod.id}`,
          tenantId,
          sku: prod.sku,
          name: prod.name,
          description: `${prod.name} - Nigerian retail product`,
          price: prod.price,
          costPrice: prod.costPrice,
          currency: 'NGN',
          categoryId: `${tenantId}-${prod.categoryId}`,
          isActive: true,
          trackInventory: true,
          allowBackorder: false,
          lowStockThreshold: 10,
        }
      })
      console.log(`  Created product: ${prod.name}`)
    } else {
      console.log(`  Product exists: ${prod.name}`)
    }
  }
}

async function seedInventoryLevels(tenantId: string) {
  console.log('Creating inventory levels...')
  
  for (const prod of PRODUCTS) {
    const productId = `${tenantId}-${prod.id}`
    
    const existing = await prisma.inventoryLevel.findFirst({
      where: { tenantId, productId }
    })
    
    if (!existing) {
      await prisma.inventoryLevel.create({
        data: {
          tenantId,
          productId,
          locationId: `${tenantId}-main-store`,
          onHand: prod.stock,
          available: prod.stock,
          reserved: 0,
          incoming: 0,
          outgoing: 0,
        }
      })
      console.log(`  Set stock for ${prod.name}: ${prod.stock} units`)
    }
  }
}

async function seedProductVariants(tenantId: string) {
  console.log('Creating product variants...')
  
  for (const variant of VARIANTS) {
    const productId = `${tenantId}-${variant.productId}`
    
    const existing = await prisma.productVariant.findFirst({
      where: { tenantId, sku: variant.sku }
    })
    
    if (!existing) {
      await prisma.productVariant.create({
        data: {
          tenantId,
          productId,
          sku: variant.sku,
          name: variant.name,
          priceAdjustment: variant.priceAdjustment,
          isActive: true,
        }
      })
      console.log(`  Created variant: ${variant.sku}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('PRODUCTS & INVENTORY DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Context')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration (categories)
    await seedCategories(tenant.id)
    
    // Step 3: Seed operational data (products)
    await seedProducts(tenant.id)
    
    // Step 4: Seed inventory levels
    await seedInventoryLevels(tenant.id)
    
    // Step 5: Seed variants
    await seedProductVariants(tenant.id)
    
    console.log('='.repeat(60))
    console.log('PRODUCTS DEMO SEEDING COMPLETE')
    console.log(`  Categories: ${CATEGORIES.length}`)
    console.log(`  Products: ${PRODUCTS.length}`)
    console.log(`  Variants: ${VARIANTS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
