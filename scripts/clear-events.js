const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearEvents() {
  const result = await prisma.event.deleteMany({});
  console.log(`✅ Successfully cleared ${result.count} tournaments/events from the database.`);
}

clearEvents().catch(console.error).finally(() => prisma.$disconnect());
