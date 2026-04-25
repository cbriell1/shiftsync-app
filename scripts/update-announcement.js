const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAnnouncement() {
  const admin = await prisma.user.findFirst({
    where: { systemRoles: { has: "Administrator" } }
  });

  if (!admin) {
    console.error("No administrator found.");
    return;
  }

  const content = `
The **Phase 1 System Overhaul** is now complete and verified! 🏆

We have updated the training materials to include a detailed deep-dive into the new **Digital Court** scheduling features.

**📊 New Training Available:**
- **Shift Creation:** Master the bulk generator and individual template setup.
- **Single vs. Paint Mode:** Learn when to use the precision dropdown vs. the high-speed Quick-Paint brush.
- **Visual Cues:** Understand the new horizon lines and event protection highlights.

**🔗 View Training Hub:**
Click the **"Help & Training"** tab in your sidebar to view the full visual manual with live screenshots.

*Stay athletic, stay professional.*
  `;

  await prisma.announcement.create({
    data: {
      title: '🏟️ TRAINING UPDATED: Mastering the Digital Court',
      content: content.trim(),
      authorId: admin.id,
      isGlobal: true,
      targetLocationIds: []
    }
  });

  console.log("✅ Final Training Announcement posted!");
}

updateAnnouncement().catch(console.error).finally(() => prisma.$disconnect());
