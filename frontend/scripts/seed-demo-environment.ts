/**
 * WebWaka Demo Environment Seed Script
 * 
 * Creates a complete demo environment with:
 * - Demo Partner (WebWaka Demo Partner) with all partner roles
 * - Multiple demo tenants representing different business types
 * - Tenant admins and users for each tenant
 * - External users (customers, vendors, drivers, B2B customers)
 * - Realistic demo data for each module
 * 
 * Run: npx ts-node scripts/seed-demo-environment.ts
 */

import { PrismaClient } from '@prisma/client'

// Define enums manually since they may vary from introspection
const GlobalRole = { SUPER_ADMIN: 'SUPER_ADMIN', USER: 'USER' } as const
const TenantRole = { TENANT_ADMIN: 'TENANT_ADMIN', TENANT_USER: 'TENANT_USER' } as const
const PartnerRole = { 
  PARTNER_OWNER: 'PARTNER_OWNER', 
  PARTNER_ADMIN: 'PARTNER_ADMIN', 
  PARTNER_SALES: 'PARTNER_SALES', 
  PARTNER_SUPPORT: 'PARTNER_SUPPORT', 
  PARTNER_STAFF: 'PARTNER_STAFF' 
} as const
const PartnerStatus = { PENDING: 'PENDING', ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', TERMINATED: 'TERMINATED' } as const
const PartnerTier = { BRONZE: 'BRONZE', SILVER: 'SILVER', GOLD: 'GOLD', PLATINUM: 'PLATINUM' } as const
const TenantStatus = { PENDING_ACTIVATION: 'PENDING_ACTIVATION', ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', DEACTIVATED: 'DEACTIVATED' } as const
const CustomerStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', BLOCKED: 'BLOCKED' } as const
const ProductStatus = { DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', ARCHIVED: 'ARCHIVED' } as const
const ProductType = { PHYSICAL: 'PHYSICAL', DIGITAL: 'DIGITAL', SERVICE: 'SERVICE', BUNDLE: 'BUNDLE' } as const
const LocationStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', CLOSED: 'CLOSED' } as const
const StaffStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', TERMINATED: 'TERMINATED' } as const
const SupplierStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' } as const
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_PASSWORD = 'Demo2026!'
const DEMO_PARTNER_SLUG = 'webwaka-demo-partner'

// Partner-level demo accounts
const PARTNER_ACCOUNTS = [
  { email: 'demo.owner@webwaka.com', name: 'Demo Partner Owner', phone: '+2348100000001', role: PartnerRole.PARTNER_OWNER, department: 'Executive' },
  { email: 'demo.admin@webwaka.com', name: 'Demo Partner Admin', phone: '+2348100000002', role: PartnerRole.PARTNER_ADMIN, department: 'Admin' },
  { email: 'demo.sales@webwaka.com', name: 'Demo Sales Rep', phone: '+2348100000003', role: PartnerRole.PARTNER_SALES, department: 'Sales' },
  { email: 'demo.support@webwaka.com', name: 'Demo Support Agent', phone: '+2348100000004', role: PartnerRole.PARTNER_SUPPORT, department: 'Support' },
  { email: 'demo.staff@webwaka.com', name: 'Demo Staff Member', phone: '+2348100000005', role: PartnerRole.PARTNER_STAFF, department: 'Operations' },
]

// Demo tenants configuration
const DEMO_TENANTS = [
  {
    name: 'Lagos Retail Store',
    slug: 'demo-retail-store',
    type: 'RETAIL',
    suites: ['pos', 'inventory', 'crm', 'analytics'],
    description: 'Retail business with POS and inventory management',
  },
  {
    name: 'Naija Market Hub',
    slug: 'demo-marketplace',
    type: 'MARKETPLACE',
    suites: ['mvm', 'inventory', 'logistics', 'crm'],
    description: 'Multi-vendor marketplace with delivery logistics',
  },
  {
    name: 'Bright Future Academy',
    slug: 'demo-school',
    type: 'EDUCATION',
    suites: ['school_attendance', 'school_grading'],
    description: 'School management with attendance and grading',
  },
  {
    name: 'HealthFirst Clinic',
    slug: 'demo-clinic',
    type: 'HEALTHCARE',
    suites: ['patient_records', 'appointment_scheduling'],
    description: 'Healthcare facility with patient management',
  },
  {
    name: 'Swift Logistics',
    slug: 'demo-logistics',
    type: 'LOGISTICS',
    suites: ['logistics', 'inventory', 'analytics'],
    description: 'Logistics company with fleet management',
  },
  {
    name: 'B2B Wholesale Hub',
    slug: 'demo-b2b',
    type: 'B2B',
    suites: ['b2b', 'inventory', 'procurement', 'accounting'],
    description: 'B2B wholesale business',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

function generatePhone(base: number): string {
  return `+234${String(base).padStart(10, '0')}`
}

// ============================================================================
// MAIN SEED FUNCTIONS
// ============================================================================

async function createDemoPartner() {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: CREATE DEMO PARTNER')
  console.log('='.repeat(60))

  // Check if demo partner exists
  let partner = await prisma.partner.findUnique({
    where: { slug: DEMO_PARTNER_SLUG }
  })

  if (partner) {
    console.log('✅ Demo Partner already exists:', partner.id)
  } else {
    partner = await prisma.partner.create({
      data: {
        name: 'WebWaka Demo Partner',
        slug: DEMO_PARTNER_SLUG,
        email: 'demo-partner@webwaka.com',
        phone: '+2348100000000',
        website: 'https://demo.webwaka.com',
        status: PartnerStatus.ACTIVE,
        tier: PartnerTier.GOLD,
        approvedAt: new Date(),
        metadata: {
          isDemo: true,
          description: 'Official WebWaka Demo Partner for platform demonstrations',
          nonExpiring: true,
        }
      }
    })
    console.log('✅ Demo Partner created:', partner.id)
  }

  // Create partner agreement
  const existingAgreement = await prisma.partnerAgreement.findFirst({
    where: { partnerId: partner.id, status: 'ACTIVE' }
  })

  if (!existingAgreement) {
    await prisma.partnerAgreement.create({
      data: {
        partnerId: partner.id,
        version: 1,
        effectiveFrom: new Date(),
        commissionType: 'PERCENTAGE',
        commissionTrigger: 'ON_PAYMENT',
        commissionRate: 0.15, // 15%
        clearanceDays: 30,
        status: 'ACTIVE',
        signedAt: new Date(),
        approvedAt: new Date(),
      }
    })
    console.log('✅ Partner Agreement created')
  }

  return partner
}

async function createPartnerUsers(partnerId: string) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: CREATE PARTNER-LEVEL DEMO ACCOUNTS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const createdUsers: Array<{ role: string; email: string; userId: string }> = []

  for (const account of PARTNER_ACCOUNTS) {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: account.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          phone: account.phone,
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`✅ Created user: ${account.email}`)
    } else {
      console.log(`⏭️  User exists: ${account.email}`)
    }

    // Check if partner user link exists
    const existingLink = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })

    if (!existingLink) {
      await prisma.partnerUser.create({
        data: {
          partnerId: partnerId,
          userId: user.id,
          role: account.role,
          isActive: true,
          displayName: account.name,
          department: account.department,
        }
      })
      console.log(`✅ Linked to partner as ${account.role}`)
    }

    createdUsers.push({ role: account.role, email: account.email, userId: user.id })
  }

  // Create referral codes for sales and staff
  const salesUser = createdUsers.find(u => u.role === 'PARTNER_SALES')
  if (salesUser) {
    const existingCode = await prisma.partnerReferralCode.findUnique({
      where: { code: 'DEMO-SALES-2026' }
    })
    if (!existingCode) {
      await prisma.partnerReferralCode.create({
        data: {
          partnerId: partnerId,
          code: 'DEMO-SALES-2026',
          isActive: true,
          campaignName: 'Demo Sales Campaign',
        }
      })
      console.log('✅ Created referral code: DEMO-SALES-2026')
    }
  }

  return createdUsers
}

async function createDemoTenants(partnerId: string) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: CREATE DEMO TENANTS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const createdTenants: Array<{ id: string; slug: string; type: string }> = []

  for (const tenantConfig of DEMO_TENANTS) {
    // Check if tenant exists
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantConfig.slug }
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantConfig.name,
          slug: tenantConfig.slug,
          status: TenantStatus.ACTIVE,
          activatedModules: tenantConfig.suites,
          activatedAt: new Date(),
        }
      })
      console.log(`✅ Created tenant: ${tenantConfig.name}`)
    } else {
      console.log(`⏭️  Tenant exists: ${tenantConfig.name}`)
    }

    // Create partner referral (links tenant to partner)
    const existingReferral = await prisma.partnerReferral.findUnique({
      where: { tenantId: tenant.id }
    })

    if (!existingReferral) {
      await prisma.partnerReferral.create({
        data: {
          partnerId: partnerId,
          tenantId: tenant.id,
          attributionMethod: 'PARTNER_CREATED',
          attributionLocked: true,
          lockedAt: new Date(),
          referralSource: 'demo',
        }
      })
      console.log(`  ↳ Partner referral created`)
    }

    // Create platform instance
    let instance = await prisma.platformInstance.findFirst({
      where: { tenantId: tenant.id, isDefault: true }
    })

    if (!instance) {
      instance = await prisma.platformInstance.create({
        data: {
          tenantId: tenant.id,
          createdByPartnerId: partnerId,
          name: `${tenantConfig.name} Platform`,
          slug: 'main',
          description: tenantConfig.description,
          isDefault: true,
          isActive: true,
          suiteKeys: tenantConfig.suites,
        }
      })
      console.log(`  ↳ Platform instance created`)
    }

    // Create Tenant Admin user
    const adminEmail = `admin@${tenantConfig.slug}.demo`
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: `${tenantConfig.name} Admin`,
          phone: generatePhone(8200000000 + createdTenants.length * 10),
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`  ↳ Tenant Admin: ${adminEmail}`)
    }

    // Create tenant membership for admin
    const existingAdminMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } }
    })

    if (!existingAdminMembership) {
      await prisma.tenantMembership.create({
        data: {
          userId: adminUser.id,
          tenantId: tenant.id,
          role: TenantRole.TENANT_ADMIN,
          isActive: true,
        }
      })
    }

    // Create Tenant User
    const userEmail = `user@${tenantConfig.slug}.demo`
    let tenantUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!tenantUser) {
      tenantUser = await prisma.user.create({
        data: {
          email: userEmail,
          name: `${tenantConfig.name} User`,
          phone: generatePhone(8200000001 + createdTenants.length * 10),
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`  ↳ Tenant User: ${userEmail}`)
    }

    // Create tenant membership for user
    const existingUserMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: tenantUser.id, tenantId: tenant.id } }
    })

    if (!existingUserMembership) {
      await prisma.tenantMembership.create({
        data: {
          userId: tenantUser.id,
          tenantId: tenant.id,
          role: TenantRole.TENANT_USER,
          isActive: true,
        }
      })
    }

    createdTenants.push({ id: tenant.id, slug: tenantConfig.slug, type: tenantConfig.type })
  }

  return createdTenants
}

async function createDemoData(tenants: Array<{ id: string; slug: string; type: string }>) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: CREATE DEMO DATA')
  console.log('='.repeat(60))

  for (const tenant of tenants) {
    console.log(`\n📦 Populating data for: ${tenant.slug}`)

    // Create a default location for each tenant
    let location = await prisma.location.findFirst({
      where: { tenantId: tenant.id }
    })

    if (!location) {
      location = await prisma.location.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          name: 'Main Location',
          code: 'LOC-001',
          type: 'STORE',
          status: LocationStatus.ACTIVE,
          isDefaultLocation: true,
          city: 'Lagos',
          state: 'Lagos',
          country: 'NG',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Location created`)
    }

    // Create customers
    const customerCount = await prisma.customer.count({ where: { tenantId: tenant.id } })
    if (customerCount === 0) {
      const customers = [
        { firstName: 'Chidi', lastName: 'Okonkwo', email: 'chidi@example.com', phone: '+2348030001001' },
        { firstName: 'Amaka', lastName: 'Eze', email: 'amaka@example.com', phone: '+2348030001002' },
        { firstName: 'Tunde', lastName: 'Adeyemi', email: 'tunde@example.com', phone: '+2348030001003' },
        { firstName: 'Ngozi', lastName: 'Nwosu', email: 'ngozi@example.com', phone: '+2348030001004' },
        { firstName: 'Emeka', lastName: 'Obi', email: 'emeka@example.com', phone: '+2348030001005' },
      ]

      for (const cust of customers) {
        await prisma.customer.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: tenant.id,
            ...cust,
            fullName: `${cust.firstName} ${cust.lastName}`,
            status: CustomerStatus.ACTIVE,
            totalOrders: Math.floor(Math.random() * 20),
            totalSpent: Math.floor(Math.random() * 500000),
            loyaltyPoints: Math.floor(Math.random() * 1000),
            updatedAt: new Date(),
          }
        })
      }
      console.log(`  ↳ 5 Customers created`)
    }

    // Create product category
    let category = await prisma.productCategory.findFirst({
      where: { tenantId: tenant.id }
    })

    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          name: 'General Products',
          slug: 'general',
          isActive: true,
          updatedAt: new Date(),
        }
      })
    }

    // Create products for retail/marketplace tenants
    if (['RETAIL', 'MARKETPLACE', 'B2B'].includes(tenant.type)) {
      const productCount = await prisma.product.count({ where: { tenantId: tenant.id } })
      if (productCount === 0) {
        const products = [
          { name: 'Premium Rice (50kg)', sku: 'RICE-50KG', price: 45000, type: ProductType.PHYSICAL },
          { name: 'Vegetable Oil (5L)', sku: 'OIL-5L', price: 8500, type: ProductType.PHYSICAL },
          { name: 'Sugar (10kg)', sku: 'SUGAR-10KG', price: 12000, type: ProductType.PHYSICAL },
          { name: 'Flour (25kg)', sku: 'FLOUR-25KG', price: 18000, type: ProductType.PHYSICAL },
          { name: 'Tomato Paste (Carton)', sku: 'TOMATO-CTN', price: 15000, type: ProductType.PHYSICAL },
          { name: 'Milk Powder (400g)', sku: 'MILK-400G', price: 3500, type: ProductType.PHYSICAL },
          { name: 'Detergent (5kg)', sku: 'DET-5KG', price: 4500, type: ProductType.PHYSICAL },
          { name: 'Cooking Gas (12.5kg)', sku: 'GAS-12KG', price: 9000, type: ProductType.PHYSICAL },
        ]

        for (const prod of products) {
          const product = await prisma.product.create({
            data: {
              tenantId: tenant.id,
              name: prod.name,
              slug: prod.sku.toLowerCase(),
              sku: prod.sku,
              price: prod.price,
              costPrice: prod.price * 0.7,
              type: prod.type,
              status: ProductStatus.ACTIVE,
              categoryId: category.id,
              trackInventory: true,
            }
          })

          // Create inventory level
          await prisma.inventoryLevel.create({
            data: {
              tenantId: tenant.id,
              productId: product.id,
              locationId: location.id,
              quantityOnHand: Math.floor(Math.random() * 100) + 20,
              quantityReserved: 0,
              quantityAvailable: Math.floor(Math.random() * 100) + 20,
            }
          })
        }
        console.log(`  ↳ 8 Products created with inventory`)
      }
    }

    // Create staff members
    const staffCount = await prisma.staffMember.count({ where: { tenantId: tenant.id } })
    if (staffCount === 0) {
      const staffMembers = [
        { firstName: 'Adaeze', lastName: 'Okoro', role: 'MANAGER', hourlyRate: 2500 },
        { firstName: 'Kunle', lastName: 'Bello', role: 'SUPERVISOR', hourlyRate: 2000 },
        { firstName: 'Fatima', lastName: 'Hassan', role: 'STAFF', hourlyRate: 1500 },
        { firstName: 'David', lastName: 'Udo', role: 'STAFF', hourlyRate: 1500 },
      ]

      for (const staff of staffMembers) {
        await prisma.staffMember.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: tenant.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: `${staff.firstName.toLowerCase()}@${tenant.slug}.demo`,
            status: StaffStatus.ACTIVE,
            locationId: location.id,
            hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          }
        })
      }
      console.log(`  ↳ 4 Staff members created`)
    }
  }
}

async function createExternalRoleUsers(tenants: Array<{ id: string; slug: string; type: string }>) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: CREATE EXTERNAL ROLE USERS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  
  // Find marketplace tenant for vendor (using Supplier model)
  const marketplaceTenant = tenants.find(t => t.type === 'MARKETPLACE')
  if (marketplaceTenant) {
    // Create Vendor user (for MVM)
    const vendorEmail = 'vendor@demo-marketplace.demo'
    let vendorUser = await prisma.user.findUnique({ where: { email: vendorEmail } })
    
    if (!vendorUser) {
      vendorUser = await prisma.user.create({
        data: {
          email: vendorEmail,
          name: 'Demo Vendor',
          phone: '+2348300000001',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`✅ Vendor user created: ${vendorEmail}`)
    }

    // Create supplier record (vendors are stored as suppliers in this schema)
    const existingSupplier = await prisma.supplier.findFirst({
      where: { tenantId: marketplaceTenant.id, email: vendorEmail }
    })

    if (!existingSupplier) {
      await prisma.supplier.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: marketplaceTenant.id,
          name: 'Premium Goods Nigeria',
          contactName: 'Demo Vendor',
          email: vendorEmail,
          phone: '+2348300000001',
          status: SupplierStatus.ACTIVE,
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Vendor/Supplier record created`)
    }
  }

  // Find logistics tenant for driver
  const logisticsTenant = tenants.find(t => t.type === 'LOGISTICS')
  if (logisticsTenant) {
    const driverEmail = 'driver@demo-logistics.demo'
    let driverUser = await prisma.user.findUnique({ where: { email: driverEmail } })
    
    if (!driverUser) {
      driverUser = await prisma.user.create({
        data: {
          email: driverEmail,
          name: 'Demo Driver',
          phone: '+2348300000002',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`✅ Driver user created: ${driverEmail}`)
      
      // Create staff member for driver
      await prisma.staffMember.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: logisticsTenant.id,
          userId: driverUser.id,
          firstName: 'Demo',
          lastName: 'Driver',
          email: driverEmail,
          phone: '+2348300000002',
          status: StaffStatus.ACTIVE,
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Driver staff record created`)
    }
  }

  // Find B2B tenant for B2B customer
  const b2bTenant = tenants.find(t => t.type === 'B2B')
  if (b2bTenant) {
    const b2bEmail = 'b2b@demo-b2b.demo'
    let b2bUser = await prisma.user.findUnique({ where: { email: b2bEmail } })
    
    if (!b2bUser) {
      b2bUser = await prisma.user.create({
        data: {
          email: b2bEmail,
          name: 'B2B Business Customer',
          phone: '+2348300000003',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`✅ B2B Customer user created: ${b2bEmail}`)
      
      // Create B2B customer record
      await prisma.customer.create({
        data: {
          tenantId: b2bTenant.id,
          email: b2bEmail,
          phone: '+2348300000003',
          firstName: 'B2B Business',
          lastName: 'Customer',
          fullName: 'B2B Business Customer',
          company: 'Wholesale Buyers Ltd',
          taxId: 'TIN-12345678',
          status: CustomerStatus.ACTIVE,
          tags: ['b2b', 'wholesale'],
        }
      })
      console.log(`  ↳ B2B customer record created`)
    }
  }

  // Create registered customer for storefront
  const retailTenant = tenants.find(t => t.type === 'RETAIL')
  if (retailTenant) {
    const customerEmail = 'customer@demo.com'
    let customerUser = await prisma.user.findUnique({ where: { email: customerEmail } })
    
    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          email: customerEmail,
          name: 'Demo Registered Customer',
          phone: '+2348300000004',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: GlobalRole.USER,
        }
      })
      console.log(`✅ Registered Customer user created: ${customerEmail}`)
    }
  }
}

async function generateCredentialsIndex() {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: GENERATE CREDENTIALS INDEX')
  console.log('='.repeat(60))

  const credentials: string[] = []
  
  credentials.push('# WebWaka Demo Credentials Index')
  credentials.push('')
  credentials.push('**Generated:** ' + new Date().toISOString())
  credentials.push('**Default Password for all accounts:** `' + DEMO_PASSWORD + '`')
  credentials.push('**Login URL:** `/login-v2`')
  credentials.push('')
  
  // Super Admin
  credentials.push('## 1. Platform-Level Roles (Global)')
  credentials.push('')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Super Admin | `superadmin@saascore.com` | Full platform access, view all partners/tenants, impersonation |')
  credentials.push('')

  // Partner Roles
  credentials.push('## 2. Partner-Level Roles (WebWaka Demo Partner)')
  credentials.push('')
  credentials.push('| Role | Email | Phone | What to Demo |')
  credentials.push('|------|-------|-------|--------------|')
  credentials.push('| Partner Owner | `demo.owner@webwaka.com` | +2348100000001 | Full partner control, agreement signing, team management |')
  credentials.push('| Partner Admin | `demo.admin@webwaka.com` | +2348100000002 | Admin operations, client management, package configuration |')
  credentials.push('| Partner Sales | `demo.sales@webwaka.com` | +2348100000003 | Client acquisition, referral codes (DEMO-SALES-2026) |')
  credentials.push('| Partner Support | `demo.support@webwaka.com` | +2348100000004 | Read-only client troubleshooting |')
  credentials.push('| Partner Staff | `demo.staff@webwaka.com` | +2348100000005 | Referral code management, limited access |')
  credentials.push('')

  // Tenant Roles
  credentials.push('## 3. Tenant-Level Roles')
  credentials.push('')
  credentials.push('### 3.1 Retail Business (POS + Inventory)')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-retail-store.demo` | Full POS control, inventory, settings |')
  credentials.push('| Tenant User | `user@demo-retail-store.demo` | POS operations, basic inventory |')
  credentials.push('')

  credentials.push('### 3.2 Multi-Vendor Marketplace')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-marketplace.demo` | Marketplace management, vendor approval |')
  credentials.push('| Tenant User | `user@demo-marketplace.demo` | Order processing, vendor support |')
  credentials.push('')

  credentials.push('### 3.3 School (Education)')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-school.demo` | School admin, full management |')
  credentials.push('| Tenant User | `user@demo-school.demo` | Teacher role (attendance, grading) |')
  credentials.push('')

  credentials.push('### 3.4 Healthcare Clinic')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-clinic.demo` | Clinic admin, full management |')
  credentials.push('| Tenant User | `user@demo-clinic.demo` | Doctor/Provider role |')
  credentials.push('')

  credentials.push('### 3.5 Logistics Company')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-logistics.demo` | Full logistics management |')
  credentials.push('| Tenant User | `user@demo-logistics.demo` | Dispatch operations |')
  credentials.push('')

  credentials.push('### 3.6 B2B Wholesale')
  credentials.push('| Role | Email | What to Demo |')
  credentials.push('|------|-------|--------------|')
  credentials.push('| Tenant Admin | `admin@demo-b2b.demo` | B2B management, pricing |')
  credentials.push('| Tenant User | `user@demo-b2b.demo` | Order processing |')
  credentials.push('')

  // External Roles
  credentials.push('## 4. Suite-Specific External Roles')
  credentials.push('')
  credentials.push('| Role | Email | Context | What to Demo |')
  credentials.push('|------|-------|---------|--------------|')
  credentials.push('| Vendor | `vendor@demo-marketplace.demo` | MVM | Product listing, inventory, sales |')
  credentials.push('| Driver | `driver@demo-logistics.demo` | Logistics | Delivery assignments, route management |')
  credentials.push('| B2B Customer | `b2b@demo-b2b.demo` | B2B | Bulk purchasing, credit management |')
  credentials.push('| Registered Customer | `customer@demo.com` | SVM/MVM | Profile, orders, loyalty |')
  credentials.push('')

  // Quick Reference
  credentials.push('## 5. Quick Reference')
  credentials.push('')
  credentials.push('### URLs')
  credentials.push('- **Login:** `/login-v2`')
  credentials.push('- **Super Admin Dashboard:** `/admin`')
  credentials.push('- **Partner Dashboard:** `/dashboard/partner`')
  credentials.push('- **Tenant Dashboard:** `/dashboard`')
  credentials.push('')
  credentials.push('### Referral Codes')
  credentials.push('- `DEMO-SALES-2026` - Demo sales campaign code')
  credentials.push('')
  credentials.push('### Notes')
  credentials.push('- All accounts use password: `' + DEMO_PASSWORD + '`')
  credentials.push('- Education, Healthcare, Hospitality suites are PLANNED (limited functionality)')
  credentials.push('- This is a NON-EXPIRING demo environment')
  credentials.push('')

  const content = credentials.join('\n')
  
  // Write to file
  const fs = await import('fs')
  fs.writeFileSync('/app/frontend/docs/DEMO_CREDENTIALS_INDEX.md', content)
  console.log('✅ Credentials index written to /app/frontend/docs/DEMO_CREDENTIALS_INDEX.md')
  
  return content
}

async function generateOverviewDoc() {
  const overview = `# WebWaka Demo Environment Overview

**Created:** ${new Date().toISOString()}
**Status:** Production-Ready Demo Environment

## Purpose

This demo environment is designed for:
- End-to-end functional demonstrations
- Partner sales demos
- Government pilots
- UX walkthroughs
- Support & troubleshooting simulations

## Architecture

### Demo Partner: WebWaka Demo Partner
- **Slug:** \`${DEMO_PARTNER_SLUG}\`
- **Status:** ACTIVE (Non-expiring)
- **Tier:** GOLD
- **Commission Rate:** 15%

### Demo Tenants

| Tenant | Type | Enabled Suites |
|--------|------|----------------|
| Lagos Retail Store | Retail | POS, Inventory, CRM, Analytics |
| Naija Market Hub | Marketplace | MVM, Inventory, Logistics, CRM |
| Bright Future Academy | Education | Attendance, Grading |
| HealthFirst Clinic | Healthcare | Patient Records, Scheduling |
| Swift Logistics | Logistics | Logistics, Inventory, Analytics |
| B2B Wholesale Hub | B2B | B2B, Inventory, Procurement, Accounting |

## Demo Data Included

Each tenant is populated with:
- 5 sample customers with realistic Nigerian names
- 8 products (for commerce tenants) with inventory
- 4 staff members per location
- Default location (Lagos, Nigeria)

## Roles Covered

### Platform-Level (1)
- Super Admin

### Partner-Level (5)
- Partner Owner
- Partner Admin
- Partner Sales
- Partner Support
- Partner Staff

### Tenant-Level (12)
- 6 Tenant Admins (one per demo tenant)
- 6 Tenant Users (one per demo tenant)

### External Roles (4)
- Vendor (MVM)
- Driver (Logistics)
- B2B Customer
- Registered Customer (SVM/MVM)

## Verification Checklist

- [x] Demo Partner created and active
- [x] All 5 partner roles have accounts
- [x] All 6 demo tenants created
- [x] Tenant admin and user for each tenant
- [x] Partner referrals established
- [x] Platform instances configured
- [x] Demo data populated
- [x] External role accounts created
- [x] Referral codes generated

## Files

- \`/app/frontend/docs/DEMO_CREDENTIALS_INDEX.md\` - All login credentials
- \`/app/frontend/docs/DEMO_ENVIRONMENT_OVERVIEW.md\` - This file

## No Schema Changes

This demo environment was created using ONLY existing schemas and flows.
No modifications were made to:
- Prisma schema
- Role definitions
- Permission logic
- UI components
`

  const fs = await import('fs')
  fs.writeFileSync('/app/frontend/docs/DEMO_ENVIRONMENT_OVERVIEW.md', overview)
  console.log('✅ Overview written to /app/frontend/docs/DEMO_ENVIRONMENT_OVERVIEW.md')
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('  WEBWAKA DEMO ENVIRONMENT SEED SCRIPT')
  console.log('═'.repeat(60))
  console.log('  Starting demo environment creation...')
  console.log('═'.repeat(60))

  try {
    // Step 1: Create Demo Partner
    const partner = await createDemoPartner()

    // Step 2: Create Partner Users
    await createPartnerUsers(partner.id)

    // Step 3: Create Demo Tenants
    const tenants = await createDemoTenants(partner.id)

    // Step 4: Create Demo Data
    await createDemoData(tenants)

    // Step 5: Create External Role Users
    await createExternalRoleUsers(tenants)

    // Step 6: Generate Documentation
    await generateCredentialsIndex()
    await generateOverviewDoc()

    console.log('\n' + '═'.repeat(60))
    console.log('  ✅ DEMO ENVIRONMENT CREATION COMPLETE')
    console.log('═'.repeat(60))
    console.log('')
    console.log('  📄 Documentation generated:')
    console.log('     - /app/frontend/docs/DEMO_CREDENTIALS_INDEX.md')
    console.log('     - /app/frontend/docs/DEMO_ENVIRONMENT_OVERVIEW.md')
    console.log('')
    console.log('  🔐 Default password: ' + DEMO_PASSWORD)
    console.log('  🌐 Login URL: /login-v2')
    console.log('')
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('❌ Error creating demo environment:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
