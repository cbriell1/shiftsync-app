// filepath: app/api/audit/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch the last 200 logs (Administrators Only)
export async function GET(req: Request) {
  try {
    const session = await auth();
    // FIX: Restrict Audit logs completely to Administrators
    const isAdmin = (session?.user as any)?.systemRoles?.includes('Administrator') || session?.user?.email === 'cbriell1@yahoo.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: { 
        user: { select: { name: true, email: true } } 
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Keep payload lightweight
    });
    
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// POST: Save a new log entry
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;
    
    const body = await req.json();
    
    const log = await prisma.auditLog.create({
      data: {
        userId: userId,
        action: body.action || "SYSTEM_EVENT",
        details: body.details || "Unknown event"
      }
    });

    return NextResponse.json(log);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}