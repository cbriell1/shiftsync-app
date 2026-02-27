import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(feedbacks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newFeedback = await prisma.feedback.create({
      data: {
        userId: Number(body.userId),
        type: body.type,
        description: body.description,
        status: 'OPEN',
      },
    });
    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}