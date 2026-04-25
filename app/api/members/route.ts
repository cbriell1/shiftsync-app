// filepath: app/api/members/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const memberPostSchema = z.object({
  lastName: z.string().min(1, "Last name is required"),
  firstName: z.string().optional().default(''),
  location: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  family: z.string().optional().default(''),
  renewalDate: z.string().optional().default(''),
  totalPasses: z.coerce.number().optional().default(12),
  membershipLevel: z.string().optional().default('STANDARD')
});

const memberActionSchema = z.discriminatedUnion("action",[
  z.object({ action: z.literal("LOG_BEVERAGE"), memberId: z.coerce.number() }),
  z.object({ action: z.literal("UPDATE_RENEWAL"), memberId: z.coerce.number(), renewalDate: z.string() }),
  z.object({ action: z.literal("GRANT_EXTRA_PASSES"), memberId: z.coerce.number(), amount: z.coerce.number(), description: z.string(), initials: z.string() }),
  z.object({ action: z.literal("LOG_PASS_USAGE"), memberId: z.coerce.number(), dateUsed: z.string(), amount: z.coerce.number(), initials: z.string() }),
  z.object({ action: z.literal("REVERT_PASS"), usageId: z.coerce.number() })
]);

// Helper to check for needed renewal resets
async function processLazyResets(members: any[]) {
  const now = new Date();
  const currentStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  
  for (const m of members) {
    if (!m.renewalDate) continue;
    
    // Simple reset check: if renewal date is today or has passed since lastResetDate
    // and we haven't reset yet this year.
    const lastResetYear = m.lastResetDate ? new Date(m.lastResetDate).getFullYear() : 0;
    if (lastResetYear < now.getFullYear()) {
       // Check if current date is past the month/day of renewal
       const [rMonth, rDay] = m.renewalDate.split('-').map(Number);
       const renewalThisYear = new Date(now.getFullYear(), rMonth - 1, rDay);
       
       if (now >= renewalThisYear) {
          // Trigger Reset
          await prisma.$transaction([
            prisma.member.update({
              where: { id: m.id },
              data: { lastResetDate: now }
            }),
            prisma.passUsage.create({
              data: {
                memberId: m.id,
                dateUsed: now.toISOString(),
                amount: 0, // Informational log
                initials: 'AUTO',
                description: `Annual Renewal Reset - ${now.getFullYear()}`
              }
            })
          ]);
       }
    }
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const members = await prisma.member.findMany({
      include: { usages: true },
      orderBy: { lastName: 'asc' }
    });

    // Check for needed resets in background
    processLazyResets(members).catch(console.error);

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const data = memberPostSchema.parse(body);

    const newMember = await prisma.member.create({
      data: {
        lastName: data.lastName,
        firstName: data.firstName,
        location: data.location,
        notes: data.notes,
        family: data.family,
        renewalDate: data.renewalDate,
        totalPasses: data.totalPasses,
        membershipLevel: data.membershipLevel
      }
    });
    return NextResponse.json(newMember);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const data = memberActionSchema.parse(body);

    if (data.action === 'LOG_BEVERAGE') {
      const updated = await prisma.member.update({
        where: { id: data.memberId },
        data: { lastBeverageDate: new Date() } 
      });
      return NextResponse.json(updated);
    }

    if (data.action === 'UPDATE_RENEWAL') {
      const updated = await prisma.member.update({
        where: { id: data.memberId },
        data: { renewalDate: data.renewalDate }
      });
      return NextResponse.json(updated);
    }

    if (data.action === 'GRANT_EXTRA_PASSES') {
      // Granting extra passes adds a negative usage (adding back to balance)
      // or we can update totalPasses. Best practice is to update totalPasses
      // and log the audit.
      const updated = await prisma.member.update({
        where: { id: data.memberId },
        data: { 
          totalPasses: { increment: data.amount },
          usages: {
            create: {
              dateUsed: new Date().toISOString(),
              amount: 0,
              initials: data.initials,
              description: `GRANT: ${data.amount} Passes. Reason: ${data.description}`
            }
          }
        }
      });
      return NextResponse.json(updated);
    }

    if (data.action === 'LOG_PASS_USAGE') {
      const newUsage = await prisma.passUsage.create({
        data: {
          memberId: data.memberId,
          dateUsed: data.dateUsed,
          amount: data.amount,
          initials: data.initials
        }
      });
      return NextResponse.json(newUsage);
    }

    if (data.action === 'REVERT_PASS') {
      const deleted = await prisma.passUsage.delete({
        where: { id: data.usageId }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
