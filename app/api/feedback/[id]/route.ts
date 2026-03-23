// filepath: app/api/feedback/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackUpdateEmail } from '@/lib/email';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const updateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN PROGRESS', 'COMPLETED']),
  devNotes: z.string().optional(),
});

// FIX: Stripped complex TypeScript params to bypass Turbopack AST parser crash
export async function PUT(req: Request, context: any) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);

    const body = await req.json();
    const data = updateFeedbackSchema.parse(body);

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status: data.status, devNotes: data.devNotes },
    });

    sendFeedbackUpdateEmail(updated).catch(console.error);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}