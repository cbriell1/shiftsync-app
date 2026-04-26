const { PrismaClient } = require('@prisma/client');

async function restoreTasks() {
  const recoveryUrl = "postgresql://neondb_owner:npg_Hjdxnr3P4CiF@ep-empty-shape-aiph2ocd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const mainUrl = process.env.DATABASE_URL;

  console.log('📡 Connecting to Recovery Branch...');
  const recoveryPrisma = new PrismaClient({ datasources: { db: { url: recoveryUrl } } });
  
  console.log('📡 Connecting to Main Production Database...');
  const mainPrisma = new PrismaClient({ datasources: { db: { url: mainUrl } } });

  try {
    const tasks = await recoveryPrisma.globalTask.findMany();
    console.log(`🔍 Found ${tasks.length} master facility tasks.`);

    if (tasks.length === 0) {
        console.log('⚠️ No tasks found in recovery branch.');
        return;
    }

    // Inject into Main
    await mainPrisma.globalTask.createMany({
      data: tasks.map(({id, ...d}) => d),
      skipDuplicates: true
    });

    console.log('✅ SUCCESS: Facility tasks restored to production.');

  } catch (err) {
    console.error('❌ Task Restoration Failed:', err.message);
  } finally {
    await recoveryPrisma.$disconnect();
    await mainPrisma.$disconnect();
  }
}

restoreTasks();
