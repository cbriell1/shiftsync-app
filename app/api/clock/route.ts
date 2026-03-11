// filepath: app/api/clock/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const clockSchema = z.discriminatedUnion("action",[
  z.object({
    action: z.literal("CLOCK_IN"),
    userId: z.coerce.number(),
    locationId: z.coerce.number()
  }),
  z.object({
    action: z.literal("CLOCK_OUT"),
    timeCardId: z.coerce.number()
  })
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = clockSchema.parse(body);

    if (data.action === 'CLOCK_IN') {
      // Safety check: Ensure user isn't already clocked in
      const existing = await prisma.timeCard.findFirst({
        where: { userId: data.userId, clockOut: null }
      });
      if (existing) {
        return NextResponse.json({ error: "You are already clocked in!" }, { status: 400 });
      }

      const newCard = await prisma.timeCard.create({
        data: { userId: data.userId, locationId: data.locationId, clockIn: new Date() }
      });
      return NextResponse.json(newCard);
    }

    if (data.action === 'CLOCK_OUT') {
      const tc = await prisma.timeCard.findUnique({ where: { id: data.timeCardId } });
      if (!tc) return NextResponse.json({ error: "Timecard not found" }, { status: 404 });
      
      const clockOut = new Date();
      const diff = clockOut.getTime() - new Date(tc.clockIn).getTime();
      const hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));

      const updated = await prisma.timeCard.update({
        where: { id: data.timeCardId },
        data: { clockOut, totalHours: hours }
      });
      return NextResponse.json(updated);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}