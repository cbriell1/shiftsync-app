// filepath: app/api/giftcards/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/auth'; // <-- Added Security

const issueCardSchema = z.object({
  code: z.string().min(3),
  amount: z.coerce.number().positive(),
  memberId: z.coerce.number().nullable().optional(),
  recipientName: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const giftCards = await prisma.giftCard.findMany({
      include: { 
        member: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { issuedAt: 'desc' },
    });
    return NextResponse.json(giftCards);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = issueCardSchema.parse(body);

    const newGiftCard = await prisma.giftCard.create({
      data: {
        code: data.code,
        initialAmount: data.amount,
        remainingBalance: data.amount,
        memberId: data.memberId || null,
        recipientName: data.memberId ? null : data.recipientName,
      },
      include: { 
        member: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json(newGiftCard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}