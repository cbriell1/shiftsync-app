// filepath: app/api/shifts/seed/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const generateSchema = z.object({
  locationId: z.coerce.number().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRoles = (session.user as any).systemRoles ||[];
    const isManager = userRoles.includes('Administrator') || userRoles.includes('Manager');
    
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden. Managers only." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { locationId, startDate, endDate } = generateSchema.parse(body);

    const targetLocations = locationId 
      ? await prisma.location.findMany({ where: { id: locationId } })
      : await prisma.location.findMany();

    const allTemplates = await prisma.shiftTemplate.findMany();
    
    // Convert to strict boundaries
    const periodStart = new Date(startDate);
    periodStart.setHours(0, 0, 0, 0); 
    
    const periodEnd = new Date(endDate);
    periodEnd.setHours(23, 59, 59, 999);
    
    let createdCount = 0;

    for (const loc of targetLocations) {
      const locTemplates = allTemplates.filter(t => t.locationId === loc.id);
      const currentDate = new Date(periodStart);

      while (currentDate <= periodEnd) {
        const currentDayOfWeek = currentDate.getDay();
        const currentStr = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Filter templates that match the day of week AND fall within the template's active dates
        const dailyTemplates = locTemplates.filter(t => {
          if (t.dayOfWeek !== currentDayOfWeek) return false;
          
          const afterStart = !t.startDate || t.startDate <= currentStr;
          const beforeEnd = !t.endDate || t.endDate >= currentStr;
          
          return afterStart && beforeEnd;
        });
        
        for (const t of dailyTemplates) {
          const[sHour, sMin] = t.startTime.split(':').map(Number);
          const[eHour, eMin] = t.endTime.split(':').map(Number);

          const startTime = new Date(currentDate);
          startTime.setHours(sHour, sMin, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(eHour, eMin, 0, 0);

          // Fix for overnight shifts (e.g., 10 PM to 2 AM)
          if (endTime <= startTime) {
             endTime.setDate(endTime.getDate() + 1);
          }

          const existingShift = await prisma.shift.findFirst({
            where: { 
              locationId: loc.id, 
              startTime: startTime, 
              endTime: endTime 
            }
          });

          if (!existingShift) {
            await prisma.shift.create({
              data: { 
                locationId: loc.id, 
                startTime: startTime, 
                endTime: endTime, 
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

    return NextResponse.json({ 
      message: "Schedule generated successfully", 
      count: createdCount 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid dates provided" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}