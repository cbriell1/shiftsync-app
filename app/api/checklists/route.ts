// filepath: app/api/checklists/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const checklistSchema = z.object({
  id: z.coerce.number().optional(), 
  userId: z.coerce.number(),
  locationId: z.coerce.number(),
  timeCardId: z.coerce.number().nullable().optional(),
  notes: z.any().transform(v => v ? String(v) : ''),
  previousShiftNotes: z.any().transform(v => v ? String(v) : ''),
  completedTasks: z.array(z.string()).default([]),
  missedTasks: z.array(z.string()).default([]),
});

// FIX: Added (req: Request)
export async function GET(req: Request) {
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

    let finalChecklist;

    if (data.timeCardId) {
      const existing = await prisma.checklist.findFirst({
        where: { timeCardId: data.timeCardId }
      });

      if (existing) {
        finalChecklist = await prisma.checklist.update({
          where: { id: existing.id },
          data: {
            notes: data.notes,
            previousShiftNotes: data.previousShiftNotes,
            completedTasks: data.completedTasks,
            missedTasks: data.missedTasks
          }
        });
      }
    }

    if (!finalChecklist) {
      finalChecklist = await prisma.checklist.create({
        data: {
          userId: data.userId,
          locationId: data.locationId,
          timeCardId: data.timeCardId || null,
          notes: data.notes,
          previousShiftNotes: data.previousShiftNotes,
          completedTasks: data.completedTasks, 
          missedTasks: data.missedTasks        
        }
      });
    }

    return NextResponse.json(finalChecklist);
  } catch (error: any) {
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
        previousShiftNotes: data.previousShiftNotes,
        completedTasks: data.completedTasks,
        missedTasks: data.missedTasks
      }
    });

    return NextResponse.json(updatedChecklist);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}