import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const templateSchema = z.object({
  id: z.number().optional(),
  locationIds: z.array(z.coerce.number()).optional(),
  daysOfWeek: z.array(z.union([z.string(), z.number()])).optional(),
  startTime: z.string(),
  endTime: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  checklistTasks: z.array(z.string()).default([]),
  userId: z.coerce.number().nullable().optional(),
});

export async function GET() {
  const templates = await prisma.shiftTemplate.findMany({
    include: { location: true, user: true }
  });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = templateSchema.parse(body);
    const created = [];

    if (!data.locationIds || !data.daysOfWeek) throw new Error("Missing locations or days");

    for (const locId of data.locationIds) {
      for (const day of data.daysOfWeek) {
        // Convert day name to 0-6 if necessary
        const dayInt = typeof day === 'number' ? day : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day.toLowerCase().substring(0, 3));
        
        const tpl = await prisma.shiftTemplate.create({
          data: {
            locationId: locId,
            dayOfWeek: dayInt,
            startTime: data.startTime,
            endTime: data.endTime,
            startDate: data.startDate,
            endDate: data.endDate,
            checklistTasks: data.checklistTasks,
            userId: data.userId || null
          }
        });
        created.push(tpl);
      }
    }
    return NextResponse.json({ success: true, count: created.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = templateSchema.parse(body);
    if (!data.id) throw new Error("ID required");

    const updated = await prisma.shiftTemplate.update({
      where: { id: data.id },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
        startDate: data.startDate,
        endDate: data.endDate,
        checklistTasks: data.checklistTasks,
        userId: data.userId || null
      }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.shiftTemplate.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}