import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const dashboardSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  userIds: z.array(z.coerce.number()).optional(),
  locationIds: z.array(z.coerce.number()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, userIds, locationIds } = dashboardSchema.parse(body);

    // Creates absolute boundary dates to ignore timezone shifts
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 

    const whereClause: any = {
      clockIn: { gte: start, lte: end }
    };

    if (userIds && userIds.length > 0) {
      whereClause.userId = { in: userIds };
    }

    // NEW: Respect the location filter!
    if (locationIds && locationIds.length > 0) {
      whereClause.locationId = { in: locationIds };
    }

    const timeCards = await prisma.timeCard.findMany({
      where: whereClause,
      include: { location: true, user: true },
      orderBy: { clockIn: 'asc' }
    });

    return NextResponse.json({ timeCards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}