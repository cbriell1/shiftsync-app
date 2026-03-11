// filepath: app/api/announcements/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const getQuerySchema = z.object({
  userId: z.coerce.number({ invalid_type_error: "Missing or invalid User ID" })
});

const postSchema = z.object({
  authorId: z.coerce.number(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isGlobal: z.boolean().optional().default(true),
  targetLocationIds: z.array(z.coerce.number()).optional().default([])
});

const deleteSchema = z.object({
  id: z.coerce.number()
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = getQuerySchema.parse({ userId: searchParams.get('userId') });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userLocs = user?.locationIds ||[];

    const items = await prisma.announcement.findMany({
      where: {
        OR:[
          { isGlobal: true },
          { authorId: userId },
          { targetLocationIds: { hasSome: userLocs } }
        ]
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = postSchema.parse(body);

    const item = await prisma.announcement.create({
      data: { 
        authorId: data.authorId, 
        title: data.title, 
        content: data.content,
        isGlobal: data.isGlobal,
        targetLocationIds: data.targetLocationIds
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = deleteSchema.parse(body);
    
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}