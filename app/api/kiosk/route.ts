import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const kioskSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CLOCK_IN"),
    userId: z.coerce.number(),
    locationId: z.coerce.number(),
    pinCode: z.string()
  }),
  z.object({
    action: z.literal("CLOCK_OUT"),
    timeCardId: z.coerce.number(),
    pinCode: z.string()
  })
]);

export async function GET() {
  const openCards = await prisma.timeCard.findMany({
    where: { clockOut: null },
    include: { user: true, location: true }
  });
  return NextResponse.json(openCards);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = kioskSchema.parse(body);

    if (data.action === 'CLOCK_IN') {
      const user = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      if ((user.pinCode || '1234') !== data.pinCode) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }

      const newCard = await prisma.timeCard.create({
        data: { userId: data.userId, locationId: data.locationId, clockIn: new Date() }
      });
      return NextResponse.json(newCard);
    }

    if (data.action === 'CLOCK_OUT') {
      const tc = await prisma.timeCard.findUnique({ 
        where: { id: data.timeCardId }, 
        include: { user: true } 
      });
      if (!tc || !tc.user) return NextResponse.json({ error: "Record not found" }, { status: 404 });

      if ((tc.user.pinCode || '1234') !== data.pinCode) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }
      
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}