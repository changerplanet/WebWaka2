import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const partners = await prisma.partner.findMany({ take: 3 })
  console.log('Partners:', JSON.stringify(partners, null, 2))
  const users = await prisma.user.findMany({ take: 3, select: { id: true, email: true, globalRole: true } })
  console.log('Users:', JSON.stringify(users, null, 2))
  const sessions = await prisma.session.findMany({ take: 1, select: { token: true, userId: true } })
  console.log('Sessions:', JSON.stringify(sessions, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
