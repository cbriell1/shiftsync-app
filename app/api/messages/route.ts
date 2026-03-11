// filepath: app/api/messages/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const getQuerySchema = z.object({
  userId: z.coerce.number({ invalid_type_error: "Missing or invalid User ID" })
});

const postSchema = z.object({
  senderId: z.coerce.number(),
  content: z.string().min(1, "Message content is required"),
  isGlobal: z.boolean().optional().default(true),
  targetUserIds: z.array(z.coerce.number()).optional().default([]),
  targetLocationIds: z.array(z.coerce.number()).optional().default([])
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = getQuerySchema.parse({ userId: searchParams.get('userId') });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userLocs = user?.locationIds || [];

    const messages = await prisma.message.findMany({
      where: {
        OR:[
          { isGlobal: true },
          { senderId: userId },
          { targetUserIds: { has: userId } },
          { targetLocationIds: { hasSome: userLocs } }
        ]
      },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
      take: 500
    });
    
    return NextResponse.json(messages);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = postSchema.parse(body);

    const msg = await prisma.message.create({
      data: { 
        senderId: data.senderId, 
        content: data.content,
        isGlobal: data.isGlobal,
        targetUserIds: data.targetUserIds,
        targetLocationIds: data.targetLocationIds
      }
    });
    return NextResponse.json(msg);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}