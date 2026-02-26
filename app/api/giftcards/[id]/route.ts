import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { redemptionAmount } = await req.json();
    const id = parseInt(params.id);

    const card = await prisma.giftCard.findUnique({ where: { id } });
    
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const newBalance = card.remainingBalance - parseFloat(redemptionAmount);
    
    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const updatedCard = await prisma.giftCard.update({
      where: { id },
      data: { remainingBalance: newBalance },
      include: { 
        member: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("PUT GiftCard Error:", error);
    return NextResponse.json({ error: 'Failed to redeem gift card' }, { status: 500 });
  }
}