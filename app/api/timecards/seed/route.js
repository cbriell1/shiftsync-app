import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const actualWorkedData = new Array(
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
  );

  const loc = await prisma.location.findFirst({ where: { name: 'PnP Garner' } });
  const locationId = loc ? loc.id : 1;
  const users = await prisma.user.findMany();

  let processedCount = 0;

  for (const item of actualWorkedData) {
    // NEW: Bulletproof matching! Strips spaces and ignores capital letters.
    const matchedUser = users.find(u => u.name.trim().toLowerCase() === item.u.trim().toLowerCase());
    
    if (!matchedUser) continue;

    const clockInTime = new Date(item.yr, item.mo, item.dt, item.s, 0, 0, 0);
    const clockOutTime = new Date(item.yr, item.mo, item.dt, item.e, 0, 0, 0);
    
    const msDiff = clockOutTime.getTime() - clockInTime.getTime();
    const totalHours = parseFloat((msDiff / (1000 * 60 * 60)).toFixed(2));

    const existing = await prisma.timeCard.findFirst({
      where: { userId: matchedUser.id, clockIn: clockInTime, locationId: locationId }
    });

    if (!existing) {
      await prisma.timeCard.create({
        data: {
          userId: matchedUser.id,
          locationId: locationId,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          totalHours: totalHours
        }
      });
      processedCount++;
    }
  }

  return NextResponse.json({ message: "Timecards synced!", count: processedCount });
}