// filepath: app/api/users/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth'; 

export const dynamic = 'force-dynamic';

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
  receiveReportEmails: z.boolean().optional(),
});

const userMergeSchema = z.object({
  oldId: z.coerce.number(),
  newId: z.coerce.number(),
});

async function verifyManagementAccess() {
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

    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: "Database error fetching users.", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyManagementAccess())) return NextResponse.json({ error: "Forbidden. Management access required." }, { status: 403 });

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
        isActive: true,
        receiveReportEmails: true
      }
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await verifyManagementAccess())) return NextResponse.json({ error: "Forbidden. Management access required." }, { status: 403 });

    const body = await request.json();
    
    if (body.action === 'MERGE') {
      const { oldId, newId } = userMergeSchema.parse(body);
      await prisma.timeCard.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.shift.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.checklist.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.feedback.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.message.updateMany({ where: { senderId: oldId }, data: { senderId: newId } });
      await prisma.announcement.updateMany({ where: { authorId: oldId }, data: { authorId: newId } });
      await prisma.account.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.session.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.authenticator.updateMany({ where: { userId: oldId }, data: { userId: newId } });
      await prisma.user.delete({ where: { id: oldId } });
      return NextResponse.json({ success: true });
    }

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
        ...(data.receiveReportEmails !== undefined && { receiveReportEmails: data.receiveReportEmails }),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}