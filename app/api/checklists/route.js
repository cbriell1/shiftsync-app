import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lists = await prisma.checklist.findMany({
    include: { user: true, location: true, timeCard: true }, 
    orderBy: { date: 'desc' },
    take: 100
  });
  return NextResponse.json(lists);
}

export async function POST(request) {
  const data = await request.json();
  const newChecklist = await prisma.checklist.create({
    data: {
      userId: parseInt(data.userId),
      locationId: parseInt(data.locationId),
      timeCardId: data.timeCardId ? parseInt(data.timeCardId) : null,
      notes: data.notes || '',
      completedTasks: data.completedTasks || new Array(), 
      missedTasks: data.missedTasks || new Array()        
    }
  });
  return NextResponse.json(newChecklist);
}

// NEW: Allows editing an already submitted report!
export async function PUT(request) {
  const data = await request.json();
  const updatedChecklist = await prisma.checklist.update({
    where: { id: parseInt(data.id) },
    data: {
      notes: data.notes || '',
      completedTasks: data.completedTasks || new Array(),
      missedTasks: data.missedTasks || new Array()
    }
  });
  return NextResponse.json(updatedChecklist);
}