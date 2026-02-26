import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Safely parse a day input to an integer (0-6)
const parseDay = (dayInput) => {
  if (dayInput === null || dayInput === undefined) return 0;
  
  // If it's already a number or numeric string
  let dayInt = parseInt(dayInput, 10);
  if (!isNaN(dayInt) && dayInt >= 0 && dayInt <= 6) return dayInt;

  // If it's passed as a string word (e.g., "Mon")
  if (typeof dayInput === 'string') {
    const daysMap =['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const found = daysMap.findIndex(d => dayInput.toLowerCase().startsWith(d));
    if (found !== -1) return found;
  }
  
  return 0; // Default fallback to Sunday
};

// Ensure IDs are valid integers to prevent connection crashes
const parseId = (idInput) => {
  if (!idInput) return null;
  let idInt = parseInt(idInput, 10);
  return isNaN(idInt) ? null : idInt;
};

export async function GET() {
  try {
    const templates = await prisma.shiftTemplate.findMany({
      include: { 
        location: true, 
        user: true 
      }
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET Templates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      locationIds, 
      daysOfWeek, 
      startTime, 
      endTime, 
      startDate, 
      endDate, 
      checklistTasks, 
      userId 
    } = body;

    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return NextResponse.json({ error: "Missing locationIds" }, { status: 400 });
    }
    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ error: "Missing daysOfWeek" }, { status: 400 });
    }

    const created =[];
    
    // Safely enforce array type for Prisma
    const safeTasks = Array.isArray(checklistTasks) ? checklistTasks :[];

    // Loop through every location and day selected and create a template for each combination
    for (const locId of locationIds) {
      const safeLocId = parseId(locId);
      if (!safeLocId) continue;

      for (const day of daysOfWeek) {
        
        const data = {
          location: { connect: { id: safeLocId } },
          dayOfWeek: parseDay(day),
          startTime: startTime || "",
          endTime: endTime || "",
          checklistTasks: safeTasks,
        };

        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);
        
        if (userId && parseId(userId)) {
          data.user = { connect: { id: parseId(userId) } };
        }

        const tpl = await prisma.shiftTemplate.create({ data });
        created.push(tpl);
      }
    }

    return NextResponse.json({ success: true, count: created.length, created });
  } catch (error) {
    console.error("POST Templates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { 
      id, 
      locationIds, 
      daysOfWeek, 
      startTime, 
      endTime, 
      startDate, 
      endDate, 
      checklistTasks, 
      userId 
    } = body;

    const safeId = parseId(id);
    if (!safeId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const data = {
      startTime: startTime || "",
      endTime: endTime || "",
    };

    // Safely apply array updates
    if (Array.isArray(checklistTasks)) {
      data.checklistTasks = checklistTasks;
    }

    if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
      const safeLocId = parseId(locationIds[0]);
      if (safeLocId) {
        data.location = { connect: { id: safeLocId } };
      }
    }
    
    if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
      data.dayOfWeek = parseDay(daysOfWeek[0]);
    }

    if (startDate) data.startDate = new Date(startDate);
    else data.startDate = null; 

    if (endDate) data.endDate = new Date(endDate);
    else data.endDate = null;

    if (userId && parseId(userId)) {
      data.user = { connect: { id: parseId(userId) } };
    } else {
      data.user = { disconnect: true };
    }

    const updated = await prisma.shiftTemplate.update({
      where: { id: safeId },
      data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Templates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const safeId = parseId(body.id);
    if (!safeId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.shiftTemplate.delete({ 
      where: { id: safeId } 
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Templates Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}