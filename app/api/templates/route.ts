// filepath: app/api/templates/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  id: z.coerce.number().nullable().optional(),
  locationIds: z.array(z.coerce.number()).optional(),
  daysOfWeek: z.array(z.any()).optional(),
  startTime: z.string(),
  endTime: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  checklistTasks: z.array(z.string()).default([]),
  userId: z.coerce.number().nullable().optional(),
});

async function verifyAccess() {
  const session = await auth();
  if (!session?.user) return false;
  const userRoles = (session.user as any).systemRoles ||[];
  return userRoles.includes('Administrator') || userRoles.includes('Manager');
}

// FIX: Added (req: Request)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const templates = await prisma.shiftTemplate.findMany({
      include: { location: true, user: true }
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data = templateSchema.parse(body);
    const created =[];

    if (!data.locationIds || data.locationIds.length === 0) throw new Error("Missing locations");
    if (!data.daysOfWeek || data.daysOfWeek.length === 0) throw new Error("Missing days");

    for (const locId of data.locationIds) {
      for (const day of data.daysOfWeek) {
        let dayInt: number;
        const parsedNum = parseInt(String(day), 10);
        
        if (!isNaN(parsedNum)) {
          dayInt = parsedNum;
        } else {
          dayInt =['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(String(day).toLowerCase().substring(0, 3));
        }
        
        if (dayInt < 0 || dayInt > 6) continue;
        
        const tpl = await prisma.shiftTemplate.create({
          data: {
            locationId: locId,
            dayOfWeek: dayInt,
            startTime: data.startTime,
            endTime: data.endTime,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            checklistTasks: data.checklistTasks ||[],
            userId: data.userId || null
          }
        });
        created.push(tpl);
      }
    }
    return NextResponse.json({ success: true, count: created.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid Template Data" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data = templateSchema.parse(body);
    
    if (!data.id) throw new Error("Template ID required for update");

    let dayInt: number | undefined = undefined;
    if (data.daysOfWeek && data.daysOfWeek.length > 0) {
      const day = data.daysOfWeek[0];
      const parsedNum = parseInt(String(day), 10);
      dayInt = !isNaN(parsedNum) ? parsedNum :['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(String(day).toLowerCase().substring(0, 3));
    }

    const updated = await prisma.shiftTemplate.update({
      where: { id: data.id },
      data: {
        ...(data.locationIds && data.locationIds.length > 0 && { locationId: data.locationIds[0] }),
        ...(dayInt !== undefined && dayInt >= 0 && dayInt <= 6 && { dayOfWeek: dayInt }),
        startTime: data.startTime,
        endTime: data.endTime,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        checklistTasks: data.checklistTasks ||[],
        userId: data.userId || null
      }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid Template Data" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    await prisma.shiftTemplate.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}