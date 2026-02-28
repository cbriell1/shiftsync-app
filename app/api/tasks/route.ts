// filepath: app/api/tasks/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schemas
const createTaskSchema = z.object({
  name: z.string().min(2, "Task name must be at least 2 characters long").max(100),
});

const editTaskSchema = z.object({
  id: z.coerce.number(),
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = editTaskSchema.parse(body);
    const trimmedName = name.trim();

    // Find the old task name first so we can cascade the update
    const existingTask = await prisma.globalTask.findUnique({ where: { id } });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Update the master task
    const updatedTask = await prisma.globalTask.update({
      where: { id },
      data: { name: trimmedName }
    });

    // Cascading update: Find any template using the old task name and replace it with the new one
    if (existingTask.name !== trimmedName) {
      const templates = await prisma.shiftTemplate.findMany();
      for (const tpl of templates) {
        if (tpl.checklistTasks.includes(existingTask.name)) {
          const updatedTasks = tpl.checklistTasks.map(t => t === existingTask.name ? trimmedName : t);
          await prisma.shiftTemplate.update({
            where: { id: tpl.id },
            data: { checklistTasks: updatedTasks }
          });
        }
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A task with this name already exists" }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error updating task" }, { status: 500 });
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