/**
 * Demo Seed Script — PHASE D3
 * EXECUTION APPROVED
 * 
 * Products & Inventory Suite - Nigerian Demo Data Seeder
 * 
 * Creates demo data for product catalog and inventory:
 * - Location (store)
 * - Product categories
 * - Products with Nigerian pricing (NGN)
 * - Inventory levels
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-products-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-retail-store'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// =============================================================================
// PRODUCT CATEGORIES (Nigerian Retail Context)
// =============================================================================

const CATEGORIES = [
  { name: 'Groceries', description: 'Food staples and household items', sortOrder: 1 },
  { name: 'Beverages & Drinks', description: 'Soft drinks, juices, and water', sortOrder: 2 },
  { name: 'Dairy & Eggs', description: 'Milk, cheese, eggs, and yogurt', sortOrder: 3 },
  { name: 'Snacks & Confectionery', description: 'Biscuits, chocolates, and treats', sortOrder: 4 },
  { name: 'Bakery', description: 'Bread, cakes, and pastries', sortOrder: 5 },
  { name: 'Household & Cleaning', description: 'Detergents, cleaners, and home items', sortOrder: 6 },
  { name: 'Personal Care', description: 'Soaps, toiletries, and cosmetics', sortOrder: 7 },
  { name: 'Electronics', description: 'Phones, accessories, and gadgets', sortOrder: 8 },
]

// =============================================================================
// PRODUCTS (Nigerian Market Products with NGN Pricing)
// =============================================================================

const PRODUCTS = [
  // Groceries
  { sku: 'RICE-MG-5KG', name: 'Mama Gold Rice (5kg)', price: 8500, costPrice: 7200, category: 'Groceries' },
  { sku: 'RICE-OF-5KG', name: 'Ofada Rice (5kg)', price: 9500, costPrice: 8000, category: 'Groceries' },
  { sku: 'OIL-DK-5L', name: 'Devon King\'s Oil (5L)', price: 12000, costPrice: 10500, category: 'Groceries' },
  { sku: 'SUGAR-DG-1KG', name: 'Dangote Sugar (1kg)', price: 1400, costPrice: 1200, category: 'Groceries' },
  { sku: 'INDOMIE-70G', name: 'Indomie Chicken (70g)', price: 250, costPrice: 200, category: 'Groceries' },
  { sku: 'SPAGHETTI-500G', name: 'Dangote Spaghetti (500g)', price: 650, costPrice: 550, category: 'Groceries' },
  { sku: 'TOMATO-GT-400G', name: 'Gino Tomato Paste (400g)', price: 1200, costPrice: 1000, category: 'Groceries' },
  { sku: 'MAGGI-100PCS', name: 'Maggi Cubes (100pcs)', price: 1000, costPrice: 850, category: 'Groceries' },
  
  // Beverages & Drinks
  { sku: 'COCA-50CL', name: 'Coca-Cola (50cl)', price: 350, costPrice: 280, category: 'Beverages & Drinks' },
  { sku: 'FANTA-50CL', name: 'Fanta Orange (50cl)', price: 350, costPrice: 280, category: 'Beverages & Drinks' },
  { sku: 'MALTINA-33CL', name: 'Maltina Classic (33cl)', price: 400, costPrice: 320, category: 'Beverages & Drinks' },
  { sku: 'MILO-400G', name: 'Milo (400g)', price: 2500, costPrice: 2100, category: 'Beverages & Drinks' },
  { sku: 'WATER-EVA-75CL', name: 'Eva Water (75cl)', price: 200, costPrice: 150, category: 'Beverages & Drinks' },
  
  // Dairy
  { sku: 'PEAK-400G', name: 'Peak Milk Tin (400g)', price: 1800, costPrice: 1500, category: 'Dairy & Eggs' },
  { sku: 'DANO-400G', name: 'Dano Milk Powder (400g)', price: 2200, costPrice: 1900, category: 'Dairy & Eggs' },
  { sku: 'EGGS-CRATE', name: 'Eggs Crate (30pcs)', price: 3500, costPrice: 3000, category: 'Dairy & Eggs' },
  
  // Snacks
  { sku: 'GALA-REG', name: 'Gala Sausage Roll', price: 300, costPrice: 240, category: 'Snacks & Confectionery' },
  { sku: 'CABIN-BISCUIT', name: 'Cabin Biscuit', price: 200, costPrice: 160, category: 'Snacks & Confectionery' },
  
  // Bakery
  { sku: 'BREAD-AGEGE', name: 'Agege Bread (Sliced)', price: 1200, costPrice: 1000, category: 'Bakery' },
  
  // Household
  { sku: 'OMO-900G', name: 'OMO Multi Active (900g)', price: 1600, costPrice: 1350, category: 'Household & Cleaning' },
  { sku: 'HARPIC-500ML', name: 'Harpic Toilet Cleaner (500ml)', price: 1200, costPrice: 1000, category: 'Household & Cleaning' },
  
  // Personal Care
  { sku: 'DETTOL-175G', name: 'Dettol Soap (175g)', price: 550, costPrice: 450, category: 'Personal Care' },
  { sku: 'CLOSEUP-140G', name: 'Close Up Toothpaste (140g)', price: 750, costPrice: 600, category: 'Personal Care' },
  
  // Electronics
  { sku: 'CHARGER-ANDROID', name: 'Android Phone Charger', price: 2500, costPrice: 1800, category: 'Electronics' },
  { sku: 'POWERBANK-10K', name: 'Power Bank 10000mAh', price: 8000, costPrice: 6000, category: 'Electronics' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function seedLocation(tenantId: string) {
  console.log('Creating store location...')
  
  const locationId = `${tenantId}-main-store`
  
  const existing = await prisma.location.findUnique({
    where: { id: locationId }
  })
  
  if (!existing) {
    await prisma.location.create({
      data: {
        id: locationId,
        tenantId,
        name: 'Main Store - Lagos Retail',
        code: 'LAGOS-MAIN',
        type: 'STORE',
        status: 'ACTIVE',
        addressLine1: '45 Allen Avenue',
        city: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
        isDefaultLocation: true,
        allowsPickup: true,
        allowsShipping: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    console.log('  Created location: Main Store - Lagos Retail')
  } else {
    console.log('  Location exists: Main Store - Lagos Retail')
  }
  
  return locationId
}

async function seedCategories(tenantId: string) {
  console.log('Creating product categories...')
  const categoryMap: Record<string, string> = {}
  
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name)
    const categoryId = `${tenantId}-cat-${slug}`
    
    const existing = await prisma.productCategory.findUnique({
      where: { id: categoryId }
    })
    
    if (!existing) {
      await prisma.productCategory.create({
        data: {
          id: categoryId,
          tenantId,
          name: cat.name,
          slug,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log(`  Created category: ${cat.name}`)
    } else {
      console.log(`  Category exists: ${cat.name}`)
    }
    
    categoryMap[cat.name] = categoryId
  }
  
  return categoryMap
}

async function seedProducts(tenantId: string, categoryMap: Record<string, string>, locationId: string) {
  console.log('Creating products and inventory...')
  
  for (const prod of PRODUCTS) {
    const slug = slugify(prod.name)
    const productId = `${tenantId}-${prod.sku}`
    const categoryId = categoryMap[prod.category]
    
    const existing = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!existing) {
      await prisma.product.create({
        data: {
          id: productId,
          tenantId,
          sku: prod.sku,
          slug,
          name: prod.name,
          description: `${prod.name} - Quality Nigerian retail product`,
          price: prod.price,
          costPrice: prod.costPrice,
          categoryId,
          trackInventory: true,
          allowBackorder: false,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log(`  Created product: ${prod.name}`)
      
      // Create inventory level
      const inventoryId = `${productId}-inv`
      const stock = Math.floor(Math.random() * 150) + 50 // Random stock 50-200
      
      await prisma.inventoryLevel.create({
        data: {
          id: inventoryId,
          tenantId,
          productId,
          locationId,
          quantityOnHand: stock,
          quantityReserved: 0,
          quantityAvailable: stock,
          quantityIncoming: 0,
          reorderPoint: 20,
          reorderQuantity: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
    } else {
      console.log(`  Product exists: ${prod.name}`)
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
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed location first (required for inventory)
    const locationId = await seedLocation(tenant.id)
    
    // Step 3: Seed categories
    const categoryMap = await seedCategories(tenant.id)
    
    // Step 4: Seed products with inventory
    await seedProducts(tenant.id, categoryMap, locationId)
    
    console.log('='.repeat(60))
    console.log('PRODUCTS DEMO SEEDING COMPLETE')
    console.log(`  Categories: ${CATEGORIES.length}`)
    console.log(`  Products: ${PRODUCTS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
