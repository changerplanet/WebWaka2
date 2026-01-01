import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@acme.com' } })
  const session = await prisma.session.findFirst({ where: { userId: user.id } })
  console.log('Session token:', session?.token)
  const partnerUser = await prisma.partnerUser.findUnique({ 
    where: { userId: user.id },
    include: { partner: true }
  })
  console.log('Partner ID:', partnerUser?.partnerId)
}
main().catch(console.error).finally(() => prisma.$disconnect())
