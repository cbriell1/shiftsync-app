import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const locationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Location name is required"),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc' 
      }
    });
    return NextResponse.json(locations);
  } catch (error: any) {
    console.error("GET Locations Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations from database" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = locationSchema.parse(body);

    const newLoc = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return NextResponse.json(newLoc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = locationSchema.parse(body);

    if (!data.id) return NextResponse.json({ error: "Location ID required" }, { status: 400 });

    const updatedLoc = await prisma.location.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address !== undefined ? data.address : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined
      }
    });

    return NextResponse.json(updatedLoc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}