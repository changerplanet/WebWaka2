import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if POS capability exists
  const posCapability = await prisma.core_capabilities.findUnique({
    where: { key: 'pos' }
  });
  
  console.log('POS Capability:', posCapability);
  
  if (!posCapability) {
    // Create POS capability
    const newCap = await prisma.core_capabilities.create({
      data: {
        id: 'cap_pos_001',
        key: 'pos',
        displayName: 'Point of Sale',
        domain: 'commerce',
        description: 'POS & Retail Operations Suite',
        isCore: false,
        isAvailable: true,
        sortOrder: 10,
        icon: 'ShoppingCart',
        updatedAt: new Date()
      }
    });
    console.log('Created POS capability:', newCap);
  }
  
  // Check if activation exists
  const activation = await prisma.core_tenant_capability_activations.findUnique({
    where: {
      tenantId_capabilityKey: {
        tenantId: 'demo-webwaka-pos',
        capabilityKey: 'pos'
      }
    }
  });
  
  console.log('Existing activation:', activation);
  
  if (!activation) {
    // Create activation
    const newActivation = await prisma.core_tenant_capability_activations.create({
      data: {
        id: 'act_pos_demo_001',
        tenantId: 'demo-webwaka-pos',
        capabilityKey: 'pos',
        status: 'ACTIVE',
        activatedAt: new Date(),
        activatedBy: 'SYSTEM',
        updatedAt: new Date()
      }
    });
    console.log('Created activation:', newActivation);
  } else if (activation.status !== 'ACTIVE') {
    // Update to active
    const updated = await prisma.core_tenant_capability_activations.update({
      where: { id: activation.id },
      data: { status: 'ACTIVE', activatedAt: new Date(), updatedAt: new Date() }
    });
    console.log('Updated activation:', updated);
  } else {
    console.log('POS capability already active for demo-webwaka-pos');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
