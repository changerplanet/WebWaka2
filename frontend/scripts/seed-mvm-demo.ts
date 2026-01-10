/**
 * MVM Demo Data Seeder - Lagos Digital Market
 * 
 * Seeds a believable Nigerian multi-vendor marketplace with:
 * - Lagos-based vendors
 * - Nigerian products (₦ pricing)
 * - Sample orders and commissions
 * 
 * Run: npx ts-node scripts/seed-mvm-demo.ts
 * 
 * @module scripts/seed-mvm-demo
 * @canonical PC-SCP Phase S5
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// DEMO DATA - LAGOS DIGITAL MARKET
// ============================================================================

const DEMO_TENANT_ID = 'demo-tenant-001'
const MARKETPLACE_NAME = 'Lagos Digital Market'

// Nigerian Banks
const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank', code: '032' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank', code: '035' }
]

// Lagos Vendors
const DEMO_VENDORS = [
  {
    name: 'Adebayo Electronics',
    email: 'adebayo@lagosdm.ng',
    phone: '+2348012345678',
    legalName: 'Adebayo Electronics Nigeria Ltd',
    businessType: 'Electronics Retailer',
    description: 'Premium electronics and gadgets in Lagos. iPhones, Samsung, laptops, and accessories.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '15 Computer Village, Ikeja',
    status: 'APPROVED',
    isVerified: true,
    totalSales: 2500000,
    totalOrders: 45,
    averageRating: 4.7,
    reviewCount: 38
  },
  {
    name: 'Mama Nkechi Fashion',
    email: 'nkechi@lagosdm.ng',
    phone: '+2348023456789',
    legalName: 'Nkechi Fashion House',
    businessType: 'Fashion & Apparel',
    description: 'Authentic Nigerian fashion - Ankara, Aso-oke, and modern African designs.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '8 Balogun Market, Lagos Island',
    status: 'APPROVED',
    isVerified: true,
    totalSales: 1800000,
    totalOrders: 62,
    averageRating: 4.5,
    reviewCount: 55
  },
  {
    name: 'Chukwu Home Essentials',
    email: 'chukwu@lagosdm.ng',
    phone: '+2348034567890',
    legalName: 'Chukwu Trading Company',
    businessType: 'Home & Kitchen',
    description: 'Quality home appliances and kitchen essentials for Nigerian homes.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '22 Trade Fair Complex, Ojo',
    status: 'APPROVED',
    isVerified: false,
    totalSales: 950000,
    totalOrders: 28,
    averageRating: 4.3,
    reviewCount: 22
  },
  {
    name: 'Oluwaseun Beauty',
    email: 'seun@lagosdm.ng',
    phone: '+2348045678901',
    legalName: 'Oluwaseun Beauty Supplies',
    businessType: 'Beauty & Cosmetics',
    description: 'Nigerian and international beauty products. Skincare, makeup, and hair care.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '5 Adeniran Ogunsanya, Surulere',
    status: 'PENDING_APPROVAL',
    isVerified: false,
    totalSales: 0,
    totalOrders: 0,
    averageRating: null,
    reviewCount: 0
  },
  {
    name: 'Emeka Motors Accessories',
    email: 'emeka@lagosdm.ng',
    phone: '+2348056789012',
    legalName: 'Emeka Auto Parts Ltd',
    businessType: 'Automotive',
    description: 'Car accessories, spare parts, and auto electronics. Toyota, Honda, Mercedes parts.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '45 Ladipo Market, Mushin',
    status: 'APPROVED',
    isVerified: true,
    totalSales: 3200000,
    totalOrders: 78,
    averageRating: 4.8,
    reviewCount: 65
  },
  {
    name: 'Fatima Health Store',
    email: 'fatima@lagosdm.ng',
    phone: '+2348067890123',
    legalName: 'Fatima Pharmacy & Health',
    businessType: 'Health & Wellness',
    description: 'Health supplements, vitamins, and wellness products. NAFDAC approved.',
    city: 'Lagos',
    state: 'Lagos',
    addressLine1: '12 Awolowo Road, Ikoyi',
    status: 'SUSPENDED',
    isVerified: true,
    totalSales: 450000,
    totalOrders: 15,
    averageRating: 3.9,
    reviewCount: 12
  }
]

// Sample Products (referenced by productId - would come from Core catalog)
const DEMO_PRODUCTS = [
  { id: 'prod-001', name: 'iPhone 15 Pro Max 256GB', category: 'Electronics', basePrice: 1200000 },
  { id: 'prod-002', name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', basePrice: 980000 },
  { id: 'prod-003', name: 'MacBook Air M3', category: 'Electronics', basePrice: 850000 },
  { id: 'prod-004', name: 'Ankara Gown (3 yards)', category: 'Fashion', basePrice: 25000 },
  { id: 'prod-005', name: 'Aso-oke Complete Set', category: 'Fashion', basePrice: 85000 },
  { id: 'prod-006', name: 'Men\'s Native Senator', category: 'Fashion', basePrice: 45000 },
  { id: 'prod-007', name: 'Blender - 1500W Industrial', category: 'Home', basePrice: 35000 },
  { id: 'prod-008', name: 'Rice Cooker 5L', category: 'Home', basePrice: 28000 },
  { id: 'prod-009', name: 'Standing Fan - OX', category: 'Home', basePrice: 22000 },
  { id: 'prod-010', name: 'Car Battery 75AH', category: 'Auto', basePrice: 65000 },
  { id: 'prod-011', name: 'Brake Pads Set (Toyota)', category: 'Auto', basePrice: 18000 },
  { id: 'prod-012', name: 'Car Stereo with Bluetooth', category: 'Auto', basePrice: 45000 }
]

// ============================================================================
// SEEDER FUNCTIONS
// ============================================================================

async function seedMarketplaceConfig() {
  console.log('📦 Seeding marketplace config...')
  
  await prisma.mvm_marketplace_config.upsert({
    where: { tenantId: DEMO_TENANT_ID },
    update: {
      marketplaceName: MARKETPLACE_NAME,
      marketplaceSlug: 'lagos-digital-market',
      description: 'Lagos\'s premier online marketplace connecting quality vendors with Nigerian shoppers.',
      defaultCommissionRate: 15,
      vatRate: 7.5,
      payoutCycleDays: 14,
      minPayoutAmount: 5000,
      clearanceDays: 7,
      autoApproveVendors: false,
      requireVerification: true,
      isActive: true
    },
    create: {
      tenantId: DEMO_TENANT_ID,
      marketplaceName: MARKETPLACE_NAME,
      marketplaceSlug: 'lagos-digital-market',
      description: 'Lagos\'s premier online marketplace connecting quality vendors with Nigerian shoppers.',
      defaultCommissionRate: 15,
      vatRate: 7.5,
      payoutCycleDays: 14,
      minPayoutAmount: 5000,
      clearanceDays: 7,
      autoApproveVendors: false,
      requireVerification: true,
      isActive: true
    }
  })
  
  console.log('  ✅ Marketplace config created')
}

async function seedTiers() {
  console.log('🏆 Seeding vendor tiers...')
  
  const tiers = [
    {
      tenantId: DEMO_TENANT_ID,
      name: 'Bronze',
      code: 'BRONZE',
      description: 'Starting tier for new vendors',
      commissionRate: 15,
      priorityLevel: 1,
      featuredSlots: 0,
      supportLevel: 'STANDARD',
      isDefault: true,
      isActive: true
    },
    {
      tenantId: DEMO_TENANT_ID,
      name: 'Silver',
      code: 'SILVER',
      description: 'For growing vendors with good performance',
      commissionRate: 12,
      priorityLevel: 2,
      featuredSlots: 2,
      supportLevel: 'STANDARD',
      minMonthlySales: 500000,
      minRating: 4.0,
      minOrderCount: 50,
      isDefault: false,
      isActive: true
    },
    {
      tenantId: DEMO_TENANT_ID,
      name: 'Gold',
      code: 'GOLD',
      description: 'For established vendors with strong sales',
      commissionRate: 10,
      priorityLevel: 3,
      featuredSlots: 5,
      supportLevel: 'PRIORITY',
      minMonthlySales: 2000000,
      minRating: 4.5,
      minOrderCount: 200,
      isDefault: false,
      isActive: true
    },
    {
      tenantId: DEMO_TENANT_ID,
      name: 'Platinum',
      code: 'PLATINUM',
      description: 'Top-tier vendors with exceptional performance',
      commissionRate: 8,
      priorityLevel: 4,
      featuredSlots: 10,
      supportLevel: 'DEDICATED',
      minMonthlySales: 10000000,
      minRating: 4.8,
      minOrderCount: 1000,
      isDefault: false,
      isActive: true
    }
  ]
  
  for (const tier of tiers) {
    await prisma.mvm_vendor_tier.upsert({
      where: { 
        tenantId_code: { tenantId: tier.tenantId, code: tier.code }
      },
      update: tier,
      create: tier
    })
  }
  
  console.log(`  ✅ ${tiers.length} tiers created`)
}

async function seedVendors() {
  console.log('🏪 Seeding vendors...')
  
  // Get default tier
  const defaultTier = await prisma.mvm_vendor_tier.findFirst({
    where: { tenantId: DEMO_TENANT_ID, isDefault: true }
  })
  
  // Get silver tier for high performers
  const silverTier = await prisma.mvm_vendor_tier.findFirst({
    where: { tenantId: DEMO_TENANT_ID, code: 'SILVER' }
  })
  
  // Get gold tier for top performers
  const goldTier = await prisma.mvm_vendor_tier.findFirst({
    where: { tenantId: DEMO_TENANT_ID, code: 'GOLD' }
  })
  
  const createdVendors: any[] = []
  
  for (let i = 0; i < DEMO_VENDORS.length; i++) {
    const v = DEMO_VENDORS[i]
    const bank = NIGERIAN_BANKS[i % NIGERIAN_BANKS.length]
    
    // Assign tier based on performance
    let tierId = defaultTier?.id
    if (v.totalSales >= 2000000 && v.averageRating && v.averageRating >= 4.5) {
      tierId = goldTier?.id
    } else if (v.totalSales >= 500000 && v.averageRating && v.averageRating >= 4.0) {
      tierId = silverTier?.id
    }
    
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    const vendor = await prisma.mvm_vendor.upsert({
      where: {
        tenantId_email: { tenantId: DEMO_TENANT_ID, email: v.email }
      },
      update: {
        name: v.name,
        phone: v.phone,
        legalName: v.legalName,
        businessType: v.businessType,
        description: v.description,
        city: v.city,
        state: v.state,
        addressLine1: v.addressLine1,
        status: v.status as any,
        isVerified: v.isVerified,
        tierId,
        totalSales: v.totalSales,
        totalOrders: v.totalOrders,
        averageRating: v.averageRating,
        reviewCount: v.reviewCount,
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: `${1000000000 + i}`,
        accountName: v.legalName,
        onboardingStep: v.status === 'APPROVED' ? 'COMPLETED' : 'REGISTERED',
        approvedAt: v.status === 'APPROVED' ? new Date() : null,
        verifiedAt: v.isVerified ? new Date() : null
      },
      create: {
        tenantId: DEMO_TENANT_ID,
        name: v.name,
        slug,
        email: v.email,
        phone: v.phone,
        legalName: v.legalName,
        businessType: v.businessType,
        description: v.description,
        city: v.city,
        state: v.state,
        addressLine1: v.addressLine1,
        country: 'NG',
        status: v.status as any,
        isVerified: v.isVerified,
        tierId,
        totalSales: v.totalSales,
        totalOrders: v.totalOrders,
        averageRating: v.averageRating,
        reviewCount: v.reviewCount,
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: `${1000000000 + i}`,
        accountName: v.legalName,
        onboardingStep: v.status === 'APPROVED' ? 'COMPLETED' : 'REGISTERED',
        approvedAt: v.status === 'APPROVED' ? new Date() : null,
        verifiedAt: v.isVerified ? new Date() : null
      }
    })
    
    createdVendors.push(vendor)
  }
  
  console.log(`  ✅ ${createdVendors.length} vendors created`)
  return createdVendors
}

async function seedProductMappings(vendors: any[]) {
  console.log('📦 Seeding product mappings...')
  
  const approvedVendors = vendors.filter(v => v.status === 'APPROVED')
  let mappingCount = 0
  
  // Electronics vendor gets electronics products
  const electronicsVendor = approvedVendors.find(v => v.businessType === 'Electronics Retailer')
  if (electronicsVendor) {
    const electronicsProducts = DEMO_PRODUCTS.filter(p => p.category === 'Electronics')
    for (const prod of electronicsProducts) {
      await prisma.mvm_product_mapping.upsert({
        where: {
          vendorId_productId_variantId: {
            vendorId: electronicsVendor.id,
            productId: prod.id,
            variantId: ''
          }
        },
        update: {
          vendorPrice: prod.basePrice * 1.05, // 5% markup
          isActive: true,
          salesCount: Math.floor(Math.random() * 20) + 5,
          revenue: prod.basePrice * (Math.floor(Math.random() * 10) + 2)
        },
        create: {
          tenantId: DEMO_TENANT_ID,
          vendorId: electronicsVendor.id,
          productId: prod.id,
          vendorPrice: prod.basePrice * 1.05,
          isActive: true,
          isFeatured: prod.name.includes('iPhone'),
          salesCount: Math.floor(Math.random() * 20) + 5,
          revenue: prod.basePrice * (Math.floor(Math.random() * 10) + 2)
        }
      })
      mappingCount++
    }
  }
  
  // Fashion vendor gets fashion products
  const fashionVendor = approvedVendors.find(v => v.businessType === 'Fashion & Apparel')
  if (fashionVendor) {
    const fashionProducts = DEMO_PRODUCTS.filter(p => p.category === 'Fashion')
    for (const prod of fashionProducts) {
      await prisma.mvm_product_mapping.upsert({
        where: {
          vendorId_productId_variantId: {
            vendorId: fashionVendor.id,
            productId: prod.id,
            variantId: ''
          }
        },
        update: {
          vendorPrice: prod.basePrice,
          isActive: true
        },
        create: {
          tenantId: DEMO_TENANT_ID,
          vendorId: fashionVendor.id,
          productId: prod.id,
          vendorPrice: prod.basePrice,
          isActive: true,
          isFeatured: prod.name.includes('Aso-oke'),
          salesCount: Math.floor(Math.random() * 30) + 10,
          revenue: prod.basePrice * (Math.floor(Math.random() * 15) + 5)
        }
      })
      mappingCount++
    }
  }
  
  // Home vendor gets home products
  const homeVendor = approvedVendors.find(v => v.businessType === 'Home & Kitchen')
  if (homeVendor) {
    const homeProducts = DEMO_PRODUCTS.filter(p => p.category === 'Home')
    for (const prod of homeProducts) {
      await prisma.mvm_product_mapping.upsert({
        where: {
          vendorId_productId_variantId: {
            vendorId: homeVendor.id,
            productId: prod.id,
            variantId: ''
          }
        },
        update: {
          vendorPrice: prod.basePrice * 0.98, // Competitive pricing
          isActive: true
        },
        create: {
          tenantId: DEMO_TENANT_ID,
          vendorId: homeVendor.id,
          productId: prod.id,
          vendorPrice: prod.basePrice * 0.98,
          isActive: true,
          salesCount: Math.floor(Math.random() * 15) + 3,
          revenue: prod.basePrice * (Math.floor(Math.random() * 8) + 2)
        }
      })
      mappingCount++
    }
  }
  
  // Auto vendor gets auto products
  const autoVendor = approvedVendors.find(v => v.businessType === 'Automotive')
  if (autoVendor) {
    const autoProducts = DEMO_PRODUCTS.filter(p => p.category === 'Auto')
    for (const prod of autoProducts) {
      await prisma.mvm_product_mapping.upsert({
        where: {
          vendorId_productId_variantId: {
            vendorId: autoVendor.id,
            productId: prod.id,
            variantId: ''
          }
        },
        update: {
          vendorPrice: prod.basePrice * 1.1, // Premium for quality
          isActive: true
        },
        create: {
          tenantId: DEMO_TENANT_ID,
          vendorId: autoVendor.id,
          productId: prod.id,
          vendorPrice: prod.basePrice * 1.1,
          isActive: true,
          isFeatured: prod.name.includes('Battery'),
          salesCount: Math.floor(Math.random() * 40) + 15,
          revenue: prod.basePrice * (Math.floor(Math.random() * 20) + 8)
        }
      })
      mappingCount++
    }
  }
  
  console.log(`  ✅ ${mappingCount} product mappings created`)
}

async function seedSampleOrders(vendors: any[]) {
  console.log('🛒 Seeding sample orders...')
  
  const approvedVendors = vendors.filter(v => v.status === 'APPROVED')
  if (approvedVendors.length < 2) {
    console.log('  ⚠️ Not enough approved vendors for orders')
    return
  }
  
  // Sample Nigerian customers
  const customers = [
    { name: 'Akinwale Ogundimu', email: 'akinwale@gmail.com', phone: '+2348111111111', city: 'Ikeja', state: 'Lagos' },
    { name: 'Chidinma Eze', email: 'chidinma@yahoo.com', phone: '+2348222222222', city: 'Lekki', state: 'Lagos' },
    { name: 'Yusuf Ibrahim', email: 'yusuf@hotmail.com', phone: '+2348333333333', city: 'Victoria Island', state: 'Lagos' }
  ]
  
  // Create 3 sample orders
  for (let orderIndex = 0; orderIndex < 3; orderIndex++) {
    const customer = customers[orderIndex]
    const orderNumber = `MVM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEMO${orderIndex + 1}`
    
    // Pick 2 vendors for multi-vendor order
    const selectedVendors = approvedVendors.slice(0, 2)
    
    // Calculate order totals
    const items: any[] = []
    let subtotal = 0
    
    for (const vendor of selectedVendors) {
      // Get a product mapping for this vendor
      const mapping = await prisma.mvm_product_mapping.findFirst({
        where: { vendorId: vendor.id, isActive: true }
      })
      
      if (mapping) {
        const quantity = Math.floor(Math.random() * 2) + 1
        const unitPrice = mapping.vendorPrice?.toNumber() || 50000
        const lineTotal = unitPrice * quantity
        
        items.push({
          vendorId: vendor.id,
          productId: mapping.productId,
          productName: DEMO_PRODUCTS.find(p => p.id === mapping.productId)?.name || 'Product',
          quantity,
          unitPrice,
          lineTotal
        })
        
        subtotal += lineTotal
      }
    }
    
    if (items.length === 0) continue
    
    const taxTotal = Math.round(subtotal * 0.075 * 100) / 100
    const grandTotal = subtotal + taxTotal
    
    // Create parent order
    const parentOrder = await prisma.mvm_parent_order.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        orderNumber,
        customerId: `cust-${orderIndex + 1}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: customer.name,
        status: orderIndex === 0 ? 'COMPLETED' : orderIndex === 1 ? 'SPLIT' : 'PENDING',
        shippingAddress: {
          firstName: customer.name.split(' ')[0],
          lastName: customer.name.split(' ')[1],
          addressLine1: `${Math.floor(Math.random() * 100) + 1} Sample Street`,
          city: customer.city,
          state: customer.state,
          country: 'NG',
          phone: customer.phone
        },
        currency: 'NGN',
        subtotal,
        discountTotal: 0,
        shippingTotal: 2500,
        taxTotal,
        grandTotal: grandTotal + 2500,
        paymentMethod: orderIndex === 2 ? 'POD' : 'CARD',
        paymentStatus: orderIndex === 2 ? 'PENDING' : 'CAPTURED',
        paidAt: orderIndex === 2 ? null : new Date(),
        channel: 'WEB',
        splitAt: orderIndex !== 2 ? new Date() : null,
        completedAt: orderIndex === 0 ? new Date() : null
      }
    })
    
    // Create parent order items
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
    
    // Create sub-orders for each vendor
    let subOrderIndex = 0
    for (const item of items) {
      const vendor = selectedVendors.find(v => v.id === item.vendorId)
      const commissionRate = 15 // Default commission
      const commissionAmount = Math.round(item.lineTotal * (commissionRate / 100) * 100) / 100
      const vendorPayout = item.lineTotal - commissionAmount
      
      const subOrderNumber = `SUB-DEMO${orderIndex + 1}-V${String(subOrderIndex + 1).padStart(3, '0')}`
      
      const subOrderStatus = orderIndex === 0 ? 'DELIVERED' : orderIndex === 1 ? 'SHIPPED' : 'PENDING'
      
      const subOrder = await prisma.mvm_sub_order.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          parentOrderId: parentOrder.id,
          vendorId: item.vendorId,
          subOrderNumber,
          status: subOrderStatus,
          customerName: customer.name,
          shippingCity: customer.city,
          shippingState: customer.state,
          shippingCountry: 'NG',
          currency: 'NGN',
          subtotal: item.lineTotal,
          shippingTotal: 1250, // Split shipping
          taxTotal: Math.round(item.lineTotal * 0.075 * 100) / 100,
          discountTotal: 0,
          grandTotal: item.lineTotal + 1250 + Math.round(item.lineTotal * 0.075 * 100) / 100,
          commissionRate,
          commissionAmount,
          vendorPayout,
          confirmedAt: subOrderStatus !== 'PENDING' ? new Date() : null,
          shippedAt: subOrderStatus === 'SHIPPED' || subOrderStatus === 'DELIVERED' ? new Date() : null,
          deliveredAt: subOrderStatus === 'DELIVERED' ? new Date() : null,
          trackingNumber: subOrderStatus !== 'PENDING' ? `GIG${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null,
          shippingCarrier: subOrderStatus !== 'PENDING' ? 'GIG Logistics' : null
        }
      })
      
      // Create sub-order item
      await prisma.mvm_sub_order_item.create({
        data: {
          subOrderId: subOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
          tax: Math.round(item.lineTotal * 0.075 * 100) / 100,
          lineTotal: item.lineTotal,
          fulfilledQuantity: subOrderStatus === 'DELIVERED' ? item.quantity : 0
        }
      })
      
      // Create commission for delivered orders
      if (subOrderStatus === 'DELIVERED') {
        await prisma.mvm_commission.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            subOrderId: subOrder.id,
            vendorId: item.vendorId,
            saleAmount: item.lineTotal,
            vatAmount: Math.round(item.lineTotal * 0.075 * 100) / 100,
            commissionRate,
            commissionAmount,
            vendorPayout,
            status: 'CLEARED',
            clearsAt: new Date(),
            clearedAt: new Date()
          }
        })
      }
      
      subOrderIndex++
    }
  }
  
  console.log('  ✅ 3 sample orders created')
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🇳🇬 Starting Lagos Digital Market Demo Seeder\n')
  console.log('=' .repeat(50))
  
  try {
    await seedMarketplaceConfig()
    await seedTiers()
    const vendors = await seedVendors()
    await seedProductMappings(vendors)
    await seedSampleOrders(vendors)
    
    console.log('\n' + '=' .repeat(50))
    console.log('✅ Demo data seeded successfully!')
    console.log('\n📊 Summary:')
    console.log('   - Marketplace: Lagos Digital Market')
    console.log('   - 4 Tiers: Bronze → Silver → Gold → Platinum')
    console.log('   - 6 Vendors (4 approved, 1 pending, 1 suspended)')
    console.log('   - 12 Product mappings')
    console.log('   - 3 Sample orders')
    console.log('\n🔑 Test credentials:')
    console.log('   - Tenant ID: demo-tenant-001')
    console.log('   - Vendor emails: adebayo@lagosdm.ng, nkechi@lagosdm.ng, etc.')
    
  } catch (error) {
    console.error('❌ Seeder error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
