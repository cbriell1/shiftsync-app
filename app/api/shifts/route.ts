import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const shiftActionSchema = z.object({
  shiftId: z.coerce.number(),
  userId: z.coerce.number().optional(),
  action: z.enum(['CLAIM', 'UNCLAIM', 'REQUEST_COVER', 'CANCEL_COVER'])
});

export async function GET() {
  const shifts = await prisma.shift.findMany({
    include: { location: true, assignedTo: true },
    orderBy: { startTime: 'asc' }
  });
  return NextResponse.json(shifts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shiftId, userId, action } = shiftActionSchema.parse(body);

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
    }

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}