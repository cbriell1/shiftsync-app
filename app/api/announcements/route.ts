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

    const items = await prisma.announcement.findMany({
      where: {
        OR:[
          { isGlobal: true },
          { authorId: parsedUserId },
          { targetLocationIds: { hasSome: userLocs } }
        ]
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorId, title, content, isGlobal, targetLocationIds } = await req.json();
    const item = await prisma.announcement.create({
      data: { 
        authorId: parseInt(authorId), 
        title, 
        content,
        isGlobal: isGlobal ?? true,
        targetLocationIds: targetLocationIds ||[]
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.announcement.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}