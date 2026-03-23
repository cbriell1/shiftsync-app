// filepath: app/api/feedback/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackUpdateEmail } from '@/lib/email';
import { auth } from '@/auth';

const updateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN PROGRESS', 'COMPLETED']),
  devNotes: z.string().optional(),
});

export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const data = updateFeedbackSchema.parse(body);

    const updated = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data: { status: data.status, devNotes: data.devNotes },
    });

    // Trigger the email asynchronously
    sendFeedbackUpdateEmail(updated).catch(console.error);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}