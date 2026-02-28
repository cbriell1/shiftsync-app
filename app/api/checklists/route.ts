import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for creating/updating checklists
const checklistSchema = z.object({
  id: z.number().optional(),
  userId: z.coerce.number(),
  locationId: z.coerce.number(),
  timeCardId: z.coerce.number().nullable().optional(),
  notes: z.string().default(''),
  completedTasks: z.array(z.string()).default([]),
  missedTasks: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const lists = await prisma.checklist.findMany({
      include: { user: true, location: true, timeCard: true }, 
      orderBy: { date: 'desc' },
      take: 100
    });
    return NextResponse.json(lists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checklistSchema.parse(body);

    const newChecklist = await prisma.checklist.create({
      data: {
        userId: data.userId,
        locationId: data.locationId,
        timeCardId: data.timeCardId || null,
        notes: data.notes,
        completedTasks: data.completedTasks, 
        missedTasks: data.missedTasks        
      }
    });
    return NextResponse.json(newChecklist);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = checklistSchema.parse(body);

    if (!data.id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updatedChecklist = await prisma.checklist.update({
      where: { id: data.id },
      data: {
        notes: data.notes,
        completedTasks: data.completedTasks,
        missedTasks: data.missedTasks
      }
    });
    return NextResponse.json(updatedChecklist);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}