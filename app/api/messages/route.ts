import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    const parsedUserId = parseInt(userId);
    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
    const userLocs = user?.locationIds ||[];

    const messages = await prisma.message.findMany({
      where: {
        OR:[
          { isGlobal: true },
          { senderId: parsedUserId },
          { targetUserIds: { has: parsedUserId } },
          { targetLocationIds: { hasSome: userLocs } }
        ]
      },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
      take: 500
    });
    
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { senderId, content, isGlobal, targetUserIds, targetLocationIds } = await req.json();
    const msg = await prisma.message.create({
      data: { 
        senderId: parseInt(senderId), 
        content,
        isGlobal: isGlobal ?? true,
        targetUserIds: targetUserIds || [],
        targetLocationIds: targetLocationIds ||[]
      }
    });
    return NextResponse.json(msg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}