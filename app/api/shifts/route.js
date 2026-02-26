import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const shifts = await prisma.shift.findMany({
    include: { location: true, assignedTo: true },
    orderBy: { startTime: 'asc' }
  });
  return NextResponse.json(shifts);
}

export async function POST(request) {
  const body = await request.json();
  const { shiftId, userId, action } = body;

  if (action === 'UNCLAIM') {
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'OPEN', userId: null }
    });
    return NextResponse.json(updatedShift);
  } 

  // NEW: Handle Coverage Requests
  if (action === 'REQUEST_COVER') {
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'COVERAGE_REQUESTED' }
    });
    return NextResponse.json(updatedShift);
  }

  // NEW: Handle Cancelling a Coverage Request
  if (action === 'CANCEL_COVER') {
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'CLAIMED' }
    });
    return NextResponse.json(updatedShift);
  }
  
  // Otherwise, CLAIM the shift
  const updatedShift = await prisma.shift.update({
    where: { id: shiftId },
    data: { status: 'CLAIMED', userId: parseInt(userId) }
  });

  return NextResponse.json(updatedShift);
}