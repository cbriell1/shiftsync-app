import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const members = await prisma.member.findMany({
    include: { usages: true },
    orderBy: { lastName: 'asc' }
  });
  return NextResponse.json(members);
}

export async function POST(request) {
  const data = await request.json();
  const newMember = await prisma.member.create({
    data: {
      lastName: data.lastName,
      firstName: data.firstName || '',
      location: data.location || '',
      notes: data.notes || '',
      family: data.family || '',
      renewalDate: data.renewalDate || '',
      totalPasses: parseInt(data.totalPasses) || 12
    }
  });
  return NextResponse.json(newMember);
}

export async function PUT(request) {
  const data = await request.json();

  if (data.action === 'LOG_BEVERAGE') {
    const updatedMember = await prisma.member.update({
      where: { id: parseInt(data.memberId) },
      data: { lastBeverageDate: new Date() } 
    });
    return NextResponse.json(updatedMember);
  }

  if (data.action === 'UPDATE_RENEWAL') {
    const updatedMember = await prisma.member.update({
      where: { id: parseInt(data.memberId) },
      data: { renewalDate: data.renewalDate }
    });
    return NextResponse.json(updatedMember);
  }

  // NEW: Update Total Passes & Notes!
  if (data.action === 'UPDATE_TOTAL_PASSES') {
    const updatedMember = await prisma.member.update({
      where: { id: parseInt(data.memberId) },
      data: { 
        totalPasses: parseInt(data.totalPasses),
        bonusNotes: data.bonusNotes || '' 
      }
    });
    return NextResponse.json(updatedMember);
  }

  const newUsage = await prisma.passUsage.create({
    data: {
      memberId: parseInt(data.memberId),
      dateUsed: data.dateUsed,
      amount: parseInt(data.amount),
      initials: data.initials
    }
  });
  return NextResponse.json(newUsage);
}