// filepath: app/api/timecards/status/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  try {
    const { ids, status } = await req.json();
    await prisma.timeCard.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}