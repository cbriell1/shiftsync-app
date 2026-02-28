import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN PROGRESS', 'COMPLETED']),
  devNotes: z.string().optional(),
});

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const data = updateFeedbackSchema.parse(body);

    const updated = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data: { status: data.status, devNotes: data.devNotes },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}