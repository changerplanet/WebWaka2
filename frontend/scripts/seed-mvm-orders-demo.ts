/**
 * MVM Orders Demo Seeder - Marketplace Orders for demo-marketplace tenant
 * 
 * Seeds comprehensive order data for the demo-marketplace tenant with:
 * - 8 parent orders with various statuses
 * - Sub-orders split by vendor
 * - 5 commission records
 * - 3 payout records
 * 
 * Run: npx tsx scripts/seed-mvm-orders-demo.ts
 * 
 * @module scripts/seed-mvm-orders-demo
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_MARKETPLACE_SLUG = 'demo-marketplace'

const NIGERIAN_CUSTOMERS = [
  { name: 'Adaeze Okonkwo', email: 'adaeze.okonkwo@gmail.com', phone: '+2348031234567', city: 'Lekki', state: 'Lagos' },
  { name: 'Emeka Nwachukwu', email: 'emeka.nwachukwu@yahoo.com', phone: '+2348041234567', city: 'Ikeja', state: 'Lagos' },
  { name: 'Fatima Bello', email: 'fatima.bello@hotmail.com', phone: '+2348051234567', city: 'Victoria Island', state: 'Lagos' },
  { name: 'Chinedu Obi', email: 'chinedu.obi@gmail.com', phone: '+2348061234567', city: 'Surulere', state: 'Lagos' },
  { name: 'Ngozi Eze', email: 'ngozi.eze@outlook.com', phone: '+2348071234567', city: 'Yaba', state: 'Lagos' },
  { name: 'Olumide Adebayo', email: 'olumide.adebayo@gmail.com', phone: '+2348081234567', city: 'Ikoyi', state: 'Lagos' },
  { name: 'Aisha Mohammed', email: 'aisha.mohammed@yahoo.com', phone: '+2348091234567', city: 'Ajah', state: 'Lagos' },
  { name: 'Tunde Bakare', email: 'tunde.bakare@gmail.com', phone: '+2348101234567', city: 'Gbagada', state: 'Lagos' }
]

const DEMO_PRODUCTS = [
  { id: 'mvm-prod-001', name: 'iPhone 15 Pro Max 256GB', category: 'Electronics', basePrice: 1250000 },
  { id: 'mvm-prod-002', name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', basePrice: 980000 },
  { id: 'mvm-prod-003', name: 'MacBook Air M3 15"', category: 'Electronics', basePrice: 1450000 },
  { id: 'mvm-prod-004', name: 'Ankara Lace Gown', category: 'Fashion', basePrice: 35000 },
  { id: 'mvm-prod-005', name: 'Aso-oke Bridal Set', category: 'Fashion', basePrice: 125000 },
  { id: 'mvm-prod-006', name: 'Men\'s Agbada Complete', category: 'Fashion', basePrice: 85000 },
  { id: 'mvm-prod-007', name: 'Industrial Blender 2000W', category: 'Home', basePrice: 45000 },
  { id: 'mvm-prod-008', name: 'Rice Cooker 10L', category: 'Home', basePrice: 38000 },
  { id: 'mvm-prod-009', name: 'Standing AC 2HP', category: 'Home', basePrice: 350000 },
  { id: 'mvm-prod-010', name: 'Toyota Camry Brake Pads', category: 'Auto', basePrice: 25000 },
  { id: 'mvm-prod-011', name: 'Car Battery 100AH', category: 'Auto', basePrice: 85000 },
  { id: 'mvm-prod-012', name: 'LED Headlight Kit', category: 'Auto', basePrice: 55000 }
]

const ORDER_CONFIGS = [
  { status: 'COMPLETED', paymentStatus: 'CAPTURED', subOrderStatus: 'DELIVERED' as const },
  { status: 'COMPLETED', paymentStatus: 'CAPTURED', subOrderStatus: 'DELIVERED' as const },
  { status: 'SPLIT', paymentStatus: 'CAPTURED', subOrderStatus: 'SHIPPED' as const },
  { status: 'SPLIT', paymentStatus: 'CAPTURED', subOrderStatus: 'PROCESSING' as const },
  { status: 'SPLIT', paymentStatus: 'CAPTURED', subOrderStatus: 'CONFIRMED' as const },
  { status: 'PENDING', paymentStatus: 'PENDING', subOrderStatus: 'PENDING' as const },
  { status: 'PENDING', paymentStatus: 'PENDING', subOrderStatus: 'PENDING' as const },
  { status: 'CANCELLED', paymentStatus: 'REFUNDED', subOrderStatus: 'CANCELLED' as const }
]

async function getTenantId(): Promise<string> {
  console.log(`🔍 Looking up tenant with slug: ${DEMO_MARKETPLACE_SLUG}...`)
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEMO_MARKETPLACE_SLUG }
  })
  
  if (!tenant) {
    throw new Error(`Tenant with slug '${DEMO_MARKETPLACE_SLUG}' not found. Please create the tenant first.`)
  }
  
  console.log(`  ✅ Found tenant: ${tenant.name} (${tenant.id})`)
  return tenant.id
}

async function getOrCreateVendors(tenantId: string) {
  console.log('🏪 Ensuring demo vendors exist...')
  
  const vendorData = [
    {
      name: 'Kola Electronics Hub',
      email: 'kola.electronics@demo-market.ng',
      slug: 'kola-electronics-hub',
      legalName: 'Kola Electronics Nigeria Ltd',
      businessType: 'Electronics',
      city: 'Ikeja',
      state: 'Lagos'
    },
    {
      name: 'Amaka Fashion House',
      email: 'amaka.fashion@demo-market.ng',
      slug: 'amaka-fashion-house',
      legalName: 'Amaka Fashion & Textiles',
      businessType: 'Fashion',
      city: 'Lagos Island',
      state: 'Lagos'
    },
    {
      name: 'Chidi Home Essentials',
      email: 'chidi.home@demo-market.ng',
      slug: 'chidi-home-essentials',
      legalName: 'Chidi Home & Kitchen Ltd',
      businessType: 'Home & Kitchen',
      city: 'Surulere',
      state: 'Lagos'
    },
    {
      name: 'Uche Auto Parts',
      email: 'uche.auto@demo-market.ng',
      slug: 'uche-auto-parts',
      legalName: 'Uche Automotive Supplies',
      businessType: 'Automotive',
      city: 'Mushin',
      state: 'Lagos'
    }
  ]
  
  const vendors = []
  
  for (const v of vendorData) {
    const vendor = await prisma.mvm_vendor.upsert({
      where: { tenantId_email: { tenantId, email: v.email } },
      update: {
        name: v.name,
        status: 'APPROVED',
        isVerified: true,
        onboardingStep: 'COMPLETED',
        approvedAt: new Date()
      },
      create: {
        tenantId,
        name: v.name,
        slug: v.slug,
        email: v.email,
        phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        legalName: v.legalName,
        businessType: v.businessType,
        city: v.city,
        state: v.state,
        country: 'NG',
        status: 'APPROVED',
        isVerified: true,
        onboardingStep: 'COMPLETED',
        approvedAt: new Date(),
        bankName: 'Guaranty Trust Bank',
        bankCode: '058',
        accountNumber: `${1000000000 + Math.floor(Math.random() * 9000000000)}`,
        accountName: v.legalName
      }
    })
    vendors.push(vendor)
  }
  
  console.log(`  ✅ ${vendors.length} vendors ready`)
  return vendors
}

async function cleanupExistingData(tenantId: string) {
  console.log('🧹 Cleaning up existing demo orders...')
  
  const demoOrders = await prisma.mvm_parent_order.findMany({
    where: {
      tenantId,
      orderNumber: { startsWith: 'MVM-DEMO-' }
    },
    select: { id: true }
  })
  
  if (demoOrders.length > 0) {
    await prisma.mvm_parent_order.deleteMany({
      where: {
        id: { in: demoOrders.map(o => o.id) }
      }
    })
    console.log(`  ✅ Deleted ${demoOrders.length} existing demo orders`)
  } else {
    console.log('  ✅ No existing demo orders to clean up')
  }
  
  const demoPayouts = await prisma.mvm_payout.findMany({
    where: {
      tenantId,
      payoutNumber: { startsWith: 'PAY-DEMO-' }
    },
    select: { id: true }
  })
  
  if (demoPayouts.length > 0) {
    await prisma.mvm_payout.deleteMany({
      where: {
        id: { in: demoPayouts.map(p => p.id) }
      }
    })
    console.log(`  ✅ Deleted ${demoPayouts.length} existing demo payouts`)
  }
}

async function seedParentOrders(tenantId: string, vendors: any[]) {
  console.log('🛒 Seeding 8 parent orders...')
  
  const createdOrders = []
  const baseDate = new Date()
  
  for (let i = 0; i < 8; i++) {
    const customer = NIGERIAN_CUSTOMERS[i]
    const config = ORDER_CONFIGS[i]
    const orderDate = new Date(baseDate.getTime() - (7 - i) * 24 * 60 * 60 * 1000)
    const orderNumber = `MVM-DEMO-${String(i + 1).padStart(4, '0')}`
    
    const numVendors = i < 4 ? 2 : 1
    const selectedVendors = vendors.slice(0, numVendors)
    
    const items: Array<{
      vendorId: string
      productId: string
      productName: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }> = []
    
    for (let v = 0; v < numVendors; v++) {
      const vendor = selectedVendors[v]
      let productPool: typeof DEMO_PRODUCTS = []
      
      if (vendor.businessType === 'Electronics') {
        productPool = DEMO_PRODUCTS.filter(p => p.category === 'Electronics')
      } else if (vendor.businessType === 'Fashion') {
        productPool = DEMO_PRODUCTS.filter(p => p.category === 'Fashion')
      } else if (vendor.businessType === 'Home & Kitchen') {
        productPool = DEMO_PRODUCTS.filter(p => p.category === 'Home')
      } else {
        productPool = DEMO_PRODUCTS.filter(p => p.category === 'Auto')
      }
      
      const product = productPool[i % productPool.length]
      const quantity = 1 + (i % 3)
      
      items.push({
        vendorId: vendor.id,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.basePrice,
        lineTotal: product.basePrice * quantity
      })
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const taxTotal = Math.round(subtotal * 0.075 * 100) / 100
    const shippingTotal = 3500
    const grandTotal = subtotal + taxTotal + shippingTotal
    
    const parentOrder = await prisma.mvm_parent_order.create({
      data: {
        tenantId,
        orderNumber,
        customerId: `cust-demo-${i + 1}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: customer.name,
        status: config.status,
        shippingAddress: {
          firstName: customer.name.split(' ')[0],
          lastName: customer.name.split(' ').slice(1).join(' '),
          addressLine1: `${10 + i} ${['Ademola Adetokunbo', 'Ozumba Mbadiwe', 'Adeola Odeku', 'Awolowo Road'][i % 4]} Street`,
          city: customer.city,
          state: customer.state,
          country: 'NG',
          phone: customer.phone
        },
        currency: 'NGN',
        subtotal,
        discountTotal: i === 2 ? 5000 : 0,
        shippingTotal,
        taxTotal,
        grandTotal: grandTotal - (i === 2 ? 5000 : 0),
        paymentMethod: ['CARD', 'BANK_TRANSFER', 'CARD', 'USSD', 'CARD', 'POD', 'BANK_TRANSFER', 'CARD'][i],
        paymentStatus: config.paymentStatus,
        paymentRef: config.paymentStatus === 'CAPTURED' ? `PAY-${Date.now()}-${i}` : null,
        paidAt: config.paymentStatus === 'CAPTURED' ? orderDate : null,
        channel: 'WEB',
        promotionCode: i === 2 ? 'WELCOME5K' : null,
        splitAt: config.status !== 'PENDING' ? new Date(orderDate.getTime() + 30 * 60 * 1000) : null,
        completedAt: config.status === 'COMPLETED' ? new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        cancelledAt: config.status === 'CANCELLED' ? new Date(orderDate.getTime() + 2 * 60 * 60 * 1000) : null,
        cancelReason: config.status === 'CANCELLED' ? 'Customer requested cancellation' : null,
        createdAt: orderDate,
        updatedAt: orderDate
      }
    })
    
    for (const item of items) {
      await prisma.mvm_parent_order_item.create({
        data: {
          parentOrderId: parentOrder.id,
          vendorId: item.vendorId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
          tax: Math.round(item.lineTotal * 0.075 * 100) / 100,
          lineTotal: item.lineTotal
        }
      })
    }
    
    createdOrders.push({ parentOrder, items, config })
  }
  
  console.log(`  ✅ ${createdOrders.length} parent orders created`)
  return createdOrders
}

async function seedSubOrders(tenantId: string, parentOrders: any[]) {
  console.log('📦 Seeding sub-orders...')
  
  const createdSubOrders = []
  let subOrderCounter = 1
  
  for (const { parentOrder, items, config } of parentOrders) {
    for (const item of items) {
      const commissionRate = 12
      const commissionAmount = Math.round(item.lineTotal * (commissionRate / 100) * 100) / 100
      const vendorPayout = item.lineTotal - commissionAmount
      const shippingTotal = 1750
      const taxTotal = Math.round(item.lineTotal * 0.075 * 100) / 100
      
      const subOrder = await prisma.mvm_sub_order.create({
        data: {
          tenantId,
          parentOrderId: parentOrder.id,
          vendorId: item.vendorId,
          subOrderNumber: `SUB-DEMO-${String(subOrderCounter++).padStart(4, '0')}`,
          status: config.subOrderStatus,
          customerName: parentOrder.customerName,
          shippingCity: parentOrder.shippingAddress?.city || 'Lagos',
          shippingState: parentOrder.shippingAddress?.state || 'Lagos',
          shippingCountry: 'NG',
          currency: 'NGN',
          subtotal: item.lineTotal,
          shippingTotal,
          taxTotal,
          discountTotal: 0,
          grandTotal: item.lineTotal + shippingTotal + taxTotal,
          commissionRate,
          commissionAmount,
          vendorPayout,
          confirmedAt: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(config.subOrderStatus) 
            ? new Date(parentOrder.createdAt.getTime() + 60 * 60 * 1000) : null,
          processingAt: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(config.subOrderStatus)
            ? new Date(parentOrder.createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
          shippedAt: ['SHIPPED', 'DELIVERED'].includes(config.subOrderStatus)
            ? new Date(parentOrder.createdAt.getTime() + 24 * 60 * 60 * 1000) : null,
          deliveredAt: config.subOrderStatus === 'DELIVERED'
            ? new Date(parentOrder.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000) : null,
          trackingNumber: ['SHIPPED', 'DELIVERED'].includes(config.subOrderStatus)
            ? `GIG${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null,
          shippingCarrier: ['SHIPPED', 'DELIVERED'].includes(config.subOrderStatus)
            ? 'GIG Logistics' : null,
          cancelledAt: config.subOrderStatus === 'CANCELLED' ? parentOrder.cancelledAt : null,
          cancelReason: config.subOrderStatus === 'CANCELLED' ? 'Order cancelled by customer' : null
        }
      })
      
      await prisma.mvm_sub_order_item.create({
        data: {
          subOrderId: subOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
          tax: taxTotal,
          lineTotal: item.lineTotal,
          fulfilledQuantity: config.subOrderStatus === 'DELIVERED' ? item.quantity : 0
        }
      })
      
      createdSubOrders.push({ subOrder, item, config })
    }
  }
  
  console.log(`  ✅ ${createdSubOrders.length} sub-orders created`)
  return createdSubOrders
}

async function seedCommissions(tenantId: string, subOrders: any[]) {
  console.log('💰 Seeding 5 commission records...')
  
  const eligibleSubOrders = subOrders.filter(
    s => ['DELIVERED', 'SHIPPED', 'PROCESSING'].includes(s.config.subOrderStatus)
  ).slice(0, 5)
  
  const createdCommissions = []
  
  for (let i = 0; i < eligibleSubOrders.length; i++) {
    const { subOrder, item } = eligibleSubOrders[i]
    
    const vatAmount = Math.round(item.lineTotal * 0.075 * 100) / 100
    const commissionRate = subOrder.commissionRate
    const commissionAmount = subOrder.commissionAmount
    const vendorPayout = subOrder.vendorPayout
    
    let status: 'PENDING' | 'PROCESSING' | 'CLEARED' | 'PAID' | 'DISPUTED' | 'REVERSED'
    if (i < 2) {
      status = 'PAID'
    } else if (i < 3) {
      status = 'CLEARED'
    } else {
      status = 'PENDING'
    }
    
    const clearsAt = new Date(subOrder.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const commission = await prisma.mvm_commission.create({
      data: {
        tenantId,
        subOrderId: subOrder.id,
        vendorId: subOrder.vendorId,
        saleAmount: item.lineTotal,
        vatAmount,
        commissionRate,
        commissionAmount,
        vendorPayout,
        status,
        clearsAt,
        clearedAt: ['CLEARED', 'PAID'].includes(status) ? clearsAt : null,
        paidAt: status === 'PAID' ? new Date(clearsAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null
      }
    })
    
    createdCommissions.push(commission)
  }
  
  console.log(`  ✅ ${createdCommissions.length} commissions created`)
  return createdCommissions
}

async function seedPayouts(tenantId: string, vendors: any[], commissions: any[]) {
  console.log('💳 Seeding 3 payout records...')
  
  const createdPayouts = []
  const baseDate = new Date()
  
  const payoutConfigs = [
    { status: 'COMPLETED' as const, vendorIndex: 0 },
    { status: 'PROCESSING' as const, vendorIndex: 1 },
    { status: 'PENDING' as const, vendorIndex: 2 }
  ]
  
  for (let i = 0; i < 3; i++) {
    const config = payoutConfigs[i]
    const vendor = vendors[config.vendorIndex]
    
    const vendorCommissions = commissions.filter(c => c.vendorId === vendor.id)
    const grossAmount = vendorCommissions.length > 0 
      ? vendorCommissions.reduce((sum: number, c: any) => sum + parseFloat(c.vendorPayout.toString()), 0)
      : 150000 + (i * 50000)
    
    const deductions = i === 0 ? 500 : 0
    const netAmount = grossAmount - deductions
    
    const periodEnd = new Date(baseDate.getTime() - i * 14 * 24 * 60 * 60 * 1000)
    const periodStart = new Date(periodEnd.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const payout = await prisma.mvm_payout.create({
      data: {
        tenantId,
        vendorId: vendor.id,
        payoutNumber: `PAY-DEMO-${String(i + 1).padStart(4, '0')}`,
        periodStart,
        periodEnd,
        currency: 'NGN',
        grossAmount,
        deductions,
        netAmount,
        status: config.status,
        payoutMethod: 'BANK_TRANSFER',
        bankName: vendor.bankName || 'Guaranty Trust Bank',
        bankCode: vendor.bankCode || '058',
        accountNumber: vendor.accountNumber,
        accountName: vendor.legalName,
        scheduledAt: config.status !== 'PENDING' ? periodEnd : null,
        processedAt: ['PROCESSING', 'COMPLETED'].includes(config.status) 
          ? new Date(periodEnd.getTime() + 1 * 24 * 60 * 60 * 1000) : null,
        completedAt: config.status === 'COMPLETED'
          ? new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        paymentRef: config.status === 'COMPLETED'
          ? `GTB${Date.now()}-${i}` : null,
        approvedAt: config.status !== 'PENDING'
          ? new Date(periodEnd.getTime() + 12 * 60 * 60 * 1000) : null,
        approvedBy: config.status !== 'PENDING' ? 'system' : null
      }
    })
    
    if (config.status === 'COMPLETED' && vendorCommissions.length > 0) {
      for (const commission of vendorCommissions.filter((c: any) => c.status === 'PAID')) {
        await prisma.mvm_commission.update({
          where: { id: commission.id },
          data: { payoutId: payout.id }
        })
      }
    }
    
    createdPayouts.push(payout)
  }
  
  console.log(`  ✅ ${createdPayouts.length} payouts created`)
  return createdPayouts
}

async function main() {
  console.log('🚀 Starting MVM Orders Demo Seeder...')
  console.log('=' .repeat(60))
  
  try {
    const tenantId = await getTenantId()
    
    await cleanupExistingData(tenantId)
    
    const vendors = await getOrCreateVendors(tenantId)
    
    const parentOrders = await seedParentOrders(tenantId, vendors)
    
    const subOrders = await seedSubOrders(tenantId, parentOrders)
    
    const commissions = await seedCommissions(tenantId, subOrders)
    
    await seedPayouts(tenantId, vendors, commissions)
    
    console.log('=' .repeat(60))
    console.log('✅ MVM Orders Demo seeding completed successfully!')
    console.log('')
    console.log('Summary:')
    console.log(`  - Tenant: ${DEMO_MARKETPLACE_SLUG}`)
    console.log(`  - Parent Orders: 8`)
    console.log(`  - Sub-Orders: ${subOrders.length}`)
    console.log(`  - Commissions: ${commissions.length}`)
    console.log(`  - Payouts: 3`)
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
