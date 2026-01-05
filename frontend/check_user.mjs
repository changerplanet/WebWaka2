import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check admin user
  const user = await prisma.user.findFirst({
    where: { email: 'admin@saascore.com' },
    include: {
      partnerMembership: true
    }
  });
  console.log('Admin User:', JSON.stringify(user, null, 2));
  
  // Check partners
  const partners = await prisma.partner.findMany({
    take: 5
  });
  console.log('Partners:', JSON.stringify(partners, null, 2));
  
  // Check partner users
  const partnerUsers = await prisma.partnerUser.findMany({
    take: 5,
    include: {
      user: { select: { email: true, name: true } }
    }
  });
  console.log('Partner Users:', JSON.stringify(partnerUsers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
