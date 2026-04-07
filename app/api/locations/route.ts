// filepath: app/api/locations/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const createLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sendReportEmails: z.boolean().optional().default(true),
});

const updateLocationSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sendReportEmails: z.boolean().optional(),
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

    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' } 
    });
    return NextResponse.json(locations);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAccess())) {
      return NextResponse.json({ error: "Forbidden. Admin/Manager access required." }, { status: 403 });
    }

    const body = await request.json();
    const data = createLocationSchema.parse(body);

    const newLoc = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        isActive: data.isActive,
        sendReportEmails: data.sendReportEmails
      }
    });

    return NextResponse.json(newLoc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await verifyAccess())) {
      return NextResponse.json({ error: "Forbidden. Admin/Manager access required." }, { status: 403 });
    }

    const body = await request.json();
    const data = updateLocationSchema.parse(body);

    const updatedLoc = await prisma.location.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sendReportEmails !== undefined && { sendReportEmails: data.sendReportEmails }),
      }
    });

    return NextResponse.json(updatedLoc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}