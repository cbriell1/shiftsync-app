import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("GET Feedback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, type, description } = await req.json();

    if (!userId || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        user: { connect: { id: parseInt(userId, 10) } },
        type,
        description
      },
      include: { user: true }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("POST Feedback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status, developerNotes, devNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    // Map frontend 'developerNotes' to database 'devNotes'
    const finalNotes = developerNotes !== undefined ? developerNotes : devNotes;

    const updated = await prisma.feedback.update({
      where: { id: parseInt(id, 10) },
      data: { 
        status: status, 
        devNotes: finalNotes 
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Feedback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}