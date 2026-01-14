/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Logistics Suite - Nigerian Delivery Service Demo Data Seeder
 * 
 * Creates demo data for a Nigerian logistics company:
 * - Delivery zones (Lagos areas)
 * - Delivery agents (riders)
 * - Pricing rules
 * - Delivery assignments
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-logistics-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-logistics'

// =============================================================================
// DELIVERY ZONES (Lagos Areas)
// =============================================================================

const ZONES = [
  { id: 'zone-001', name: 'Lagos Island', code: 'LI', coverage: ['Lagos Island', 'Ikoyi', 'Victoria Island'], basePrice: 1500, pricePerKm: 150 },
  { id: 'zone-002', name: 'Lekki', code: 'LK', coverage: ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Sangotedo'], basePrice: 2000, pricePerKm: 180 },
  { id: 'zone-003', name: 'Ikeja', code: 'IK', coverage: ['Ikeja', 'Alausa', 'Maryland', 'Ogba'], basePrice: 1500, pricePerKm: 150 },
  { id: 'zone-004', name: 'Surulere', code: 'SR', coverage: ['Surulere', 'Yaba', 'Ebute Metta'], basePrice: 1200, pricePerKm: 120 },
  { id: 'zone-005', name: 'Apapa', code: 'AP', coverage: ['Apapa', 'Ajegunle', 'Ijora'], basePrice: 1500, pricePerKm: 150 },
  { id: 'zone-006', name: 'Mainland North', code: 'MN', coverage: ['Agege', 'Ifako', 'Ojodu', 'Berger'], basePrice: 1800, pricePerKm: 160 },
  { id: 'zone-007', name: 'Mainland East', code: 'ME', coverage: ['Ketu', 'Ojota', 'Ikorodu'], basePrice: 2000, pricePerKm: 180 },
  { id: 'zone-008', name: 'Festac/Satellite', code: 'FS', coverage: ['Festac', 'Satellite Town', 'Ojo'], basePrice: 2500, pricePerKm: 200 },
]

// =============================================================================
// DELIVERY AGENTS (Nigerian Riders)
// =============================================================================

const AGENTS = [
  { id: 'agent-001', name: 'Adebayo Olumide', phone: '08011112222', email: 'adebayo.o@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-123-AB', zoneIds: ['zone-001', 'zone-002'], status: 'AVAILABLE', rating: 4.8 },
  { id: 'agent-002', name: 'Chukwuemeka Nnamdi', phone: '08022223333', email: 'chukwuemeka.n@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-456-CD', zoneIds: ['zone-003', 'zone-004'], status: 'ON_DELIVERY', rating: 4.7 },
  { id: 'agent-003', name: 'Musa Ibrahim', phone: '08033334444', email: 'musa.i@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-789-EF', zoneIds: ['zone-001', 'zone-003'], status: 'AVAILABLE', rating: 4.9 },
  { id: 'agent-004', name: 'Oluwaseun Adeyemi', phone: '08044445555', email: 'seun.a@swiftlogistics.ng', vehicleType: 'VAN', plateNumber: 'LAG-101-GH', zoneIds: ['zone-005', 'zone-006'], status: 'AVAILABLE', rating: 4.6 },
  { id: 'agent-005', name: 'Tunde Bakare', phone: '08055556666', email: 'tunde.b@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-202-IJ', zoneIds: ['zone-002', 'zone-007'], status: 'OFF_DUTY', rating: 4.5 },
  { id: 'agent-006', name: 'Abdullahi Yusuf', phone: '08066667777', email: 'abdullahi.y@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-303-KL', zoneIds: ['zone-004', 'zone-005'], status: 'AVAILABLE', rating: 4.8 },
  { id: 'agent-007', name: 'Emeka Okafor', phone: '08077778888', email: 'emeka.o@swiftlogistics.ng', vehicleType: 'VAN', plateNumber: 'LAG-404-MN', zoneIds: ['zone-007', 'zone-008'], status: 'ON_DELIVERY', rating: 4.7 },
  { id: 'agent-008', name: 'Blessing Ndu', phone: '08088889999', email: 'blessing.n@swiftlogistics.ng', vehicleType: 'MOTORCYCLE', plateNumber: 'LAG-505-OP', zoneIds: ['zone-001', 'zone-004'], status: 'AVAILABLE', rating: 4.9 },
]

// =============================================================================
// PRICING RULES
// =============================================================================

const PRICING_RULES = [
  { id: 'price-001', name: 'Standard Delivery', type: 'STANDARD', basePrice: 1500, pricePerKm: 150, estimatedTime: '2-4 hours' },
  { id: 'price-002', name: 'Express Delivery', type: 'EXPRESS', basePrice: 3000, pricePerKm: 250, estimatedTime: '1-2 hours' },
  { id: 'price-003', name: 'Same Day Delivery', type: 'SAME_DAY', basePrice: 2000, pricePerKm: 180, estimatedTime: '4-8 hours' },
  { id: 'price-004', name: 'Next Day Delivery', type: 'NEXT_DAY', basePrice: 1200, pricePerKm: 120, estimatedTime: '24 hours' },
  { id: 'price-005', name: 'Bulk Delivery (Van)', type: 'BULK', basePrice: 5000, pricePerKm: 350, estimatedTime: '4-6 hours' },
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

async function seedConfig(tenantId: string) {
  console.log('Creating logistics configuration...')
  
  const existing = await prisma.logistics_configurations.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.logistics_configurations.create({
      data: {
        tenantId,
        currency: 'NGN',
        defaultVehicleType: 'MOTORCYCLE',
        operatingHoursStart: '07:00',
        operatingHoursEnd: '21:00',
        maxDeliveriesPerAgent: 10,
        autoAssignEnabled: true,
      }
    })
    console.log('  Created logistics configuration')
  }
}

async function seedZones(tenantId: string) {
  console.log('Creating delivery zones...')
  
  for (const zone of ZONES) {
    const existing = await prisma.logistics_delivery_zones.findFirst({
      where: { tenantId, code: zone.code }
    })
    
    if (!existing) {
      await prisma.logistics_delivery_zones.create({
        data: {
          id: `${tenantId}-${zone.id}`,
          tenantId,
          name: zone.name,
          code: zone.code,
          coverage: zone.coverage,
          basePrice: zone.basePrice,
          pricePerKm: zone.pricePerKm,
          currency: 'NGN',
          isActive: true,
        }
      })
      console.log(`  Created zone: ${zone.name} (${zone.code})`)
    }
  }
}

async function seedAgents(tenantId: string) {
  console.log('Creating delivery agents...')
  
  for (const agent of AGENTS) {
    const existing = await prisma.logistics_delivery_agents.findFirst({
      where: { tenantId, email: agent.email }
    })
    
    if (!existing) {
      await prisma.logistics_delivery_agents.create({
        data: {
          id: `${tenantId}-${agent.id}`,
          tenantId,
          name: agent.name,
          phone: agent.phone,
          email: agent.email,
          vehicleType: agent.vehicleType,
          plateNumber: agent.plateNumber,
          zoneIds: agent.zoneIds.map(z => `${tenantId}-${z}`),
          status: agent.status,
          rating: agent.rating,
          totalDeliveries: Math.floor(Math.random() * 500) + 100,
          isActive: true,
        }
      })
      console.log(`  Created agent: ${agent.name} (${agent.vehicleType})`)
    }
  }
}

async function seedPricingRules(tenantId: string) {
  console.log('Creating pricing rules...')
  
  for (const rule of PRICING_RULES) {
    const existing = await prisma.logistics_delivery_pricing_rules.findFirst({
      where: { tenantId, name: rule.name }
    })
    
    if (!existing) {
      await prisma.logistics_delivery_pricing_rules.create({
        data: {
          id: `${tenantId}-${rule.id}`,
          tenantId,
          name: rule.name,
          type: rule.type,
          basePrice: rule.basePrice,
          pricePerKm: rule.pricePerKm,
          currency: 'NGN',
          estimatedTime: rule.estimatedTime,
          isActive: true,
        }
      })
      console.log(`  Created pricing rule: ${rule.name} - ₦${rule.basePrice}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('LOGISTICS SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Delivery Service')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    
    // Step 3: Seed operational data
    await seedZones(tenant.id)
    await seedAgents(tenant.id)
    await seedPricingRules(tenant.id)
    
    console.log('='.repeat(60))
    console.log('LOGISTICS DEMO SEEDING COMPLETE')
    console.log(`  Zones: ${ZONES.length}`)
    console.log(`  Agents: ${AGENTS.length}`)
    console.log(`  Pricing Rules: ${PRICING_RULES.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
