/**
 * Demo Seed Script — Orders
 * EXECUTION APPROVED
 * 
 * Orders Demo Data Seeder for SVM (Single Vendor Marketplace)
 * 
 * Creates demo order data for demo-retail-store tenant:
 * - 8-10 customer orders with various statuses
 * - Order line items linked to existing products
 * - Nigerian customer context (Lagos addresses)
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-orders-demo.ts
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

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`
}

function randomDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
  return date
}

// =============================================================================
// NIGERIAN DEMO DATA
// =============================================================================

const NIGERIAN_CUSTOMERS = [
  { firstName: 'Adebayo', lastName: 'Okonkwo', email: 'adebayo.okonkwo@example.com', phone: '+2348012345678' },
  { firstName: 'Chidinma', lastName: 'Eze', email: 'chidinma.eze@example.com', phone: '+2348023456789' },
  { firstName: 'Oluwaseun', lastName: 'Adeyemi', email: 'seun.adeyemi@example.com', phone: '+2348034567890' },
  { firstName: 'Ngozi', lastName: 'Okafor', email: 'ngozi.okafor@example.com', phone: '+2348045678901' },
  { firstName: 'Emeka', lastName: 'Nnamdi', email: 'emeka.nnamdi@example.com', phone: '+2348056789012' },
  { firstName: 'Funke', lastName: 'Bakare', email: 'funke.bakare@example.com', phone: '+2348067890123' },
  { firstName: 'Tunde', lastName: 'Ajayi', email: 'tunde.ajayi@example.com', phone: '+2348078901234' },
  { firstName: 'Amaka', lastName: 'Chukwu', email: 'amaka.chukwu@example.com', phone: '+2348089012345' },
  { firstName: 'Yemi', lastName: 'Adeola', email: 'yemi.adeola@example.com', phone: '+2348090123456' },
  { firstName: 'Kemi', lastName: 'Olumide', email: 'kemi.olumide@example.com', phone: '+2348001234567' },
]

const LAGOS_ADDRESSES = [
  { line1: '15 Admiralty Way', line2: 'Lekki Phase 1', city: 'Lagos', state: 'Lagos', postal: '101233', area: 'Lekki' },
  { line1: '42 Allen Avenue', line2: 'Ikeja', city: 'Lagos', state: 'Lagos', postal: '100271', area: 'Ikeja' },
  { line1: '8 Adeola Odeku Street', line2: 'Victoria Island', city: 'Lagos', state: 'Lagos', postal: '101241', area: 'VI' },
  { line1: '23 Ogudu Road', line2: 'Ojota', city: 'Lagos', state: 'Lagos', postal: '100212', area: 'Ojota' },
  { line1: '56 Ikorodu Road', line2: 'Yaba', city: 'Lagos', state: 'Lagos', postal: '101212', area: 'Yaba' },
  { line1: '11 Bode Thomas Street', line2: 'Surulere', city: 'Lagos', state: 'Lagos', postal: '101283', area: 'Surulere' },
  { line1: '78 Awolowo Road', line2: 'Ikoyi', city: 'Lagos', state: 'Lagos', postal: '101233', area: 'Ikoyi' },
  { line1: '34 Adeniyi Jones Avenue', line2: 'Ikeja', city: 'Lagos', state: 'Lagos', postal: '100271', area: 'Ikeja' },
  { line1: '5 Akin Adesola Street', line2: 'Victoria Island', city: 'Lagos', state: 'Lagos', postal: '101241', area: 'VI' },
  { line1: '19 Herbert Macaulay Way', line2: 'Sabo', city: 'Lagos', state: 'Lagos', postal: '101212', area: 'Yaba' },
]

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD'] as const
const PAYMENT_STATUSES = ['PENDING', 'CAPTURED'] as const
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED'] as const

// Product SKUs from seed-products-demo.ts
const PRODUCT_SKUS = [
  'RICE-MG-5KG', 'RICE-OF-5KG', 'OIL-DK-5L', 'SUGAR-DG-1KG', 'INDOMIE-70G',
  'SPAGHETTI-500G', 'TOMATO-GT-400G', 'MAGGI-100PCS', 'COCA-50CL', 'FANTA-50CL',
  'MALTINA-33CL', 'MILO-400G', 'WATER-EVA-75CL', 'PEAK-400G', 'DANO-400G',
  'EGGS-CRATE', 'GALA-REG', 'CABIN-BISCUIT', 'BREAD-AGEGE', 'OMO-900G',
  'HARPIC-500ML', 'DETTOL-175G', 'CLOSEUP-140G', 'CHARGER-ANDROID', 'POWERBANK-10K'
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

async function getExistingProducts(tenantId: string) {
  console.log('Fetching existing products...')
  
  const products = await prisma.product.findMany({
    where: { tenantId },
    select: { id: true, sku: true, name: true, price: true }
  })
  
  if (products.length === 0) {
    throw new Error('FATAL: No products found. Please run seed-products-demo.ts first.')
  }
  
  console.log(`  Found ${products.length} products`)
  return products
}

async function seedOrders(tenantId: string, products: { id: string; sku: string | null; name: string; price: any }[]) {
  console.log('Creating demo orders...')
  
  const ordersToCreate = 10
  let createdCount = 0
  let skippedCount = 0
  
  for (let i = 0; i < ordersToCreate; i++) {
    const customer = NIGERIAN_CUSTOMERS[i]
    const address = LAGOS_ADDRESSES[i]
    const orderId = `${tenantId}-order-${i + 1}`
    
    // Check if order already exists (idempotent)
    const existing = await prisma.svm_orders.findUnique({
      where: { id: orderId }
    })
    
    if (existing) {
      console.log(`  Order exists: ${existing.orderNumber}`)
      skippedCount++
      continue
    }
    
    // Determine order status and related fields
    const statusIndex = i % ORDER_STATUSES.length
    const status = ORDER_STATUSES[statusIndex]
    const paymentMethod = PAYMENT_METHODS[i % PAYMENT_METHODS.length]
    
    // Set payment and fulfillment status based on order status
    let paymentStatus: 'PENDING' | 'CAPTURED' = 'PENDING'
    let fulfillmentStatus: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' = 'UNFULFILLED'
    let shippedAt: Date | null = null
    let deliveredAt: Date | null = null
    let paidAt: Date | null = null
    
    const orderDate = randomDate(30)
    
    if (status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED') {
      paymentStatus = 'CAPTURED'
      paidAt = new Date(orderDate.getTime() + 1000 * 60 * 30) // 30 mins after order
    }
    
    if (status === 'SHIPPED' || status === 'DELIVERED') {
      fulfillmentStatus = status === 'DELIVERED' ? 'FULFILLED' : 'PARTIALLY_FULFILLED'
      shippedAt = new Date(orderDate.getTime() + 1000 * 60 * 60 * 24) // 1 day after order
    }
    
    if (status === 'DELIVERED') {
      deliveredAt = new Date(orderDate.getTime() + 1000 * 60 * 60 * 24 * 3) // 3 days after order
    }
    
    // Select random products for this order (2-5 items)
    const itemCount = Math.floor(Math.random() * 4) + 2
    const shuffledProducts = [...products].sort(() => Math.random() - 0.5)
    const selectedProducts = shuffledProducts.slice(0, itemCount)
    
    // Calculate order totals
    let subtotal = 0
    const orderItems: {
      id: string
      orderId: string
      productId: string
      productName: string
      sku: string
      unitPrice: number
      quantity: number
      discountAmount: number
      taxAmount: number
      lineTotal: number
      fulfilledQuantity: number
      refundedQuantity: number
      createdAt: Date
    }[] = []
    
    for (const product of selectedProducts) {
      const quantity = Math.floor(Math.random() * 5) + 1
      const unitPrice = Number(product.price)
      const lineTotal = unitPrice * quantity
      subtotal += lineTotal
      
      orderItems.push({
        id: `${orderId}-item-${orderItems.length + 1}`,
        orderId,
        productId: product.id,
        productName: product.name,
        sku: product.sku ?? '',
        unitPrice,
        quantity,
        discountAmount: 0,
        taxAmount: 0,
        lineTotal,
        fulfilledQuantity: status === 'DELIVERED' ? quantity : 0,
        refundedQuantity: 0,
        createdAt: orderDate
      })
    }
    
    const shippingTotal = 1500 // ₦1,500 shipping fee
    const taxTotal = Math.round(subtotal * 0.075 * 100) / 100 // 7.5% VAT
    const grandTotal = subtotal + shippingTotal + taxTotal
    
    const shippingAddress = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      addressLine1: address.line1,
      addressLine2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal,
      country: 'Nigeria'
    }
    
    const orderNumber = `ORD-${(10001 + i).toString()}`
    
    // Create order
    await prisma.svm_orders.create({
      data: {
        id: orderId,
        tenantId,
        orderNumber,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: `${customer.firstName} ${customer.lastName}`,
        status,
        paymentStatus,
        fulfillmentStatus,
        channel: 'WEB',
        shippingAddress,
        billingAddress: shippingAddress,
        shippingMethod: 'Standard Delivery',
        shippingCarrier: 'GIG Logistics',
        shippingTotal,
        currency: 'NGN',
        subtotal,
        discountTotal: 0,
        taxTotal,
        grandTotal,
        paymentMethod,
        paymentRef: paymentStatus === 'CAPTURED' ? `PAY-${generateId().toUpperCase()}` : null,
        paidAt,
        shippedAt,
        deliveredAt,
        estimatedDelivery: shippedAt ? new Date(shippedAt.getTime() + 1000 * 60 * 60 * 24 * 3) : null,
        trackingNumber: shippedAt ? `GIG${Math.random().toString().slice(2, 12)}` : null,
        createdAt: orderDate,
        updatedAt: new Date(),
      }
    })
    
    // Create order items
    for (const item of orderItems) {
      await prisma.svm_order_items.create({
        data: item
      })
    }
    
    console.log(`  Created order: ${orderNumber} (${status}) - ${orderItems.length} items - ₦${grandTotal.toLocaleString()}`)
    createdCount++
  }
  
  return { createdCount, skippedCount }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('ORDERS DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Context')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify demo tenant exists
    const tenant = await verifyDemoTenant()
    
    // Step 2: Get existing products
    const products = await getExistingProducts(tenant.id)
    
    // Step 3: Seed orders with line items
    const { createdCount, skippedCount } = await seedOrders(tenant.id, products)
    
    console.log('='.repeat(60))
    console.log('ORDERS DEMO SEEDING COMPLETE')
    console.log(`  Orders Created: ${createdCount}`)
    console.log(`  Orders Skipped (already exist): ${skippedCount}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
