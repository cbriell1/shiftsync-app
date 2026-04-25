const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function postTrainingAnnouncement() {
  const admin = await prisma.user.findFirst({
    where: { systemRoles: { has: "Administrator" } }
  });

  if (!admin) {
    console.error("No administrator found to post the announcement.");
    return;
  }

  const content = `
Welcome to your new Scheduling Command Center! 🏟️

We have completely overhauled the Manager experience to help you staff the courts in record time.

**🏆 Top Features:**
- **Quick-Paint Mode:** Select a name and "paint" the schedule with one click.
- **Tournament System:** Blackout dates to protect your schedule from auto-generation.
- **Stadium Scoreboard:** High-visibility Time Clock status.
- **Save as Template:** Build your perfect week and lock it in forever.

**📖 Training Resources:**
You can find the full step-by-step Visual Manual in the project root: **TRAINING_MANAGER_SCHEDULING.md**.

*Stay athletic, stay professional.*
  `;

  await prisma.announcement.create({
    data: {
      title: '🏟️ NEW: Manager Scheduling Field Manual',
      content: content.trim(),
      authorId: admin.id,
      isGlobal: true,
      targetLocationIds: [] // Global
    }
  });

  console.log("✅ Training Announcement posted to the Team Chat!");
}

postTrainingAnnouncement().catch(console.error).finally(() => prisma.$disconnect());
