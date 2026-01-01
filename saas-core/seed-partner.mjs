import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create a test partner
  const partner = await prisma.partner.create({
    data: {
      name: 'Test Partner Inc',
      slug: 'test-partner',
      email: 'partner@test.com',
      status: 'ACTIVE',
      tier: 'GOLD',
      website: 'https://testpartner.com'
    }
  })
  console.log('Created partner:', partner.id)

  // Create a partner user linked to existing user (admin@acme.com)
  const user = await prisma.user.findUnique({ where: { email: 'admin@acme.com' } })
  if (user) {
    const partnerUser = await prisma.partnerUser.create({
      data: {
        partnerId: partner.id,
        userId: user.id,
        role: 'PARTNER_OWNER',
        isActive: true
      }
    })
    console.log('Created partner user:', partnerUser.id)
  }

  // Create a partner agreement
  const agreement = await prisma.partnerAgreement.create({
    data: {
      partnerId: partner.id,
      version: 1,
      effectiveFrom: new Date(),
      commissionType: 'PERCENTAGE',
      commissionTrigger: 'ON_PAYMENT',
      commissionRate: 0.15, // 15%
      clearanceDays: 30,
      status: 'ACTIVE',
      signedAt: new Date()
    }
  })
  console.log('Created agreement:', agreement.id)

  // Get an existing tenant
  const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } })
  if (tenant) {
    // Create a partner referral
    const referral = await prisma.partnerReferral.create({
      data: {
        partnerId: partner.id,
        tenantId: tenant.id,
        attributionMethod: 'REFERRAL_LINK',
        referredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        attributionLocked: true,
        lockedAt: new Date()
      }
    })
    console.log('Created referral:', referral.id)

    // Create some earnings
    const earning = await prisma.partnerEarning.create({
      data: {
        partnerId: partner.id,
        referralId: referral.id,
        agreementId: agreement.id,
        entryType: 'CREDIT',
        idempotencyKey: `test_earning_${Date.now()}`,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        grossAmount: 100.00,
        commissionType: 'PERCENTAGE',
        commissionRate: 0.15,
        commissionAmount: 15.00,
        currency: 'USD',
        status: 'CLEARED',
        clearedAt: new Date()
      }
    })
    console.log('Created earning:', earning.id)
  }

  // Create payout settings
  await prisma.partnerPayoutSettings.create({
    data: {
      partnerId: partner.id,
      minimumPayout: 50.00,
      currency: 'USD',
      payoutFrequency: 'MONTHLY'
    }
  })
  console.log('Created payout settings')

  console.log('\n✅ Test data created successfully!')
  console.log('Partner ID:', partner.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
