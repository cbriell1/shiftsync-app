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

    const userIdInt = userId ? parseInt(userId) : -1;
    const requestingUser = userId ? await prisma.user.findUnique({ where: { id: userIdInt }, select: { locationIds: true } }) : null;
    const userLocationIds = requestingUser?.locationIds ?? [];

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { senderId: userIdInt },
          { targetUserIds: { has: userIdInt } },
          ...(userLocationIds.length > 0 ? [{ targetLocationIds: { hasSome: userLocationIds } }] : [])
        ]
      },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take: 200
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
    const sessionUserId = Number(session.user?.id);

    // Allow admins to send as an impersonated profile (selectedUserId in the client)
    let senderId = sessionUserId;
    const requestedSenderId = body.senderId ? Number(body.senderId) : null;
    if (requestedSenderId && requestedSenderId !== sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { systemRoles: true }
      });
      if (sessionUser?.systemRoles?.includes('Administrator')) {
        senderId = requestedSenderId;
      }
    }

    const message = await prisma.message.create({
      data: {
        content: body.content,
        senderId,
        isGlobal: body.isGlobal ?? true,
        targetUserIds: body.targetUserIds || [],
        targetLocationIds: body.targetLocationIds || []
      },
      include: { sender: true }
    });

    // 📧 Trigger targeted email notifications
    try {
      let emailRecipients: string[] = [];

      if (message.isGlobal) {
        // Global messages → notify all managers/admins with chat emails on
        const managers = await prisma.user.findMany({
          where: {
            AND: [
              { systemRoles: { hasSome: ['Administrator', 'Manager'] } },
              { receiveChatEmails: true },
              { id: { not: senderId } }
            ]
          },
          select: { email: true }
        });
        emailRecipients = managers.map(m => m.email).filter(Boolean) as string[];
      } else if (message.targetUserIds && message.targetUserIds.length > 0) {
        // DM/group → notify only the actual recipients who have chat emails on
        const targets = await prisma.user.findMany({
          where: {
            AND: [
              { id: { in: message.targetUserIds } },
              { id: { not: senderId } },
              { receiveChatEmails: true }
            ]
          },
          select: { email: true }
        });
        emailRecipients = targets.map(t => t.email).filter(Boolean) as string[];
      }

      if (emailRecipients.length > 0) {
        const { sendChatNotificationEmail } = require('@/lib/email');
        await sendChatNotificationEmail(message, message.sender, emailRecipients);
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
