import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackSchema = z.object({
  userId: z.coerce.number(),
  type: z.enum(['BUG', 'SUGGESTION']),
  description: z.string().min(5),
});

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);
    const newFeedback = await prisma.feedback.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description,
        status: 'OPEN',
      },
    });
    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}