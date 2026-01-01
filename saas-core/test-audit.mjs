import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create some audit entries for the partner
  const partner = await prisma.partner.findFirst({ where: { slug: 'test-partner' } })
  const user = await prisma.user.findUnique({ where: { email: 'admin@acme.com' } })
  
  if (!partner || !user) {
    console.log('Partner or user not found')
    return
  }

  // Create audit entries
  const entries = [
    {
      action: 'PARTNER_CREATED',
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'Partner',
      targetId: partner.id,
      metadata: { partnerName: partner.name }
    },
    {
      action: 'PARTNER_AGREEMENT_SIGNED',
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'Partner',
      targetId: partner.id,
      metadata: { version: 1, commissionRate: 0.15 }
    },
    {
      action: 'PARTNER_REFERRAL_CREATED',
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'Partner',
      targetId: partner.id,
      metadata: { tenantName: 'Acme Corporation' }
    },
    {
      action: 'EARNING_CREATED',
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'PartnerEarning',
      targetId: partner.id,
      metadata: { partnerId: partner.id, amount: 15.00 }
    }
  ]

  for (const entry of entries) {
    await prisma.auditLog.create({ data: entry })
  }

  console.log('Created', entries.length, 'audit entries')
  
  // List all audit logs
  const logs = await prisma.auditLog.findMany({
    where: { targetId: partner.id },
    orderBy: { createdAt: 'desc' }
  })
  console.log('Audit logs:', JSON.stringify(logs, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
