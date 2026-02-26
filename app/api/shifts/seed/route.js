import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json().catch(() => ({}));
  const reqLocationId = data.locationId ? parseInt(data.locationId) : null;
  const targetMonth = data.month !== undefined ? parseInt(data.month) : new Date().getMonth();
  const targetYear = data.year !== undefined ? parseInt(data.year) : new Date().getFullYear();

  let targetLocations = new Array();
  if (reqLocationId) {
    targetLocations = await prisma.location.findMany({ where: { id: reqLocationId } });
  } else {
    targetLocations = await prisma.location.findMany();
  }

  const allTemplates = await prisma.shiftTemplate.findMany();
  const periodStart = new Date(targetYear, targetMonth - 1, 28);
  const periodEnd = new Date(targetYear, targetMonth, 27);
  let createdCount = 0;

  for (const loc of targetLocations) {
    const locTemplates = allTemplates.filter(t => t.locationId === loc.id);
    let currentDate = new Date(periodStart);

    while (currentDate <= periodEnd) {
      const currentDayOfWeek = currentDate.getDay();
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = yyyy + '-' + mm + '-' + dd;
      
      const dailyTemplates = locTemplates.filter(t => {
        if (t.dayOfWeek !== currentDayOfWeek) return false;
        if (t.startDate && dateStr < t.startDate) return false;
        if (t.endDate && dateStr > t.endDate) return false;
        return true;
      });
      
      for (const t of dailyTemplates) {
        const sParts = t.startTime.split(':');
        const eParts = t.endTime.split(':');
        const startTime = new Date(currentDate);
        startTime.setHours(parseInt(sParts.at(0)), parseInt(sParts.at(1)), 0, 0);
        const endTime = new Date(currentDate);
        endTime.setHours(parseInt(eParts.at(0)), parseInt(eParts.at(1)), 0, 0);

        const existingShift = await prisma.shift.findFirst({
          where: { locationId: loc.id, startTime: startTime, endTime: endTime }
        });

        if (!existingShift) {
          await prisma.shift.create({
            data: { 
              locationId: loc.id, 
              startTime: startTime, 
              endTime: endTime, 
              // NEW: If a user was pre-assigned to the template, automatically assign them to the shift!
              status: t.userId ? 'CLAIMED' : 'OPEN',
              userId: t.userId || null
            }
          });
          createdCount++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  return NextResponse.json({ message: "Monthly schedule synced!", count: createdCount });
}