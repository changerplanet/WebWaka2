/**
 * ADVANCED WAREHOUSE SUITE — Demo Data Seeder
 * Phase 7C.3, S5 Demo Data
 * 
 * Seeds Nigerian warehouse operations data for demo purposes.
 * Run with: npx ts-node scripts/seed-advanced-warehouse-demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo tenant ID - replace with actual tenant from your demo environment
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID || 'demo-wh-tenant';
const DEMO_INSTANCE_ID = process.env.DEMO_INSTANCE_ID || 'demo-wh-instance';

// Nigerian warehouse locations
const WAREHOUSE_LOCATIONS = [
  { name: 'Lagos Main Warehouse', code: 'WH-LAGOS-01', location: 'Victoria Island, Lagos', type: 'DISTRIBUTION' },
  { name: 'Ibadan Regional Depot', code: 'WH-IBD-01', location: 'Dugbe, Ibadan', type: 'REGIONAL' },
  { name: 'Abuja Distribution Center', code: 'WH-ABJ-01', location: 'Garki, Abuja', type: 'DISTRIBUTION' },
  { name: 'Port Harcourt Depot', code: 'WH-PH-01', location: 'Trans Amadi, Port Harcourt', type: 'REGIONAL' },
];

// Zone configurations
const ZONE_TYPES = [
  { type: 'RECEIVING', prefix: 'RCV', description: 'Goods receiving and unloading area' },
  { type: 'STORAGE', prefix: 'STG', description: 'Main storage area' },
  { type: 'PICKING', prefix: 'PCK', description: 'Order picking zone' },
  { type: 'SHIPPING', prefix: 'SHP', description: 'Shipping and dispatch dock' },
  { type: 'QUARANTINE', prefix: 'QTN', description: 'Inspection and quarantine area' },
  { type: 'COLD', prefix: 'CLD', description: 'Temperature-controlled storage' },
];

// Nigerian pharmaceutical and FMCG products
const PRODUCTS = [
  { name: 'Paracetamol 500mg Tablets', sku: 'PARA-500-100', category: 'Pharma', unitCost: 25 },
  { name: 'Amoxicillin Capsules 500mg', sku: 'AMOX-500-50', category: 'Pharma', unitCost: 85 },
  { name: 'Vitamin C 1000mg Tablets', sku: 'VITC-1000-60', category: 'Pharma', unitCost: 45 },
  { name: 'Oral Rehydration Salts (ORS)', sku: 'ORS-20G-50', category: 'Pharma', unitCost: 120 },
  { name: 'Ibuprofen 400mg Tablets', sku: 'IBU-400-100', category: 'Pharma', unitCost: 35 },
  { name: 'Insulin Vials 100IU/ml', sku: 'INS-100-10', category: 'Cold Chain', unitCost: 8500 },
  { name: 'Metformin 500mg Tablets', sku: 'MET-500-100', category: 'Pharma', unitCost: 30 },
  { name: 'Artemether-Lumefantrine Tabs', sku: 'ART-LUM-24', category: 'Pharma', unitCost: 450 },
  { name: 'Hand Sanitizer 500ml', sku: 'SAN-500-1', category: 'Hygiene', unitCost: 650 },
  { name: 'Disposable Face Masks (50pc)', sku: 'MASK-50-1', category: 'PPE', unitCost: 1500 },
  { name: 'Nitrile Gloves Box (100pc)', sku: 'GLOVE-100-M', category: 'PPE', unitCost: 2500 },
  { name: 'Indomie Instant Noodles (40pk)', sku: 'INDO-40-CHK', category: 'FMCG', unitCost: 8000 },
  { name: 'Peak Milk Powder 400g', sku: 'PEAK-400-1', category: 'FMCG', unitCost: 2800 },
  { name: 'Dettol Antiseptic 750ml', sku: 'DETT-750-1', category: 'Hygiene', unitCost: 1850 },
  { name: 'Golden Morn Cereal 900g', sku: 'GMORN-900-1', category: 'FMCG', unitCost: 3200 },
];

// Nigerian suppliers
const SUPPLIERS = [
  { name: 'Prime Pharma Ltd', code: 'SUP-001', location: 'Ikeja, Lagos' },
  { name: 'MedSupply Nigeria', code: 'SUP-002', location: 'Opebi, Lagos' },
  { name: 'HealthFirst Distributors', code: 'SUP-003', location: 'Oregun, Lagos' },
  { name: 'ColdChain Pharma', code: 'SUP-004', location: 'Victoria Island, Lagos' },
  { name: 'Nestle Nigeria', code: 'SUP-005', location: 'Ilupeju, Lagos' },
  { name: 'Dufil Prima Foods', code: 'SUP-006', location: 'Ota, Ogun State' },
  { name: 'Emzor Pharmaceuticals', code: 'SUP-007', location: 'Isolo, Lagos' },
];

// Nigerian customer names (pharmacies, retail chains)
const CUSTOMERS = [
  { name: 'Shoprite Victoria Island', type: 'Retail' },
  { name: 'MedPlus Pharmacy Ikeja', type: 'Pharmacy' },
  { name: 'HealthPlus Lekki', type: 'Pharmacy' },
  { name: 'Medbury Surulere', type: 'Pharmacy' },
  { name: 'Alpha Pharmacy Marina', type: 'Pharmacy' },
  { name: 'Spar Ikoyi', type: 'Retail' },
  { name: 'Jendol Stores Festac', type: 'Retail' },
  { name: 'Justrite Supermarket', type: 'Retail' },
  { name: 'Market Square Apapa', type: 'Retail' },
  { name: 'Bees Pharmacy Allen', type: 'Pharmacy' },
];

// Nigerian staff names
const STAFF_NAMES = [
  'Adamu Musa', 'Emeka Obi', 'Chidi Okoro', 'Ngozi Eze',
  'Tunde Abiola', 'Fatima Ibrahim', 'Kelechi Nwosu', 'Yusuf Bello',
  'Blessing Okafor', 'Obinna Amadi', 'Aisha Abdullahi', 'Funke Adeyemi',
];

// Helper functions
function generateBatchNumber(productSku: string, year: number, seq: number): string {
  const prefix = productSku.split('-')[0];
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
}

function generateReceiptNumber(year: number, month: number, seq: number): string {
  return `GRN-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}

function generatePickNumber(year: number, month: number, seq: number): string {
  return `PICK-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}

function generatePutawayNumber(year: number, month: number, seq: number): string {
  return `PUT-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}

function generateMovementNumber(year: number, month: number, seq: number): string {
  return `MOV-${year}${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Main seeding function
async function seedAdvancedWarehouseDemo() {
  console.log('🏭 Starting Advanced Warehouse Suite Demo Data Seeder...\n');

  try {
    // Check if data already exists
    const existingZones = await prisma.wh_zone.count({
      where: { tenantId: DEMO_TENANT_ID },
    });

    if (existingZones > 0) {
      console.log('⚠️  Demo data already exists. Skipping seed to avoid duplicates.');
      console.log('   To re-seed, delete existing data first.\n');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // We need warehouse IDs - assuming they exist in inv_warehouses
    // For demo, we'll use placeholder IDs
    const warehouseIds = ['wh-lagos', 'wh-ibadan', 'wh-abuja', 'wh-ph'];

    console.log('1️⃣ Creating Zones...');
    const zones = [];
    let zoneCount = 0;

    for (let i = 0; i < WAREHOUSE_LOCATIONS.length && i < 3; i++) {
      const wh = WAREHOUSE_LOCATIONS[i];
      for (const zoneType of ZONE_TYPES) {
        // Skip cold zone for non-Lagos warehouses in demo
        if (zoneType.type === 'COLD' && i !== 0) continue;

        const zone = await prisma.wh_zone.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            platformInstanceId: DEMO_INSTANCE_ID,
            warehouseId: warehouseIds[i],
            code: `${zoneType.prefix}-${String(zoneCount + 1).padStart(2, '0')}`,
            name: `${zoneType.prefix} - ${wh.name.split(' ')[0]}`,
            description: zoneType.description,
            zoneType: zoneType.type as any,
            totalCapacity: randomInt(500, 2000),
            capacityUnit: 'UNITS',
            allowMixedProducts: zoneType.type === 'STORAGE',
            requiresInspection: zoneType.type === 'QUARANTINE',
            isActive: true,
          },
        });
        zones.push(zone);
        zoneCount++;
      }
    }
    console.log(`   ✅ Created ${zones.length} zones\n`);

    console.log('2️⃣ Creating Bins...');
    const bins = [];
    let binCount = 0;

    for (const zone of zones) {
      const binCountForZone = zone.zoneType === 'RECEIVING' ? 8 :
                              zone.zoneType === 'STORAGE' ? 40 :
                              zone.zoneType === 'PICKING' ? 15 :
                              zone.zoneType === 'SHIPPING' ? 6 :
                              zone.zoneType === 'COLD' ? 20 : 10;

      for (let i = 0; i < binCountForZone; i++) {
        const aisle = String.fromCharCode(65 + Math.floor(i / 16)); // A, B, C...
        const rack = String((i % 16) + 1).padStart(2, '0');
        const level = String(randomInt(1, 4)).padStart(2, '0');
        const position = String(randomInt(1, 4)).padStart(2, '0');

        const bin = await prisma.wh_bin.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            platformInstanceId: DEMO_INSTANCE_ID,
            warehouseId: zone.warehouseId,
            zoneId: zone.id,
            code: `${aisle}-${rack}-${level}-${position}`,
            aisle,
            rack,
            level,
            position,
            binType: zone.zoneType === 'COLD' ? 'COLD' : 
                     zone.zoneType === 'SHIPPING' ? 'FLOOR' :
                     randomInt(0, 1) === 0 ? 'SHELF' : 'PALLET',
            maxWeight: randomInt(100, 500),
            maxVolume: randomInt(50, 200),
            maxUnits: randomInt(100, 500),
            allowMixedBatches: zone.zoneType === 'STORAGE',
            isEmpty: randomInt(0, 3) === 0, // 25% empty
            isActive: true,
            isBlocked: randomInt(0, 20) === 0, // 5% blocked
            blockReason: randomInt(0, 20) === 0 ? 'Pending inspection' : null,
          },
        });
        bins.push(bin);
        binCount++;
      }
    }
    console.log(`   ✅ Created ${bins.length} bins\n`);

    console.log('3️⃣ Creating Batches...');
    const batches = [];
    let batchSeq = 1;

    for (const product of PRODUCTS) {
      const batchCount = product.category === 'Cold Chain' ? 2 : randomInt(2, 4);
      
      for (let i = 0; i < batchCount; i++) {
        const mfgDate = addDays(now, -randomInt(30, 180));
        const expiryDate = addDays(mfgDate, product.category === 'Pharma' ? randomInt(365, 730) : randomInt(180, 365));
        const initialQty = randomInt(1000, 10000);
        const currentQty = Math.floor(initialQty * (randomInt(30, 90) / 100));

        const batch = await prisma.wh_batch.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            platformInstanceId: DEMO_INSTANCE_ID,
            productId: `prod-${product.sku}`,
            productName: product.name,
            batchNumber: generateBatchNumber(product.sku, year, batchSeq),
            lotNumber: `LOT-${String(batchSeq).padStart(5, '0')}`,
            manufacturingDate: mfgDate,
            expiryDate: expiryDate,
            supplierId: randomElement(SUPPLIERS).code,
            supplierName: randomElement(SUPPLIERS).name,
            initialQuantity: initialQty,
            currentQuantity: currentQty,
            reservedQuantity: randomInt(0, Math.floor(currentQty * 0.1)),
            qualityStatus: expiryDate < now ? 'EXPIRED' : 
                          randomInt(0, 10) === 0 ? 'QUARANTINE' : 'APPROVED',
            isActive: expiryDate >= now,
            isRecalled: randomInt(0, 30) === 0,
            recallReason: randomInt(0, 30) === 0 ? 'NAFDAC directive - quality concern' : null,
          },
        });
        batches.push(batch);
        batchSeq++;
      }
    }
    console.log(`   ✅ Created ${batches.length} batches\n`);

    console.log('4️⃣ Creating Receipts...');
    const receipts = [];
    let receiptSeq = 40;

    for (let i = 0; i < 8; i++) {
      const supplier = randomElement(SUPPLIERS);
      const status = i === 0 ? 'EXPECTED' : i === 1 ? 'RECEIVING' : 
                     i === 2 ? 'INSPECTING' : 'COMPLETED';
      const expectedDate = addDays(now, i === 0 ? 2 : -randomInt(0, 5));

      const receipt = await prisma.wh_receipt.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          warehouseId: warehouseIds[0], // Lagos
          receiptNumber: generateReceiptNumber(year, month, receiptSeq + i),
          referenceType: randomInt(0, 3) === 0 ? 'TRANSFER' : 'PO',
          referenceId: `PO-${year}-${String(receiptSeq + i).padStart(4, '0')}`,
          supplierId: supplier.code,
          supplierName: supplier.name,
          supplierRef: `INV-${randomInt(10000, 99999)}`,
          status: status as any,
          expectedDate,
          receivedDate: status === 'COMPLETED' || status === 'INSPECTING' ? expectedDate : null,
          totalExpectedQty: randomInt(500, 2000),
          totalReceivedQty: status === 'EXPECTED' ? 0 : randomInt(400, 2000),
          totalDamagedQty: randomInt(0, 20),
          requiresInspection: status === 'INSPECTING',
          inspectionPassed: status === 'COMPLETED' ? true : null,
          notes: `Delivery from ${supplier.name}`,
        },
      });
      receipts.push(receipt);
    }
    console.log(`   ✅ Created ${receipts.length} receipts\n`);

    console.log('5️⃣ Creating Putaway Tasks...');
    const putawayTasks = [];
    let putawaySeq = 60;

    for (let i = 0; i < 6; i++) {
      const status = i < 2 ? 'PENDING' : i < 4 ? 'IN_PROGRESS' : 'COMPLETED';
      const product = randomElement(PRODUCTS);
      const zone = zones.find(z => z.zoneType === 'STORAGE') || zones[0];
      const bin = bins.find(b => b.zoneId === zone.id) || bins[0];

      const task = await prisma.wh_putaway_task.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          warehouseId: warehouseIds[0],
          taskNumber: generatePutawayNumber(year, month, putawaySeq + i),
          receiptId: receipts[i % receipts.length].id,
          productId: `prod-${product.sku}`,
          productName: product.name,
          sku: product.sku,
          batchId: batches[i % batches.length].id,
          quantity: randomInt(100, 500),
          status: status as any,
          priority: i === 0 ? 'URGENT' : i < 3 ? 'HIGH' : 'NORMAL',
          suggestedZoneId: zone.id,
          suggestedBinId: bin.id,
          suggestedBinCode: bin.code,
          actualZoneId: status === 'COMPLETED' ? zone.id : null,
          actualBinId: status === 'COMPLETED' ? bin.id : null,
          actualBinCode: status === 'COMPLETED' ? bin.code : null,
          assignedToId: status !== 'PENDING' ? `staff-${i % 4}` : null,
          assignedToName: status !== 'PENDING' ? STAFF_NAMES[i % STAFF_NAMES.length] : null,
          completedById: status === 'COMPLETED' ? `staff-${i % 4}` : null,
          completedByName: status === 'COMPLETED' ? STAFF_NAMES[i % STAFF_NAMES.length] : null,
          completedAt: status === 'COMPLETED' ? addDays(now, -randomInt(0, 2)) : null,
        },
      });
      putawayTasks.push(task);
    }
    console.log(`   ✅ Created ${putawayTasks.length} putaway tasks\n`);

    console.log('6️⃣ Creating Pick Lists...');
    const pickLists = [];
    let pickSeq = 80;

    for (let i = 0; i < 8; i++) {
      const customer = randomElement(CUSTOMERS);
      const status = i === 0 ? 'PENDING' : i === 1 ? 'PICKING' : 
                     i === 2 ? 'PICKED' : i === 3 ? 'PACKED' : 'DISPATCHED';
      
      const pickList = await prisma.wh_pick_list.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          warehouseId: warehouseIds[0],
          pickNumber: generatePickNumber(year, month, pickSeq + i),
          pickType: 'ORDER',
          sourceType: 'ORDER',
          sourceId: `ORD-${year}-${String(1240 + i).padStart(4, '0')}`,
          status: status as any,
          priority: i === 1 ? 'URGENT' : i < 4 ? 'HIGH' : 'NORMAL',
          totalItems: randomInt(4, 12),
          pickedItems: ['PENDING'].includes(status) ? 0 : 
                       status === 'PICKING' ? randomInt(1, 5) : randomInt(4, 12),
          totalUnits: randomInt(100, 600),
          pickedUnits: ['PENDING'].includes(status) ? 0 :
                       status === 'PICKING' ? randomInt(50, 200) : randomInt(100, 600),
          assignedToId: status !== 'PENDING' ? `staff-${i % 4}` : null,
          assignedToName: status !== 'PENDING' ? STAFF_NAMES[i % STAFF_NAMES.length] : null,
          packageCount: ['PACKED', 'DISPATCHED'].includes(status) ? randomInt(2, 6) : null,
          totalWeight: ['PACKED', 'DISPATCHED'].includes(status) ? randomInt(5, 30) : null,
          dispatchManifestId: status === 'DISPATCHED' ? `DM-${year}-${randomInt(100, 999)}` : null,
          waybillNumber: status === 'DISPATCHED' ? `WB-LAG-${year}${String(month).padStart(2, '0')}-${String(randomInt(30, 50)).padStart(4, '0')}` : null,
          carrierName: status === 'DISPATCHED' ? randomElement(['GIG Logistics', 'DHL', 'UPS', 'FedEx', 'Kwik Delivery']) : null,
          dispatchedAt: status === 'DISPATCHED' ? addDays(now, -randomInt(0, 1)) : null,
          notes: `Order for ${customer.name}`,
        },
      });
      pickLists.push(pickList);
    }
    console.log(`   ✅ Created ${pickLists.length} pick lists\n`);

    console.log('7️⃣ Creating Stock Movements...');
    const movements = [];
    let movementSeq = 130;

    const movementTypes = ['RECEIPT', 'PUTAWAY', 'PICK', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'RELOCATION', 'SCRAP'];

    for (let i = 0; i < 15; i++) {
      const movementType = movementTypes[i % movementTypes.length];
      const product = randomElement(PRODUCTS);
      const batch = batches[i % batches.length];
      const fromBin = bins[i % bins.length];
      const toBin = bins[(i + 1) % bins.length];
      const quantity = movementType === 'SCRAP' || movementType === 'ADJUSTMENT' ? -randomInt(10, 50) :
                       movementType === 'PICK' || movementType === 'TRANSFER_OUT' ? -randomInt(50, 200) :
                       randomInt(50, 500);

      const movement = await prisma.wh_stock_movement.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          warehouseId: warehouseIds[0],
          movementNumber: generateMovementNumber(year, month, movementSeq + i),
          movementType: movementType as any,
          productId: `prod-${product.sku}`,
          productName: product.name,
          sku: product.sku,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity,
          beforeQuantity: randomInt(500, 2000),
          afterQuantity: randomInt(500, 2000) + quantity,
          fromZoneId: ['PICK', 'TRANSFER_OUT', 'PUTAWAY', 'RELOCATION', 'SCRAP'].includes(movementType) ? fromBin.zoneId : null,
          fromBinId: ['PICK', 'TRANSFER_OUT', 'PUTAWAY', 'RELOCATION', 'SCRAP'].includes(movementType) ? fromBin.id : null,
          fromBinCode: ['PICK', 'TRANSFER_OUT', 'PUTAWAY', 'RELOCATION', 'SCRAP'].includes(movementType) ? fromBin.code : null,
          toZoneId: ['RECEIPT', 'PUTAWAY', 'TRANSFER_IN', 'RELOCATION'].includes(movementType) ? toBin.zoneId : null,
          toBinId: ['RECEIPT', 'PUTAWAY', 'TRANSFER_IN', 'RELOCATION'].includes(movementType) ? toBin.id : null,
          toBinCode: ['RECEIPT', 'PUTAWAY', 'TRANSFER_IN', 'RELOCATION'].includes(movementType) ? toBin.code : null,
          unitCost: product.unitCost,
          referenceType: movementType === 'RECEIPT' ? 'GRN' :
                         movementType === 'PUTAWAY' ? 'PUT' :
                         movementType === 'PICK' ? 'PICK' :
                         movementType.includes('TRANSFER') ? 'TRF' :
                         movementType === 'ADJUSTMENT' ? 'ADJ' :
                         movementType === 'RELOCATION' ? 'REL' : 'SCR',
          referenceId: `REF-${year}-${randomInt(1000, 9999)}`,
          referenceNumber: `REF-${year}-${randomInt(1000, 9999)}`,
          reasonCode: movementType === 'ADJUSTMENT' ? 'DAMAGE' :
                      movementType === 'SCRAP' ? 'EXPIRED' :
                      movementType === 'RELOCATION' ? 'OPTIMIZATION' : null,
          reasonDescription: movementType === 'ADJUSTMENT' ? 'Damaged during handling' :
                            movementType === 'SCRAP' ? 'Expired batch sent for destruction' :
                            movementType === 'RELOCATION' ? 'Bin optimization' : null,
          performedById: `staff-${i % 4}`,
          performedByName: STAFF_NAMES[i % STAFF_NAMES.length],
          performedAt: addDays(now, -randomInt(0, 3)),
          notes: `${movementType} operation completed`,
        },
      });
      movements.push(movement);
    }
    console.log(`   ✅ Created ${movements.length} stock movements\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ADVANCED WAREHOUSE SUITE DEMO DATA SEEDING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`
Summary:
  • Zones:          ${zones.length}
  • Bins:           ${bins.length}
  • Batches:        ${batches.length}
  • Receipts:       ${receipts.length}
  • Putaway Tasks:  ${putawayTasks.length}
  • Pick Lists:     ${pickLists.length}
  • Movements:      ${movements.length}

Nigerian Context:
  • Warehouse locations: Lagos, Ibadan, Abuja, Port Harcourt
  • Products: Pharma, FMCG, PPE, Cold Chain
  • Suppliers: Nigerian pharmaceutical distributors
  • Customers: Pharmacies and retail chains
  • Currency: All values in NGN

Demo Credentials:
  • Use DEMO_TENANT_ID: ${DEMO_TENANT_ID}
  • Access via: /advanced-warehouse-suite

Next Steps:
  1. Start the Next.js dev server
  2. Navigate to /advanced-warehouse-suite
  3. Explore the demo data across all pages
`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedAdvancedWarehouseDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
