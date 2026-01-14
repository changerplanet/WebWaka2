/**
 * Demo Seed Script — LOGISTICS FULL DEMO
 * 
 * Creates comprehensive demo data for demo-logistics tenant with Nigerian context:
 * - 15 logistics shipments (delivery assignments)
 * - 12 delivery assignments linked to agents
 * - Delivery status history records showing progression
 * 
 * Prerequisites: Run seed-logistics-demo.ts first for zones and agents
 * 
 * Run: npx tsx scripts/seed-logistics-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-logistics'

const LAGOS_ADDRESSES = [
  { area: 'Lekki Phase 1', address: '15 Admiralty Way, Lekki Phase 1', landmark: 'Opposite Filmhouse Cinema' },
  { area: 'Lekki', address: '42 Freedom Way, Lekki', landmark: 'Near Domino\'s Pizza' },
  { area: 'Victoria Island', address: '23 Kofo Abayomi Street, Victoria Island', landmark: 'Behind Eko Hotel' },
  { area: 'Victoria Island', address: '8 Adeola Odeku Street, Victoria Island', landmark: 'Sterling Bank Building' },
  { area: 'Ikeja', address: '67 Allen Avenue, Ikeja', landmark: 'Opposite Ikeja City Mall' },
  { area: 'Ikeja GRA', address: '12 Joel Ogunnaike Street, Ikeja GRA', landmark: 'Near Computer Village' },
  { area: 'Apapa', address: '34 Wharf Road, Apapa', landmark: 'Close to Nigerian Ports Authority' },
  { area: 'Apapa', address: '18 Creek Road, Apapa', landmark: 'Behind Flour Mills' },
  { area: 'Surulere', address: '45 Adeniran Ogunsanya Street, Surulere', landmark: 'Near National Stadium' },
  { area: 'Surulere', address: '22 Bode Thomas Street, Surulere', landmark: 'Opposite Shoprite' },
  { area: 'Yaba', address: '9 Commercial Avenue, Yaba', landmark: 'Near University of Lagos' },
  { area: 'Ikoyi', address: '78 Awolowo Road, Ikoyi', landmark: 'Beside Falomo Shopping Centre' },
  { area: 'Lagos Island', address: '56 Broad Street, Lagos Island', landmark: 'Near CMS Bus Stop' },
  { area: 'Mainland', address: '31 Ikorodu Road, Maryland', landmark: 'Close to Anthony Village' },
  { area: 'Ajah', address: '44 Lekki-Epe Expressway, Ajah', landmark: 'After Chevron Roundabout' },
]

const PICKUP_LOCATIONS = [
  { name: 'SwiftLogistics Warehouse - Lekki', address: '1 Fola Osibo Street, Lekki Phase 1', lat: 6.4414, lng: 3.4574 },
  { name: 'SwiftLogistics Hub - Ikeja', address: '25 Toyin Street, Ikeja', lat: 6.6018, lng: 3.3515 },
  { name: 'SwiftLogistics Depot - Apapa', address: '10 Warehouse Road, Apapa', lat: 6.4500, lng: 3.3640 },
]

const NIGERIAN_NAMES = [
  { firstName: 'Chioma', lastName: 'Okonkwo' },
  { firstName: 'Oluwaseun', lastName: 'Adeyemi' },
  { firstName: 'Fatima', lastName: 'Bello' },
  { firstName: 'Chinedu', lastName: 'Nnamdi' },
  { firstName: 'Aisha', lastName: 'Mohammed' },
  { firstName: 'Emeka', lastName: 'Ugwu' },
  { firstName: 'Ngozi', lastName: 'Eze' },
  { firstName: 'Tunde', lastName: 'Olawale' },
  { firstName: 'Amina', lastName: 'Yusuf' },
  { firstName: 'Obiora', lastName: 'Chukwu' },
  { firstName: 'Funke', lastName: 'Akindele' },
  { firstName: 'Ibrahim', lastName: 'Musa' },
  { firstName: 'Adaeze', lastName: 'Okoro' },
  { firstName: 'Segun', lastName: 'Oladipo' },
  { firstName: 'Hauwa', lastName: 'Aliyu' },
]

type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'PICKING_UP' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVING' | 'DELIVERED' | 'FAILED'
type DeliveryPriority = 'STANDARD' | 'EXPRESS' | 'SAME_DAY'

interface ShipmentData {
  trackingNumber: string
  status: DeliveryStatus
  priority: DeliveryPriority
  hasAgent: boolean
  customerIndex: number
  deliveryIndex: number
  pickupIndex: number
  statusProgression: DeliveryStatus[]
}

const SHIPMENTS: ShipmentData[] = [
  { trackingNumber: 'SWL-2026-0001', status: 'DELIVERED', priority: 'STANDARD', hasAgent: true, customerIndex: 0, deliveryIndex: 0, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'PICKING_UP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED'] },
  { trackingNumber: 'SWL-2026-0002', status: 'DELIVERED', priority: 'EXPRESS', hasAgent: true, customerIndex: 1, deliveryIndex: 1, pickupIndex: 1, statusProgression: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] },
  { trackingNumber: 'SWL-2026-0003', status: 'IN_TRANSIT', priority: 'STANDARD', hasAgent: true, customerIndex: 2, deliveryIndex: 2, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] },
  { trackingNumber: 'SWL-2026-0004', status: 'PICKED_UP', priority: 'SAME_DAY', hasAgent: true, customerIndex: 3, deliveryIndex: 3, pickupIndex: 1, statusProgression: ['PENDING', 'ASSIGNED', 'PICKING_UP', 'PICKED_UP'] },
  { trackingNumber: 'SWL-2026-0005', status: 'ARRIVING', priority: 'EXPRESS', hasAgent: true, customerIndex: 4, deliveryIndex: 4, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING'] },
  { trackingNumber: 'SWL-2026-0006', status: 'ASSIGNED', priority: 'STANDARD', hasAgent: true, customerIndex: 5, deliveryIndex: 5, pickupIndex: 2, statusProgression: ['PENDING', 'ASSIGNED'] },
  { trackingNumber: 'SWL-2026-0007', status: 'PENDING', priority: 'STANDARD', hasAgent: false, customerIndex: 6, deliveryIndex: 6, pickupIndex: 0, statusProgression: ['PENDING'] },
  { trackingNumber: 'SWL-2026-0008', status: 'DELIVERED', priority: 'STANDARD', hasAgent: true, customerIndex: 7, deliveryIndex: 7, pickupIndex: 1, statusProgression: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] },
  { trackingNumber: 'SWL-2026-0009', status: 'IN_TRANSIT', priority: 'EXPRESS', hasAgent: true, customerIndex: 8, deliveryIndex: 8, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] },
  { trackingNumber: 'SWL-2026-0010', status: 'FAILED', priority: 'STANDARD', hasAgent: true, customerIndex: 9, deliveryIndex: 9, pickupIndex: 2, statusProgression: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'FAILED'] },
  { trackingNumber: 'SWL-2026-0011', status: 'PENDING', priority: 'SAME_DAY', hasAgent: false, customerIndex: 10, deliveryIndex: 10, pickupIndex: 1, statusProgression: ['PENDING'] },
  { trackingNumber: 'SWL-2026-0012', status: 'ACCEPTED', priority: 'STANDARD', hasAgent: true, customerIndex: 11, deliveryIndex: 11, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'ACCEPTED'] },
  { trackingNumber: 'SWL-2026-0013', status: 'DELIVERED', priority: 'EXPRESS', hasAgent: true, customerIndex: 12, deliveryIndex: 12, pickupIndex: 1, statusProgression: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] },
  { trackingNumber: 'SWL-2026-0014', status: 'PENDING', priority: 'STANDARD', hasAgent: false, customerIndex: 13, deliveryIndex: 13, pickupIndex: 2, statusProgression: ['PENDING'] },
  { trackingNumber: 'SWL-2026-0015', status: 'PICKING_UP', priority: 'STANDARD', hasAgent: true, customerIndex: 14, deliveryIndex: 14, pickupIndex: 0, statusProgression: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'PICKING_UP'] },
]

function generateNigerianPhone(): string {
  const prefixes = ['0803', '0805', '0806', '0807', '0808', '0809', '0810', '0813', '0814', '0816']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 9000000 + 1000000).toString()
  return `${prefix}${suffix}`
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getRandomFee(priority: DeliveryPriority): number {
  const baseFees = { STANDARD: 1500, EXPRESS: 2500, SAME_DAY: 3500 }
  const base = baseFees[priority]
  return base + Math.floor(Math.random() * 1000)
}

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

async function getExistingAgents(tenantId: string) {
  const agents = await prisma.logistics_delivery_agents.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { id: true }
  })
  
  if (agents.length === 0) {
    console.warn('  WARNING: No active agents found. Run seed-logistics-demo.ts first.')
  }
  
  return agents.map(a => a.id)
}

async function getExistingZones(tenantId: string) {
  const zones = await prisma.logistics_delivery_zones.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: { id: true, code: true }
  })
  
  if (zones.length === 0) {
    console.warn('  WARNING: No active zones found. Run seed-logistics-demo.ts first.')
  }
  
  return zones
}

async function seedDeliveryAssignments(tenantId: string, agentIds: string[], zones: { id: string; code: string | null }[]) {
  console.log('Creating delivery assignments (shipments)...')
  
  let agentIndex = 0
  const createdAssignments: { id: string; shipment: ShipmentData }[] = []
  
  for (const shipment of SHIPMENTS) {
    const assignmentId = `${tenantId}-shipment-${shipment.trackingNumber}`
    
    const existing = await prisma.logistics_delivery_assignments.findFirst({
      where: { id: assignmentId }
    })
    
    if (!existing) {
      const customer = NIGERIAN_NAMES[shipment.customerIndex]
      const deliveryAddr = LAGOS_ADDRESSES[shipment.deliveryIndex]
      const pickupLoc = PICKUP_LOCATIONS[shipment.pickupIndex]
      const zone = zones[Math.floor(Math.random() * zones.length)]
      
      let agentId: string | null = null
      if (shipment.hasAgent && agentIds.length > 0) {
        agentId = agentIds[agentIndex % agentIds.length]
        agentIndex++
      }
      
      const fee = getRandomFee(shipment.priority)
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      
      await prisma.logistics_delivery_assignments.create({
        data: {
          id: assignmentId,
          tenantId,
          orderId: `ORD-${shipment.trackingNumber.replace('SWL-', '')}`,
          orderType: 'E_COMMERCE',
          orderNumber: shipment.trackingNumber,
          customerId: `CUST-${shipment.customerIndex.toString().padStart(4, '0')}`,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerPhone: generateNigerianPhone(),
          zoneId: zone?.id || null,
          agentId,
          deliveryAddress: {
            street: deliveryAddr.address,
            area: deliveryAddr.area,
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
            landmark: deliveryAddr.landmark,
          },
          deliveryLatitude: 6.4 + Math.random() * 0.3,
          deliveryLongitude: 3.3 + Math.random() * 0.2,
          pickupAddress: {
            name: pickupLoc.name,
            street: pickupLoc.address,
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
          },
          pickupLatitude: pickupLoc.lat,
          pickupLongitude: pickupLoc.lng,
          status: shipment.status,
          priority: shipment.priority,
          estimatedFee: fee,
          actualFee: shipment.status === 'DELIVERED' ? fee : null,
          currency: 'NGN',
          estimatedDistanceKm: 5 + Math.random() * 20,
          estimatedDurationMin: 20 + Math.floor(Math.random() * 40),
          scheduledPickupAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          scheduledDeliveryAt: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000),
          actualPickupAt: ['PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED', 'FAILED'].includes(shipment.status)
            ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000)
            : null,
          actualDeliveryAt: shipment.status === 'DELIVERED'
            ? new Date(createdAt.getTime() + 5 * 60 * 60 * 1000)
            : null,
          specialInstructions: deliveryAddr.landmark ? `Landmark: ${deliveryAddr.landmark}` : null,
          contactOnArrival: true,
          packageCount: Math.floor(Math.random() * 3) + 1,
          totalWeight: 0.5 + Math.random() * 10,
          failureReason: shipment.status === 'FAILED' ? 'Customer not available at delivery location' : null,
          failureCode: shipment.status === 'FAILED' ? 'CUSTOMER_UNAVAILABLE' : null,
          failedAttempts: shipment.status === 'FAILED' ? 2 : 0,
          customerRating: shipment.status === 'DELIVERED' ? Math.floor(Math.random() * 2) + 4 : null,
          assignedAt: agentId ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null,
          autoAssigned: false,
          createdAt,
          updatedAt: new Date(),
        }
      })
      console.log(`  Created shipment: ${shipment.trackingNumber} (${shipment.status})`)
      createdAssignments.push({ id: assignmentId, shipment })
    } else {
      console.log(`  Shipment exists: ${shipment.trackingNumber}`)
      createdAssignments.push({ id: assignmentId, shipment })
    }
  }
  
  return createdAssignments
}

async function seedStatusHistory(assignments: { id: string; shipment: ShipmentData }[]) {
  console.log('Creating delivery status history...')
  
  let historyCount = 0
  
  for (const { id: assignmentId, shipment } of assignments) {
    let previousStatus: DeliveryStatus | null = null
    let timestamp = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + Math.random() * 6 * 24 * 60 * 60 * 1000)
    
    for (const status of shipment.statusProgression) {
      const historyId = `${assignmentId}-history-${status}`
      
      const existing = await prisma.logistics_delivery_status_history.findFirst({
        where: { id: historyId }
      })
      
      if (!existing) {
        await prisma.logistics_delivery_status_history.create({
          data: {
            id: historyId,
            assignmentId,
            fromStatus: previousStatus,
            toStatus: status,
            latitude: 6.4 + Math.random() * 0.3,
            longitude: 3.3 + Math.random() * 0.2,
            address: status === 'DELIVERED' ? LAGOS_ADDRESSES[shipment.deliveryIndex].address : null,
            changedBy: status === 'PENDING' ? 'SYSTEM' : `agent-${Math.floor(Math.random() * 6) + 1}`,
            changedByType: status === 'PENDING' ? 'SYSTEM' : 'AGENT',
            notes: getStatusNote(status),
            recordedAt: timestamp,
            createdAt: timestamp,
          }
        })
        historyCount++
      }
      
      previousStatus = status
      timestamp = new Date(timestamp.getTime() + (30 + Math.random() * 60) * 60 * 1000)
    }
  }
  
  console.log(`  Created ${historyCount} status history records`)
}

function getStatusNote(status: DeliveryStatus): string | null {
  const notes: Record<DeliveryStatus, string | null> = {
    PENDING: 'Order received and awaiting assignment',
    ASSIGNED: 'Delivery agent assigned',
    ACCEPTED: 'Agent accepted the delivery job',
    PICKING_UP: 'Agent en route to pickup location',
    PICKED_UP: 'Package collected from pickup location',
    IN_TRANSIT: 'Package in transit to delivery address',
    ARRIVING: 'Agent approaching delivery location',
    DELIVERED: 'Package delivered successfully',
    FAILED: 'Delivery attempt failed - customer unavailable',
  }
  return notes[status] || null
}

async function main() {
  console.log('='.repeat(60))
  console.log('LOGISTICS FULL DEMO SEEDER')
  console.log('Nigerian Context - Lagos Delivery Service')
  console.log('='.repeat(60))
  
  try {
    const tenant = await verifyDemoTenant()
    
    const agentIds = await getExistingAgents(tenant.id)
    console.log(`  Found ${agentIds.length} active agents`)
    
    const zones = await getExistingZones(tenant.id)
    console.log(`  Found ${zones.length} active zones`)
    
    const assignments = await seedDeliveryAssignments(tenant.id, agentIds, zones)
    
    await seedStatusHistory(assignments)
    
    const assignedCount = SHIPMENTS.filter(s => s.hasAgent).length
    const totalProgressionRecords = SHIPMENTS.reduce((sum, s) => sum + s.statusProgression.length, 0)
    
    console.log('='.repeat(60))
    console.log('LOGISTICS FULL DEMO SEEDING COMPLETE')
    console.log(`  Shipments: ${SHIPMENTS.length}`)
    console.log(`  With Agents: ${assignedCount}`)
    console.log(`  Status History Records: ~${totalProgressionRecords}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
