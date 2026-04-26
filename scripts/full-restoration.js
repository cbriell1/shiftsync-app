const { PrismaClient } = require('@prisma/client');

async function fullRestoration() {
  const recoveryUrl = "postgresql://neondb_owner:npg_Hjdxnr3P4CiF@ep-empty-shape-aiph2ocd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const mainUrl = process.env.DATABASE_URL;

  console.log('📡 Connecting to Recovery Branch...');
  const recoveryPrisma = new PrismaClient({ datasources: { db: { url: recoveryUrl } } });
  
  console.log('📡 Connecting to Main Production Database...');
  const mainPrisma = new PrismaClient({ datasources: { db: { url: mainUrl } } });

  try {
    console.log('📦 Fetching all data from recovery point...');
    
    const [oldEvents, oldShifts, oldTimeCards, oldChecklists, oldFeedback, oldAudit, oldMembers, oldPassUsages, oldSnacks] = await Promise.all([
      recoveryPrisma.event.findMany(),
      recoveryPrisma.shift.findMany(),
      recoveryPrisma.timeCard.findMany(),
      recoveryPrisma.checklist.findMany(),
      recoveryPrisma.feedback.findMany({ include: { comments: true } }),
      recoveryPrisma.auditLog.findMany(),
      recoveryPrisma.member.findMany(),
      recoveryPrisma.passUsage.findMany(),
      recoveryPrisma.snackUsage.findMany()
    ]);

    console.log(`🔍 Extraction Summary:
    - Events: ${oldEvents.length}
    - Shifts: ${oldShifts.length}
    - TimeCards: ${oldTimeCards.length}
    - Checklists: ${oldChecklists.length}
    - VIP Usages: ${oldPassUsages.length}
    - Dev Requests: ${oldFeedback.length}`);

    if (oldEvents.length === 0 && oldShifts.length === 0 && oldFeedback.length === 0) {
        console.log('⚠️ WARNING: No major data found. Recovery time might still be incorrect.');
        return;
    }

    // 🛡️ RE-INJECTING (Using createMany where possible for speed)
    console.log('💉 Injecting data back to production...');

    if (oldEvents.length > 0) await mainPrisma.event.createMany({ data: oldEvents.map(({id, ...d}) => d), skipDuplicates: true });
    if (oldShifts.length > 0) await mainPrisma.shift.createMany({ data: oldShifts.map(({id, ...d}) => d), skipDuplicates: true });
    if (oldTimeCards.length > 0) await mainPrisma.timeCard.createMany({ data: oldTimeCards.map(({id, ...d}) => d), skipDuplicates: true });
    if (oldChecklists.length > 0) await mainPrisma.checklist.createMany({ data: oldChecklists.map(({id, ...d}) => d), skipDuplicates: true });
    if (oldAudit.length > 0) await mainPrisma.auditLog.createMany({ data: oldAudit.map(({id, ...d}) => d), skipDuplicates: true });
    
    // Feedback needs ID tracking for comments
    for (const fb of oldFeedback) {
      const created = await mainPrisma.feedback.create({
        data: {
          userId: fb.userId,
          type: fb.type,
          description: fb.description,
          status: fb.status,
          devNotes: fb.devNotes,
          createdAt: fb.createdAt
        }
      });
      if (fb.comments?.length > 0) {
        await mainPrisma.feedbackComment.createMany({
          data: fb.comments.map(c => ({ content: c.content, feedbackId: created.id, userId: c.userId, createdAt: c.createdAt }))
        });
      }
    }

    // Member updates
    for (const m of oldMembers) {
        await mainPrisma.member.update({
            where: { id: m.id },
            data: { 
                lastBeverageDate: m.lastBeverageDate,
                lastResetDate: m.lastResetDate,
                membershipLevel: m.membershipLevel,
                family: m.family
            }
        }).catch(() => {}); // Skip if member missing
    }

    if (oldPassUsages.length > 0) await mainPrisma.passUsage.createMany({ data: oldPassUsages.map(({id, ...d}) => d), skipDuplicates: true });
    if (oldSnacks.length > 0) await mainPrisma.snackUsage.createMany({ data: oldSnacks.map(({id, ...d}) => d), skipDuplicates: true });

    console.log('✅ FULL RESTORATION COMPLETE. Your facility history is back online.');

  } catch (err) {
    console.error('❌ Restoration Failed:', err.message, err.stack);
  } finally {
    await recoveryPrisma.$disconnect();
    await mainPrisma.$disconnect();
  }
}

fullRestoration();
