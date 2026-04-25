// filepath: app/api/shifts/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; 

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shifts = await prisma.shift.findMany({
      include: { location: true, assignedTo: true },
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(shifts);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}
