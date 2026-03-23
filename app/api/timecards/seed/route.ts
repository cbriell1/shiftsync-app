// filepath: app/api/timecards/seed/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// FIX: Stop Turbopack from pre-rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const actualWorkedData =[
    { yr: 2026, mo: 0, dt: 28, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 30, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 31, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 4, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2026, mo: 1, dt: 6, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 7, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 7, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 1, dt: 8, s: 8, e: 12, u: 'Colin Amatucci' },
    { yr: 2026, mo: 1, dt: 8, s: 12, e: 17, u: 'Colin Amatucci' }, 
    { yr: 2026, mo: 1, dt: 13, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 14, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 14, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 1, dt: 15, s: 8, e: 13, u: 'Colin Amatucci' }, 
    { yr: 2026, mo: 1, dt: 20, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 21, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 1, dt: 21, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 1, dt: 22, s: 8, e: 12, u: 'Sophia Kim' }
  ];

  try {
    let loc = await prisma.location.findFirst({ where: { name: 'PnP Garner' } });
    if (!loc) {
      loc = await prisma.location.create({ data: { name: 'PnP Garner' } });
    }

    let users = await prisma.user.findMany();
    let importedCount = 0;
    let existedCount = 0;

    for (const item of actualWorkedData) {
      let matchedUser = users.find(u => u.name.trim().toLowerCase() === item.u.trim().toLowerCase());
      
      if (!matchedUser) {
        matchedUser = await prisma.user.create({
          data: {
            name: item.u,
            role: 'EMPLOYEE',
            systemRoles:['Front Desk'],
            locationIds: [loc.id]
          }
        });
        users.push(matchedUser); 
      }

      const clockInTime = new Date(item.yr, item.mo, item.dt, item.s, 0, 0, 0);
      const clockOutTime = new Date(item.yr, item.mo, item.dt, item.e, 0, 0, 0);
      
      const msDiff = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = parseFloat((msDiff / (1000 * 60 * 60)).toFixed(2));

      const existing = await prisma.timeCard.findFirst({
        where: { 
          userId: matchedUser.id, 
          clockIn: clockInTime 
        }
      });

      if (!existing) {
        await prisma.timeCard.create({
          data: {
            userId: matchedUser.id,
            locationId: loc.id,
            clockIn: clockInTime,
            clockOut: clockOutTime,
            totalHours: totalHours
          }
        });
        importedCount++;
      } else {
        existedCount++;
      }
    }

    return NextResponse.json({ 
      count: `${importedCount} newly imported. (${existedCount} skipped because they were already in the database.)` 
    });

  } catch (error: any) {
    return NextResponse.json({ count: `Error: ${error.message}` }, { status: 500 });
  }
}