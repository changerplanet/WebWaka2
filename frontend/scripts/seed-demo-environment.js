/**
 * WebWaka Demo Environment Seed Script
 * 
 * Creates a complete demo environment with all roles and demo data.
 * 
 * Run: node scripts/seed-demo-environment.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs')

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_PASSWORD = 'Demo2026!'
const DEMO_PARTNER_SLUG = 'webwaka-demo-partner'

// Partner-level demo accounts
const PARTNER_ACCOUNTS = [
  { email: 'demo.owner@webwaka.com', name: 'Demo Partner Owner', phone: '+2348100000001', role: 'PARTNER_OWNER', department: 'Executive' },
  { email: 'demo.admin@webwaka.com', name: 'Demo Partner Admin', phone: '+2348100000002', role: 'PARTNER_ADMIN', department: 'Admin' },
  { email: 'demo.sales@webwaka.com', name: 'Demo Sales Rep', phone: '+2348100000003', role: 'PARTNER_SALES', department: 'Sales' },
  { email: 'demo.support@webwaka.com', name: 'Demo Support Agent', phone: '+2348100000004', role: 'PARTNER_SUPPORT', department: 'Support' },
  { email: 'demo.staff@webwaka.com', name: 'Demo Staff Member', phone: '+2348100000005', role: 'PARTNER_STAFF', department: 'Operations' },
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

async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

function generatePhone(base) {
  return `+234${String(base).padStart(10, '0')}`
}

function uuid() {
  return crypto.randomUUID()
}

// ============================================================================
// STEP 1: CREATE DEMO PARTNER
// ============================================================================

async function createDemoPartner() {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: CREATE DEMO PARTNER')
  console.log('='.repeat(60))

  let partner = await prisma.partner.findUnique({
    where: { slug: DEMO_PARTNER_SLUG }
  })

  if (partner) {
    console.log('✅ Demo Partner already exists:', partner.id)
  } else {
    partner = await prisma.partner.create({
      data: {
        id: uuid(),
        name: 'WebWaka Demo Partner',
        slug: DEMO_PARTNER_SLUG,
        email: 'demo-partner@webwaka.com',
        phone: '+2348100000000',
        website: 'https://demo.webwaka.com',
        status: 'ACTIVE',
        tier: 'GOLD',
        approvedAt: new Date(),
        updatedAt: new Date(),
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
        id: uuid(),
        partnerId: partner.id,
        version: 1,
        effectiveFrom: new Date(),
        commissionType: 'PERCENTAGE',
        commissionTrigger: 'ON_PAYMENT',
        commissionRate: 0.15,
        clearanceDays: 30,
        status: 'ACTIVE',
        signedAt: new Date(),
        approvedAt: new Date(),
        updatedAt: new Date(),
      }
    })
    console.log('✅ Partner Agreement created')
  }

  return partner
}

// ============================================================================
// STEP 2: CREATE PARTNER USERS
// ============================================================================

async function createPartnerUsers(partnerId) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: CREATE PARTNER-LEVEL DEMO ACCOUNTS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const createdUsers = []

  for (const account of PARTNER_ACCOUNTS) {
    let user = await prisma.user.findUnique({
      where: { email: account.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuid(),
          email: account.email,
          name: account.name,
          phone: account.phone,
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Created user: ${account.email}`)
    } else {
      console.log(`⏭️  User exists: ${account.email}`)
    }

    const existingLink = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })

    if (!existingLink) {
      await prisma.partnerUser.create({
        data: {
          id: uuid(),
          partnerId: partnerId,
          userId: user.id,
          role: account.role,
          isActive: true,
          displayName: account.name,
          department: account.department,
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Linked to partner as ${account.role}`)
    }

    createdUsers.push({ role: account.role, email: account.email, userId: user.id })
  }

  // Create referral code
  const existingCode = await prisma.partnerReferralCode.findUnique({
    where: { code: 'DEMO-SALES-2026' }
  })
  if (!existingCode) {
    await prisma.partnerReferralCode.create({
      data: {
        id: uuid(),
        partnerId: partnerId,
        code: 'DEMO-SALES-2026',
        isActive: true,
        campaignName: 'Demo Sales Campaign',
        updatedAt: new Date(),
      }
    })
    console.log('✅ Created referral code: DEMO-SALES-2026')
  }

  return createdUsers
}

// ============================================================================
// STEP 3: CREATE DEMO TENANTS
// ============================================================================

async function createDemoTenants(partnerId) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: CREATE DEMO TENANTS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const createdTenants = []

  for (let i = 0; i < DEMO_TENANTS.length; i++) {
    const tenantConfig = DEMO_TENANTS[i]
    
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantConfig.slug }
    })

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: uuid(),
          name: tenantConfig.name,
          slug: tenantConfig.slug,
          status: 'ACTIVE',
          activatedModules: tenantConfig.suites,
          activatedAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Created tenant: ${tenantConfig.name}`)
    } else {
      console.log(`⏭️  Tenant exists: ${tenantConfig.name}`)
    }

    // Create partner referral
    const existingReferral = await prisma.partnerReferral.findUnique({
      where: { tenantId: tenant.id }
    })

    if (!existingReferral) {
      await prisma.partnerReferral.create({
        data: {
          id: uuid(),
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
          id: uuid(),
          tenantId: tenant.id,
          createdByPartnerId: partnerId,
          name: `${tenantConfig.name} Platform`,
          slug: 'main',
          description: tenantConfig.description,
          isDefault: true,
          isActive: true,
          suiteKeys: tenantConfig.suites,
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Platform instance created`)
    }

    // Create Tenant Admin
    const adminEmail = `admin@${tenantConfig.slug}.demo`
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          id: uuid(),
          email: adminEmail,
          name: `${tenantConfig.name} Admin`,
          phone: generatePhone(8200000000 + i * 10),
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Tenant Admin: ${adminEmail}`)
    }

    // Create admin membership
    const existingAdminMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } }
    })

    if (!existingAdminMembership) {
      await prisma.tenantMembership.create({
        data: {
          id: uuid(),
          userId: adminUser.id,
          tenantId: tenant.id,
          role: 'TENANT_ADMIN',
          isActive: true,
          updatedAt: new Date(),
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
          id: uuid(),
          email: userEmail,
          name: `${tenantConfig.name} User`,
          phone: generatePhone(8200000001 + i * 10),
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Tenant User: ${userEmail}`)
    }

    // Create user membership
    const existingUserMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: tenantUser.id, tenantId: tenant.id } }
    })

    if (!existingUserMembership) {
      await prisma.tenantMembership.create({
        data: {
          id: uuid(),
          userId: tenantUser.id,
          tenantId: tenant.id,
          role: 'TENANT_USER',
          isActive: true,
          updatedAt: new Date(),
        }
      })
    }

    createdTenants.push({ id: tenant.id, slug: tenantConfig.slug, type: tenantConfig.type })
  }

  return createdTenants
}

// ============================================================================
// STEP 4: CREATE DEMO DATA
// ============================================================================

async function createDemoData(tenants) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: CREATE DEMO DATA')
  console.log('='.repeat(60))

  for (const tenant of tenants) {
    console.log(`\n📦 Populating data for: ${tenant.slug}`)

    // Create location
    let location = await prisma.location.findFirst({
      where: { tenantId: tenant.id }
    })

    if (!location) {
      location = await prisma.location.create({
        data: {
          id: uuid(),
          tenantId: tenant.id,
          name: 'Main Location',
          code: 'LOC-001',
          type: 'STORE',
          status: 'ACTIVE',
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
            id: uuid(),
            tenantId: tenant.id,
            ...cust,
            fullName: `${cust.firstName} ${cust.lastName}`,
            status: 'ACTIVE',
            totalOrders: Math.floor(Math.random() * 20),
            totalSpent: Math.floor(Math.random() * 500000),
            loyaltyPoints: Math.floor(Math.random() * 1000),
            updatedAt: new Date(),
          }
        })
      }
      console.log(`  ↳ 5 Customers created`)
    }

    // Create products for commerce tenants
    if (['RETAIL', 'MARKETPLACE', 'B2B'].includes(tenant.type)) {
      // Create category
      let category = await prisma.productCategory.findFirst({
        where: { tenantId: tenant.id }
      })

      if (!category) {
        category = await prisma.productCategory.create({
          data: {
            id: uuid(),
            tenantId: tenant.id,
            name: 'General Products',
            slug: 'general',
            isActive: true,
            updatedAt: new Date(),
          }
        })
      }

      const productCount = await prisma.product.count({ where: { tenantId: tenant.id } })
      if (productCount === 0) {
        const products = [
          { name: 'Premium Rice (50kg)', sku: 'RICE-50KG', price: 45000 },
          { name: 'Vegetable Oil (5L)', sku: 'OIL-5L', price: 8500 },
          { name: 'Sugar (10kg)', sku: 'SUGAR-10KG', price: 12000 },
          { name: 'Flour (25kg)', sku: 'FLOUR-25KG', price: 18000 },
          { name: 'Tomato Paste (Carton)', sku: 'TOMATO-CTN', price: 15000 },
          { name: 'Milk Powder (400g)', sku: 'MILK-400G', price: 3500 },
          { name: 'Detergent (5kg)', sku: 'DET-5KG', price: 4500 },
          { name: 'Cooking Gas (12.5kg)', sku: 'GAS-12KG', price: 9000 },
        ]

        for (const prod of products) {
          const product = await prisma.product.create({
            data: {
              id: uuid(),
              tenantId: tenant.id,
              name: prod.name,
              slug: prod.sku.toLowerCase(),
              sku: prod.sku,
              price: prod.price,
              costPrice: prod.price * 0.7,
              type: 'PHYSICAL',
              status: 'ACTIVE',
              categoryId: category.id,
              trackInventory: true,
              updatedAt: new Date(),
            }
          })

          await prisma.inventoryLevel.create({
            data: {
              id: uuid(),
              tenantId: tenant.id,
              productId: product.id,
              locationId: location.id,
              quantityOnHand: Math.floor(Math.random() * 100) + 20,
              quantityReserved: 0,
              quantityAvailable: Math.floor(Math.random() * 100) + 20,
              updatedAt: new Date(),
            }
          })
        }
        console.log(`  ↳ 8 Products with inventory created`)
      }
    }

    // Create staff members
    const staffCount = await prisma.staffMember.count({ where: { tenantId: tenant.id } })
    if (staffCount === 0) {
      const staffMembers = [
        { firstName: 'Adaeze', lastName: 'Okoro' },
        { firstName: 'Kunle', lastName: 'Bello' },
        { firstName: 'Fatima', lastName: 'Hassan' },
        { firstName: 'David', lastName: 'Udo' },
      ]

      for (const staff of staffMembers) {
        await prisma.staffMember.create({
          data: {
            id: uuid(),
            tenantId: tenant.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: `${staff.firstName.toLowerCase()}@${tenant.slug}.demo`,
            status: 'ACTIVE',
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

// ============================================================================
// STEP 5: CREATE EXTERNAL ROLE USERS
// ============================================================================

async function createExternalRoleUsers(tenants) {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: CREATE EXTERNAL ROLE USERS')
  console.log('='.repeat(60))

  const hashedPassword = await hashPassword(DEMO_PASSWORD)

  // Vendor for marketplace
  const marketplaceTenant = tenants.find(t => t.type === 'MARKETPLACE')
  if (marketplaceTenant) {
    const vendorEmail = 'vendor@demo-marketplace.demo'
    let vendorUser = await prisma.user.findUnique({ where: { email: vendorEmail } })

    if (!vendorUser) {
      vendorUser = await prisma.user.create({
        data: {
          id: uuid(),
          email: vendorEmail,
          name: 'Demo Vendor',
          phone: '+2348300000001',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Vendor user created: ${vendorEmail}`)
    }

    const existingSupplier = await prisma.supplier.findFirst({
      where: { tenantId: marketplaceTenant.id, email: vendorEmail }
    })

    if (!existingSupplier) {
      await prisma.supplier.create({
        data: {
          id: uuid(),
          tenantId: marketplaceTenant.id,
          name: 'Premium Goods Nigeria',
          contactName: 'Demo Vendor',
          email: vendorEmail,
          phone: '+2348300000001',
          status: 'ACTIVE',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Vendor/Supplier record created`)
    }
  }

  // Driver for logistics
  const logisticsTenant = tenants.find(t => t.type === 'LOGISTICS')
  if (logisticsTenant) {
    const driverEmail = 'driver@demo-logistics.demo'
    let driverUser = await prisma.user.findUnique({ where: { email: driverEmail } })

    if (!driverUser) {
      driverUser = await prisma.user.create({
        data: {
          id: uuid(),
          email: driverEmail,
          name: 'Demo Driver',
          phone: '+2348300000002',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Driver user created: ${driverEmail}`)

      await prisma.staffMember.create({
        data: {
          id: uuid(),
          tenantId: logisticsTenant.id,
          userId: driverUser.id,
          firstName: 'Demo',
          lastName: 'Driver',
          email: driverEmail,
          phone: '+2348300000002',
          status: 'ACTIVE',
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ Driver staff record created`)
    }
  }

  // B2B Customer
  const b2bTenant = tenants.find(t => t.type === 'B2B')
  if (b2bTenant) {
    const b2bEmail = 'b2b@demo-b2b.demo'
    let b2bUser = await prisma.user.findUnique({ where: { email: b2bEmail } })

    if (!b2bUser) {
      b2bUser = await prisma.user.create({
        data: {
          id: uuid(),
          email: b2bEmail,
          name: 'B2B Business Customer',
          phone: '+2348300000003',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`✅ B2B Customer user created: ${b2bEmail}`)

      await prisma.customer.create({
        data: {
          id: uuid(),
          tenantId: b2bTenant.id,
          email: b2bEmail,
          phone: '+2348300000003',
          firstName: 'B2B Business',
          lastName: 'Customer',
          fullName: 'B2B Business Customer',
          company: 'Wholesale Buyers Ltd',
          taxId: 'TIN-12345678',
          status: 'ACTIVE',
          tags: ['b2b', 'wholesale'],
          updatedAt: new Date(),
        }
      })
      console.log(`  ↳ B2B customer record created`)
    }
  }

  // Registered Customer
  const retailTenant = tenants.find(t => t.type === 'RETAIL')
  if (retailTenant) {
    const customerEmail = 'customer@demo.com'
    let customerUser = await prisma.user.findUnique({ where: { email: customerEmail } })

    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          id: uuid(),
          email: customerEmail,
          name: 'Demo Registered Customer',
          phone: '+2348300000004',
          passwordHash: hashedPassword,
          emailVerifiedAt: new Date(),
          globalRole: 'USER',
          updatedAt: new Date(),
        }
      })
      console.log(`✅ Registered Customer user created: ${customerEmail}`)
    }
  }
}

// ============================================================================
// STEP 6: GENERATE DOCUMENTATION
// ============================================================================

async function generateCredentialsIndex() {
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: GENERATE CREDENTIALS INDEX')
  console.log('='.repeat(60))

  const content = `# WebWaka Demo Credentials Index

**Generated:** ${new Date().toISOString()}
**Default Password for all accounts:** \`${DEMO_PASSWORD}\`
**Login URL:** \`/login-v2\`

## 1. Platform-Level Roles (Global)

| Role | Email | What to Demo |
|------|-------|--------------|
| Super Admin | \`superadmin@saascore.com\` | Full platform access, view all partners/tenants, impersonation |

## 2. Partner-Level Roles (WebWaka Demo Partner)

| Role | Email | Phone | What to Demo |
|------|-------|-------|--------------|
| Partner Owner | \`demo.owner@webwaka.com\` | +2348100000001 | Full partner control, agreement signing, team management |
| Partner Admin | \`demo.admin@webwaka.com\` | +2348100000002 | Admin operations, client management, package configuration |
| Partner Sales | \`demo.sales@webwaka.com\` | +2348100000003 | Client acquisition, referral codes (DEMO-SALES-2026) |
| Partner Support | \`demo.support@webwaka.com\` | +2348100000004 | Read-only client troubleshooting |
| Partner Staff | \`demo.staff@webwaka.com\` | +2348100000005 | Referral code management, limited access |

## 3. Tenant-Level Roles

### 3.1 Lagos Retail Store (POS + Inventory)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-retail-store.demo\` | Full POS control, inventory, settings |
| Tenant User | \`user@demo-retail-store.demo\` | POS operations, basic inventory |

### 3.2 Naija Market Hub (Multi-Vendor Marketplace)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-marketplace.demo\` | Marketplace management, vendor approval |
| Tenant User | \`user@demo-marketplace.demo\` | Order processing, vendor support |

### 3.3 Bright Future Academy (School)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-school.demo\` | School admin, full management |
| Tenant User | \`user@demo-school.demo\` | Teacher role (attendance, grading) |

### 3.4 HealthFirst Clinic (Healthcare)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-clinic.demo\` | Clinic admin, full management |
| Tenant User | \`user@demo-clinic.demo\` | Doctor/Provider role |

### 3.5 Swift Logistics (Logistics)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-logistics.demo\` | Full logistics management |
| Tenant User | \`user@demo-logistics.demo\` | Dispatch operations |

### 3.6 B2B Wholesale Hub (B2B)
| Role | Email | What to Demo |
|------|-------|--------------|
| Tenant Admin | \`admin@demo-b2b.demo\` | B2B management, pricing |
| Tenant User | \`user@demo-b2b.demo\` | Order processing |

## 4. Suite-Specific External Roles

| Role | Email | Context | What to Demo |
|------|-------|---------|--------------|
| Vendor | \`vendor@demo-marketplace.demo\` | MVM | Product listing, inventory, sales |
| Driver | \`driver@demo-logistics.demo\` | Logistics | Delivery assignments, route management |
| B2B Customer | \`b2b@demo-b2b.demo\` | B2B | Bulk purchasing, credit management |
| Registered Customer | \`customer@demo.com\` | SVM/MVM | Profile, orders, loyalty |

## 5. Quick Reference

### URLs
- **Login:** \`/login-v2\`
- **Super Admin Dashboard:** \`/admin\`
- **Partner Dashboard:** \`/dashboard/partner\`
- **Tenant Dashboard:** \`/dashboard\`

### Referral Codes
- \`DEMO-SALES-2026\` - Demo sales campaign code

### Notes
- All accounts use password: \`${DEMO_PASSWORD}\`
- Education, Healthcare, Hospitality suites are PLANNED (limited functionality)
- This is a NON-EXPIRING demo environment
`

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
    const partner = await createDemoPartner()
    await createPartnerUsers(partner.id)
    const tenants = await createDemoTenants(partner.id)
    await createDemoData(tenants)
    await createExternalRoleUsers(tenants)
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

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
