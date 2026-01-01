import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'superadmin@saascore.com' } })
  if (!user) {
    console.log('No superadmin user found')
    return
  }
  const session = await prisma.session.findFirst({ where: { userId: user.id } })
  console.log('Session token:', session?.token)
  console.log('User ID:', user.id)
}
main().catch(console.error).finally(() => prisma.$disconnect())
