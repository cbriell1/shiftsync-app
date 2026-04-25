// filepath: app/api/feedback/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackUpdateEmail, sendFeedbackCommentEmail } from '@/lib/email';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const updateFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN PROGRESS', 'COMPLETED']).optional(),
  devNotes: z.string().nullable().optional(),
  action: z.enum(['UPDATE_STATUS', 'ADD_COMMENT']).optional().default('UPDATE_STATUS'),
  commentContent: z.string().optional(),
  userId: z.coerce.number().optional(),
});

export async function PUT(req: Request, context: any) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });

    const body = await req.json();
    const data = updateFeedbackSchema.parse(body);

    if (data.action === 'ADD_COMMENT') {
      if (!data.commentContent || !data.userId) throw new Error("Comment content and user ID required");

      const newComment = await prisma.feedbackComment.create({
        data: {
          feedbackId: id,
          userId: data.userId,
          content: data.commentContent
        },
        include: { user: true, feedback: true }
      });

      sendFeedbackCommentEmail(newComment.feedback, data.commentContent, newComment.user).catch(console.error);
      return NextResponse.json(newComment);
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: { 
        status: data.status || 'OPEN', 
        devNotes: data.devNotes || "" 
      },
    });

    sendFeedbackUpdateEmail(updated).catch(console.error);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data: " + error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Database update failed' }, { status: 500 });
  }
}
