// filepath: app/api/giftcards/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/auth';

const redemptionSchema = z.object({
  redemptionAmount: z.coerce.number().positive()
});

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parsedId = parseInt(id);
    const body = await req.json();
    const { redemptionAmount } = redemptionSchema.parse(body);

    const card = await prisma.giftCard.findUnique({ where: { id: parsedId } });
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    // Precise decimal math to prevent floating point errors
    let newBalance = Math.round((card.remainingBalance - redemptionAmount) * 100) / 100;

    if (newBalance < 0) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: $${card.remainingBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    const updatedCard = await prisma.giftCard.update({
      where: { id: parsedId },
      data: { remainingBalance: newBalance },
      include: { 
        member: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json(updatedCard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}