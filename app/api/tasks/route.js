import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tasks = await prisma.globalTask.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(tasks);
}

export async function POST(request) {
  const { name } = await request.json();
  try {
    const newTask = await prisma.globalTask.create({ data: { name } });
    return NextResponse.json(newTask);
  } catch (error) {
    return NextResponse.json({ error: "Task already exists" }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { id } = await request.json();
  await prisma.globalTask.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}