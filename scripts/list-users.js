const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, systemRoles: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

listUsers().catch(console.error).finally(() => prisma.$disconnect());
