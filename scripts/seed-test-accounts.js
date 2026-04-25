const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create Test Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {
        systemRoles: ['Administrator', 'Manager', 'Front Desk'],
        isActive: true
    },
    create: {
      name: 'Test Manager',
      email: 'manager@test.com',
      role: 'ADMIN',
      systemRoles: ['Administrator', 'Manager', 'Front Desk'],
      isActive: true
    }
  });

  // 2. Create Test Front Desk
  const staff = await prisma.user.upsert({
    where: { email: 'staff@test.com' },
    update: {
        systemRoles: ['Front Desk'],
        isActive: true
    },
    create: {
      name: 'Test Front Desk',
      email: 'staff@test.com',
      role: 'EMPLOYEE',
      systemRoles: ['Front Desk'],
      isActive: true
    }
  });

  console.log(`✅ Test Accounts Prepared:`);
  console.log(` - Manager: manager@test.com`);
  console.log(` - Staff: staff@test.com`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
