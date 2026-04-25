// filepath: app/api/templates/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const templates = await prisma.shiftTemplate.findMany({ include: { location: true, user: true } });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
