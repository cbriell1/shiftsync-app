// filepath: app/api/tasks/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

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

async function verifyAccess() {
  const session = await auth();
  if (!session?.user) return false;
  const userRoles = (session.user as any).systemRoles ||[];
  return userRoles.includes('Administrator') || userRoles.includes('Manager');
}

// FIX: Added (req: Request)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name } = createTaskSchema.parse(body);

    const newTask = await prisma.globalTask.create({ 
      data: { name: name.trim() } 
    });
    
    return NextResponse.json(newTask);
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "This task already exists" }, { status: 400 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error creating task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, name } = editTaskSchema.parse(body);
    const trimmedName = name.trim();

    const existingTask = await prisma.globalTask.findUnique({ where: { id } });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const updatedTask = await prisma.globalTask.update({
      where: { id },
      data: { name: trimmedName }
    });

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
    if (error.code === 'P2002') return NextResponse.json({ error: "A task with this name already exists" }, { status: 400 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error updating task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAccess())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id } = deleteTaskSchema.parse(body);

    await prisma.globalTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    return NextResponse.json({ error: "Could not delete task." }, { status: 500 });
  }
}