const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearShifts() {
  const result = await prisma.shift.deleteMany({});
  console.log(`✅ Successfully cleared ${result.count} test shifts from the database.`);
}

clearShifts().catch(console.error).finally(() => prisma.$disconnect());
