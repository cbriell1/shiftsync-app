// filepath: app/api/shifts/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const shiftActionSchema = z.object({
  shiftId: z.coerce.number(),
  // Safer transform: explicitly checks for null or empty strings before converting to Number
  userId: z.any().transform(v => (v === null || v === "") ? null : Number(v)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  action: z.enum(['CLAIM', 'UNCLAIM', 'REQUEST_COVER', 'CANCEL_COVER', 'UPDATE'])
});

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      include: { location: true, assignedTo: true },
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(shifts);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shiftId, userId, startTime, endTime, action } = shiftActionSchema.parse(body);

    let updateData: any = {};

    switch (action) {
      case 'UNCLAIM':
        updateData = { status: 'OPEN', userId: null };
        break;
      case 'REQUEST_COVER':
        updateData = { status: 'COVERAGE_REQUESTED' };
        break;
      case 'CANCEL_COVER':
        updateData = { status: 'CLAIMED' };
        break;
      case 'CLAIM':
        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
        updateData = { status: 'CLAIMED', userId };
        break;
      case 'UPDATE':
        if (userId !== undefined) {
          updateData.userId = userId;
          updateData.status = userId === null ? 'OPEN' : 'CLAIMED';
        }
        if (startTime) updateData.startTime = new Date(startTime);
        if (endTime) updateData.endTime = new Date(endTime);
        break;
    }

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}