// filepath: app/api/timecards/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { isManagement } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const timeCardSchema = z.object({
  id: z.number().nullable().optional(),
  userId: z.coerce.number(),
  locationId: z.coerce.number(),
  clockIn: z.string().datetime(),
  clockOut: z.string().datetime().nullable().optional(),
  status: z.string().optional(),
});

const getQuerySchema = z.object({
  userId: z.coerce.number().optional()
});

const calculateTotalHours = (clockIn: string, clockOut?: string | null) => {
  if (!clockOut) return null;
  const msDiff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return parseFloat((msDiff / (1000 * 60 * 60)).toFixed(2));
};

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isManager = await isManagement();
    const sessionUserId = parseInt(session.user?.id as string);

    const { searchParams } = new URL(req.url);
    const parsed = getQuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined
    });

    let whereClause: { userId?: number } = {};
    if (parsed.success && parsed.data.userId) {
      if (!isManager && parsed.data.userId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      whereClause = { userId: parsed.data.userId };
    } else if (!isManager) {
      whereClause = { userId: sessionUserId };
    }

    const timeCards = await prisma.timeCard.findMany({
      where: whereClause,
      include: { user: true, location: true, checklists: true },
      orderBy: { clockIn: 'desc' },
      take: 100
    });

    return NextResponse.json(timeCards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = timeCardSchema.parse(body);

    const isManager = await isManagement();
    const sessionUserId = parseInt(session.user?.id as string);
    if (!isManager && data.userId !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden. You can only create your own timecards." }, { status: 403 });
    }

    const tc = await prisma.timeCard.create({
      data: {
        userId: data.userId,
        locationId: data.locationId,
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        totalHours: calculateTotalHours(data.clockIn, data.clockOut), 
      }
    });
    return NextResponse.json(tc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = timeCardSchema.parse(body);

    if (!data.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // FIX: Ensure the user is a manager OR owns the timecard
    const isManager = await isManagement();
    if (!isManager && data.userId !== parseInt(session.user?.id as string)) {
      return NextResponse.json({ error: "Forbidden. You can only edit your own timecards." }, { status: 403 });
    }

    const updateData: any = {
      userId: data.userId,
      locationId: data.locationId,
      clockIn: new Date(data.clockIn),
      clockOut: data.clockOut ? new Date(data.clockOut) : null,
      totalHours: calculateTotalHours(data.clockIn, data.clockOut), 
    };

    if (data.status && isManager) updateData.status = data.status; // Only managers can approve status

    const tc = await prisma.timeCard.update({
      where: { id: data.id },
      data: updateData
    });
    return NextResponse.json(tc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const id = z.coerce.number().parse(data.id);
    
    const tc = await prisma.timeCard.findUnique({ where: { id } });
    if (!tc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // FIX: Ensure the user is a manager OR owns the timecard
    const isManager = await isManagement();
    if (!isManager && tc.userId !== parseInt(session.user?.id as string)) {
      return NextResponse.json({ error: "Forbidden. You can only delete your own timecards." }, { status: 403 });
    }
    
    await prisma.checklist.deleteMany({
      where: { timeCardId: id }
    });

    await prisma.timeCard.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}