// filepath: app/api/events/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userRoles = (session.user as any).systemRoles ||[];
  return (userRoles.includes('Administrator') || userRoles.includes('Manager')) ? Number(session.user.id) : null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const events = await prisma.event.findMany({ 
        include: { location: true },
        orderBy: { startDate: 'asc' }
    });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await req.json();
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate + "T00:00:00"),
        endDate: new Date(data.endDate + "T23:59:59"),
        type: data.type || 'TOURNAMENT',
        locationId: data.locationId ? Number(data.locationId) : null,
        impact: data.impact || 'NORMAL'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "TRANSACTION",
        details: `Created event: ${event.title}, Impact: ${event.impact}`
      }
    });

    return NextResponse.json(event);
  } catch (error: any) {
    await prisma.errorLog.create({
        data: { userId, message: error.message, stack: error.stack, path: "/api/events [POST]" }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await req.json();
    const updated = await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate + "T00:00:00"),
        endDate: new Date(data.endDate + "T23:59:59"),
        type: data.type || 'TOURNAMENT',
        locationId: data.locationId ? Number(data.locationId) : null,
        impact: data.impact || 'NORMAL'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "TRANSACTION",
        details: `Updated event #${data.id}: ${updated.title}`
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    await prisma.errorLog.create({
        data: { userId, message: error.message, stack: error.stack, path: "/api/events [PUT]" }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await req.json();
    const deleted = await prisma.event.delete({ where: { id: data.id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        details: `Deleted event: ${deleted.title}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await prisma.errorLog.create({
        data: { userId, message: error.message, stack: error.stack, path: "/api/events [DELETE]" }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}