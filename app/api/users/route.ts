import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const userUpdateSchema = z.object({
  id: z.coerce.number(),
  roles: z.array(z.string()).optional(),
  locationIds: z.array(z.coerce.number()).optional(),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, roles, locationIds } = userUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(roles && { systemRoles: roles }),
        ...(locationIds && { locationIds: locationIds }), 
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}