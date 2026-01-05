/**
 * WebWaka Digital Services Partner Account Creation
 * 
 * This script creates the internal WebWaka Partner account following
 * the standard Partner creation flow. No special privileges.
 * 
 * Run: npx ts-node scripts/create-webwaka-partner.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createWebWakaPartner() {
  console.log('Creating WebWaka Digital Services Partner Account...\n')
  
  // Partner Details
  const PARTNER_NAME = 'WebWaka Digital Services'
  const PARTNER_SLUG = 'webwaka-digital-services'
  const PARTNER_EMAIL = 'partners@webwaka.com'
  const PARTNER_PHONE = '+2348000000001'
  
  // Admin User Details
  const ADMIN_EMAIL = 'admin@webwaka-partners.com'
  const ADMIN_NAME = 'WebWaka Partner Admin'
  const TEMP_PASSWORD = 'WebWaka2026!' // Must be changed on first login
  
  // Demo Tenant Details
  const DEMO_TENANT_NAME = 'WebWaka Demo Organization'
  const DEMO_TENANT_SLUG = 'webwaka-demo-org'
  const DEMO_INSTANCE_NAME = 'Demo Platform Instance'
  
  try {
    // Check if partner already exists
    const existingPartner = await prisma.partner.findUnique({
      where: { slug: PARTNER_SLUG }
    })
    
    if (existingPartner) {
      console.log('⚠️  Partner already exists with slug:', PARTNER_SLUG)
      console.log('Partner ID:', existingPartner.id)
      
      // Get the admin user
      const partnerUser = await prisma.partnerUser.findFirst({
        where: { partnerId: existingPartner.id, role: 'PARTNER_OWNER' },
        include: { user: true }
      })
      
      if (partnerUser) {
        console.log('\n📧 Admin Email:', partnerUser.user.email)
      }
      
      return
    }
    
    // Step 1: Create the Partner account
    console.log('1️⃣  Creating Partner account...')
    const partner = await prisma.partner.create({
      data: {
        name: PARTNER_NAME,
        slug: PARTNER_SLUG,
        email: PARTNER_EMAIL,
        phone: PARTNER_PHONE,
        website: 'https://webwaka.com',
        status: 'ACTIVE',
        tier: 'GOLD',
        metadata: {
          isInternal: true,
          partnerType: 'COMPANY',
          signupSource: 'internal',
          signupDate: new Date().toISOString(),
          description: 'Internal WebWaka Partner account for demos and direct sales',
        },
        approvedAt: new Date(),
      }
    })
    console.log('   ✅ Partner created:', partner.id)
    
    // Step 2: Create Partner Profile Extension
    console.log('2️⃣  Creating Partner profile extension...')
    await prisma.partnerProfileExt.create({
      data: {
        partnerId: partner.id,
        partnerType: 'COMPANY',
        bio: 'Official WebWaka internal partner account for demonstrations and direct client onboarding.',
        industries: ['technology', 'commerce', 'education', 'health', 'civic', 'hospitality', 'logistics'],
        specialties: ['platform-implementation', 'multi-tenant-saas', 'digital-transformation'],
        servicesOffered: ['implementation', 'training', 'support', 'consulting'],
        regionsServed: ['nigeria', 'west-africa', 'africa'],
      }
    })
    console.log('   ✅ Profile extension created')
    
    // Step 3: Create Admin User
    console.log('3️⃣  Creating admin user...')
    const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        phone: PARTNER_PHONE,
        passwordHash: hashedPassword,
        emailVerifiedAt: new Date(),
        globalRole: 'USER', // No super admin privileges
      }
    })
    console.log('   ✅ Admin user created:', adminUser.id)
    
    // Step 4: Link user to Partner as PARTNER_OWNER
    console.log('4️⃣  Linking user to Partner as PARTNER_OWNER...')
    await prisma.partnerUser.create({
      data: {
        partnerId: partner.id,
        userId: adminUser.id,
        role: 'PARTNER_OWNER',
        isActive: true,
        displayName: 'WebWaka Admin',
        department: 'Admin',
      }
    })
    console.log('   ✅ User linked to Partner')
    
    // Step 5: Create Demo Tenant
    console.log('5️⃣  Creating demo tenant...')
    const demoTenant = await prisma.tenant.create({
      data: {
        name: DEMO_TENANT_NAME,
        slug: DEMO_TENANT_SLUG,
        status: 'ACTIVE',
      }
    })
    console.log('   ✅ Demo tenant created:', demoTenant.id)
    
    // Step 6: Create Partner Referral (links tenant to partner)
    console.log('6️⃣  Creating partner referral link...')
    await prisma.partnerReferral.create({
      data: {
        partnerId: partner.id,
        tenantId: demoTenant.id,
        attributionMethod: 'PARTNER_CREATED',
        attributionLocked: true,
        lockedAt: new Date(),
        referralSource: 'internal',
      }
    })
    console.log('   ✅ Partner referral created')
    
    // Step 7: Create Demo Platform Instance
    console.log('7️⃣  Creating demo platform instance...')
    const demoInstance = await prisma.platformInstance.create({
      data: {
        tenantId: demoTenant.id,
        createdByPartnerId: partner.id,
        name: DEMO_INSTANCE_NAME,
        slug: 'demo',
        displayName: '🎯 DEMO - WebWaka Demo Platform',
        description: 'Demo platform instance for showcasing WebWaka capabilities',
        isDefault: true,
        isActive: true,
        suiteKeys: ['commerce', 'education', 'health', 'civic', 'hospitality', 'logistics'],
        primaryColor: '#10B981',
        secondaryColor: '#059669',
      }
    })
    console.log('   ✅ Demo instance created:', demoInstance.id)
    
    // Step 8: Create Domain Entry
    console.log('8️⃣  Creating domain entry...')
    await prisma.tenantDomain.create({
      data: {
        tenantId: demoTenant.id,
        domain: 'demo.webwaka.com',
        type: 'SUBDOMAIN',
        status: 'VERIFIED',
        isPrimary: true,
        platformInstanceId: demoInstance.id,
      }
    })
    console.log('   ✅ Domain entry created')
    
    // Step 9: Create Instance Subscription
    console.log('9️⃣  Creating instance subscription...')
    await prisma.instanceSubscription.create({
      data: {
        platformInstanceId: demoInstance.id,
        partnerId: partner.id,
        status: 'ACTIVE',
        amount: 0, // Demo - no charge
        wholesaleCost: 0,
        partnerMargin: 0,
        currency: 'NGN',
        billingInterval: 'yearly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    })
    console.log('   ✅ Instance subscription created')
    
    // Final Output
    console.log('\n' + '='.repeat(60))
    console.log('✅ WEBWAKA DIGITAL SERVICES PARTNER ACCOUNT CREATED')
    console.log('='.repeat(60))
    console.log('')
    console.log('📋 PARTNER DETAILS:')
    console.log('   Partner ID:    ', partner.id)
    console.log('   Partner Name:  ', PARTNER_NAME)
    console.log('   Partner Slug:  ', PARTNER_SLUG)
    console.log('   Partner Email: ', PARTNER_EMAIL)
    console.log('   Partner Phone: ', PARTNER_PHONE)
    console.log('   Status:        ', 'ACTIVE')
    console.log('   Tier:          ', 'GOLD')
    console.log('')
    console.log('🔐 LOGIN CREDENTIALS:')
    console.log('   Email:         ', ADMIN_EMAIL)
    console.log('   Temp Password: ', TEMP_PASSWORD)
    console.log('   ⚠️  MUST CHANGE PASSWORD ON FIRST LOGIN')
    console.log('')
    console.log('🌐 ACCESS URLs:')
    console.log('   Partner Dashboard: /dashboard/partner')
    console.log('   Partner Login:     /login-v2')
    console.log('')
    console.log('🏢 DEMO TENANT:')
    console.log('   Tenant ID:     ', demoTenant.id)
    console.log('   Tenant Name:   ', DEMO_TENANT_NAME)
    console.log('   Instance ID:   ', demoInstance.id)
    console.log('   Instance Name: ', DEMO_INSTANCE_NAME)
    console.log('   Domain:        ', 'demo.webwaka.com')
    console.log('   Suites:        ', 'All 6 industry suites enabled')
    console.log('')
    console.log('✅ CONFIRMATIONS:')
    console.log('   ✓ Tenant creation:          Complete')
    console.log('   ✓ Platform Instance:        Complete')
    console.log('   ✓ Capability activation:    All suites enabled')
    console.log('   ✓ Branding & domain:        Complete')
    console.log('   ✓ Partner-First compliance: Verified (no Super Admin)')
    console.log('')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error creating WebWaka Partner:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createWebWakaPartner()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
