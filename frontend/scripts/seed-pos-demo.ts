/**
 * POS & Retail Operations Suite - Nigerian Demo Data Seeder
 * 
 * Creates demo data for a Nigerian retail store:
 * - Demo tenant (WebWaka Supermarket)
 * - Nigerian staff names
 * - NGN-priced products
 * - Sample shifts and sales
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-pos-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_ID = 'demo-webwaka-pos'
const DEMO_LOCATION_ID = 'ng-lagos-ikeja-01'

// Nigerian staff names
const STAFF = [
  { id: 'staff-001', name: 'Adebayo Olumide', role: 'Cashier' },
  { id: 'staff-002', name: 'Ngozi Chukwuma', role: 'Senior Cashier' },
  { id: 'staff-003', name: 'Yusuf Mohammed', role: 'Shift Supervisor' },
  { id: 'staff-004', name: 'Chidinma Okafor', role: 'Cashier' },
  { id: 'staff-005', name: 'Emeka Nnamdi', role: 'Store Manager' },
]

// Nigerian products with NGN pricing
const PRODUCTS = [
  { id: 'prod-001', sku: 'INDOMIE-001', name: 'Indomie Chicken (70g)', price: 250, category: 'Groceries' },
  { id: 'prod-002', sku: 'GALA-001', name: 'Gala Sausage Roll', price: 300, category: 'Snacks' },
  { id: 'prod-003', sku: 'PEAK-001', name: 'Peak Milk Tin (400g)', price: 1800, category: 'Dairy' },
  { id: 'prod-004', sku: 'MILO-001', name: 'Milo (400g)', price: 2500, category: 'Beverages' },
  { id: 'prod-005', sku: 'GOLDEN-001', name: 'Golden Morn (450g)', price: 1500, category: 'Cereals' },
  { id: 'prod-006', sku: 'COCA-001', name: 'Coca-Cola (50cl)', price: 350, category: 'Drinks' },
  { id: 'prod-007', sku: 'MALTINA-001', name: 'Maltina Classic', price: 400, category: 'Drinks' },
  { id: 'prod-008', sku: 'BREAD-001', name: 'Agege Bread (Sliced)', price: 1200, category: 'Bakery' },
  { id: 'prod-009', sku: 'SUGAR-001', name: 'Dangote Sugar (1kg)', price: 1400, category: 'Groceries' },
  { id: 'prod-010', sku: 'RICE-001', name: 'Mama Gold Rice (5kg)', price: 8500, category: 'Groceries' },
  { id: 'prod-011', sku: 'OIL-001', name: 'Devon King\'s Oil (5L)', price: 12000, category: 'Groceries' },
  { id: 'prod-012', sku: 'DANO-001', name: 'Dano Milk Powder (400g)', price: 2200, category: 'Dairy' },
  { id: 'prod-013', sku: 'MAGGI-001', name: 'Maggi Cubes (100pcs)', price: 1000, category: 'Groceries' },
  { id: 'prod-014', sku: 'BISCUIT-001', name: 'Cabin Biscuit', price: 200, category: 'Snacks' },
  { id: 'prod-015', sku: 'WATER-001', name: 'Eva Water (75cl)', price: 200, category: 'Drinks' },
  { id: 'prod-016', sku: 'SPAGHETTI-001', name: 'Dangote Spaghetti (500g)', price: 650, category: 'Groceries' },
  { id: 'prod-017', sku: 'DETERGENT-001', name: 'OMO Multi Active (900g)', price: 1600, category: 'Household' },
  { id: 'prod-018', sku: 'SOAP-001', name: 'Dettol Soap (175g)', price: 550, category: 'Personal Care' },
  { id: 'prod-019', sku: 'TOMATO-001', name: 'Gino Tomato Paste (400g)', price: 1200, category: 'Groceries' },
  { id: 'prod-020', sku: 'JUICE-001', name: 'Chi Exotic Juice (1L)', price: 1300, category: 'Drinks' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedShifts() {
  console.log('Creating demo shifts...')
  
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Yesterday's shift (closed and reconciled)
  const shift1 = await prisma.pos_shift.create({
    data: {
      tenantId: DEMO_TENANT_ID,
      locationId: DEMO_LOCATION_ID,
      shiftNumber: `SHIFT-${yesterday.toISOString().slice(0, 10).replace(/-/g, '')}-001`,
      openedById: STAFF[1].id,
      openedByName: STAFF[1].name,
      closedById: STAFF[2].id,
      closedByName: STAFF[2].name,
      openedAt: new Date(yesterday.setHours(8, 0, 0)),
      closedAt: new Date(yesterday.setHours(20, 0, 0)),
      status: 'RECONCILED',
      openingFloat: 10000,
      expectedCash: 75500,
      actualCash: 75300,
      cashVariance: -200,
      varianceReason: 'Small cash handling error',
      currency: 'NGN',
      totalSales: 125000,
      totalRefunds: 2500,
      netSales: 122500,
      transactionCount: 87,
      refundCount: 2,
      cashTotal: 65500,
      cardTotal: 35000,
      transferTotal: 22000,
      mobileMoneyTotal: 0,
      walletTotal: 0,
      otherTotal: 0,
    },
  })
  console.log(`  Created shift: ${shift1.shiftNumber}`)
  
  // Today's shift (open)
  const shift2 = await prisma.pos_shift.create({
    data: {
      tenantId: DEMO_TENANT_ID,
      locationId: DEMO_LOCATION_ID,
      shiftNumber: `SHIFT-${today.toISOString().slice(0, 10).replace(/-/g, '')}-001`,
      openedById: STAFF[0].id,
      openedByName: STAFF[0].name,
      openedAt: new Date(today.setHours(8, 0, 0)),
      status: 'OPEN',
      openingFloat: 10000,
      currency: 'NGN',
      totalSales: 45750,
      totalRefunds: 0,
      netSales: 45750,
      transactionCount: 32,
      refundCount: 0,
      cashTotal: 25750,
      cardTotal: 12000,
      transferTotal: 8000,
      mobileMoneyTotal: 0,
      walletTotal: 0,
      otherTotal: 0,
    },
  })
  console.log(`  Created shift: ${shift2.shiftNumber} (OPEN)`)
  
  return { shift1, shift2 }
}

async function seedSales(shiftId: string, count: number) {
  console.log(`Creating ${count} demo sales...`)
  
  const today = new Date()
  const sales = []
  
  for (let i = 0; i < count; i++) {
    const staff = STAFF[Math.floor(Math.random() * 3)]
    const paymentMethod = ['CASH', 'CASH', 'CASH', 'CARD', 'BANK_TRANSFER'][Math.floor(Math.random() * 5)]
    
    // Random items (1-5)
    const itemCount = Math.floor(Math.random() * 5) + 1
    const selectedProducts = []
    for (let j = 0; j < itemCount; j++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      selectedProducts.push({ ...product, quantity })
    }
    
    const subtotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const taxRate = 0.075
    const taxTotal = Math.round(subtotal * taxRate)
    const grandTotal = subtotal + taxTotal
    
    const saleTime = new Date(today)
    saleTime.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
    
    const sale = await prisma.pos_sale.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        locationId: DEMO_LOCATION_ID,
        shiftId: shiftId,
        saleNumber: `SALE-${today.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(5, '0')}`,
        receiptNumber: `RCP-${today.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(5, '0')}`,
        staffId: staff.id,
        staffName: staff.name,
        saleDate: saleTime,
        completedAt: saleTime,
        status: 'COMPLETED',
        subtotal: subtotal,
        discountTotal: 0,
        taxTotal: taxTotal,
        taxRate: taxRate,
        grandTotal: grandTotal,
        currency: 'NGN',
        paymentMethod: paymentMethod,
        amountTendered: paymentMethod === 'CASH' ? Math.ceil(grandTotal / 1000) * 1000 : undefined,
        changeGiven: paymentMethod === 'CASH' ? Math.ceil(grandTotal / 1000) * 1000 - grandTotal : undefined,
        transferReference: paymentMethod === 'BANK_TRANSFER' ? `NGN${Date.now()}` : undefined,
        items: {
          create: selectedProducts.map((p, idx) => ({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantity: p.quantity,
            unitPrice: p.price,
            discount: 0,
            tax: Math.round(p.price * p.quantity * taxRate),
            lineTotal: Math.round(p.price * p.quantity * (1 + taxRate)),
          })),
        },
      },
    })
    
    sales.push(sale)
  }
  
  console.log(`  Created ${sales.length} sales`)
  return sales
}

async function seedCashMovements(shiftId: string) {
  console.log('Creating demo cash movements...')
  
  // Opening float
  await prisma.pos_cash_movement.create({
    data: {
      tenantId: DEMO_TENANT_ID,
      shiftId: shiftId,
      movementType: 'OPEN_FLOAT',
      amount: 10000,
      direction: 'IN',
      balanceBefore: 0,
      balanceAfter: 10000,
      currency: 'NGN',
      performedById: STAFF[0].id,
      performedByName: STAFF[0].name,
    },
  })
  
  // Safe drop
  await prisma.pos_cash_movement.create({
    data: {
      tenantId: DEMO_TENANT_ID,
      shiftId: shiftId,
      movementType: 'DROP',
      amount: 20000,
      direction: 'OUT',
      balanceBefore: 35000,
      balanceAfter: 15000,
      currency: 'NGN',
      performedById: STAFF[0].id,
      performedByName: STAFF[0].name,
      approvedById: STAFF[4].id,
      approvedByName: STAFF[4].name,
      reason: 'Safe drop - excess cash removal',
    },
  })
  
  console.log('  Created cash movements')
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n🇳🇬 POS Demo Data Seeder - Nigeria-First\n')
  console.log('Tenant:', DEMO_TENANT_ID)
  console.log('Location:', DEMO_LOCATION_ID)
  console.log('')
  
  try {
    // Clean existing demo data
    console.log('Cleaning existing demo data...')
    await prisma.pos_cash_movement.deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
    await prisma.pos_sale_item.deleteMany({ where: { sale: { tenantId: DEMO_TENANT_ID } } })
    await prisma.pos_sale.deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
    await prisma.pos_shift.deleteMany({ where: { tenantId: DEMO_TENANT_ID } })
    console.log('  Done\n')
    
    // Create shifts
    const { shift1, shift2 } = await seedShifts()
    console.log('')
    
    // Create sales for yesterday's shift
    await seedSales(shift1.id, 20)
    console.log('')
    
    // Create sales for today's shift
    await seedSales(shift2.id, 15)
    console.log('')
    
    // Create cash movements for today
    await seedCashMovements(shift2.id)
    console.log('')
    
    console.log('✅ Demo data seeded successfully!\n')
    console.log('Summary:')
    console.log('  - 2 shifts (1 closed, 1 open)')
    console.log('  - 35 sales with Nigerian products')
    console.log('  - Cash movements for today')
    console.log('')
    console.log('Test the POS at: /pos')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
