import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
  } catch (error) {
    console.error("GET Timecards Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const tc = await prisma.timeCard.create({
      data: {
        userId: parseInt(data.userId, 10),
        locationId: parseInt(data.locationId, 10),
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
      }
    });
    return NextResponse.json(tc);
  } catch (error) {
    console.error("POST Timecards Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const tc = await prisma.timeCard.update({
      where: { id: parseInt(data.id, 10) },
      data: {
        userId: parseInt(data.userId, 10),
        locationId: parseInt(data.locationId, 10),
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
      }
    });
    return NextResponse.json(tc);
  } catch (error) {
    console.error("PUT Timecards Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const data = await req.json();
    const id = parseInt(data.id, 10);
    
    // 1. Safely delete associated checklists (Shift Reports) first to prevent Database Crashes!
    await prisma.checklist.deleteMany({
      where: { timeCardId: id }
    });

    // 2. Now it is safe to delete the TimeCard
    await prisma.timeCard.delete({
      where: { id: id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Timecards Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}