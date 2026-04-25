const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTestAccounts() {
  const locs = await prisma.location.findMany({ select: { id: true } });
  const locIds = locs.map(l => l.id);
  
  await prisma.user.updateMany({
    where: { email: { in: ['manager@test.com', 'staff@test.com'] } },
    data: { locationIds: locIds }
  });
  
  console.log(`✅ Linked test accounts to ${locIds.length} locations.`);
}

fixTestAccounts().catch(console.error).finally(() => prisma.$disconnect());
