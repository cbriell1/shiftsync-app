import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Finds anyone who is currently clocked in (clockOut is blank!)
  const openCards = await prisma.timeCard.findMany({
    where: { clockOut: null },
    include: { user: true, location: true }
  });
  return NextResponse.json(openCards);
}

export async function POST(request) {
  const data = await request.json();
  const action = data.action;

  if (action === 'CLOCK_IN') {
    const newCard = await prisma.timeCard.create({
      data: {
        userId: parseInt(data.userId),
        locationId: parseInt(data.locationId),
        clockIn: new Date() // Stamps the exact current server time!
      }
    });
    return NextResponse.json(newCard);
  }

  if (action === 'CLOCK_OUT') {
    const timeCard = await prisma.timeCard.findUnique({ where: { id: parseInt(data.timeCardId) } });
    
    const clockOutTime = new Date(); // Stamps current time
    const msDiff = clockOutTime.getTime() - new Date(timeCard.clockIn).getTime();
    const totalHours = parseFloat((msDiff / (1000 * 60 * 60)).toFixed(2));

    const updatedCard = await prisma.timeCard.update({
      where: { id: parseInt(data.timeCardId) },
      data: {
        clockOut: clockOutTime,
        totalHours: totalHours
      }
    });
    return NextResponse.json(updatedCard);
  }

  return NextResponse.json({ error: "Invalid action" });
}