const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTestData() {
  console.log('🧹 Starting Production Data Cleanup...');

  try {
    // 1. Clear Feedback / Dev Requests
    await prisma.feedbackComment.deleteMany({});
    await prisma.feedback.deleteMany({});
    console.log('✅ Feedback & Comments cleared.');

    // 2. Clear Audit & Error Logs
    await prisma.auditLog.deleteMany({});
    await prisma.errorLog.deleteMany({});
    console.log('✅ Audit & Error logs cleared.');

    // 3. Clear Snack/Beverage Usages
    await prisma.snackUsage.deleteMany({});
    console.log('✅ Snack/Beverage history cleared.');

    // 4. Clear Member Transactions (Pass usages)
    // NOTE: We keep the Members themselves, but clear their history
    await prisma.passUsage.deleteMany({});
    await prisma.member.updateMany({
        data: { lastBeverageDate: null, lastResetDate: null }
    });
    console.log('✅ Member transaction history cleared.');

    // 5. Remove Test Users
    await prisma.user.deleteMany({
      where: {
        email: { in: ['manager@test.com', 'staff@test.com'] }
      }
    });
    console.log('✅ Test accounts removed.');

    console.log('🏁 DATA CLEANUP COMPLETE. System is ready for production.');
  } catch (err) {
    console.error('❌ Cleanup Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
