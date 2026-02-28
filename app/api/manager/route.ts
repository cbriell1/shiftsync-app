import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const managerSchema = z.object({
  periods: z.array(z.object({
    start: z.string(),
    end: z.string()
  })),
  userIds: z.array(z.coerce.number()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { periods, userIds } = managerSchema.parse(body);

    const whereClause: any = {};

    if (userIds && userIds.length > 0) {
      whereClause.userId = { in: userIds };
    }

    if (periods && periods.length > 0) {
      const orConditions = periods.map(p => {
        const eDate = new Date(p.end);
        eDate.setHours(23, 59, 59, 999);
        return {
          clockIn: { gte: new Date(p.start), lte: eDate }
        };
      });
      whereClause.OR = orConditions;
    }

    const timeCards = await prisma.timeCard.findMany({
      where: whereClause,
      include: { user: true, location: true },
      orderBy: { clockIn: 'asc' }
    });

    return NextResponse.json(timeCards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}