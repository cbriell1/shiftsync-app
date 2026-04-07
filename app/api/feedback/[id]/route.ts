// filepath: app/api/feedback/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackUpdateEmail } from '@/lib/email';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// FIX: Made validation highly permissive to prevent rejection
const updateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN PROGRESS', 'COMPLETED']),
  devNotes: z.string().nullable().optional(),
});

export async function PUT(req: Request, context: any) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const body = await req.json();
    const data = updateFeedbackSchema.parse(body);

    const updated = await prisma.feedback.update({
      where: { id },
      data: { 
        status: data.status, 
        devNotes: data.devNotes || "" 
      },
    });

    sendFeedbackUpdateEmail(updated).catch(console.error);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("FEEDBACK PUT ERROR:", error);
    
    // FIX: Extract the exact Zod validation error if it fails
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data: " + error.issues[0].message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Database update failed' }, { status: 500 });
  }
}