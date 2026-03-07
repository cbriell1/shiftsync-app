import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Ultra-forgiving schema
const checklistSchema = z.object({
  id: z.coerce.number().optional(), 
  userId: z.coerce.number(),
  locationId: z.coerce.number(),
  timeCardId: z.coerce.number().nullable().optional(),
  // Transforms any null/undefined notes safely into a string
  notes: z.any().transform(v => v ? String(v) : ''),
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

    // PREVENT DUPLICATES: If a checklist already exists for this timecard, update it instead.
    if (data.timeCardId) {
      const existing = await prisma.checklist.findFirst({
        where: { timeCardId: data.timeCardId }
      });

      if (existing) {
        const updated = await prisma.checklist.update({
          where: { id: existing.id },
          data: {
            notes: data.notes,
            completedTasks: data.completedTasks,
            missedTasks: data.missedTasks
          }
        });
        return NextResponse.json(updated);
      }
    }

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
    console.error("Checklist POST Error:", error);
    return NextResponse.json({ error: "Failed to save checklist" }, { status: 500 });
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
    console.error("Checklist PUT Error:", error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}