// filepath: app/api/messages/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { senderId: userId ? parseInt(userId) : -1 },
          { targetUserIds: { has: userId ? parseInt(userId) : -1 } }
        ]
      },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("❌ GET /api/messages Error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch messages", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const message = await prisma.message.create({
      data: {
        content: body.content,
        senderId: Number(session.user?.id),
        isGlobal: body.isGlobal ?? true,
        targetUserIds: body.targetUserIds || [],
        targetLocationIds: body.targetLocationIds || []
      },
      include: { sender: true }
    });

    // 📧 Trigger Email Notifications for Managers
    try {
      const managersToNotify = await prisma.user.findMany({
        where: {
          systemRoles: { hasSome: ['Administrator', 'Manager'] },
          receiveChatEmails: true,
          id: { not: Number(session.user?.id) } // Don't email the sender
        },
        select: { email: true }
      });

      const recipientEmails = managersToNotify.map(m => m.email).filter(Boolean) as string[];
      
      if (recipientEmails.length > 0) {
        const { sendChatNotificationEmail } = require('@/lib/email');
        await sendChatNotificationEmail(message, message.sender, recipientEmails);
      }
    } catch (emailErr: any) {
      console.error("Chat email notification failed:", emailErr.message);
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("❌ POST /api/messages Error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to send message", details: error.message }, { status: 500 });
  }
}
