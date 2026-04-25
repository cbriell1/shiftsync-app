const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkManagerLocations() {
  const manager = await prisma.user.findFirst({
    where: { email: 'manager@test.com' },
    select: { id: true, name: true, locationIds: true }
  });
  console.log(JSON.stringify(manager, null, 2));
}

checkManagerLocations().catch(console.error).finally(() => prisma.$disconnect());
