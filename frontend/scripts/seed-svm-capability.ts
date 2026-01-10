/**
 * SVM Capability Activation Seed Script
 * 
 * Activates SVM capability for demo tenant to enable testing.
 * Run with: npx ts-node scripts/seed-svm-capability.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'demo-webwaka-svm';
  
  console.log('='.repeat(60));
  console.log('SVM Capability Activation');
  console.log('='.repeat(60));
  
  // Check if SVM capability exists in registry
  let svmCapability = await prisma.core_capabilities.findUnique({
    where: { key: 'svm' }
  });
  
  console.log('SVM Capability in registry:', svmCapability ? 'EXISTS' : 'NOT FOUND');
  
  if (!svmCapability) {
    // Create SVM capability
    svmCapability = await prisma.core_capabilities.create({
      data: {
        id: 'cap_svm_001',
        key: 'svm',
        displayName: 'Single Vendor Marketplace',
        domain: 'commerce',
        description: 'Online storefront for a single seller with product catalog, cart, and checkout',
        isCore: false,
        isAvailable: true,
        sortOrder: 2,
        icon: 'Store',
        updatedAt: new Date()
      }
    });
    console.log('Created SVM capability:', svmCapability.key);
  }
  
  // Check if tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  if (!tenant) {
    // Create demo tenant
    tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Demo SVM Store',
        slug: 'demo-svm-store',
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
    console.log('Created tenant:', tenant.id);
  } else {
    console.log('Tenant exists:', tenant.id);
  }
  
  // Check if activation exists
  const activation = await prisma.core_tenant_capability_activations.findUnique({
    where: {
      tenantId_capabilityKey: {
        tenantId,
        capabilityKey: 'svm'
      }
    }
  });
  
  console.log('Existing activation:', activation ? activation.status : 'NONE');
  
  if (!activation) {
    // Create activation
    const newActivation = await prisma.core_tenant_capability_activations.create({
      data: {
        id: `act_svm_${Date.now()}`,
        tenantId,
        capabilityKey: 'svm',
        status: 'ACTIVE',
        activatedAt: new Date(),
        activatedBy: 'SYSTEM',
        updatedAt: new Date()
      }
    });
    console.log('Created activation:', newActivation.status);
  } else if (activation.status !== 'ACTIVE') {
    // Update to active
    const updated = await prisma.core_tenant_capability_activations.update({
      where: { id: activation.id },
      data: { status: 'ACTIVE', activatedAt: new Date(), updatedAt: new Date() }
    });
    console.log('Updated activation to:', updated.status);
  } else {
    console.log('SVM capability already active for', tenantId);
  }
  
  // Also create SVM entitlement
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      tenantId_module: {
        tenantId,
        module: 'SVM'
      }
    }
  });
  
  if (!entitlement) {
    await prisma.entitlement.create({
      data: {
        id: `ent_svm_${Date.now()}`,
        tenantId,
        module: 'SVM',
        status: 'ACTIVE',
        limits: {
          products: 1000,
          orders: 10000,
          tax_config: {
            taxRate: 0.075,
            taxName: 'VAT',
            taxEnabled: true
          }
        },
        updatedAt: new Date()
      }
    });
    console.log('Created SVM entitlement');
  } else {
    console.log('SVM entitlement exists:', entitlement.status);
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('SVM capability activated for tenant:', tenantId);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
