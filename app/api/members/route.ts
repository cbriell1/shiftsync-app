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
  totalPasses: z.coerce.number().optional().default(12)
});

const memberActionSchema = z.discriminatedUnion("action",[
  z.object({ action: z.literal("LOG_BEVERAGE"), memberId: z.coerce.number() }),
  z.object({ action: z.literal("UPDATE_RENEWAL"), memberId: z.coerce.number(), renewalDate: z.string() }),
  z.object({ action: z.literal("UPDATE_TOTAL_PASSES"), memberId: z.coerce.number(), totalPasses: z.coerce.number(), bonusNotes: z.string().optional() }),
  z.object({ action: z.literal("LOG_PASS_USAGE"), memberId: z.coerce.number(), dateUsed: z.string(), amount: z.coerce.number(), initials: z.string() })
]);

// FIX: Added (req: Request)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const members = await prisma.member.findMany({
      include: { usages: true },
      orderBy: { lastName: 'asc' }
    });
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
        totalPasses: data.totalPasses
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

    if (data.action === 'UPDATE_TOTAL_PASSES') {
      const updated = await prisma.member.update({
        where: { id: data.memberId },
        data: { 
          totalPasses: data.totalPasses,
          bonusNotes: data.bonusNotes || '' 
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
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}