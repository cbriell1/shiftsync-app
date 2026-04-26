const { PrismaClient } = require('@prisma/client');

async function restoreFeedback() {
  const recoveryUrl = "postgresql://neondb_owner:npg_Hjdxnr3P4CiF@ep-wandering-shadow-ai8v94g1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const mainUrl = process.env.DATABASE_URL;

  console.log('📡 Connecting to Recovery Branch...');
  const recoveryPrisma = new PrismaClient({ datasources: { db: { url: recoveryUrl } } });
  
  console.log('📡 Connecting to Main Production Database...');
  const mainPrisma = new PrismaClient({ datasources: { db: { url: mainUrl } } });

  try {
    // 1. Fetch from Recovery
    const oldFeedback = await recoveryPrisma.feedback.findMany({
      include: { comments: true }
    });

    console.log(`🔍 Found ${oldFeedback.length} feedback items to restore.`);

    if (oldFeedback.length === 0) {
        console.log('⚠️ No data found in the recovery branch. Please double-check the recovery time.');
        return;
    }

    // 2. Inject into Main
    let restoredCount = 0;
    for (const fb of oldFeedback) {
      // Create the feedback (skip ID so it auto-increments correctly or keep it if clean)
      const created = await mainPrisma.feedback.create({
        data: {
          userId: fb.userId,
          type: fb.type,
          description: fb.description,
          status: fb.status,
          devNotes: fb.devNotes,
          createdAt: fb.createdAt,
          updatedAt: fb.updatedAt
        }
      });

      // Create associated comments
      if (fb.comments && fb.comments.length > 0) {
        for (const comm of fb.comments) {
          await mainPrisma.feedbackComment.create({
            data: {
              content: comm.content,
              feedbackId: created.id,
              userId: comm.userId,
              createdAt: comm.createdAt
            }
          });
        }
      }
      restoredCount++;
    }

    console.log(`✅ SUCCESS: ${restoredCount} feedback items and their comments restored to production.`);

  } catch (err) {
    console.error('❌ Restoration Failed:', err.message);
  } finally {
    await recoveryPrisma.$disconnect();
    await mainPrisma.$disconnect();
  }
}

restoreFeedback();
