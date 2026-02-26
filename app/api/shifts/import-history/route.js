import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Your exact provided data, mapped to Year (yr), Month (mo - note: Jan is 0, Dec is 11 in JS), Date (dt), Start Time (s), End Time (e), and User (u).
  const historicalData = new Array(
    { yr: 2025, mo: 10, dt: 28, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 10, dt: 28, s: 15, e: 21, u: 'Fred Jimenez' },
    { yr: 2025, mo: 10, dt: 29, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2025, mo: 10, dt: 29, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2025, mo: 10, dt: 30, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2025, mo: 10, dt: 30, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 1, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 1, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 2, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 2, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2025, mo: 11, dt: 3, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 3, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 4, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 4, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 5, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 5, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 6, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 6, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2025, mo: 11, dt: 7, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2025, mo: 11, dt: 7, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 8, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 8, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 9, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 9, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2025, mo: 11, dt: 10, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 10, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 11, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 11, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2025, mo: 11, dt: 12, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 12, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 13, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 13, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2025, mo: 11, dt: 14, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2025, mo: 11, dt: 14, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 15, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 15, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 16, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 16, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2025, mo: 11, dt: 17, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 17, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 18, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 18, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2025, mo: 11, dt: 19, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 19, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 20, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 20, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2025, mo: 11, dt: 21, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2025, mo: 11, dt: 21, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 22, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 22, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 23, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 23, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2025, mo: 11, dt: 26, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 26, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 27, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2025, mo: 11, dt: 27, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2025, mo: 11, dt: 28, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2025, mo: 11, dt: 28, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2025, mo: 11, dt: 29, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 29, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2025, mo: 11, dt: 30, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 30, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2025, mo: 11, dt: 31, s: 9, e: 15, u: '' },
    { yr: 2025, mo: 11, dt: 31, s: 16, e: 21, u: 'Eric Gilbert' },
    { yr: 2026, mo: 0, dt: 1, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 1, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2026, mo: 0, dt: 2, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 2, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 3, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 3, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 0, dt: 4, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2026, mo: 0, dt: 4, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 5, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 5, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2026, mo: 0, dt: 6, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 6, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2026, mo: 0, dt: 7, s: 9, e: 15, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 8, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 8, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2026, mo: 0, dt: 9, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 9, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 10, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 10, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 0, dt: 11, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2026, mo: 0, dt: 11, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 12, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 12, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2026, mo: 0, dt: 13, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 13, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2026, mo: 0, dt: 14, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 14, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 15, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 15, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2026, mo: 0, dt: 16, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 16, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 17, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 17, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 0, dt: 18, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2026, mo: 0, dt: 18, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 19, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 19, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2026, mo: 0, dt: 20, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 20, s: 15, e: 21, u: 'Eric Gilbert' },
    { yr: 2026, mo: 0, dt: 21, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 21, s: 16, e: 21, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 22, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 22, s: 15, e: 21, u: 'Neal Lagatta' },
    { yr: 2026, mo: 0, dt: 23, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 23, s: 15, e: 21, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 24, s: 9, e: 14, u: 'Chris Briell' },
    { yr: 2026, mo: 0, dt: 24, s: 14, e: 18, u: 'Colin Amatucci' },
    { yr: 2026, mo: 0, dt: 25, s: 8, e: 12, u: 'Sophia Kim' },
    { yr: 2026, mo: 0, dt: 25, s: 12, e: 16, u: 'Fred Jimenez' },
    { yr: 2026, mo: 0, dt: 26, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 26, s: 15, e: 21, u: 'Pam Gilbert' },
    { yr: 2026, mo: 0, dt: 27, s: 9, e: 15, u: '' },
    { yr: 2026, mo: 0, dt: 27, s: 15, e: 21, u: 'Eric Gilbert' }
  );

  // Force this to PnP Garner
  const loc = await prisma.location.findFirst({ where: { name: 'PnP Garner' } });
  const locationId = loc ? loc.id : 1;
  const users = await prisma.user.findMany();

  let processedCount = 0;

  for (const item of historicalData) {
    // Generate precise Date objects
    const start = new Date(item.yr, item.mo, item.dt, item.s, 0, 0, 0);
    const end = new Date(item.yr, item.mo, item.dt, item.e, 0, 0, 0);
    
    let assignedUserId = null;
    let shiftStatus = 'OPEN';

    // If an employee name was provided, map it to their ID!
    if (item.u !== '') {
      const matchedUser = users.find(u => u.name === item.u);
      if (matchedUser) {
        assignedUserId = matchedUser.id;
        shiftStatus = 'CLAIMED';
      }
    }

    // Check if a shift already exists for this exact time and location
    const existingShift = await prisma.shift.findFirst({
      where: { locationId: locationId, startTime: start, endTime: end }
    });

    if (existingShift) {
      // If it exists (e.g. from Auto-Generate), UPDATE it with the assigned employee
      await prisma.shift.update({
        where: { id: existingShift.id },
        data: { userId: assignedUserId, status: shiftStatus }
      });
    } else {
      // If it doesn't exist, CREATE it
      await prisma.shift.create({
        data: { locationId: locationId, startTime: start, endTime: end, userId: assignedUserId, status: shiftStatus }
      });
    }
    processedCount++;
  }

  return NextResponse.json({ message: "History synced successfully!", count: processedCount });
}