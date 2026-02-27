import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use the curly braces for named export

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}