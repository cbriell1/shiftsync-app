import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const userCreateSchema = z.object({
  name: z.string().min(1),
  pinCode: z.string().nullable().optional(),
  courtReserveId: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const userUpdateSchema = z.object({
  id: z.coerce.number(),
  roles: z.array(z.string()).optional(),
  locationIds: z.array(z.coerce.number()).optional(),
  pinCode: z.string().nullable().optional(),
  courtReserveId: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const userMergeSchema = z.object({
  oldId: z.coerce.number(),
  newId: z.coerce.number(),
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
        email: data.email || null,
        role: 'EMPLOYEE',
        systemRoles: ['Front Desk'],
        locationIds:[],
        isActive: true
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
    
    // Check if this is a MERGE request instead of a standard update
    if (body.action === 'MERGE') {
      const { oldId, newId } = userMergeSchema.parse(body);

      // 1. Move all historical data to the "New" (or primary) account
      await prisma.timeCard.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.shift.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.checklist.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.feedback.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.message.updateMany({ where: { senderId: oldId }, data: { senderId: newId } });
      await prisma.announcement.updateMany({ where: { authorId: oldId }, data: { authorId: newId } });
      
      // Move any passkeys / login methods
      await prisma.account.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.session.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.authenticator.updateMany({ where: { userId: oldId }, data: { userId: newId } });

      // 2. Delete the old ghost account
      await prisma.user.delete({ where: { id: oldId } });
      
      return NextResponse.json({ success: true });
    }

    // Otherwise, perform standard update
    const data = userUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.roles && { systemRoles: data.roles }),
        ...(data.locationIds && { locationIds: data.locationIds }), 
        ...(data.pinCode !== undefined && { pinCode: data.pinCode }),
        ...(data.courtReserveId !== undefined && { courtReserveId: data.courtReserveId }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}