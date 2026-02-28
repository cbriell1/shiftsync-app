import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc' // Keeps location dropdowns alphabetically sorted globally
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