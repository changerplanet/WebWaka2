import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'acme' },
    include: {
      subscription: {
        include: { SubscriptionPlan: true }
      }
    }
  })
  console.log('Tenant:', tenant?.name, tenant?.id)
  console.log('Subscription plan:', tenant?.subscription?.SubscriptionPlan?.slug)
  
  // Get all plans
  const plans = await prisma.subscriptionPlan.findMany()
  console.log('Available plans:', plans.map(p => ({ slug: p.slug, id: p.id })))
  
  // Find professional plan
  const professionalPlan = plans.find(p => p.slug === 'professional')
  console.log('Professional plan:', professionalPlan?.id)
  
  // Update tenant subscription to professional if needed
  if (tenant?.subscription && professionalPlan && tenant.subscription.planId !== professionalPlan.id) {
    console.log('Updating subscription to professional plan...')
    await prisma.subscription.update({
      where: { id: tenant.subscription.id },
      data: { planId: professionalPlan.id }
    })
    console.log('Subscription updated!')
  } else if (!tenant?.subscription && professionalPlan && tenant) {
    console.log('Creating subscription with professional plan...')
    const now = new Date()
    await prisma.subscription.create({
      data: {
        id: `sub_${Date.now().toString(36)}`,
        tenantId: tenant.id,
        planId: professionalPlan.id,
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 0,
        updatedAt: now,
      }
    })
    console.log('Subscription created!')
  } else {
    console.log('Subscription already on professional or no update needed')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
