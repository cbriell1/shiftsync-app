import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In Next.js 15+, params must be treated as a Promise
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    // 1. Await the params object (Required for Next 16)
    const params = await props.params;
    const id = parseInt(params.id);
    
    const { redemptionAmount } = await req.json();

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Card ID provided to server.' }, { status: 400 });
    }

    const card = await prisma.giftCard.findUnique({ where: { id } });
    
    if (!card) {
      return NextResponse.json({ error: 'Card not found in database.' }, { status: 404 });
    }

    const deduction = parseFloat(redemptionAmount);
    if (isNaN(deduction) || deduction <= 0) {
      return NextResponse.json({ error: 'Invalid deduction amount.' }, { status: 400 });
    }

    let newBalance = card.remainingBalance - deduction;
    
    // Round to exactly 2 decimal places
    newBalance = Math.round(newBalance * 100) / 100; 
    
    // Prevent floating point anomalies from causing false negatives (e.g. -0.00000001)
    if (newBalance < 0 && newBalance >= -0.01) {
      newBalance = 0;
    }

    if (newBalance < 0) {
      return NextResponse.json({ error: `Insufficient balance. Tried to deduct $${deduction.toFixed(2)} but only $${card.remainingBalance.toFixed(2)} is available.` }, { status: 400 });
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
  } catch (error: any) {
    console.error("PUT GiftCard Error:", error);
    return NextResponse.json({ error: error.message || 'Server crashed while processing redemption.' }, { status: 500 });
  }
}