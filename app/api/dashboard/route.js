import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const data = await request.json();
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  end.setHours(23, 59, 59, 999); 

  const userIds = data.userIds; 

  const whereClause = {
    clockIn: { gte: start, lte: end }
  };

  if (userIds && userIds.length > 0) {
    whereClause.userId = { in: userIds };
  }

  // WE REMOVED THE LOCATION FILTER HERE! 
  // The frontend needs all the data so it can detect hidden floating hours.

  const timeCards = await prisma.timeCard.findMany({
    where: whereClause,
    include: { location: true, user: true },
    orderBy: { clockIn: 'asc' }
  });

  return NextResponse.json({ timeCards: timeCards });
}