import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'acme' },
    include: {
      subscription: true
    }
  })
  console.log('Tenant:', tenant?.name, tenant?.id)
  console.log('Current subscription:', tenant?.subscription)
  
  // Get all plans
  const plans = await prisma.subscriptionPlan.findMany()
  console.log('Available plans:', plans.map(p => ({ slug: p.slug, id: p.id })))
  
  // Find professional plan
  const professionalPlan = plans.find(p => p.slug === 'professional')
  console.log('Professional plan:', professionalPlan?.id)
  
  if (!professionalPlan) {
    console.log('Creating professional plan...')
    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        slug: 'professional',
        description: 'Professional plan with all features',
        priceMonthly: 99.00,
        priceYearly: 990.00,
        currency: 'USD',
        includedModules: ['POS', 'SVM', 'MVM', 'LOGISTICS', 'ACCOUNTING', 'CRM'],
        maxUsers: 50,
        maxStorage: 100,
        isActive: true,
        isPublic: true,
        trialDays: 14,
        gracePeriodDays: 7
      }
    })
    console.log('Created professional plan:', newPlan.id)
    
    // Create subscription
    if (tenant && !tenant.subscription) {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 1)
      
      const subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: newPlan.id,
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          amount: 99.00,
          currency: 'USD'
        }
      })
      console.log('Created subscription:', subscription.id)
    }
  } else if (tenant && !tenant.subscription) {
    console.log('Creating subscription with existing professional plan...')
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)
    
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: professionalPlan.id,
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        amount: 99.00,
        currency: 'USD'
      }
    })
    console.log('Created subscription:', subscription.id)
  } else if (tenant?.subscription) {
    console.log('Updating subscription to professional plan...')
    await prisma.subscription.update({
      where: { id: tenant.subscription.id },
      data: { planId: professionalPlan.id }
    })
    console.log('Subscription updated!')
  }
  
  // Verify
  const updatedTenant = await prisma.tenant.findFirst({
    where: { slug: 'acme' },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })
  console.log('Updated tenant subscription:', updatedTenant?.subscription?.plan?.slug)
}

main().catch(console.error).finally(() => prisma.$disconnect())
