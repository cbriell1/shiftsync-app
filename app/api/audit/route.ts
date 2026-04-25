// filepath: app/api/audit/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRoles = (session.user as any).systemRoles ||[];
    if (!userRoles.includes('Administrator')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'errors') {
      const errors = await prisma.errorLog.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return NextResponse.json(errors);
    }

    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("❌ GET /api/audit Error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch logs", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const log = await prisma.auditLog.create({
      data: {
        userId: Number(session.user?.id),
        action: body.action,
        details: body.details
      }
    });
    return NextResponse.json(log);
  } catch (error: any) {
    console.error("❌ POST /api/audit Error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to log", details: error.message }, { status: 500 });
  }
}
