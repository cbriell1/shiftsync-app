// filepath: app/api/users/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const userCreateSchema = z.object({
  name: z.string().min(1),
  pinCode: z.string().nullable().optional(),
  courtReserveId: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  emailAddress: z.string().nullable().optional(),
});

const userUpdateSchema = z.object({
  id: z.coerce.number(),
  roles: z.array(z.string()).optional(),
  locationIds: z.array(z.coerce.number()).optional(),
  pinCode: z.string().nullable().optional(),
  courtReserveId: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  emailAddress: z.string().nullable().optional(),
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = userCreateSchema.parse(body);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        pinCode: data.pinCode || null,
        courtReserveId: data.courtReserveId || null,
        phoneNumber: data.phoneNumber || null,
        emailAddress: data.emailAddress || null,
        role: 'EMPLOYEE',
        systemRoles: ['Front Desk'],
        locationIds:[] 
      }
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = userUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.roles && { systemRoles: data.roles }),
        ...(data.locationIds && { locationIds: data.locationIds }), 
        ...(data.pinCode !== undefined && { pinCode: data.pinCode }),
        ...(data.courtReserveId !== undefined && { courtReserveId: data.courtReserveId }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.emailAddress !== undefined && { emailAddress: data.emailAddress }),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}