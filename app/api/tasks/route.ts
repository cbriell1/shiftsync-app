import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schemas
const createTaskSchema = z.object({
  name: z.string().min(2, "Task name must be at least 2 characters long").max(100),
});

const deleteTaskSchema = z.object({
  id: z.coerce.number(),
});

export async function GET() {
  try {
    const tasks = await prisma.globalTask.findMany({ 
      orderBy: { name: 'asc' } 
    });
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = createTaskSchema.parse(body);

    const newTask = await prisma.globalTask.create({ 
      data: { name: name.trim() } 
    });
    
    return NextResponse.json(newTask);
  } catch (error: any) {
    // Handle Prisma unique constraint error (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This task already exists" }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error creating task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = deleteTaskSchema.parse(body);

    await prisma.globalTask.delete({ 
      where: { id } 
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not delete task. It might still be linked to active templates." }, { status: 500 });
  }
}