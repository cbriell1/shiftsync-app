import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Delete all generated shifts on the calendar
    const deletedShifts = await prisma.shift.deleteMany({});
    
    // 2. Delete all templates from the Shift Setup tab
    const deletedTemplates = await prisma.shiftTemplate.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: "Calendar and Templates completely wiped!",
      shiftsDeleted: deletedShifts.count,
      templatesDeleted: deletedTemplates.count
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}