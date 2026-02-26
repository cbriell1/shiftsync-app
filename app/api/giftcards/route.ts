import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
    console.error("GET GiftCards Error:", error);
    return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, amount, memberId, recipientName } = body;

    const newGiftCard = await prisma.giftCard.create({
      data: {
        code,
        initialAmount: parseFloat(amount),
        remainingBalance: parseFloat(amount),
        memberId: memberId ? parseInt(memberId) : null,
        recipientName: memberId ? null : recipientName,
      },
      include: { 
        member: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(newGiftCard);
  } catch (error) {
    console.error("Gift Card POST Error:", error);
    return NextResponse.json({ error: 'Failed to issue gift card' }, { status: 500 });
  }
}