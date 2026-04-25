import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || session.user.id.toString();

  try {
    const [
      users, locations, globalTasks, templates, events,
      shifts, members, checklists, giftCards, feedbacks,
      messages, announcements, timeCards
    ] = await Promise.all([
      prisma.user.findMany({ where: { isActive: true } }),
      prisma.location.findMany({ where: { isActive: true } }),
      prisma.globalTask.findMany(),
      prisma.shiftTemplate.findMany(),
      prisma.event.findMany(),
      prisma.shift.findMany({ where: { startTime: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } }),
      prisma.member.findMany({ take: 100 }),
      prisma.checklist.findMany({ take: 30, orderBy: { date: 'desc' } }),
      prisma.giftCard.findMany({ take: 50 }),
      prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.timeCard.findMany({ where: { userId: Number(userId) }, orderBy: { clockIn: 'desc' }, take: 50 })
    ]);

    return NextResponse.json({
      users, locations, globalTasks, templates, events,
      shifts, members, checklists, giftCards, feedbacks,
      messages, announcements, timeCards
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
