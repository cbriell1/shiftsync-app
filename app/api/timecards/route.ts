import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const timeCardSchema = z.object({
  id: z.number().optional(),
  userId: z.coerce.number(),
  locationId: z.coerce.number(),
  clockIn: z.string().datetime(),
  clockOut: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    const timeCards = await prisma.timeCard.findMany({
      include: { 
        user: true, 
        location: true, 
        checklists: true 
      },
      orderBy: { clockIn: 'desc' }
    });
    return NextResponse.json(timeCards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = timeCardSchema.parse(body);

    const tc = await prisma.timeCard.create({
      data: {
        userId: data.userId,
        locationId: data.locationId,
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
      }
    });
    return NextResponse.json(tc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = timeCardSchema.parse(body);

    if (!data.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const tc = await prisma.timeCard.update({
      where: { id: data.id },
      data: {
        userId: data.userId,
        locationId: data.locationId,
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
      }
    });
    return NextResponse.json(tc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const data = await req.json();
    const id = z.coerce.number().parse(data.id);
    
    // Safety: Delete children first
    await prisma.checklist.deleteMany({
      where: { timeCardId: id }
    });

    await prisma.timeCard.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}