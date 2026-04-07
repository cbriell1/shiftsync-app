// filepath: app/api/shifts/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth'; 

export const dynamic = 'force-dynamic';

const shiftActionSchema = z.object({
  shiftId: z.coerce.number(),
  userId: z.any().transform(v => (v === null || v === "") ? null : Number(v)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  action: z.enum(['CLAIM', 'UNCLAIM', 'REQUEST_COVER', 'CANCEL_COVER', 'UPDATE'])
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shifts = await prisma.shift.findMany({
      include: { location: true, assignedTo: true },
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(shifts);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { shiftId, userId, startTime, endTime, action } = shiftActionSchema.parse(body);

    let updateData: any = {};

    if (action === 'UPDATE') {
      const userRoles = (session.user as any).systemRoles ||[];
      const isManagement = userRoles.includes('Administrator') || userRoles.includes('Manager');
      if (!isManagement) {
        return NextResponse.json({ error: "Forbidden. Only managers can update shift times." }, { status: 403 });
      }
    }

    switch (action) {
      case 'UNCLAIM':
        updateData = { status: 'OPEN', userId: null };
        break;
      case 'REQUEST_COVER':
        updateData = { status: 'COVERAGE_REQUESTED' };
        break;
      case 'CANCEL_COVER':
        updateData = { status: 'CLAIMED' };
        break;
      case 'CLAIM':
        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
        updateData = { status: 'CLAIMED', userId };
        break;
      case 'UPDATE':
        if (userId !== undefined) {
          updateData.userId = userId;
          updateData.status = userId === null ? 'OPEN' : 'CLAIMED';
        }
        if (startTime) updateData.startTime = new Date(startTime);
        if (endTime) updateData.endTime = new Date(endTime);
        break;
    }

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// NEW: DELETE handler for single and bulk shift removal
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRoles = (session.user as any).systemRoles ||[];
    const isManagement = userRoles.includes('Administrator') || userRoles.includes('Manager');
    
    if (!isManagement) {
      return NextResponse.json({ error: "Forbidden. Only managers can delete shifts." }, { status: 403 });
    }

    const body = await request.json();

    // Single Shift Deletion
    if (body.shiftId) {
      await prisma.shift.delete({
        where: { id: parseInt(body.shiftId) }
      });
      return NextResponse.json({ success: true, count: 1 });
    } 
    // Bulk Shift Deletion
    else if (body.startDate && body.endDate) {
      const whereClause: any = {
        startTime: { gte: new Date(body.startDate) },
        endTime: { lte: new Date(body.endDate) }
      };
      
      if (body.locationId) {
        whereClause.locationId = parseInt(body.locationId);
      }

      const result = await prisma.shift.deleteMany({
        where: whereClause
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}