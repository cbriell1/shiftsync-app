const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { systemRoles: { has: "Administrator" } }
  });

  if (!admin) {
    console.error("No admin user found to attribute feedback to.");
    return;
  }

  const items = [
    { type: 'SUGGESTION', description: 'Redesign Time Clock with Stadium Scoreboard UI for better status visibility.', status: 'COMPLETED', devNotes: 'Implemented high-glow neon status lamps and 12h time format.' },
    { type: 'SUGGESTION', description: 'Implement Quick-Paint mode for instant staff assignments.', status: 'COMPLETED', devNotes: 'Managers can now select a staff member and "paint" multiple shifts with one click.' },
    { type: 'BUG', description: 'Excessive database timeouts during shift generation.', status: 'COMPLETED', devNotes: 'Optimized N+1 queries to Bulk SQL (createMany). Reduced 20s calls to <1s.' },
    { type: 'SUGGESTION', description: 'Unified Event System for Tournaments and Blackouts.', status: 'COMPLETED', devNotes: 'New registry created. Generator now automatically skips blackout dates.' },
    { type: 'SUGGESTION', description: 'Modernize Gift Card Registry with Ticket-Grid layout.', status: 'COMPLETED', devNotes: 'Switched from table to card-based grid with instant search.' },
    { type: 'SUGGESTION', description: 'Add "Save Week as Template" feature to Schedule Builder.', status: 'COMPLETED', devNotes: 'Managers can now capture a live week and turn it into a master pattern instantly.' },
    { type: 'BUG', description: 'Horizontal scroll issues on laptop screens in week view.', status: 'COMPLETED', devNotes: 'Condensed column widths and removed fixed min-width constraints.' },
  ];

  for (const item of items) {
    await prisma.feedback.create({
      data: {
        userId: admin.id,
        type: item.type,
        description: item.description,
        status: item.status,
        devNotes: item.devNotes
      }
    });
  }

  console.log(`✅ Seeded ${items.length} completed overhaul items to the Feedback board.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
