/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Logistics Suite - Nigerian Delivery Service Demo Data Seeder
 * 
 * Creates demo data for a Nigerian logistics/delivery company:
 * - Configuration
 * - Delivery zones (Lagos areas)
 * - Delivery agents
 * 
 * Run: npx tsx scripts/seed-logistics-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-logistics'

// =============================================================================
// DELIVERY ZONES (Lagos Areas)
// =============================================================================

const ZONES = [
  { id: 'zone-vi', name: 'Victoria Island', code: 'VI', city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa', zoneType: 'LGA' },
  { id: 'zone-ikoyi', name: 'Ikoyi', code: 'IKY', city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa', zoneType: 'LGA' },
  { id: 'zone-lekki', name: 'Lekki Phase 1', code: 'LK1', city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa', zoneType: 'LGA' },
  { id: 'zone-ikeja', name: 'Ikeja', code: 'IKJ', city: 'Lagos', state: 'Lagos', lga: 'Ikeja', zoneType: 'CITY' },
  { id: 'zone-surulere', name: 'Surulere', code: 'SRL', city: 'Lagos', state: 'Lagos', lga: 'Surulere', zoneType: 'CITY' },
  { id: 'zone-yaba', name: 'Yaba', code: 'YBA', city: 'Lagos', state: 'Lagos', lga: 'Yaba', zoneType: 'LGA' },
  { id: 'zone-mainland', name: 'Lagos Mainland', code: 'MLD', city: 'Lagos', state: 'Lagos', lga: 'Lagos Mainland', zoneType: 'CITY' },
  { id: 'zone-island', name: 'Lagos Island', code: 'ISL', city: 'Lagos', state: 'Lagos', lga: 'Lagos Island', zoneType: 'CITY' },
]

// =============================================================================
// DELIVERY AGENTS (Nigerian Dispatch Riders)
// =============================================================================

const AGENTS = [
  { id: 'agent-001', firstName: 'Chukwudi', lastName: 'Eze', phone: '08111222333', email: 'chukwudi.eze@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-123-XY', status: 'ACTIVE', availability: 'AVAILABLE' },
  { id: 'agent-002', firstName: 'Tunde', lastName: 'Bakare', phone: '08222333444', email: 'tunde.bakare@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-234-AB', status: 'ACTIVE', availability: 'AVAILABLE' },
  { id: 'agent-003', firstName: 'Musa', lastName: 'Ibrahim', phone: '08333444555', email: 'musa.ibrahim@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-345-CD', status: 'ACTIVE', availability: 'ON_DELIVERY' },
  { id: 'agent-004', firstName: 'Emeka', lastName: 'Okafor', phone: '08444555666', email: 'emeka.okafor@swiftdelivery.ng', vehicleType: 'VAN', vehiclePlate: 'LAG-456-EF', status: 'ACTIVE', availability: 'AVAILABLE' },
  { id: 'agent-005', firstName: 'Yusuf', lastName: 'Garba', phone: '08555666777', email: 'yusuf.garba@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-567-GH', status: 'ACTIVE', availability: 'OFFLINE' },
  { id: 'agent-006', firstName: 'Adebayo', lastName: 'Ojo', phone: '08666777888', email: 'adebayo.ojo@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-678-IJ', status: 'ACTIVE', availability: 'AVAILABLE' },
  { id: 'agent-007', firstName: 'Chidera', lastName: 'Nwosu', phone: '08777888999', email: 'chidera.nwosu@swiftdelivery.ng', vehicleType: 'BICYCLE', vehiclePlate: 'N/A', status: 'ACTIVE', availability: 'AVAILABLE' },
  { id: 'agent-008', firstName: 'Abdullahi', lastName: 'Sani', phone: '08888999000', email: 'abdullahi.sani@swiftdelivery.ng', vehicleType: 'MOTORCYCLE', vehiclePlate: 'LAG-789-KL', status: 'SUSPENDED', availability: 'OFFLINE' },
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

async function seedConfig(tenantId: string) {
  console.log('Creating logistics configuration...')
  
  const existing = await prisma.logistics_configurations.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.logistics_configurations.create({
      data: {
        id: `${tenantId}-config`,
        tenantId,
        deliveryEnabled: true,
        autoAssignmentEnabled: false,
        realTimeTrackingEnabled: true,
        proofOfDeliveryRequired: true,
        defaultPriority: 'STANDARD',
        defaultCurrency: 'NGN',
        photoProofRequired: true,
        signatureProofRequired: false,
        pinVerificationEnabled: false,
        otpVerificationEnabled: true,
        assignmentAlgorithm: 'NEAREST',
        maxConcurrentDeliveries: 5,
        defaultDeliveryWindowHours: 4,
        expressDeliveryWindowHours: 2,
        sameDayDeliveryWindowHours: 6,
        maxDeliveryAttempts: 3,
        retryDelayHours: 24,
        notifyCustomerOnAssignment: true,
        notifyCustomerOnPickup: true,
        notifyCustomerOnTransit: true,
        notifyCustomerOnArrival: true,
        notifyCustomerOnDelivery: true,
        notifyCustomerOnFailure: true,
        supportInformalAddresses: true,
        landmarkRequired: true,
        updatedAt: new Date(),
      }
    })
    console.log('  Created logistics configuration')
  } else {
    console.log('  Config exists')
  }
}

async function seedZones(tenantId: string) {
  console.log('Creating delivery zones...')
  
  for (const zone of ZONES) {
    const zoneId = `${tenantId}-${zone.id}`
    
    const existing = await prisma.logistics_delivery_zones.findFirst({
      where: { id: zoneId }
    })
    
    if (!existing) {
      await prisma.logistics_delivery_zones.create({
        data: {
          id: zoneId,
          tenantId,
          name: zone.name,
          code: zone.code,
          description: `${zone.name} delivery zone`,
          zoneType: zone.zoneType as any,
          city: zone.city,
          state: zone.state,
          lga: zone.lga,
          status: 'ACTIVE',
          updatedAt: new Date(),
        }
      })
      console.log(`  Created zone: ${zone.name}`)
    } else {
      console.log(`  Zone exists: ${zone.name}`)
    }
  }
}

async function seedAgents(tenantId: string) {
  console.log('Creating delivery agents...')
  
  for (const agent of AGENTS) {
    const agentId = `${tenantId}-${agent.id}`
    
    const existing = await prisma.logistics_delivery_agents.findFirst({
      where: { id: agentId }
    })
    
    if (!existing) {
      await prisma.logistics_delivery_agents.create({
        data: {
          id: agentId,
          tenantId,
          firstName: agent.firstName,
          lastName: agent.lastName,
          phone: agent.phone,
          email: agent.email,
          vehicleType: agent.vehicleType,
          vehiclePlate: agent.vehiclePlate,
          status: agent.status as any,
          availability: agent.availability as any,
          agentType: 'IN_HOUSE',
          totalDeliveries: Math.floor(Math.random() * 200) + 50,
          completedDeliveries: Math.floor(Math.random() * 180) + 45,
          failedDeliveries: Math.floor(Math.random() * 10),
          averageRating: 4.2 + Math.random() * 0.6,
          totalRatings: Math.floor(Math.random() * 100) + 20,
          updatedAt: new Date(),
        }
      })
      console.log(`  Created agent: ${agent.firstName} ${agent.lastName}`)
    } else {
      console.log(`  Agent exists: ${agent.firstName} ${agent.lastName}`)
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
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    
    // Step 3: Seed operational data
    await seedZones(tenant.id)
    await seedAgents(tenant.id)
    
    console.log('='.repeat(60))
    console.log('LOGISTICS DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Zones: ${ZONES.length}`)
    console.log(`  Agents: ${AGENTS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
