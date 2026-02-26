import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();
  const periods = data.periods; 
  const userIds = data.userIds; 

  const whereClause = {};

  // Filter by selected Employees
  if (userIds && userIds.length > 0) {
    whereClause.userId = { in: userIds };
  }

  // NOTE: We intentionally removed the Location Database Filter here!
  // We want the frontend to see EVERYTHING so it can warn the manager 
  // if an employee worked at a location that is currently hidden.

  // Filter by ALL selected Pay Periods
  if (periods && periods.length > 0) {
    const orConditions = new Array();
    for (const p of periods) {
      const eDate = new Date(p.end);
      eDate.setHours(23, 59, 59, 999);
      orConditions.push({
        clockIn: { gte: new Date(p.start), lte: eDate }
      });
    }
    whereClause.OR = orConditions;
  }

  const timeCards = await prisma.timeCard.findMany({
    where: whereClause,
    include: { user: true, location: true },
    orderBy: { clockIn: 'asc' }
  });

  return NextResponse.json(timeCards);
}