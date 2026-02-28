import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const generateSchema = z.object({
  locationId: z.coerce.number().optional().nullable(),
  month: z.coerce.number().min(0).max(11),
  year: z.coerce.number().min(2024).max(2100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { locationId, month, year } = generateSchema.parse(body);

    // 1. Determine which locations we are generating for
    const targetLocations = locationId 
      ? await prisma.location.findMany({ where: { id: locationId } })
      : await prisma.location.findMany();

    const allTemplates = await prisma.shiftTemplate.findMany();
    
    // 2. Define the Pay Period (28th of previous month to 27th of current month)
    const periodStart = new Date(year, month - 1, 28);
    const periodEnd = new Date(year, month, 27, 23, 59, 59);
    
    let createdCount = 0;

    for (const loc of targetLocations) {
      const locTemplates = allTemplates.filter(t => t.locationId === loc.id);
      const currentDate = new Date(periodStart);

      while (currentDate <= periodEnd) {
        const currentDayOfWeek = currentDate.getDay();
        
        // Filter templates that apply to this specific day of the week
        const dailyTemplates = locTemplates.filter(t => t.dayOfWeek === currentDayOfWeek);
        
        for (const t of dailyTemplates) {
          const [sHour, sMin] = t.startTime.split(':').map(Number);
          const [eHour, eMin] = t.endTime.split(':').map(Number);

          const startTime = new Date(currentDate);
          startTime.setHours(sHour, sMin, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(eHour, eMin, 0, 0);

          // Avoid creating duplicates for the exact same time/location
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
      return NextResponse.json({ error: "Invalid month or year provided" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}